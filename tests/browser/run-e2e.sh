#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="${TEST_DATABASE_URL:?TEST_DATABASE_URL must be set}"
export PYTHONPATH=/app/backend

cleanup() {
  kill "${backend_pid:-}" "${frontend_pid:-}" 2>/dev/null || true
}
trap cleanup EXIT

cd /app/backend
python3 /app/tests/browser/reset_test_database.py
python3 -m migrate upgrade
uvicorn main:app --host 127.0.0.1 --port 8000 > /tmp/lingvar-backend.log 2>&1 &
backend_pid=$!

cd /app/frontend
npm run dev -- --hostname 127.0.0.1 --port 8087 > /tmp/lingvar-frontend.log 2>&1 &
frontend_pid=$!

for attempt in $(seq 1 60); do
  if curl --fail --silent http://localhost:8000/api/health >/dev/null \
    && curl --fail --silent http://localhost:8087/login >/dev/null; then
    npm exec playwright test
    exit 0
  fi
  sleep 1
done

cat /tmp/lingvar-backend.log /tmp/lingvar-frontend.log >&2
exit 1
