// Fluxo do jogo: máquina de estados (título → história → mapa → fase → resultado/fim) e o passo da simulação.
import { STAGES, STORY, HEROES, T, W, H, ZOOM } from './config.js';
import { on, emit, save, persist, resetSave, clamp } from './core.js';
import { world, buildLevel, setArenaWall, makeBoss } from './world.js';
import { input, pollInput, consumeMeta } from './input.js';
import { playTrack, stopMusic, sfx, toggleMute } from './audio.js';
import { say, dialogOpen, tickDialog, advanceDialog } from './dialog.js';
import { puzzleOpen, tickPuzzle } from './puzzle.js';
import { updateHud, setHudVisible, toast, showCard, hideCard } from './hud.js';
import * as screens from './screens.js';
import { useBotPortrait } from './assets.js';
import { createPlayer, updatePlayer, hurtPlayer, respawn, lockButtons } from './player.js';
import { createAlly, updateAlly } from './ally.js';
import { updateEnemies } from './enemies.js';
import { updateBoss } from './boss.js';
import { updateBullets, gainXp } from './combat.js';
import { updateInteractables } from './interact.js';
import { updateFx, startLove } from './fx.js';
import { startScene, endScene, updateScene } from './scene.js';

export const game = { mode: 'title', menuFrame: 0, cardTimer: 0, cardDone: null, canInstall: false, blocked: false };   // blocked: celular em retrato (pede para girar)

// ---- Navegação entre telas
function goTitle() { game.mode = 'title'; setHudVisible(false); playTrack('title'); screens.showTitle(game.canInstall); }
function goMap() { game.mode = 'map'; setHudVisible(false); playTrack('title'); screens.showMap(); }

function startStory() {
  resetSave();
  game.mode = 'story'; screens.hideScreen();
  talk(STORY.intro, () => { save.started = true; persist(); goMap(); });
}

function talk(lines, done) { say(lines, () => { lockButtons(); done?.(); }); }

function startStage(index) {
  const spawn = buildLevel(index);
  world.player = createPlayer(spawn, STAGES[index].hero);
  useBotPortrait(HEROES[STAGES[index].hero].bot);
  world.ally = createAlly(world.player);
  Object.assign(world.cam, { zoom: ZOOM, y: H - H / ZOOM, x: clamp(spawn.x - W / ZOOM / 2, 0, world.level.w * T - W / ZOOM) });
  game.mode = 'play';
  screens.hideScreen(); setHudVisible(true);
  playTrack(STAGES[index].track);
  showCard(`FASE ${index + 1}`, STAGES[index].name);
  game.cardTimer = 110;
  game.cardDone = () => talk(STAGES[index].intro);
}

function pause() { if (game.mode !== 'play' || dialogOpen() || puzzleOpen() || game.cardTimer > 0) return; game.mode = 'pause'; screens.showPause(); }
function resume() { game.mode = 'play'; screens.hideScreen(); lockButtons(); }

function clearStage() {
  if (game.mode !== 'play') return;
  // Fim da fase 1: o Montanha encontra a Gle, uma garra o rapta e a Gle é libertada.
  if (STAGES[world.level.index].rescue) { rescueCutscene(); return; }
  finishStage();
}

function rescueCutscene() {
  game.mode = 'cutscene'; setHudVisible(false); stopMusic(); startLove(200); sfx('hackOk');
  talk(STORY.meet, () => startScene(() => talk(STORY.freed, finishStage)));
}

function finishStage() {
  endScene();
  const i = world.level.index;
  game.mode = 'result';
  save.unlocked = Math.max(save.unlocked, Math.min(STAGES.length, i + 2));
  if (!save.cleared.includes(i)) save.cleared.push(i);
  persist(); stopMusic(); sfx('levelUp'); setHudVisible(false);
  screens.showResult({ stageName: STAGES[i].name, time: world.time, kills: world.kills, xp: world.xpGained });
}

function gameOver() {
  if (game.mode !== 'play') return;
  game.mode = 'over'; stopMusic(); setHudVisible(false); persist();
  screens.showGameOver();
}

function retryFromCheckpoint() {
  const p = world.player;
  p.hp = p.max; p.ep = p.maxEp;
  world.bullets = [];
  if (world.level.locked) resetArena();
  respawn();
  game.mode = 'play'; screens.hideScreen(); setHudVisible(true);
  playTrack(STAGES[world.level.index].track);
}

// ---- Arena do chefe
function resetArena() {
  setArenaWall(false);
  world.enemies = world.enemies.filter(e => e.x < world.level.arenaX);
  world.boss = makeBoss(world.level.arenaX + 14 * T, 56);
  world.terminals.forEach(t => { t.cool = 0; });
}

function checkArena() {
  const L = world.level;
  if (L.arenaX < 0 || L.locked || world.player.x < L.arenaX + T * 3) return;
  setArenaWall(true); stopMusic();
  talk(STORY.boss, () => { world.boss.active = true; playTrack('boss'); toast('DERROTE O RANSOM-TITAN'); });
}

function victory() {
  gainXp(50);
  talk(STORY.ending, () => {
    const i = world.level.index;
    if (!save.cleared.includes(i)) save.cleared.push(i);
    persist(); game.mode = 'ending'; setHudVisible(false); playTrack('title');
    screens.showEnding();
  });
}

// ---- Câmera
function updateCamera() {
  const { cam, player: p, level: L } = world;
  // Zoom no celular durante a fase; na sala do chefe a câmera abre e mostra a arena inteira.
  cam.zoom += ((L.locked ? 1 : ZOOM) - cam.zoom) * 0.05;
  const vw = W / cam.zoom, vh = H / cam.zoom, follow = p.x + p.w / 2 - vw / 2 + p.face * 24;
  // Na arena a câmera fica presa entre as paredes, mas ainda acompanha o jogador.
  const target = L.locked ? L.arenaX + (20 * T - vw) / 2 : follow;
  cam.x = clamp(cam.x + (target - cam.x) * 0.12, 0, L.w * T - vw);
  // Vertical: o chão fica sempre à vista; sobe junto quando o jogador pula alto.
  const ty = clamp(p.y + p.h / 2 - vh * 0.55, 0, H - vh);
  cam.y += (ty - cam.y) * 0.1;
  cam.shake = cam.shake > 0.3 ? cam.shake * 0.85 : 0;
}

function updatePlay() {
  world.frame++; world.time++;
  updatePlayer(); updateAlly(); updateEnemies(); updateBoss();
  updateBullets(); updateInteractables(); updateFx(); updateCamera(); checkArena();
  updateHud();
}

// ---- Um passo fixo de simulação (60 por segundo)
export function step() {
  if (game.blocked) return;   // retrato no celular: simulação parada até girar
  pollInput();
  game.menuFrame++;
  if (dialogOpen()) {
    tickDialog();
    if (game.mode === 'cutscene') updateFx();   // os corações seguem subindo durante a conversa
    if (input.pressed.jump || input.pressed.fire || input.confirm) advanceDialog();
  } else if (game.mode === 'cutscene' && game.cardTimer <= 0) {
    updateScene(); updateFx();
  } else if (puzzleOpen()) {
    tickPuzzle();
  } else if (game.cardTimer > 0) {
    if (--game.cardTimer === 0) { hideCard(); const done = game.cardDone; game.cardDone = null; done?.(); }
  } else if (game.mode === 'play') {
    if (input.pause) pause(); else updatePlay();
  } else if (game.mode === 'pause' && input.pause) resume();
  consumeMeta();
}

export const showsWorld = () => !!world.level && ['play', 'pause', 'over', 'result', 'cutscene'].includes(game.mode);

// ---- Ligações de eventos (o resto do código só emite; aqui se decide)
export function bindGame() {
  on('toast', toast);
  on('say', lines => talk(lines));
  on('player:hit', ({ dmg, dir }) => hurtPlayer(dmg, dir));
  on('player:dead', gameOver);
  on('stage:clear', clearStage);
  on('boss:firewall', () => talk(STORY.firewall));
  on('boss:defeated', victory);

  on('ui:new', startStory);
  on('ui:continue', goMap);
  on('ui:title', goTitle);
  on('ui:map', goMap);
  on('ui:stage', d => startStage(+d.i));
  on('ui:retry', retryFromCheckpoint);
  on('ui:resume', resume);
  on('ui:sound', () => { toggleMute(); screens.refreshSoundLabel(); });
  on('ui:install', () => emit('install'));
  on('ui:pause', pause);
}

export { goTitle };
