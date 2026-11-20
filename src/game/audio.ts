export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Engine synth
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Tire screech synth
  private screechSource: AudioBufferSourceNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechGain: GainNode | null = null;

  // Nitro whoosh
  private nitroSource: AudioBufferSourceNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private nitroGain: GainNode | null = null;

  // Environmental Rain & Wind synth
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;

  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  // Police siren
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenPhase = 0;

  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private started = false;

  public unlock(): void {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.34;
      master.connect(ctx.destination);
      this.masterGain = master;

      // White/pink-ish noise buffer
      const sampleRate = ctx.sampleRate;
      const noiseBuf = ctx.createBuffer(1, sampleRate * 2, sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = noiseBuf;

      // 1. V10 / Sport Engine
      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 320;
      engineFilter.Q.value = 2.8;

      const engineGain = ctx.createGain();
      engineGain.gain.value = 0.001;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 55;

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 110.5;

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = 36;

      osc1.connect(engineFilter);
      osc2.connect(engineFilter);
      sub.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(master);

      osc1.start();
      osc2.start();
      sub.start();

      this.engineOsc1 = osc1;
      this.engineOsc2 = osc2;
      this.engineSub = sub;
      this.engineFilter = engineFilter;
      this.engineGain = engineGain;

      // 2. Tire Screech
      const screechSrc = ctx.createBufferSource();
      screechSrc.buffer = noiseBuf;
      screechSrc.loop = true;

      const screechFilter = ctx.createBiquadFilter();
      screechFilter.type = 'bandpass';
      screechFilter.frequency.value = 1350;
      screechFilter.Q.value = 6.5;

      const screechGain = ctx.createGain();
      screechGain.gain.value = 0;

      screechSrc.connect(screechFilter);
      screechFilter.connect(screechGain);
      screechGain.connect(master);
      screechSrc.start();

      this.screechSource = screechSrc;
      this.screechFilter = screechFilter;
      this.screechGain = screechGain;

      // 3. Nitro Jet
      const nitroSrc = ctx.createBufferSource();
      nitroSrc.buffer = noiseBuf;
      nitroSrc.loop = true;

      const nitroFilter = ctx.createBiquadFilter();
      nitroFilter.type = 'bandpass';
      nitroFilter.frequency.value = 520;
      nitroFilter.Q.value = 1.4;

      const nitroGain = ctx.createGain();
      nitroGain.gain.value = 0;

      nitroSrc.connect(nitroFilter);
      nitroFilter.connect(nitroGain);
      nitroGain.connect(master);
      nitroSrc.start();

      this.nitroSource = nitroSrc;
      this.nitroFilter = nitroFilter;
      this.nitroGain = nitroGain;

      // 4. Rain Ambient Hiss
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = noiseBuf;
      rainSrc.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1800;
      rainFilter.Q.value = 0.55;

      const rainGain = ctx.createGain();
      rainGain.gain.value = 0;

      rainSrc.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(master);
      rainSrc.start();

      this.rainSource = rainSrc;
      this.rainFilter = rainFilter;
      this.rainGain = rainGain;

      // 5. Wind Whoosh
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = noiseBuf;
      windSrc.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 340;
      windFilter.Q.value = 2.4;

      const windGain = ctx.createGain();
      windGain.gain.value = 0;

      windSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(master);
      windSrc.start();

      this.windSource = windSrc;
      this.windFilter = windFilter;
      this.windGain = windGain;

      // 6. Police Siren
      const sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'sawtooth';
      sirenOsc.frequency.value = 680;

      const sirenFilter = ctx.createBiquadFilter();
      sirenFilter.type = 'bandpass';
      sirenFilter.frequency.value = 1100;
      sirenFilter.Q.value = 1.8;

      const sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;

      sirenOsc.connect(sirenFilter);
      sirenFilter.connect(sirenGain);
      sirenGain.connect(master);
      sirenOsc.start();

      this.sirenOsc = sirenOsc;
      this.sirenGain = sirenGain;

      this.started = true;
    } catch {
      // Audio unavailable
    }
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.34, this.ctx.currentTime, 0.04);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public update(params: {
    active: boolean;
    speedRatio: number;
    rpmRatio: number;
    drifting: boolean;
    boosting: boolean;
    closestCopDist: number;
    wantedLevel: number;
    rainLevel: number;
    windLevel: number;
    dt: number;
  }): void {
    if (!this.started || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Environmental Rain & Wind always play softly even on title screen if unlocked
    const rainTarget = Math.max(0, Math.min(1, params.rainLevel)) * 0.16;
    this.rainGain?.gain.setTargetAtTime(rainTarget, now, 0.2);
    this.rainFilter?.frequency.setTargetAtTime(1250 + params.rainLevel * 1200, now, 0.2);

    const windTarget = Math.max(0, Math.min(1, params.windLevel)) * 0.12;
    this.windGain?.gain.setTargetAtTime(windTarget, now, 0.25);
    this.windFilter?.frequency.setTargetAtTime(240 + params.windLevel * 420 + params.speedRatio * 180, now, 0.2);

    if (!params.active) {
      this.engineGain?.gain.setTargetAtTime(0.025, now, 0.12);
      this.engineOsc1?.frequency.setTargetAtTime(44, now, 0.12);
      this.engineOsc2?.frequency.setTargetAtTime(88, now, 0.12);
      this.screechGain?.gain.setTargetAtTime(0, now, 0.08);
      this.nitroGain?.gain.setTargetAtTime(0, now, 0.08);
      this.sirenGain?.gain.setTargetAtTime(0, now, 0.12);
      return;
    }

    const baseFreq = 46 + params.rpmRatio * 128 + (params.boosting ? 28 : 0);
    this.engineOsc1?.frequency.setTargetAtTime(baseFreq, now, 0.045);
    this.engineOsc2?.frequency.setTargetAtTime(baseFreq * 1.995, now, 0.045);
    this.engineSub?.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.045);
    this.engineFilter?.frequency.setTargetAtTime(
      240 + params.rpmRatio * 1350 + (params.boosting ? 700 : 0),
      now,
      0.06
    );
    this.engineGain?.gain.setTargetAtTime(0.14 + params.rpmRatio * 0.14, now, 0.06);

    const screechTarget =
      params.drifting && params.speedRatio > 0.14 ? 0.16 * Math.min(1, params.speedRatio * 1.5) : 0;
    this.screechGain?.gain.setTargetAtTime(screechTarget, now, 0.05);
    if (this.screechFilter && screechTarget > 0.01) {
      this.screechFilter.frequency.setTargetAtTime(1180 + params.speedRatio * 550, now, 0.06);
    }

    const nitroTarget = params.boosting ? 0.24 : 0;
    this.nitroGain?.gain.setTargetAtTime(nitroTarget, now, 0.05);
    this.nitroFilter?.frequency.setTargetAtTime(params.boosting ? 780 : 320, now, 0.08);

    if (params.wantedLevel > 0 && params.closestCopDist < 155) {
      const proximity = Math.max(0, 1 - params.closestCopDist / 155);
      const yelpRate = params.closestCopDist < 55 ? 5.2 : 1.7;
      this.sirenPhase += params.dt * yelpRate;
      const sweep = 0.5 + 0.5 * Math.sin(this.sirenPhase * Math.PI * 2);
      const freq = 590 + sweep * 640;
      this.sirenOsc?.frequency.setTargetAtTime(freq, now, 0.03);
      this.sirenGain?.gain.setTargetAtTime(proximity * proximity * 0.15, now, 0.08);
    } else {
      this.sirenGain?.gain.setTargetAtTime(0, now, 0.12);
    }
  }

  public playThunder(intensity = 0.85): void {
    if (!this.started || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const vol = Math.max(0.25, Math.min(1, intensity)) * 0.65;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(58, now + 2.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(vol * 0.45, now + 0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 2.7);
  }

  public playImpact(intensity: number): void {
    if (!this.started || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const clamped = Math.min(1, Math.max(0.15, intensity));

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135 + clamped * 60, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

    gain.gain.setValueAtTime(0.45 * clamped, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playChime(type: 'takedown' | 'repair' | 'pickup' | 'jump' | 'escape'): void {
    if (!this.started || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const notes: Record<typeof type, number[]> = {
      takedown: [220, 330, 440],
      repair: [523.25, 659.25, 783.99, 1046.5],
      pickup: [659.25, 987.77],
      jump: [392, 587.33, 783.99],
      escape: [440, 554.37, 659.25, 880],
    };

    const seq = notes[type];
    seq.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type === 'takedown' ? 'sawtooth' : 'triangle';
      const start = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.28);
    });
  }

  public dispose(): void {
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineSub?.stop();
      this.screechSource?.stop();
      this.nitroSource?.stop();
      this.rainSource?.stop();
      this.windSource?.stop();
      this.sirenOsc?.stop();
      if (this.ctx && this.ctx.state !== 'closed') {
        void this.ctx.close();
      }
    } catch {
      // ignore
    }
    this.started = false;
  }
}
