'use strict';

// Antigravity CLI session dates from the conversation database files.
//
// Tokscale exposes no timestamps on its antigravity-cli session rows, so the
// session-date fallback stays empty for this client. Each CLI conversation is
// one `<uuid>.db` SQLite file under ~/.gemini/antigravity-cli/conversations/,
// and the session id tokscale reports is that uuid — so the freshest sibling
// mtime (*.db plus its -wal/-shm sidecars, since WAL mode delays main-file
// writes) approximates last activity, and the file birthtime approximates
// creation. Day-granularity only; never parsed content, only stats.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function cliConversationsDir(home = os.homedir()) {
  return path.join(home, '.gemini', 'antigravity-cli', 'conversations');
}

function statMtimeMs(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return Number.isFinite(stat.mtimeMs) ? stat.mtimeMs : 0;
  } catch (_) {
    return 0;
  }
}

function conversationActivity(dbPath) {
  // Only the main database file (plus a rollback journal when present) carries
  // per-conversation timing. The -wal/-shm sidecars are touched globally —
  // one CLI-wide checkpoint/reopen updates every conversation at once — so
  // they would stamp every session with the same minute.
  const mtimes = ['', '-journal']
    .map((suffix) => statMtimeMs(dbPath + suffix))
    .filter((mtimeMs) => mtimeMs > 0);
  if (mtimes.length === 0) return null;
  return Math.max(...mtimes);
}

function resolveSessionMetadata(sessionIds, context) {
  const home = context?.home || os.homedir();
  const dir = cliConversationsDir(home);
  const result = new Map();
  for (const sessionId of sessionIds) {
    const base = String(sessionId || '').trim();
    if (!base || base.includes('/') || base.includes('\\') || base.includes('\0')) continue;
    const dbPath = path.join(dir, `${base}.db`);
    const lastMs = conversationActivity(dbPath);
    if (!lastMs) continue;
    const meta = { lastUsedAt: new Date(lastMs).toISOString() };
    let birthMs;
    try { birthMs = fs.statSync(dbPath).birthtimeMs; } catch (_) { birthMs = 0; }
    if (birthMs > 0 && birthMs <= lastMs) meta.startedAt = new Date(birthMs).toISOString();
    result.set(sessionId, meta);
  }
  return result;
}

module.exports = {
  cliConversationsDir,
  resolveSessionMetadata
};
