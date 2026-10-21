'use strict';
const test = require('node:test');
const assert = require('node:assert');
const D = require('./daily.js');
test('every level appears once per cycle', () => {
  for (const count of [1, 2, 7, 30, 49]) {
    const seen = new Set();
    for (let i = 0; i < count; i++) seen.add(D.dailyIndex(new Date(Date.UTC(2026, 9, 22 + i)), count));
    assert.strictEqual(seen.size, count);
  }
});
test('stable through the day', () => {
  assert.strictEqual(D.dailyIndex(new Date('2026-10-22T00:00:01Z'), 30), D.dailyIndex(new Date('2026-10-22T23:59:59Z'), 30));
});
test('share text', () => {
  assert.strictEqual(D.shareText(new Date('2026-10-22T12:00:00Z'), 22, 'u'), 'onepath daily 2026-10-22: filled 22 tiles (the only solution)\nu');
});
