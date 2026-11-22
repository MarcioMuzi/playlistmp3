"""Configuração via variáveis de ambiente (ver .env.example na raiz)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    return int(raw) if raw else default


@dataclass(frozen=True)
class Settings:
    temp_dir: Path = Path(os.getenv("TEMP_DIR", "/tmp/playlistmp3"))
    max_duration: int = _int("MAX_DURATION", 7200)  # segundos
    file_ttl: int = _int("FILE_TTL", 1800)  # segundos até um job/arquivo órfão ser removido
    cleanup_interval: int = _int("CLEANUP_INTERVAL", 300)  # segundos entre varreduras
    audio_bitrate: int = _int("AUDIO_BITRATE", 320)  # kbps, CBR
    max_concurrent_jobs: int = _int("MAX_CONCURRENT_JOBS", 2)
    info_cache_ttl: int = _int("INFO_CACHE_TTL", 600)  # segundos
    pot_provider_url: str = os.getenv("POT_PROVIDER_URL", "").strip()
    # Conta do YouTube (opcional), via cookies: off | fallback | always
    youtube_auth_mode: str = os.getenv("YOUTUBE_AUTH_MODE", "fallback").strip().lower() or "fallback"
    youtube_cookies_file: str = os.getenv("YOUTUBE_COOKIES_FILE", "").strip() or "youtube-cookies.txt"
    secrets_dir: Path = Path(os.getenv("SECRETS_DIR", "/secrets"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()


settings = Settings()
