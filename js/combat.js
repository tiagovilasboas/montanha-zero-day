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

// Mira assistida: escolhe o inimigo mais próximo dentro de um cone à frente (até ~63° para cima ou para baixo).
// Quem está na linha do tiro tem preferência. Devolve o inimigo (ou null para atirar reto).
export function aimTarget(x, y, face, range = 210) {
  let best = null, bestScore = Infinity;
  for (const e of hostileTargets()) {
    const c = center(e), dx = (c.x - x) * face, dy = c.y - y;
    if (dx < 10 || dx > range || Math.abs(dy) > dx * 2) continue;
    const score = Math.hypot(dx, dy) + Math.abs(dy) * 0.4;
    if (score < bestScore) { best = e; bestScore = score; }
  }
  return best;
}

// Tiro guiado: o projétil faz curvas suaves (~4° por quadro) em direção ao alvo e solta o alvo se passar dele.
const TURN = 0.07;
function steer(b) {
  const t = b.target;
  if (!t || t.dead || t.gone || (t === world.boss && t.shield)) { b.target = null; return; }
  const c = center(t), speed = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx);
  const bx = b.x + b.w / 2, by = b.y + b.h / 2;
  if ((c.x - bx) * Math.sign(b.vx || 1) < -4) { b.target = null; return; }   // já passou do alvo
  let diff = Math.atan2(c.y - by, c.x - bx) - cur;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const next = cur + Math.max(-TURN, Math.min(TURN, diff));
  b.vx = Math.cos(next) * speed; b.vy = Math.sin(next) * speed;
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
    if (b.target) steer(b);
    b.x += b.vx; b.y += b.vy;
    if (--b.life <= 0 || b.x < cam.x - 24 || b.x > cam.x + 360) { b.dead = true; continue; }
    if (hitsWall(b)) { b.dead = true; spark(b.x, b.y, COLORS[b.from]); continue; }

    if (b.from === 'enemy') {
      if (overlap(b, player)) { b.dead = true; emit('player:hit', { dmg: b.dmg, dir: Math.sign(b.vx) || 1 }); }
      continue;
    }
    const pad = b.pad || 0, hit = pad || b.drop ? { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad + (b.drop || 0) } : b;
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
