import asyncio
import os
import pickle
import warnings
from contextlib import asynccontextmanager
from typing import Optional, List
import uuid
import re
import pandas as pd

import httpx
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────
# Global state: model & preprocessors
# ──────────────────────────────────────────────
state: dict = {}

CUSTOM_OBJECTS: dict = {}   # diisi saat startup (perlu TF)

# ──────────────────────────────────────────────
# Config — env vars
# ──────────────────────────────────────────────
MODEL_PATH         = os.getenv("MODEL_PATH",         "sppg_model.keras")
SCALER_PATH        = os.getenv("SCALER_PATH",        "scaler.pkl")
LE_PATH            = os.getenv("LE_PATH",            "le_prov.pkl")
YLOGMAX_PATH       = os.getenv("YLOGMAX_PATH",       "y_log_max.pkl")
DATA_PATH          = os.getenv("DATA_PATH",          "df_final.csv")   
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
OPENROUTER_URL     = "https://openrouter.ai/api/v1/chat/completions"

# In-memory chat session storage (reset saat server restart)
chat_sessions: dict = {}

SPPG_SYSTEM_PROMPT = """Kamu adalah asisten AI untuk aplikasi SPPG Predictor.
 
ATURAN WAJIB — TIDAK BOLEH DILANGGAR:
1. SELALU jawab dalam Bahasa Indonesia. Dilarang keras menggunakan bahasa Inggris dalam bentuk apapun.
2. DILARANG menulis proses berpikir, reasoning, atau catatan internal. Langsung tulis jawaban akhir saja.
3. Jawab HANYA pertanyaan terkait SPPG, program MBG, gizi anak, atau penggunaan aplikasi ini.
4. Jika ditanya di luar topik, tolak dengan sopan dalam Bahasa Indonesia.
5. Jawaban maksimal 4 kalimat kecuali diminta penjelasan panjang.
6. Gunakan bahasa ramah dan mudah dipahami masyarakat umum.

Pengetahuan:
- SPPG (Satuan Pelayanan Pemenuhan Gizi) adalah unit layanan penyedia makanan bergizi untuk siswa
- 1 SPPG melayani sekitar 3.000 siswa
- Model prediksi menggunakan Deep Learning (TF ResNet) berbasis data siswa per jenjang per kabupaten/kota
- Output model: prediksi jumlah SPPG, gap (kekurangan/surplus), dan status wilayah
- Status: SURPLUS, SEIMBANG, KURANG, SANGAT_KURANG
- Data input: SD, SMP, SMA, SMK, SLB, TK, KB, TPA, SPS"""

def _load_custom_objects():
    """Import TF & daftarkan custom objects (lazy import agar startup cepat)."""
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, regularizers

    class ResidualBlock(layers.Layer):
        def __init__(self, units, dropout_rate=0.2, l2=1e-3, **kwargs):
            super().__init__(**kwargs)
            self.units = units
            self.dropout_rate = dropout_rate
            reg = regularizers.l2(l2)
            self.dense1  = layers.Dense(units, activation="relu", kernel_regularizer=reg)
            self.dense2  = layers.Dense(units, kernel_regularizer=reg)
            self.ln      = layers.LayerNormalization()
            self.dropout = layers.Dropout(dropout_rate)
            self.act     = layers.Activation("relu")
            self.proj    = None

        def build(self, input_shape):
            if input_shape[-1] != self.units:
                self.proj = layers.Dense(self.units, use_bias=False)
            super().build(input_shape)

        def call(self, x, training=False):
            skip = self.proj(x) if self.proj else x
            out  = self.dense1(x)
            out  = self.dropout(out, training=training)
            out  = self.dense2(out)
            out  = self.ln(out)
            return self.act(out + skip)

        def get_config(self):
            cfg = super().get_config()
            cfg.update({"units": self.units, "dropout_rate": self.dropout_rate})
            return cfg

    class SmoothMAELoss(keras.losses.Loss):
        def __init__(self, delta=0.1, name="smooth_mae", **kwargs):
            super().__init__(name=name, **kwargs)
            self.delta = delta

        def call(self, y_true, y_pred):
            y_true = tf.cast(y_true, tf.float32)
            y_pred = tf.cast(y_pred, tf.float32)
            err    = y_true - y_pred
            return tf.reduce_mean(
                self.delta * (tf.sqrt(1.0 + tf.square(err / self.delta)) - 1.0)
            )

        def get_config(self):
            cfg = super().get_config()
            cfg.update({"delta": self.delta})
            return cfg

    return {
        "ResidualBlock": ResidualBlock,
        "SmoothMAELoss": SmoothMAELoss,
        "keras": keras,
    }


# ──────────────────────────────────────────────
# Lifespan: load model saat startup
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load semua artefak saat server start, bebaskan saat shutdown."""
    print("⏳  Memuat model & preprocessors…")
    objs  = _load_custom_objects()
    keras = objs["keras"]

    try:
        state["model"] = keras.models.load_model(MODEL_PATH, custom_objects=objs)
        state["keras"] = keras
    except Exception as e:
        raise RuntimeError(f"Gagal load model dari '{MODEL_PATH}': {e}")

    for key, path, err_label in [
        ("scaler",    SCALER_PATH,  "scaler"),
        ("le_prov",   LE_PATH,      "label encoder provinsi"),
        ("y_log_max", YLOGMAX_PATH, "y_log_max"),
    ]:
        if not os.path.exists(path):
            raise RuntimeError(f"File tidak ditemukan: {path} ({err_label})")
        with open(path, "rb") as f:
            state[key] = pickle.load(f)

    # ── Load data kabupaten dari CSV ──────────────────────────
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        # buat kolom lowercase untuk fuzzy matching nama wilayah
        df["_nama_lower"] = df["nama_kabupaten"].str.lower().str.strip()
        state["data_kabupaten"] = df
        print(f"✅  Data kabupaten dimuat: {len(df)} baris.")
    else:
        print(f"⚠️  File CSV tidak ditemukan: {DATA_PATH} — fitur auto-predict chatbot dinonaktifkan.")

    # ── Pre-compute prediksi semua kabupaten ──────────────────
    if "data_kabupaten" in state and "model" in state:
        print("⏳  Pre-computing prediksi semua kabupaten...")
        prediksi_semua = []
        for _, row in df.iterrows():
            try:
                keb_hist = float(row["jumlah_sppg"])
                inp = SPPGInput(
                    kode_provinsi = str(int(row["kode_provinsi"])),
                    total_siswa   = float(row["total_siswa"]),
                    sd_sederajat  = float(row["sd_sederajat"]),
                    smp_sederajat = float(row["smp_sederajat"]),
                    sma_sederajat = float(row["sma_sederajat"]),
                    smk_sederajat = float(row["smk_sederajat"]),
                    slb           = float(row.get("slb", 0)),
                    tk_sederajat  = float(row.get("tk_sederajat", 0)),
                    kb_sederajat  = float(row.get("kb_sederajat", 0)),
                    tpa           = float(row.get("tpa", 0)),
                    sps           = float(row.get("sps", 0)),
                )
                features, keb = _build_features(inp, kebutuhan_sppg_hist=keb_hist)
                pred = _run_inference(features, keb)
                prediksi_semua.append({
                    "nama": str(row["nama_kabupaten"]),
                    "status": pred.status,
                    "gap": pred.gap_prediksi,
                    "prediksi": pred.jumlah_sppg_prediksi,
                    "kebutuhan": pred.kebutuhan_sppg,
                })
            except Exception:
                continue
        state["prediksi_semua"] = prediksi_semua
        print(f"✅  Pre-compute selesai: {len(prediksi_semua)} wilayah.")

    print("✅  Model & artefak berhasil dimuat.")
    yield
    state.clear()
    print("🛑  Server shutdown — state dibersihkan.")


# ──────────────────────────────────────────────
# Inisialisasi FastAPI
# ──────────────────────────────────────────────
app = FastAPI(
    title="SPPG Predictor API",
    description=(
        "REST API untuk memprediksi kebutuhan Satuan Pelayanan Pemenuhan Gizi (SPPG) "
        "per kabupaten/kota berdasarkan data pendidikan wilayah."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Schema Pydantic
# ──────────────────────────────────────────────
class SPPGInput(BaseModel):
    """Input data wilayah untuk prediksi kebutuhan SPPG."""

    kode_provinsi:   str   = Field(...,  example="32", description="Kode BPS provinsi (string)")
    total_siswa:     float = Field(...,  gt=0, example=83000, description="Total siswa semua jenjang")
    sd_sederajat:    float = Field(...,  ge=0, example=45000, description="Jumlah siswa SD/sederajat")
    smp_sederajat:   float = Field(...,  ge=0, example=18000, description="Jumlah siswa SMP/sederajat")
    sma_sederajat:   float = Field(...,  ge=0, example=12000, description="Jumlah siswa SMA/sederajat")
    smk_sederajat:   float = Field(...,  ge=0, example=8000,  description="Jumlah siswa SMK/sederajat")
    slb:             float = Field(0.0,  ge=0, example=200,   description="Jumlah siswa SLB")
    tk_sederajat:    float = Field(0.0,  ge=0, example=5000,  description="Jumlah siswa TK/sederajat")
    kb_sederajat:    float = Field(0.0,  ge=0, example=3000,  description="Jumlah siswa KB/sederajat")
    tpa:             float = Field(0.0,  ge=0, example=50,    description="Jumlah TPA")
    sps:             float = Field(0.0,  ge=0, example=100,   description="Jumlah SPS")

    model_config = {
        "json_schema_extra": {
            "example": {
                "kode_provinsi": "32",
                "total_siswa": 83000,
                "sd_sederajat": 45000,
                "smp_sederajat": 18000,
                "sma_sederajat": 12000,
                "smk_sederajat": 8000,
                "slb": 200,
                "tk_sederajat": 5000,
                "kb_sederajat": 3000,
                "tpa": 50,
                "sps": 100,
            }
        }
    }


class SPPGOutput(BaseModel):
    jumlah_sppg_prediksi: float
    kebutuhan_sppg:       float
    gap_prediksi:         float
    status:               str
    interpretasi:         str
 
 
class AnalyzeInput(BaseModel):
    """Input /analyze — isi dari hasil /predict + nama wilayah."""
    nama_wilayah:         str            = Field(..., example="Kab. Bandung")
    jumlah_sppg_prediksi: float          = Field(..., example=27.0)
    kebutuhan_sppg:       float          = Field(..., example=27.7)
    gap_prediksi:         float          = Field(..., example=0.7)
    status:               str            = Field(..., example="SEIMBANG")
    total_siswa:          float          = Field(..., example=83000)
    rasio_sd:             Optional[float] = Field(None, example=0.54)
    rasio_smp:            Optional[float] = Field(None, example=0.22)
    rasio_sma_smk:        Optional[float] = Field(None, example=0.24)
 
    model_config = {
        "json_schema_extra": {
            "example": {
                "nama_wilayah": "Kab. Bandung",
                "jumlah_sppg_prediksi": 27.0,
                "kebutuhan_sppg": 27.7,
                "gap_prediksi": 0.7,
                "status": "SEIMBANG",
                "total_siswa": 83000,
                "rasio_sd": 0.54,
                "rasio_smp": 0.22,
                "rasio_sma_smk": 0.24,
            }
        }
    }
 
 
class AnalyzeOutput(BaseModel):
    nama_wilayah:          str = Field(..., description="Nama wilayah yang dianalisis")
    rekomendasi_kebijakan: str = Field(..., description="[Fitur 1] Rekomendasi untuk stakeholder/pemerintah")
    penjelasan_prediksi:   str = Field(..., description="[Fitur 4] Penjelasan model untuk non-technical user")
    model_llm:             str = Field(..., description="Model LLM yang digunakan")
 
 
class PredictAndAnalyzeOutput(BaseModel):
    prediksi:    SPPGOutput
    analisis_ai: AnalyzeOutput
 
 
class HealthResponse(BaseModel):
    status:       str
    model_loaded: bool
    genai_ready:  bool
    version:      str

class ChatMessage(BaseModel):
    role: str   = Field(..., example="user", description="'user' atau 'assistant'")
    content: str = Field(..., example="Apa itu SPPG?")

class ChatInput(BaseModel):
    session_id:   Optional[str]  = Field(None, description="ID sesi chat, kosongkan untuk sesi baru")
    message:      str            = Field(..., example="Apa itu SPPG dan bagaimana cara kerjanya?")
    context_data: Optional[dict] = Field(None, description="Isi dengan hasil /predict jika sudah ada, agar chatbot bisa jawab spesifik")

class ChatOutput(BaseModel):
    session_id: str
    reply: str
    history: List[ChatMessage]

# ══════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════
def _build_features(data: SPPGInput, kebutuhan_sppg_hist: float = 0.0):
    eps = 1e-6
    ts, sd, smp = data.total_siswa, data.sd_sederajat, data.smp_sederajat
    sma, smk    = data.sma_sederajat, data.smk_sederajat
    slb, tk, kb = data.slb, data.tk_sederajat, data.kb_sederajat
    tpa, sps    = data.tpa, data.sps
    keb         = ts / 3000
    
    sppg_per_siswa_ratio = kebutuhan_sppg_hist / (ts + eps)
    log_kebutuhan_sppg   = np.log1p(kebutuhan_sppg_hist)

    le = state["le_prov"]
    try:
        prov_enc = float(le.transform([str(data.kode_provinsi)])[0])
    except ValueError:
        prov_enc = float(len(le.classes_) // 2)
 
    features = np.array([[
        sd, smp, sma, smk, slb, tk, kb, tpa, sps, ts, prov_enc,
        np.log1p(ts), np.log1p(sd), np.log1p(smp), np.log1p(sma), np.log1p(smk),
        np.log1p(tk), np.log1p(kb), np.sqrt(ts),
        sd/(ts+eps), smp/(ts+eps), (sma+smk)/(ts+eps), (tk+kb)/(ts+eps),
        (smp+sma+smk)/(ts+eps),
        keb, np.log1p(keb), np.sqrt(keb),
        ts**2, keb**2, sd*smp/(ts**2+eps), 2.0,
        sppg_per_siswa_ratio,
        log_kebutuhan_sppg, 
    ]], dtype=np.float32)
 
    return features, keb
 
 
def _run_inference(features: np.ndarray, keb: float) -> SPPGOutput:
    X         = state["scaler"].transform(features)
    norm      = float(np.clip(state["model"].predict(X, verbose=0, batch_size=1)[0][0], 0, 1))
    sppg_pred = max(0.0, round(float(np.expm1(norm * state["y_log_max"])), 1))
    gap       = round(keb - sppg_pred, 2)
 
    if gap < -1:
        status, info = "SURPLUS",       f"Surplus {abs(gap):.0f} unit — dapat dialihkan ke wilayah lain."
    elif abs(gap) <= 1:
        status, info = "SEIMBANG",      "SPPG sudah seimbang dengan kebutuhan wilayah."
    elif gap <= 20:
        status, info = "KURANG",        f"Butuh ~{int(np.ceil(gap))} SPPG tambahan."
    else:
        status, info = "SANGAT_KURANG", f"Sangat kekurangan — butuh ~{int(np.ceil(gap))} SPPG (prioritas utama)."
 
    return SPPGOutput(
        jumlah_sppg_prediksi=sppg_pred,
        kebutuhan_sppg=round(keb, 1),
        gap_prediksi=gap,
        status=status,
        interpretasi=info,
    )
 
def _predict_by_nama(keyword: str) -> Optional[tuple[str, SPPGOutput]]:
    """
    Cari baris di CSV berdasarkan nama kabupaten, lalu jalankan prediksi model.
    Return: (nama_resmi, SPPGOutput) atau None kalau tidak ketemu.
    """
    if "data_kabupaten" not in state:
        print("DEBUG: data_kabupaten tidak ada di state!")  # ← ini yang kemungkinan terjadi
        return None
    
    df = state["data_kabupaten"]
    kw = keyword.lower().strip()
    matches = df[df["_nama_lower"].str.contains(kw, na=False)]
    print(f"DEBUG: keyword={kw}, matches={len(matches)}") 
    df      = state["data_kabupaten"]
    kw      = keyword.lower().strip()
    matches = df[df["_nama_lower"].str.contains(kw, na=False)]

    if matches.empty:
        return None

    row = matches.iloc[0]
    kebutuhan_sppg_hist = float(row["jumlah_sppg"])
    print(f"DEBUG row data:")
    print(f"  nama     : {row['nama_kabupaten']}")
    print(f"  kode_prov: {row['kode_provinsi']}")
    print(f"  total    : {row['total_siswa']}")
    print(f"  sd       : {row['sd_sederajat']}")
    print(f"  smp      : {row['smp_sederajat']}")
    try:
        inp = SPPGInput(
            kode_provinsi = str(int(row["kode_provinsi"])),
            total_siswa   = float(row["total_siswa"]),
            sd_sederajat  = float(row["sd_sederajat"]),
            smp_sederajat = float(row["smp_sederajat"]),
            sma_sederajat = float(row["sma_sederajat"]),
            smk_sederajat = float(row["smk_sederajat"]),
            slb           = float(row.get("slb", 0)),
            tk_sederajat  = float(row.get("tk_sederajat", 0)),
            kb_sederajat  = float(row.get("kb_sederajat", 0)),
            tpa           = float(row.get("tpa", 0)),
            sps           = float(row.get("sps", 0)),
        )
        features, keb = _build_features(inp, kebutuhan_sppg_hist=kebutuhan_sppg_hist)
        result        = _run_inference(features, keb)
        nama_resmi    = str(row["nama_kabupaten"]).title()
        return nama_resmi, result
    
    except Exception as e:
        print(f"DEBUG _predict_by_nama error: {e}")
        return None


def _extract_wilayah_from_message(message: str) -> Optional[tuple[str, SPPGOutput]]:
    """
    Scan setiap kata di pesan user, coba match ke nama kabupaten di CSV.
    Return hasil prediksi pertama yang cocok, atau None.
    """
    if "data_kabupaten" not in state:
        return None

    # Bersihkan pesan, pecah per kata, filter kata pendek & stopword
    stopwords = {"apa", "apakah", "yang", "dan", "atau", "ini", "itu", "ada",
                 "mau", "bisa", "perlu", "sppg", "masih", "untuk", "dengan",
                 "bagaimana", "berapa", "dimana", "kapan", "siapa", "kenapa", "baru"}
    words = [
        w.strip("?.,!") for w in message.lower().split()
        if len(w.strip("?.,!")) > 3 and w.strip("?.,!") not in stopwords
    ]
    print(f"DEBUG words: {words}")
    for word in words:
        result = _predict_by_nama(word)
        if result:
            return result

    return None

async def _call_openrouter(system_prompt: str, user_prompt: str) -> str:
    """Panggil OpenRouter dan return teks response."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://sppg-predictor.local",
        "X-Title":       "SPPG Predictor",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "max_tokens":  400,
        "temperature": 0.4,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        if resp.status_code != 200:
            raise HTTPException(502, f"OpenRouter error {resp.status_code}: {resp.text[:300]}")
        return resp.json()["choices"][0]["message"]["content"].strip()
 
async def _call_openrouter_chat(messages: list) -> str:
    """Panggil OpenRouter dengan full conversation history."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://sppg-predictor.local",
        "X-Title":       "SPPG Chatbot",
    }
    payload = {
        "model":       OPENROUTER_MODEL,
        "messages":    messages,
        "max_tokens":  500,
        "temperature": 0.5,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        if resp.status_code != 200:
            raise HTTPException(502, f"OpenRouter error {resp.status_code}: {resp.text[:300]}")
        data    = resp.json()
        message = data["choices"][0]["message"]
        content = message["content"]
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
        if not content:
            raise HTTPException(502, "Model tidak return teks.")
        return content.strip()
    
# ══════════════════════════════════════════════
# ENDPOINTS — Info
# ══════════════════════════════════════════════
@app.get("/", tags=["Info"])
def root():
    return {
        "api": "SPPG Predictor API", "version": "1.0.0",
        "docs": "/docs", "health": "/health",
        "endpoints": {
            "prediksi":         "POST /predict",
            "prediksi_batch":   "POST /predict/batch",
            "analisis_ai":      "POST /analyze",
            "prediksi_plus_ai": "POST /predict-and-analyze",
            "chatbot":          "POST /chat",              # ← tambah ini
            "hapus_sesi_chat":  "DELETE /chat/{session_id}", # ← dan ini
        }
    }
 
@app.get("/health", response_model=HealthResponse, tags=["Info"])
def health():
    """Cek status server, model TF, dan kesiapan Generative AI."""
    return HealthResponse(
        status="ok",
        model_loaded="model" in state,
        genai_ready=bool(OPENROUTER_API_KEY),
        version="1.0.0",
    )
 
 
# ══════════════════════════════════════════════
# ENDPOINTS — Prediksi (Model TF)
# ══════════════════════════════════════════════
@app.post("/predict", response_model=SPPGOutput, tags=["Prediksi"])
def predict(data: SPPGInput):
    """
    **Prediksi kebutuhan SPPG** menggunakan model Deep Learning TF ResNet.
 
    - Input  : data jumlah siswa per jenjang + kode provinsi
    - Output : prediksi SPPG, kebutuhan teoritis, gap, status, interpretasi
    """
    if "model" not in state:
        raise HTTPException(503, "Model belum dimuat.")
    try:
        keb_teoritis = data.total_siswa / 3000
        features, keb = _build_features(data, kebutuhan_sppg_hist=keb_teoritis)
        return _run_inference(features, keb)
    except Exception as e:
        raise HTTPException(500, f"Error inference: {e}")
 
 
@app.post("/predict/batch", response_model=list[SPPGOutput], tags=["Prediksi"])
def predict_batch(items: list[SPPGInput]):
    """**Prediksi batch** — kirim banyak kabupaten sekaligus (maks 100)."""
    if "model" not in state:
        raise HTTPException(503, "Model belum dimuat.")
    if len(items) > 100:
        raise HTTPException(400, "Maksimal 100 item per request.")
    results = []
    for item in items:
        try:
            keb_teoritis = item.total_siswa / 3000
            features, keb = _build_features(item, kebutuhan_sppg_hist=keb_teoritis)
            results.append(_run_inference(features, keb))
        except Exception as e:
            raise HTTPException(500, f"Error: {e}")
    return results
 
 
# ══════════════════════════════════════════════
# ENDPOINTS — Generative AI (Fitur Sekunder)
# ══════════════════════════════════════════════
@app.post("/analyze", response_model=AnalyzeOutput, tags=["Generative AI"])
async def analyze(data: AnalyzeInput):
    """
    **Analisis naratif berbasis Generative AI** (OpenRouter LLM).
 
    Dua fitur sekunder sekaligus:
 
    **Fitur 1 — Rekomendasi Kebijakan**
    Narasi actionable untuk pemerintah daerah/stakeholder berdasarkan
    status SPPG (surplus/kurang), gap, dan jumlah siswa wilayah.
 
    **Fitur 4 — Penjelasan Prediksi (Explainability)**
    Penjelasan *mengapa* model memprediksi angka tersebut dalam bahasa
    yang mudah dipahami pemangku kebijakan non-teknis.
 
    > Model prediksi utama tetap TF ResNet di `/predict`.
    > Generative AI hanya untuk fitur sekunder ini.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            503,
            "OPENROUTER_API_KEY belum diset. "
            "Windows: set OPENROUTER_API_KEY=sk-or-... | "
            "Linux/Mac: export OPENROUTER_API_KEY=sk-or-..."
        )
 
    eps           = 1e-6
    rasio_sd      = data.rasio_sd      or 0.0
    rasio_smp     = data.rasio_smp     or 0.0
    rasio_sma_smk = data.rasio_sma_smk or 0.0
    keb_per_1000  = data.kebutuhan_sppg / (data.total_siswa / 1000 + eps)
 
    # ── FITUR 1: Rekomendasi Kebijakan ──────────────────────
    sys1 = (
        "Kamu adalah analis kebijakan publik senior yang ahli dalam Program Makan Bergizi Gratis (MBG) "
        "dan Satuan Pelayanan Pemenuhan Gizi (SPPG) di Indonesia. "
        "Buat rekomendasi kebijakan yang ringkas, spesifik, dan actionable dalam Bahasa Indonesia formal. "
        "Maksimal 4 kalimat. Langsung ke inti tanpa basa-basi."
    )
    usr1 = (
        f"Buat rekomendasi kebijakan untuk pemerintah daerah berdasarkan data SPPG berikut:\n\n"
        f"- Wilayah        : {data.nama_wilayah}\n"
        f"- Total Siswa    : {int(data.total_siswa):,} siswa\n"
        f"- Kebutuhan SPPG : {data.kebutuhan_sppg:.1f} unit (teoritis, 1 SPPG per 3.000 siswa)\n"
        f"- Prediksi SPPG  : {data.jumlah_sppg_prediksi:.1f} unit (model ML)\n"
        f"- Gap            : {data.gap_prediksi:+.1f} unit (positif = kekurangan)\n"
        f"- Status         : {data.status}\n\n"
        f"Berikan rekomendasi konkret mengenai prioritas alokasi, redistribusi, atau penambahan SPPG."
    )
 
    # ── FITUR 4: Penjelasan Prediksi (Explainability) ───────
    sys4 = (
        "Kamu adalah data scientist yang menjelaskan hasil model machine learning "
        "kepada pemangku kebijakan tanpa latar belakang teknis. "
        "Gunakan analogi sederhana bila perlu. Bahasa Indonesia yang mudah dipahami. "
        "Maksimal 4 kalimat. Fokus pada faktor data yang paling berpengaruh."
    )
    usr4 = (
        f"Jelaskan mengapa model machine learning memprediksi {data.jumlah_sppg_prediksi:.1f} unit SPPG "
        f"untuk wilayah {data.nama_wilayah}.\n\n"
        f"Karakteristik data wilayah:\n"
        f"- Total siswa            : {int(data.total_siswa):,} orang\n"
        f"- Proporsi siswa SD      : {rasio_sd*100:.1f}%\n"
        f"- Proporsi siswa SMP     : {rasio_smp*100:.1f}%\n"
        f"- Proporsi siswa SMA/SMK : {rasio_sma_smk*100:.1f}%\n"
        f"- Kebutuhan per 1.000 siswa: {keb_per_1000:.2f} unit\n"
        f"- Status akhir           : {data.status}\n\n"
        f"Jelaskan faktor utama yang memengaruhi hasil prediksi ini dalam bahasa awam."
    )
 
    # ── Panggil OpenRouter paralel (hemat waktu ~50%) ───────
    try:
        rekomendasi, penjelasan = await asyncio.gather(
            _call_openrouter(sys1, usr1),
            _call_openrouter(sys4, usr4),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error Generative AI: {e}")
 
    return AnalyzeOutput(
        nama_wilayah=data.nama_wilayah,
        rekomendasi_kebijakan=rekomendasi,
        penjelasan_prediksi=penjelasan,
        model_llm=OPENROUTER_MODEL,
    )
 
 
@app.post("/predict-and-analyze", response_model=PredictAndAnalyzeOutput, tags=["Generative AI"])
async def predict_and_analyze(
    data: SPPGInput,
    nama_wilayah: str = Query("Wilayah tidak disebutkan", description="Nama kabupaten/kota"),
):
    """
    **One-shot endpoint** — model TF prediksi + analisis AI dalam satu request.
 
    Flow internal:
    1. Model TF ResNet → prediksi jumlah SPPG (model utama)
    2. Hasil prediksi → OpenRouter LLM → rekomendasi + penjelasan (fitur sekunder)
    3. Return keduanya sekaligus
 
    Cocok untuk integrasi React.js frontend yang ingin satu endpoint saja.
    """
    if "model" not in state:
        raise HTTPException(503, "Model belum dimuat.")
 
    try:
        keb_teoritis  = data.total_siswa / 3000
        features, keb = _build_features(data, kebutuhan_sppg_hist=keb_teoritis)
        pred          = _run_inference(features, keb)
    except Exception as e:
        raise HTTPException(500, f"Error inference: {e}")
 
    eps = 1e-6
    ts  = data.total_siswa
    ai_input = AnalyzeInput(
        nama_wilayah         = nama_wilayah,
        jumlah_sppg_prediksi = pred.jumlah_sppg_prediksi,
        kebutuhan_sppg       = pred.kebutuhan_sppg,
        gap_prediksi         = pred.gap_prediksi,
        status               = pred.status,
        total_siswa          = ts,
        rasio_sd             = data.sd_sederajat / (ts + eps),
        rasio_smp            = data.smp_sederajat / (ts + eps),
        rasio_sma_smk        = (data.sma_sederajat + data.smk_sederajat) / (ts + eps),
    )
 
    ai_result = await analyze(ai_input)
    return PredictAndAnalyzeOutput(prediksi=pred, analisis_ai=ai_result)

@app.post("/chat", response_model=ChatOutput, tags=["Chatbot"])
async def chat(data: ChatInput):
    """
    **Chatbot SPPG** — tanya jawab seputar SPPG, program MBG, dan aplikasi ini.

    - Kirim `session_id` kosong/null untuk memulai sesi baru
    - Simpan `session_id` dari response untuk melanjutkan percakapan
    - History percakapan tersimpan selama server aktif (reset saat restart)

    Chatbot hanya menjawab pertanyaan seputar SPPG dan program MBG.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(503, "OPENROUTER_API_KEY belum diset.")

    # Ambil atau buat sesi baru
    session_id = data.session_id or str(uuid.uuid4())
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []

    history = chat_sessions[session_id]

    # ── Inject konteks prediksi jika ada ──
    prediction_context = ""
    if data.context_data:
        ctx = data.context_data
        has_real_data = any(
            v is not None and v != {}
            for v in ctx.values()
        )
        if has_real_data:
            prediction_context = (
                f"\n\n[DATA PREDIKSI AKTIF untuk wilayah ini — gunakan untuk menjawab pertanyaan user secara spesifik]:\n"
                f"- Prediksi SPPG  : {ctx.get('jumlah_sppg_prediksi')} unit\n"
                f"- Kebutuhan SPPG : {ctx.get('kebutuhan_sppg')} unit (teoritis)\n"
                f"- Gap            : {ctx.get('gap_prediksi')} unit (positif = kekurangan)\n"
                f"- Status         : {ctx.get('status')}\n"
                f"- Interpretasi   : {ctx.get('interpretasi')}\n"
                f"Jawab pertanyaan user berdasarkan data ini secara langsung dan spesifik."
            )

    # Hanya jalan kalau tidak ada context_data manual dari frontend
    auto_context = ""
    if not prediction_context:
        found = _extract_wilayah_from_message(data.message)
        if found:
            nama_resmi, pred = found
            auto_context = (
                f"\n\n[DATA PREDIKSI OTOMATIS untuk {nama_resmi}]:\n"
                f"- Prediksi SPPG  : {pred.jumlah_sppg_prediksi} unit\n"
                f"- Kebutuhan SPPG : {pred.kebutuhan_sppg} unit (teoritis, 1 SPPG per 3.000 siswa)\n"
                f"- Gap            : {pred.gap_prediksi} unit (positif = kekurangan)\n"
                f"- Status         : {pred.status}\n"
                f"- Interpretasi   : {pred.interpretasi}\n"
                f"Gunakan data ini untuk menjawab pertanyaan user secara langsung dan spesifik dalam Bahasa Indonesia."
            )
    # ── Inject ringkasan semua wilayah ke system prompt ──────
    ringkasan_context = ""
    if "prediksi_semua" in state:
        semua = state["prediksi_semua"]
        semua_kurang       = sorted([x for x in semua if x["status"] == "SANGAT_KURANG"], key=lambda x: x["gap"], reverse=True)
        semua_kurang_biasa = sorted([x for x in semua if x["status"] == "KURANG"],        key=lambda x: x["gap"], reverse=True)
        semua_surplus      = sorted([x for x in semua if x["status"] == "SURPLUS"],       key=lambda x: x["gap"])
        semua_seimbang     =        [x for x in semua if x["status"] == "SEIMBANG"]

        nama_sangat_kurang = ", ".join(f"{x['nama'].title()} (butuh {x['gap']:.0f} unit)" for x in semua_kurang[:20])
        nama_kurang_biasa  = ", ".join(f"{x['nama'].title()} (butuh {x['gap']:.0f} unit)" for x in semua_kurang_biasa[:20])
        nama_surplus       = ", ".join(f"{x['nama'].title()} (surplus {abs(x['gap']):.0f} unit)" for x in semua_surplus[:20])
        nama_seimbang      = ", ".join(x["nama"].title() for x in semua_seimbang[:20])

        if len(semua_kurang) > 20:
            nama_sangat_kurang += f", ... dan {len(semua_kurang)-20} wilayah lainnya"
        if len(semua_kurang_biasa) > 20:
            nama_kurang_biasa  += f", ... dan {len(semua_kurang_biasa)-20} wilayah lainnya"
        if len(semua_surplus) > 20:
            nama_surplus       += f", ... dan {len(semua_surplus)-20} wilayah lainnya"
        if len(semua_seimbang) > 20:
            nama_seimbang      += f", ... dan {len(semua_seimbang)-20} wilayah lainnya"

        ringkasan_context = (
            f"\n\n[RINGKASAN PREDIKSI SEMUA WILAYAH — {len(semua)} kabupaten/kota]:\n"
            f"- SANGAT_KURANG ({len(semua_kurang)} wilayah)      : {nama_sangat_kurang}\n"
            f"- KURANG        ({len(semua_kurang_biasa)} wilayah): {nama_kurang_biasa}\n"
            f"- SEIMBANG      ({len(semua_seimbang)} wilayah)    : {nama_seimbang}\n"
            f"- SURPLUS       ({len(semua_surplus)} wilayah)     : {nama_surplus}\n"
            f"Gunakan data ini untuk menjawab pertanyaan umum tentang kondisi SPPG nasional."
        )
    # ── Susun messages: system prompt + history + pesan baru ──
    print(f"DEBUG auto_context: '{auto_context[:200]}'")
    messages = [{"role": "system", "content": SPPG_SYSTEM_PROMPT + prediction_context + auto_context + ringkasan_context}]
    messages += [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": data.message})

    # Panggil LLM
    try:
        reply = await _call_openrouter_chat(messages)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error chatbot: {e}")

    # Simpan ke history
    history.append({"role": "user",      "content": data.message})
    history.append({"role": "assistant", "content": reply})

    # Batasi history maks 20 pesan (10 turn) supaya tidak membengkak
    if len(history) > 20:
        chat_sessions[session_id] = history[-20:]

    return ChatOutput(
        session_id=session_id,
        reply=reply,
        history=[ChatMessage(**m) for m in chat_sessions[session_id]],
    )


@app.delete("/chat/{session_id}", tags=["Chatbot"])
def clear_chat(session_id: str):
    """Hapus riwayat percakapan untuk session tertentu."""
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    return {"message": f"Sesi {session_id} berhasil dihapus."}
