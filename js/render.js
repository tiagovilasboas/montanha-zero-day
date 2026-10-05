// Renderização: fundo parallax, tiles, objetos, inimigos, chefe, herói e efeitos. Só desenho, nenhuma regra.
import { W, H, T, ROWS, THEMES, PAL, HEROES, HERO_HEIGHT } from './config.js';
import { rng } from './core.js';
import { world, TILE, tileAt, isHackedGroupTile, pulseState } from './world.js';
import { art, anim } from './assets.js';
import { clawY, clawClosed, clawHeight, sceneDarkness, sceneFlash } from './scene.js';
import { hackTarget } from './hack.js';

const LAYER_W = 640;
const CYAN = PAL.C, MAGENTA = PAL.M, RED = PAL.R, YELLOW = PAL.Y, WHITE = PAL.W, GREEN = '#7dff9b', GREY = '#5a5f78';
const layerCache = new Map();
const TILE_ART = { city: 'tile_city', dc: 'tile_dc', core: 'tile_core' };
const ENEMY_WIDTH = { drone: 31, crawler: 29, turret: 24 };
const BYTE_HEIGHT = 13, BOSS_WIDTH = 72, CAPSULE_HEIGHT = 45;
let vx0 = 0, scale = 1;

// O canvas tem W*scale x H*scale pixels reais; todo o desenho usa coordenadas lógicas.
export function setRenderScale(s) { scale = s; }
function beginFrame(ctx) { ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.imageSmoothingEnabled = false; ctx.imageSmoothingQuality = 'high'; }

// Imagem HD com suavização, ancorada no centro da base; espelha quando flip = true.
function drawArt(ctx, img, cx, bottom, width, flip = false) {
  const height = (img.height / img.width) * width;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(cx, bottom);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -width / 2, -height, width, height);
  ctx.restore();
}
const widthFor = (img, height) => (img.width / img.height) * height;

const sx = x => Math.round(x - vx0);
const blink = (n, period = 2) => Math.floor(world.frame / period) % n === 0;

function rect(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

function ring(ctx, color, x, y, rx, ry = rx, width = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); ctx.stroke();
}

// ---- Camadas de fundo (geradas uma vez por tema)
function makeLayer(draw, seed) {
  const c = document.createElement('canvas'); c.width = LAYER_W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  draw(g, rng(seed));
  return c;
}

function skyGradient(g, theme) {
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.sky[0]); grad.addColorStop(1, theme.sky[1]);
  g.fillStyle = grad; g.fillRect(0, 0, LAYER_W, H);
}

function buildings(g, r, { minH, maxH, color, windows, neon }) {
  for (let x = 0; x < LAYER_W;) {
    const w = 20 + Math.floor(r() * 30), h = minH + Math.floor(r() * (maxH - minH)), top = H - h;
    rect(g, color, x, top, w, h);
    for (let wy = top + 4; wy < H - 4; wy += 6)
      for (let wx = x + 3; wx < x + w - 3; wx += 5)
        if (r() < 0.35) rect(g, windows[Math.floor(r() * windows.length)], wx, wy, 2, 2);
    if (neon && r() < 0.35) rect(g, r() < 0.5 ? MAGENTA : CYAN, x + 2, top + 6 + Math.floor(r() * 20), w - 4, 1);
    x += w + Math.floor(r() * 6);
  }
}

const FAR = {
  city(g, r, theme) {
    skyGradient(g, theme);
    for (let i = 0; i < 90; i++) rect(g, r() < 0.2 ? '#c8d0ff' : '#6c6fa8', Math.floor(r() * LAYER_W), Math.floor(r() * 110), 1, 1);
    g.fillStyle = '#f4ecc8'; g.beginPath(); g.arc(470, 36, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = theme.sky[0]; g.beginPath(); g.arc(476, 32, 11, 0, Math.PI * 2); g.fill();
    buildings(g, r, { minH: 50, maxH: 110, color: '#1a0f38', windows: ['#3a2a6a', '#4a2f7a'] });
  },
  dc(g, r, theme) {
    skyGradient(g, theme);
    for (let x = 4; x < LAYER_W; x += 28) {
      rect(g, '#0a1d24', x, 40, 22, H - 40);
      for (let y = 46; y < H - 6; y += 6) {
        rect(g, '#0f2a33', x + 2, y, 18, 4);
        if (r() < 0.6) rect(g, r() < 0.5 ? GREEN : CYAN, x + 4 + Math.floor(r() * 12), y + 1, 1, 1);
      }
    }
  },
  core(g, r, theme) {
    skyGradient(g, theme);
    const cx = LAYER_W / 2, cy = 80;
    const glow = g.createRadialGradient(cx, cy, 2, cx, cy, 70);
    glow.addColorStop(0, '#ff6a80'); glow.addColorStop(0.3, '#a0102c'); glow.addColorStop(1, 'rgba(60,0,10,0)');
    g.fillStyle = glow; g.fillRect(cx - 80, cy - 80, 160, 160);
    g.globalAlpha = 0.25;
    for (let y = 110; y < H; y += Math.max(2, (y - 100) / 4)) rect(g, RED, 0, Math.floor(y), LAYER_W, 1);
    for (let i = -20; i <= 20; i++) {
      g.strokeStyle = RED; g.lineWidth = 1; g.beginPath();
      g.moveTo(cx + i * 6, 110); g.lineTo(cx + i * 60, H); g.stroke();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 30; i++) rect(g, '#ff8a9a', Math.floor(r() * LAYER_W), Math.floor(r() * 100), 1, 1);
  },
};

const NEAR = {
  city(g, r) { buildings(g, r, { minH: 30, maxH: 80, color: '#120a26', windows: [YELLOW, CYAN, '#2a1f4a'], neon: true }); },
  dc(g, r) {
    for (let x = 10; x < LAYER_W; x += 60 + Math.floor(r() * 40)) {
      rect(g, '#081419', x, 0, 10, H); rect(g, '#14323c', x + 2, 0, 1, H);
    }
    for (let i = 0; i < 6; i++) {
      const y = 10 + Math.floor(r() * 60), sag = 8 + Math.floor(r() * 10);
      for (let x = 0; x < LAYER_W; x += 2) rect(g, '#0e2a30', x, y + Math.round(Math.sin((x / LAYER_W) * Math.PI * 4) * sag), 2, 1);
    }
  },
  core(g, r) {
    for (let x = 20; x < LAYER_W; x += 70 + Math.floor(r() * 50)) {
      rect(g, '#1a0610', x, 30, 14, H - 30); rect(g, '#2e0a18', x, 26, 14, 4);
      rect(g, RED, x + 6, 40, 2, H - 60);
    }
  },
};

function layersFor(theme) {
  if (!layerCache.has(theme.name)) {
    const seed = theme.name.length * 977;
    layerCache.set(theme.name, {
      far: makeLayer((g, r) => FAR[theme.name](g, r, theme), seed),
      near: makeLayer((g, r) => NEAR[theme.name](g, r, theme), seed + 1),
    });
  }
  return layerCache.get(theme.name);
}

function drawLayer(ctx, layer, offset) {
  const x = -Math.floor(((offset % LAYER_W) + LAYER_W) % LAYER_W);
  ctx.drawImage(layer, x, 0); ctx.drawImage(layer, x + LAYER_W, 0);
}

// Camada pintada: repete espelhando a cada cópia para esconder a emenda.
function drawArtLayer(ctx, img, offset) {
  const w = widthFor(img, H);
  ctx.imageSmoothingEnabled = true;
  for (let i = Math.floor(offset / w); i * w - offset < W; i++) {
    const x = i * w - offset;
    ctx.save();
    ctx.translate(i % 2 ? x + w : x, 0);
    if (i % 2) ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w + 0.5, H);
    ctx.restore();
  }
  ctx.imageSmoothingEnabled = false;
}

function drawParallax(ctx, theme, camX) {
  const farArt = art(`bg_${theme.name}_far`), nearArt = art(`bg_${theme.name}_near`);
  if (farArt && nearArt) { drawArtLayer(ctx, farArt, camX * 0.2); drawArtLayer(ctx, nearArt, camX * 0.5); return; }
  const { far, near } = layersFor(theme);
  drawLayer(ctx, far, camX * 0.2);
  drawLayer(ctx, near, camX * 0.5);
}

// ---- Tiles
function drawSolid(ctx, theme, x, y, tx, ty) {
  const tex = art(TILE_ART[theme.name]);
  if (tex) {
    // Bloco com o céu acima mostra a borda brilhante; bloco interno usa só o miolo da textura.
    const sy = tileAt(tx, ty - 1) === TILE.SOLID ? tex.height * 0.3 : 0;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tex, 0, sy, tex.width, tex.height - sy, x, y, T + 0.25, T + 0.25);
    ctx.imageSmoothingEnabled = false;
    return;
  }
  rect(ctx, theme.solid, x, y, T, T);
  rect(ctx, theme.line, x, y + T - 1, T, 1); rect(ctx, theme.line, x + T - 1, y, 1, T);
  if (tileAt(tx, ty - 1) !== TILE.SOLID) rect(ctx, theme.hi, x, y, T, 2);
  if ((tx * 7 + ty * 13) % 5 === 0) { rect(ctx, theme.line, x + 3, y + 5, 1, 1); rect(ctx, theme.line, x + 12, y + 5, 1, 1); }
}

function drawPlatform(ctx, theme, x, y) {
  rect(ctx, theme.platBody, x, y, T, 4); rect(ctx, theme.plat, x, y, T, 1);
  rect(ctx, theme.platBody, x + 3, y + 4, 1, 3); rect(ctx, theme.platBody, x + 12, y + 4, 1, 3);
}

function drawLaser(ctx, x, y) {
  ctx.globalAlpha = 0.25 + 0.2 * Math.sin(world.frame * 0.2);
  rect(ctx, RED, x, y + 6, T, 10);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 4; i++) {
    const bx = x + i * 4;
    rect(ctx, RED, bx, y + 14, 4, 2); rect(ctx, RED, bx + 1, y + 11, 2, 3); rect(ctx, '#ffb0bc', bx + 1, y + 10, 1, 1);
  }
}

// Feixe de pulso: ligado é uma coluna de luz; avisando, pisca fino; desligado, só os emissores.
function drawPulse(ctx, x, y, tx, ty) {
  const state = pulseState(tx, ty), top = tileAt(tx, ty - 1) !== TILE.PULSE, bottom = tileAt(tx, ty + 1) !== TILE.PULSE;
  if (state === 'on') {
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(world.frame * 0.6 + ty);
    rect(ctx, MAGENTA, x + 3, y, 10, T);
    ctx.globalAlpha = 1;
    rect(ctx, '#ffd0f4', x + 6, y, 4, T); rect(ctx, WHITE, x + 7, y, 2, T);
  } else if (state === 'warn' && blink(2, 3)) {
    rect(ctx, MAGENTA, x + 7, y, 2, T);
  } else {
    // Desligado: um fio apagado marca onde o feixe vai acender (os emissores podem estar fora da tela).
    ctx.globalAlpha = 0.28; rect(ctx, WHITE, x + 7, y, 1, T); rect(ctx, MAGENTA, x + 8, y, 1, T);
    if ((ty + (world.frame >> 3)) % 3 === 0) { ctx.globalAlpha = 0.4; rect(ctx, MAGENTA, x + 7, y + 6, 2, 4); }
    ctx.globalAlpha = 1;
  }
  if (top) { rect(ctx, GREY, x + 3, y, 10, 3); rect(ctx, state === 'off' ? '#5a2f60' : MAGENTA, x + 6, y + 3, 4, 1); }
  if (bottom) { rect(ctx, GREY, x + 3, y + T - 3, 10, 3); rect(ctx, state === 'off' ? '#5a2f60' : MAGENTA, x + 6, y + T - 4, 4, 1); }
}

function drawDoor(ctx, x, y, tx, ty) {
  if (isHackedGroupTile(tx, ty)) return;
  for (let i = 0; i < 3; i++) rect(ctx, (world.frame + i * 3) % 8 < 4 ? CYAN : MAGENTA, x + 3 + i * 5, y, 1, T);
  if (tileAt(tx, ty - 1) !== TILE.DOOR) rect(ctx, GREY, x + 1, y, 14, 3);
  if (tileAt(tx, ty + 1) !== TILE.DOOR) rect(ctx, GREY, x + 1, y + T - 3, 14, 3);
}

function drawBridge(ctx, x, y, tx, ty) {
  if (isHackedGroupTile(tx, ty)) {
    rect(ctx, '#123a48', x, y, T, 6); rect(ctx, CYAN, x, y, T, 1); rect(ctx, CYAN, x, y + 5, T, 1);
    return;
  }
  ctx.globalAlpha = blink(2, 20) ? 0.35 : 0.15;
  for (let i = 0; i < T; i += 4) { rect(ctx, CYAN, x + i, y, 2, 1); rect(ctx, CYAN, x + i, y + 5, 2, 1); }
  ctx.globalAlpha = 1;
}

function drawTiles(ctx, theme) {
  const L = world.level, first = Math.max(0, Math.floor(vx0 / T)), last = Math.min(L.w - 1, Math.floor((vx0 + W) / T));
  for (let ty = 0; ty < ROWS; ty++)
    for (let tx = first; tx <= last; tx++) {
      const t = L.grid[ty * L.w + tx], x = tx * T - vx0, y = ty * T;
      if (t === TILE.SOLID) drawSolid(ctx, theme, x, y, tx, ty);
      else if (t === TILE.PLATFORM) drawPlatform(ctx, theme, x, y);
      else if (t === TILE.LASER) drawLaser(ctx, x, y);
      else if (t === TILE.DOOR) drawDoor(ctx, x, y, tx, ty);
      else if (t === TILE.BRIDGE) drawBridge(ctx, x, y, tx, ty);
      else if (t === TILE.PULSE) drawPulse(ctx, x, y, tx, ty);
    }
}

// ---- Objetos interativos
function terminalScreen(t) {
  if (t.boss) return world.boss && world.boss.shield && t.cool <= 0 ? (blink(2, 8) ? MAGENTA : '#8a2a70') : GREY;
  if (t.done) return GREEN;
  return blink(2, 16) ? YELLOW : '#7a6420';
}

function drawTerminal(ctx, t) {
  const x = sx(t.x), y = Math.round(t.y);
  rect(ctx, '#2a3050', x, y + 2, 12, 14); rect(ctx, '#11152a', x + 1, y + 3, 10, 7);
  rect(ctx, terminalScreen(t), x + 2, y + 4, 8, 5);
  rect(ctx, '#454c70', x + 2, y + 12, 8, 2);
}

// Etiqueta "HACK" flutuando em cima do terminal ou da torreta que o botão vai hackear.
function drawHackTag(ctx) {
  const tg = hackTarget();
  if (!tg) return;
  const x = Math.round(sx(tg.x)), y = Math.round(tg.y - 9 + Math.sin(world.frame * 0.12) * 1.5);
  rect(ctx, '#0b0d18', x - 12, y - 5, 24, 9); rect(ctx, MAGENTA, x - 12, y - 5, 24, 1); rect(ctx, MAGENTA, x - 12, y + 3, 24, 1);
  rect(ctx, '#0b0d18', x - 1, y + 4, 2, 2);
  ctx.fillStyle = blink(2, 10) ? WHITE : MAGENTA; ctx.font = '5px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('HACK', x, y);
}

function drawCheckpoint(ctx, c) {
  const x = sx(c.x) + 3, y = Math.round(c.y);
  rect(ctx, GREY, x, y + 4, 2, 20); rect(ctx, '#2a3050', x - 2, y + 22, 6, 2);
  const light = c.on ? GREEN : '#777c90';
  if (c.on) { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(world.frame * 0.15); rect(ctx, GREEN, x - 2, y - 1, 6, 6); ctx.globalAlpha = 1; }
  rect(ctx, light, x - 1, y, 4, 4);
}

function drawInfo(ctx, info) {
  const x = sx(info.x) + 6, y = Math.round(info.y + 6 + Math.sin(world.frame * 0.08) * 2);
  ctx.globalAlpha = info.seen ? 0.4 : 0.9;
  for (let i = 0; i < 5; i++) rect(ctx, CYAN, x - i, y - 4 + i, 1 + i * 2, 1), rect(ctx, CYAN, x - i, y + 4 - i, 1 + i * 2, 1);
  rect(ctx, '#0b2a40', x, y - 2, 1, 1); rect(ctx, '#0b2a40', x, y, 1, 3);
  ctx.globalAlpha = 1;
}

function drawGoal(ctx, g) {
  const cx = sx(g.x) + 8, cy = Math.round(g.y) + 16;
  for (let i = 0; i < 4; i++) {
    const color = (Math.floor(world.frame / 6) + i) % 2 ? CYAN : MAGENTA;
    ring(ctx, color, cx, cy, 3 + i * 2 + Math.sin(world.frame * 0.1 + i) * 0.8, 6 + i * 3.5);
  }
}

function drawPickup(ctx, p) {
  const x = sx(p.x), y = Math.round(p.y + Math.sin(world.frame * 0.1 + p.x) * 1.5);
  if (p.kind === 'hp') {
    rect(ctx, WHITE, x, y, 8, 8); rect(ctx, RED, x + 3, y + 1, 2, 6); rect(ctx, RED, x + 1, y + 3, 6, 2);
  } else {
    rect(ctx, '#0b3a48', x + 1, y, 6, 8);
    rect(ctx, CYAN, x + 4, y + 1, 2, 3); rect(ctx, CYAN, x + 2, y + 3, 4, 2); rect(ctx, CYAN, x + 2, y + 5, 2, 2);
  }
}

// ---- Inimigos e chefe
function drawSparks(ctx, cx, cy, radius, count = 2) {
  for (let i = 0; i < count; i++) {
    const a = world.frame * 0.25 + (i * Math.PI * 2) / count;
    rect(ctx, YELLOW, Math.round(cx + Math.cos(a) * radius), Math.round(cy + Math.sin(a) * radius * 0.5), 2, 2);
  }
}

function drawTurret(ctx, e) {
  const x = sx(e.x), y = Math.round(e.y), cx = x + 7, cy = y + 5;
  rect(ctx, '#2a3050', x, y + 7, 14, 5); rect(ctx, '#454c70', x, y + 7, 14, 1);
  const dome = e.ally ? CYAN : RED;
  rect(ctx, dome, x + 3, y + 2, 8, 5); rect(ctx, dome, x + 4, y + 1, 6, 1);
  for (let i = 2; i < 9; i++) rect(ctx, '#9aa0b8', Math.round(cx + Math.cos(e.angle) * i), Math.round(cy + Math.sin(e.angle) * i), 2, 2);
  rect(ctx, e.ally ? WHITE : YELLOW, cx, cy - 1, 1, 1);
}

function drawEnemyArt(ctx, e, img) {
  // A arte olha para a esquerda; espelha quando o inimigo vai (ou mira) para a direita.
  const facingRight = e.type === 'turret' ? Math.cos(e.angle) > 0 : e.vx > 0;
  if (e.ally) ctx.filter = 'hue-rotate(180deg) saturate(1.3)';
  drawArt(ctx, img, sx(e.x) + e.w / 2, e.y + e.h + (e.type === 'drone' ? 2 : 0), ENEMY_WIDTH[e.type], facingRight);
  ctx.filter = 'none';
}

function drawEnemy(ctx, e) {
  if (e.flash > 0 && blink(2)) return;
  const img = art(e.type);
  if (img) drawEnemyArt(ctx, e, img);
  else if (e.type === 'turret') drawTurret(ctx, e);
  // else we just wait for HD art to load
  if (e.stun > 0) drawSparks(ctx, sx(e.x) + e.w / 2, e.y - 2, 7);
}

function drawShackle(ctx, x, y) {
  ctx.strokeStyle = '#6a1424'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x + 22, y + 10, 13, Math.PI, 0); ctx.stroke();
  rect(ctx, '#6a1424', x + 7, y + 8, 5, 8); rect(ctx, '#6a1424', x + 32, y + 8, 5, 8);
}

function drawBossBody(ctx, b, x, y) {
  drawShackle(ctx, x, y);
  rect(ctx, RED, x + 1, y + 13, 42, 31); rect(ctx, '#2a1018', x + 2, y + 14, 40, 29);
  const pulse = 2 + Math.round(Math.sin(b.t * 0.15) * 1.5);
  ctx.globalAlpha = 0.4; rect(ctx, RED, x + 22 - pulse - 3, y + 22 - pulse - 3, (pulse + 3) * 2, (pulse + 3) * 2); ctx.globalAlpha = 1;
  rect(ctx, RED, x + 19, y + 19, 6, 6); rect(ctx, '#ffb0bc', x + 21, y + 21, 2, 2);
  rect(ctx, YELLOW, x + 20, y + 30, 4, 4); rect(ctx, YELLOW, x + 21, y + 34, 2, 5);
  rect(ctx, '#3a3f58', x - 6, y + 22, 9, 6); rect(ctx, '#1d2236', x - 8, y + 23, 3, 4);
}

function drawShield(ctx, cx, cy) {
  const r = 30 + Math.sin(world.frame * 0.12) * 2;
  ctx.globalAlpha = 0.18; ctx.fillStyle = MAGENTA; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.8; ring(ctx, MAGENTA, cx, cy, r);
  for (let i = 0; i < 6; i++) {
    const a = world.frame * 0.02 + (i * Math.PI) / 3;
    rect(ctx, '#ffb0ee', Math.round(cx + Math.cos(a) * r) - 2, Math.round(cy + Math.sin(a) * r) - 1, 4, 2);
  }
  ctx.globalAlpha = 1;
}

function drawBeam(ctx, beam) {
  const y = Math.round(beam.y);
  if (beam.t < 45) { if (blink(2, 4)) rect(ctx, RED, 0, y + 3, W, 1); return; }
  if (beam.t < 70) { rect(ctx, RED, 0, y, W, 6); rect(ctx, WHITE, 0, y + 2, W, 2); }
}

// Gle já libertada: de pé onde ficava a cápsula, olhando para onde o Montanha foi levado.
function drawFreedGle(ctx, g) {
  const a = anim('gle_idle'), cx = sx(g.x + g.w / 2), feet = g.y + g.h;
  if (a) drawAnim(ctx, a, Math.floor((world.scene.t * ANIM_FPS.idle) / 60) % a.frames, cx, feet, true);
}

// Garra do TITAN: drone no alto, cabo, tenaz e feixe que prende o herói.
function drawRapture(ctx) {
  const s = world.scene, p = world.player;
  if (!s || s.freed) return;
  const cx = sx(p.x + p.w / 2), tip = clawY(s.t, s.baseY - 2, world.cam.y), top = tip - clawHeight(), closed = clawClosed(s.t);
  if (s.t > 30) {   // feixe de captura
    ctx.globalAlpha = Math.min(0.35, (s.t - 30) / 100) * (0.8 + 0.2 * Math.sin(s.t * 0.4)); ctx.fillStyle = '#ff4fd8';
    ctx.beginPath(); ctx.moveTo(cx - 3, tip); ctx.lineTo(cx + 3, tip); ctx.lineTo(cx + 22, tip + 70); ctx.lineTo(cx - 22, tip + 70); ctx.fill(); ctx.globalAlpha = 1;
  }
  rect(ctx, '#3a3f58', cx, top - 6, 1, 6 + clawHeight());               // cabo
  rect(ctx, '#1d2236', cx - 14, top - 10, 28, 9); rect(ctx, '#3a3f58', cx - 12, top - 12, 24, 3);   // corpo do drone
  rect(ctx, RED, cx - 3, top - 7, 6, 3); if (blink(2, 6)) rect(ctx, WHITE, cx - 1, top - 6, 2, 1);  // olho
  const open = (1 - closed) * 7 + 2;                                     // tenaz que fecha ao agarrar
  ctx.strokeStyle = '#8a90b0'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, tip - 8); ctx.lineTo(cx + d * open, tip - 2); ctx.lineTo(cx + d * (open - 3), tip + 5); ctx.stroke(); }
  ctx.lineCap = 'butt';
}

// Escurece o céu quando a ameaça chega e acende um clarão quando a cápsula abre.
function drawSceneTint(ctx) {
  const s = world.scene; if (!s) return;
  const dark = sceneDarkness(s.t), flash = sceneFlash(s.t);
  if (dark > 0) { ctx.globalAlpha = dark; rect(ctx, '#2a0a30', 0, 0, W, H); }
  if (flash > 0) { ctx.globalAlpha = flash * 0.8; rect(ctx, WHITE, 0, 0, W, H); }
  ctx.globalAlpha = 1;
}

// Gle presa na cápsula criptografada, no lugar do portal da fase do resgate.
function drawCaptive(ctx) {
  const g = world.goal;
  if (!g || !world.level.stage.rescue) return;
  if (world.scene?.freed) { drawFreedGle(ctx, g); return; }
  const x = sx(g.x), y = g.y + g.h - 90, img = art('gleyce_capsule');
  // A Gle dentro da cápsula ocupa ~80% da altura dela: cápsula de 45 deixa a Gle do tamanho do Montanha (36).
  if (img) { drawArt(ctx, img, x + 8, y + 90, widthFor(img, CAPSULE_HEIGHT)); return; }
  const glow = 0.25 + 0.1 * Math.sin(world.frame * 0.08);
  rect(ctx, '#2a3050', x - 2, y + 82, 20, 8); rect(ctx, '#2a3050', x - 2, y - 4, 20, 6);
  ctx.globalAlpha = glow; rect(ctx, CYAN, x, y, 16, 82); ctx.globalAlpha = 1;
  rect(ctx, '#e9dcb4', x + 4, y + 18, 8, 22); rect(ctx, '#f0c9a8', x + 5, y + 20, 6, 7);
  rect(ctx, '#1d2236', x + 5, y + 40, 6, 30); rect(ctx, '#c9d2e8', x + 5, y + 46, 6, 2);
  rect(ctx, MAGENTA, x + 7, y + 60, 2, 2);
  ctx.globalAlpha = 0.6; rect(ctx, WHITE, x + 2, y + 4, 1, 74); ctx.globalAlpha = 1;
}

function drawBoss(ctx, b) {
  if (!b || b.gone || !(b.active || world.level.locked)) return;
  const x = sx(b.x), y = Math.round(b.y);
  const img = art('boss');
  if (!(b.flash > 0 && blink(2))) {
    if (img) drawArt(ctx, img, x + b.w / 2, y + b.h + 4, BOSS_WIDTH);
    // else we wait for HD art to load
  }
  if (b.shield) drawShield(ctx, x + b.w / 2, y + b.h / 2);
  if (b.stun > 0) drawSparks(ctx, x + b.w / 2, y + 4, 18, 3);
  if (b.beam) drawBeam(ctx, b.beam);
}

// ---- Aliado, herói e projéteis
// O robô da Gle é rosa, e o tiro dele também.
const botColor = () => (HEROES[world.player.hero].bot === 'byte_pink' ? MAGENTA : GREEN);

function drawAlly(ctx, a) {
  if (!a) return;
  const x = sx(a.x), y = Math.round(a.y), img = art(HEROES[world.player.hero].bot);
  if (a.flash) { const mx = x + 6 + a.face * 9; rect(ctx, botColor(), mx - 2, y + 3, 4, 4); rect(ctx, WHITE, mx - 1, y + 4, 2, 2); }
  if (img) { drawArt(ctx, img, x + 6, y + 13 + Math.sin(world.frame * 0.1), widthFor(img, BYTE_HEIGHT), a.face < 0); return; }
  // else wait for HD art
}

function heroKey(p) {
  const torso = p.shootAnim > 0 ? 'shoot' : 'idle';
  const legs = !p.onGround ? 'jump' : Math.abs(p.vx) > 0.3 ? (Math.floor(p.anim) % 2 ? 'run1' : 'run2') : 'stand';
  return `${torso}-${legs}`;
}

function drawCharge(ctx, p) {
  const mz = HEROES[p.hero].muzzle, feet = p.y + p.h + 1, cx = sx(p.x + p.w / 2);
  if (p.charge > 20) {
    const hx = cx + p.face * mz.reach, hy = feet - (mz.h * HERO_HEIGHT) / 0.97;
    for (let i = 0; i < 2; i++) {
      const a = world.frame * 0.4 + i * Math.PI;
      rect(ctx, HEROES[p.hero].shot, Math.round(hx + Math.cos(a) * 3), Math.round(hy + Math.sin(a) * 3), 1, 1);
    }
  }
  if (p.charge >= 42) {
    const color = blink(2, 3) ? HEROES[p.hero].shot : MAGENTA, by = feet - HERO_HEIGHT * 0.5;
    for (let i = 0; i < 6; i++) {
      const a = world.frame * 0.15 + (i * Math.PI) / 3;
      rect(ctx, color, Math.round(cx + Math.cos(a) * 10), Math.round(by + Math.sin(a) * 14), 1, 1);
    }
  }
}

function heroPose(p) {
  if (p.shootAnim > 0) return 'shoot';
  if (!p.onGround) return 'jump';
  return Math.abs(p.vx) > 0.3 ? 'run' : 'idle';
}

// Quadro da animação conforme a ação: corrida e respiração em loop, tiro acompanha o recuo.
const ANIM_FPS = { idle: 8, air: 10, hover: 16 };
const SHOOT_FIRST = 2;
// A corrida avança pela distância percorrida (p.anim), não pelo relógio: os pés não deslizam no chão
// e a passada acelera junto com o herói.
const RUN_STEP = 1.15;
const all = n => Array.from({ length: n }, (_, i) => i);
function animFrame(a, pose, p) {
  // O tiro nasce com o braço esticado: pula os quadros de preparação (0 e 1) e mostra só a parte do disparo.
  if (pose === 'shoot') return SHOOT_FIRST + Math.min(a.frames - SHOOT_FIRST - 1, Math.floor(((14 - p.shootAnim) / 14) * (a.frames - SHOOT_FIRST)));
  const pick = HEROES[p.hero].frames;
  if (pose === 'run') { const seq = pick.run || all(a.frames); return seq[Math.floor(p.anim * RUN_STEP) % seq.length]; }
  if (pose === 'jump') {
    const mode = p.hovering ? 'hover' : 'air', seq = pick[mode] || all(a.frames);
    return seq[Math.floor((world.frame * ANIM_FPS[mode]) / 60) % seq.length];
  }
  return Math.floor((world.frame * ANIM_FPS.idle) / 60) % a.frames;
}

// Aura de energia do herói: um contorno suave na cor dele, que pulsa e cresce ao carregar o tiro ou voar.
function auraFor(p) {
  const hero = HEROES[p.hero], boost = (p.charge > 20 ? 0.35 : 0) + (p.hovering ? 0.2 : 0);
  return { color: hero.glow, alpha: Math.min(1, hero.aura * (0.75 + 0.25 * Math.sin(world.frame * 0.08)) + boost) };
}

// Folha de animação: desenha um quadro com a âncora (centro dos pés) no ponto (cx, bottom).
function drawAnim(ctx, a, frame, cx, bottom, flip, aura) {
  const k = HERO_HEIGHT / (a.ay * 0.97), w = a.w * k, h = a.h * k;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(cx, bottom);
  if (flip) ctx.scale(-1, 1);
  if (aura) {
    // shadowBlur é em pixels reais: acompanha a escala atual (tela x zoom da câmera).
    ctx.shadowColor = aura.color; ctx.shadowBlur = 2.6 * Math.abs(ctx.getTransform().a);
    ctx.globalAlpha = aura.alpha;
    ctx.drawImage(a.img, frame * a.w, 0, a.w, a.h, -a.ax * k, -a.ay * k, w, h);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1;
  }
  ctx.drawImage(a.img, frame * a.w, 0, a.w, a.h, -a.ax * k, -a.ay * k, w, h);
  ctx.restore();
}

function drawHeroArt(ctx, p, img) {
  const running = p.onGround && Math.abs(p.vx) > 0.3;
  const bob = running ? -Math.abs(Math.sin(p.anim * 1.6)) * 1.5 : Math.sin(world.frame * 0.06) * 0.3;
  const lean = p.shootAnim > 0 ? p.face * 3 : 0; // a pose de tiro é mais larga para o lado do braço
  drawArt(ctx, img, sx(p.x + p.w / 2) + lean, p.y + p.h + 1 + bob, widthFor(img, HERO_HEIGHT), p.face < 0);
}

function drawHero(ctx, p) {
  const prefix = HEROES[p.hero].art, pose = heroPose(p), a = anim(`${prefix}_${pose}`);
  if (a) { drawAnim(ctx, a, animFrame(a, pose, p), sx(p.x + p.w / 2), p.y + p.h + 1, p.face < 0, auraFor(p)); return true; }
  const img = art(`${prefix}_${pose}`);
  if (img) { drawHeroArt(ctx, p, img); return true; }
  return false;
}

function drawPlayer(ctx, p) {
  // Pisca durante a invulnerabilidade, menos na explosão do chefe (ali ela é só proteção, não dano).
  if (!p || (p.invuln > 0 && !world.boss?.dead && Math.floor(world.frame / 2) % 2)) return;
  const x = sx(p.x - 3), y = Math.round(p.y - 2);
  drawHero(ctx, p); // will return false if not loaded, but we don't care, we just wait for HD
  drawCharge(ctx, p, x, y);
}

function drawBullet(ctx, b) {
  const x = sx(b.x), y = Math.round(b.y);
  // Tiros guiados voam inclinados: gira o desenho para apontar na direção do movimento.
  const tilted = b.from === 'player' && Math.abs(b.vy) > 0.05;
  if (tilted) { ctx.save(); ctx.translate(x + b.w / 2, y + b.h / 2); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.translate(-(x + b.w / 2), -(y + b.h / 2)); }
  if (b.from === 'player' && b.pierce) {
    const flick = blink(2) ? 1 : 0;
    const c = b.color || CYAN;
    rect(ctx, c, x, y + 1 - flick, 12, 6 + flick * 2); rect(ctx, c, x + 2, y, 8, 8); rect(ctx, WHITE, x + 3, y + 2, 6, 4);
  } else if (b.from === 'player') {
    rect(ctx, b.color || CYAN, x, y, 6, 3); rect(ctx, WHITE, x + 1, y + 1, 4, 1);
  } else if (b.from === 'ally') {
    rect(ctx, botColor(), x - 1, y, 6, 4); rect(ctx, WHITE, x + 1, y + 1, 2, 2);
  } else {
    rect(ctx, RED, x, y, b.w, b.h); rect(ctx, '#4a0814', x + 1, y + 1, b.w - 2, b.h - 2);
  }
  if (tilted) ctx.restore();
}

function drawHeart(ctx, x, y, s, color, alpha) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.8, y - s * 1.2, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.8, y - s * 1.2, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
  ctx.fill();
  ctx.fillStyle = '#fff'; ctx.globalAlpha = alpha * 0.7; ctx.beginPath(); ctx.ellipse(x - s * 0.5, y - s * 0.35, s * 0.2, s * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawEffects(ctx) {
  for (const f of world.fx) {
    if (f.heart) drawHeart(ctx, sx(f.x), f.y, f.size * 0.5 * Math.min(1, f.age / 6), f.color, Math.min(1, f.life / 25));
    else rect(ctx, f.color, sx(f.x), Math.round(f.y), f.size, f.size);
  }
  for (const r of world.rings) { ctx.globalAlpha = Math.max(0, r.life / 24); ring(ctx, CYAN, sx(r.x), r.y, r.r); }
  ctx.globalAlpha = 1;
}

// ---- API pública
export function renderWorld(ctx) {
  beginFrame(ctx);
  const cam = world.cam, theme = world.level.theme;
  const jx = cam.shake > 0 ? (Math.random() - 0.5) * cam.shake : 0;
  const jy = cam.shake > 0 ? Math.round((Math.random() - 0.5) * cam.shake) : 0;
  vx0 = Math.round(cam.x + jx);

  drawParallax(ctx, theme, vx0);
  // O cenário de fundo fica em escala de tela; o mundo jogável recebe o zoom da câmera.
  ctx.save(); ctx.scale(cam.zoom, cam.zoom); ctx.translate(0, Math.round(-cam.y) + jy);
  drawTiles(ctx, theme);
  world.terminals.forEach(t => drawTerminal(ctx, t));
  world.checkpoints.forEach(c => drawCheckpoint(ctx, c));
  world.infos.forEach(i => drawInfo(ctx, i));
  if (world.goal && !world.level.stage.rescue) drawGoal(ctx, world.goal);
  world.pickups.forEach(p => drawPickup(ctx, p));
  drawCaptive(ctx);
  world.enemies.forEach(e => { if (!e.dead) drawEnemy(ctx, e); });
  drawBoss(ctx, world.boss);
  drawAlly(ctx, world.ally);
  drawPlayer(ctx, world.player);
  drawHackTag(ctx);
  drawRapture(ctx);
  world.bullets.forEach(b => drawBullet(ctx, b));
  drawEffects(ctx);
  ctx.restore();
  drawSceneTint(ctx);
}

// Tela de título: arte de capa com movimento lento de câmera.
function drawTitleArt(ctx, img, t) {
  const zoom = Math.max(W / img.width, H / img.height) * 1.12;
  const w = img.width * zoom, h = img.height * zoom;
  const x = (W - w) / 2 + Math.sin(t * 0.004) * ((w - W) / 2), y = (H - h) / 2 + Math.cos(t * 0.003) * ((h - H) / 4);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, x, y, w, h);
}

export function renderBackdrop(ctx, t) {
  beginFrame(ctx);
  const cover = art('title_art');
  if (cover) { drawTitleArt(ctx, cover, t); return; }
  const theme = THEMES[0], scroll = t * 0.5, groundY = H - 2 * T;
  drawParallax(ctx, theme, scroll);
  const off = Math.floor(scroll) % T;
  for (let x = -off; x < W; x += T) {
    rect(ctx, theme.solid, x, groundY, T, 2 * T);
    rect(ctx, theme.line, x + T - 1, groundY, 1, 2 * T);
    rect(ctx, theme.hi, x, groundY, T, 2);
  }
  // Enquanto a capa maior carrega, mostra apenas os personagens HD atuais; nunca os sprites antigos.
  const hero = art('hero_idle'), bot = art('byte');
  if (hero) drawArt(ctx, hero, 120, groundY, widthFor(hero, HERO_HEIGHT));
  if (bot) drawArt(ctx, bot, 100, groundY - 20 + Math.round(Math.sin(t * 0.08) * 3), widthFor(bot, BYTE_HEIGHT));
}
