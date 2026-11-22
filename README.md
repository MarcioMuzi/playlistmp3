# PlaylistMP3

Aplicação web minimalista: cole o link de um vídeo do YouTube e baixe o áudio em **MP3 320 kbps**, com título, artista e capa embutidos.

- Aceita somente vídeos do YouTube: `youtube.com/watch?v=…`, `youtu.be/…` e `youtube.com/shorts/…`
- Sem cadastro, sem histórico e sem banco de dados
- Roda no seu computador, e os arquivos são apagados do servidor logo após o download

![Tela do PlaylistMP3 com um MP3 pronto para download](docs/screenshot-pronto.png)

> Projeto educacional, para uso pessoal. Leia o [aviso legal](#aviso-legal) antes de usar.

**Sumário:** [Instalação passo a passo](#instalação-passo-a-passo) · [Uso no dia a dia](#uso-no-dia-a-dia) · [Problemas comuns](#problemas-comuns) · [Para desenvolvedores](#para-desenvolvedores) · [Aviso legal](#aviso-legal) · [Licença](#licença)

---

## Instalação passo a passo

Você não precisa saber programar. São três etapas: instalar um programa (o **Docker Desktop**), baixar este projeto e rodar **um único comando**.

**Você vai precisar de:**
- Windows 10 ou 11 (64 bits), macOS ou Linux
- Cerca de **3 GB livres** em disco
- Internet. A primeira instalação baixa cerca de 1 GB.

### 1. Instale o Docker Desktop

O Docker é o programa que roda o PlaylistMP3 sem você precisar instalar Python, Node.js, ffmpeg etc.

- **Windows:** baixe em [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/) e execute o instalador. Mantenha marcada a opção **"Use WSL 2"** e reinicie o computador se ele pedir.
- **Mac:** baixe em [Docker Desktop para Mac](https://docs.docker.com/desktop/setup/install/mac-install/). Escolha a versão do seu processador: **Apple Silicon** (M1, M2…) ou **Intel**.
- **Linux:** instale o [Docker Engine](https://docs.docker.com/engine/install/) com o plugin `docker compose`.

Depois de instalar, **abra o Docker Desktop** e espere até ele indicar que está rodando ("Engine running"). No Windows e no Mac, ele precisa estar aberto sempre que você for usar o PlaylistMP3.

### 2. Baixe o projeto

Escolha **uma** das opções:

- **Sem Git (mais simples):** nesta página do GitHub, clique no botão verde **Code** e depois em **Download ZIP**. Extraia o arquivo: no Windows, clique com o botão direito e escolha **Extrair tudo**. Vai surgir uma pasta chamada `playlistmp3-main`.
- **Com Git:**
  ```bash
  git clone https://github.com/MarcioMuzi/playlistmp3.git
  ```

### 3. Abra um terminal dentro da pasta do projeto

O terminal precisa estar **dentro da pasta** que contém o arquivo `docker-compose.yml`.

- **Windows 11:** abra a pasta no Explorador de Arquivos, clique com o botão direito num espaço vazio e escolha **Abrir no Terminal**.
- **Windows 10:** abra a pasta, segure **Shift**, clique com o botão direito num espaço vazio e escolha **Abrir janela do PowerShell aqui**.
- **Mac:** abra o app **Terminal**, digite `cd ` (com um espaço no final), arraste a pasta do projeto para dentro da janela do Terminal e aperte **Enter**.
- **Linux:** clique com o botão direito dentro da pasta e escolha **Abrir no terminal**.

Para conferir se está no lugar certo, digite `dir` (Windows) ou `ls` (Mac/Linux) e aperte Enter. O arquivo `docker-compose.yml` deve aparecer na lista.

### 4. Inicie o PlaylistMP3

Copie o comando abaixo, cole no terminal e aperte **Enter**:

```bash
docker compose up -d --build
```

Na **primeira vez**, o Docker baixa e monta tudo, o que leva **de 3 a 10 minutos**, dependendo da sua internet. Ele termina quando o terminal mostra linhas com `Started` e volta a aceitar comandos. Das próximas vezes, a inicialização leva poucos segundos.

### 5. Abra no navegador

Acesse **[http://localhost:8080](http://localhost:8080)**, cole o link de um vídeo do YouTube e clique em **Converter**. Quando terminar, clique em **Baixar MP3**: o arquivo vai para a pasta de downloads do seu navegador.

Pronto! 🎉

---

## Uso no dia a dia

Rode os comandos abaixo num terminal aberto **na pasta do projeto** (veja o [passo 3](#3-abra-um-terminal-dentro-da-pasta-do-projeto)). No Windows e no Mac, o Docker Desktop precisa estar aberto.

| O que fazer | Comando |
|---|---|
| **Desligar** o PlaylistMP3 | `docker compose down` |
| **Ligar** de novo | `docker compose up -d` |
| **Atualizar** para a versão mais nova do projeto | Baixe o ZIP de novo (ou rode `git pull`) e depois `docker compose up -d --build` |
| **Atualizar só o yt-dlp**, quando as conversões começarem a falhar | Veja [Quando o YouTube bloquear](#quando-o-youtube-bloquear) |

> Se você não desligar com `docker compose down`, o PlaylistMP3 volta sozinho sempre que o Docker Desktop for aberto.

---

## Problemas comuns

| O que aparece | Como resolver |
|---|---|
| `'docker' não é reconhecido…` ou `docker: command not found` | O Docker não está instalado, ou o terminal foi aberto antes da instalação. Feche o terminal e abra de novo. Se persistir, refaça o [passo 1](#1-instale-o-docker-desktop). |
| `Cannot connect to the Docker daemon` ou `error during connect` | O Docker Desktop está fechado. Abra o Docker Desktop, espere ficar pronto e rode o comando de novo. |
| `no configuration file provided: not found` | O terminal não está na pasta do projeto. Refaça o [passo 3](#3-abra-um-terminal-dentro-da-pasta-do-projeto). |
| `port is already allocated` ou `ports are not available` | Outro programa está usando a porta 8080. Na pasta do projeto, crie um arquivo chamado `.env`, com ponto no início, contendo a linha `APP_PORT=8081`. No Bloco de Notas, escolha "Todos os arquivos" ao salvar. Rode `docker compose up -d` e acesse `http://localhost:8081`. |
| O navegador diz que **não consegue acessar** `localhost:8080` | Espere alguns segundos e recarregue a página. Confira com `docker compose ps`: os dois serviços devem aparecer como `Up`. |
| **WSL 2 installation is incomplete** (Windows) | Abra o PowerShell como administrador, rode `wsl --update` e reinicie o computador. |
| O app mostra **"O YouTube recusou a requisição"** | O YouTube bloqueou temporariamente. Tente de novo em alguns minutos. Se continuar, atualize o yt-dlp (veja [Quando o YouTube bloquear](#quando-o-youtube-bloquear)). |

---

## Para desenvolvedores

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS 4, Lucide |
| Backend | Python 3.12, FastAPI, yt-dlp, ffmpeg, Deno (resolve os desafios JS do YouTube) |
| Infra | Docker Compose (nginx serve o SPA e faz proxy de `/api`) |

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

### API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status e versão do yt-dlp |
| `POST` | `/api/info` `{url}` | Valida a URL e devolve título, canal, duração, thumbnail e tamanho estimado |
| `POST` | `/api/convert` `{url}` | Cria um job de conversão (202) e devolve o `id` |
| `GET` | `/api/jobs/{id}` | Status: `queued` → `extracting` (com %) → `converting` → `ready` ou `error` |
| `DELETE` | `/api/jobs/{id}` | Cancela o job ou descarta o arquivo |
| `GET` | `/api/download/{id}` | Entrega o MP3 e o apaga em seguida (download único) |

Os erros vêm como `{code, message}`, com estes códigos: `INVALID_URL`, `PRIVATE`, `UNAVAILABLE`, `AGE_RESTRICTED`, `MEMBERS_ONLY`, `LIVE`, `TOO_LONG`, `BLOCKED`, `NETWORK`, `NOT_FOUND`, `EXPIRED` e `UNKNOWN`.

### Limpeza dos arquivos temporários

1. **Após o download:** uma `BackgroundTask` apaga o diretório do job assim que a resposta termina.
2. **Cancelamento:** os botões "Cancelar" e "Outro vídeo", e também fechar a aba, enviam um `DELETE` ao servidor.
3. **Varredura periódica** (`CLEANUP_INTERVAL`): remove MP3 não baixados há mais de `FILE_TTL` e diretórios órfãos.
4. **Startup e shutdown:** o diretório temporário é esvaziado por completo.
5. **tmpfs:** os arquivos vivem em RAM, com limite definido por `TMPFS_SIZE`, e nunca tocam o disco.

### Segurança

- **Acesso só local por padrão:** a porta escuta em `127.0.0.1`. Para usar de outro aparelho na mesma rede, defina `APP_BIND=0.0.0.0` no `.env`. Não há login nem limite de uso, então só faça isso em redes de confiança.
- **Links:** o link informado nunca é repassado ao yt-dlp. O backend extrai só o ID de 11 caracteres e monta ele mesmo a URL `youtube.com/watch?v=ID`. Isso bloqueia outras plataformas, playlists, endereços internos e tentativas de injeção.
- **Sem shell:** o yt-dlp é chamado pela API Python, e os argumentos do ffmpeg são fixos. Os nomes de arquivo são sanitizados e os IDs de download são aleatórios (128 bits).
- **Navegador:** o nginx envia `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`. A API só aceita JSON, o que impede outros sites de dispararem conversões na sua máquina (CSRF).
- **Containers:** o backend roda sem root, os segredos são montados somente leitura e os arquivos temporários ficam em RAM.

### Configuração (`.env`)

Todas as variáveis são opcionais. Para personalizar, copie `.env.example` para `.env`.

| Variável | Padrão | Descrição |
|---|---|---|
| `APP_PORT` | `8080` | Porta do app |
| `APP_BIND` | `127.0.0.1` | Quem acessa: `127.0.0.1` só este computador; `0.0.0.0` libera para a rede local (sem login: use só em redes de confiança) |
| `YTDLP_VERSION` | `2026.10.26` | Versão do yt-dlp (`latest` / `nightly` aceitos) |
| `MAX_DURATION` | `7200` | Duração máxima do vídeo, em segundos |
| `AUDIO_BITRATE` | `320` | Bitrate do MP3 (CBR, em kbps) |
| `MAX_CONCURRENT_JOBS` | `2` | Conversões simultâneas |
| `FILE_TTL` | `1800` | Segundos até um MP3 não baixado ser apagado |
| `CLEANUP_INTERVAL` | `300` | Intervalo da rotina de limpeza, em segundos |
| `TMPFS_SIZE` | `1g` | Tamanho máximo do diretório temporário em RAM |
| `LOG_LEVEL` | `INFO` | Nível de log do backend |
| `YOUTUBE_AUTH_MODE` | `fallback` | Uso da conta do YouTube: `fallback`, `always` ou `off` |
| `YOUTUBE_COOKIES_FILE` | `youtube-cookies.txt` | Nome do arquivo de cookies dentro de `./secrets/` |

> O estado dos jobs vive em memória, por isso o backend roda com **1 worker** do uvicorn.

### Quando o YouTube bloquear

Os sintomas são HTTP 403 ou a mensagem "Sign in to confirm you're not a bot".

1. **Atualize o yt-dlp.** Isso resolve a maioria dos casos:
   ```bash
   YTDLP_VERSION=latest docker compose build --no-cache backend && docker compose up -d
   ```
   No PowerShell (Windows), use:
   ```powershell
   $env:YTDLP_VERSION="latest"; docker compose build --no-cache backend; docker compose up -d
   ```
   Também é possível usar `nightly` ou fixar uma versão no `.env`.
2. **Ative o provedor de PO token** ([bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)). Para isso, coloque no `.env`:
   ```
   COMPOSE_PROFILES=pot
   POT_PROVIDER_URL=http://pot-provider:4416
   ```
   e rode `docker compose up -d`.
3. **Configure uma conta do YouTube** (veja a próxima seção). O backend passa a usá-la automaticamente quando a tentativa anônima é bloqueada.

O backend já tenta novamente quando o download recebe HTTP 403, e a cada tentativa refaz a extração dos metadados. Sem conta configurada são até 3 tentativas anônimas. Com conta, no modo `fallback`, são 2 anônimas seguidas de 2 com a conta.

### Conta do YouTube (opcional)

O backend pode usar uma conta do YouTube como **plano B** quando o YouTube bloqueia a tentativa anônima (HTTP 403 ou "not a bot") ou quando o vídeo tem restrição de idade.

> **Não existe login com usuário e senha.** O yt-dlp não aceita mais esse tipo de login no YouTube, e o OAuth também foi removido. A única forma suportada é um arquivo `cookies.txt` com a sessão logada, exportado do navegador. Por isso nenhuma senha vai para o `.env`.

**Qual conta usar.** O código não depende da conta: ele só lê o `cookies.txt` configurado.

| Conta | Vantagens | Riscos |
|---|---|---|
| **YouTube Premium** | Dispensa PO token e dá acesso a áudio de maior bitrate (~256 kbps) | Baixar fora do app viola os termos do YouTube, e a conta que você paga pode ser sinalizada ou suspensa |
| **Secundária gratuita** | Protege a conta principal | Não tem os benefícios do Premium |

**Modos** (`YOUTUBE_AUTH_MODE` no `.env`):

| Modo | Comportamento |
|---|---|
| `fallback` (padrão) | Tenta anônimo primeiro e usa a conta só quando o YouTube bloqueia ou exige idade |
| `always` | Usa a conta em todas as conversões, com mais qualidade e mais exposição da conta |
| `off` | Nunca usa a conta |

Sem o arquivo de cookies, o app funciona normalmente no modo anônimo. Os detalhes de autenticação aparecem **só nos logs do backend**: a interface e a API não revelam que existe uma conta configurada. Durante uma nova tentativa, a interface mostra apenas "Tentando rota alternativa…".

#### 1. Exportar os cookies (janela anônima)

Siga este procedimento para os cookies não serem invalidados ("rotacionados") pelo próprio navegador logo depois:

1. Abra uma **janela anônima** e faça login no YouTube com a conta escolhida.
2. Nessa mesma aba, acesse `https://www.youtube.com/robots.txt`.
3. Exporte os cookies de `youtube.com` no formato **Netscape**. Uma opção é a extensão [Get cookies.txt LOCALLY](https://github.com/kairi003/Get-cookies.txt-LOCALLY), que precisa estar liberada para a janela anônima. Evite extensões de origem duvidosa, porque esse arquivo dá acesso à sua conta.
4. **Feche a janela anônima** sem sair da conta. Se você clicar em "Sair", a sessão é invalidada.

Detalhes no wiki do yt-dlp: [Exporting YouTube cookies](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies).

#### 2. Instalar o arquivo

O backend lê o arquivo em `./secrets/` (pasta fora do Git, montada **somente leitura** no container) com o nome definido em `YOUTUBE_COOKIES_FILE` (padrão: `youtube-cookies.txt`).

**Windows ou Mac (Docker Desktop):** mova o arquivo exportado para a pasta `secrets` do projeto e renomeie-o para `youtube-cookies.txt`. Não deixe cópias na pasta de downloads.

**Linux / WSL2:** o container roda com **UID 1000**, por isso o arquivo precisa ser legível por esse usuário:

```bash
# exemplo no WSL2: o navegador salvou em Downloads do Windows; ajuste o caminho
cp /mnt/c/Users/<seu-usuario>/Downloads/youtube-cookies.txt ./secrets/youtube-cookies.txt
chmod 600 ./secrets/youtube-cookies.txt
rm /mnt/c/Users/<seu-usuario>/Downloads/youtube-cookies.txt   # não deixe cópias soltas
```

No Linux/WSL o seu usuário costuma ter UID 1000. Confira com `id -u`.

**VPS:**

```bash
# na sua máquina
scp youtube-cookies.txt usuario@sua-vps:/caminho/do/playlistmp3/secrets/youtube-cookies.txt

# na VPS
cd /caminho/do/playlistmp3
sudo chown 1000:1000 secrets secrets/youtube-cookies.txt
chmod 700 secrets
chmod 600 secrets/youtube-cookies.txt
```

#### 3. Atualizar quando expirar

Os cookies duram de semanas a meses. Quando expiram, o log do backend mostra uma mensagem como `os cookies da conta do YouTube expiraram ou foram rotacionados`. Para renovar, basta **repetir os passos 1 e 2 sobrescrevendo o arquivo**. Não é preciso rebuild nem restart, porque o arquivo é lido a cada conversão.

Para conferir o status:

```bash
docker compose logs backend | grep -iE "conta do youtube|autentica|cookies"
```

Na inicialização aparece, por exemplo, `conta do YouTube: modo fallback, cookies de sessão encontrados (youtube-cookies.txt)`. O conteúdo dos cookies nunca é registrado.

**Segurança:**
- O `.env`, a pasta `secrets/` e qualquer arquivo `*cookies*.txt` estão no `.gitignore`.
- A cada uso, o backend trabalha numa cópia temporária em RAM (`chmod 600`), apagada logo em seguida. O arquivo original nunca é alterado.
- Se o arquivo vazar, saia da conta em todos os dispositivos (Conta do Google → Segurança). Isso invalida os cookies.

---

## Aviso legal

Este é um projeto **educacional e de uso pessoal**, criado como laboratório de desenvolvimento. Ele **não tem vínculo** com o YouTube nem com o Google, e não é endossado por eles. "YouTube" é marca registrada da Google LLC.

- Use o PlaylistMP3 apenas com conteúdos que **você tem o direito de baixar**: obras próprias, conteúdo em domínio público, conteúdo sob licenças que permitam download ou casos autorizados pelo titular dos direitos.
- Baixar conteúdo do YouTube pode violar os [Termos de Serviço do YouTube](https://www.youtube.com/t/terms) e as leis de direitos autorais do seu país. **A responsabilidade pelo uso é inteiramente de quem usa.**
- O projeto não hospeda, não armazena e não distribui conteúdo. Os arquivos gerados ficam temporariamente na máquina de quem roda a aplicação e são apagados logo após o download.
- O software é fornecido "como está", sem garantias de nenhum tipo (veja a [licença](LICENSE)).

## Licença

Distribuído sob a licença [MIT](LICENSE). © 2026 Marcio Muzi.
