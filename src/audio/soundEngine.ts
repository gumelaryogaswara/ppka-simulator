/**
 * Audio Engine menggunakan Web Audio API
 * Menghasilkan efek suara kereta api realistis tanpa ketergantungan file eksternal:
 * - Semboyan 35 (Klakson Lokomotif CC206/K3LA)
 * - Suara Wesel (Motor mekanik & pengunci rel)
 * - Suara Relai Sinyal & Lonceng
 * - Gemuruh Roda Kereta pada Rel (Click-Clack Track Rumble)
 * - Jingle Melodi Stasiun Kereta Api Indonesia
 * - Sirine Bahaya / Rem Darurat
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private rumbleGain: GainNode | null = null;
  private isRumbleActive: boolean = false;
  private rumbleInterval: number | null = null;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  /**
   * Semboyan 35 - Klakson Lokomotif Khas Indonesia (Nathan AirChime K3LA GE CC206/CC201)
   * Akor 3 nada khas: D#4 (311.13 Hz), F#4 (369.99 Hz), A#4 (466.16 Hz)
   */
  public playTrainHorn() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = 0.95;

    // Frekuensi khas klakson lokomotif KAI (Nathan AirChime K3LA D# Minor)
    const chimes = [
      { freq: 311.13, gain: 0.28 }, // D#4
      { freq: 369.99, gain: 0.24 }, // F#4
      { freq: 466.16, gain: 0.22 }, // A#4
      { freq: 155.56, gain: 0.12 }, // Sub-harmonik bass lokomotif (D#3)
    ];

    // Master filter untuk menciptakan resonansi corong klakson udara
    const hornFilter = this.ctx.createBiquadFilter();
    hornFilter.type = 'lowpass';
    hornFilter.frequency.setValueAtTime(2200, t);
    hornFilter.Q.setValueAtTime(1.8, t);

    const hornGain = this.ctx.createGain();
    // Serangan katup udara cepat (pneumatic onset)
    hornGain.gain.setValueAtTime(0.001, t);
    hornGain.gain.linearRampToValueAtTime(0.35, t + 0.05);
    hornGain.gain.setValueAtTime(0.35, t + duration - 0.15);
    hornGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    chimes.forEach((chime) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      // Campuran gelombang gergaji (sawtooth) kaya harmonik khas corong terompet udara
      osc.type = 'sawtooth';
      // Sedikit scoop pitch mikro di awal saat tekanan angin masuk
      osc.frequency.setValueAtTime(chime.freq * 0.985, t);
      osc.frequency.exponentialRampToValueAtTime(chime.freq, t + 0.04);

      oscGain.gain.setValueAtTime(chime.gain, t);

      osc.connect(oscGain);
      oscGain.connect(hornFilter);

      osc.start(t);
      osc.stop(t + duration);
    });

    // Desis pelepasan katup udara pneumatik (Air hiss)
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1600, t);
    noiseFilter.Q.setValueAtTime(3.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.linearRampToValueAtTime(0.04, t + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(hornFilter);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);

    hornFilter.connect(hornGain);
    hornGain.connect(this.masterGain);
  }

  /**
   * Suara Mekanikal Wesel (Clack-Clunk Motor & Pengunci Rel Baja)
   */
  public playSwitchSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // 1. Logam pengunci berat (Low metallic clunk)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(140, t);
    osc1.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain1.gain.setValueAtTime(0.25, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.2);

    // 2. Ketukan lidah wesel kedua (Second snap 0.08s later)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(320, t + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.22);

    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.setValueAtTime(0.2, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.28);

    // 3. Desis hidrolik / gesekan rel (Metallic friction noise)
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(900, t);
    noiseFilter.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  /**
   * Suara Pengubahan Sinyal (Relay Click & Ding Lampu Sinyal)
   */
  public playSignalSound(aspect: 'merah' | 'kuning' | 'hijau') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Relay mechanical click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(800, t);
    clickOsc.frequency.exponentialRampToValueAtTime(200, t + 0.04);
    clickGain.gain.setValueAtTime(0.15, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(t);
    clickOsc.stop(t + 0.06);

    // Tone indicator depending on aspect
    const toneOsc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    toneOsc.type = 'sine';

    let freq = 523.25; // C5 untuk hijau
    if (aspect === 'kuning') freq = 440; // A4 untuk kuning
    if (aspect === 'merah') freq = 349.23; // F4 untuk merah

    toneOsc.frequency.setValueAtTime(freq, t + 0.03);
    toneGain.gain.setValueAtTime(0.001, t);
    toneGain.gain.setValueAtTime(0.12, t + 0.04);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    toneOsc.connect(toneGain);
    toneGain.connect(this.masterGain);
    toneOsc.start(t + 0.03);
    toneOsc.stop(t + 0.4);
  }

  /**
   * Melodi Pengumuman Kedatangan Stasiun Kereta Api Indonesia (Nada Bel Khas)
   */
  public playStationArrivalChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Classic Stasiun bell melody: Sol(392) - Do(523.25) - Mi(659.25) - Sol(783.99)
    const melody = [
      { freq: 392.0, time: 0.0, dur: 0.28 },
      { freq: 523.25, time: 0.25, dur: 0.28 },
      { freq: 659.25, time: 0.5, dur: 0.28 },
      { freq: 783.99, time: 0.75, dur: 0.5 },
    ];

    const t = this.ctx.currentTime;
    melody.forEach((note) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, t + note.time);

      gain.gain.setValueAtTime(0.001, t + note.time);
      gain.gain.linearRampToValueAtTime(0.15, t + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.time + note.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + note.time);
      osc.stop(t + note.time + note.dur + 0.05);
    });
  }

  /**
   * Sirine Bahaya / Konflik Tabrakan / Salah Jalur
   */
  public playEmergencyAlarm() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.15);
    osc.frequency.linearRampToValueAtTime(850, t + 0.3);
    osc.frequency.linearRampToValueAtTime(350, t + 0.45);
    osc.frequency.linearRampToValueAtTime(850, t + 0.6);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.75);
  }

  /**
   * Bunyi Peringatan Interlocking / Tombol Ditolak
   */
  public playBuzzerWarning() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Bunyi Sukses / Naik Level
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const notes = [440, 554.37, 659.25, 880];
    const t = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);

      gain.gain.setValueAtTime(0.001, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.18, t + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.4);
    });
  }

  /**
   * Suara Peluit Kondektur / PPKA Pemberangkatan Kereta Api (Semboyan 40 & 41)
   * Dua tiupan peluit bergetar (pea whistle flutter vibrato):
   * 1. Tiupan pendek (pip)
   * 2. Tiupan panjang mantap (peeeet!)
   */
  public playDepartureWhistle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    const blasts = [
      { startOffset: 0.0, dur: 0.14, baseFreq: 2680 },
      { startOffset: 0.22, dur: 0.42, baseFreq: 2750 },
    ];

    blasts.forEach(({ startOffset, dur, baseFreq }) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = t + startOffset;
      const stopTime = startTime + dur;

      // 1. Nada Utama Peluit Logam
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, startTime);

      // 2. LFO Getaran Bola Peluit (Pea Whistle Trill / Flutter) ~24Hz
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(24, startTime);
      lfoGain.gain.setValueAtTime(75, startTime); // Modulasi frekuensi +/- 75 Hz
      lfo.connect(osc.frequency);

      // Harmonik kedua peluit (oktaf atas tipis)
      const harmOsc = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(baseFreq * 2, startTime);
      lfo.connect(harmOsc.frequency);

      harmGain.gain.setValueAtTime(0.04, startTime);

      // Envelope tiupan
      oscGain.gain.setValueAtTime(0.001, startTime);
      oscGain.gain.linearRampToValueAtTime(0.26, startTime + 0.02);
      oscGain.gain.setValueAtTime(0.26, stopTime - 0.03);
      oscGain.gain.exponentialRampToValueAtTime(0.001, stopTime);

      osc.connect(oscGain);
      harmOsc.connect(harmGain);
      harmGain.connect(oscGain);
      oscGain.connect(this.masterGain);

      lfo.start(startTime);
      lfo.stop(stopTime);
      osc.start(startTime);
      osc.stop(stopTime);
      harmOsc.start(startTime);
      harmOsc.stop(stopTime);

      // Desis hembusan udara peluit
      const noiseBufLen = Math.floor(this.ctx.sampleRate * dur);
      const nBuf = this.ctx.createBuffer(1, noiseBufLen, this.ctx.sampleRate);
      const nData = nBuf.getChannelData(0);
      for (let i = 0; i < noiseBufLen; i++) {
        nData[i] = Math.random() * 2 - 1;
      }
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = nBuf;

      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(baseFreq, startTime);
      nFilter.Q.setValueAtTime(5.0, startTime);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.001, startTime);
      nGain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      nGain.gain.exponentialRampToValueAtTime(0.001, stopTime);

      nSrc.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.masterGain);

      nSrc.start(startTime);
      nSrc.stop(stopTime);
    });
  }

  /**
   * Peringatan Sirene / Nada Pengumuman Prioritas Khusus KLB
   * (Nada 4-Tone Dispatcher Chime + Sirene Peringatan Prioritas Tertinggi)
   */
  public playKLBPriorityAlarm() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // 1. Chime Gong PPKA (Nada Naik Megah Mengumumkan KLB)
    const tones = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
    tones.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = t + idx * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.24, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });

    // 2. Sirene Alarm Prioritas Jalur Kereta Luar Biasa (Warble Tone)
    const sirenStart = t + 0.7;
    const sirenOsc = this.ctx.createOscillator();
    const sirenGain = this.ctx.createGain();

    sirenOsc.type = 'sawtooth';
    // Modulasi frekuensi 600Hz ke 900Hz secara berulang
    for (let cycle = 0; cycle < 3; cycle++) {
      const ct = sirenStart + cycle * 0.35;
      sirenOsc.frequency.setValueAtTime(650, ct);
      sirenOsc.frequency.linearRampToValueAtTime(920, ct + 0.17);
      sirenOsc.frequency.linearRampToValueAtTime(650, ct + 0.35);
    }

    const sirenFilter = this.ctx.createBiquadFilter();
    sirenFilter.type = 'lowpass';
    sirenFilter.frequency.setValueAtTime(1400, sirenStart);

    sirenGain.gain.setValueAtTime(0.001, sirenStart);
    sirenGain.gain.linearRampToValueAtTime(0.16, sirenStart + 0.05);
    sirenGain.gain.setValueAtTime(0.15, sirenStart + 0.9);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, sirenStart + 1.1);

    sirenOsc.connect(sirenFilter);
    sirenFilter.connect(sirenGain);
    sirenGain.connect(this.masterGain);

    sirenOsc.start(sirenStart);
    sirenOsc.stop(sirenStart + 1.15);

    // 3. Klakson Megah Masinis KLB di ujung alarm
    setTimeout(() => {
      this.playTrainHorn();
    }, 1300);
  }

  /**
   * Suara Lokomotif Diesel Elektrik (Dinonaktifkan sesuai permintaan pengguna)
   */
  public playLocomotiveEngineSound(_speed: number) {
    // Suara mesin kereta dihilangkan sesuai permintaan pengguna
    return;
  }

  /**
   * Suara Kereta Listrik / KRL (Dinonaktifkan sesuai permintaan pengguna)
   */
  public playKRLSound(_speed: number) {
    // Suara inverter / traksi KRL dihilangkan sesuai permintaan pengguna
    return;
  }

  /**
   * Suara Pintu KRL (Dinonaktifkan sesuai permintaan pengguna)
   */
  public playKRLDoorChime() {
    // Suara pintu kereta dihilangkan sesuai permintaan pengguna
    return;
  }

  /**
   * Klakson KRL Commuter Line (Electric / Pneumatic Dual-Tone AW-2 JR 205 Series)
   * Akor dual tone cerah: E5 (659.25 Hz) & G#5 (830.61 Hz)
   */
  public playKRLHorn() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = 0.65;

    const frequencies = [659.25, 830.61]; // E5 & G#5

    const hornGain = this.ctx.createGain();
    hornGain.gain.setValueAtTime(0.001, t);
    hornGain.gain.linearRampToValueAtTime(0.28, t + 0.03);
    hornGain.gain.setValueAtTime(0.28, t + duration - 0.08);
    hornGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);

    frequencies.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.18, t);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(t);
      osc.stop(t + duration);
    });

    filter.connect(hornGain);
    hornGain.connect(this.masterGain);
  }

  /**
   * Suara Tabrakan Kereta (Severe Metal Collision Crunch & Crash Explosion)
   */
  public playCrashSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // 1. Benturan Logam Berat Menggelegar (Sub-bass impact crunch)
    const impactOsc = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    impactOsc.type = 'sawtooth';
    impactOsc.frequency.setValueAtTime(260, t);
    impactOsc.frequency.exponentialRampToValueAtTime(28, t + 0.55);

    impactGain.gain.setValueAtTime(0.4, t);
    impactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    impactOsc.connect(impactGain);
    impactGain.connect(this.masterGain);
    impactOsc.start(t);
    impactOsc.stop(t + 0.7);

    // 2. Ledakan Logam & Gesekan Baja Hancur (Metallic crash noise)
    const bufLen = this.ctx.sampleRate * 0.8;
    const crashBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const cData = crashBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = crashBuf;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(3200, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(450, t + 0.7);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSrc.start(t);

    // 3. Rem Mendecit Darurat Melengking (Screeching steel)
    const screechOsc = this.ctx.createOscillator();
    const screechGain = this.ctx.createGain();
    screechOsc.type = 'sine';
    screechOsc.frequency.setValueAtTime(2800, t);
    screechOsc.frequency.linearRampToValueAtTime(1400, t + 0.35);

    screechGain.gain.setValueAtTime(0.2, t);
    screechGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    screechOsc.connect(screechGain);
    screechGain.connect(this.masterGain);
    screechOsc.start(t);
    screechOsc.stop(t + 0.45);
  }

  /**
   * Suara Gemuruh Roda Rel (Dinonaktifkan sesuai permintaan pengguna)
   */
  public triggerTrackRumble(_movingTrainsCount: number) {
    // Suara gemuruh roda rel kereta dihilangkan sesuai permintaan pengguna
    return;
  }

  /**
   * Suara Kenaikan Tingkat Infinity (Level Up Fanfare)
   */
  public playLevelUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + i * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + (i === 3 ? 0.65 : 0.25));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + (i === 3 ? 0.7 : 0.3));
    });
  }
}

export const soundEngine = new SoundEngine();
