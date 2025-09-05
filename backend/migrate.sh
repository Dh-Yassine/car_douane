#!/usr/bin/env bash
set -e

echo "[migrate] Running migrations..."
python manage.py migrate --noinput

echo "[migrate] Starting gunicorn..."
exec gunicorn douane_project.wsgi --log-file -
