#!/usr/bin/env bash
set -e

echo "[startup] Running migrations..."
python manage.py migrate --noinput

# Import data if data/ exists (from backend directory)
if [ -d "./data" ]; then
  echo "[startup] Importing JSON listings from ./data..."
  python manage.py import_data --data-dir "./data" || true
elif [ -d "../data" ]; then
  echo "[startup] Importing JSON listings from ../data..."
  python manage.py import_data --data-dir "../data" || true
else
  echo "[startup] No data directory found. Skipping import."
fi

echo "[startup] Starting gunicorn..."
exec gunicorn douane_project.wsgi --log-file -


