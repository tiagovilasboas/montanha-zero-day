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

export const ring = (x, y) => world.rings.push({ x, y, r: 4, life: 24 });

export function updateFx() {
  for (const p of world.fx) { p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life--; }
  world.fx = world.fx.filter(p => p.life > 0);
  for (const r of world.rings) { r.r += 3.2; r.life--; }
  world.rings = world.rings.filter(r => r.life > 0);
}
