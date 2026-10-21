'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const store = { get() { try { return JSON.parse(localStorage.getItem('onepath') || '{}'); } catch (e) { return {}; } }, set(v) { try { localStorage.setItem('onepath', JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  let levels = [], idx = 0, L = null, path = [], drawing = false, won = false, daily = false;

  fetch('levels.json').then((r) => r.json()).then((d) => {
    levels = d;
    d.forEach((l, i) => { const b = document.createElement('button'); b.textContent = l.id; b.onclick = () => { daily = false; load(i); }; $('levels').appendChild(b); });
    daily = location.hash === '#daily';
    const h = daily ? Daily.dailyIndex(new Date(), d.length) + 1 : parseInt(location.hash.slice(1), 10);
    load(h > 0 && h <= d.length ? h - 1 : Math.min(store.get().cur || 0, d.length - 1));
  });

  function load(i) {
    idx = i; L = Core.parse(levels[i]); path = []; won = false;
    const s = store.get(); s.cur = i; store.set(s);
    history.replaceState(null, '', daily ? '#daily' : '#' + (i + 1)); $('share').hidden = true;
    const b = $('board');
    b.innerHTML = '';
    b.style.gridTemplateColumns = 'repeat(' + L.w + ', 1fr)';
    b.style.maxWidth = Math.min(540, L.w * 78) + 'px';
    for (let k = 0; k < L.w * L.h; k++) {
      const d = document.createElement('div');
      d.id = 'c' + k;
      b.appendChild(d);
    }
    $('lvl').textContent = 'level ' + levels[i].id + ' of ' + levels.length;
    say('');
    draw();
    list();
  }

  function cellFromEvent(e) {
    const t = document.elementFromPoint(e.clientX, e.clientY);
    if (!t || !t.id || t.id[0] !== 'c') return -1;
    const k = +t.id.slice(1);
    return isNaN(k) ? -1 : k;
  }

  function isFree(k) { return k >= 0 && k < L.w * L.h && levels[idx].grid[(k / L.w) | 0][k % L.w] !== '#'; }

  function say(t, cls) { $('msg').textContent = t; $('msg').className = cls || ''; }

  function tryExtend(k) {
    if (!isFree(k)) return;
    if (!path.length) {
      if (k !== L.start) return;
      path.push(k);
      draw();
      return;
    }
    const last = path[path.length - 1];
    if (k === last) return;
    // drag back over the previous tile undoes a step
    if (path.length > 1 && k === path[path.length - 2]) { path.pop(); say(''); draw(); return; }
    if (path.includes(k)) { say('Already used.', 'bad'); return; }
    if (!L.adj[last].includes(k)) return;
    const cp = L.cpAt[k];
    if (cp) {
      const need = nextCp();
      if (cp !== need) { say('Checkpoint ' + cp + ' comes after ' + need + '.', 'bad'); return; }
    }
    path.push(k);
    say('');
    draw();
    if (path.length === L.freeCount) win();
  }

  function nextCp() {
    let need = 1;
    for (const p of path) if (L.cpAt[p] === need) need++;
    return need;
  }

  function win() {
    won = true;
    const s = store.get(); s.best = s.best || {}; s.best[idx] = 1; store.set(s);
    say('Filled. That was the only solution.', 'win');
    $('share').hidden = !daily;
    list();
  }

  function draw() {
    const inPath = new Map(path.map((p, i) => [p, i]));
    const need = nextCp();
    for (let k = 0; k < L.w * L.h; k++) {
      const ch = levels[idx].grid[(k / L.w) | 0][k % L.w];
      const d = $('c' + k);
      let cls = 'c', txt = '';
      if (ch === '#') cls += ' wall';
      else {
        if (ch === 'S') { cls += ' start'; if (!path.length) txt = 'S'; }
        if (ch >= '1' && ch <= '9') { cls += ' cp' + (L.cpAt[k] < need ? ' passed' : ''); txt = ch; }
        if (inPath.has(k)) cls += inPath.get(k) === path.length - 1 ? ' head' : ' on';
      }
      d.className = cls; d.textContent = txt;
    }
    $('info').textContent = path.length + ' / ' + L.freeCount + ' tiles';
  }

  function list() {
    const best = store.get().best || {};
    [...$('levels').children].forEach((b, i) => { b.className = (i === idx ? 'cur ' : '') + (best[i] ? 'done' : ''); });
  }

  $('board').addEventListener('pointerdown', (e) => { drawing = true; tryExtend(cellFromEvent(e)); e.preventDefault(); });
  window.addEventListener('pointermove', (e) => { if (drawing && !won) tryExtend(cellFromEvent(e)); });
  window.addEventListener('pointerup', () => { drawing = false; });
  $('daily').onclick = () => { daily = true; load(Daily.dailyIndex(new Date(), levels.length)); };
  $('share').onclick = () => {
    const text = Daily.shareText(new Date(), L.freeCount, 'https://therealalexxx.github.io/onepath/#daily');
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => say('Copied: ' + text.split('\n')[0], 'win'), () => say(text, 'win'));
  };
  $('reset').onclick = () => { path = []; won = false; say(''); draw(); };
  $('prev').onclick = () => idx > 0 && (daily = false, load(idx - 1));
  $('next').onclick = () => idx + 1 < levels.length && (daily = false, load(idx + 1));
})();
