// Telas de menu (título, mapa de missões, resultado, pausa, fim de jogo, final). Só montam HTML
// e avisam o jogo pelo barramento: cada botão com data-act vira o evento `ui:<ação>`.
import { $, emit, save } from './core.js';
import { STAGES, xpNeed, maxHpFor, shotDamage } from './config.js';
import { setPortrait } from './assets.js';
import { t, tr } from './i18n.js';

// Emblema do Montanha: o pico de montanha do relógio e do patch da jaqueta.
const EMBLEM = `<svg class="emblem" viewBox="0 0 120 64" aria-hidden="true">
  <path d="M10 58 L46 10 L60 28 L70 16 L110 58 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
  <path d="M38 22 L46 10 L56 24 L50 30 L46 24 L42 30 Z" fill="currentColor"/>
  <path d="M66 22 L70 16 L76 24 L71 28 Z" fill="currentColor"/>
</svg>`;

const button = (act, label, extra = '') => `<button data-act="${act}" ${extra}>${label}</button>`;
const statList = rows => `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
const formatTime = frames => { const s = Math.floor(frames / 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function show(html) {
  const el = $('#screen');
  el.innerHTML = `<div class="screen-inner">${html}</div>`;
  el.hidden = false;
  el.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
}
export function hideScreen() { $('#screen').hidden = true; }
// Crédito discreto do autor (título e final).
const credit = () => `<p class="credit">${t('credit')}</p>`;
const soundLabel = () => t('sound', { state: save.muted ? t('off') : t('on') });

export function showTitle(canInstall) {
  show(`${EMBLEM}
    <h1 class="logo">MONTANHA<small>ZERO DAY</small></h1>
    <p class="tagline">${t('tagline')}</p>
    <div class="menu">
      ${save.started ? button('continue', t('continue')) : ''}
      ${button('new', save.started ? t('newGame') : t('start'))}
      ${button('sound', soundLabel())}
      ${button('lang', t('langSwitch'), 'class="btn-ghost"')}
      ${button('install', t('install'), canInstall ? '' : 'hidden')}
    </div>
    <p class="hint">${t('keyHint')}</p>
    ${credit()}`);
}

function stageButton(stage, i) {
  const done = save.cleared.includes(i), locked = i >= save.unlocked;
  const state = done ? t('cleared') : locked ? t('locked') : t('open');
  const cls = done ? 'is-done' : locked ? 'is-locked' : '';
  return `<button class="stage-btn ${cls}" data-act="stage" data-i="${i}" ${locked ? 'disabled' : ''}>
    <span class="num">${String(i + 1).padStart(2, '0')}</span><span class="name">${tr(stage.name)}</span><span class="state">${state}</span></button>`;
}

// Ficha de quem joga a próxima missão liberada (fase 1 Montanha; depois, Gle).
const ROSTER = {
  montanha: { name: 'MONTANHA', label: 'Montanha', portrait: 'hero', gear: [
    ['gearWatchName', 'gearWatchText'],
    ['gearJetName', 'gearJetText']] },
  gle: { name: 'GLE', label: 'Gle', portrait: 'gleyce', gear: [
    ['gearGauntletName', 'gearGauntletText'],
    ['gearBootsName', 'gearBootsText']] },
};

export function showMap() {
  const next = STAGES[Math.min(save.unlocked, STAGES.length) - 1];
  const hero = ROSTER[next.hero];
  show(`<div class="map-grid">
    <section class="win status">
      <h3>${hero.name}</h3>
      <img class="portrait" alt="${t('portraitAlt', { name: hero.label })}">
      ${statList([['LV', save.lv], ['HP', maxHpFor(save.lv)], ['XP', `${save.xp} / ${xpNeed(save.lv)}`],
        [t('shot'), shotDamage(save.lv, false)], [t('charge'), shotDamage(save.lv, true)]])}
    </section>
    <section class="win">
      <h3>${t('missions')}</h3>
      ${STAGES.map(stageButton).join('')}
    </section>
    <section class="win equip">
      <h3>${t('equipment')}</h3>
      <ul>${hero.gear.map(([item, text]) => `<li><b>${t(item)}</b> ${t(text)}</li>`).join('')}
        <li>${t('gearByte')}</li>
      </ul>
    </section>
  </div>
  <div class="menu">${button('title', t('titleScreen'), 'class="btn-ghost"')}</div>`);
  setPortrait($('#screen .status img.portrait'), hero.portrait);
}

export function showResult({ stageName, time, kills, xp, rescue }) {
  // Fase 1 termina com o rapto: a manchete é a Gle livre, não "missão concluída".
  const head = rescue ? t('gleHead') : t('missionHead');
  const note = rescue ? `<p class="tagline">${t('rescueNote')}</p>` : '';
  show(`<h2 class="logo">${head}</h2>${note}
    <section class="win result"><h3>${tr(stageName)}</h3>
      ${statList([[t('time'), formatTime(time)], [t('enemies'), kills], [t('xpGained'), xp], [t('level'), save.lv]])}
    </section>
    <div class="menu">${button('map', t('continue'))}</div>`);
}

export function showGameOver() {
  show(`<h2 class="logo">${t('overHead')}</h2>
    <p class="tagline">${t('overNote')}</p>
    <div class="menu">${button('retry', t('retry'))}${button('map', t('missionMap'), 'class="btn-ghost"')}</div>`);
}

export function showPause() {
  show(`<h2 class="logo">${t('pauseTitle')}</h2>
    <div class="menu">${button('resume', t('resume'))}${button('sound', soundLabel())}${button('map', t('leaveMap'), 'class="btn-ghost"')}</div>`);
}

export function showEnding() {
  show(`${EMBLEM}<h2 class="logo">${t('endingHead')}</h2>
    <p class="tagline">${t('endingNote')}</p>
    <section class="win result"><h3>${t('finalSheet')}</h3>${statList([[t('level'), save.lv], [t('totalXp'), save.xp]])}</section>
    <div class="menu">${button('map', t('missionMap'))}${button('title', t('titleScreen'), 'class="btn-ghost"')}</div>
    ${credit()}`);
}

export function refreshSoundLabel() {
  const b = $('#screen [data-act="sound"]');
  if (b) b.textContent = soundLabel();
}

// Setas do teclado andam entre os botões da tela (título, mapa, pausa, resultado).
function moveFocus(e) {
  const el = $('#screen');
  if (el.hidden || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) return;
  const list = [...el.querySelectorAll('button:not([disabled]):not([hidden])')];
  if (!list.length) return;
  const step = e.code === 'ArrowUp' || e.code === 'ArrowLeft' ? -1 : 1, i = list.indexOf(document.activeElement);
  list[(i + step + list.length) % list.length].focus({ preventScroll: true });
  e.preventDefault();
}

export function bindScreens() {
  addEventListener('keydown', moveFocus);
  $('#screen').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) emit(`ui:${b.dataset.act}`, b.dataset);
  });
}
