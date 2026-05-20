# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ libffi-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy installed packages dari builder
COPY --from=builder /install /usr/local

# Copy source code & artefak model
COPY main.py .
COPY sppg_model.keras .
COPY scaler.pkl .
COPY le_prov.pkl .
COPY y_log_max.pkl .

# Port yang akan di-expose
EXPOSE 8080

# Health check bawaan Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

# Jalankan dengan Uvicorn — 1 worker cukup untuk model ML (GIL-safe)
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--workers", "1", \
     "--timeout-keep-alive", "75"]
