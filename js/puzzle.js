// Mini-puzzles de hack: sequência (memória), binário (soma de bits) e firewall (vira-luzes 3x3).
import { $ } from './core.js';
import { sfx, tone, SEQ_NOTES } from './audio.js';
import { setKeyHook } from './input.js';

const ARROWS = [['↑', 'cima', 'ArrowUp'], ['→', 'direita', 'ArrowRight'], ['↓', 'baixo', 'ArrowDown'], ['←', 'esquerda', 'ArrowLeft']];
const HELP = {
  seq: 'Memorize a sequência e repita na mesma ordem.',
  bin: 'Ligue os bits até a soma bater com o alvo.',
  grid: 'Deixe todos os nós em ciano. Cada toque inverte o nó e os vizinhos.',
};

let pz = null;
export const puzzleOpen = () => !!pz;

// Cada tipo de puzzle sabe se montar e responder a um toque: estratégia simples por objeto.
const KINDS = {
  seq: {
    seconds: 20,
    setup(p) {
      p.seq = Array.from({ length: 3 + p.level }, () => (Math.random() * 4) | 0);
      p.pos = 0; p.ready = false;
      return `<div class="seq-slots">${p.seq.map(() => '<i></i>').join('')}</div>
        <div class="seq-pad">${ARROWS.map(([a, label], i) => `<button class="sq sq-${i}" data-v="${i}" aria-label="${label}">${a}</button>`).join('')}</div>`;
    },
    start(p) { playSequence(p); },
    pick(p, v) {
      if (!p.ready) return;
      flash(`.sq-${v}`); tone(SEQ_NOTES[v], 0.18, 'square', 0.1);
      if (v !== p.seq[p.pos]) return fail();
      document.querySelectorAll('.seq-slots i')[p.pos++].classList.add('ok');
      if (p.pos === p.seq.length) win();
    },
    key(e) { const i = ARROWS.findIndex(a => a[2] === e.code); return i >= 0 ? i : null; },
  },
  bin: {
    seconds: 20,
    setup(p) {
      p.bits = p.level >= 3 ? 6 : 5;
      p.target = 1 + Math.floor(Math.random() * ((1 << p.bits) - 1));
      p.value = 0; p.ready = true;
      const buttons = Array.from({ length: p.bits }, (_, i) => {
        const v = 1 << (p.bits - 1 - i);
        return `<button class="bit" data-v="${v}"><span>0</span><small>${v}</small></button>`;
      }).join('');
      return `<div class="bin-target">ALVO <b>${p.target}</b></div><div class="bin-row">${buttons}</div>
        <div class="bin-current">ATUAL <b id="bin-value">0</b></div>`;
    },
    pick(p, v, btn) {
      p.value ^= v;
      const on = !!(p.value & v);
      btn.classList.toggle('on', on); btn.querySelector('span').textContent = on ? '1' : '0';
      $('#bin-value').textContent = p.value; sfx('blip');
      if (p.value === p.target) win();
    },
    key(e, p) { const n = +e.key; return n >= 1 && n <= p.bits ? 1 << (p.bits - n) : null; },
  },
  grid: {
    seconds: 26,
    setup(p) {
      p.cells = Array(9).fill(true); p.ready = true;
      do { for (let i = 0; i < 2 + Math.min(2, p.level); i++) toggleCross(p.cells, (Math.random() * 9) | 0); }
      while (p.cells.every(Boolean));
      return `<div class="grid3">${p.cells.map((_, i) => `<button class="node" data-v="${i}" aria-label="nó ${i + 1}"></button>`).join('')}</div>`;
    },
    start(p) { paintGrid(p); },
    pick(p, v) { toggleCross(p.cells, v); paintGrid(p); sfx('blip'); if (p.cells.every(Boolean)) win(); },
    key(e) { const n = +e.key; return n >= 1 && n <= 9 ? n - 1 : null; },
  },
};

function toggleCross(cells, i) {
  const x = i % 3, y = (i / 3) | 0;
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) cells[ny * 3 + nx] = !cells[ny * 3 + nx];
  });
}
function paintGrid(p) { document.querySelectorAll('.node').forEach((n, i) => n.classList.toggle('on', p.cells[i])); }
function flash(sel) { const b = $(sel); b?.classList.add('lit'); setTimeout(() => b?.classList.remove('lit'), 160); }

function playSequence(p) {
  message('OBSERVE...');
  let i = 0;
  const next = () => {
    if (pz !== p) return;
    if (i >= p.seq.length) { p.ready = true; message('SUA VEZ'); return; }
    const v = p.seq[i++], btn = $(`.sq-${v}`);
    btn.classList.add('lit'); tone(SEQ_NOTES[v], 0.3, 'square', 0.1);
    setTimeout(() => { btn.classList.remove('lit'); setTimeout(next, 150); }, 420);
  };
  setTimeout(next, 450);
}

function message(text, cls = '') { const m = $('#pz-msg'); m.textContent = text; m.className = `pz-msg ${cls}`; }

export function openPuzzle({ kind, level, label, onWin, onFail }) {
  const k = KINDS[kind];
  pz = { kind, level, onWin, onFail, time: 0, max: k.seconds * 60, done: false };
  $('#pz-title').textContent = `HACK // ${label}`;
  $('#pz-help').textContent = HELP[kind];
  message('');
  $('#pz-body').innerHTML = k.setup(pz);
  $('#puzzle').hidden = false;
  k.start?.(pz);
  setKeyHook(onKey);
  paintTimer();
}

function close() { $('#puzzle').hidden = true; pz = null; setKeyHook(null); }

function finish(ok, text) {
  if (!pz || pz.done) return;
  const p = pz; p.done = true;
  message(text, ok ? 'ok' : 'bad');
  sfx(ok ? 'hackOk' : 'hackFail');
  setTimeout(() => { close(); (ok ? p.onWin : p.onFail)?.(); }, ok ? 650 : 900);
}
const win = () => finish(true, 'ACESSO CONCEDIDO');
const fail = (text = 'ACESSO NEGADO') => finish(false, text);

function paintTimer() { $('#pz-timer i').style.width = `${100 * (1 - pz.time / pz.max)}%`; }

export function tickPuzzle() {
  if (!pz || pz.done || !pz.ready) return;
  pz.time++;
  paintTimer();
  if (pz.time >= pz.max) fail('TEMPO ESGOTADO');
}

function onKey(e) {
  if (!pz || pz.done) return true;
  if (e.code === 'Escape') { close(); return true; }
  const v = KINDS[pz.kind].key(e, pz);
  if (v === null) return false;
  KINDS[pz.kind].pick(pz, v, document.querySelector(`#pz-body [data-v="${v}"]`));
  return true;
}

export function bindPuzzle() {
  $('#pz-cancel').addEventListener('click', () => { if (pz && !pz.done) close(); });
  $('#pz-body').addEventListener('click', e => {
    const btn = e.target.closest('[data-v]');
    if (!btn || !pz || pz.done) return;
    KINDS[pz.kind].pick(pz, +btn.dataset.v, btn);
  });
}
