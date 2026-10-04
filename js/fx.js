// Partículas e ondas visuais. Só aparência, nenhuma regra de jogo.
import { world } from './world.js';

export function burst(x, y, color, count = 12, speed = 2.2) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * speed;
    world.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.4, life: 18 + Math.random() * 16, color, size: 2 });
  }
}
export const spark = (x, y, color) => burst(x, y, color, 4, 1.2);

export function exhaust(x, y) {
  world.fx.push({ x, y, vx: (Math.random() - 0.5) * 0.4, vy: 1 + Math.random(), life: 14, color: Math.random() < 0.5 ? '#ffd23d' : '#ff7a3d', size: 2 });
}

const HEART_COLORS = ['#ff4f9a', '#ff6b8a', '#ff3b7a'];
// Um coração que sobe balançando e some. Usa a idade própria (age), porque o mundo pode estar parado numa cena.
export function heart(x, y) {
  world.fx.push({ x, y, vx: (Math.random() - 0.5) * 0.4, vy: -(0.35 + Math.random() * 0.4), life: 70 + Math.random() * 40, age: 0,
    size: 5 + Math.random() * 4, color: HEART_COLORS[Math.floor(Math.random() * 3)], heart: true });
}

// Cena de amor: por `frames` quadros saem corações do herói (e da cápsula, se houver).
export function startLove(frames) { world.love = frames; }

function emitLove() {
  if (world.love <= 0) return;
  world.love--;
  const p = world.player, g = world.goal;
  if (world.love % 5 === 0 && p) heart(p.x + p.w / 2 + (Math.random() - 0.5) * 10, p.y + 2);
  if (world.love % 9 === 0 && g) heart(g.x + 8 + (Math.random() - 0.5) * 10, g.y + 4);
}

export const ring = (x, y) => world.rings.push({ x, y, r: 4, life: 24 });

export function updateFx() {
  emitLove();
  for (const p of world.fx) {
    if (p.heart) { p.age++; p.x += p.vx + Math.sin(p.age * 0.15) * 0.25; p.y += p.vy; p.life--; continue; }
    p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life--;
  }
  world.fx = world.fx.filter(p => p.life > 0);
  for (const r of world.rings) { r.r += 3.2; r.life--; }
  world.rings = world.rings.filter(r => r.life > 0);
}
