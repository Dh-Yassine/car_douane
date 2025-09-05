#!/usr/bin/env bash
set -e

echo "[start] Starting with SQLite database..."
echo "[start] Running migrations..."
python manage.py migrate --noinput

echo "[start] Starting gunicorn..."
exec gunicorn douane_project.wsgi --log-file -
