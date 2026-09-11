#!/usr/bin/env bash
# One-shot Token Monitor sync: collect opencode + antigravity usage and post
# it to the hub. Config comes from the repo .env (hub URL, secret, client and
# limits filters). Safe to run from cron — flock prevents overlaps.
set -u
export PATH="/home/edith/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin"

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="/tmp/tm-sync.log"

exec 9>/tmp/tm-sync.lock
flock -n 9 || { echo "$(date -Is) tm-sync: already running, skip" >>"$LOG"; exit 0; }

cd "$REPO" || exit 1
echo "$(date -Is) tm-sync: start" >>"$LOG"
npm run agent:once >>"$LOG" 2>&1
rc=$?
echo "$(date -Is) tm-sync: exit=$rc" >>"$LOG"
# keep log bounded (~2000 lines)
tail -n 2000 "$LOG" >"$LOG.tmp" && mv "$LOG.tmp" "$LOG"
exit $rc
