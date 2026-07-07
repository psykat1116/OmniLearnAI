#!/usr/bin/env bash
# Installs (if needed), starts, and provisions Ollama with the models
# backend/main.py expects. Run this on whichever machine has the GPU.
#
# Usage:
#   ./run_ollama.sh
#
# Env overrides:
#   OLLAMA_TEXT_MODEL, OLLAMA_VISION_MODEL   which models to pull
#   OLLAMA_HOST                              bind address (default 0.0.0.0:11434
#                                               so a backend on another machine can reach it)

set -euo pipefail

TEXT_MODEL="${OLLAMA_TEXT_MODEL:-qwen2.5:7b-instruct}"
VISION_MODEL="${OLLAMA_VISION_MODEL:-qwen2.5vl:3b}"

export OLLAMA_HOST="${OLLAMA_HOST:-0.0.0.0:11434}"
PORT="${OLLAMA_HOST##*:}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/ollama.pid"
LOG_FILE="$SCRIPT_DIR/ollama.log"

if ! command -v ollama &> /dev/null; then
    echo "Ollama not found installing..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

if curl -sf "http://127.0.0.1:${PORT}/api/tags" > /dev/null 2>&1; then
    echo "Ollama is already running on port $PORT."
else
    echo "Starting Ollama server (OLLAMA_HOST=$OLLAMA_HOST)..."
    nohup ollama serve > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    echo "Waiting for it to come up..."
    until curl -sf "http://127.0.0.1:${PORT}/api/tags" > /dev/null 2>&1; do
        sleep 1
    done
fi

echo "Pulling models (first run downloads several GB be patient)..."
ollama pull "$TEXT_MODEL"
ollama pull "$VISION_MODEL"

cat <<EOF

Ready. Models available:
$(ollama list)

Point the backend at this server with:
  OLLAMA_BASE_URL=http://<this-host-ip>:${PORT}/v1

EOF

if [ -f "$PID_FILE" ]; then
    echo "Stop the server this script started with: kill \$(cat $PID_FILE)"
fi
