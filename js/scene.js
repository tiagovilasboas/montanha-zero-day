// Cena do rapto (fim da fase 1): uma garra do RANSOM-TITAN leva o Montanha e a Gle é libertada da cápsula.
// Só o roteiro no tempo: o desenho fica no render.js, que lê `world.scene` e as funções abaixo.
import { W, T } from './config.js';
import { clamp } from './core.js';
import { world } from './world.js';
import { burst } from './fx.js';
import { sfx } from './audio.js';

const DESCEND = 60, GRAB = 78, LIFT_END = 160, FREE_AT = 170, END = 215;
const CLAW_START_GAP = 30, CABLE = 64;

export const startScene = onDone => {
  const p = world.player;
  world.scene = { t: 0, baseY: p.y, freed: false, onDone };
  p.vx = 0; p.vy = 0;
};
export const endScene = () => { world.scene = null; };

const ease = x => x * x;
const span = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

// Altura (em px) que o Montanha já subiu agarrado pela garra.
export const lift = t => ease(span(t, GRAB, LIFT_END)) * 190;
// Quanto a garra está fechada (0 aberta, 1 fechada).
export const clawClosed = t => span(t, DESCEND, GRAB);
// Altura da ponta da garra: desce até a cabeça do herói e sobe com ele.
export function clawY(t, headY, topY) {
  const from = topY - CLAW_START_GAP;
  return from + (headY - from) * ease(span(t, 0, DESCEND)) - lift(t);
}
export const clawHeight = () => CABLE;
export const sceneDarkness = t => Math.min(0.45, span(t, 10, 60) * 0.45) * (1 - span(t, LIFT_END, FREE_AT));
export const sceneFlash = t => Math.max(0, 1 - Math.abs(t - FREE_AT) / 10);

// A câmera se ajeita para enquadrar o casal (herói e cápsula) antes da garra aparecer.
function frameCouple() {
  const { cam, player: p, goal: g, level: L } = world, vw = W / cam.zoom;
  const target = (g ? (p.x + g.x) / 2 : p.x) - vw / 2;
  cam.x = clamp(cam.x + (target - cam.x) * 0.1, 0, L.w * T - vw);
}

export function updateScene() {
  const s = world.scene, p = world.player;
  if (!s) return;
  s.t++; frameCouple();
  if (s.t === 40) sfx('emp');
  if (s.t === GRAB) { sfx('boom'); world.cam.shake = 5; }
  if (s.t > GRAB && s.t < LIFT_END) { p.y = s.baseY - lift(s.t); world.cam.shake = 2.5; if (s.t % 6 === 0) burst(p.x + p.w / 2, p.y + p.h, '#ff4fd8', 3, 1.2); }
  if (s.t === FREE_AT) {
    s.freed = true; p.y = s.baseY - 400;
    sfx('levelUp'); world.cam.shake = 6;
    const g = world.goal; if (g) burst(g.x + 8, g.y + 4, '#9ff4ff', 26, 3);
  }
  world.cam.shake = world.cam.shake > 0.3 ? world.cam.shake * 0.85 : 0;
  if (s.t >= END) { const done = s.onDone; s.onDone = null; done?.(); }
}
