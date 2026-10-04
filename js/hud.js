// HUD sobre o canvas: barras de HP/EP/JET, nível, barra do chefe, avisos e cartão de fase.
import { $ } from './core.js';
import { save } from './core.js';
import { xpNeed, HEROES } from './config.js';
import { world } from './world.js';
import { lang, tr } from './i18n.js';

let cache = '';
const pct = (v, max) => `${Math.max(0, Math.min(100, (100 * v) / max))}%`;

export function setHudVisible(v) { $('#hud').hidden = !v; $('#keys').hidden = !v; $('#btn-pause').hidden = !v; if (!v) $('#bossbar').hidden = true; }

export function updateHud() {
  const p = world.player, b = world.boss;
  if (!p) return;
  const key = [lang(), p.hero, p.hp, p.max, p.ep | 0, p.fuel | 0, save.lv, save.xp, b && b.active && !b.gone ? b.hp : -1, b?.shield].join();
  if (key === cache) return;
  cache = key;
  $('#hud-lv').textContent = save.lv;
  $('#hud-boost').textContent = tr(HEROES[p.hero].boost);
  $('#hud-xp').textContent = `${save.xp}/${xpNeed(save.lv)}`;
  $('#hud-hp').style.width = pct(p.hp, p.max);
  $('#hud-ep').style.width = pct(p.ep, p.maxEp);
  $('#hud-jet').style.width = pct(p.fuel, p.maxFuel);
  const showBoss = !!(b && b.active && !b.gone);
  $('#bossbar').hidden = !showBoss;
  if (showBoss) {
    $('#boss-hp').style.width = pct(b.hp, b.max);
    $('#bossbar').classList.toggle('is-shielded', b.shield);
  }
}

let toastTimer = 0;
export function toast(text) {
  const t = $('#toast');
  t.textContent = text; t.hidden = false;
  t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

export function showCard(kicker, title) {
  $('#card-kicker').textContent = kicker;
  $('#card-title').textContent = title;
  $('#card').hidden = false;
}
export function hideCard() { $('#card').hidden = true; }
