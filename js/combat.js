// Combate: projéteis, dano, XP e nível. Quem atira só cria o projétil; aqui se resolve o impacto.
import { T, ROWS, ENEMY, xpNeed, maxHpFor } from './config.js';
import { save, persist, emit, chance } from './core.js';
import { world, isSolid } from './world.js';
import { overlap, center, distance } from './physics.js';
import { sfx } from './audio.js';
import { burst, spark } from './fx.js';

const COLORS = { player: '#3df0ff', ally: '#7dff9b', enemy: '#ff3b5c' };

export function fireAt(from, x, y, tx, ty, speed, dmg = from === 'enemy' ? 2 : 1) {
  const a = Math.atan2(ty - y, tx - x);
  world.bullets.push({ from, x: x - 2, y: y - 2, w: 4, h: 4, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg, life: 200 });
}

export function hostileTargets() {
  const list = world.enemies.filter(e => !e.dead && !e.ally);
  const b = world.boss;
  if (b && b.active && !b.dead && !b.shield) list.push(b);
  return list;
}

export function nearestHostile(from, range) {
  let best = null, bestD = range;
  for (const e of hostileTargets()) { const d = distance(from, e); if (d < bestD) { best = e; bestD = d; } }
  return best;
}

export function gainXp(amount) {
  save.xp += amount; world.xpGained += amount;
  let leveled = false;
  while (save.xp >= xpNeed(save.lv)) { save.lv++; leveled = true; }
  if (!leveled) return;
  const p = world.player;
  if (p) { p.max = maxHpFor(save.lv); p.hp = p.max; burst(p.x + 5, p.y + 9, '#ffd23d', 24); }
  persist();
  sfx('levelUp');
  emit('toast', `LEVEL UP! LV ${save.lv}`);
}

export function damageEnemy(e, dmg) {
  e.hp -= dmg; e.flash = 6; sfx('hit');
  if (e.hp > 0) return;
  e.dead = true; world.kills++;
  const c = center(e);
  burst(c.x, c.y, e.type === 'drone' ? '#9b5cff' : '#ff3b5c', 16); sfx('boom');
  gainXp(ENEMY[e.type].xp);
  if (chance(0.2)) world.pickups.push({ kind: chance(0.5) ? 'hp' : 'ep', x: c.x - 4, y: c.y - 4, w: 8, h: 8 });
}

export function damageBoss(dmg) {
  const b = world.boss;
  if (b.shield) return;
  b.hp -= dmg; b.flash = 5; sfx('hit');
  if (b.phase === 1 && b.hp <= b.max / 2) { b.phase = 2; b.shield = true; emit('boss:firewall'); }
  if (b.hp <= 0) { b.hp = 0; b.dead = true; emit('boss:dying'); }
}

function hitsWall(b) {
  const tx = Math.floor((b.x + b.w / 2) / T), ty = Math.floor((b.y + b.h / 2) / T);
  return ty >= 0 && ty < ROWS && isSolid(tx, ty);
}

function strike(b, target, onHit) {
  if (b.pierce) { if (b.hitSet.has(target)) return; b.hitSet.add(target); }
  else b.dead = true;
  onHit();
}

export function updateBullets() {
  const { cam, player, boss } = world;
  for (const b of world.bullets) {
    b.x += b.vx; b.y += b.vy;
    if (--b.life <= 0 || b.x < cam.x - 24 || b.x > cam.x + 360) { b.dead = true; continue; }
    if (hitsWall(b)) { b.dead = true; spark(b.x, b.y, COLORS[b.from]); continue; }

    if (b.from === 'enemy') {
      if (overlap(b, player)) { b.dead = true; emit('player:hit', { dmg: b.dmg, dir: Math.sign(b.vx) || 1 }); }
      continue;
    }
    const hit = b.drop ? { x: b.x, y: b.y, w: b.w, h: b.h + b.drop } : b;
    for (const e of world.enemies) {
      if (e.dead || e.ally || !overlap(hit, e)) continue;
      strike(b, e, () => damageEnemy(e, b.dmg));
      if (b.dead) break;
    }
    if (!b.dead && boss && boss.active && !boss.dead && overlap(hit, boss)) {
      if (boss.shield) { b.dead = true; spark(b.x, b.y, '#ff4fd8'); }
      else strike(b, boss, () => damageBoss(b.dmg));
    }
  }
  world.bullets = world.bullets.filter(b => !b.dead);
}
