// BYTE, o robô assistente: segue o herói e ajuda de vez em quando. É um apoio, não um segundo atirador:
// tiro fraco e espaçado, curto alcance, e um reparo raro quando o HP está crítico.
import { world } from './world.js';
import { emit } from './core.js';
import { fireAt, nearestHostile } from './combat.js';
import { center } from './physics.js';
import { burst } from './fx.js';
import { sfx } from './audio.js';

const RANGE = 110, FIRE_EVERY = 150, SHOT_SPEED = 3.2, REPAIR_EVERY = 720, REPAIR_BELOW = 0.3;

export function createAlly(p) { return { x: p.x - 16, y: p.y - 14, w: 12, h: 11, cd: 90, face: 1, repair: REPAIR_EVERY, flash: 0 }; }

function follow(a, p) {
  const tx = p.x + p.w / 2 - p.face * 16 - 6, ty = p.y - 14 + Math.sin(world.frame * 0.08) * 3;
  a.x += (tx - a.x) * 0.1; a.y += (ty - a.y) * 0.1;
}

function shoot(a) {
  if (a.flash) a.flash--;
  if (--a.cd > 0) return;
  const foe = nearestHostile(a, RANGE);
  if (!foe) { a.cd = 20; return; }
  const c = center(foe);
  a.face = c.x > a.x ? 1 : -1;
  fireAt('ally', a.x + 6 + a.face * 6, a.y + 5, c.x, c.y, SHOT_SPEED);
  a.flash = 5; sfx('blip'); a.cd = FIRE_EVERY;
}

function repair(a, p) {
  if (p.hp > p.max * REPAIR_BELOW || p.hp <= 0) { a.repair = REPAIR_EVERY; return; }
  if (--a.repair > 0) return;
  p.hp = Math.min(p.max, p.hp + 1); a.repair = REPAIR_EVERY;
  burst(p.x + p.w / 2, p.y + 4, '#7dff9b', 10, 1.4);
  emit('toast', 'BYTE: reparo de emergência +1 HP');
}

export function updateAlly() {
  const a = world.ally, p = world.player;
  follow(a, p);
  if (!a.flash) a.face = p.face;   // enquanto atira, olha para o alvo
  shoot(a);
  repair(a, p);
}
