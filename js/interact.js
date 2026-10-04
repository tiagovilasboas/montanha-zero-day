// Objetos de cenário que reagem ao toque do jogador: itens, checkpoints, dicas e portal de saída.
import { emit } from './core.js';
import { world } from './world.js';
import { overlap } from './physics.js';
import { sfx } from './audio.js';
import { burst } from './fx.js';
import { t } from './i18n.js';

const PICKUP = {
  hp: p => { p.hp = Math.min(p.max, p.hp + 4); },
  ep: p => { p.ep = Math.min(p.maxEp, p.ep + 10); },
};

export function updateInteractables() {
  const p = world.player;
  for (const it of world.pickups) {
    if (it.taken || !overlap(it, p)) continue;
    it.taken = true; PICKUP[it.kind](p); sfx('pick');
    burst(it.x + 4, it.y + 4, it.kind === 'hp' ? '#ff3b5c' : '#3df0ff', 8);
  }
  world.pickups = world.pickups.filter(it => !it.taken);

  for (const c of world.checkpoints) {
    if (c.on || !overlap(c, p)) continue;
    c.on = true; p.checkpoint = { x: c.x - 1, y: c.y + c.h - p.h };
    sfx('pick'); emit('toast', t('checkpoint'));
  }
  for (const i of world.infos) {
    if (i.seen || !overlap(i, p)) continue;
    i.seen = true; emit('say', [['byte', i.text]]);
  }
  for (const t of world.terminals) if (t.cool > 0) t.cool--;
  if (world.goal && overlap(world.goal, p)) emit('stage:clear');
}
