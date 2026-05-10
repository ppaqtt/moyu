export interface BeatMetronomeState {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number;
  currentBeat: number;
  volume: number;
  isAccentFirstBeat: boolean;
  timeSignature: { top: number; bottom: number };
  pattern: 'straight' | 'swing' | 'half' | 'dotted';
  subdivisions: number;
  soundType: 'click' | 'wood' | 'digital' | 'rim';
  practiceMode: boolean;
  tapTempo: number[];
  showVisualBeat: boolean;
}

export class BeatMetronomeEngine {
  private state: BeatMetronomeState;
  private audioContext: AudioContext | null = null;
  private intervalId: number | null = null;
  private beatStartTime: number = 0;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): BeatMetronomeState {
    return {
      isPlaying: false,
      bpm: 120,
      beatsPerMeasure: 4,
      currentBeat: 0,
      volume: 0.7,
      isAccentFirstBeat: true,
      timeSignature: { top: 4, bottom: 4 },
      pattern: 'straight',
      subdivisions: 1,
      soundType: 'click',
      practiceMode: false,
      tapTempo: [],
      showVisualBeat: true,
    };
  }

  public initialize(): void {
    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio context not available');
    }
  }

  public start(): void {
    if (!this.audioContext) {
      this.initialize();
    }

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.state.isPlaying = true;
    this.state.currentBeat = 0;
    this.beatStartTime = Date.now();
    this.startMetronome();
  }

  public stop(): void {
    this.state.isPlaying = false;
    this.state.currentBeat = 0;
    this.stopMetronome();
  }

  public toggle(): void {
    if (this.state.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  private startMetronome(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    const intervalMs = (60 / this.state.bpm) * 1000 / this.state.subdivisions;

    this.playBeat();

    this.intervalId = window.setInterval(() => {
      this.playBeat();
    }, intervalMs);
  }

  private stopMetronome(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playBeat(): void {
    if (!this.audioContext || !this.state.isPlaying) return;

    const isFirstBeat = this.state.currentBeat % this.state.beatsPerMeasure === 0;
    const isAccented = this.state.isAccentFirstBeat && isFirstBeat;

    this.playClick(isAccented);

    if (this.state.pattern === 'swing' && !isFirstBeat) {
      const swingDelay = (60 / this.state.bpm) * 1000 * 0.33;
      setTimeout(() => {
        if (this.state.isPlaying) {
          this.playClick(false);
        }
      }, swingDelay);
    }

    this.state.currentBeat++;
  }

  private playClick(accented: boolean): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const vol = this.state.volume * (accented ? 1 : 0.7);

    switch (this.state.soundType) {
      case 'click':
        osc.frequency.value = accented ? 1000 : 800;
        osc.type = 'square';
        break;
      case 'wood':
        osc.frequency.value = accented ? 400 : 300;
        osc.type = 'triangle';
        break;
      case 'digital':
        osc.frequency.value = accented ? 1500 : 1200;
        osc.type = 'sine';
        break;
      case 'rim':
        osc.frequency.value = accented ? 600 : 400;
        osc.type = 'sawtooth';
        break;
    }

    gainNode.gain.setValueAtTime(vol * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.05);
  }

  public tapTempo(): void {
    const now = Date.now();
    this.state.tapTempo.push(now);

    if (this.state.tapTempo.length > 4) {
      this.state.tapTempo.shift();
    }

    if (this.state.tapTempo.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.state.tapTempo.length; i++) {
        intervals.push(this.state.tapTempo[i] - this.state.tapTempo[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);

      if (newBpm >= 30 && newBpm <= 300) {
        this.setBpm(newBpm);
      }
    }

    setTimeout(() => {
      if (this.state.tapTempo.length > 0 && Date.now() - this.state.tapTempo[this.state.tapTempo.length - 1] > 2000) {
        this.state.tapTempo = [];
      }
    }, 2000);
  }

  public setBpm(bpm: number): void {
    this.state.bpm = Math.max(30, Math.min(300, bpm));
    if (this.state.isPlaying) {
      this.stopMetronome();
      this.startMetronome();
    }
  }

  public setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
  }

  public setBeatsPerMeasure(beats: number): void {
    this.state.beatsPerMeasure = beats;
    this.state.timeSignature.top = beats;
    if (this.state.isPlaying) {
      this.stopMetronome();
      this.startMetronome();
    }
  }

  public setSubdivisions(sub: number): void {
    this.state.subdivisions = sub;
    if (this.state.isPlaying) {
      this.stopMetronome();
      this.startMetronome();
    }
  }

  public setPattern(pattern: 'straight' | 'swing' | 'half' | 'dotted'): void {
    this.state.pattern = pattern;
  }

  public setSoundType(type: 'click' | 'wood' | 'digital' | 'rim'): void {
    this.state.soundType = type;
  }

  public toggleAccent(): void {
    this.state.isAccentFirstBeat = !this.state.isAccentFirstBeat;
  }

  public togglePracticeMode(): void {
    this.state.practiceMode = !this.state.practiceMode;
    if (this.state.practiceMode) {
      this.setBpm(60);
    }
  }

  public getState(): BeatMetronomeState {
    return { ...this.state };
  }

  public getTimeSignatureDisplay(): string {
    return `${this.state.timeSignature.top}/${this.state.timeSignature.bottom}`;
  }

  public getCurrentBeatInMeasure(): number {
    if (!this.state.isPlaying) return 0;
    return (this.state.currentBeat % this.state.beatsPerMeasure) + 1;
  }

  public getPresetBpm(): number[] {
    return [40, 60, 80, 100, 120, 140, 160, 180, 200, 220];
  }

  public getCommonTimeSignatures(): { top: number; bottom: number; name: string }[] {
    return [
      { top: 4, bottom: 4, name: '4/4' },
      { top: 3, bottom: 4, name: '3/4' },
      { top: 6, bottom: 8, name: '6/8' },
      { top: 2, bottom: 4, name: '2/4' },
      { top: 5, bottom: 4, name: '5/4' },
      { top: 7, bottom: 8, name: '7/8' },
    ];
  }

  public cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const BEAT_METRONOME_CONSTANTS = {
  CANVAS_WIDTH: 500,
  CANVAS_HEIGHT: 600,
  MIN_BPM: 30,
  MAX_BPM: 300,
  DEFAULT_BPM: 120,
};
