# OmniLearn AI

Turn any piece of content — a PDF, a YouTube video, an audio recording, an image, a ZIP of notes, or a Google Drive file/folder — into a structured study guide, an auto-generated quiz, and an AI tutor you can chat with, grounded only in that content.

All inference runs against a locally/departmentally hosted [Ollama](https://ollama.com) server, so there's no per-token API bill and content never leaves your infrastructure.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pieces fit together, in particular the LangGraph agent that drives analysis and chat.

## Features

- **Multi-format ingestion**: PDF, YouTube (via transcript), audio (via Whisper transcription), images (via a local vision model), ZIP archives (text/code files extracted), and Google Drive files/folders.
- **Study guide generation**: a 3-paragraph summary, 3–5 core topics, and 5–10 multiple-choice quiz questions with explanations — produced as structured output from the LLM.
- **Web recommendations**: a DuckDuckGo search for tutorials on each core topic, shown alongside the study guide.
- **AI tutor chat**: ask follow-up questions; answers are grounded strictly in the ingested content plus chat history.
- **Direct upload or URL**: upload a PDF/audio/image file directly, or point at a URL (including YouTube links and Google Drive share links).

## Tech Stack

**Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4.

**Backend** — FastAPI, [LangChain](https://python.langchain.com/) + [LangGraph](https://langchain-ai.github.io/langgraph/) for orchestration, served by a local [Ollama](https://ollama.com) model (default `qwen2.5:7b-instruct` for text, `qwen2.5vl:3b` for vision) via the OpenAI-compatible `langchain-openai` client.

**Content extraction** — PyMuPDF (PDF text), faster-whisper (audio transcription), Ollama vision model (image description), youtube-transcript-api (YouTube transcripts), gdown (Google Drive downloads).

## Prerequisites

- [bun](https://bun.sh) for the frontend
- [conda](https://docs.conda.io/en/latest/miniconda.html) (or another Python 3.11 environment manager) for the backend
- [Ollama](https://ollama.com) running somewhere reachable — locally, or on a GPU box on your network
- `ffmpeg` (installed automatically by `setup_conda_env.sh`, needed by faster-whisper)

## Setup

### 1. Ollama (text + vision models)

```bash
cd backend
./run_ollama.sh
```

This installs Ollama if missing, starts the server, and pulls the default models. If Ollama runs on a different machine than the backend, note the host's IP — you'll need it for `OLLAMA_BASE_URL` below. Override models with `OLLAMA_TEXT_MODEL` / `OLLAMA_VISION_MODEL` env vars if desired.

### 2. Backend (FastAPI)

```bash
cd backend
./setup_conda_env.sh
conda activate omnilearn
```

Create `backend/.env` (see `config.py` for all options):

```bash
OLLAMA_BASE_URL=http://localhost:11434/v1   # or http://<gpu-host-ip>:11434/v1
OLLAMA_TEXT_MODEL=qwen2.5:7b-instruct
OLLAMA_VISION_MODEL=qwen2.5vl:3b
```

Run the API:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend (React + Vite)

```bash
bun install
bun dev
```

The dev server runs on `http://localhost:5173` and expects the backend at `http://localhost:8000` (see `src/api.ts`).

## API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/analyze` | POST | Fetch content from a URL and generate a study guide + recommendations |
| `/api/analyze/upload` | POST | Same as above, for a directly uploaded PDF/audio/image file |
| `/api/chat` | POST | Ask a question about previously analyzed content |
| `/api/health` | GET | Health check |

## Project Structure

```
backend/
  main.py         FastAPI app, CORS, error handlers
  routes.py        /api/analyze, /api/analyze/upload, /api/chat, /api/health
  agent.py         LangGraph agent: study guide generation, web search, chat
  extraction.py    Per-content-type text extraction (PDF/audio/image/YouTube/Drive/ZIP)
  cache.py         In-memory cache of extracted content, keyed by source
  schemas.py       Pydantic request/response + structured-output models
  config.py        Env-driven settings (Ollama URL/models, CORS, content types)

src/
  App.tsx                    Top-level state: active tab, study guide, chat history
  api.ts                     Fetch wrappers for the backend API
  components/
    Sidebar.tsx               Source input (URL or upload) + content type selector
    StudyGuideTab.tsx         Summary, topics, and web recommendations
    QuizTab.tsx               Interactive multiple-choice quiz
    ChatTab.tsx               AI tutor chat UI
    WelcomeScreen.tsx         Empty state before any content is analyzed
```

## Notes

- Uploaded files are cached only in the backend process's memory (keyed by a synthetic `upload:<uuid>` id); a server restart means you'll need to re-upload.
