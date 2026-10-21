'use strict';
const test = require('node:test');
const assert = require('node:assert');
const C = require('./core.js');
const levels = require('./levels.json');

test('open 2x2 from the corner has 2 solutions, 1x4 has 1', () => {
  assert.strictEqual(C.solve(C.parse({ grid: ['S.', '..'] }), { limit: 10 }).count, 2);
  assert.strictEqual(C.solve(C.parse({ grid: ['S...'] }), { limit: 10 }).count, 1);
});

test('checkpoints must come in order', () => {
  // '1' sits on every route from S, so the count is the same with or without it
  const withCp = C.solve(C.parse({ grid: ['S1..', '....'] }), { limit: 10 }).count;
  const without = C.solve(C.parse({ grid: ['S...', '....'] }), { limit: 10 }).count;
  assert.strictEqual(withCp, without);
  // '2' before '1' is impossible to pass: only routes reaching 1 first count
  const l = C.parse({ grid: ['S2..', '1...'] });
  for (const sol of allPaths(l)) {
    const one = sol.indexOf(4), two = sol.indexOf(1);
    assert.ok(one < two, 'checkpoint 1 must come before 2');
  }
});

// Independent witness: enumerate every path with plain DFS, no cache.
function allPaths(L) {
  const out = [];
  (function go(pos, mask, cpNext, path) {
    path.push(pos);
    if (C.popcount(mask) === L.freeCount) { out.push(path.slice()); path.pop(); return; }
    for (const nb of L.adj[pos]) {
      if (mask & C.bit(nb)) continue;
      const cp = L.cpAt[nb];
      if (cp && cp !== cpNext) continue;
      go(nb, mask | C.bit(nb), cp ? cpNext + 1 : cpNext, path);
    }
    path.pop();
  })(L.start, C.bit(L.start), 1, []);
  return out;
}

test('solver counts match plain enumeration on small grids', () => {
  for (const grid of [['S..', '..#', '...'], ['S1..', '....', '#...'], ['S..', '.1.', '...'], ['S.#.', '..1.', '....']]) {
    const L = C.parse({ grid });
    assert.strictEqual(C.solve(L, { limit: 1e9 }).count, allPaths(L).length, grid.join('/'));
  }
});

test('validate accepts the stored solution and rejects cheaters', () => {
  const L = C.parse({ grid: ['S.1', '...'] });
  assert.deepStrictEqual(C.validate(L, [0, 1, 3, 4, 5, 2]).done, true);
  assert.ok(C.validate(L, [0, 1, 2]).error);           // 1 not reached, path fine but unfinished
  assert.strictEqual(C.validate(L, [0, 1, 2]).done, false);
  assert.ok(C.validate(L, [0, 2]).error);              // skips a cell
  assert.ok(C.validate(L, [0, 1, 3, 4, 1]).error);     // revisit
  assert.ok(C.validate(L, [3, 2, 1, 0]).error);        // wrong start
});

test('every shipped level has exactly one solution and its path validates', () => {
  assert.ok(levels.length >= 30);
  for (const lv of levels) {
    const L = C.parse(lv);
    const r = C.solve(L, { limit: 2, budget: 2e6 });
    assert.strictEqual(r.count, 1, 'level ' + lv.id);
    assert.deepStrictEqual(lv.path, r.path, 'level ' + lv.id);
    assert.deepStrictEqual(C.validate(L, lv.path), { done: true, error: null });
  }
});
