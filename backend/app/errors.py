"""Erros da aplicação e tradução de falhas do yt-dlp em mensagens amigáveis."""

from __future__ import annotations


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code

    def to_dict(self) -> dict[str, str]:
        return {"code": self.code, "message": self.message}


MESSAGES: dict[str, tuple[str, int]] = {
    "INVALID_URL": ("Este link não é de um vídeo do YouTube. Use um link do tipo youtube.com/watch?v=…, youtu.be/… ou youtube.com/shorts/…", 400),
    "PRIVATE": ("Este vídeo é privado e não pode ser convertido.", 422),
    "UNAVAILABLE": ("Este vídeo está indisponível. Ele pode ter sido removido ou estar bloqueado na sua região.", 422),
    "AGE_RESTRICTED": ("Este vídeo tem restrição de idade e não pode ser convertido sem login.", 422),
    "MEMBERS_ONLY": ("Este vídeo é exclusivo para membros do canal.", 422),
    "LIVE": ("Transmissões ao vivo e estreias ainda não iniciadas não são suportadas.", 422),
    "TOO_LONG": ("Este vídeo é longo demais para ser convertido.", 422),
    "BLOCKED": ("O YouTube bloqueou temporariamente as requisições deste servidor. Tente novamente em alguns minutos.", 503),
    "NETWORK": ("Não foi possível falar com o YouTube. Verifique a conexão e tente novamente.", 502),
    "NOT_FOUND": ("Conversão não encontrada. Ela pode ter expirado.", 404),
    "NOT_READY": ("O arquivo ainda não está pronto.", 409),
    "EXPIRED": ("Este arquivo já foi baixado ou expirou. Converta o vídeo novamente.", 410),
    "UNKNOWN": ("Ocorreu um erro inesperado ao processar o vídeo. Tente novamente.", 500),
}


def app_error(code: str, message: str | None = None) -> AppError:
    default_message, status = MESSAGES.get(code, MESSAGES["UNKNOWN"])
    return AppError(code, message or default_message, status)


# Ordem importa: o primeiro padrão encontrado vence.
_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("BLOCKED", ("not a bot", "http error 429", "too many requests", "http error 403")),
    ("AGE_RESTRICTED", ("confirm your age", "age-restricted", "age restricted", "inappropriate for some users")),
    ("PRIVATE", ("private video", "video is private")),
    ("MEMBERS_ONLY", ("members-only", "members only", "join this channel")),
    ("LIVE", ("live event will begin", "premieres in", "is_live", "this live event")),
    ("UNAVAILABLE", (
        "video unavailable", "not available", "has been removed", "account associated with this video has been terminated",
        "copyright", "blocked it in your country", "not made this video available in your country", "does not exist",
    )),
    ("NETWORK", (
        "timed out", "timeout", "connection", "name or service not known", "temporary failure in name resolution",
        "network is unreachable", "urlopen error", "http error 5", "unable to download webpage",
    )),
]


def classify_ytdlp_error(message: str) -> str:
    text = (message or "").lower()
    for code, needles in _PATTERNS:
        if any(n in text for n in needles):
            return code
    return "UNKNOWN"


def from_ytdlp_exception(exc: BaseException) -> AppError:
    return app_error(classify_ytdlp_error(str(exc)))
