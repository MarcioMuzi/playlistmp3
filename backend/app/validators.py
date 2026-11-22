"""Validação estrita de URLs do YouTube.

Aceita apenas:
  - youtube.com/watch?v=ID  (hosts www., m. e music. incluídos)
  - youtu.be/ID
  - youtube.com/shorts/ID

A URL informada nunca é repassada ao yt-dlp: extraímos o ID e montamos a URL
canônica, o que impede playlists, outras plataformas e parâmetros arbitrários.
"""

from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

_VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
_YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"}
_SHORT_HOSTS = {"youtu.be", "www.youtu.be"}


def extract_video_id(url: str) -> str | None:
    """Retorna o ID de 11 caracteres do vídeo, ou None se a URL não for aceita."""
    if not isinstance(url, str):
        return None
    url = url.strip()
    if not url or len(url) > 2048:
        return None
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        url = "https://" + url

    try:
        parsed = urlparse(url)
    except ValueError:
        return None

    if parsed.scheme not in {"http", "https"}:
        return None
    host = (parsed.hostname or "").lower()
    path = parsed.path

    candidate: str | None = None
    if host in _SHORT_HOSTS:
        candidate = path.lstrip("/").split("/")[0]
    elif host in _YOUTUBE_HOSTS:
        if path.rstrip("/") == "/watch":
            values = parse_qs(parsed.query).get("v")
            candidate = values[0] if values else None
        elif path.startswith("/shorts/"):
            candidate = path[len("/shorts/"):].split("/")[0]

    if candidate and _VIDEO_ID.match(candidate):
        return candidate
    return None


def canonical_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"
