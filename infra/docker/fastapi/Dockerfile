# ── FastAPI Dockerfile ────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN groupadd -r lfapp && useradd -r -g lfapp lfapp

FROM base AS development
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY --chown=lfapp:lfapp . .
USER lfapp
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

FROM base AS production
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY --chown=lfapp:lfapp . .
USER lfapp
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
