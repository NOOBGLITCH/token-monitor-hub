'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseAgyUsage } = require('../src/shared/providers/antigravity/cliUsage');

const SAMPLE = [
  'Gemini Models\tWeekly Limit Remaining\t51%\t2026-09-13T06:15:06Z',
  'Gemini Models\tFive Hour Limit Remaining\t75%\t2026-09-12T10:52:25Z',
  'Claude and GPT models\tWeekly Limit Remaining\t100%\t2026-09-19T06:44:33Z',
  'Claude and GPT models\tFive Hour Limit Remaining\t100%\t2026-09-12T11:44:33Z'
].join('\n');

describe('parseAgyUsage', () => {
  it('parses pool rows into probe-shaped windows', () => {
    const windows = parseAgyUsage(SAMPLE);
    assert.equal(windows.length, 4);
    assert.deepEqual(windows[0], {
      kind: 'weekly',
      name: 'Gemini Models',
      remainingFraction: 0.51,
      resetTime: '2026-09-13T06:15:06Z'
    });
    assert.deepEqual(windows[1], {
      kind: 'session',
      name: 'Gemini Models',
      remainingFraction: 0.75,
      resetTime: '2026-09-12T10:52:25Z'
    });
  });

  it('clamps percentages and drops bad reset timestamps', () => {
    const windows = parseAgyUsage('Pool\tWeekly Limit Remaining\t140%\tsomeday');
    assert.equal(windows.length, 1);
    assert.equal(windows[0].remainingFraction, 1);
    assert.equal(windows[0].resetTime, null);
  });

  it('throws unavailable when no quota rows are present', () => {
    assert.throws(() => parseAgyUsage('nothing to see here'), (error) => error?.status === 'unavailable');
    assert.throws(() => parseAgyUsage(''), (error) => error?.status === 'unavailable');
  });
});
