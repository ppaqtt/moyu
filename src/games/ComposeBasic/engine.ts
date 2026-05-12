export interface Note {
  pitch: number;
  duration: number;
  instrument: number;
  volume: number;
}

export interface Track {
  notes: Note[];
  instrument: number;
  volume: number;
  muted: boolean;
}

export interface Composition {
  id: string;
  name: string;
  bpm: number;
  timeSignature: { top: number; bottom: number };
  tracks: Track[];
  totalBars: number;
  createdAt: number;
}

export interface ComposeBasicState {
  currentComposition: Composition | null;
  isPlaying: boolean;
  currentTime: number;
  currentBar: number;
  selectedTrack: number;
  selectedNoteLength: number;
  selectedPitch: number;
  isRecording: boolean;
  compositions: Composition[];
  instrumentType: number;
  octave: number;
  scale: number[];
  showScaleNotes: boolean;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

export const INSTRUMENTS = [
  { name: '钢琴', color: '#00ffff', frequencies: [261.63, 329.63, 392.00] },
  { name: '吉他', color: '#ff6b9d', frequencies: [196.00, 246.94, 293.66] },
  { name: '弦乐', color: '#a855f7', frequencies: [130.81, 164.81, 196.00] },
  { name: '合成器', color: '#22c55e', frequencies: [220.00, 277.18, 329.63] },
];

export class ComposeBasicEngine {
  private state: ComposeBasicState;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlayingInternal: boolean = false;
  private playTimeout: number | null = null;
  private animationFrame: number = 0;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): ComposeBasicState {
    return {
      currentComposition: null,
      isPlaying: false,
      currentTime: 0,
      currentBar: 0,
      selectedTrack: 0,
      selectedNoteLength: 1,
      selectedPitch: 60,
      isRecording: false,
      compositions: [],
      instrumentType: 0,
      octave: 4,
      scale: SCALES.major,
      showScaleNotes: true,
    };
  }

  public initialize(): void {
    try {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    } catch (e) {
      console.log('Audio context not available');
    }
  }

  public createNewComposition(name: string = '新作品'): Composition {
    const composition: Composition = {
      id: Date.now().toString(),
      name,
      bpm: 120,
      timeSignature: { top: 4, bottom: 4 },
      tracks: [
        { notes: [], instrument: 0, volume: 0.8, muted: false },
        { notes: [], instrument: 1, volume: 0.7, muted: true },
        { notes: [], instrument: 2, volume: 0.6, muted: true },
      ],
      totalBars: 4,
      createdAt: Date.now(),
    };

    this.state.currentComposition = composition;
    this.state.currentTime = 0;
    this.state.currentBar = 0;
    return composition;
  }

  public addNote(pitch: number, duration: number, bar: number, beat: number): void {
    if (!this.state.currentComposition) return;

    const track = this.state.currentComposition.tracks[this.state.selectedTrack];
    const timePosition = bar * this.state.currentComposition.timeSignature.top + beat;

    const note: Note = {
      pitch,
      duration,
      instrument: this.state.instrumentType,
      volume: 0.8,
    };

    track.notes.push({ ...note, pitch, duration });
    track.notes.sort((a, b) => {
      const aPos = track.notes.indexOf(a);
      const bPos = track.notes.indexOf(b);
      return aPos - bPos;
    });

    this.playNotePreview(pitch, duration);
  }

  public removeNote(trackIndex: number, noteIndex: number): void {
    if (!this.state.currentComposition) return;
    this.state.currentComposition.tracks[trackIndex].notes.splice(noteIndex, 1);
  }

  public clearTrack(trackIndex: number): void {
    if (!this.state.currentComposition) return;
    this.state.currentComposition.tracks[trackIndex].notes = [];
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
    this.state.currentTime = 0;
    this.state.currentBar = 0;
    this.playComposition();
  }

  public stop(): void {
    this.isPlayingInternal = false;
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.state.currentBar = 0;

    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  public toggle(): void {
    if (this.state.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  private playComposition(): void {
    if (!this.isPlayingInternal || !this.state.currentComposition) return;

    const comp = this.state.currentComposition;
    const beatDuration = 60000 / comp.bpm;
    const barDuration = beatDuration * comp.timeSignature.top;
    const totalDuration = barDuration * comp.totalBars;

    this.playCurrentBeat();

    const updateTime = () => {
      if (!this.isPlayingInternal) return;

      this.state.currentTime += 16;
      this.state.currentBar = Math.floor(this.state.currentTime / barDuration);

      if (this.state.currentTime >= totalDuration) {
        this.stop();
        return;
      }

      this.animationFrame = requestAnimationFrame(updateTime);
    };

    this.playTimeout = window.setTimeout(() => {
      updateTime();
    }, beatDuration);
  }

  private playCurrentBeat(): void {
    if (!this.state.currentComposition || !this.audioContext) return;

    const comp = this.state.currentComposition;
    const beatDuration = 60000 / comp.bpm;
    const currentBeat = Math.floor(this.state.currentTime / beatDuration) % comp.timeSignature.top;

    comp.tracks.forEach((track, trackIndex) => {
      if (track.muted) return;

      track.notes.forEach((note) => {
        const notePosition = note.pitch % comp.timeSignature.top;
        if (notePosition === currentBeat) {
          const freq = this.midiToFrequency(note.pitch);
          this.playNote(freq, note.duration * beatDuration * 0.8, track.volume);
        }
      });
    });
  }

  private playNote(frequency: number, duration: number, volume: number = 0.5): void {
    if (!this.audioContext || !this.gainNode) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.frequency.value = frequency;
    osc.type = this.getInstrumentWaveform(this.state.instrumentType);

    gain.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration / 1000);
  }

  private playNotePreview(pitch: number, duration: number = 500): void {
    if (!this.audioContext || !this.gainNode) return;

    const frequency = this.midiToFrequency(pitch);
    this.playNote(frequency, duration, 0.6);
  }

  public previewNote(pitch: number): void {
    this.playNotePreview(pitch, 300);
  }

  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private getInstrumentWaveform(instrument: number): OscillatorType {
    const waveforms: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];
    return waveforms[instrument % waveforms.length];
  }

  public setBpm(bpm: number): void {
    if (!this.state.currentComposition) return;
    this.state.currentComposition.bpm = Math.max(40, Math.min(200, bpm));
  }

  public setTotalBars(bars: number): void {
    if (!this.state.currentComposition) return;
    this.state.currentComposition.totalBars = Math.max(1, Math.min(16, bars));
  }

  public selectTrack(index: number): void {
    this.state.selectedTrack = index;
  }

  public toggleTrackMute(index: number): void {
    if (!this.state.currentComposition) return;
    this.state.currentComposition.tracks[index].muted = !this.state.currentComposition.tracks[index].muted;
  }

  public setTrackVolume(index: number, volume: number): void {
    if (!this.state.currentComposition) return;
    this.state.currentComposition.tracks[index].volume = Math.max(0, Math.min(1, volume));
  }

  public setInstrument(instrument: number): void {
    this.state.instrumentType = instrument;
  }

  public setOctave(octave: number): void {
    this.state.octave = Math.max(2, Math.min(7, octave));
  }

  public setScale(scaleName: 'major' | 'minor' | 'pentatonic' | 'blues'): void {
    this.state.scale = SCALES[scaleName];
  }

  public toggleScaleDisplay(): void {
    this.state.showScaleNotes = !this.state.showScaleNotes;
  }

  public getPianoKeys(): { pitch: number; name: string; isBlack: boolean; isInScale: boolean }[] {
    const keys = [];
    const baseOctave = this.state.octave;

    for (let octave = baseOctave - 1; octave <= baseOctave + 1; octave++) {
      for (let note = 0; note < 12; note++) {
        const pitch = (octave + 1) * 12 + note;
        const noteName = NOTE_NAMES[note];
        const isBlack = noteName.includes('#');
        const midiNote = note + (octave + 1) * 12;
        const scaleNote = midiNote % 12;
        const isInScale = this.state.scale.includes(scaleNote);

        keys.push({ pitch, name: `${noteName}${octave}`, isBlack, isInScale });
      }
    }

    return keys;
  }

  public saveComposition(): void {
    if (!this.state.currentComposition) return;

    const existingIndex = this.state.compositions.findIndex(
      c => c.id === this.state.currentComposition!.id
    );

    if (existingIndex >= 0) {
      this.state.compositions[existingIndex] = { ...this.state.currentComposition };
    } else {
      this.state.compositions.push({ ...this.state.currentComposition });
    }
  }

  public loadComposition(id: string): void {
    const composition = this.state.compositions.find(c => c.id === id);
    if (composition) {
      this.state.currentComposition = { ...composition };
    }
  }

  public deleteComposition(id: string): void {
    this.state.compositions = this.state.compositions.filter(c => c.id !== id);
  }

  public getState(): ComposeBasicState {
    return { ...this.state };
  }

  public getInstruments() {
    return INSTRUMENTS;
  }

  public cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const COMPOSE_BASIC_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 700,
  NOTE_LENGTHS: [
    { value: 0.25, label: '16分' },
    { value: 0.5, label: '8分' },
    { value: 1, label: '4分' },
    { value: 2, label: '2分' },
    { value: 4, label: '全分' },
  ],
};
