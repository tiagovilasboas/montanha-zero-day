// Utilidades pequenas compartilhadas: barramento de eventos, persistência e helpers.
const listeners = {};
export const on = (name, fn) => (listeners[name] ||= []).push(fn);
export const emit = (name, data) => (listeners[name] || []).forEach(fn => fn(data));

const SAVE_KEY = 'montanha-zero-day-v1';
const DEFAULT_SAVE = { unlocked: 1, lv: 1, xp: 0, cleared: [], started: false, muted: false };

function readSave() {
  try { return { ...DEFAULT_SAVE, ...JSON.parse(localStorage.getItem(SAVE_KEY)) }; }
  catch { return { ...DEFAULT_SAVE }; }
}
export const save = readSave();
export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* armazenamento indisponível */ }
}
export function resetSave() { Object.assign(save, DEFAULT_SAVE, { cleared: [], muted: save.muted }); persist(); }

export const $ = sel => document.querySelector(sel);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const chance = p => Math.random() < p;

export function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
