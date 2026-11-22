"""Integração com o yt-dlp: metadados (com cache curto) e conversão para MP3.

Fluxo de autenticação (ver auth.py):
  - off:      sempre anônimo.
  - fallback: anônimo primeiro; se o YouTube bloquear (BLOCKED) ou exigir idade
              (AGE_RESTRICTED), repete com os cookies da conta configurada.
  - always:   sempre com a conta (quando os cookies são válidos).
Os detalhes de autenticação ficam apenas nos logs; a interface só vê "retrying".
"""

from __future__ import annotations

import copy
import logging
import shutil
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

import yt_dlp
from yt_dlp.utils import DownloadCancelled, DownloadError

from . import auth
from .config import settings
from .errors import AppError, app_error, classify_ytdlp_error, from_ytdlp_exception
from .jobs import registry
from .validators import canonical_url

log = logging.getLogger(__name__)

# Recorta a capa no centro em formato quadrado (padrão de capa de álbum).
_SQUARE_COVER = (
    "ThumbnailsConvertor+FFmpeg_o:-c:v mjpeg -qmin 1 -qscale:v 1 "
    "-vf crop=\"'if(gt(ih,iw),iw,ih)':'if(gt(iw,ih),ih,iw)'\""
)

# Erros que uma sessão logada pode resolver.
AUTH_FALLBACK_CODES = {"BLOCKED", "AGE_RESTRICTED"}


class _YtdlpLogger:
    """Encaminha a saída do yt-dlp para o logging do Python."""

    def debug(self, msg: str) -> None:
        log.debug(msg)

    def info(self, msg: str) -> None:
        log.debug(msg)

    def warning(self, msg: str) -> None:
        if "cookies are no longer valid" in msg.lower():
            log.error(
                "os cookies da conta do YouTube expiraram ou foram rotacionados; "
                "exporte um novo cookies.txt (ver README, seção 'Conta do YouTube')"
            )
            return
        log.warning(msg)

    def error(self, msg: str) -> None:
        log.error(msg)


def _base_args(cookie_file: Path | None = None) -> list[str]:
    args = [
        "--format", "bestaudio/best",
        "--no-playlist",
        "--socket-timeout", "30",
        "--retries", "3",
        "--quiet",
        "--no-progress",
    ]
    if settings.pot_provider_url:
        args += ["--extractor-args", f"youtubepot-bgutilhttp:base_url={settings.pot_provider_url}"]
    if cookie_file is not None:
        args += ["--cookies", str(cookie_file)]
    return args


def _build_opts(args: list[str]) -> dict[str, Any]:
    opts = yt_dlp.parse_options(args).ydl_opts
    opts["logger"] = _YtdlpLogger()
    return opts


@contextmanager
def _cookies(use_auth: bool, directory: Path) -> Iterator[Path | None]:
    if not use_auth:
        yield None
        return
    with auth.cookie_copy(directory) as path:
        yield path


# ---------------------------------------------------------------------------
# Metadados
# ---------------------------------------------------------------------------

# video_id -> (timestamp, info, extraído com a conta?)
_info_cache: dict[str, tuple[float, dict[str, Any], bool]] = {}
_info_lock = threading.Lock()


def _extract(video_id: str, use_auth: bool) -> dict[str, Any]:
    try:
        with _cookies(use_auth, settings.temp_dir) as cookie_file:
            with yt_dlp.YoutubeDL(_build_opts(_base_args(cookie_file))) as ydl:
                info = ydl.extract_info(canonical_url(video_id), download=False)
    except DownloadError as exc:
        raise from_ytdlp_exception(exc) from exc
    if not info:
        raise app_error("UNAVAILABLE")
    return info


def resolve_info(video_id: str, use_auth: bool | None = None) -> tuple[dict[str, Any], bool]:
    """Devolve (info, usou_conta), validando as restrições.

    use_auth=None decide sozinho (cache + modo de autenticação); True/False força a
    extração nova naquele modo (usado nas novas tentativas do download).
    """
    now = time.monotonic()
    if use_auth is None:
        with _info_lock:
            cached = _info_cache.get(video_id)
        if cached and now - cached[0] < settings.info_cache_ttl:
            _validate(cached[1])
            return cached[1], cached[2]

    if use_auth is None:
        can_auth = auth.available()
        if can_auth and auth.mode() == "always":
            info, used_auth = _extract(video_id, True), True
        else:
            try:
                info, used_auth = _extract(video_id, False), False
            except AppError as exc:
                if not (exc.code in AUTH_FALLBACK_CODES and can_auth and auth.mode() == "fallback"):
                    raise
                log.info("vídeo %s: %s na tentativa anônima; repetindo com a conta configurada", video_id, exc.code)
                info, used_auth = _extract(video_id, True), True
    else:
        info, used_auth = _extract(video_id, use_auth), use_auth

    with _info_lock:
        _info_cache[video_id] = (now, info, used_auth)
    _validate(info)
    return info, used_auth


def fetch_info(video_id: str) -> dict[str, Any]:
    return resolve_info(video_id)[0]


def _validate(info: dict[str, Any]) -> None:
    if info.get("_type", "video") != "video":
        raise app_error("INVALID_URL")
    if info.get("live_status") in {"is_live", "is_upcoming"}:
        raise app_error("LIVE")
    duration = info.get("duration")
    if not duration:
        raise app_error("UNAVAILABLE")
    if duration > settings.max_duration:
        limit = _format_duration(settings.max_duration)
        raise app_error("TOO_LONG", f"Este vídeo é longo demais. O limite é de {limit}.")


def invalidate_info(video_id: str) -> None:
    with _info_lock:
        _info_cache.pop(video_id, None)


def purge_info_cache() -> None:
    now = time.monotonic()
    with _info_lock:
        for key in [k for k, (ts, _, _) in _info_cache.items() if now - ts >= settings.info_cache_ttl]:
            del _info_cache[key]


def estimated_size(duration: float | int | None) -> int | None:
    if not duration:
        return None
    # CBR: tamanho ≈ duração × bitrate. Somamos ~60 KB de capa + tags ID3.
    return int(duration * settings.audio_bitrate * 1000 / 8) + 60_000


def summarize(info: dict[str, Any]) -> dict[str, Any]:
    video_id = info.get("id")
    return {
        "video_id": video_id,
        "title": info.get("title") or "Sem título",
        "uploader": info.get("channel") or info.get("uploader") or "",
        "duration": info.get("duration"),
        "thumbnail": info.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
        "estimated_size": estimated_size(info.get("duration")),
        "bitrate": settings.audio_bitrate,
    }


def _format_duration(seconds: int) -> str:
    h, rem = divmod(int(seconds), 3600)
    m = rem // 60
    if h and m:
        return f"{h}h{m:02d}min"
    if h:
        return f"{h} hora" if h == 1 else f"{h} horas"
    return f"{m} minutos"


# ---------------------------------------------------------------------------
# Conversão (executada em thread do pool)
# ---------------------------------------------------------------------------

def _download_args(job_dir: Path, cookie_file: Path | None) -> list[str]:
    return _base_args(cookie_file) + [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", f"{settings.audio_bitrate}K",
        "--embed-metadata",
        "--embed-thumbnail",
        "--convert-thumbnails", "jpg",
        "--postprocessor-args", _SQUARE_COVER,
        "--output", f"{job_dir}/audio.%(ext)s",
    ]


def attempt_plan(started_with_auth: bool, mode: str, can_auth: bool) -> list[bool]:
    """Sequência de tentativas de download: True = com a conta, False = anônima.

    O HTTP 403 costuma ser intermitente, então cada modo ganha duas tentativas
    (cada uma com extração nova dos metadados).
    """
    if not can_auth or mode == "off":
        return [False, False, False]
    if started_with_auth or mode == "always":
        return [True, True]
    return [False, False, True, True]


def _error_code(exc: BaseException) -> str:
    return exc.code if isinstance(exc, AppError) else classify_ytdlp_error(str(exc))


def _next_attempt(plan: list[bool], index: int, code: str) -> int | None:
    """Índice da próxima tentativa útil para o erro, ou None para desistir."""
    if code == "BLOCKED":
        return index + 1 if index + 1 < len(plan) else None
    if code in AUTH_FALLBACK_CODES:  # só uma sessão logada resolve
        return next((i for i in range(index + 1, len(plan)) if plan[i]), None)
    return None


def _clear_dir(path: Path) -> None:
    for child in path.iterdir():
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)
        else:
            child.unlink(missing_ok=True)


def run_job(job_id: str) -> None:
    job = registry.get(job_id)
    if job is None or job.cancelled:
        return

    job_dir = settings.temp_dir / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    succeeded = False

    def check_cancelled() -> None:
        current = registry.get(job_id)
        if current is None or current.cancelled:
            raise DownloadCancelled("cancelado pelo usuário")

    def progress_hook(d: dict[str, Any]) -> None:
        check_cancelled()
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            if total:
                registry.update(job_id, status="extracting", progress=min(d.get("downloaded_bytes", 0) / total, 1.0))
        elif d.get("status") == "finished":
            registry.update(job_id, status="converting", progress=1.0)

    def postprocessor_hook(d: dict[str, Any]) -> None:
        check_cancelled()
        if d.get("status") == "started":
            registry.update(job_id, status="converting", progress=1.0)

    try:
        _, started_with_auth = resolve_info(job.video_id)
        plan = attempt_plan(started_with_auth, auth.mode(), auth.available())

        index = 0
        while True:
            use_auth = plan[index]
            try:
                info, _ = resolve_info(job.video_id) if index == 0 else resolve_info(job.video_id, use_auth)
                registry.update(job_id, status="extracting", progress=0.0)
                with _cookies(use_auth, job_dir) as cookie_file:
                    opts = _build_opts(_download_args(job_dir, cookie_file))
                    opts["progress_hooks"] = [progress_hook]
                    opts["postprocessor_hooks"] = [postprocessor_hook]
                    with yt_dlp.YoutubeDL(opts) as ydl:
                        ydl.process_ie_result(copy.deepcopy(info), download=True)
                if use_auth:
                    log.info("job %s: download concluído com a conta configurada", job_id)
                break
            except (DownloadError, AppError) as exc:
                code = _error_code(exc)
                nxt = _next_attempt(plan, index, code)
                if nxt is None:
                    raise
                check_cancelled()
                log.warning(
                    "job %s: %s na tentativa %d (%s); nova tentativa %s",
                    job_id, code, index + 1, "com conta" if use_auth else "anônima",
                    "com conta" if plan[nxt] else "anônima",
                )
                invalidate_info(job.video_id)
                _clear_dir(job_dir)
                registry.update(job_id, retrying=True, status="extracting", progress=0.0)
                index = nxt

        check_cancelled()
        mp3 = next(job_dir.glob("*.mp3"), None)
        if mp3 is None:
            raise app_error("UNKNOWN", "A conversão terminou, mas o arquivo MP3 não foi gerado.")

        registry.update(job_id, status="ready", retrying=False, file_path=mp3, size=mp3.stat().st_size)
        succeeded = True
        log.info("job %s pronto: %s (%d bytes)", job_id, job.video_id, mp3.stat().st_size)
    except DownloadCancelled:
        log.info("job %s cancelado", job_id)
    except AppError as exc:
        registry.fail(job_id, exc)
    except DownloadError as exc:
        log.warning("job %s falhou: %s", job_id, exc)
        registry.fail(job_id, from_ytdlp_exception(exc))
    except Exception:  # noqa: BLE001 - qualquer falha vira erro amigável no card
        log.exception("job %s: erro inesperado", job_id)
        registry.fail(job_id, app_error("UNKNOWN"))
    finally:
        if not succeeded:
            shutil.rmtree(job_dir, ignore_errors=True)
        current = registry.get(job_id)
        if current is not None and current.cancelled:
            registry.remove(job_id)
            shutil.rmtree(job_dir, ignore_errors=True)
