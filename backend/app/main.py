"""PlaylistMP3 — API FastAPI (stateless, sem banco de dados)."""

from __future__ import annotations

import asyncio
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Any

import yt_dlp
from fastapi import BackgroundTasks, FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from .cleanup import cleanup_loop, purge_temp_dir, remove_job_files
from .config import settings
from .converter import fetch_info, run_job, summarize
from .errors import AppError, app_error
from .jobs import ACTIVE_STATUSES, registry
from .validators import extract_video_id

logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("playlistmp3")

executor = ThreadPoolExecutor(max_workers=settings.max_concurrent_jobs, thread_name_prefix="convert")


@asynccontextmanager
async def lifespan(_: FastAPI):
    purge_temp_dir()
    task = asyncio.create_task(cleanup_loop())
    log.info(
        "PlaylistMP3 pronto (yt-dlp %s, %d kbps, limite %ds, POT provider: %s)",
        yt_dlp.version.__version__, settings.audio_bitrate, settings.max_duration,
        settings.pot_provider_url or "desativado",
    )
    try:
        yield
    finally:
        task.cancel()
        for job in registry.snapshot():
            registry.update(job.id, cancelled=True)
        executor.shutdown(wait=False, cancel_futures=True)
        purge_temp_dir()


app = FastAPI(
    title="PlaylistMP3 API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)


@app.exception_handler(AppError)
async def _app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@app.exception_handler(RequestValidationError)
async def _validation_handler(_: Request, __: RequestValidationError) -> JSONResponse:
    err = app_error("INVALID_URL")
    return JSONResponse(status_code=err.status_code, content=err.to_dict())


class UrlIn(BaseModel):
    url: str = Field(..., max_length=2048)


_JOB_ID = re.compile(r"^[A-Za-z0-9_-]{10,64}$")


def _video_id_or_400(url: str) -> str:
    video_id = extract_video_id(url)
    if not video_id:
        raise app_error("INVALID_URL")
    return video_id


def _job_or_404(job_id: str):
    job = registry.get(job_id) if _JOB_ID.match(job_id) else None
    if job is None:
        raise app_error("NOT_FOUND")
    return job


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "yt_dlp": yt_dlp.version.__version__}


@app.post("/api/info")
def video_info(body: UrlIn) -> dict[str, Any]:
    """Valida a URL e devolve os metadados do vídeo, sem baixar nada."""
    video_id = _video_id_or_400(body.url)
    return summarize(fetch_info(video_id))


@app.post("/api/convert", status_code=202)
def convert(body: UrlIn) -> dict[str, Any]:
    """Cria um job de conversão e o executa em segundo plano."""
    video_id = _video_id_or_400(body.url)
    info = fetch_info(video_id)  # reaproveita o cache do /api/info e valida limites
    job = registry.create(video_id, summarize(info))
    executor.submit(run_job, job.id)
    return job.public()


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str) -> dict[str, Any]:
    _job_or_404(job_id)
    data = registry.public(job_id)
    if data is None:
        raise app_error("NOT_FOUND")
    return data


@app.delete("/api/jobs/{job_id}", status_code=204)
def cancel_job(job_id: str) -> Response:
    """Cancela um job em andamento ou descarta um arquivo não baixado."""
    job = _job_or_404(job_id)
    if job.status in ACTIVE_STATUSES:
        registry.update(job_id, cancelled=True)  # a thread remove o job ao perceber
    else:
        registry.remove(job_id)
        remove_job_files(job_id)
    return Response(status_code=204)


@app.get("/api/download/{job_id}")
def download(job_id: str, background_tasks: BackgroundTasks) -> FileResponse:
    """Entrega o MP3 e apaga o arquivo assim que a resposta termina."""
    job = _job_or_404(job_id)
    if job.status == "downloaded":
        raise app_error("EXPIRED")
    if job.status != "ready" or job.file_path is None:
        raise app_error("NOT_READY")
    if not job.file_path.exists():
        registry.remove(job_id)
        raise app_error("EXPIRED")

    registry.update(job_id, status="downloaded")

    def _cleanup() -> None:
        registry.remove(job_id)
        remove_job_files(job_id)
        log.info("job %s baixado e removido", job_id)

    background_tasks.add_task(_cleanup)
    return FileResponse(
        job.file_path,
        media_type="audio/mpeg",
        filename=safe_filename(job.video.get("title", "")),
        background=background_tasks,
    )


def safe_filename(title: str) -> str:
    name = re.sub(r'[\\/:*?"<>|\x00-\x1f\x7f]+', " ", title or "")
    name = re.sub(r"\s+", " ", name).strip(" .")[:150].strip()
    return f"{name or 'audio'}.mp3"
