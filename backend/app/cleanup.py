"""Limpeza de arquivos temporários.

Camadas de proteção contra lixo no tmpfs:
  1. Após o download: BackgroundTask em main.py apaga o diretório do job.
  2. Varredura periódica (este módulo): remove jobs finalizados há mais de FILE_TTL,
     jobs travados e diretórios sem job correspondente.
  3. Startup/shutdown: o diretório temporário é esvaziado por completo.
"""

from __future__ import annotations

import asyncio
import logging
import shutil
import time
from pathlib import Path

from .config import settings
from .converter import purge_info_cache
from .jobs import ACTIVE_STATUSES, registry

log = logging.getLogger(__name__)

_ORPHAN_GRACE_SECONDS = 60


def remove_job_files(job_id: str) -> None:
    shutil.rmtree(settings.temp_dir / job_id, ignore_errors=True)


def purge_temp_dir() -> None:
    settings.temp_dir.mkdir(parents=True, exist_ok=True)
    for child in settings.temp_dir.iterdir():
        _remove_path(child)


def sweep() -> None:
    now = time.monotonic()
    removed = 0

    for job in registry.snapshot():
        age_since_update = now - job.updated_at
        age = now - job.created_at
        expired_final = job.status not in ACTIVE_STATUSES and age_since_update > settings.file_ttl
        stuck = job.status in ACTIVE_STATUSES and age > settings.file_ttl * 4
        if expired_final:
            registry.remove(job.id)
            remove_job_files(job.id)
            removed += 1
        elif stuck:
            # A thread de conversão verá a flag no próximo hook e encerrará o job.
            registry.update(job.id, cancelled=True)
            log.warning("job %s marcado como travado e cancelado", job.id)

    known = registry.ids()
    wall_now = time.time()
    if settings.temp_dir.exists():
        for child in settings.temp_dir.iterdir():
            if child.name in known:
                continue
            try:
                old_enough = wall_now - child.stat().st_mtime > _ORPHAN_GRACE_SECONDS
            except FileNotFoundError:
                continue
            if old_enough:
                _remove_path(child)
                removed += 1

    purge_info_cache()
    if removed:
        log.info("limpeza: %d item(ns) removido(s)", removed)


async def cleanup_loop() -> None:
    while True:
        await asyncio.sleep(settings.cleanup_interval)
        try:
            await asyncio.to_thread(sweep)
        except Exception:  # noqa: BLE001 - a rotina nunca deve morrer
            log.exception("falha na rotina de limpeza")


def _remove_path(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path, ignore_errors=True)
    else:
        path.unlink(missing_ok=True)
