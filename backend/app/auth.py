"""Autenticação opcional no YouTube via cookies de sessão.

O yt-dlp não aceita login com usuário e senha no YouTube; a única forma suportada é
um arquivo cookies.txt (formato Netscape) exportado do navegador.

Garantias:
  - O arquivo original fica em uma pasta montada como somente leitura (./secrets).
  - Cada uso trabalha numa cópia privada em RAM (tmpfs), pois o yt-dlp regrava os
    cookies ao terminar; assim jobs simultâneos não disputam o mesmo arquivo.
  - O conteúdo dos cookies nunca é registrado em log nem exposto pela API.
"""

from __future__ import annotations

import logging
import os
import secrets
import shutil
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from .config import settings

log = logging.getLogger(__name__)

VALID_MODES = ("off", "fallback", "always")
# Cookies que indicam uma sessão logada do Google/YouTube.
SESSION_COOKIES = {"SID", "__Secure-1PSID", "__Secure-3PSID", "SAPISID", "__Secure-3PAPISID", "LOGIN_INFO"}

_STATUS_MESSAGES = {
    "ok": "cookies de sessão encontrados",
    "missing": "arquivo de cookies não encontrado",
    "unreadable": "arquivo de cookies sem permissão de leitura (o container roda com UID 1000)",
    "invalid": "o arquivo não contém cookies de sessão do YouTube (exporte logado)",
}

_last_status: str | None = None
_status_lock = threading.Lock()


def mode() -> str:
    value = settings.youtube_auth_mode
    return value if value in VALID_MODES else "fallback"


def cookie_path() -> Path:
    path = Path(settings.youtube_cookies_file)
    return path if path.is_absolute() else settings.secrets_dir / path


def inspect_cookie_file(path: Path) -> str:
    """Classifica o arquivo: ok | missing | unreadable | invalid (sem ler valores)."""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return "missing"
    except (PermissionError, IsADirectoryError):
        return "unreadable"
    except OSError:
        return "unreadable"

    names: set[str] = set()
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("#HttpOnly_"):
            line = line[len("#HttpOnly_"):]
        elif not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) >= 7 and parts[0].lstrip(".").endswith("youtube.com"):
            names.add(parts[5])
    return "ok" if names & SESSION_COOKIES else "invalid"


def available() -> bool:
    """True se o modo permite autenticação e o arquivo de cookies é utilizável.

    Lido a cada chamada: trocar o arquivo em ./secrets vale sem rebuild nem restart.
    """
    if mode() == "off":
        return False
    status = inspect_cookie_file(cookie_path())
    _log_status_change(status)
    return status == "ok"


def describe() -> str:
    """Resumo seguro para o log de inicialização."""
    if settings.youtube_auth_mode not in VALID_MODES:
        log.warning("YOUTUBE_AUTH_MODE=%r inválido; usando 'fallback'", settings.youtube_auth_mode)
    if mode() == "off":
        return "desativada"
    status = inspect_cookie_file(cookie_path())
    return f"modo {mode()}, {_STATUS_MESSAGES[status]} ({cookie_path().name})"


@contextmanager
def cookie_copy(directory: Path) -> Iterator[Path]:
    """Cópia privada e descartável dos cookies (o yt-dlp regrava o arquivo ao sair)."""
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / f".cookies-{secrets.token_hex(8)}.txt"
    try:
        shutil.copyfile(cookie_path(), target)
        os.chmod(target, 0o600)
        yield target
    finally:
        target.unlink(missing_ok=True)


def _log_status_change(status: str) -> None:
    global _last_status
    with _status_lock:
        if status == _last_status:
            return
        _last_status = status
    if status == "ok":
        log.info("autenticação: %s", _STATUS_MESSAGES[status])
    elif status != "missing":
        log.warning("autenticação indisponível: %s", _STATUS_MESSAGES[status])
