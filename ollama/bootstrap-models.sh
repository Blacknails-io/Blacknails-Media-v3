#!/usr/bin/env bash
set -euo pipefail

MODEL_DIR="${BLACKNAILS_MODELFILE_DIR:-/blacknails-ollama/modelfiles}"
OLLAMA_HOST_URL="${OLLAMA_HOST_URL:-http://127.0.0.1:11434}"

prepare_rocm_links() {
  mkdir -p /opt/rocm/lib
  if [ -d /opt/shared-rocm-venv/lib/python3.12/site-packages/_rocm_sdk_core/lib ]; then
    ln -sf /opt/shared-rocm-venv/lib/python3.12/site-packages/_rocm_sdk_core/lib/* /opt/rocm/lib/ || true
  fi
  if [ -d /opt/shared-rocm-venv/lib/python3.12/site-packages/_rocm_sdk_libraries_gfx110X_all/lib ]; then
    ln -sf /opt/shared-rocm-venv/lib/python3.12/site-packages/_rocm_sdk_libraries_gfx110X_all/lib/* /opt/rocm/lib/ || true
  fi
  for f in /opt/rocm/lib/*.so.*; do
    [ -e "$f" ] || continue
    ln -sf "$f" "${f%%.so.*}.so" || true
  done
}

wait_for_ollama() {
  for _ in $(seq 1 120); do
    if curl -fsS "$OLLAMA_HOST_URL/api/tags" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for Ollama at $OLLAMA_HOST_URL" >&2
  return 1
}

model_exists() {
  local model="$1"
  ollama list | awk 'NR > 1 {print $1}' | grep -Eq "^${model}(:latest)?$"
}

create_if_missing() {
  local model="$1"
  local file="$2"
  if model_exists "$model"; then
    echo "[blacknails-ollama] Model $model already exists."
    return 0
  fi
  echo "[blacknails-ollama] Creating $model from $file..."
  ollama create "$model" -f "$file"
}

prepare_rocm_links
ollama serve &
OLLAMA_PID="$!"
trap 'kill "$OLLAMA_PID" 2>/dev/null || true' INT TERM

wait_for_ollama
create_if_missing blacknails-vision "$MODEL_DIR/blacknails-vision.Modelfile"
create_if_missing blacknails-text "$MODEL_DIR/blacknails-text.Modelfile"

wait "$OLLAMA_PID"
