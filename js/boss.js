// RANSOM-TITAN: chefe final. Fase 1 atira em leque; fase 2 liga firewall e dispara um raio horizontal.
import { T } from './config.js';
import { emit } from './core.js';
import { world, makeEnemy } from './world.js';
import { overlap, center } from './physics.js';
import { sfx } from './audio.js';
import { burst } from './fx.js';
import { t } from './i18n.js';

const BOOM_COLORS = ['#ff3b5c', '#ffd23d', '#ffffff'];

function spread(b, target) {
  const n = b.phase === 1 ? 3 : 5;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, base = Math.atan2(target.y - cy, target.x - cx);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * 0.22;
    world.bullets.push({ from: 'enemy', x: cx - 2.5, y: cy - 2.5, w: 5, h: 5, vx: Math.cos(a) * 1.9, vy: Math.sin(a) * 1.9, dmg: 2, life: 220 });
  }
  sfx('shoot');
}

function summon(b) {
  const drones = world.enemies.filter(e => !e.dead && e.type === 'drone').length;
  if (drones >= 3) return;
  const d = makeEnemy('drone', b.x, b.y + 10);
  d.originX = world.level.arenaX + 8 * T; d.originY = 40 + Math.random() * 40;
  world.enemies.push(d);
}

function beam(b, target) {
  if (!b.beam && b.t % 360 === 180) b.beam = { y: target.y - 3, t: 0 };
  if (!b.beam) return;
  b.beam.t++;
  if (b.beam.t > 45 && b.beam.t < 70 && Math.abs(target.y - (b.beam.y + 3)) < 10) emit('player:hit', { dmg: 3, dir: -1 });
  if (b.beam.t >= 70) b.beam = null;
}

function dying(b) {
  b.deathT++;
  if (b.deathT % 6 === 0) {
    burst(b.x + Math.random() * b.w, b.y + Math.random() * b.h, BOOM_COLORS[b.deathT % 3], 8);
    sfx('boom'); world.cam.shake = 4;
  }
  if (b.deathT === 150) { b.gone = true; emit('boss:defeated'); }
}

export function updateBoss() {
  const b = world.boss;
  if (!b || !b.active || b.gone) return;
  if (b.dead) return dying(b);
  b.t++;
  if (b.flash) b.flash--;
  if (b.shieldTime > 0 && --b.shieldTime === 0) { b.shield = true; emit('toast', t('firewallBack')); }
  if (b.stun > 0) { b.stun--; return; }

  const target = center(world.player);
  b.y = b.baseY + Math.sin(b.t * 0.03) * 40;
  if (b.phase === 2) b.x = world.level.arenaX + 12 * T + Math.sin(b.t * 0.017) * 40;
  if (--b.cd <= 0) { b.cd = b.phase === 1 ? 80 : 60; spread(b, target); }
  if (--b.spawnCd <= 0) { b.spawnCd = b.phase === 1 ? 300 : 240; summon(b); }
  if (b.phase === 2) beam(b, target);
  if (overlap(b, world.player)) emit('player:hit', { dmg: 3, dir: -1 });
}
