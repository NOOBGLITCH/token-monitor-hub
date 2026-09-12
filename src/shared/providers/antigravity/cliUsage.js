'use strict';

// Antigravity CLI quota via `agy -p /usage`.
//
// The CLI's /usage slash command prints one row per quota pool, e.g.
//   Gemini Models\tWeekly Limit Remaining\t51%\t2026-09-13T06:15:06Z
// `agy -p` runs that non-interactively (print mode) and exits, so the output
// is captured without an interactive session — the same approach the Kiro
// provider uses for `kiro-cli chat --no-interactive /usage`.
//
// The CLI is only spawned when its OAuth token file exists: without a session
// there is no quota to read, and probing an unsigned-in CLI must never trigger
// an auth flow. A missing binary likewise stays a clean skip, never an error.

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { errorWithStatus } = require('../../limits/providerHelpers');
const { abortError } = require('../../probeDeadline');

const AGY_TIMEOUT_MS = 20000;

// "<pool>  <Weekly|Five Hour> Limit Remaining  <pct>%  <ISO reset>"
const AGY_USAGE_ROW = /^(.*?)\s+(Weekly|Five Hour) Limit Remaining\s+(\d+(?:\.\d+)?)\s*%\s+(\S+)\s*$/;

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

// Known install locations used as a fallback after PATH. The non-Windows
// entries cover Electron's commonly-truncated PATH (same reason the
// Kiro/Claude/Codex probes carry these).
function agyCliCandidates(env = process.env, platform = process.platform) {
  if (env.TOKEN_MONITOR_AGY_COMMAND) return [env.TOKEN_MONITOR_AGY_COMMAND];
  const candidates = [];
  if (platform === 'win32') {
    if (env.LOCALAPPDATA) candidates.push(path.join(env.LOCALAPPDATA, 'Programs', 'agy', 'agy.exe'));
  } else {
    if (env.HOME) candidates.push(path.join(env.HOME, '.local', 'bin', 'agy'));
    candidates.push('/opt/homebrew/bin/agy', '/usr/local/bin/agy', '/usr/bin/agy');
  }
  return uniqueStrings(candidates);
}

function findOnPath(names, env, platform, existsSync) {
  const rawPath = env.PATH || env.Path || '';
  const sep = platform === 'win32' ? ';' : ':';
  for (const dir of rawPath.split(sep).filter(Boolean)) {
    for (const name of names) {
      const full = path.join(dir, name);
      try {
        if (existsSync(full)) return full;
      } catch (_) {
        // Unreadable PATH entry — keep scanning.
      }
    }
  }
  return null;
}

// Resolve agy to an absolute path, or null when it is not installed.
// Filesystem-only (no spawn) so the common "agy not installed" case stays
// cheap and reports a clean skip instead of a spawn error.
function existingAgyCli(env = process.env, platform = process.platform, deps = {}) {
  const existsSync = deps.existsSync || fs.existsSync;
  if (env.TOKEN_MONITOR_AGY_COMMAND) return env.TOKEN_MONITOR_AGY_COMMAND;
  const names = platform === 'win32' ? ['agy.exe', 'agy.cmd', 'agy'] : ['agy'];
  const onPath = findOnPath(names, env, platform, existsSync);
  if (onPath) return onPath;
  for (const candidate of agyCliCandidates(env, platform)) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch (_) {
      // Unreadable candidate — keep scanning.
    }
  }
  return null;
}

function homeDir(env = process.env) {
  return env.HOME || env.USERPROFILE || os.homedir();
}

// The CLI holds its session in ~/.gemini/antigravity-cli/antigravity-oauth-token.
// Without it there is no quota to read, so don't spawn at all.
function agySignedIn(home, existsSync) {
  try {
    return existsSync(path.join(home, '.gemini', 'antigravity-cli', 'antigravity-oauth-token'));
  } catch (_) {
    return false;
  }
}

// Spawn agy and capture the /usage report. stdin is ignored so a prompt can
// never block us. Resolves with stdout (or stderr when stdout is empty)
// regardless of exit code, because CLIs sometimes print the report and still
// exit non-zero.
function runAgyUsageCliOnce(args, deps = {}) {
  const spawnFn = deps.spawn || childProcess.spawn;
  const env = { ...(deps.env || process.env), TERM: 'xterm-256color' };
  const command = deps.agyCliPath || 'agy';
  const timeoutMs = Number(deps.agyCliTimeoutMs || AGY_TIMEOUT_MS);
  const signal = deps.signal;
  if (signal?.aborted) return Promise.reject(abortError(signal));
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnFn(command, args, {
        env,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (error) {
      reject(error);
      return;
    }
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', onAbort);
      callback(value);
    };
    const stopChild = () => {
      try { child.kill('SIGTERM'); } catch (_) {}
    };
    const onAbort = () => {
      stopChild();
      finish(reject, abortError(signal));
    };
    const timer = setTimeout(() => {
      stopChild();
      finish(reject, errorWithStatus('unavailable', 'agy timed out'));
    }, timeoutMs);
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => finish(reject, error));
    child.on('close', () => {
      finish(resolve, stdout.trim() ? stdout : stderr);
    });
    signal?.addEventListener?.('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

function parseResetTime(value) {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}T/.test(raw) ? raw : null;
}

// Parse `agy -p /usage` output into probe-shaped windows
// ({kind, name, remainingFraction, resetTime}) for mapAntigravitySnapshot.
function parseAgyUsage(text) {
  const windows = [];
  for (const line of String(text || '').split('\n')) {
    const match = line.match(AGY_USAGE_ROW);
    if (!match) continue;
    const remaining = Number(match[3]);
    if (!Number.isFinite(remaining)) continue;
    windows.push({
      kind: match[2] === 'Five Hour' ? 'session' : 'weekly',
      name: match[1].trim(),
      remainingFraction: Math.max(0, Math.min(1, remaining / 100)),
      resetTime: parseResetTime(match[4])
    });
  }
  if (windows.length === 0) {
    throw errorWithStatus('unavailable', 'agy /usage returned no quota rows.');
  }
  return windows;
}

// Snapshot for mapAntigravitySnapshot, or throws (missing CLI/session, spawn
// failure, unparseable output). The caller treats every failure as "no CLI
// quota" and falls back to the existing rows.
async function fetchAgyCliSnapshot(deps = {}) {
  const env = deps.env || process.env;
  const platform = deps.platform || process.platform;
  const existsSync = deps.existsSync || fs.existsSync;
  if (typeof deps.runAgyUsageCli !== 'function') {
    if (!existingAgyCli(env, platform, deps)) {
      throw errorWithStatus('notConfigured', 'agy is not installed.');
    }
    if (!agySignedIn(homeDir(env), existsSync)) {
      throw errorWithStatus('notConfigured', 'agy is not signed in.');
    }
  }
  const text = typeof deps.runAgyUsageCli === 'function'
    ? await deps.runAgyUsageCli()
    : await runAgyUsageCliOnce(['-p', '/usage'], {
      ...deps,
      env,
      platform,
      agyCliPath: existingAgyCli(env, platform, deps)
    });
  return { windows: parseAgyUsage(text), sourceDetail: 'cli' };
}

module.exports = {
  parseAgyUsage,
  agyCliCandidates,
  existingAgyCli,
  runAgyUsageCliOnce,
  fetchAgyCliSnapshot
};
