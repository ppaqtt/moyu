export interface Pad {
  id: string;
  name: string;
  color: string;
  key: string;
  frequency: number;
  type: OscillatorType;
  isPlaying: boolean;
}

export interface BeatBoxState {
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
  masterVolume: number;
  pads: Pad[];
  stepCount: number;
  pattern: boolean[][];
}

export const DEFAULT_PADS: Omit<Pad, 'isPlaying'>[] = [
  { id: 'kick', name: '底鼓', color: '#ef4444', key: 'Q', frequency: 60, type: 'sine' },
  { id: 'snare', name: '军鼓', color: '#f59e0b', key: 'W', frequency: 180, type: 'triangle' },
  { id: 'hihat', name: '踩镲', color: '#10b981', key: 'E', frequency: 800, type: 'square' },
  { id: 'openhat', name: '开镲', color: '#06b6d4', key: 'R', frequency: 1200, type: 'sine' },
  { id: 'clap', name: '拍手', color: '#8b5cf6', key: 'A', frequency: 600, type: 'sawtooth' },
  { id: 'tom', name: '通鼓', color: '#ec4899', key: 'S', frequency: 120, type: 'triangle' },
  { id: 'rim', name: '边击', color: '#14b8a6', key: 'D', frequency: 300, type: 'sawtooth' },
  { id: 'cymbal', name: '镲片', color: '#a855f7', key: 'F', frequency: 1500, type: 'sine' },
];

export const PRESETS = {
  '基础节奏': [
    [true, false, false, false, true, false, false, false],
    [false, false, true, false, false, false, true, false],
    [true, true, true, true, true, true, true, true],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
  ],
  '放克节奏': [
    [true, false, true, false, false, false, true, false],
    [false, false, true, false, false, false, true, false],
    [true, false, true, false, true, false, true, false],
    [false, false, false, false, false, false, false, false],
    [true, false, false, false, true, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
  ],
  '电子舞曲': [
    [true, false, false, false, true, false, false, false],
    [false, false, false, false, true, false, false, false],
    [true, true, true, true, true, true, true, true],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
  ],
};

export class BeatBoxEngine {
  private state: BeatBoxState;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private isPlayingInternal: boolean = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): BeatBoxState {
    const stepCount = 8;
    const pattern = DEFAULT_PADS.map(() => new Array(stepCount).fill(false));
    
    return {
      isPlaying: false,
      bpm: 120,
      currentStep: 0,
      masterVolume: 0.6,
      pads: DEFAULT_PADS.map(p => ({ ...p, isPlaying: false })),
      stepCount,
      pattern,
    };
  }

  public initialize(): void {
    try {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.state.masterVolume;
    } catch (e) {
      console.log('Audio context not available');
    }
  }

  public togglePad(padIndex: number, stepIndex: number): void {
    if (this.state.pattern[padIndex]) {
      this.state.pattern[padIndex][stepIndex] = !this.state.pattern[padIndex][stepIndex];
    }
  }

  public playPad(padIndex: number): void {
    const pad = this.state.pads[padIndex];
    if (pad && this.audioContext && this.gainNode) {
      this.playSound(pad.frequency, pad.type, 0.7);
      this.updatePadState(padIndex, true);
      setTimeout(() => this.updatePadState(padIndex, false), 100);
    }
  }

  private updatePadState(padIndex: number, isPlaying: boolean): void {
    this.state.pads[padIndex].isPlaying = isPlaying;
  }

  public setBpm(bpm: number): void {
    this.state.bpm = Math.max(60, Math.min(200, bpm));
    if (this.isPlayingInternal) {
      this.stopPlayer();
      this.startPlayer();
    }
  }

  public setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.state.masterVolume;
    }
  }

  public loadPreset(presetName: keyof typeof PRESETS): void {
    const preset = PRESETS[presetName];
    if (!preset) return;
    
    this.state.pattern = preset.map(pattern => {
      const newPattern = [...pattern];
      while (newPattern.length < this.state.stepCount) {
        newPattern.push(false);
      }
      return newPattern.slice(0, this.state.stepCount);
    });
  }

  public clearAll(): void {
    this.state.pattern = this.state.pattern.map(() => new Array(this.state.stepCount).fill(false));
  }

  public play(): void {
    if (!this.audioContext) {
      this.initialize();
    }

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlayingInternal = true;
    this.state.isPlaying = true;
    this.state.currentStep = 0;
    this.startPlayer();
  }

  public stop(): void {
    this.isPlayingInternal = false;
    this.state.isPlaying = false;
    this.state.currentStep = 0;
    this.stopPlayer();
  }

  public toggle(): void {
    if (this.state.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  private startPlayer(): void {
    this.playCurrentStep();
    const intervalMs = (60 / this.state.bpm) * 1000 / 2;
    
    this.intervalId = window.setInterval(() => {
      if (!this.isPlayingInternal) return;
      
      this.state.currentStep = (this.state.currentStep + 1) % this.state.stepCount;
      this.playCurrentStep();
    }, intervalMs);
  }

  private stopPlayer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playCurrentStep(): void {
    this.state.pattern.forEach((pattern, padIndex) => {
      if (pattern[this.state.currentStep]) {
        const pad = this.state.pads[padIndex];
        if (pad) {
          this.playSound(pad.frequency, pad.type, 0.6);
          this.updatePadState(padIndex, true);
          setTimeout(() => this.updatePadState(padIndex, false), 100);
        }
      }
    });
  }

  private playSound(frequency: number, type: OscillatorType, volume: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.frequency.value = frequency;
    osc.type = type;

    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public getState(): BeatBoxState {
    return { 
      ...this.state, 
      pads: this.state.pads.map(p => ({ ...p })),
      pattern: this.state.pattern.map(p => [...p])
    };
  }

  public getPresets() {
    return Object.keys(PRESETS) as (keyof typeof PRESETS)[];
  }

  public cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const BEATBOX_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
};
