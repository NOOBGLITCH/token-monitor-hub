'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveSessionMetadata } = require('../src/shared/providers/antigravity/sessionMetadata');

let home;
beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-meta-'));
  fs.mkdirSync(path.join(home, '.gemini', 'antigravity-cli', 'conversations'), { recursive: true });
});
afterEach(() => {
  fs.rmSync(home, { recursive: true, force: true });
});

function touchDb(uuid, mtimeMs) {
  const dbPath = path.join(home, '.gemini', 'antigravity-cli', 'conversations', `${uuid}.db`);
  fs.writeFileSync(dbPath, 'x');
  fs.utimesSync(dbPath, new Date(mtimeMs), new Date(mtimeMs));
  return dbPath;
}

describe('antigravity resolveSessionMetadata', () => {
  it('maps conversation db mtime to lastUsedAt', () => {
    const uuid = 'e3067811-d834-4245-95ef-6d84d6671e2f';
    touchDb(uuid, Date.UTC(2026, 8, 10, 12, 0, 0));
    const result = resolveSessionMetadata(new Set([uuid, 'missing-id']), { home });
    assert.equal(result.size, 1);
    assert.equal(result.get(uuid).lastUsedAt, '2026-09-10T12:00:00.000Z');
  });

  it('ignores globally-touched wal/shm sidecars', () => {
    const uuid = 'f379dc85-6eb0-409a-aa42-274caaecccea';
    const dbPath = touchDb(uuid, Date.UTC(2026, 8, 10));
    fs.writeFileSync(`${dbPath}-wal`, 'x');
    fs.utimesSync(`${dbPath}-wal`, new Date(Date.UTC(2026, 8, 12)), new Date(Date.UTC(2026, 8, 12)));
    fs.writeFileSync(`${dbPath}-shm`, 'x');
    fs.utimesSync(`${dbPath}-shm`, new Date(Date.UTC(2026, 8, 12)), new Date(Date.UTC(2026, 8, 12)));
    const result = resolveSessionMetadata(new Set([uuid]), { home });
    assert.equal(result.get(uuid).lastUsedAt, '2026-09-10T00:00:00.000Z');
  });

  it('ignores unsafe session ids', () => {
    const result = resolveSessionMetadata(new Set(['../evil', 'a/b', '']), { home });
    assert.equal(result.size, 0);
  });
});
