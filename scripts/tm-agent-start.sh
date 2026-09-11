#!/usr/bin/env bash
# Persistent Token Monitor agent for desktop autostart: watches opencode +
# antigravity data dirs and posts to the hub on change (config from repo .env).
# Restarts the agent if it ever exits.
set -u
export PATH="/home/edith/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin"

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="/tmp/tm-agent.log"

exec 9>/tmp/tm-agent.lock
flock -n 9 || exit 0   # another agent starter is already running

cd "$REPO" || exit 1
while true; do
  echo "$(date -Is) tm-agent: start" >>"$LOG"
  npm run agent >>"$LOG" 2>&1
  rc=$?
  echo "$(date -Is) tm-agent: exit=$rc, restart in 10s" >>"$LOG"
  sleep 10
done
