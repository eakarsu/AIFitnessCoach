#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
if [ ! -f .env ]; then echo "Missing .env; copy .env.example." >&2; exit 1; fi
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]] || continue
  key="${BASH_REMATCH[1]}"; value="${BASH_REMATCH[2]}"
  if [[ "$value" == \"*\" && "$value" == *\" ]] || [[ "$value" == \'*\' && "$value" == *\' ]]; then value="${value:1:${#value}-2}"; fi
  [[ -n "${!key+x}" ]] || export "$key=$value"
done < .env
: "${JWT_SECRET:?JWT_SECRET required}"; if [ "${#JWT_SECRET}" -lt 32 ]; then echo "JWT_SECRET must be 32+ characters." >&2; exit 1; fi
if [ ! -d node_modules ] || [ ! -d client/node_modules ]; then echo "Run scripts/bootstrap.sh explicitly." >&2; exit 1; fi
BACKEND_PORT="${BACKEND_PORT:-${PORT:-3001}}"; PORT="$BACKEND_PORT"; FRONTEND_PORT="${FRONTEND_PORT:-3000}"; CLIENT_URL="${CLIENT_URL:-http://127.0.0.1:$FRONTEND_PORT}"; REACT_APP_API_PROXY="${REACT_APP_API_PROXY:-http://127.0.0.1:$BACKEND_PORT}"; export BACKEND_PORT PORT FRONTEND_PORT CLIENT_URL REACT_APP_API_PROXY; for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do if command -v lsof >/dev/null && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is in use." >&2; exit 1; fi; done
node server/index.js & B=$!; (cd client && PORT="$FRONTEND_PORT" BROWSER=none npm start) & F=$!; cleanup(){ kill "$B" "$F" 2>/dev/null || true; }; trap cleanup EXIT INT TERM; wait
