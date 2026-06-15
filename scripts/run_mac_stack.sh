#!/usr/bin/env bash
set -e

BINARY_MACOS="builds/app/vinyl-orchestrator-macos-arm64"
PORT=57988

cleanup() {
    echo ""
    echo "Stopping dev environment stack..."
    
    if [ -n "$FLUTTER_PID" ]; then
        kill "$FLUTTER_PID" >/dev/null 2>&1 || true
    fi
    
    if [ -n "$ORCH_PID" ]; then
        kill "$ORCH_PID" >/dev/null 2>&1 || true
    fi
    
    pkill -P $$ >/dev/null 2>&1 || true

    PORT_PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
    if [ -n "$PORT_PIDS" ]; then
        kill $PORT_PIDS >/dev/null 2>&1 || true
    fi
    
    pkill -f 'chrome.*--remote-debugging-port' >/dev/null 2>&1 || true
}

trap 'cleanup; exit 130' INT TERM
trap 'cleanup' EXIT

PORT_PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
if [ -n "$PORT_PIDS" ]; then
    echo "Port $PORT is currently in use. Clearing stale processes: $PORT_PIDS"
    kill $PORT_PIDS >/dev/null 2>&1 || true
fi

export VINYL_DATABASE_PATH="$PWD/builds/data/vinyl.db"
./"$BINARY_MACOS" &
ORCH_PID=$!
echo "Started orchestrator engine (pid $ORCH_PID)"

FLUTTER_BIN_DETECTED="$FLUTTER_BIN"

if [ -z "$FLUTTER_BIN_DETECTED" ]; then
    FLUTTER_BIN_DETECTED=$(/bin/zsh -lc 'command -v flutter 2>/dev/null || true')
fi

if [ -z "$FLUTTER_BIN_DETECTED" ] && [ -x "$HOME/flutter/bin/flutter" ]; then
    FLUTTER_BIN_DETECTED="$HOME/flutter/bin/flutter"
fi

if [ -z "$FLUTTER_BIN_DETECTED" ] && [ -x "$HOME/Code Projects/flutter/bin/flutter" ]; then
    FLUTTER_BIN_DETECTED="$HOME/Code Projects/flutter/bin/flutter"
fi

if [ -z "$FLUTTER_BIN_DETECTED" ]; then
    echo "Error: flutter CLI binary not found."
    echo "Please declare it explicitly using: make run-mac-stack FLUTTER_BIN=\"/path/to/flutter\""
    exit 127
fi

echo "Using system flutter binary: $FLUTTER_BIN_DETECTED"

mkdir -p .tmp/chrome-dev-profile
cd web_app && "$FLUTTER_BIN_DETECTED" run -d chrome \
    --web-browser-flag "--disable-web-security" \
    --web-browser-flag "--user-data-dir=$PWD/../.tmp/chrome-dev-profile" \
    --web-port $PORT