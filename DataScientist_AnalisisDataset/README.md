# 🍱 Dashboard SPPG — Program Makan Bergizi Gratis

Dashboard interaktif untuk analisis distribusi **Satuan Pelayanan Pemenuhan Gizi (SPPG)** dan peserta didik per kabupaten/kota di Indonesia, dalam rangka Program **Makan Bergizi Gratis (MBG)** Badan Gizi Nasional.

# Akses Dashboard Online

Dashboard hasil analisis dapat diakses secara publik melalui Streamlit Cloud pada tautan berikut:

🔗 **https://sppg-analytics-capstone.streamlit.app/**

Dashboard ini menyajikan visualisasi interaktif, analisis kebutuhan SPPG, identifikasi wilayah prioritas, serta eksplorasi data peserta didik dan persebaran SPPG di seluruh Indonesia.

---

## Fitur Dashboard

| Halaman | Deskripsi |
|---|---|
| **📊 Ringkasan Nasional** | KPI nasional, distribusi kategori layanan, proporsi siswa per jenjang |
| **🔍 Analisis Distribusi** | Top rasio siswa/SPPG, peta kuadran demand vs supply, histogram distribusi |
| **🎯 Wilayah Prioritas** | Wilayah prioritas utama, top gap SPPG, wilayah tanpa SPPG |
| **📈 Korelasi & Tren** | Heatmap korelasi, scatter korelasi SMA/SMK vs SPPG, stacked bar jenjang |
| **🗂️ Data & Dictionary** | Kamus data lengkap, statistik deskriptif, eksplorasi & download data |

### Fitur Interaktif
- **Filter global** di sidebar: filter per provinsi dan kategori layanan
- **Slider** untuk memilih top-N wilayah yang ditampilkan
- **Search** nama kabupaten/kota di halaman eksplorasi data
- **Download** hasil filter sebagai CSV
- **Mendukung light & dark mode** Streamlit secara otomatis

---

## Cara Menjalankan

### 1. Lokal (Laptop/PC)

```bash
# Clone atau download file ini, lalu:
pip install -r requirements.txt
streamlit run dashboard.py
```

Dashboard akan terbuka otomatis di browser: `http://localhost:8501`

### 2. Google Colab

```python
# Install dependencies
!pip install streamlit pyngrok -q

# Jalankan dengan tunnel
import subprocess, threading
from pyngrok import ngrok

def run():
    subprocess.run(["streamlit", "run", "dashboard.py", "--server.port", "8501"])

threading.Thread(target=run, daemon=True).start()
public_url = ngrok.connect(8501)
print("Dashboard:", public_url)
```

### 3. Deploy ke Streamlit Cloud *(Rekomendasi)*

1. Upload semua file ke **GitHub** (pastikan `Dataset_Capstone_Final.csv` ikut di-upload)
2. Buka [streamlit.io/cloud](https://streamlit.io/cloud) → **New app**
3. Pilih repository, branch, dan file utama: `dashboard.py`
4. Klik **Deploy** — selesai, dashboard dapat diakses publik!

---

## Struktur File

```
project/
├── dashboard.py                  # File utama Streamlit
├── Dataset_Capstone_Final.csv    # Dataset hasil analisis
├── requirements.txt              # Dependensi Python
└── README.md                     # Dokumentasi ini
```

> **Penting:** `Dataset_Capstone_Final.csv` harus berada di **folder yang sama** dengan `dashboard.py`.

---

## Tentang Dataset

| Atribut | Detail |
|---|---|
| **Sumber** | Data Peserta Didik Kemendikbud + SPPG Operasional BGN |
| **Cakupan** | 514 kabupaten/kota di seluruh Indonesia |
| **Total siswa** | ±61,7 juta peserta didik |
| **Total SPPG** | 26.302 titik operasional |
| **Benchmark** | 1 SPPG = rata-rata 3.000 (Perpres 83/2024 & Juknis BGN Agustus 2025) |

### Kolom Utama

| Kolom | Deskripsi |
|---|---|
| `nama_kabupaten` | Nama kabupaten/kota (sudah distandarisasi) |
| `total_siswa` | Total peserta didik SD+SMP+SMA+SMK |
| `jumlah_sppg` | Jumlah SPPG operasional (0 = belum ada) |
| `rasio_siswa_per_sppg` | Rasio beban siswa per SPPG |
| `kebutuhan_sppg` | Estimasi kebutuhan SPPG (total_siswa / 3.000) |
| `gap_sppg` | Kekurangan SPPG (positif = masih kurang) |
| `kategori_layanan` | Prioritas Utama / Layanan Sesuai / Layanan Cukup |
| `flag_tanpa_sppg` | 1 jika wilayah belum memiliki SPPG sama sekali |

---


## Referensi Regulasi

- **Peraturan Presiden No. 83 Tahun 2024** tentang Badan Gizi Nasional
- **Petunjuk Teknis Pemilihan Mitra/Yayasan dalam Pengelolaan SPPG** — BGN, Agustus 2025
  - Setiap SPPG melayani rata-rata **3.000** peserta didik

---

*Dibuat sebagai bagian dari Capstone Project Data Scientist | CC26-PSU014*
