// Constantes e dados do jogo. Nenhuma lógica aqui: só configuração.
export const H = 192, T = 16, ROWS = 12, FPS = 60;
// Largura lógica da tela: 320 no retrato; no paisagem estica até preencher o celular (sem faixas pretas).
export let W = 320;
export const setViewWidth = w => { W = w; };
// Zoom da câmera no mundo (personagens maiores no celular). A área visível do mundo é W/ZOOM x H/ZOOM.
export const ZOOM = 1.56;
// Caixa de colisão dos heróis (o desenho tem 36 de altura; a caixa cobre ~2/3 dele).
export const PLAYER = { w: 12, h: 24 };
// Altura do herói desenhado (px lógicos). A caixa de colisão é menor que o desenho.
export const HERO_HEIGHT = 36;


export const PHYS = { gravity: 0.28, maxFall: 6, run: 1.7, jump: -5.3, jumpCut: -1.8, jet: 0.62, jetMax: -1.1, fuel: 60 };

export const PAL = {
  K: '#0b0d18', k: '#1d2236', G: '#6c7391', g: '#aab1c9', S: '#c98d63', s: '#9a6747',
  B: '#2b1e17', W: '#f1f4ff', C: '#3df0ff', c: '#1a8aa6', P: '#28304d', R: '#ff3b5c',
  r: '#a3173a', O: '#e6e8f2', Y: '#ffd23d', V: '#9b5cff', v: '#5a2fb0', M: '#ff5ad1',
};

export const THEMES = [
  { name: 'city', sky: ['#0b0626', '#2a0e50'], solid: '#1d2140', line: '#2c3360', hi: '#ff4fd8', plat: '#3df0ff', platBody: '#2a3060' },
  { name: 'dc',   sky: ['#020f14', '#06262e'], solid: '#122128', line: '#1d3a44', hi: '#7dff9b', plat: '#7dff9b', platBody: '#1a3640' },
  { name: 'core', sky: ['#0e0004', '#3a0414'], solid: '#25101a', line: '#45182a', hi: '#ff3b5c', plat: '#ffb03d', platBody: '#4a1a28' },
];

// Legenda dos blocos de fase:
// # sólido  = plataforma  ^ laser  P início  1-3 terminal  a-c porta laser do terminal 1-3
// A-C ponte do terminal 1-3  d drone  m malware  X torreta  h vida  e energia  k checkpoint  i dica  G portal
// | feixe de pulso (liga e desliga; feixes vizinhos alternam)
export const CHUNKS = {
  start: ['', '', '', '', '', '', '', '', '         ====', '  P         i', '####################', '####################'],
  flat: ['', '', '', '         d', '', '', '              ===', '     e', '    ===        m', '', '####################', '####################'],
  pit: ['', '', '', '', '', '          d', '', '', '      ===  ===', '', '#####          #####', '#####^^^^^^^^^^#####'],
  door: ['              #', '              #', '              #', '              #', '              a', '              a', '              a', '              a', '              a', '     1        a', '####################', '####################'],
  bridge: ['', '', '', '', '', '', '         e', '', '', ' 1', '##AAAAAAAAAAAAAA####', '##^^^^^^^^^^^^^^####'],
  turret: ['', '', '', '', '', '', '       h', '      ===     X', '             ###', '   m', '####################', '####################'],
  stairs: ['', '', '', '', '             =====', '', '         ===', '                 d', '     ===', '  e', '####           #####', '####^^^^^^^^^^^#####'],
  check: ['', '', '', '', '', '      h', '     ===', '', '             d', '   k        i', '####################', '####################'],
  goal: ['                   #', '                   #', '                   #', '                   #', '                   #', '                   #', '                   #', '                   #', '                   #', '               G   #', '####################', '####################'],
  datacenter_boss: ['              #', '              #', '              #', '              #', '              a', '              a', '              a', '              a', '              a', '     9        a', '####################', '####################'],
  // Blocos do Núcleo (fase 3): feixes de pulso, subida sobre lasers e um corredor de torretas.
  pulse: ['      |       |', '      |       |', '      |       |', '      |       |', '      |   d   |', '      |       |',
    '      |       |', '      |       |', '      |       |', '   i  |       |   e', '####################', '####################'],
  climb: ['', '', '', '              h', '            ====', '', '       ===', '                 d', '   ===', '',
    '###            #####', '###^^^^^^^^^^^^#####'],
  gauntlet: ['', '', '', '', '          h', '         ===', '', '', '     X            X', ' m  ###   m      ###',
    '####################', '####################'],
  pulse2: ['     |     |     |', '     |     |     |', '     |     |     |', '     |     |     |', '     |     |     |',
    '     |  d  |     |', '     |     |     |', '     |     |     |', '     |     |     |', '     |     |  m  | e',
    '####################', '####################'],
  arena: ['                   #', '                   #', '                   #', '                   #', '                   #', '                   #', '       ====        #', '                   #', '   ===             #', '  1                #', '####################', '####################'],
};

// Personagens jogáveis: a fase decide quem joga (fase 1 Montanha; fases 2 e 3 Gle).
export const HEROES = {
  // muzzle: onde o relógio/manopla fica na arte de tiro (altura = fração do corpo; reach = px à frente do centro)
  // glow: aura de energia em volta do desenho (cada um com sua cor). trail: rastro do JET/botas e de onde ele sai.
  // frames: quais quadros de cada folha usar (pulo separado em "no ar" e "voando"); sem lista, usa a folha inteira.
  montanha: { art: 'hero', portrait: 'hero', shot: '#3df0ff', boost: 'JET', bot: 'byte', muzzle: { h: 0.79, reach: 15 },
    glow: '#3df0ff', aura: 1, trail: { colors: ['#3df0ff', '#bff9ff'], from: 'back' },
    frames: { air: [0], hover: [1, 2, 3] } },
  gle: { art: 'gle', portrait: 'gleyce', shot: '#ffd23d', boost: 'BOTAS', bot: 'byte_pink', muzzle: { h: 0.75, reach: 11 },
    glow: '#ffd23d', aura: 0.55, trail: { colors: ['#ffd23d', '#ff9de6'], from: 'feet' },
    frames: {} },
};

export const STAGES = [
  {
    name: 'Telhados do Cecapão', theme: 0, track: 0, hero: 'montanha', rescue: true,
    chunks: ['start', 'flat', 'pit', 'door', 'check', 'turret', 'stairs', 'bridge', 'goal'],
    intro: [
      ['byte', 'Telhados do Cecapão. O sinal da cápsula da Gle vem do fim destes prédios.'],
      ['byte', 'Lembrete: no ar, SEGURE o PULO para ligar o JET da mochila.'],
      ['byte', 'Porta laser no caminho? Chegue no terminal amarelo e aperte HACK.'],
      ['hero', 'Cada drone derrubado é um passo mais perto de você, amor. Bora.'],
    ],
    infos: [
      'Segure TIRO para carregar o relógio. Solte para um disparo pesado que atravessa inimigos.',
      // Uma placa pode ter mais de uma fala (lista): aqui a torreta e o EMP vêm juntos.
      ['Perto de uma torreta vermelha, aperte HACK: ela passa a lutar do nosso lado.',
        'Longe de terminais e torretas, HACK solta um pulso EMP que paralisa inimigos.'],
    ],
  },
  {
    name: 'Subsolo 404: Servidor Submerso', theme: 1, track: 1, hero: 'gle',
    chunks: ['start', 'bridge', 'flat', 'turret', 'door', 'check', 'pit', 'stairs', 'datacenter_boss', 'goal'],
    intro: [
      ['byte', 'Subsolo 404: Servidor Submerso. O rastro do TITAN passa por aqui.'],
      ['gleyce', 'Cada drone que eu derrubar me deixa mais perto dele, Byte.'],
      ['byte', 'Mudei minha cor pro seu time. Modo Gle ativado.'],
      ['byte', 'Sua manopla atira e hackeia igual ao relógio dele.'],
      ['byte', 'No ar, segure PULO e as botas de luz te seguram no alto.'],
    ],
    infos: [
      'Ponte apagada à frente. O terminal ao lado religa a ponte. Sem ela, só lasers lá embaixo.',
      'Cada inimigo derrotado dá XP. Subir de nível aumenta seu HP e o dano da manopla.',
    ],
  },
  {
    name: 'Kernel Panic: o Núcleo', theme: 2, track: 2, hero: 'gle',
    chunks: ['start', 'flat', 'pulse', 'door', 'climb', 'check', 'gauntlet', 'pulse2', 'stairs', 'turret', 'check', 'arena'],
    intro: [
      ['gleyce', 'Subsolo limpo. E agora, Byte?'],
      ['byte', 'O sinal do Montanha some dentro do Núcleo, a casa do TITAN.'],
      ['gleyce', 'Então é lá que eu vou. Aguenta, amor.'],
    ],
    infos: [
      'Sinto a assinatura do TITAN. Guarde EP para os terminais.',
      'Feixes de pulso! Eles piscam antes de ligar. Passe quando apagarem.',
      'Checkpoint salvo. O sinal do Montanha ficou mais forte. Tá perto, Gle.',
      'Depois deste checkpoint vem o chefe. Respira fundo, Gle. O Montanha está esperando por você.',
    ],
  },
];

export const STORY = {
  intro: [
    ['sys', 'ANO 2099. NEO-SAMPA.'],
    ['sys', 'A LEGIÃO NULL, uma IA invasora, tomou a rede do planeta.'],
    ['sys', 'Seu general, o TITAN, soltou drones de malware nas ruas.'],
    ['gleyce', 'Montanha! Eles invadiram a casa! Estão me levando!'],
    ['sys', 'SINAL PERDIDO. CÁPSULA CRIPTOGRAFADA EM TRÂNSITO.'],
    ['byte', 'Montanha, levaram a Gle! O TITAN trancou ela numa cápsula, no alto dos telhados.'],
    ['hero', 'Pega minha mochila e o relógio, Byte. Ninguém mexe com a minha parceira.'],
    ['byte', 'Mochila JET carregada. Relógio H4X pronto pra atirar e hackear.'],
    ['hero', 'Mesmo time, sempre. Aguenta firme, amor. Tô indo.'],
  ],
  // Fim da fase 1, parte 1: o Montanha encontra a Gle presa na cápsula.
  meet: [
    ['hero', 'Gle! Achei você, amor. Segura que eu vou abrir isso.'],
    ['gleyce', 'Montanha... eu sabia que você vinha.'],
    ['byte', 'Cuidado! Tem alguma coisa descendo do céu!'],
  ],
  // Parte 2 (depois do rapto): a cápsula abre e a Gle, livre, parte atrás dele.
  freed: [
    ['gleyce', 'MONTANHA! Não! Solta ele!'],
    ['byte', 'Era uma isca! O TITAN queria o hacker. A cápsula abriu sozinha.'],
    ['gleyce', 'Então ele vai ter que me aguentar.'],
    ['byte', 'O Montanha deixou comigo a manopla reserva e as botas de luz. Veste!'],
    ['byte', 'E copiei os upgrades dele pra você. O sinal dele vai pro Subsolo 404.'],
    ['gleyce', 'Me mostra o caminho, Byte. Mesmo time, sempre.'],
  ],
  boss: [
    ['boss', 'A princesa veio buscar o hacker? O hacker é meu. E a rede também.'],
    ['gleyce', 'Ele não é só um hacker. É meu parceiro. Mesmo time, sempre.'],
    ['boss', 'Eu sou TITAN. Nada sai deste Núcleo sem a minha chave.'],
    ['byte', 'Ele é blindado. Acerta enquanto dá, Gle!'],
  ],
  firewall: [['byte', 'Ele ergueu um FIREWALL! Os tiros não passam. Hackeia o terminal à esquerda, Gle!']],
  ending: [
    ['boss', 'Impossível... minha criptografia era... perfeita...'],
    ['byte', 'Chave mestra extraída! Liberando os servidores do planeta...'],
    ['byte', 'E achei a cela do Montanha, bem no fundo do Núcleo!'],
    ['gleyce', 'A chave é minha agora. Abre essa cela, Byte.'],
    ['sys', 'CELA CRIPTOGRAFADA ABERTA. PRISIONEIRO LIBERADO: MONTANHA.'],
    ['hero', '...Gle? Eu sabia que você vinha, amor.'],
    ['gleyce', 'Mesmo time, sempre.'],
    ['byte', 'Neo-Sampa acendeu de novo. Missão cumprida, vocês dois.'],
  ],
};

export const SPEAKERS = { hero: 'MONTANHA', byte: 'BYTE', boss: 'TITAN', gleyce: 'GLE', sys: 'SISTEMA' };

export const ENEMY = {
  // w/h cobrem ~75% do desenho (a arte é ~30 px de largura), para o tiro e o toque baterem com o que se vê.
  drone:   { w: 22, h: 13, hp: 2, xp: 3, contact: 2 },
  crawler: { w: 20, h: 15, hp: 3, xp: 4, contact: 2 },
  turret:  { w: 18, h: 16, hp: 4, xp: 5, contact: 2 },
};

const XP_TABLE = [0, 10, 25, 45, 70, 100, 140, 190, 250, 320];
export const xpNeed = lv => XP_TABLE[lv] ?? lv * 40;
export const maxHpFor = lv => 10 + 2 * (lv - 1);
export const shotDamage = (lv, charged) => (charged ? 4 + lv : 1 + Math.floor((lv - 1) / 2));
