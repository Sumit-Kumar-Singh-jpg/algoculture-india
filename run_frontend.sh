#!/usr/bin/env bash
set -e
export PATH="/home/sumit/.gemini/antigravity/scratch/.tools/node-current/bin:$PATH"
cd /home/sumit/.gemini/antigravity/scratch/pulse-trade-india/frontend
exec npm run dev
