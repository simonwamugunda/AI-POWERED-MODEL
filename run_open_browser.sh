#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5000}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}/"

# Start Flask in background
PORT="$PORT" python3 -u app.py &
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

