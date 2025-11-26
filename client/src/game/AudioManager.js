// AudioManager.js - Full featured, optimized audio system
// Place in: client/src/game/AudioManager.js

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;
    this.musicPlaying = false;
    
    // Music nodes
    this.drones = [];
    this.beatInterval = null;
    this.beatIndex = 0;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
      
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.25;
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);
      
      this.initialized = true;
      console.log('AudioManager initialized');
    } catch (e) {
      console.warn('AudioManager failed to initialize:', e);
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Dark ambient music with 16-beat pattern
  startMusic() {
    if (!this.initialized || this.musicPlaying) return;
    this.resume();
    this.musicPlaying = true;
    
    // Low drones
    const createDrone = (freq, type, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = type;
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      gain.gain.value = vol;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      
      return { osc, gain, filter };
    };
    
    this.drones.push(createDrone(55, 'sawtooth', 0.08));
    this.drones.push(createDrone(27.5, 'sine', 0.12));
    
    // Beat pattern at 75 BPM
    const beatMs = (60 / 75) * 1000;
    this.beatIndex = 0;
    
    this.beatInterval = setInterval(() => {
      const beat = this.beatIndex % 16;
      
      // Kick on 0, 4, 8, 12
      if (beat % 4 === 0) this.playMusicKick();
      // Hi-hat on 2, 6, 10, 14
      if (beat % 4 === 2) this.playMusicHat();
      // Pad on 0, 5, 8, 13
      if ([0, 5, 8, 13].includes(beat)) this.playMusicPad();
      
      this.beatIndex++;
    }, beatMs);
  }

  playMusicKick() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playMusicHat() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const now = this.ctx.currentTime;
    
    osc.type = 'square';
    osc.frequency.value = 200 + Math.random() * 50;
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 8;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playMusicPad() {
    const freqs = [110, 130.81, 164.81]; // Am chord
    const now = this.ctx.currentTime;
    
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  stopMusic() {
    this.musicPlaying = false;
    
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
    
    this.drones.forEach(d => {
      try { d.osc.stop(); d.osc.disconnect(); d.gain.disconnect(); } catch(e) {}
    });
    this.drones = [];
  }

  // Sound Effects
  playGunshot(weapon = 'pistol') {
    if (!this.initialized) return;
    this.resume();
    
    const params = {
      pistol: { freq: 150, dur: 0.12, vol: 0.35 },
      shotgun: { freq: 80, dur: 0.2, vol: 0.45 },
      smg: { freq: 200, dur: 0.06, vol: 0.25 },
      rifle: { freq: 100, dur: 0.18, vol: 0.4 }
    };
    const p = params[weapon] || params.pistol;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(p.freq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + p.dur);
    gain.gain.setValueAtTime(p.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + p.dur);
  }

  playImpact(isHeadshot = false) {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 400 : 200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain.gain.setValueAtTime(isHeadshot ? 0.3 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
    
    // Headshot ping
    if (isHeadshot) {
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.value = 1200;
      pingGain.gain.setValueAtTime(0.12, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      ping.connect(pingGain);
      pingGain.connect(this.sfxGain);
      ping.start(now);
      ping.stop(now + 0.15);
    }
  }

  playMelee(weapon = 'knife') {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = weapon === 'knife' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(weapon === 'knife' ? 600 : 250, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playFootstep(onGlass = false) {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    // Create noise burst
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = onGlass ? 3000 : 400;
    filter.Q.value = onGlass ? 3 : 1;
    gain.gain.setValueAtTime(onGlass ? 0.12 : 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(now);
  }

  playPickup(type = 'generic') {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const freqs = type === 'weapon' ? [300, 450, 600, 750] : [400, 550, 700];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05;
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  playDamage() {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playEnemyAggro(type = 'normal') {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const freqs = { normal: 150, runner: 250, brute: 80, thrower: 180, boss: 60 };
    const freq = freqs[type] || 150;
    
    const osc = this.ctx.createOscillator();
    const modOsc = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    modOsc.type = 'sine';
    modOsc.frequency.value = 20;
    modGain.gain.value = 25;
    
    modOsc.connect(modGain);
    modGain.connect(osc.frequency);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    modOsc.start(now);
    osc.stop(now + 0.4);
    modOsc.stop(now + 0.4);
  }

  playPing() {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playLevelUp() {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.1;
      
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  playDowned() {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    [392, 330, 262, 196].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.15;
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playRevive() {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    [262, 330, 392, 523].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.12;
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  playGlassBreak() {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.02;
      
      osc.type = 'square';
      osc.frequency.value = 2000 + Math.random() * 3000;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  }

  dispose() {
    this.stopMusic();
    if (this.ctx) this.ctx.close();
    this.initialized = false;
  }
}

const audioManager = new AudioManager();
export default audioManager;
