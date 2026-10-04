// Entrada: teclado + controles de toque, unificados num único estado lido pelo jogo.
import { unlockAudio } from './audio.js';

const ACTIONS = ['left', 'right', 'jump', 'fire', 'hack'];
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', KeyZ: 'jump', ArrowUp: 'jump', KeyW: 'jump',
  KeyX: 'fire', KeyJ: 'fire', KeyC: 'hack', KeyK: 'hack',
};

const keys = {}, touch = {}, latched = {}, prev = {};
const resets = new Set();   // cada controle de toque registra como esquecer os dedos que segura
export const input = { pressed: {}, released: {}, confirm: false, pause: false };
ACTIONS.forEach(a => { input[a] = false; });

function sync() { ACTIONS.forEach(a => { input[a] = !!(keys[a] || touch[a]); }); }
function press(store, action) { if (!store[action]) latched[action] = true; store[action] = true; sync(); }
function release(store, action) { store[action] = false; sync(); }

// Chamado uma vez por passo de simulação: calcula bordas de pressionar/soltar.
export function pollInput() {
  ACTIONS.forEach(a => {
    input.pressed[a] = (input[a] && !prev[a]) || !!latched[a];
    input.released[a] = !input[a] && prev[a];
    latched[a] = false;
    prev[a] = input[a];
  });
}
export function consumeMeta() { input.confirm = false; input.pause = false; }

// Solta tudo: ao perder o foco o navegador não manda keyup/pointerup e o herói seguiria andando sozinho.
export function resetInput() {
  ACTIONS.forEach(a => { keys[a] = touch[a] = latched[a] = false; });
  resets.forEach(fn => fn());
  sync();
}

let keyHook = null; // usado pelos puzzles para capturar teclas
export const setKeyHook = fn => { keyHook = fn; };

export function bindInput({ dpad, buttons }) {
  addEventListener('keydown', e => {
    unlockAudio();
    if (keyHook && keyHook(e)) { e.preventDefault(); return; }
    if (e.code === 'Enter') input.confirm = true;
    if (e.code === 'Escape' || e.code === 'KeyP') input.pause = true;
    const a = KEYMAP[e.code];
    if (a) { press(keys, a); e.preventDefault(); }
  });
  addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) release(keys, a); });
  addEventListener('blur', resetInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetInput(); });

  bindDpad(dpad);
  buttons.forEach(bindButton);
}

function bindDpad(el) {
  const fingers = new Map();
  const update = () => {
    const dirs = [...fingers.values()];
    touch.left = dirs.includes(-1); touch.right = dirs.includes(1);
    el.classList.toggle('is-left', touch.left); el.classList.toggle('is-right', touch.right);
    sync();
  };
  const track = e => {
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2;
    fingers.set(e.pointerId, Math.abs(dx) < r.width * 0.08 ? 0 : Math.sign(dx));
    update();
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); unlockAudio(); el.setPointerCapture(e.pointerId); track(e); });
  el.addEventListener('pointermove', e => { if (fingers.has(e.pointerId)) track(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, e => { fingers.delete(e.pointerId); update(); }));
  resets.add(() => { fingers.clear(); update(); });
}

function bindButton(el) {
  const action = el.dataset.action, fingers = new Set();
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); unlockAudio(); el.setPointerCapture(e.pointerId);
    fingers.add(e.pointerId); el.classList.add('is-down'); press(touch, action);
  });
  const up = e => {
    fingers.delete(e.pointerId);
    if (!fingers.size) { el.classList.remove('is-down'); release(touch, action); }
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, up));
  resets.add(() => { fingers.clear(); el.classList.remove('is-down'); });
  el.addEventListener('contextmenu', e => e.preventDefault());
}
