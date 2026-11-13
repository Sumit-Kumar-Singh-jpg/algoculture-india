#!/usr/bin/env bash
set -e
cd /home/sumit/.gemini/antigravity/scratch/pulse-trade-india/backend
exec .venv/bin/uvicorn app.main:app --reload --port 8000
