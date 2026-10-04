// Arte HD gerada no Artlist (assets/*.webp). Carrega em segundo plano; enquanto não chega,
// o render usa a pixel art de reserva de sprites.js.
import { PORTRAIT_URL } from './sprites.js';

const NAMES = [
  'hero_idle', 'hero_run', 'hero_jump', 'hero_shoot', 'gle_idle', 'gle_run', 'gle_jump', 'gle_shoot', 'byte', 'byte_pink', 'drone', 'crawler', 'turret', 'boss',
  'tile_city', 'tile_dc', 'tile_core', 'title_art', 'gleyce_capsule',
  'bg_city_far', 'bg_city_near', 'bg_dc_far', 'bg_dc_near', 'bg_core_far', 'bg_core_near',
];
const PORTRAITS = { hero: 'portrait_hero', byte: 'portrait_byte', boss: 'portrait_boss', gleyce: 'portrait_gleyce', byte_pink: 'portrait_byte_pink' };

const images = {};
const portraitSrc = {};
export const assetPath = name => `assets/${name}.webp`;

// Devolve a imagem pronta ou null (quem chama decide o desenho de reserva).
export const art = name => (images[name]?.complete && images[name].naturalWidth ? images[name] : null);

// Animações: anims.json descreve cada folha (quadros, tamanho e âncora nos pés).
const anims = {};
export const anim = name => (anims[name] && art(`anim_${name}`) ? { img: images[`anim_${name}`], ...anims[name] } : null);

function loadAnims() {
  fetch('assets/anims.json').then(r => (r.ok ? r.json() : {})).then(meta => {
    Object.entries(meta).forEach(([name, m]) => {
      anims[name] = m;
      const img = new Image(); img.src = assetPath(`anim_${name}`); images[`anim_${name}`] = img;
    });
  }).catch(() => { /* sem animações: usa as poses paradas */ });
}

export function loadArt() {
  loadAnims();
  NAMES.forEach(name => { const img = new Image(); img.decoding = 'async'; img.src = assetPath(name); images[name] = img; });
  Object.entries(PORTRAITS).forEach(([who, file]) => {
    const img = new Image();
    img.onload = () => {
      portraitSrc[who] = img.src;
      if (who === 'byte') PORTRAIT_URL.byte ??= img.src;
      else if (who !== 'byte_pink') PORTRAIT_URL[who] = img.src;   // hero, gleyce, boss: rosto HD no lugar da pixel art
    };
    img.src = assetPath(file);
  });
}

// O robô muda de cor com quem joga: nos diálogos, BYTE aparece rosa nas fases da Gle.
export function useBotPortrait(botArt) {
  const key = botArt === 'byte_pink' ? 'byte_pink' : 'byte';
  if (portraitSrc[key]) PORTRAIT_URL.byte = portraitSrc[key];
}
