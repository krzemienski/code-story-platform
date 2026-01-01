#!/bin/bash
# Code Story Backend - Server Startup Script
# Loads environment from parent directory and starts FastAPI

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$BACKEND_DIR")"

cd "$BACKEND_DIR"

# Source virtual environment
source venv/bin/activate

# Load environment variables from project root
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
    # Read env file line by line, handling comments and empty lines
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Export the variable
        export "$line"
    done < "$ENV_FILE"
    echo "✅ Environment loaded from $ENV_FILE"
else
    echo "❌ No .env file found at $ENV_FILE"
    exit 1
fi

# Start the server
echo "🚀 Starting Code Story Backend at http://localhost:8000"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
