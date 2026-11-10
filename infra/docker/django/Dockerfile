# ── Django / Celery Dockerfile ─────────────────────────────────────────────────
# Multi-stage: development (with dev deps) → production (lean)
# ─────────────────────────────────────────────────────────────────────────────

# ── Base stage ────────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS base

LABEL maintainer="Lahore Fashion ERP <dev@lahorefashion.com>"

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # PostgreSQL client
    libpq-dev \
    # WeasyPrint deps
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 \
    libffi-dev shared-mime-info \
    # OpenCV / pyzbar
    libzbar0 libzbar-dev \
    # Image processing
    libjpeg-dev libpng-dev libwebp-dev \
    # Misc
    curl git gettext \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Create non-root user
RUN groupadd -r lfapp && useradd -r -g lfapp lfapp

# ── Development stage ──────────────────────────────────────────────────────────
FROM base AS development

COPY requirements/base.txt requirements/dev.txt ./requirements/
RUN pip install -r requirements/dev.txt

# Create log and static directories
RUN mkdir -p /app/logs /app/staticfiles /app/mediafiles && \
    chown -R lfapp:lfapp /app

COPY --chown=lfapp:lfapp . .

USER lfapp

EXPOSE 8000

# ── Production stage ───────────────────────────────────────────────────────────
FROM base AS production

COPY requirements/base.txt requirements/prod.txt ./requirements/
RUN pip install -r requirements/prod.txt

RUN mkdir -p /app/logs /app/staticfiles /app/mediafiles && \
    chown -R lfapp:lfapp /app

COPY --chown=lfapp:lfapp . .

USER lfapp

EXPOSE 8000

CMD ["gunicorn", "config.asgi:application", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "4", \
     "-b", "0.0.0.0:8000", \
     "--timeout", "120"]
