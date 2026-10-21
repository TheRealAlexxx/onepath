'use strict';
// onepath core. Fill every free tile in one stroke, starting at S and passing
// the numbered checkpoints in order. The solver counts solutions with a
// dead-state cache, so a level can be proven to have exactly one.

function parse(level) {
  const rows = level.grid;
  const h = rows.length, w = rows[0].length;
  let start = -1, freeCount = 0;
  const cpAt = {};   // cell index -> checkpoint number
  for (let y = 0; y < h; y++) {
    if (rows[y].length !== w) throw new Error('ragged grid');
    for (let x = 0; x < w; x++) {
      const c = rows[y][x], i = y * w + x;
      if (c === '#') continue;
      freeCount++;
      if (c === 'S') start = i;
      else if (c >= '1' && c <= '9') cpAt[i] = +c;
    }
  }
  if (start < 0) throw new Error('level needs S');
  const adj = [];
  for (let i = 0; i < w * h; i++) {
    adj.push([]);
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (rows[ny][nx] !== '#') adj[i].push(j);
    }
  }
  const maxCp = Math.max(0, ...Object.values(cpAt));
  return { w, h, start, freeCount, cpAt, adj, maxCp, name: level.name };
}

const bit = (i) => 1n << BigInt(i);
function popcount(m) { let c = 0; while (m) { c += Number(m & 1n); m >>= 1n; } return c; }

// Count solutions, stopping at limit. Returns { count, path, nodes } where
// path is one solution as a list of cell indices (when count > 0).
// Throws 'budget' when the search runs past the node budget.
function solve(L, opts) {
  const limit = (opts && opts.limit) || 2;
  const budget = (opts && opts.budget) || 2e6;
  const dead = new Set();
  let nodes = 0, path = null;
  function dfs(pos, mask, cpNext) {
    if (++nodes > budget) throw new Error('budget');
    if (popcount(mask) === L.freeCount) return 1;
    const key = pos + ':' + cpNext + ':' + mask.toString(36);
    if (dead.has(key)) return 0;
    let count = 0;
    for (const nb of L.adj[pos]) {
      if (mask & bit(nb)) continue;
      const cp = L.cpAt[nb];
      let next = cpNext;
      if (cp) {
        if (cp !== cpNext) continue;
        next = cpNext + 1;
      }
      const r = dfs(nb, mask | bit(nb), next);
      if (r && !path) {
        // rebuild lazily below instead
      }
      count += r;
      if (count >= limit) return count;
    }
    if (count === 0) dead.add(key);
    return count;
  }
  const count = dfs(L.start, bit(L.start), 1);
  if (count) path = onePath(L);
  return { count, path, nodes };
}

// Plain DFS for a single witness path (used after solve says one exists).
function onePath(L) {
  const out = [];
  (function go(pos, mask, cpNext) {
    out.push(pos);
    if (popcount(mask) === L.freeCount) return true;
    for (const nb of L.adj[pos]) {
      if (mask & bit(nb)) continue;
      const cp = L.cpAt[nb];
      if (cp && cp !== cpNext) continue;
      if (go(nb, mask | bit(nb), cp ? cpNext + 1 : cpNext)) return true;
    }
    out.pop();
    return false;
  })(L.start, bit(L.start), 1);
  return out;
}

// Validate a player path (list of cell indices): adjacency, no revisits,
// starts at S, checkpoint order. Returns { done, error }.
function validate(L, path) {
  if (!path.length || path[0] !== L.start) return { done: false, error: 'start at S' };
  const seen = new Set();
  let cpNext = 1;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    if (seen.has(p)) return { done: false, error: 'tile used twice' };
    seen.add(p);
    if (i > 0 && !L.adj[path[i - 1]].includes(p)) return { done: false, error: 'not a step' };
    const cp = L.cpAt[p];
    if (cp) {
      if (cp !== cpNext) return { done: false, error: 'checkpoint ' + cp + ' before ' + cpNext };
      cpNext++;
    }
  }
  return { done: seen.size === L.freeCount, error: null };
}

const api = { parse, solve, onePath, validate, popcount, bit };
if (typeof module !== 'undefined') module.exports = api;
else window.Core = api;
