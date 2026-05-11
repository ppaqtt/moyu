export interface Beat {
  active: boolean;
  volume: number;
}

export interface Track {
  name: string;
  color: string;
  soundType: 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'cymbal';
  beats: Beat[];
  muted: boolean;
  volume: number;
}

export interface BeatEditorState {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number;
  currentBeat: number;
  tracks: Track[];
  totalMeasures: number;
  swingAmount: number;
  masterVolume: number;
}

export const DRUM_SOUNDS = {
  kick: { name: '底鼓', frequency: 60, type: 'sine' as OscillatorType },
  snare: { name: '军鼓', frequency: 200, type: 'triangle' as OscillatorType },
  hihat: { name: '踩镲', frequency: 800, type: 'square' as OscillatorType },
  clap: { name: '拍手', frequency: 1000, type: 'sawtooth' as OscillatorType },
  tom: { name: '通鼓', frequency: 150, type: 'triangle' as OscillatorType },
  cymbal: { name: '镲片', frequency: 1200, type: 'sine' as OscillatorType },
};

export const PRESETS = {
  '4/4基础': [
    [true, false, false, false, true, false, false, false],
    [false, false, true, false, false, false, true, false],
    [true, true, true, true, true, true, true, true],
  ],
  '摇滚': [
    [true, false, false, false, true, false, false, false],
    [false, false, true, false, false, false, true, false],
    [true, false, true, false, true, false, true, false],
  ],
  '放克': [
    [true, false, true, false, false, false, true, false],
    [false, false, true, false, false, false, true, false],
    [true, true, true, true, true, true, true, true],
  ],
  '电子': [
    [true, false, false, false, true, false, false, false],
    [false, false, false, false, true, false, false, false],
    [true, true, true, true, true, true, true, true],
  ],
};

export class BeatEditorEngine {
  private state: BeatEditorState;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private isPlayingInternal: boolean = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): BeatEditorState {
    const totalBeats = 4 * 8;
    const createEmptyBeats = () => Array.from({ length: totalBeats }, () => ({ active: false, volume: 0.8 }));
    
    return {
      isPlaying: false,
      bpm: 120,
      beatsPerMeasure: 4,
      currentBeat: 0,
      tracks: [
        { name: '底鼓', color: '#ff6b6b', soundType: 'kick', beats: createEmptyBeats(), muted: false, volume: 1.0 },
        { name: '军鼓', color: '#ffd93d', soundType: 'snare', beats: createEmptyBeats(), muted: false, volume: 0.9 },
        { name: '踩镲', color: '#6bcb77', soundType: 'hihat', beats: createEmptyBeats(), muted: false, volume: 0.7 },
        { name: '拍手', color: '#4d96ff', soundType: 'clap', beats: createEmptyBeats(), muted: true, volume: 0.8 },
        { name: '通鼓', color: '#9b59b6', soundType: 'tom', beats: createEmptyBeats(), muted: true, volume: 0.85 },
        { name: '镲片', color: '#1abc9c', soundType: 'cymbal', beats: createEmptyBeats(), muted: true, volume: 0.75 },
      ],
      totalMeasures: 4,
      swingAmount: 0,
      masterVolume: 0.8,
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

  public toggleBeat(trackIndex: number, beatIndex: number): void {
    const track = this.state.tracks[trackIndex];
    if (track) {
      track.beats[beatIndex].active = !track.beats[beatIndex].active;
      if (track.beats[beatIndex].active && !track.muted) {
        this.playDrumSound(track.soundType, track.volume);
      }
    }
  }

  public setBeatVolume(trackIndex: number, beatIndex: number, volume: number): void {
    const track = this.state.tracks[trackIndex];
    if (track) {
      track.beats[beatIndex].volume = Math.max(0, Math.min(1, volume));
    }
  }

  public toggleTrackMute(trackIndex: number): void {
    const track = this.state.tracks[trackIndex];
    if (track) {
      track.muted = !track.muted;
    }
  }

  public setTrackVolume(trackIndex: number, volume: number): void {
    const track = this.state.tracks[trackIndex];
    if (track) {
      track.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public setBpm(bpm: number): void {
    this.state.bpm = Math.max(60, Math.min(200, bpm));
    if (this.isPlayingInternal) {
      this.stopMetronome();
      this.startMetronome();
    }
  }

  public setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.state.masterVolume;
    }
  }

  public setSwingAmount(amount: number): void {
    this.state.swingAmount = Math.max(0, Math.min(1, amount));
  }

  public loadPreset(presetName: keyof typeof PRESETS): void {
    const preset = PRESETS[presetName];
    if (!preset) return;

    preset.forEach((pattern, trackIndex) => {
      if (this.state.tracks[trackIndex]) {
        pattern.forEach((active, beatIndex) => {
          if (this.state.tracks[trackIndex].beats[beatIndex]) {
            this.state.tracks[trackIndex].beats[beatIndex].active = active;
          }
        });
      }
    });
  }

  public clearAll(): void {
    this.state.tracks.forEach(track => {
      track.beats.forEach(beat => {
        beat.active = false;
      });
    });
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
    this.state.currentBeat = 0;
    this.startMetronome();
  }

  public stop(): void {
    this.isPlayingInternal = false;
    this.state.isPlaying = false;
    this.state.currentBeat = 0;
    this.stopMetronome();
  }

  public toggle(): void {
    if (this.state.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  private startMetronome(): void {
    const intervalMs = (60 / this.state.bpm) * 1000 / 2;
    this.playCurrentBeats();
    
    this.intervalId = window.setInterval(() => {
      if (!this.isPlayingInternal) return;
      
      this.state.currentBeat = (this.state.currentBeat + 1) % (this.state.totalMeasures * 8);
      this.playCurrentBeats();
    }, intervalMs);
  }

  private stopMetronome(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playCurrentBeats(): void {
    this.state.tracks.forEach(track => {
      if (track.muted) return;
      const beat = track.beats[this.state.currentBeat];
      if (beat?.active) {
        this.playDrumSound(track.soundType, track.volume * beat.volume);
      }
    });
  }

  private playDrumSound(soundType: keyof typeof DRUM_SOUNDS, volume: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const sound = DRUM_SOUNDS[soundType];
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.frequency.value = sound.frequency;
    osc.type = sound.type;

    const attack = 0.001;
    const decay = soundType === 'hihat' || soundType === 'cymbal' ? 0.1 : 0.2;
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.5, this.audioContext.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + attack + decay);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + attack + decay);
  }

  public getState(): BeatEditorState {
    return { ...this.state, tracks: this.state.tracks.map(t => ({ ...t, beats: [...t.beats] })) };
  }

  public getDrumSounds() {
    return DRUM_SOUNDS;
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

export const BEAT_EDITOR_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_COLS: 32,
  GRID_ROWS: 6,
  MIN_BPM: 60,
  MAX_BPM: 200,
  DEFAULT_BPM: 120,
};
