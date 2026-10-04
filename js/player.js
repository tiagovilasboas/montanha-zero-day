// Montanha: movimento estilo Mega Man, JET da mochila, tiro do relógio (normal e carregado), dano.
import { PHYS, PLAYER, T, H, HEROES, HERO_HEIGHT, maxHpFor, shotDamage } from './config.js';
import { aimTarget } from './combat.js';
import { save, emit } from './core.js';
import { world, TILE, tileAt } from './world.js';
import { moveX, moveY, touchesTile, center } from './physics.js';
import { input } from './input.js';
import { sfx } from './audio.js';
import { burst, exhaust } from './fx.js';
import { tryHack } from './hack.js';

const CHARGE_FULL = 42;
// A área de acerto do tiro desce além do desenho, para alcançar inimigos no chão (o tiro sai alto, na altura do relógio).
const HIT_DROP = 24;
// Folga em volta do tiro: perdoa por poucos pixels, principalmente contra alvos que se mexem.
const HIT_PAD = 4;

export function createPlayer(spawn, hero = 'montanha') {
  const max = maxHpFor(save.lv);
  spawn = { x: spawn.x, y: spawn.y - (PLAYER.h - 18) };   // o ponto de início foi desenhado para uma caixa de 18: mantém os pés no chão
  return { hero, x: spawn.x, y: spawn.y, w: PLAYER.w, h: PLAYER.h, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, buffer: 0,
    jumping: false, hovering: false, hp: max, max, ep: 30, maxEp: 30, fuel: PHYS.fuel, maxFuel: PHYS.fuel,
    charge: 0, cooldown: 0, shootAnim: 0, invuln: 0, anim: 0, checkpoint: { ...spawn }, lockJump: false, lockFire: false };
}

// Depois de fechar diálogo/puzzle, ignora o botão até ele ser solto (evita pulo/tiro acidental).
export function lockButtons() { const p = world.player; if (p) { p.lockJump = true; p.lockFire = true; } }

function run(p) {
  const acc = p.onGround ? 0.4 : 0.28;
  if (input.left && !input.right) { p.vx = Math.max(p.vx - acc, -PHYS.run); p.face = -1; }
  else if (input.right && !input.left) { p.vx = Math.min(p.vx + acc, PHYS.run); p.face = 1; }
  else { p.vx *= p.onGround ? 0.55 : 0.92; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
}

function jumpAndJet(p) {
  const holding = input.jump && !p.lockJump;
  if (p.onGround) { p.coyote = 6; p.fuel = Math.min(p.maxFuel, p.fuel + 2); } else if (p.coyote > 0) p.coyote--;
  p.buffer = input.pressed.jump && !p.lockJump ? 7 : Math.max(0, p.buffer - 1);

  if (p.buffer && p.coyote) { p.vy = PHYS.jump; p.coyote = p.buffer = 0; p.jumping = true; sfx('jump'); }
  if (p.jumping && !holding && p.vy < PHYS.jumpCut) p.vy = PHYS.jumpCut;
  if (p.vy >= 0) p.jumping = false;

  p.vy = Math.min(p.vy + PHYS.gravity, PHYS.maxFall);
  p.hovering = !p.onGround && holding && !p.jumping && p.vy > -0.2 && p.fuel > 0;
  if (p.hovering) {
    p.vy = Math.max(p.vy - PHYS.jet, PHYS.jetMax);
    p.fuel--;
    if (world.frame % 3 === 0) exhaust(p.x + (p.face > 0 ? 1 : 8), p.y + 14);
  }
}

function shoot(p, charged) {
  const small = world.bullets.filter(b => b.from === 'player' && !b.pierce).length;
  if (!charged && small >= 3) return;
  const dmg = shotDamage(save.lv, charged);
  const b = charged
    ? { w: 12, h: 8, vx: p.face * 4.2, pierce: true, hitSet: new Set() }
    : { w: 6, h: 3, vx: p.face * 4.6 };
  // O desenho é bem mais alto que a caixa de colisão: o tiro nasce onde o relógio aparece na arte.
  const mz = HEROES[p.hero].muzzle, feet = p.y + p.h + 1;
  b.y = feet - (mz.h * HERO_HEIGHT) / 0.97 - b.h / 2;
  const mx = p.x + p.w / 2 + p.face * mz.reach;
  b.x = p.face > 0 ? mx : mx - b.w;
  // Tiro guiado: sai já inclinado para o inimigo mais próximo à frente e curva até ele.
  const foe = aimTarget(mx, b.y + b.h / 2, p.face);
  if (foe) {
    const c = center(foe), a = Math.atan2(c.y - (b.y + b.h / 2), c.x - mx), speed = Math.abs(b.vx);
    b.vx = Math.cos(a) * speed; b.vy = Math.sin(a) * speed; b.target = foe;
  }
  world.bullets.push({ from: 'player', color: HEROES[p.hero].shot, vy: 0, dmg, life: charged ? 120 : 80, pad: HIT_PAD, drop: b.target ? 0 : HIT_DROP, ...b });
  p.cooldown = charged ? 14 : 8; p.shootAnim = 14;
  sfx(charged ? 'big' : 'shoot');
}

function watch(p) {
  if (!input.fire) p.lockFire = false;
  if (p.cooldown) p.cooldown--;
  if (p.shootAnim) p.shootAnim--;
  if (p.lockFire) { p.charge = 0; return; }
  if (input.pressed.fire && !p.cooldown) shoot(p, false);
  if (input.released.fire && p.charge >= CHARGE_FULL) shoot(p, true);
  if (input.fire) { p.charge++; if (p.charge === 20 || p.charge === CHARGE_FULL) sfx('charge'); }
  else p.charge = 0;
}

function hintAtDoor(p) {
  const ahead = Math.floor((p.face > 0 ? p.x + p.w + 2 : p.x - 2) / T), row = Math.floor((p.y + 8) / T);
  if (tileAt(ahead, row) === TILE.DOOR && !world.hints.has('door')) {
    world.hints.add('door');
    emit('toast', 'Porta laser! Hackeie o terminal amarelo');
  }
}

export function updatePlayer() {
  const p = world.player;
  if (!input.jump) p.lockJump = false;
  run(p);
  jumpAndJet(p);
  if (moveX(p, p.vx)) hintAtDoor(p);
  moveY(p, p.vy);
  watch(p);
  if (input.pressed.hack) tryHack();
  if (p.invuln) p.invuln--;
  p.anim += Math.abs(p.vx) * 0.12;
  if (world.frame % 45 === 0) p.ep = Math.min(p.maxEp, p.ep + 1);
  if (touchesTile(p, TILE.LASER) || p.y > H + 16) fallHazard();
}

export function hurtPlayer(dmg, dir = -world.player.face) {
  const p = world.player;
  if (p.invuln || p.hp <= 0) return;
  p.hp -= dmg; p.invuln = 70; p.vx = dir * 2.2; p.vy = -2.6;
  world.cam.shake = 6; sfx('hurt');
  if (p.hp <= 0) emit('player:dead');
}

function fallHazard() {
  const p = world.player;
  p.hp -= 4; sfx('hurt'); world.cam.shake = 8;
  burst(p.x + 5, Math.min(p.y, H - 8), '#ff3b5c', 14);
  if (p.hp <= 0) { emit('player:dead'); return; }
  respawn();
}

export function respawn() {
  const p = world.player;
  Object.assign(p, { x: p.checkpoint.x, y: p.checkpoint.y, vx: 0, vy: 0, invuln: 90, charge: 0 });
}
