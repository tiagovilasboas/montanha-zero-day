// Ação HACK do relógio: terminal próximo > torreta próxima > pulso EMP.
import { world } from './world.js';
import { center, distance } from './physics.js';
import { emit } from './core.js';
import { sfx } from './audio.js';
import { burst, ring } from './fx.js';
import { openPuzzle } from './puzzle.js';
import { gainXp } from './combat.js';
import { lockButtons } from './player.js';

const EMP_COST = 10, TURRET_COST = 5;

function nearTerminal(p) {
  const c = center(p);
  return world.terminals.find(t => !t.done && Math.abs(t.x + 6 - c.x) < 22 && Math.abs(t.y + 8 - c.y) < 24);
}

function puzzle(opts) {
  openPuzzle({
    ...opts,
    onWin: () => { lockButtons(); opts.onWin(); },
    onFail: () => { lockButtons(); const p = world.player; p.hp = Math.max(1, p.hp - 2); emit('toast', 'Choque de retorno: -2 HP'); },
    onCancel: () => { lockButtons(); opts.onCancel?.(); },
  });
}

function hackBossTerminal(t) {
  const b = world.boss;
  if (!b || b.phase < 2 || !b.shield) return emit('toast', 'Terminal bloqueado. Ainda não é hora.');
  if (t.cool > 0) return emit('toast', 'Terminal recarregando...');
  puzzle({
    kind: Math.random() < 0.5 ? 'grid' : 'bin', level: 3, label: 'NÚCLEO DO TITAN',
    onWin: () => {
      b.shield = false; b.shieldTime = 480; b.stun = 90; t.cool = 600;
      burst(b.x + 22, b.y + 22, '#3df0ff', 30);
      emit('toast', 'FIREWALL DERRUBADO! ATAQUE!');
    },
  });
}

function hackTerminal(t) {
  puzzle({
    kind: t.kind, level: world.level.index + 1, label: `TERMINAL 0x${(0x3a + t.g).toString(16).toUpperCase()}`,
    onWin: () => { t.done = true; world.level.groups[t.g].hacked = true; gainXp(2); emit('toast', 'ACESSO LIBERADO'); },
  });
}

function hackTurret(turret, p) {
  if (p.ep < TURRET_COST) return emit('toast', 'EP insuficiente');
  p.ep -= TURRET_COST;
  puzzle({
    kind: 'seq', level: 0, label: 'TORRETA HOSTIL',
    onWin: () => { turret.ally = true; turret.hp = turret.max; gainXp(4); emit('toast', 'TORRETA AGORA É ALIADA'); },
    onCancel: () => { p.ep = Math.min(p.maxEp, p.ep + TURRET_COST); },   // desistiu: devolve o EP
  });
}

function emp(p) {
  if (p.ep < EMP_COST) return emit('toast', 'EP insuficiente para o pulso EMP');
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
