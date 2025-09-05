#!/usr/bin/env bash
set -e

echo "[start] Starting gunicorn without migrations..."
exec gunicorn douane_project.wsgi --log-file -
