// Telas de menu (título, mapa de missões, resultado, pausa, fim de jogo, final). Só montam HTML
// e avisam o jogo pelo barramento: cada botão com data-act vira o evento `ui:<ação>`.
import { $, emit, save } from './core.js';
import { STAGES, xpNeed, maxHpFor, shotDamage } from './config.js';
import { PORTRAIT_URL } from './sprites.js';

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
const soundLabel = () => `Som: ${save.muted ? 'desligado' : 'ligado'}`;

export function showTitle(canInstall) {
  show(`${EMBLEM}
    <h1 class="logo">MONTANHA<small>ZERO DAY</small></h1>
    <p class="tagline">Um hacker, uma princesa e uma cidade inteira offline.</p>
    <div class="menu">
      ${save.started ? button('continue', 'Continuar') : ''}
      ${button('new', save.started ? 'Novo jogo' : 'Começar')}
      ${button('sound', soundLabel())}
      ${button('install', 'Instalar app', canInstall ? '' : 'hidden')}
    </div>
    <p class="hint">Teclado: ← → mover · Z pular (segure no ar = JET) · X atirar (segure = carga) · C hack · Esc pausa</p>`);
}

function stageButton(stage, i) {
  const done = save.cleared.includes(i), locked = i >= save.unlocked;
  const state = done ? 'CONCLUÍDA' : locked ? 'BLOQUEADA' : 'LIVRE';
  const cls = done ? 'is-done' : locked ? 'is-locked' : '';
  return `<button class="stage-btn ${cls}" data-act="stage" data-i="${i}" ${locked ? 'disabled' : ''}>
    <span class="num">${String(i + 1).padStart(2, '0')}</span><span class="name">${stage.name}</span><span class="state">${state}</span></button>`;
}

// Ficha de quem joga a próxima missão liberada (fase 1 Montanha; depois, Gle).
const ROSTER = {
  montanha: { name: 'MONTANHA', label: 'Montanha', portrait: 'hero', gear: [
    ['Relógio H4X', 'atira, carrega disparo pesado e hackeia terminais e torretas.'],
    ['Mochila JET', 'segure PULO no ar para planar e subir.']] },
  gle: { name: 'GLE', label: 'Gle', portrait: 'gleyce', gear: [
    ['Manopla dourada', 'atira, carrega disparo pesado e hackeia terminais e torretas.'],
    ['Botas de luz', 'segure PULO no ar para planar e subir.']] },
};

export function showMap() {
  const next = STAGES[Math.min(save.unlocked, STAGES.length) - 1];
  const hero = ROSTER[next.hero];
  show(`<div class="map-grid">
    <section class="win status">
      <h3>${hero.name}</h3>
      <img src="${PORTRAIT_URL[hero.portrait]}" alt="Retrato de ${hero.label}">
      ${statList([['LV', save.lv], ['HP', maxHpFor(save.lv)], ['XP', `${save.xp} / ${xpNeed(save.lv)}`],
        ['Tiro', shotDamage(save.lv, false)], ['Carga', shotDamage(save.lv, true)]])}
    </section>
    <section class="win">
      <h3>MISSÕES</h3>
      ${STAGES.map(stageButton).join('')}
    </section>
    <section class="win equip">
      <h3>EQUIPAMENTO</h3>
      <ul>${hero.gear.map(([item, text]) => `<li><b>${item}</b> ${text}</li>`).join('')}
        <li><b>BYTE</b> robô assistente que dá dicas e atira sozinho.</li>
      </ul>
    </section>
  </div>
  <div class="menu">${button('title', 'Tela inicial', 'class="btn-ghost"')}</div>`);
}

export function showResult({ stageName, time, kills, xp }) {
  show(`<h2 class="logo">MISSÃO<small>CONCLUÍDA</small></h2>
    <section class="win result"><h3>${stageName}</h3>
      ${statList([['Tempo', formatTime(time)], ['Inimigos', kills], ['XP ganho', xp], ['Nível', save.lv]])}
    </section>
    <div class="menu">${button('map', 'Continuar')}</div>`);
}

export function showGameOver() {
  show(`<h2 class="logo">SISTEMA<small>COMPROMETIDO</small></h2>
    <p class="tagline">O Byte reiniciou seus sistemas no último checkpoint.</p>
    <div class="menu">${button('retry', 'Voltar ao checkpoint')}${button('map', 'Mapa de missões', 'class="btn-ghost"')}</div>`);
}

export function showPause() {
  show(`<h2 class="logo">PAUSA</h2>
    <div class="menu">${button('resume', 'Continuar')}${button('sound', soundLabel())}${button('map', 'Sair para o mapa', 'class="btn-ghost"')}</div>`);
}

export function showEnding() {
  show(`${EMBLEM}<h2 class="logo">A REDE<small>ESTÁ LIVRE</small></h2>
    <p class="tagline">A Gle venceu o RANSOM-TITAN, o Montanha voltou do backup e Neo-Sampa acendeu de novo. Mesmo time, sempre.</p>
    <section class="win result"><h3>FICHA FINAL</h3>${statList([['Nível', save.lv], ['XP total', save.xp]])}</section>
    <div class="menu">${button('map', 'Mapa de missões')}${button('title', 'Tela inicial', 'class="btn-ghost"')}</div>`);
}

export function refreshSoundLabel() {
  const b = $('#screen [data-act="sound"]');
  if (b) b.textContent = soundLabel();
}

export function bindScreens() {
  $('#screen').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) emit(`ui:${b.dataset.act}`, b.dataset);
  });
}
