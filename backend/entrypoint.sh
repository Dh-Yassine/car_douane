#!/usr/bin/env bash
set -e

# Ensure we are in backend dir
cd "$(dirname "$0")"

echo "[startup] Running migrations..."
python manage.py migrate --noinput

# Import data if data/ exists
if [ -d "../data" ] || [ -d "./data" ]; then
  DATA_DIR="../data"
  if [ -d "./data" ]; then
    DATA_DIR="./data"
  fi
  echo "[startup] Importing JSON listings from ${DATA_DIR}..."
  python manage.py import_data --data-dir "$DATA_DIR" || true
else
  echo "[startup] No data/ directory found. Skipping import."
fi

echo "[startup] Starting gunicorn..."
exec gunicorn douane_project.wsgi --log-file -


