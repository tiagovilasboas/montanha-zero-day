// Som: efeitos e trilha de fantasia (cordas, harpa, flauta, tímpano e eco de sala) gerados com WebAudio. Nenhum arquivo de áudio.
import { save, persist } from './core.js';

let ac = null, master, musicBus, sfxBus, noiseBuf;
const music = { track: null, step: 0, next: 0 };

// Trilhas originais, uma por fase, cada uma inspirada num estilo de jogo clássico (nenhuma melodia é copiada).
// melody: uma colcheia por símbolo: nota (C5, F#4, Bb5), "-" segura a anterior, "." é pausa. 8 compassos de 8.
// chords: um acorde por compasso; dele saem baixo, harpa e cordas.
// voice: instrumento da melodia (flute, brass, bell). bass: pedal | walk | drive | bounce.
// arp: wide | sparse | off. drums: soft | march | drive | battle | none.
const TRACKS = {
  // Título: prelúdio de cristal, no espírito de RPGs de fantasia (harpa rolando, flauta, cordas).
  title: { bpm: 76, voice: 'flute', bass: 'pedal', arp: 'wide', drums: 'none', pad: true,
    chords: 'C Am F G C Am Dm G', melody: `
    E5 - - D5 E5 - G5 -   A5 - - G5 E5 - C5 -   F5 - - E5 F5 - A5 -   G5 - - - D5 - B4 -
    E5 - - D5 E5 - G5 -   C6 - - B5 A5 - E5 -   D5 - F5 - A5 - G5 F5   E5 - - - D5 - - -` },
  // Fase 1, Telhados: marcha de aventura de campo aberto (metais, caixa de marcha, fanfarra na abertura).
  0: { bpm: 132, voice: 'brass', bass: 'walk', arp: 'sparse', drums: 'march', pad: true,
    chords: 'C Bb F C C Bb F G', melody: `
    G4 . G4 G4 C5 - E5 -   D5 . D5 D5 F5 - D5 -   C5 - A4 - F4 . A4 C5   E5 - - . G4 - C5 E5
    G5 - E5 - C5 . E5 G5   F5 - D5 - Bb4 . D5 F5   A5 - G5 F5 E5 - C5 -   D5 - - - G4 B4 D5 G5` },
  // Fase 2, Data Center: caverna de cristal, mistério (sinos, acordes longos, pouca percussão).
  1: { bpm: 84, voice: 'bell', bass: 'pedal', arp: 'sparse', drums: 'soft', pad: true,
    chords: 'Am F C G Am F Dm E', melody: `
    E5 - - - A5 - - -   C6 - - B5 A5 - - -   G5 - - - E5 - G5 -   D5 - - - B4 - D5 -
    E5 - - . A5 - C6 -   F5 - A5 - C6 - A5 -   D5 - F5 - A5 - - -   G#5 - - - E5 - B4 -` },
  // Fase 3, Núcleo: tensão sombria e ritmo seco, num clima de fortaleza final (metais e baixo em colcheias).
  2: { bpm: 146, voice: 'brass', bass: 'drive', arp: 'off', drums: 'drive', pad: true,
    chords: 'Dm Bb C A Dm Bb Gm A', melody: `
    D5 D5 F5 D5 A5 - G5 F5   F5 F5 D5 F5 Bb5 - A5 G5   E5 E5 G5 E5 C6 - B5 G5   C#5 C#5 E5 C#5 A5 - G5 E5
    D5 F5 A5 D6 C6 - A5 F5   D5 F5 Bb5 D6 C6 - Bb5 F5   G5 Bb5 D6 Bb5 A5 - G5 D5   E5 - G5 - C#6 - E6 -` },
  // Chefe: batalha decisiva (baixo correndo em oitavas, metais, cordas, tons e caixa).
  boss: { bpm: 158, voice: 'brass', bass: 'bounce', arp: 'off', drums: 'battle', pad: true,
    chords: 'Em C Am B Em C D B', melody: `
    E5 G5 B5 E6 D6 - B5 G5   C6 E5 G5 C6 B5 - G5 E5   A5 C6 E6 C6 A5 - E5 C5   B5 D#6 F#6 D#6 B5 - F#5 D#5
    E5 G5 B5 E6 G6 - E6 B5   C6 E6 G6 E6 C6 - G5 E5   D6 F#6 A6 F#6 D6 - A5 F#5   B5 - D#6 - F#6 - B6 -` },
};

const PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pitchClass = (letter, acc) => (PITCH[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + 12) % 12;

// "C5 - - G4 ." -> [{m: 72, len: 3}, null, null, {m: 67, len: 1}, null]
function parseLead(text) {
  const tokens = text.trim().split(/\s+/), out = tokens.map(() => null);
  let last = -1;
  tokens.forEach((t, i) => {
    if (t === '-') { if (last >= 0) out[last].len++; return; }
    if (t === '.') { last = -1; return; }
    const [, letter, acc, oct] = t.match(/^([A-G])([#b]?)(\d)$/);
    out[i] = { m: 12 * (+oct + 1) + pitchClass(letter, acc), len: 1 }; last = i;
  });
  return out;
}

// "Bm" -> { root: 11, tones: [0, 3, 7, 12] }
function parseChord(name) {
  const [, letter, acc, minor] = name.match(/^([A-G])([#b]?)(m?)$/);
  return { root: pitchClass(letter, acc), tones: [0, minor ? 3 : 4, 7, 12] };
}

for (const t of Object.values(TRACKS)) { t.notes = parseLead(t.melody); t.chords = t.chords.split(' ').map(parseChord); }

const midi = m => 440 * Math.pow(2, (m - 69) / 12);

// Resposta de impulso de uma sala média: ruído estéreo que decai de forma exponencial (cauda ~2 s).
function roomImpulse(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return buf;
}

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ac = new Ctx();
  master = ac.createGain(); master.gain.value = save.muted ? 0 : 0.6; master.connect(ac.destination);
  musicBus = ac.createGain(); musicBus.gain.value = 0.65; musicBus.connect(master);
  const room = ac.createConvolver(), wet = ac.createGain();
  room.buffer = roomImpulse(ac, 2.2); wet.gain.value = 0.32;
  musicBus.connect(room); room.connect(wet); wet.connect(master);
  sfxBus = ac.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
}

export function toggleMute() {
  save.muted = !save.muted; persist();
  if (master) master.gain.value = save.muted ? 0 : 0.6;
  return save.muted;
}

export function tone(freq, dur = 0.1, type = 'square', vol = 0.15, delay = 0, slideTo = 0, bus = sfxBus) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}

// ---- Vozes da orquestra. Cada uma é uma pequena cadeia: osciladores -> filtro -> envelope -> barramento da música.
const rand = (spread = 1) => (Math.random() - 0.5) * spread;

function voice(freq, dur, kind, vol, delay = 0) {
  const t = ac.currentTime + Math.max(0, delay), V = VOICES[kind];
  const out = ac.createGain(), filter = ac.createBiquadFilter(), end = t + dur + V.release;
  filter.type = 'lowpass'; filter.frequency.value = V.cutoff; filter.Q.value = 0.4;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(vol, t + V.attack);
  if (V.pluck) out.gain.exponentialRampToValueAtTime(0.0001, t + dur + V.release);
  else { out.gain.setValueAtTime(vol * V.sustain, t + Math.max(V.attack, dur * 0.6)); out.gain.exponentialRampToValueAtTime(0.0001, end); }
  filter.connect(out); out.connect(musicBus);
  V.oscs.forEach(([type, mult, cents, level]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq * mult; o.detune.value = cents; g.gain.value = level;
    o.connect(g); g.connect(filter);
    if (V.vibrato) addVibrato(o, t);
    o.start(t); o.stop(end + 0.05);
  });
}

// Vibrato lento que entra depois do início da nota, como um sopro ou arco de verdade.
function addVibrato(osc, t) {
  const lfo = ac.createOscillator(), depth = ac.createGain();
  lfo.frequency.value = 5.2 + rand(0.8);
  depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(7, t + 0.35);
  lfo.connect(depth); depth.connect(osc.detune); lfo.start(t); lfo.stop(t + 6);
}

// oscs: [onda, múltiplo da frequência, desafinação em cents, volume]
const VOICES = {
  flute: { oscs: [['triangle', 1, 0, 0.7], ['sine', 2, 0, 0.16]], cutoff: 3000, attack: 0.05, release: 0.18, sustain: 0.85, vibrato: true },
  brass: { oscs: [['sawtooth', 1, -6, 0.5], ['sawtooth', 1, 6, 0.5]], cutoff: 3200, attack: 0.04, release: 0.14, sustain: 0.8 },
  bell: { oscs: [['sine', 1, 0, 0.7], ['sine', 2.01, 0, 0.3], ['sine', 2.76, 0, 0.14]], cutoff: 6500, attack: 0.003, release: 1.5, pluck: true },
  strings: { oscs: [['sawtooth', 1, -9, 0.5], ['sawtooth', 1, 9, 0.5]], cutoff: 900, attack: 0.45, release: 0.7, sustain: 0.9 },
  harp: { oscs: [['sine', 1, 0, 0.8], ['triangle', 2, 0, 0.18]], cutoff: 4200, attack: 0.004, release: 1.1, pluck: true },
  bass: { oscs: [['sine', 1, 0, 0.8], ['triangle', 1, 0, 0.35]], cutoff: 520, attack: 0.02, release: 0.25, sustain: 0.8 },
};

function noise(dur, vol, delay = 0, bus = sfxBus) {
  if (!ac) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate / 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + delay, s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = noiseBuf; g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(g); g.connect(bus); s.start(t); s.stop(t + dur);
}

const arpeggio = (notes, gap, dur = 0.12) => notes.forEach((f, i) => tone(f, dur, 'square', 0.12, i * gap));

const SFX = {
  shoot: () => tone(880, 0.08, 'square', 0.1, 0, 1600),
  big: () => tone(220, 0.25, 'sawtooth', 0.2, 0, 880),
  jump: () => tone(300, 0.12, 'square', 0.08, 0, 600),
  hit: () => noise(0.1, 0.22),
  hurt: () => tone(220, 0.22, 'sawtooth', 0.2, 0, 60),
  boom: () => { noise(0.4, 0.35); tone(120, 0.4, 'triangle', 0.3, 0, 40); },
  pick: () => arpeggio([988, 1319], 0.06, 0.08),
  hackOk: () => arpeggio([523, 659, 784, 1047], 0.07),
  hackFail: () => tone(160, 0.35, 'sawtooth', 0.2, 0, 80),
  levelUp: () => arpeggio([523, 659, 784, 1047, 784, 1047], 0.09, 0.14),
  blip: () => tone(1200, 0.025, 'square', 0.04),
  emp: () => tone(1500, 0.4, 'sine', 0.2, 0, 100),
  charge: () => tone(400, 0.06, 'triangle', 0.06),
};
export const SEQ_NOTES = [523, 659, 784, 988];

export function sfx(name) { if (ac && !save.muted) SFX[name]?.(); }

export function playTrack(id) { music.track = TRACKS[id] || null; music.step = 0; music.next = ac ? ac.currentTime + 0.05 : 0; }
export function stopMusic() { music.track = null; }

// Harpa: arpejo rolando por duas oitavas do acorde (sobe, desce), em semicolcheias.
const ARP = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1];

// Segunda voz da melodia: o tom do acorde mais próximo abaixo, a pelo menos 3 semitons (terças e sextas paralelas).
function harmonyFor(m, chord) {
  for (let h = m - 3; h > m - 10; h--) if (chord.tones.some(t => ((h - chord.root - t) % 12 + 12) % 12 === 0)) return h;
  return m - 5;
}

// Padrões de baixo por colcheia do compasso (semitons acima da fundamental; null = pausa).
const BASS = {
  walk: [0, null, 7, null, 12, null, 7, null],
  drive: [0, null, 0, 12, 7, null, 12, 7],
  bounce: [0, 12, 0, 12, 0, 12, 0, 12],
  pedal: [0, null, null, null, 7, null, null, null],
};
const LEAD_VOLUME = { flute: 0.1, brass: 0.075, bell: 0.09 };

const kick = (delay, vol = 0.28) => tone(110, 0.14, 'sine', vol, delay, 45, musicBus);
const snare = (delay, vol = 0.08) => noise(0.09, vol, delay, musicBus);
const hat = (delay, vol = 0.03) => noise(0.03, vol, delay, musicBus);
const tom = (delay, f = 150) => tone(f, 0.14, 'sine', 0.2, delay, f * 0.6, musicBus);

// Percussão de cada estilo. bar = índice do compasso (usado nas viradas de bateria).
const DRUMS = {
  none: () => {},
  soft: (pos, d) => { if (pos === 0) tone(105, 0.3, 'sine', 0.18, d, 52, musicBus); },
  march: (pos, d) => { if (pos === 0 || pos === 4) kick(d); if (pos === 2 || pos === 6) snare(d, 0.09); if (pos === 7) snare(d, 0.035); },
  drive: (pos, d) => { if (pos === 0 || pos === 3 || pos === 4) kick(d); if (pos === 2 || pos === 6) snare(d, 0.09); if (pos % 2) hat(d); },
  battle: (pos, d, bar) => {
    if ([0, 3, 4, 7].includes(pos)) kick(d, 0.3);
    if (pos === 2 || pos === 6) snare(d, 0.1);
    hat(d, 0.028);
    if (bar % 4 === 3 && pos >= 5) tom(d, pos === 5 ? 170 : pos === 6 ? 140 : 110);   // virada no fim da frase
  },
};

// Uma colcheia da trilha. Pequenas variações de tempo e volume tiram o ar de máquina.
function playStep(track, i, step, delay) {
  const pos = i % 8, bar = Math.floor(i / 8), chord = track.chords[bar % track.chords.length];
  const lead = track.notes[i % track.notes.length], beat = pos % 2 === 0 ? 1 : 0.85;
  const [t3, t5] = [chord.tones[1], chord.tones[2]];

  if (lead) {
    const d = delay + rand(0.012), len = lead.len * step, vol = LEAD_VOLUME[track.voice];
    voice(midi(lead.m), len, track.voice, vol * (0.9 + Math.random() * 0.2), d);
    if (track.voice !== 'bell') voice(midi(harmonyFor(lead.m, chord)), len, track.voice, vol * 0.4, d + 0.01);
  }
  if (track.pad && pos === 0) [0, t3, t5].forEach(t => voice(midi(48 + chord.root + t), step * 8, 'strings', 0.028, delay));

  if (track.arp !== 'off') {
    const arp = [0, t3, t5, 12, 12 + t3, 12 + t5];
    for (let h = 0; h < 2; h++) {
      if (track.arp === 'sparse' && (h === 1 || pos % 2)) continue;
      const note16 = arp[ARP[(pos * 2 + h) % 16]];
      voice(midi(48 + chord.root + note16), step * 3, 'harp', 0.05 * beat * (h ? 0.8 : 1) * (0.85 + Math.random() * 0.3), delay + h * step / 2 + rand(0.008));
    }
  }

  const offset = BASS[track.bass][pos];
  if (offset !== null) {
    const root = 36 + chord.root + (chord.root < 4 ? 12 : 0), hold = track.bass === 'pedal' ? step * 4 : track.bass === 'walk' ? step * 1.8 : step * 0.9;
    voice(midi(root + offset), hold, 'bass', 0.2, delay);
  }
  DRUMS[track.drums](pos, delay, bar);
}

export function tickMusic() {
  if (!ac || !music.track) return;
  const step = 60 / music.track.bpm / 2;
  if (music.next < ac.currentTime - 0.5) music.next = ac.currentTime + 0.02;
  while (music.next < ac.currentTime + 0.12) {
    playStep(music.track, music.step, step, music.next - ac.currentTime);
    music.next += step; music.step++;
  }
}
