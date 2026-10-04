// Pixel art do jogo, desenhada a partir de mapas de caracteres (cada letra = uma cor da paleta).
// Personagem inspirado no Montanha: boné snapback preto de aba cinza, barba cheia, moletom preto,
// mochila tecnológica nas costas e o relógio-hacker no pulso.
import { PAL } from './config.js';

function paint(rows) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); }
  }));
  return c;
}
function mirror(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
// Retorna [olhandoDireita, olhandoEsquerda]
const facing = rows => { const s = paint(rows); return [s, mirror(s)]; };

const HEAD = [
  '.....KKKKK......',
  '....KKKKKKK.....',
  '....KKKKKKKGGG..',
  '....KSSSSSS.....',
  '....SSSKSSK.....',
  '....SSSSSSS.....',
  '....BSSSSBB.....',
  '....BBBBBBB.....',
  '.....BBgBB......',
];
const TORSO = {
  idle: ['...ggkkkkkk.....', '..gCgkkkkkkk....', '..gggkkkkkkk....', '..gcgkkkkkCC....', '...ggkkkkkSS....'],
  shoot: ['...ggkkkkkk.....', '..gCgkkkkkkkkCCS', '..gggkkkkkkkkCC.', '..gcgkkkkk......', '...ggkkkkk......'],
};
const LEGS = {
  stand: ['....PPPPPP......', '....PPPPPPP.....', '....PPP.PPP.....', '....PP...PP.....', '...OOO...OOO....', '...OOO...OOO....'],
  run1: ['....PPPPPP......', '...PPPP.PPPP....', '..PPP.....PPP...', '..PP.......OOO..', '.OOO.......OO...', '.OO.............'],
  run2: ['....PPPPPP......', '....PPPPPP......', '.....PPPP.......', '.....PPPP.......', '.....OOOO.......', '.....OOOO.......'],
  jump: ['....PPPPPP......', '...PPPPPPPP.....', '..PPP...PPP.....', '..OOO....PP.....', '..OO.....OOO....', '.........OO.....'],
};

function heroFrames() {
  const frames = {};
  for (const [tName, torso] of Object.entries(TORSO))
    for (const [lName, legs] of Object.entries(LEGS))
      frames[`${tName}-${lName}`] = facing([...HEAD, ...torso, ...legs]);
  return frames;
}

const BYTE = [
  '.....YY.....', '.....c......', '...cccccc...', '..cWWWWWWc..', '.cWWCWWCWWc.', '.cWWCWWCWWc.',
  '.cWWWWWWWWc.', '..cWccccWc..', '...cccccc...', '....c..c....', '...cc..cc...',
];
const DRONE = [
  'R............R', '.R..........R.', '..vvvvvvvvvv..', '.vVVVVVVVVVVv.', 'vVVWWVVVVWWVVv',
  'vVVWRVVVVWRVVv', '.vVVVVVVVVVVv.', '..vvMvvvvMvv..', '...M......M...', '..M........M..',
];
const CRAWLER = [
  '....RRRRRR....', '..RRrrrrrrRR..', '.RrrYrrrrYrrR.', 'RrrrrrrrrrrrrR',
  'RrrrrrrrrrrrrR', '.RRRRRRRRRRRR.', '.K.K.K..K.K.K.', 'K.K.K....K.K.K',
];

const PORTRAITS = {
  hero: [
    '......KKKKKKKKKKKK......', '....KKKKKKKKKKKKKKKK....', '...KKKKKKgggggggKKKKK...', '...KKKKKKKKKKKKKKKKKK...',
    '..GGGGGGGGGGGGGGGGGGGG..', '..GgggggggggggggggggGG..', '....SSSSSSSSSSSSSSSS....', '...SSBBBBSSSSSSBBBBSS...',
    '...SSSKWSSSSSSSSKWSSS...', '...sSSKKSSSSSSSSKKSSs...', '...sSSSSSSSssSSSSSSSs...', '...sBSSSSSSssSSSSSSBs...',
    '...BBSSSBBBBBBBBSSSBB...', '...BBBSBBBBBBBBBBSBBB...', '...BBBBBBBSsSSBBBBBBB...', '....BBBBBBBgggBBBBBB....',
    '....BBBBBBBBgBBBBBBB....', '.....BBBBBBBBBBBBBB.....', '......BBBBBBBBBBBB......', '..kkkkkkBBBBBBBBkkkkkk..',
    '.kkkkkkkkkBBBBkkkkkkkkk.', 'kkkkkkkkkkkkkkkkkkkkkkkk', 'kkkkCkkkkkkkkkkkkkkCkkkk', 'kkkkkkkkkkkkkkkkkkkkkkkk',
  ],
  byte: [
    '...........YY...........', '...........YY...........', '...........cc...........', '......cccccccccccc......',
    '....ccWWWWWWWWWWWWcc....', '...cWWWWWWWWWWWWWWWWc...', '..cWWWWWWWWWWWWWWWWWWc..', '..cWWKKKKKKKKKKKKKKWWc..',
    '..cWKKCCCKKKKKKCCCKKWc..', '..cWKKCCCKKKKKKCCCKKWc..', '..cWKKKKKKKKKKKKKKKKWc..', '..cWKKKKKCCCCCCKKKKKWc..',
    '..cWWKKKKKKKKKKKKKKWWc..', '...cWWWWWWWWWWWWWWWWc...', '....ccWWWWWWWWWWWWcc....', '......cccccccccccc......',
    '........gg....gg........', '.......gGg....gGg.......', '......ggg......ggg......',
  ],
  gleyce: [
    '.........YYYYYY.........', '.......YYYYYYYYYY.......', '......YYYYYYYYYYYY......', '.....YYYYYyyyyYYYYY.....',
    '....YYYYyyyyyyyyYYYY....', '....YYYyyyyyyyyyyYYY....', '....YYYyyyyyyyyyyYYY....', '....YYYyyyyyyyyyyYYY....',
    '.....YYyyyyyyyyyyYY.....', '......YyYYyyyyYYyY......', '.......yWWyyyyWWy.......', '.......yWWyyyyWWy.......',
    '.......yyYyyyyYyy.......', '........yyyyyyyy........', '.........yyyyyy.........', '..........YyyY..........',
    '.......YYYYYYyYYYY......', '......YYYYYyyyyYYYY.....', '.....YYYYYyyyyyyYYYY....', '....YYYYYyyyyyyyyYYYY...',
  ],
  boss: [
    '.......rrrrrrrrrr.......', '.....rrRRRRRRRRRRrr.....', '....rRR..........RRr....', '....rR............Rr....',
    '....rR............Rr....', '..rrrrrrrrrrrrrrrrrrrr..', '.rKKKKKKKKKKKKKKKKKKKKr.', '.rKKRRRRKKKKKKKKRRRRKKr.',
    '.rKRRYYRRKKKKKKRRYYRRKr.', '.rKRRYYRRKKKKKKRRYYRRKr.', '.rKKRRRRKKKKKKKKRRRRKKr.', '.rKKKKKKKKKYYKKKKKKKKKr.',
    '.rKKKKKKKKYYYYKKKKKKKKr.', '.rKKKKKKKKKYYKKKKKKKKKr.', '.rKKWKWKWKWKWKWKWKWKKKr.', '.rKKKKKKKKKKKKKKKKKKKKr.',
    '.rKKWKWKWKWKWKWKWKWKKKr.', '..rrrrrrrrrrrrrrrrrrrr..',
  ],
};

export const SPR = {};
export const PORTRAIT_URL = {};

export function buildSprites() {
  SPR.hero = heroFrames();
  SPR.byte = facing(BYTE);
  SPR.drone = facing(DRONE);
  SPR.crawler = facing(CRAWLER);
  for (const [k, rows] of Object.entries(PORTRAITS)) PORTRAIT_URL[k] = paint(rows).toDataURL();
}
