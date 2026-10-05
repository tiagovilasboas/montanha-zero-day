// Ponto de entrada: monta os módulos, dimensiona a tela e roda o loop com passo fixo.
import { W, H, FPS, setViewWidth } from './config.js';
import { $, on, emit } from './core.js';
import { bindInput } from './input.js';
import { tickMusic, unlockAudio, resumeAudio } from './audio.js';
import { bindDialog } from './dialog.js';
import { bindPuzzle } from './puzzle.js';
import { bindScreens } from './screens.js';
import { renderWorld, renderBackdrop, setRenderScale } from './render.js';
import { loadArt } from './assets.js';
import { game, step, bindGame, showsWorld, goTitle } from './game.js';
import { applyDom } from './i18n.js';

const ctx = $('#cv').getContext('2d');

function fitViewport() {
  game.blocked = getComputedStyle($('#rotate')).display !== 'none';
  const app = $('#app'), wrap = $('#wrap'), pad = $('#pad');
  const padStyle = getComputedStyle(pad);
  const padOverlays = padStyle.display === 'none' || padStyle.position === 'absolute';
  const style = getComputedStyle(app);
  const innerW = app.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const innerH = app.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const availH = padOverlays ? innerH : innerH - Math.max(220, innerH * 0.36);
  // A tela lógica ganha a proporção do celular: paisagem até 21:9 sem faixas pretas; retrato até 256 de largura (jogo mais alto).
  setViewWidth(Math.round(Math.min(448, Math.max(padOverlays ? 320 : 256, (innerW * H) / availH))));
  const width = Math.floor(Math.min(innerW, (availH * W) / H));
  wrap.style.width = `${width}px`;
  wrap.style.height = `${Math.floor((width * H) / W)}px`;
  wrap.style.setProperty('--u', `${width / W}px`);
  // Resolução real do canvas acompanha a tela (arte HD), até 4x o tamanho lógico.
  const s = Math.max(1, Math.min(4, Math.ceil((width * (window.devicePixelRatio || 1)) / W)));
  const cv = $('#cv');
  if (cv.width !== W * s) { cv.width = W * s; cv.height = H * s; setRenderScale(s); }
}

// Tela cheia + trava em paisagem (Android; no iOS o botão nem aparece).
function bindRotate() {
  const b = $('#rotate-fs');
  if (!document.documentElement.requestFullscreen) return;
  b.hidden = false;
  b.addEventListener('click', async () => {
    try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); await screen.orientation.lock('landscape'); } catch { /* sem suporte: só girar o celular */ }
  });
}

function installSupport() {
  let deferred = null;
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e; game.canInstall = true;
    const b = document.querySelector('[data-act="install"]'); if (b) b.hidden = false;
  });
  on('install', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sem SW: o jogo roda igual, só não fica offline */ });
  }
}

let last = performance.now(), acc = 0;
const STEP_MS = 1000 / FPS;
function loop(now) {
  requestAnimationFrame(loop);
  acc += Math.min(250, now - last); last = now;
  while (acc >= STEP_MS) { step(); acc -= STEP_MS; }
  if (showsWorld()) renderWorld(ctx); else renderBackdrop(ctx, game.menuFrame);
  tickMusic();
}

function boot() {
  loadArt();
  bindInput({ dpad: $('#dpad'), buttons: [...document.querySelectorAll('#btns [data-action]')] });
  bindDialog(); bindPuzzle(); bindScreens(); bindGame();
  $('#btn-pause').addEventListener('click', () => emit('ui:pause'));
  // Sem { once }: o iOS pode suspender o som depois; cada toque confere (barato) e retoma.
  document.addEventListener('pointerdown', unlockAudio);
  // App em segundo plano: pausa a fase; ao voltar, retoma o som.
  document.addEventListener('visibilitychange', () => { if (document.hidden) emit('ui:pause'); else resumeAudio(); });
  addEventListener('resize', fitViewport);
  addEventListener('orientationchange', () => setTimeout(fitViewport, 200));
  fitViewport();
  bindRotate();
  installSupport();
  applyDom();
  goTitle();
  requestAnimationFrame(loop);
}

boot();
