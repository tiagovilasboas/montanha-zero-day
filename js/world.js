// Mundo: estado compartilhado da fase, construção do mapa a partir dos blocos e consultas de tiles.
import { T, ROWS, CHUNKS, STAGES, THEMES, ENEMY } from './config.js';

export const TILE = { EMPTY: 0, SOLID: 1, PLATFORM: 2, LASER: 3, DOOR: 4, BRIDGE: 5 };

// Estado único da fase em andamento (KISS: um objeto, sem classes).
export const world = {
  level: null, player: null, ally: null, boss: null,
  enemies: [], bullets: [], pickups: [], fx: [], rings: [],
  terminals: [], checkpoints: [], infos: [], goal: null,
  cam: { x: 0, y: 0, zoom: 1, shake: 0 }, frame: 0, time: 0, kills: 0, xpGained: 0, hints: new Set(),
};

const CHAR_TILE = { '#': TILE.SOLID, '=': TILE.PLATFORM, '^': TILE.LASER };
const groupOf = (ch, base) => String.fromCharCode(ch.charCodeAt(0) - base); // a→1, A→1

export function makeEnemy(type, x, y) {
  const def = ENEMY[type];
  return { type, x, y, w: def.w, h: def.h, hp: def.hp, max: def.hp, vx: type === 'turret' ? 0 : -0.55, vy: 0,
    t: Math.random() * 100, cd: 60 + Math.random() * 60, stun: 0, flash: 0, ally: false, dead: false,
    originX: x, originY: y, angle: Math.PI, onGround: false };
}

export function makeBoss(x, y) {
  return { x, y, w: 44, h: 44, baseY: y, hp: 60, max: 60, phase: 1, shield: false, shieldTime: 0,
    stun: 0, flash: 0, cd: 90, spawnCd: 240, t: 0, beam: null, active: false, dead: false, deathT: 0, gone: false };
}

function normalizeRow(row, width) {
  const pad = row.endsWith('#') ? '#' : ' ';
  return row.padEnd(width, pad);
}

export function buildLevel(stageIndex) {
  const stage = STAGES[stageIndex];
  const columns = [], spawns = [], groups = [];
  let infoIndex = 0, arenaX = -1, start = { x: 32, y: 120 };

  for (const name of stage.chunks) {
    const chunk = CHUNKS[name], width = Math.max(...chunk.map(r => r.length)), x0 = columns.length;
    const local = {};
    chunk.join('').replace(/[123]/g, ch => { if (!(ch in local)) { local[ch] = groups.length; groups.push({ hacked: false }); } });
    if (name === 'arena') arenaX = x0 * T;
    for (let i = 0; i < width; i++) columns.push(Array.from({ length: ROWS }, () => ({ t: TILE.EMPTY, g: -1 })));
    chunk.forEach((raw, r) => [...normalizeRow(raw, width)].forEach((ch, i) => {
      const cell = columns[x0 + i][r];
      if (CHAR_TILE[ch]) cell.t = CHAR_TILE[ch];
      else if ('abc'.includes(ch)) { cell.t = TILE.DOOR; cell.g = local[groupOf(ch, 48)]; }
      else if ('ABC'.includes(ch)) { cell.t = TILE.BRIDGE; cell.g = local[groupOf(ch, 16)]; }
      else if (ch !== ' ') spawns.push({ ch, x: (x0 + i) * T, y: r * T, g: local[ch], arena: name === 'arena' });
    }));
  }

  const w = columns.length, grid = new Uint8Array(w * ROWS), grp = new Int16Array(w * ROWS);
  columns.forEach((col, x) => col.forEach((c, r) => { grid[r * w + x] = c.t; grp[r * w + x] = c.g; }));

  Object.assign(world, {
    level: { index: stageIndex, stage, theme: THEMES[stage.theme], w, grid, grp, groups, arenaX, locked: false },
    enemies: [], bullets: [], pickups: [], fx: [], rings: [], terminals: [], checkpoints: [], infos: [],
    goal: null, boss: null, time: 0, kills: 0, xpGained: 0, hints: new Set(),
  });

  for (const s of spawns) {
    switch (s.ch) {
      case 'P': start = { x: s.x + 3, y: s.y - 2 }; break;
      case '1': case '2': case '3':
        world.terminals.push({ x: s.x + 2, y: s.y, w: 12, h: 16, g: s.g, done: false, cool: 0,
          boss: s.arena, kind: ['seq', 'bin', 'grid'][(s.g + stageIndex) % 3] }); break;
      case 'd': world.enemies.push(makeEnemy('drone', s.x, s.y)); break;
      case 'm': world.enemies.push(makeEnemy('crawler', s.x, s.y + 7)); break;
      case 'X': world.enemies.push(makeEnemy('turret', s.x + 1, s.y + 4)); break;
      case 'h': case 'e': world.pickups.push({ kind: s.ch === 'h' ? 'hp' : 'ep', x: s.x + 4, y: s.y + 4, w: 8, h: 8 }); break;
      case 'k': world.checkpoints.push({ x: s.x + 4, y: s.y - 8, w: 8, h: 24, on: false }); break;
      case 'i': world.infos.push({ x: s.x + 2, y: s.y, w: 12, h: 16, seen: false,
        text: stage.infos[infoIndex++] || 'Continue, Montanha. A cidade conta com você.' }); break;
      case 'G': world.goal = { x: s.x, y: s.y - 16, w: 16, h: 32 }; break;
    }
  }
  if (arenaX >= 0) world.boss = makeBoss(arenaX + 15 * T - 8, 56);
  return start;
}

// ---- Consultas de tiles
export function tileAt(tx, ty) {
  const L = world.level;
  if (tx < 0 || tx >= L.w || ty < 0) return TILE.SOLID;
  if (ty >= ROWS) return TILE.EMPTY;
  return L.grid[ty * L.w + tx];
}
const groupHacked = (tx, ty) => !!world.level.groups[world.level.grp[ty * world.level.w + tx]]?.hacked;

export function isSolid(tx, ty) {
  const t = tileAt(tx, ty);
  if (t === TILE.SOLID) return true;
  if (t === TILE.DOOR) return !groupHacked(tx, ty);
  if (t === TILE.BRIDGE) return groupHacked(tx, ty);
  return false;
}
export const isHackedGroupTile = groupHacked;

export function setArenaWall(solid) {
  const L = world.level, col = L.arenaX / T;
  for (let r = 0; r < ROWS - 2; r++) L.grid[r * L.w + col] = solid ? TILE.SOLID : TILE.EMPTY;
  L.locked = solid;
}
