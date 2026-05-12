export interface SynthNote {
  id: number;
  keyIndex: number;
  startTime: number;
  duration: number;
  frequency: number;
  volume: number;
}

export interface SynthPreset {
  name: string;
  type: OscillatorType;
  color: string;
}

export interface SynthPlayState {
  activeNotes: SynthNote[];
  recordedNotes: SynthNote[];
  isRecording: boolean;
  isPlaying: boolean;
  currentPreset: number;
  volume: number;
  octave: number;
  recordingStartTime: number;
  totalNotes: number;
}

export class SynthPlayEngine {
  private state: SynthPlayState;
  private audioContext: AudioContext | null = null;
  private activeOscillators: Map<number, { oscillator: OscillatorNode; gainNode: GainNode }> = new Map();
  private isPlaying: boolean = false;
  private playbackIndex: number = 0;
  private playbackTimer: number | null = null;

  private keyCount: number = 14;
  private baseFrequency: number = 261.63;

  public presets: SynthPreset[] = [
    { name: '正弦波', type: 'sine', color: '#00d2ff' },
    { name: '方波', type: 'square', color: '#ff6b9d' },
    { name: '锯齿波', type: 'sawtooth', color: '#a855f7' },
    { name: '三角波', type: 'triangle', color: '#22c55e' },
  ];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): SynthPlayState {
    return {
      activeNotes: [],
      recordedNotes: [],
      isRecording: false,
      isPlaying: false,
      currentPreset: 0,
      volume: 0.5,
      octave: 4,
      recordingStartTime: 0,
      totalNotes: 0,
    };
  }

  public start(): void {
    this.state = this.getInitialState();
    this.playing = false;

    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio not available');
    }
  }

  public pressKey(keyIndex: number): void {
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const frequency = this.getFrequency(keyIndex);
      const preset = this.presets[this.state.currentPreset];

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = preset.type;
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.state.volume, this.audioContext.currentTime + 0.05);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();

      this.activeOscillators.set(keyIndex, { oscillator, gainNode });

      const note: SynthNote = {
        id: Date.now() + Math.random(),
        keyIndex,
        startTime: this.state.isRecording ? Date.now() - this.state.recordingStartTime : 0,
        duration: 0,
        frequency,
        volume: this.state.volume,
      };

      this.state.activeNotes.push(note);
      this.state.totalNotes++;

      if (this.state.isRecording) {
        this.state.recordedNotes.push(note);
      }
    } catch (e) {
      console.log('Error playing note');
    }
  }

  public releaseKey(keyIndex: number): void {
    const active = this.activeOscillators.get(keyIndex);
    if (!active || !this.audioContext) return;

    const { oscillator, gainNode } = active;
    const note = this.state.activeNotes.find(n => n.keyIndex === keyIndex && n.duration === 0);

    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);

    setTimeout(() => {
      oscillator.stop();
      oscillator.disconnect();
      gainNode.disconnect();
    }, 100);

    this.activeOscillators.delete(keyIndex);

    if (note) {
      note.duration = Date.now() - this.state.recordingStartTime - note.startTime;
    }
  }

  private getFrequency(keyIndex: number): number {
    const octaveOffset = (this.state.octave - 4) * 12;
    const noteOffsets = [-9, -7, -5, -4, -2, 0, 2, 3, 5, 7, 9, 10, 12, 14];
    const semitone = noteOffsets[keyIndex] + octaveOffset;
    return this.baseFrequency * Math.pow(2, semitone / 12);
  }

  public toggleRecording(): void {
    this.state.isRecording = !this.state.isRecording;

    if (this.state.isRecording) {
      this.state.recordedNotes = [];
      this.state.recordingStartTime = Date.now();
    }
  }

  public clearRecording(): void {
    this.state.recordedNotes = [];
    this.state.recordingStartTime = 0;
  }

  public playRecording(): void {
    if (this.state.recordedNotes.length === 0) return;

    this.state.isPlaying = true;
    this.playing = true;
    this.playbackIndex = 0;

    this.playNextNote();
  }

  private playNextNote(): void {
    if (!this.playing || this.playbackIndex >= this.state.recordedNotes.length) {
      this.state.isPlaying = false;
      this.playing = false;
      return;
    }

    const note = this.state.recordedNotes[this.playbackIndex];
    this.pressKey(note.keyIndex);

    const nextNote = this.state.recordedNotes[this.playbackIndex + 1];
    const duration = nextNote
      ? Math.max(nextNote.startTime - note.startTime, 200)
      : note.duration > 0 ? note.duration : 500;

    this.playbackTimer = window.setTimeout(() => {
      this.releaseKey(note.keyIndex);
      this.playbackIndex++;
      this.playNextNote();
    }, duration);
  }

  public stopPlayback(): void {
    this.playing = false;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.state.isPlaying = false;

    this.activeOscillators.forEach((_, keyIndex) => {
      this.releaseKey(keyIndex);
    });
  }

  public setPreset(index: number): void {
    if (index >= 0 && index < this.presets.length) {
      this.state.currentPreset = index;
    }
  }

  public setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
  }

  public setOctave(octave: number): void {
    this.state.octave = Math.max(2, Math.min(7, octave));
  }

  public getState(): SynthPlayState {
    return { ...this.state };
  }

  public getKeyCount(): number {
    return this.keyCount;
  }

  public getPresets(): SynthPreset[] {
    return this.presets;
  }

  public getActiveNotes(): SynthNote[] {
    return [...this.state.activeNotes];
  }

  private set playing(value: boolean) {
    this.isPlaying = value;
  }

  public get playing(): boolean {
    return this.isPlaying;
  }
}

export const KEY_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#'];
export const KEY_COLORS = [
  '#ffffff', '#333333', '#ffffff', '#333333', '#ffffff',
  '#ffffff', '#333333', '#ffffff', '#333333', '#ffffff', '#333333', '#ffffff',
  '#ffffff', '#333333',
];
