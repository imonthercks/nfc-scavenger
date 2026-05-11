#!/usr/bin/env bash
set -euo pipefail

# Simple local server for testing the static `hunt` site.
# Usage: ./serve.sh [PORT]

PORT=${1:-8000}
DIR="hunt"

if command -v python3 >/dev/null 2>&1; then
  echo "Serving $DIR on http://localhost:$PORT/ (Ctrl-C to stop)"
  python3 -m http.server "$PORT" --directory "$DIR"
elif command -v python >/dev/null 2>&1; then
  echo "Serving $DIR on http://localhost:$PORT/ (Ctrl-C to stop)"
  python -m http.server "$PORT" --directory "$DIR"
else
  echo "Error: Python is required. Install Python 3 or run 'npx http-server hunt'."
  exit 1
fi
