// Arte HD gerada no Artlist (assets/*.webp). Carrega em segundo plano e nunca volta
// para os retratos antigos enquanto os arquivos novos chegam.

const NAMES = [
  'hero_idle', 'hero_run', 'hero_jump', 'hero_shoot', 'gle_idle', 'gle_run', 'gle_jump', 'gle_shoot', 'byte', 'byte_pink', 'drone', 'crawler', 'turret', 'boss',
  'tile_city', 'tile_dc', 'tile_core', 'title_art', 'gleyce_capsule',
  'bg_city_far', 'bg_city_near', 'bg_dc_far', 'bg_dc_near', 'bg_core_far', 'bg_core_near',
];
const PORTRAITS = { hero: 'portrait_hero', byte: 'portrait_byte', boss: 'portrait_boss', gleyce: 'portrait_gleyce', byte_pink: 'portrait_byte_pink' };

const images = {};
let botKey = 'byte';   // qual BYTE (azul ou rosa) aparece nos diálogos agora
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
  // Pré-carrega os retratos HD para o primeiro diálogo já abrir com eles.
  Object.values(PORTRAITS).forEach(file => { new Image().src = assetPath(file); });
}

// O robô muda de cor com quem joga: nos diálogos, BYTE aparece rosa nas fases da Gle.
export function useBotPortrait(botArt) { botKey = botArt === 'byte_pink' ? 'byte_pink' : 'byte'; }

// Retrato de quem fala: sempre o HD (o navegador cuida do carregamento, sem corrida com o load).
// Se o arquivo falhar, o retrato some; a arte antiga nunca reaparece.
export function setPortrait(img, who) {
  const key = who === 'byte' ? botKey : who, file = PORTRAITS[key];
  img.onerror = () => { img.onerror = null; img.hidden = true; };
  img.hidden = !file;
  if (file) img.src = assetPath(file);
}
