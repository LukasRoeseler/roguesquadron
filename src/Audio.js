export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this._musicTimer = null;
    this._initialized = false;
  }

  /** Muss nach User-Geste aufgerufen werden (Browser-Policy). */
  init() {
    if (this._initialized) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.masterGain);

    this._initialized = true;
    this._startHeroicLoop();
  }

  resume() { this.ctx?.resume(); }

  /** Prozeduraler Laser-Sound: kurzer Sweep + Noise-Burst */
  playLaser(color = 'red') {
    if (!this._initialized) return;
    const t0 = this.ctx.currentTime;

    // Hauptton: schneller abfallender Sweep
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const baseFreq = color === 'green' ? 1100 : 850;
    osc.frequency.setValueAtTime(baseFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(120, t0 + 0.18);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq;
    filter.Q.value = 4;

    osc.connect(filter); filter.connect(oscGain); oscGain.connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.22);

    // Noise-Burst für "Knall"
    const bufSize = this.ctx.sampleRate * 0.08;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.15;
    noise.connect(noiseGain); noiseGain.connect(this.sfxGain);
    noise.start(t0);
  }

  playExplosion() {
    if (!this._initialized) return;
    const t0 = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 0.6;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.pow(1 - i / bufSize, 2);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t0);
    filter.frequency.exponentialRampToValueAtTime(80, t0 + 0.5);
    const g = this.ctx.createGain();
    g.gain.value = 0.4;
    noise.connect(filter); filter.connect(g); g.connect(this.sfxGain);
    noise.start(t0);
  }

  // ----- Heroischer Synth-Loop -----
  _startHeroicLoop() {
    // Eine simple Akkordfolge in C-Dur (heroisch): C - G - Am - F (I-V-vi-IV)
    const beat = 0.5; // Sekunden pro Schlag
    const seq = [
      // [chord, melodyNote] – Melodie in Hz
      { chord: ['C3','E3','G3'], melody: ['G4','C5','E5','G5'] },
      { chord: ['G2','B2','D3'], melody: ['D5','G5','B5','D6'] },
      { chord: ['A2','C3','E3'], melody: ['E5','A5','C6','A5'] },
      { chord: ['F2','A2','C3'], melody: ['F5','A5','C6','F6'] },
    ];

    let bar = 0;
    const playBar = () => {
      if (!this._initialized) return;
      const t0 = this.ctx.currentTime + 0.05;
      const { chord, melody } = seq[bar % seq.length];

      // Pad-Akkord (sägezahn + filter, lange Hüllkurve)
      for (const note of chord) this._playPadNote(note, t0, beat * 4);

      // Melodie (square mit etwas Vibrato), je 1 Beat
      melody.forEach((note, i) => this._playLeadNote(note, t0 + i * beat, beat * 0.95));

      bar++;
      this._musicTimer = setTimeout(playBar, beat * 4 * 1000);
    };
    playBar();
  }

  _noteHz(name) {
    // Einfache Auflösung: C4 = 261.63
    const semis = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
    const m = name.match(/^([A-G])(#?)(\d)$/);
    if (!m) return 440;
    const semi = semis[m[1]] + (m[2] === '#' ? 1 : 0);
    const oct = parseInt(m[3], 10);
    const midi = 12 * (oct + 1) + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  _playPadNote(name, t0, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = this._noteHz(name);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.3);
    g.gain.setValueAtTime(0.08, t0 + dur - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(filter); filter.connect(g); g.connect(this.musicGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  _playLeadNote(name, t0, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = this._noteHz(name);
    // Leichtes Vibrato
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.musicGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
    lfo.start(t0); lfo.stop(t0 + dur + 0.05);
  }
}
