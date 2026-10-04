// Física de caixas contra o mapa de tiles. Funções puras sobre {x, y, w, h, vx, vy}.
import { T } from './config.js';
import { isSolid, tileAt, TILE } from './world.js';

const EPS = 0.001;
const cellRange = (a, size) => [Math.floor(a / T), Math.floor((a + size - EPS) / T)];

export function moveX(o, dx) {
  o.x += dx;
  if (!dx) return false;
  const [top, bottom] = cellRange(o.y, o.h);
  const tx = Math.floor((dx > 0 ? o.x + o.w - EPS : o.x) / T);
  for (let ty = top; ty <= bottom; ty++) {
    if (!isSolid(tx, ty)) continue;
    o.x = dx > 0 ? tx * T - o.w : (tx + 1) * T;
    o.vx = 0;
    return true;
  }
  return false;
}

export function moveY(o, dy) {
  o.y += dy;
  o.onGround = false;
  const [left, right] = cellRange(o.x, o.w);
  if (dy > 0) {
    const ty = Math.floor((o.y + o.h - EPS) / T), top = ty * T;
    const wasAbove = o.y + o.h - dy <= top + 0.01;
    for (let tx = left; tx <= right; tx++) {
      if (isSolid(tx, ty) || (wasAbove && tileAt(tx, ty) === TILE.PLATFORM)) {
        o.y = top - o.h; o.vy = 0; o.onGround = true;
        return;
      }
    }
  } else if (dy < 0) {
    const ty = Math.floor(o.y / T);
    for (let tx = left; tx <= right; tx++) {
      if (isSolid(tx, ty)) { o.y = (ty + 1) * T; o.vy = 0; return; }
    }
  }
}

export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const center = o => ({ x: o.x + o.w / 2, y: o.y + o.h / 2 });
export function distance(a, b) { const p = center(a), q = center(b); return Math.hypot(p.x - q.x, p.y - q.y); }

export function touchesTile(o, type) {
  const [l, r] = cellRange(o.x + 2, o.w - 4), [t, b] = cellRange(o.y + 2, o.h - 4);
  for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (tileAt(tx, ty) === type) return true;
  return false;
}
