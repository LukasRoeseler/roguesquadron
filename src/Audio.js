// src/Audio.js
export class AudioEngine {
  constructor() { this.ctx = null; this.sfxGain = null; this.musicGain = null; this._initialized = false; this._musicTimer = null; }

  init() {
    if (this._initialized) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const master = this.ctx.createGain(); master.gain.value = 0.65; master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.75; this.sfxGain.connect(master);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.22; this.musicGain.connect(master);
    this._initialized = true;
    this._startLoop();
  }

  resume() { this.ctx?.resume(); }

  playLaser(color = 'red') {
    if (!this._initialized) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const base = color === 'green' ? 1100 : color === 'yellow' ? 950 : 800;
    osc.frequency.setValueAtTime(base, t0);
    osc.frequency.exponentialRampToValueAtTime(100, t0 + 0.2);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.55, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = base; f.Q.value = 5;
    osc.connect(f); f.connect(g); g.connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.25);
  }

  playExplosion() {
    if (!this._initialized) return;
    const t0 = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.6), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(700, t0); f.frequency.exponentialRampToValueAtTime(60, t0 + 0.5);
    const g = this.ctx.createGain(); g.gain.value = 0.45;
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t0);
  }

  _noteHz(name) {
    const s = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const m = name.match(/^([A-G])(#?)(\d)$/); if (!m) return 440;
    const semi = s[m[1]] + (m[2] === '#' ? 1 : 0);
    return 440 * Math.pow(2, (12 * (parseInt(m[3]) + 1) + semi - 69) / 12);
  }

  _playPad(note, t0, dur) {
    const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = this._noteHz(note);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 750; f.Q.value = 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.3);
    g.gain.setValueAtTime(0.07, t0 + dur - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(f); f.connect(g); g.connect(this.musicGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  _playLead(note, t0, dur) {
    const osc = this.ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = this._noteHz(note);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.musicGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  _startLoop() {
    const beat = 0.48;
    const seq = [
      { chord: ['C3','E3','G3'], melody: ['G4','C5','E5','G5'] },
      { chord: ['G2','B2','D3'], melody: ['D5','G5','B5','D6'] },
      { chord: ['A2','C3','E3'], melody: ['E5','A5','C6','A5'] },
      { chord: ['F2','A2','C3'], melody: ['F5','A5','C6','F6'] },
    ];
    let bar = 0;
    const play = () => {
      if (!this._initialized) return;
      const t0 = this.ctx.currentTime + 0.04;
      const { chord, melody } = seq[bar % seq.length];
      for (const n of chord) this._playPad(n, t0, beat * 4);
      melody.forEach((n, i) => this._playLead(n, t0 + i * beat, beat * 0.9));
      bar++;
      this._musicTimer = setTimeout(play, beat * 4 * 1000);
    };
    play();
  }
}
