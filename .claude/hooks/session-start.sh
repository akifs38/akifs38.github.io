#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "==> Installing npm dependencies..."
npm install

# Point Playwright to the pre-installed browsers in this environment
echo "export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers" >> "${CLAUDE_ENV_FILE:-/dev/null}"

echo "==> Setup complete."
