// Procedural Ambient Zen Sound Engine using Web Audio API
// No external mp3 files needed - 100% reliable, lightweight, and atmospheric

class AmbientSoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.masterGain = null;
    this.windGain = null;
    this.chimeTimer = null;
    this.cricketTimer = null;
    this.currentMode = 'golden'; // 'golden', 'sunset', 'night', 'dawn'
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Wind Generator (Pink/Brown noise with bandpass modulation)
    this.setupWind();
  }

  setupWind() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    this.whiteNoiseNode = this.ctx.createBufferSource();
    this.whiteNoiseNode.buffer = noiseBuffer;
    this.whiteNoiseNode.loop = true;

    // Filter for wind gusting
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.whiteNoiseNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.whiteNoiseNode.start(0);

    // Natural wind swell modulation loop
    this.modulateWind();
  }

  modulateWind() {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const nextSwell = 3 + Math.random() * 5;
    const targetFreq = 180 + Math.random() * 260;
    const targetGain = 0.12 + Math.random() * 0.18;

    this.windFilter.frequency.linearRampToValueAtTime(targetFreq, now + nextSwell);
    this.windGain.gain.linearRampToValueAtTime(targetGain, now + nextSwell);

    setTimeout(() => this.modulateWind(), nextSwell * 1000);
  }

  // Play peaceful resonant Zen bell / wind chime tone
  playChime(freq = 587.33) {
    if (!this.ctx || !this.isPlaying) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    // Subtle harmonic overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.02, now);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(this.masterGain);
    gain2.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3.5);
    osc2.stop(now + 2.0);
  }

  scheduleChimes() {
    if (!this.isPlaying) return;
    // Pentatonic scale notes (D, E, F#, A, B)
    const notes = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99];
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    this.playChime(randomNote);

    const delay = 4000 + Math.random() * 8000;
    this.chimeTimer = setTimeout(() => this.scheduleChimes(), delay);
  }

  setMode(mode) {
    this.currentMode = mode;
    if (!this.ctx || !this.isPlaying) return;
    if (mode === 'night') {
      this.windGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1);
    } else {
      this.windGain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 1);
    }
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.windGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.5);
      this.modulateWind();
      this.scheduleChimes();
    } else {
      if (this.windGain) {
        this.windGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      }
      clearTimeout(this.chimeTimer);
    }
    return this.isPlaying;
  }

  setVolume(vol) {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.05);
  }
}

export const soundEngine = new AmbientSoundEngine();
