"""Integração com o yt-dlp: metadados (com cache curto) e conversão para MP3."""

from __future__ import annotations

import copy
import logging
import shutil
import threading
import time
from pathlib import Path
from typing import Any

import yt_dlp
from yt_dlp.utils import DownloadCancelled, DownloadError

from .config import settings
from .errors import AppError, app_error, from_ytdlp_exception
from .jobs import registry
from .validators import canonical_url

log = logging.getLogger(__name__)

# Recorta a capa no centro em formato quadrado (padrão de capa de álbum).
_SQUARE_COVER = (
    "ThumbnailsConvertor+FFmpeg_o:-c:v mjpeg -qmin 1 -qscale:v 1 "
    "-vf crop=\"'if(gt(ih,iw),iw,ih)':'if(gt(iw,ih),ih,iw)'\""
)


class _YtdlpLogger:
    """Encaminha a saída do yt-dlp para o logging do Python."""

    def debug(self, msg: str) -> None:
        log.debug(msg)

    def info(self, msg: str) -> None:
        log.debug(msg)

    def warning(self, msg: str) -> None:
        log.warning(msg)

    def error(self, msg: str) -> None:
        log.error(msg)


def _base_args() -> list[str]:
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
    return args


def _build_opts(args: list[str]) -> dict[str, Any]:
    opts = yt_dlp.parse_options(args).ydl_opts
    opts["logger"] = _YtdlpLogger()
    return opts


# ---------------------------------------------------------------------------
# Metadados
# ---------------------------------------------------------------------------

_info_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_info_lock = threading.Lock()


def fetch_info(video_id: str) -> dict[str, Any]:
    """Extrai (ou reaproveita do cache) o info dict do yt-dlp e valida as restrições."""
    now = time.monotonic()
    with _info_lock:
        cached = _info_cache.get(video_id)
    if cached and now - cached[0] < settings.info_cache_ttl:
        info = cached[1]
    else:
        try:
            with yt_dlp.YoutubeDL(_build_opts(_base_args())) as ydl:
                info = ydl.extract_info(canonical_url(video_id), download=False)
        except DownloadError as exc:
            raise from_ytdlp_exception(exc) from exc
        if not info:
            raise app_error("UNAVAILABLE")
        with _info_lock:
            _info_cache[video_id] = (now, info)

    _validate(info)
    return info


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
        for key in [k for k, (ts, _) in _info_cache.items() if now - ts >= settings.info_cache_ttl]:
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

def _download_args(job_dir: str) -> list[str]:
    return _base_args() + [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", f"{settings.audio_bitrate}K",
        "--embed-metadata",
        "--embed-thumbnail",
        "--convert-thumbnails", "jpg",
        "--postprocessor-args", _SQUARE_COVER,
        "--output", f"{job_dir}/audio.%(ext)s",
    ]


_DOWNLOAD_ATTEMPTS = 3


def _is_forbidden(exc: BaseException) -> bool:
    return "http error 403" in str(exc).lower()


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
        opts = _build_opts(_download_args(str(job_dir)))
        opts["progress_hooks"] = [progress_hook]
        opts["postprocessor_hooks"] = [postprocessor_hook]

        for attempt in range(1, _DOWNLOAD_ATTEMPTS + 1):
            info = fetch_info(job.video_id)
            registry.update(job_id, status="extracting", progress=0.0)
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    ydl.process_ie_result(copy.deepcopy(info), download=True)
                break
            except DownloadError as exc:
                # O YouTube às vezes invalida a URL de mídia (HTTP 403). Uma nova
                # extração costuma trazer URLs válidas, então tentamos de novo.
                if attempt < _DOWNLOAD_ATTEMPTS and _is_forbidden(exc):
                    check_cancelled()
                    log.warning("job %s: HTTP 403 no download (tentativa %d), reextraindo", job_id, attempt)
                    invalidate_info(job.video_id)
                    _clear_dir(job_dir)
                    continue
                raise

        check_cancelled()
        mp3 = next(job_dir.glob("*.mp3"), None)
        if mp3 is None:
            raise app_error("UNKNOWN", "A conversão terminou, mas o arquivo MP3 não foi gerado.")

        registry.update(job_id, status="ready", file_path=mp3, size=mp3.stat().st_size)
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
