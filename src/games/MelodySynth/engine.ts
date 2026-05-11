export interface Note {
  pitch: number | null;
  duration: number;
}

export interface MelodySynthState {
  isPlaying: boolean;
  bpm: number;
  key: number;
  scaleType: 'major' | 'minor' | 'pentatonic' | 'blues';
  octave: number;
  currentStep: number;
  notes: Note[];
  totalSteps: number;
  masterVolume: number;
  waveType: OscillatorType;
  attack: number;
  release: number;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  pentatonic: [0, 3, 5, 7, 10, 12],
  blues: [0, 3, 5, 6, 7, 10, 12],
};

export const WAVE_TYPES: { type: OscillatorType; name: string }[] = [
  { type: 'square', name: '方形波' },
  { type: 'sawtooth', name: '锯齿波' },
  { type: 'triangle', name: '三角波' },
  { type: 'sine', name: '正弦波' },
];

export const PRESETS = {
  '超级玛丽': [0, 4, 7, 12, 7, 12, null, 0, 4, 7, 12, 7, 12, null, null, null],
  '生日快乐': [0, 0, 2, 0, 5, 4, 0, 0, 2, 0, 7, 5, null, null, null, null],
  '小星星': [0, 0, 7, 7, 9, 9, 7, null, 5, 5, 4, 4, 2, 2, 0, null],
};

export class MelodySynthEngine {
  private state: MelodySynthState;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private isPlayingInternal: boolean = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): MelodySynthState {
    return {
      isPlaying: false,
      bpm: 120,
      key: 0,
      scaleType: 'major',
      octave: 5,
      currentStep: 0,
      notes: Array(16).fill(null).map(() => ({ pitch: null, duration: 0.25 })),
      totalSteps: 16,
      masterVolume: 0.5,
      waveType: 'square',
      attack: 0.01,
      release: 0.1,
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

  public setNote(step: number, pitch: number | null): void {
    if (this.state.notes[step]) {
      this.state.notes[step].pitch = pitch;
    }
  }

  public setKey(key: number): void {
    this.state.key = key % 12;
  }

  public setScaleType(scaleType: 'major' | 'minor' | 'pentatonic' | 'blues'): void {
    this.state.scaleType = scaleType;
  }

  public setOctave(octave: number): void {
    this.state.octave = Math.max(3, Math.min(7, octave));
  }

  public setBpm(bpm: number): void {
    this.state.bpm = Math.max(60, Math.min(240, bpm));
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

  public setWaveType(waveType: OscillatorType): void {
    this.state.waveType = waveType;
  }

  public setAttack(attack: number): void {
    this.state.attack = attack;
  }

  public setRelease(release: number): void {
    this.state.release = release;
  }

  public setTotalSteps(steps: number): void {
    this.state.totalSteps = steps;
    while (this.state.notes.length < steps) {
      this.state.notes.push({ pitch: null, duration: 0.25 });
    }
    if (this.state.notes.length > steps) {
      this.state.notes = this.state.notes.slice(0, steps);
    }
  }

  public clearAll(): void {
    this.state.notes = this.state.notes.map(() => ({ pitch: null, duration: 0.25 }));
  }

  public loadPreset(presetName: keyof typeof PRESETS): void {
    const preset = PRESETS[presetName];
    if (!preset) return;
    
    this.state.notes = preset.map(pitch => ({
      pitch: pitch === null ? null : pitch,
      duration: 0.25,
    }));
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
    this.playCurrentNote();
    const intervalMs = (60 / this.state.bpm) * 1000 * 0.25;
    
    this.intervalId = window.setInterval(() => {
      if (!this.isPlayingInternal) return;
      
      this.state.currentStep = (this.state.currentStep + 1) % this.state.totalSteps;
      this.playCurrentNote();
    }, intervalMs);
  }

  private stopPlayer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playCurrentNote(): void {
    const note = this.state.notes[this.state.currentStep];
    if (note.pitch !== null) {
      const scale = SCALES[this.state.scaleType];
      const scaleNote = scale[note.pitch % scale.length];
      const octaveOffset = Math.floor(note.pitch / scale.length);
      const midiPitch = (this.state.octave + octaveOffset) * 12 + this.state.key + scaleNote;
      this.playNote(midiPitch, 0.8);
    }
  }

  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private playNote(midi: number, velocity: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.frequency.value = this.midiToFrequency(midi);
    osc.type = this.state.waveType;

    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(velocity * 0.4, now + this.state.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + this.state.attack + this.state.release + 0.1);

    osc.start(now);
    osc.stop(now + this.state.attack + this.state.release + 0.1);
  }

  public previewNote(step: number): void {
    const note = this.state.notes[step];
    if (note.pitch !== null) {
      const scale = SCALES[this.state.scaleType];
      const scaleNote = scale[note.pitch % scale.length];
      const octaveOffset = Math.floor(note.pitch / scale.length);
      const midiPitch = (this.state.octave + octaveOffset) * 12 + this.state.key + scaleNote;
      this.playNote(midiPitch, 0.6);
    }
  }

  public getNoteName(pitch: number): string {
    const scale = SCALES[this.state.scaleType];
    const scaleNote = scale[pitch % scale.length];
    const noteIndex = (this.state.key + scaleNote) % 12;
    return NOTE_NAMES[noteIndex];
  }

  public getState(): MelodySynthState {
    return { ...this.state, notes: this.state.notes.map(n => ({ ...n })) };
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

export const MELODY_SYNTH_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 500,
};
