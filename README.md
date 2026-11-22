# PlaylistMP3

Aplicação web minimalista: cole o link de um vídeo do YouTube e baixe o áudio em **MP3 320 kbps**, com título, artista e capa embutidos.

- Aceita somente vídeos do YouTube: `youtube.com/watch?v=…`, `youtu.be/…` e `youtube.com/shorts/…`
- Sem login, sem histórico, sem banco de dados
- Os arquivos ficam em RAM (tmpfs) e são apagados logo após o download

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS 4, Lucide |
| Backend | Python 3.12, FastAPI, yt-dlp, ffmpeg, Deno (resolve os desafios JS do YouTube) |
| Infra | Docker Compose (nginx serve o SPA e faz proxy de `/api`) |

## Como rodar

```bash
cp .env.example .env            # opcional: todas as variáveis têm padrão
docker compose up -d --build    # http://localhost:8080
```

### Desenvolvimento (hot-reload)

```bash
docker compose -f docker-compose.dev.yml up --build
# Frontend (Vite): http://localhost:5173
# API + Swagger:   http://localhost:8000/api/docs
```

Testes do backend:

```bash
docker compose -f docker-compose.dev.yml exec backend python -m pytest -q
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status e versão do yt-dlp |
| `POST` | `/api/info` `{url}` | Valida a URL e devolve título, canal, duração, thumbnail e tamanho estimado |
| `POST` | `/api/convert` `{url}` | Cria um job de conversão (202) e devolve o `id` |
| `GET` | `/api/jobs/{id}` | Status: `queued` → `extracting` (com %) → `converting` → `ready` ou `error` |
| `DELETE` | `/api/jobs/{id}` | Cancela o job ou descarta o arquivo |
| `GET` | `/api/download/{id}` | Entrega o MP3 e o apaga em seguida (download único) |

Os erros vêm como `{code, message}`, com estes códigos: `INVALID_URL`, `PRIVATE`, `UNAVAILABLE`, `AGE_RESTRICTED`, `MEMBERS_ONLY`, `LIVE`, `TOO_LONG`, `BLOCKED`, `NETWORK`, `NOT_FOUND`, `EXPIRED` e `UNKNOWN`.

## Limpeza dos arquivos temporários

1. **Após o download:** uma `BackgroundTask` apaga o diretório do job assim que a resposta termina.
2. **Cancelamento:** os botões "Cancelar" e "Converter outro vídeo", e também fechar a aba, enviam um `DELETE` ao servidor.
3. **Varredura periódica** (`CLEANUP_INTERVAL`): remove MP3 não baixados há mais de `FILE_TTL` e diretórios órfãos.
4. **Startup e shutdown:** o diretório temporário é esvaziado por completo.
5. **tmpfs:** os arquivos vivem em RAM, com limite definido por `TMPFS_SIZE`, e nunca tocam o disco.

## Quando o YouTube bloquear

Os sintomas são HTTP 403 ou a mensagem "Sign in to confirm you're not a bot".

1. **Atualize o yt-dlp.** Isso resolve a maioria dos casos:
   ```bash
   YTDLP_VERSION=latest docker compose build --no-cache backend && docker compose up -d
   ```
   Também é possível usar `nightly` ou fixar uma versão no `.env`.
2. **Ative o provedor de PO token** ([bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)). Para isso, descomente estas linhas no `.env`:
   ```
   COMPOSE_PROFILES=pot
   POT_PROVIDER_URL=http://pot-provider:4416
   ```
   e rode `docker compose up -d`.

O backend já tenta novamente, até 3 vezes, quando o download recebe HTTP 403, e a cada tentativa refaz a extração dos metadados.

## Configuração (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `APP_PORT` | `8080` | Porta do app em produção |
| `YTDLP_VERSION` | `2026.10.26` | Versão do yt-dlp (`latest` / `nightly` aceitos) |
| `MAX_DURATION` | `7200` | Duração máxima do vídeo, em segundos |
| `AUDIO_BITRATE` | `320` | Bitrate do MP3 (CBR, em kbps) |
| `MAX_CONCURRENT_JOBS` | `2` | Conversões simultâneas |
| `FILE_TTL` | `1800` | Segundos até um MP3 não baixado ser apagado |
| `CLEANUP_INTERVAL` | `300` | Intervalo da rotina de limpeza, em segundos |
| `TMPFS_SIZE` | `1g` | Tamanho máximo do diretório temporário em RAM |
| `LOG_LEVEL` | `INFO` | Nível de log do backend |

> O estado dos jobs vive em memória, por isso o backend roda com **1 worker** do uvicorn.

---

Projeto de laboratório para uso pessoal. Converta apenas conteúdos que você tem o direito de baixar.
