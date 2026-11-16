#!/usr/bin/env bash
set -e
cd /home/sumit/.gemini/antigravity/scratch/pulse-trade-india/backend
exec .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
