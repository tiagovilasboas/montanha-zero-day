// BYTE, o robô assistente: segue o herói e ajuda de vez em quando. Na luta final ele entra em
// modo overdrive: atira mais forte e entrega kits de vida para deixar a arena mais divertida.
import { world } from './world.js';
import { emit } from './core.js';
import { fireAt, nearestHostile } from './combat.js';
import { center } from './physics.js';
import { burst } from './fx.js';
import { sfx } from './audio.js';
import { t } from './i18n.js';

const RANGE = 110, FIRE_EVERY = 150, SHOT_SPEED = 3.2, REPAIR_EVERY = 720, REPAIR_BELOW = 0.3;
const BOSS_RANGE = 260, BOSS_FIRE_EVERY = 72, BOSS_SHOT_SPEED = 4.2, BOSS_DAMAGE = 2, SUPPLY_EVERY = 480;

export function createAlly(p) {
  return { x: p.x - 16, y: p.y - 14, w: 12, h: 11, cd: 90, face: 1, repair: REPAIR_EVERY, supply: SUPPLY_EVERY, flash: 0 };
}

const bossFight = () => world.boss?.active && !world.boss.dead && !world.boss.gone;

function follow(a, p) {
  const tx = p.x + p.w / 2 - p.face * 16 - 6, ty = p.y - 14 + Math.sin(world.frame * 0.08) * 3;
  a.x += (tx - a.x) * 0.1; a.y += (ty - a.y) * 0.1;
}

function shoot(a) {
  if (a.flash) a.flash--;
  if (--a.cd > 0) return;
  const overdrive = bossFight();
  const foe = nearestHostile(a, overdrive ? BOSS_RANGE : RANGE);
  if (!foe) { a.cd = 20; return; }
  const c = center(foe);
  a.face = c.x > a.x ? 1 : -1;
  fireAt('ally', a.x + 6 + a.face * 6, a.y + 5, c.x, c.y,
    overdrive ? BOSS_SHOT_SPEED : SHOT_SPEED, overdrive ? BOSS_DAMAGE : 1);
  a.flash = 5; sfx('blip'); a.cd = overdrive ? BOSS_FIRE_EVERY : FIRE_EVERY;
}

function repair(a, p) {
  if (p.hp > p.max * REPAIR_BELOW || p.hp <= 0) { a.repair = REPAIR_EVERY; return; }
  if (--a.repair > 0) return;
  p.hp = Math.min(p.max, p.hp + 1); a.repair = REPAIR_EVERY;
  burst(p.x + p.w / 2, p.y + 4, '#7dff9b', 10, 1.4);
  emit('toast', t('byteHeal'));
}

function dropSupply(a, p) {
  if (!bossFight()) { a.supply = SUPPLY_EVERY; return; }
  const waiting = world.pickups.some(it => it.kind === 'hp' && it.from === 'ally');
  if (p.hp <= 0 || p.hp > p.max - 4 || waiting || --a.supply > 0) return;

  world.pickups.push({
    kind: 'hp', from: 'ally',
    x: p.x + p.w / 2 + p.face * 18 - 4, y: p.y + p.h - 8, w: 8, h: 8,
  });
  a.supply = SUPPLY_EVERY;
  burst(a.x + a.w / 2, a.y + a.h / 2, '#ff3b5c', 12, 1.5);
  sfx('blip'); emit('toast', t('byteSupply'));
}

export function updateAlly() {
  const a = world.ally, p = world.player;
  follow(a, p);
  if (!a.flash) a.face = p.face;   // enquanto atira, olha para o alvo
  shoot(a);
  repair(a, p);
  dropSupply(a, p);
}
