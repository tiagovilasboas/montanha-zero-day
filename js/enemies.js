// Inimigos da Legião Null: drone, malware rastejante e torreta (que pode virar aliada).
import { T, W, PHYS, ENEMY } from './config.js';
import { emit } from './core.js';
import { world, isSolid, tileAt, TILE } from './world.js';
import { moveX, moveY, overlap, center } from './physics.js';
import { fireAt, nearestHostile } from './combat.js';

const ACTIVE_MARGIN = 80;
// A área visível depende da largura lógica (W muda com a tela) e do zoom da câmera.
const onScreen = e => e.x > world.cam.x - ACTIVE_MARGIN && e.x < world.cam.x + W / world.cam.zoom + ACTIVE_MARGIN;

function fall(e) { e.vy = Math.min(e.vy + PHYS.gravity, PHYS.maxFall); moveY(e, e.vy); }

const BEHAVIOR = {
  drone(e, target) {
    e.x += e.vx;
    if (Math.abs(e.x - e.originX) > 40) e.vx *= -1;
    e.y = e.originY + Math.sin(e.t * 0.05) * 10;
    if (--e.cd <= 0) { e.cd = 130; if (Math.abs(target.x - e.x) < 150) fireAt('enemy', e.x + e.w / 2, e.y + e.h * 0.8, target.x, target.y, 1.5); }
  },
  crawler(e) {
    const dir = e.vx;
    const bumped = moveX(e, e.vx);
    fall(e);
    if (bumped) { e.vx = -dir; return; }
    if (!e.onGround) return;
    const ahead = Math.floor((e.vx > 0 ? e.x + e.w + 1 : e.x - 1) / T), below = Math.floor((e.y + e.h + 2) / T);
    if (!isSolid(ahead, below) && tileAt(ahead, below) !== TILE.PLATFORM) e.vx = -e.vx;
  },
  turret(e, target) {
    let aim = target, inRange = Math.abs(target.x - e.x) < 170;
    if (e.ally) { const foe = nearestHostile(e, 170); inRange = !!foe; aim = foe && center(foe); }
    const cx = e.x + e.w / 2, cy = e.y + e.h * 0.35;
    if (inRange) e.angle = Math.atan2(aim.y - cy, aim.x - cx);
    if (--e.cd > 0) return;
    e.cd = e.ally ? 50 : 110;
    if (!inRange) return;
    const mx = cx + Math.cos(e.angle) * 9, my = cy + Math.sin(e.angle) * 9;
    fireAt(e.ally ? 'ally' : 'enemy', mx, my, aim.x, aim.y, e.ally ? 3 : 1.7);
  },
};

export function updateEnemies() {
  const p = world.player, target = center(p);
  for (const e of world.enemies) {
    if (e.dead || !onScreen(e)) continue;
    e.t++;
    if (e.flash) e.flash--;
    if (e.stun > 0) { e.stun--; if (e.type === 'crawler') fall(e); continue; }
    BEHAVIOR[e.type](e, target);
    if (!e.ally && overlap(e, p)) emit('player:hit', { dmg: ENEMY[e.type].contact, dir: target.x < e.x + e.w / 2 ? -1 : 1 });
  }
  if (world.frame % 120 === 0) world.enemies = world.enemies.filter(e => !e.dead);
}
