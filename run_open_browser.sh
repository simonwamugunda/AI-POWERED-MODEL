#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5000}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}/"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="${PYTHON:-python3}"

# Prefer the project environment so the server uses the dependencies installed
# for this application instead of whichever Python happens to be on PATH.
if [[ -x "$PROJECT_DIR/venv/bin/python" ]]; then
  PYTHON="$PROJECT_DIR/venv/bin/python"
fi

if ! "$PYTHON" -c 'import flask' >/dev/null 2>&1; then
  echo "Flask is not installed for $PYTHON." >&2
  echo "Install the project dependencies with: $PYTHON -m pip install -r \"$PROJECT_DIR/requirements.txt\"" >&2
  exit 1
fi

# Start Flask in background
cd "$PROJECT_DIR"
PORT="$PORT" "$PYTHON" -u app.py &
SERVER_PID=$!

# Wait for server
for _ in $(seq 1 60); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Try to open browser (best-effort)
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
fi

echo "Server running on $URL (PID: $SERVER_PID)"
wait "$SERVER_PID"

