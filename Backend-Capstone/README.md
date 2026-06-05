# Backend API - SPPG Capstone Project

Backend API berbasis **Express.js** untuk mendukung fitur prediksi, analisis, chatbot, autentikasi, dan manajemen data pada proyek **SPPG Capstone**.

## 📌 Fitur Utama

- REST API berbasis Express.js
- Integrasi dengan layanan FastAPI
- JWT Authentication & Authorization
- Upload dan prediksi data CSV
- Riwayat analisis SPPG
- Chatbot Session API
- PostgreSQL Database
- Redis Cache Support
- Middleware validasi dan error handling

---

# 📂 Struktur Project

```bash
backend/
├── migrations/
├── src/
│   ├── cache/
│   ├── config/
│   ├── exceptions/
│   ├── middlewares/
│   ├── routes/
│   ├── security/
│   ├── server/
│   ├── services/
│   │   ├── authentications/
│   │   ├── chatbot/
│   │   ├── sppg/
│   │   ├── sppganalyses/
│   │   ├── sppgpredictcsv/
│   │   └── users/
│   └── utils/
├── package.json
└── .env
```

---

# ⚙️ Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Redis
- JWT
- Multer
- Joi Validation
- Axios
- Nodemon
- ESLint

---

# 🚀 Instalasi

## 1. Clone Repository

```bash
git clone <repository-url>
cd backend
```

## 2. Install Dependency

```bash
npm install
```

## 3. Konfigurasi Environment

Buat file `.env` berdasarkan contoh berikut:

```env
HOST=localhost
PORT=5000

FASTAPI_URL=https://your-fastapi-url

PGUSER=postgres
PGHOST=localhost
PGPASSWORD=password
PGDATABASE=sppgdb
PGPORT=5432

ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
```

---

# 🗄️ Menjalankan Migration Database

```bash
npm run migrate up
```

---

# ▶️ Menjalankan Server

## Development

```bash
npm run start:dev
```

## Production

```bash
npm run start:prod
```

Server berjalan di:

```bash
http://localhost:5000
```

---

# 🔐 Authentication API

## Register User

### Endpoint

```http
POST /users
```

### Request Body

```json
{
  "username": "admin",
  "password": "password123",
  "fullname": "Administrator"
}
```

---

## Login

### Endpoint

```http
POST /authentications
```

### Request Body

```json
{
  "username": "admin",
  "password": "password123"
}
```

### Response

```json
{
  "status": "success",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

---

# 🤖 AI & Prediction API

## Predict Data

```http
POST /api/predict
```

## Predict Batch CSV

```http
POST /api/predict/batch
```

## Analyze Data

```http
POST /api/analyze
```

## Predict & Analyze

```http
POST /api/predict-and-analyze
```

## Chat AI

```http
POST /api/chat
```

---

# 📊 SPPG Analysis API

## Menambahkan Analisis

```http
POST /api/sppg-analyses
```

> Membutuhkan Bearer Token

---

## Mendapatkan Riwayat Analisis

```http
GET /api/sppg-analyses
```

> Membutuhkan Bearer Token

---

# 📁 CSV Prediction API

## Upload CSV

```http
POST /api/sppg-csv/upload
```

### Form Data

| Key  | Type     |
| ---- | -------- |
| file | CSV File |

> Membutuhkan Bearer Token

---

## History Upload CSV

```http
GET /api/sppg-csv/history
```

---

# 💬 Chatbot API

## Membuat Session

```http
POST /api/sessions
```

## Mendapatkan Semua Session

```http
GET /api/sessions
```

## Mendapatkan Pesan Berdasarkan Session

```http
GET /api/sessions/:sessionId/messages
```

## Mengirim Pesan

```http
POST /api/messages
```

## Public Chat

```http
POST /api/public-chat
```

---

# 🛡️ Middleware

Project ini menggunakan beberapa middleware utama:

- Authentication Middleware
- Validation Middleware
- Error Handler Middleware
- Upload Middleware (Multer)

---

# 📦 Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| npm run start:dev  | Menjalankan server development |
| npm run start:prod | Menjalankan server production  |
| npm run migrate    | Menjalankan migration database |
| npm run lint       | Menjalankan ESLint             |

---

# 🧪 Dependencies Utama

| Package      | Fungsi             |
| ------------ | ------------------ |
| express      | Web framework      |
| pg           | PostgreSQL client  |
| redis        | Redis client       |
| jsonwebtoken | JWT Authentication |
| joi          | Validasi request   |
| multer       | Upload file        |
| axios        | HTTP client        |

---

# ⚠️ Catatan

- Pastikan PostgreSQL aktif sebelum menjalankan server.
- Pastikan environment variable sudah sesuai.
- Endpoint tertentu membutuhkan Authorization Bearer Token.
- Integrasi AI menggunakan layanan FastAPI eksternal.

---

# 👨‍💻 Contributor

SPPG Capstone Team

---

# 📄 License

ISC License
