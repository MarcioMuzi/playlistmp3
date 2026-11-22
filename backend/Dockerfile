# syntax=docker/dockerfile:1

# yt-dlp precisa de um runtime JavaScript (Deno) para resolver os desafios do YouTube.
FROM denoland/deno:bin-2.9.8 AS deno

FROM python:3.12-slim AS base

# Versão do yt-dlp: fixe uma versão (ex.: 2026.10.26), ou use "latest" / "nightly".
ARG YTDLP_VERSION=2026.10.26

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deno /deno /usr/local/bin/deno

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade "pip>=26.2" \
    && pip install -r requirements.txt \
    && case "$YTDLP_VERSION" in \
         latest)  pip install -U "yt-dlp[default]" ;; \
         nightly) pip install -U --pre "yt-dlp[default]" ;; \
         *)       pip install "yt-dlp[default]==${YTDLP_VERSION}" ;; \
       esac

RUN useradd --create-home --uid 1000 app \
    && mkdir -p /tmp/playlistmp3 && chown app:app /tmp/playlistmp3

# ---------- desenvolvimento (hot-reload + pytest) ----------
FROM base AS dev
COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt
USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "app"]

# ---------- produção ----------
FROM base AS prod
COPY app ./app
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=4)"
# 1 worker: o estado dos jobs vive em memória.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers"]
