# SPPG Intelligence Platform – Capstone Project

## 📌 Deskripsi Proyek

SPPG Intelligence Platform adalah solusi berbasis Artificial Intelligence yang dirancang untuk membantu analisis, prediksi, monitoring, dan pengambilan keputusan terkait data SPPG (Satuan Pelayanan Pemenuhan Gizi).

Proyek ini terdiri dari tiga komponen utama:

1. **Frontend Web Dashboard** (React + Vite)
2. **Backend API Gateway** (Node.js + Express.js)
3. **AI Prediction Service** (FastAPI + TensorFlow)

Selain itu tersedia notebook dan dataset untuk proses eksplorasi data, pelatihan model, dan evaluasi performa.

---

# 🏗️ Arsitektur Sistem

```text
┌─────────────────────┐
│   Frontend React    │
└──────────┬──────────┘
           │ REST API
           ▼
┌─────────────────────┐
│ Backend Express API │
│ Authentication      │
│ Data Management     │
│ History             │
│ Chatbot Session     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ FastAPI AI Service  │
│ Prediction Engine   │
│ Chatbot AI          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PostgreSQL / Redis  │
└─────────────────────┘
```

---

# ✨ Fitur Utama

## Dashboard Monitoring

- Monitoring data SPPG secara real-time.
- Visualisasi statistik wilayah.
- Laporan tren dan analisis.

## AI Prediction

- Prediksi kebutuhan atau indikator SPPG menggunakan model TensorFlow.
- Single prediction.
- Batch prediction menggunakan file CSV.

## Chatbot Intelligence

- Asisten AI berbasis LLM.
- Konsultasi dan eksplorasi data SPPG.
- Riwayat sesi percakapan.

## Authentication & Security

- JWT Authentication.
- Role-based access.
- Password hashing menggunakan bcrypt.

## Data Management

- Penyimpanan riwayat analisis.
- Master data wilayah.
- Integrasi PostgreSQL dan Redis.

---

# 🛠️ Tech Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- Axios
- Recharts
- React Router DOM

## Backend

- Node.js
- Express.js
- PostgreSQL
- Redis
- JWT
- Joi Validation
- Multer

## AI Service

- FastAPI
- TensorFlow / Keras
- Scikit-Learn
- Pandas
- NumPy
- HTTPX

---

# 📂 Struktur Repository

```text
capstone-project/
│
├── Frontend-Capstone/
│   ├── src/
│   ├── public/
│   └── dist/
│
├── Backend-Capstone/
│   ├── migrations/
│   ├── src/
│   └── package.json
│
├── AI-deteksi-sppg/
│   ├── app.py
│   ├── model/
│   ├── notebook/
│   └── data/
│
└── DataScientist_AnalisisDataset/
```

---

# 🚀 Instalasi

## 1. Clone Repository

```bash
git clone <repository-url>
cd capstone-project
```

---

## 2. Menjalankan Backend

```bash
cd Backend-Capstone
npm install
```

Buat file `.env`:

```env
HOST=localhost
PORT=5000

FASTAPI_URL=http://localhost:8000

PGUSER=
PGHOST=
PGPASSWORD=
PGDATABASE=
PGPORT=

ACCESS_TOKEN_KEY=your_secret_key
REFRESH_TOKEN_KEY=your_refresh_secret
```

Migration:

```bash
npm run migrate up
```

Jalankan server:

```bash
npm run start:dev
```

Backend berjalan di:

```text
http://localhost:5000
```

---

## 3. Menjalankan AI Service

```bash
cd AI-deteksi-sppg
pip install -r requirements.txt
```

Jalankan FastAPI:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

AI Service berjalan di:

```text
http://localhost:8000
```

---

## 4. Menjalankan Frontend

```bash
cd Frontend-Capstone
npm install
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

---

# 🤖 Model Machine Learning

Model AI menggunakan:

- TensorFlow / Keras
- Scikit-Learn
- Label Encoding
- Feature Scaling

Artefak model:

```text
model/
├── sppg_model.keras
├── scaler.pkl
├── le_prov.pkl
└── y_log_max.pkl
```

---

# 📊 Modul Analitik

Platform menyediakan:

- Dashboard statistik wilayah.
- Tren pertumbuhan data.
- Analisis historis.
- Prediksi berbasis AI.
- Export dan upload data CSV.

---

# 🔐 Keamanan

- JWT Authentication
- Password Hashing (bcrypt)
- Input Validation (Joi)
- Error Handling Middleware
- Environment Variable Configuration

---

# 🧪 Pengujian

## Backend

```bash
npm run lint
```

## Frontend

```bash
npm run build
npm run lint
```

---

# 📦 Deployment

Komponen dapat di-deploy secara terpisah:

### Frontend

- Vercel

### Backend

- vercel

### AI Service

- Hugging Face

---

# 👥 Tim Capstone

Tambahkan nama anggota tim pada bagian ini:

| Nama                   | Role              |
| ---------------------- | ----------------- |
| Naufal Maulana Saputra | Backend Engineer  |
| Muhammad Haikal Erlana | Frontend Engineer |
| Dwi Aura Ningrum       | Data Scientist    |
| Eka Lidya Rahmadini    | Data Analyst      |
| Hany Nadya Fairuz      | AI Manager        |
| Fircan Ferdinand       | AI Manager        |

---

# 📄 License

Proyek ini dibuat untuk kebutuhan Capstone Project dan dapat disesuaikan dengan lisensi yang digunakan oleh tim pengembang.

---

# 📬 Kontak

Untuk pertanyaan atau pengembangan lebih lanjut, silakan hubungi tim pengembang proyek.
