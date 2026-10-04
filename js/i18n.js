// Language: Portuguese only when the timezone is Brazil AND the browser's primary language is Portuguese.
// Everyone else gets English. A menu toggle stores an explicit choice and overrides detection.

const STORAGE_KEY = 'mzd-lang';

const BR_TIMEZONES = new Set([
  'America/Noronha', 'America/Belem', 'America/Fortaleza', 'America/Recife', 'America/Araguaina',
  'America/Maceio', 'America/Bahia', 'America/Sao_Paulo', 'America/Campo_Grande', 'America/Cuiaba',
  'America/Santarem', 'America/Porto_Velho', 'America/Boa_Vista', 'America/Manaus', 'America/Eirunepe',
  'America/Rio_Branco', 'Brazil/Acre', 'Brazil/DeNoronha', 'Brazil/East', 'Brazil/West',
]);

const UI = {
  en: {
    metaDescription: 'Montanha: Zero Day. A cyberpunk pixel-art platformer. Montanha sets out to rescue Gle. Then she goes after him.',
    pause: 'Pause',
    keys: 'Keyboard controls',
    move: 'Move',
    keyMove: '<kbd>←</kbd><kbd>→</kbd> move',
    keyJump: '<kbd>Z</kbd> jump <small>(hold in the air: fly)</small>',
    keyFire: '<kbd>X</kbd> shoot <small>(hold: charge)</small>',
    keyHack: '<kbd>C</kbd> hack',
    keyPause: '<kbd>Esc</kbd> pause',
    hack: 'HACK',
    fire: 'SHOOT',
    jump: 'JUMP',
    exit: 'Exit',
    rotateTitle: 'Rotate your phone',
    rotateBody: 'Montanha: Zero Day is played in landscape.',
    fullscreen: 'Full screen',
    tagline: 'He went to rescue Gle. Now she is the one coming for him.',
    continue: 'Continue',
    newGame: 'New game',
    start: 'Start',
    sound: 'Sound: {state}',
    on: 'on',
    off: 'off',
    install: 'Install app',
    keyHint: 'Keyboard: ← → move · Z jump (hold in the air = fly) · X shoot (hold = charge) · C hack · Esc pause',
    credit: 'a game by <a href="https://github.com/tiagovilasboas" target="_blank" rel="noopener">Tiago Vilas Boas</a>',
    missions: 'MISSIONS',
    equipment: 'GEAR',
    cleared: 'CLEAR',
    locked: 'LOCKED',
    open: 'OPEN',
    portraitAlt: 'Portrait of {name}',
    gearWatchName: 'H4X watch',
    gearWatchText: 'shoots, charges a heavy blast, and hacks terminals and turrets.',
    gearJetName: 'JET pack',
    gearJetText: 'hold JUMP in the air: the jet lifts you up.',
    gearGauntletName: 'Golden gauntlet',
    gearGauntletText: 'shoots, charges a heavy blast, and hacks terminals and turrets.',
    gearBootsName: 'Light boots',
    gearBootsText: 'hold JUMP in the air: the boots keep you up.',
    gearByte: '<b>BYTE</b> assistant robot that gives tips and shoots on its own.',
    shot: 'Shot',
    charge: 'Charge',
    gleHead: 'GLE<small>FREE</small>',
    missionHead: 'MISSION<small>CLEAR</small>',
    rescueNote: 'Montanha was captured. Now it is her turn.',
    time: 'Time',
    enemies: 'Enemies',
    xpGained: 'XP gained',
    level: 'Level',
    overHead: 'SYSTEM<small>COMPROMISED</small>',
    overNote: 'Byte rebooted your systems at the last checkpoint.',
    retry: 'Back to checkpoint',
    missionMap: 'Mission map',
    pauseTitle: 'PAUSED',
    resume: 'Resume',
    leaveMap: 'Quit to map',
    endingHead: 'THE NET<small>IS FREE</small>',
    endingNote: 'Gle beat RANSOM-TITAN, pulled Montanha out of the cell, and Neo-Sampa lit up again. Same team, always.',
    finalSheet: 'FINAL SHEET',
    totalXp: 'Total XP',
    titleScreen: 'Title screen',
    langSwitch: 'Português',
    stageKicker: 'STAGE {n}',
    system: 'SYSTEM',
    shock: 'Feedback shock: -2 HP',
    terminalLocked: 'Terminal locked. Not yet.',
    terminalCooling: 'Terminal recharging...',
    firewallDown: 'FIREWALL DOWN! ATTACK!',
    accessGranted: 'ACCESS GRANTED',
    lowEp: 'Not enough EP',
    turretAllied: 'TURRET IS NOW AN ALLY',
    lowEmp: 'Not enough EP for the EMP pulse',
    laserDoor: 'Laser door! Hack the yellow terminal',
    byteHeal: 'BYTE: emergency repair +1 HP',
    firewallBack: 'THE FIREWALL IS BACK!',
    checkpoint: 'CHECKPOINT SAVED',
    levelUp: 'LEVEL UP! LV {lv}',
    defeatBoss: 'DEFEAT RANSOM-TITAN',
    helpSeq: 'Memorize the sequence and repeat it in the same order.',
    helpBin: 'Turn the bits on until the sum matches the target.',
    helpGrid: 'Turn every node cyan. Each tap flips that node and its neighbors. Stuck? A hint flashes.',
    target: 'TARGET',
    current: 'NOW',
    observe: 'WATCH...',
    yourTurn: 'YOUR TURN',
    accessOk: 'ACCESS GRANTED',
    accessDenied: 'ACCESS DENIED',
    timeUp: 'TIME UP',
    up: 'up',
    right: 'right',
    down: 'down',
    left: 'left',
    node: 'node {n}',
    hackTitle: 'HACK // {label}',
    titanCore: 'TITAN CORE',
    hostileTurret: 'HOSTILE TURRET',
    mainframe: 'DATACENTER MAINFRAME',
  },
  pt: {
    metaDescription: 'Montanha: Zero Day. Plataforma cyberpunk em pixel art. O Montanha vai resgatar a Gle. Depois é ela quem vai buscar ele.',
    pause: 'Pausar',
    keys: 'Controles do teclado',
    move: 'Mover',
    keyMove: '<kbd>←</kbd><kbd>→</kbd> mover',
    keyJump: '<kbd>Z</kbd> pular <small>(segure no ar: voar)</small>',
    keyFire: '<kbd>X</kbd> atirar <small>(segure: carga)</small>',
    keyHack: '<kbd>C</kbd> hack',
    keyPause: '<kbd>Esc</kbd> pausa',
    hack: 'HACK',
    fire: 'TIRO',
    jump: 'PULO',
    exit: 'Sair',
    rotateTitle: 'Gire o celular',
    rotateBody: 'Montanha: Zero Day é jogado na horizontal.',
    fullscreen: 'Tela cheia',
    tagline: 'Ele foi resgatar a Gle. Agora é ela quem vai buscar ele.',
    continue: 'Continuar',
    newGame: 'Novo jogo',
    start: 'Começar',
    sound: 'Som: {state}',
    on: 'ligado',
    off: 'desligado',
    install: 'Instalar app',
    keyHint: 'Teclado: ← → mover · Z pular (segure no ar = voar) · X atirar (segure = carga) · C hack · Esc pausa',
    credit: 'um jogo de <a href="https://github.com/tiagovilasboas" target="_blank" rel="noopener">Tiago Vilas Boas</a>',
    missions: 'MISSÕES',
    equipment: 'EQUIPAMENTO',
    cleared: 'CONCLUÍDA',
    locked: 'BLOQUEADA',
    open: 'LIVRE',
    portraitAlt: 'Retrato de {name}',
    gearWatchName: 'Relógio H4X',
    gearWatchText: 'atira, carrega disparo pesado e hackeia terminais e torretas.',
    gearJetName: 'Mochila JET',
    gearJetText: 'segure PULO no ar: o jato te leva pro alto.',
    gearGauntletName: 'Manopla dourada',
    gearGauntletText: 'atira, carrega disparo pesado e hackeia terminais e torretas.',
    gearBootsName: 'Botas de luz',
    gearBootsText: 'segure PULO no ar: as botas te seguram no alto.',
    gearByte: '<b>BYTE</b> robô assistente que dá dicas e atira sozinho.',
    shot: 'Tiro',
    charge: 'Carga',
    gleHead: 'GLE<small>LIBERTADA</small>',
    missionHead: 'MISSÃO<small>CONCLUÍDA</small>',
    rescueNote: 'O Montanha foi capturado. Agora é a vez dela.',
    time: 'Tempo',
    enemies: 'Inimigos',
    xpGained: 'XP ganho',
    level: 'Nível',
    overHead: 'SISTEMA<small>COMPROMETIDO</small>',
    overNote: 'O Byte reiniciou seus sistemas no último checkpoint.',
    retry: 'Voltar ao checkpoint',
    missionMap: 'Mapa de missões',
    pauseTitle: 'PAUSA',
    resume: 'Continuar',
    leaveMap: 'Sair para o mapa',
    endingHead: 'A REDE<small>ESTÁ LIVRE</small>',
    endingNote: 'A Gle venceu o RANSOM-TITAN, tirou o Montanha da cela e Neo-Sampa acendeu de novo. Mesmo time, sempre.',
    finalSheet: 'FICHA FINAL',
    totalXp: 'XP total',
    titleScreen: 'Tela inicial',
    langSwitch: 'English',
    stageKicker: 'FASE {n}',
    system: 'SISTEMA',
    shock: 'Choque de retorno: -2 HP',
    terminalLocked: 'Terminal bloqueado. Ainda não é hora.',
    terminalCooling: 'Terminal recarregando...',
    firewallDown: 'FIREWALL DERRUBADO! ATAQUE!',
    accessGranted: 'ACESSO LIBERADO',
    lowEp: 'EP insuficiente',
    turretAllied: 'TORRETA AGORA É ALIADA',
    lowEmp: 'EP insuficiente para o pulso EMP',
    laserDoor: 'Porta laser! Hackeie o terminal amarelo',
    byteHeal: 'BYTE: reparo de emergência +1 HP',
    firewallBack: 'O FIREWALL VOLTOU!',
    checkpoint: 'CHECKPOINT SALVO',
    levelUp: 'SUBIU DE NÍVEL! LV {lv}',
    defeatBoss: 'DERROTE O RANSOM-TITAN',
    helpSeq: 'Memorize a sequência e repita na mesma ordem.',
    helpBin: 'Ligue os bits até a soma bater com o alvo.',
    helpGrid: 'Deixe todos os nós em ciano. Cada toque inverte o nó e os vizinhos. Travou? Uma dica pisca.',
    target: 'ALVO',
    current: 'ATUAL',
    observe: 'OBSERVE...',
    yourTurn: 'SUA VEZ',
    accessOk: 'ACESSO CONCEDIDO',
    accessDenied: 'ACESSO NEGADO',
    timeUp: 'TEMPO ESGOTADO',
    up: 'cima',
    right: 'direita',
    down: 'baixo',
    left: 'esquerda',
    node: 'nó {n}',
    hackTitle: 'HACK // {label}',
    titanCore: 'NÚCLEO DO TITAN',
    hostileTurret: 'TORRETA HOSTIL',
    mainframe: 'DATACENTER MAINFRAME',
  },
};

// Narrative lines stay in Portuguese inside config.js. English is looked up from the original text.
const LINES = {
  'Porta laser no caminho? Chegue no terminal amarelo e aperte HACK.': 'Laser door ahead? Walk up to the yellow terminal and press HACK.',
  'Telhados do Cecapão': 'Cecapão Rooftops',
  'Subsolo 404: Servidor Submerso': 'Sublevel 404: Sunken Server',
  'Kernel Panic: o Núcleo': 'Kernel Panic: the Core',
  BOTAS: 'BOOTS',
  'Continue, Montanha. A cidade conta com você.': 'Keep going, Montanha. The city is counting on you.',
  'Telhados do Cecapão. O sinal da cápsula da Gle vem do fim destes prédios.': 'Cecapão Rooftops. Gle\'s capsule signal is coming from the far end of these buildings.',
  'Lembrete: no ar, SEGURE o PULO para ligar o JET da mochila.': 'Reminder: in the air, HOLD JUMP to fire the pack JET.',
  'Cada drone derrubado é um passo mais perto de você, amor. Bora.': 'Every drone I drop is one step closer to you, love. Let\'s go.',
  'Segure TIRO para carregar o relógio. Solte para um disparo pesado que atravessa inimigos.': 'Hold SHOOT to charge the watch. Release for a heavy blast that pierces enemies.',
  'Perto de uma torreta vermelha, aperte HACK: ela passa a lutar do nosso lado.': 'Next to a red turret, press HACK: it switches to our side.',
  'Longe de terminais e torretas, HACK solta um pulso EMP que paralisa inimigos.': 'Away from terminals and turrets, HACK fires an EMP pulse that freezes enemies.',
  'Subsolo 404: Servidor Submerso. O rastro do RANSOM-TITAN passa por aqui.': 'Sublevel 404: Sunken Server. RANSOM-TITAN\'s trail runs through here.',
  'Cada drone que eu derrubar me deixa mais perto dele, Byte.': 'Every drone I drop gets me closer to him, Byte.',
  'Mudei minha cor pro seu time. Modo Gle ativado.': 'I changed my color to your team. Gle mode on.',
  'Sua manopla atira e hackeia igual ao relógio dele.': 'Your gauntlet shoots and hacks just like his watch.',
  'No ar, segure PULO e as botas de luz te seguram no alto.': 'In the air, hold JUMP and the light boots keep you up.',
  'Ponte apagada à frente. O terminal ao lado religa a ponte. Sem ela, só lasers lá embaixo.': 'The bridge ahead is dark. The terminal beside it powers the bridge. Without it, there are only lasers below.',
  'Cada inimigo derrotado dá XP. Subir de nível aumenta seu HP e o dano da manopla.': 'Every enemy you defeat gives XP. Leveling up raises your HP and the gauntlet\'s damage.',
  'Subsolo limpo. E agora, Byte?': 'Sublevel is clear. What now, Byte?',
  'O sinal do Montanha some dentro do Núcleo, a casa do RANSOM-TITAN.': 'Montanha\'s signal disappears inside the Core, RANSOM-TITAN\'s home.',
  'Então é lá que eu vou. Aguenta, amor.': 'Then that is where I am going. Hold on, love.',
  'Sinto a assinatura do RANSOM-TITAN. Guarde EP para os terminais.': 'I can feel RANSOM-TITAN\'s signature. Save EP for the terminals.',
  'Feixes de pulso! Eles piscam antes de ligar. Passe quando apagarem.': 'Pulse beams! They flash before they turn on. Cross while they are dark.',
  'Checkpoint salvo. O sinal do Montanha ficou mais forte. Tá perto, Gle.': 'Checkpoint saved. Montanha\'s signal got stronger. You are close, Gle.',
  'Depois deste checkpoint vem o chefe. Respira fundo, Gle. O Montanha está esperando por você.': 'The boss is after this checkpoint. Breathe, Gle. Montanha is waiting for you.',
  'ANO 2099. NEO-SAMPA.': 'YEAR 2099. NEO-SAMPA.',
  'A LEGIÃO NULL, uma IA invasora, tomou a rede do planeta.': 'The NULL LEGION, an invading AI, took over the planet\'s network.',
  'Seu general, o RANSOM-TITAN, soltou drones de malware nas ruas.': 'Its general, RANSOM-TITAN, released malware drones into the streets.',
  'Montanha! Eles invadiram a casa! Estão me levando!': 'Montanha! They broke into the house! They are taking me!',
  'SINAL PERDIDO. CÁPSULA CRIPTOGRAFADA EM TRÂNSITO.': 'SIGNAL LOST. ENCRYPTED CAPSULE IN TRANSIT.',
  'Montanha, levaram a Gle! O RANSOM-TITAN trancou ela numa cápsula, no alto dos telhados.': 'Montanha, they took Gle! RANSOM-TITAN locked her in a capsule, up on the rooftops.',
  'Pega minha mochila e o relógio, Byte. Ninguém mexe com a minha parceira.': 'Grab my pack and the watch, Byte. Nobody messes with my partner.',
  'Mochila JET carregada. Relógio H4X pronto pra atirar e hackear.': 'JET pack charged. H4X watch ready to shoot and hack.',
  'Mesmo time, sempre. Aguenta firme, amor. Tô indo.': 'Same team, always. Hold on, love. I am on my way.',
  'Gle! Achei você, amor. Segura que eu vou abrir isso.': 'Gle! I found you, love. Hold on, I am opening this.',
  'Montanha... eu sabia que você vinha.': 'Montanha... I knew you were coming.',
  'Cuidado! Tem alguma coisa descendo do céu!': 'Watch out! Something is coming down from the sky!',
  'MONTANHA! Não! Solta ele!': 'MONTANHA! No! Let him go!',
  'Era uma isca! O RANSOM-TITAN queria o hacker. A cápsula abriu sozinha.': 'It was bait! RANSOM-TITAN wanted the hacker. The capsule opened on its own.',
  'Então ele vai ter que me aguentar.': 'Then he is going to have to deal with me.',
  'O Montanha deixou comigo a manopla reserva e as botas de luz. Veste!': 'Montanha left the spare gauntlet and the light boots with me. Put them on!',
  'E copiei os upgrades dele pra você. O sinal dele vai pro Subsolo 404.': 'And I copied his upgrades for you. His signal leads to Sublevel 404.',
  'Me mostra o caminho, Byte. Mesmo time, sempre.': 'Show me the way, Byte. Same team, always.',
  'A princesa veio buscar o hacker? O hacker é meu. E a rede também.': 'The princess came for the hacker? The hacker is mine. And so is the network.',
  'Ele não é só um hacker. É meu parceiro. Mesmo time, sempre.': 'He is not just a hacker. He is my partner. Same team, always.',
  'Eu sou RANSOM-TITAN. Nada sai deste Núcleo sem a minha chave.': 'I am RANSOM-TITAN. Nothing leaves this Core without my key.',
  'Ele é blindado. Acerta enquanto dá, Gle!': 'He is armored. Hit him while you can, Gle!',
  'Ele ergueu um FIREWALL! Os tiros não passam. Hackeia o terminal à esquerda, Gle!': 'He raised a FIREWALL! Shots cannot get through. Hack the terminal on the left, Gle!',
  'Impossível... minha criptografia era... perfeita...': 'Impossible... my encryption was... perfect...',
  'Chave mestra extraída! Liberando os servidores do planeta...': 'Master key extracted! Releasing the planet\'s servers...',
  'E achei a cela do Montanha, bem no fundo do Núcleo!': 'And I found Montanha\'s cell, deep in the Core!',
  'A chave é minha agora. Abre essa cela, Byte.': 'The key is mine now. Open that cell, Byte.',
  'CELA CRIPTOGRAFADA ABERTA. PRISIONEIRO LIBERADO: MONTANHA.': 'ENCRYPTED CELL OPEN. PRISONER RELEASED: MONTANHA.',
  '...Gle? Eu sabia que você vinha, amor.': '...Gle? I knew you were coming, love.',
  'Mesmo time, sempre.': 'Same team, always.',
  'Neo-Sampa acendeu de novo. Missão cumprida, vocês dois.': 'Neo-Sampa is lit again. Mission complete, you two.',
};

function browserIsPortuguese() {
  const primary = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
  return primary === 'pt' || primary.startsWith('pt-');
}

function timezoneIsBrazil() {
  try {
    return BR_TIMEZONES.has(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return false;
  }
}

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch { /* private mode: fall through to detection */ }
  return timezoneIsBrazil() && browserIsPortuguese() ? 'pt' : 'en';
}

let current = detectLang();

export function lang() { return current; }

export function t(key, vars) {
  const table = UI[current] || UI.en;
  let str = table[key] ?? UI.en[key] ?? key;
  if (vars) for (const [name, value] of Object.entries(vars)) str = str.replaceAll(`{${name}}`, String(value));
  return str;
}

export function tr(text) {
  if (!text || current === 'pt') return text;
  return LINES[text] ?? text;
}

export function applyDom() {
  document.documentElement.lang = current === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('metaDescription'));
}

export function toggleLang() {
  current = current === 'pt' ? 'en' : 'pt';
  try { localStorage.setItem(STORAGE_KEY, current); } catch { /* keep the choice for this session only */ }
  applyDom();
}
