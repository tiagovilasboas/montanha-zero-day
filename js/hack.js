// Ação HACK do relógio: terminal próximo > torreta próxima > pulso EMP.
import { world } from './world.js';
import { center, distance } from './physics.js';
import { emit } from './core.js';
import { sfx } from './audio.js';
import { burst, ring } from './fx.js';
import { openPuzzle } from './puzzle.js';
import { gainXp } from './combat.js';
import { lockButtons } from './player.js';
import { t as txt } from './i18n.js';

const EMP_COST = 10, TURRET_COST = 5;

function nearTerminal(p) {
  const c = center(p);
  return world.terminals.find(t => !t.done && Math.abs(t.x + 6 - c.x) < 22 && Math.abs(t.y + 8 - c.y) < 24);
}

function puzzle(opts) {
  openPuzzle({
    ...opts,
    onWin: () => { lockButtons(); opts.onWin(); },
    onFail: () => { lockButtons(); const p = world.player; p.hp = Math.max(1, p.hp - 2); emit('toast', txt('shock')); },
    onCancel: () => { lockButtons(); opts.onCancel?.(); },
  });
}

function hackBossTerminal(t) {
  const b = world.boss;
  if (!b || b.phase < 2 || !b.shield) return emit('toast', txt('terminalLocked'));
  if (t.cool > 0) return emit('toast', txt('terminalCooling'));
  puzzle({
    kind: Math.random() < 0.5 ? 'grid' : 'bin', level: 3, label: txt('titanCore'),
    onWin: () => {
      b.shield = false; b.shieldTime = 480; b.stun = 90; t.cool = 600;
      burst(b.x + 22, b.y + 22, '#3df0ff', 30);
      emit('toast', txt('firewallDown'));
    },
  });
}

function hackTerminal(term) {
  puzzle({
    kind: term.kind, level: term.isHardBoss ? 5 : world.level.index + 1, label: term.isHardBoss ? txt('mainframe') : `TERMINAL 0x${(0x3a + term.g).toString(16).toUpperCase()}`,
    onWin: () => { term.done = true; world.level.groups[term.g].hacked = true; gainXp(2); emit('toast', txt('accessGranted')); },
  });
}

function hackTurret(turret, p) {
  if (p.ep < TURRET_COST) return emit('toast', txt('lowEp'));
  p.ep -= TURRET_COST;
  puzzle({
    kind: 'seq', level: 0, label: txt('hostileTurret'),
    onWin: () => { turret.ally = true; turret.hp = turret.max; gainXp(4); emit('toast', txt('turretAllied')); },
    onCancel: () => { p.ep = Math.min(p.maxEp, p.ep + TURRET_COST); },   // desistiu: devolve o EP
  });
}

function emp(p) {
  if (p.ep < EMP_COST) return emit('toast', txt('lowEmp'));
  p.ep -= EMP_COST;
  const c = center(p);
  ring(c.x, c.y); sfx('emp');
  world.enemies.forEach(e => { if (!e.dead && !e.ally && distance(e, p) < 72) e.stun = 150; });
  const b = world.boss;
  if (b && b.active && !b.shield && distance(b, p) < 90) b.stun = 40;
}

export function tryHack() {
  const p = world.player, t = nearTerminal(p);
  if (t) return t.boss ? hackBossTerminal(t) : hackTerminal(t);
  const turret = world.enemies.find(e => e.type === 'turret' && !e.ally && !e.dead && distance(e, p) < 56);
  if (turret) return hackTurret(turret, p);
  emp(p);
}
