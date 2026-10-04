// Caixa de diálogo estilo Final Fantasy: retrato, nome e texto com efeito de máquina de escrever.
import { $ } from './core.js';
import { SPEAKERS } from './config.js';
import { setPortrait } from './assets.js';
import { sfx } from './audio.js';

let current = null;
const el = () => $('#dialog');

export const dialogOpen = () => !!current;

// Mostra as n primeiras letras e reserva o resto invisível: a caixa já nasce do tamanho final e não pula a cada linha.
function paint(n) {
  const rest = document.createElement('span');
  rest.className = 'dlg-rest'; rest.textContent = current.text.slice(n);
  $('#dlg-text').replaceChildren(current.text.slice(0, n), rest);
}

export function say(lines, onDone) {
  current = { lines, index: 0, shown: 0, onDone };
  el().hidden = false;
  showLine();
}

function showLine() {
  const [who, text] = current.lines[current.index];
  const img = $('#dlg-portrait');
  setPortrait(img, who);
  $('#dlg-name').textContent = SPEAKERS[who] || '';
  current.text = text; current.shown = 0;
  paint(0);
  el().classList.remove('is-done');
}

export function tickDialog() {
  if (!current || current.shown >= current.text.length) return;
  const before = Math.floor(current.shown);
  current.shown = Math.min(current.text.length, current.shown + 1.25);
  const now = Math.floor(current.shown);
  if (now !== before) {
    paint(now);
    if (now % 3 === 0) sfx('blip');
  }
  if (current.shown >= current.text.length) el().classList.add('is-done');
}

export function advanceDialog() {
  if (!current) return;
  if (current.shown < current.text.length) {
    current.shown = current.text.length;
    paint(current.text.length);
    el().classList.add('is-done');
    return;
  }
  if (++current.index < current.lines.length) { showLine(); return; }
  const done = current.onDone;
  current = null;
  el().hidden = true;
  done?.();
}

export function bindDialog() { el().addEventListener('pointerdown', e => { e.preventDefault(); advanceDialog(); }); }
