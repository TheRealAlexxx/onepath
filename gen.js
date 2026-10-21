'use strict';
// Generates levels.json: random rooms, kept only when exactly one solution
// exists. Usage: node gen.js [seed] [count]
const fs = require('fs');
const Core = require('./core.js');
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(parseInt(process.argv[2] || '9', 10));
const want = parseInt(process.argv[3] || '30', 10);
const out = [], seen = new Set();
let tried = 0, blew = 0;
while (out.length < want && tried < 60000) {
  tried++;
  const w = 4 + Math.floor(rand() * 3), h = 4 + Math.floor(rand() * 2);
  const g = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(rand() < 0.22 ? '#' : '.');
    g.push(row);
  }
  const free = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '.') free.push([x, y]);
  if (free.length < 10) continue;
  const put = (c) => { const p = free.splice(Math.floor(rand() * free.length), 1)[0]; g[p[1]][p[0]] = c; return p; };
  put('S');
  const nCp = Math.floor(rand() * 4);
  for (let i = 1; i <= nCp; i++) put(String(i));
  const grid = g.map((r) => r.join(''));
  const key = grid.join('/');
  if (seen.has(key)) continue;
  seen.add(key);
  let res;
  try { res = Core.solve(Core.parse({ grid }), { limit: 2, budget: 1.5e6 }); }
  catch (e) { blew++; continue; }
  if (res.count !== 1) continue;
  out.push({ grid, path: res.path, cells: res.nodes });
}
out.sort((a, b) => a.grid.length - b.grid.length || (a.grid.join('').match(/[1-9]/) || [''])[0].localeCompare((b.grid.join('').match(/[1-9]/) || [''])[0]));
out.forEach((l, i) => { l.id = i + 1; delete l.cells; });
fs.writeFileSync('levels.json', JSON.stringify(out));
console.log('tried', tried, 'blew budget', blew, 'kept', out.length);
const sizes = {}; out.forEach((l) => { const s = l.grid[0].length + 'x' + l.grid.length; sizes[s] = (sizes[s] || 0) + 1; });
console.log(JSON.stringify(sizes));
