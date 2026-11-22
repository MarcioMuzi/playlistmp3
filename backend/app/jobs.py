"""Registro de jobs de conversão em memória (sem banco de dados).

Exige um único processo uvicorn (1 worker): o estado vive na memória deste processo.
"""

from __future__ import annotations

import secrets
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .errors import AppError

ACTIVE_STATUSES = {"queued", "extracting", "converting"}
FINAL_STATUSES = {"ready", "error", "downloaded"}


@dataclass
class Job:
    id: str
    video_id: str
    video: dict[str, Any]
    status: str = "queued"
    progress: float = 0.0  # 0.0 a 1.0, referente ao download do áudio
    error: AppError | None = None
    file_path: Path | None = None
    size: int | None = None
    cancelled: bool = False
    created_at: float = field(default_factory=time.monotonic)
    updated_at: float = field(default_factory=time.monotonic)

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "status": self.status,
            "progress": round(self.progress * 100, 1),
            "video": self.video,
            "size": self.size,
            "download_url": f"/api/download/{self.id}" if self.status == "ready" else None,
            "error": self.error.to_dict() if self.error else None,
        }


class JobRegistry:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()

    def create(self, video_id: str, video: dict[str, Any]) -> Job:
        job = Job(id=secrets.token_urlsafe(16), video_id=video_id, video=video)
        with self._lock:
            self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.get(job_id)

    def public(self, job_id: str) -> dict[str, Any] | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return job.public() if job else None

    def update(self, job_id: str, **fields: Any) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return
            for key, value in fields.items():
                setattr(job, key, value)
            job.updated_at = time.monotonic()

    def fail(self, job_id: str, error: AppError) -> None:
        self.update(job_id, status="error", error=error, file_path=None)

    def remove(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.pop(job_id, None)

    def ids(self) -> set[str]:
        with self._lock:
            return set(self._jobs)

    def snapshot(self) -> list[Job]:
        with self._lock:
            return list(self._jobs.values())


registry = JobRegistry()
