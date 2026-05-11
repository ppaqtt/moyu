export interface Chord {
  root: number;
  type: 'major' | 'minor' | 'diminished' | 'augmented' | 'major7' | 'minor7' | 'dominant7' | 'minor7flat5';
  duration: number;
  inversion: number;
}

export interface ChordProgressionState {
  isPlaying: boolean;
  bpm: number;
  key: number;
  scaleType: 'major' | 'minor';
  currentChordIndex: number;
  chords: Chord[];
  masterVolume: number;
  arpeggiate: boolean;
  arpeggioSpeed: number;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALE_DEGREES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export const CHORD_TYPES = {
  major: { name: '大三', intervals: [0, 4, 7] },
  minor: { name: '小三', intervals: [0, 3, 7] },
  diminished: { name: '减三', intervals: [0, 3, 6] },
  augmented: { name: '增三', intervals: [0, 4, 8] },
  major7: { name: '大七', intervals: [0, 4, 7, 11] },
  minor7: { name: '小七', intervals: [0, 3, 7, 10] },
  dominant7: { name: '属七', intervals: [0, 4, 7, 10] },
  minor7flat5: { name: '半减七', intervals: [0, 3, 6, 10] },
};

export const PROGRESSION_PRESETS = {
  '经典流行': [
    { root: 0, type: 'major' as const },
    { root: 5, type: 'major' as const },
    { root: 9, type: 'minor' as const },
    { root: 7, type: 'major' as const },
  ],
  '50年代': [
    { root: 0, type: 'major' as const },
    { root: 7, type: 'major' as const },
    { root: 9, type: 'minor' as const },
    { root: 5, type: 'major' as const },
  ],
  '爵士经典': [
    { root: 0, type: 'major7' as const },
    { root: 5, type: 'dominant7' as const },
    { root: 10, type: 'major7' as const },
    { root: 3, type: 'minor7' as const },
  ],
  '伤感民谣': [
    { root: 0, type: 'minor' as const },
    { root: 5, type: 'major' as const },
    { root: 8, type: 'major' as const },
    { root: 7, type: 'major' as const },
  ],
  '现代流行': [
    { root: 0, type: 'major' as const },
    { root: 9, type: 'minor' as const },
    { root: 5, type: 'major' as const },
    { root: 7, type: 'major' as const },
  ],
};

export class ChordProgressionEngine {
  private state: ChordProgressionState;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private isPlayingInternal: boolean = false;
  private arpeggioIndex: number = 0;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): ChordProgressionState {
    return {
      isPlaying: false,
      bpm: 100,
      key: 0,
      scaleType: 'major',
      currentChordIndex: 0,
      chords: [
        { root: 0, type: 'major', duration: 1, inversion: 0 },
        { root: 5, type: 'major', duration: 1, inversion: 0 },
        { root: 9, type: 'minor', duration: 1, inversion: 0 },
        { root: 7, type: 'major', duration: 1, inversion: 0 },
      ],
      masterVolume: 0.6,
      arpeggiate: false,
      arpeggioSpeed: 0.25,
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

  public setChord(index: number, chord: Partial<Chord>): void {
    if (this.state.chords[index]) {
      this.state.chords[index] = { ...this.state.chords[index], ...chord };
    }
  }

  public addChord(): void {
    this.state.chords.push({
      root: 0,
      type: 'major',
      duration: 1,
      inversion: 0,
    });
  }

  public removeChord(index: number): void {
    if (this.state.chords.length > 1) {
      this.state.chords.splice(index, 1);
    }
  }

  public setKey(key: number): void {
    this.state.key = key % 12;
  }

  public setScaleType(scaleType: 'major' | 'minor'): void {
    this.state.scaleType = scaleType;
  }

  public setBpm(bpm: number): void {
    this.state.bpm = Math.max(40, Math.min(200, bpm));
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

  public setArpeggiate(arpeggiate: boolean): void {
    this.state.arpeggiate = arpeggiate;
  }

  public setArpeggioSpeed(speed: number): void {
    this.state.arpeggioSpeed = speed;
  }

  public loadProgression(presetName: keyof typeof PROGRESSION_PRESETS): void {
    const preset = PROGRESSION_PRESETS[presetName];
    if (!preset) return;
    
    this.state.chords = preset.map(chord => ({
      ...chord,
      duration: 1,
      inversion: 0,
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
    this.state.currentChordIndex = 0;
    this.arpeggioIndex = 0;
    this.startPlayer();
  }

  public stop(): void {
    this.isPlayingInternal = false;
    this.state.isPlaying = false;
    this.state.currentChordIndex = 0;
    this.arpeggioIndex = 0;
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
    if (this.state.arpeggiate) {
      this.startArpeggioPlayer();
    } else {
      this.startBlockPlayer();
    }
  }

  private startBlockPlayer(): void {
    this.playCurrentChord();
    const intervalMs = (60 / this.state.bpm) * 1000 * this.state.chords[this.state.currentChordIndex].duration;
    
    this.intervalId = window.setInterval(() => {
      if (!this.isPlayingInternal) return;
      
      this.state.currentChordIndex = (this.state.currentChordIndex + 1) % this.state.chords.length;
      this.playCurrentChord();
    }, intervalMs);
  }

  private startArpeggioPlayer(): void {
    this.playCurrentArpeggioNote();
    const intervalMs = (60 / this.state.bpm) * 1000 * this.state.arpeggioSpeed;
    
    this.intervalId = window.setInterval(() => {
      if (!this.isPlayingInternal) return;
      
      this.arpeggioIndex++;
      const chord = this.state.chords[this.state.currentChordIndex];
      const chordNotes = this.getChordNotes(chord);
      
      if (this.arpeggioIndex >= chordNotes.length) {
        this.arpeggioIndex = 0;
        this.state.currentChordIndex = (this.state.currentChordIndex + 1) % this.state.chords.length;
      }
      
      this.playCurrentArpeggioNote();
    }, intervalMs);
  }

  private stopPlayer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playCurrentChord(): void {
    const chord = this.state.chords[this.state.currentChordIndex];
    const notes = this.getChordNotes(chord);
    notes.forEach((note, i) => {
      this.playNote(note + 60, 0.8 - i * 0.1);
    });
  }

  private playCurrentArpeggioNote(): void {
    const chord = this.state.chords[this.state.currentChordIndex];
    const notes = this.getChordNotes(chord);
    const note = notes[this.arpeggioIndex % notes.length];
    this.playNote(note + 60, 0.7);
  }

  private getChordNotes(chord: Chord): number[] {
    const chordType = CHORD_TYPES[chord.type];
    const root = (this.state.key + chord.root) % 12;
    return chordType.intervals.map(interval => (root + interval) % 12);
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
    osc.type = 'triangle';

    const attack = 0.01;
    const decay = 0.3;
    const sustain = 0.4;
    const release = 0.5;

    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.3, this.audioContext.currentTime + attack);
    gain.gain.linearRampToValueAtTime(velocity * 0.15, this.audioContext.currentTime + attack + decay);
    gain.gain.setValueAtTime(velocity * 0.15, this.audioContext.currentTime + attack + decay + sustain);
    gain.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + attack + decay + sustain + release);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + attack + decay + sustain + release);
  }

  public previewChord(chord: Chord): void {
    const notes = this.getChordNotes(chord);
    notes.forEach((note, i) => {
      this.playNote(note + 60, 0.7 - i * 0.1);
    });
  }

  public getChordName(chord: Chord): string {
    const rootNote = NOTE_NAMES[(this.state.key + chord.root) % 12];
    const typeInfo = CHORD_TYPES[chord.type];
    let suffix = '';
    
    if (chord.type.includes('7')) {
      suffix = chord.type === 'major7' ? 'Maj7' :
               chord.type === 'minor7' ? 'm7' :
               chord.type === 'dominant7' ? '7' :
               chord.type === 'minor7flat5' ? 'm7♭5' : '';
    } else {
      suffix = chord.type === 'major' ? '' :
               chord.type === 'minor' ? 'm' :
               chord.type === 'diminished' ? 'dim' :
               chord.type === 'augmented' ? 'aug' : '';
    }
    
    return `${rootNote}${suffix}`;
  }

  public getState(): ChordProgressionState {
    return { ...this.state, chords: this.state.chords.map(c => ({ ...c })) };
  }

  public getPresets() {
    return Object.keys(PROGRESSION_PRESETS) as (keyof typeof PROGRESSION_PRESETS)[];
  }

  public cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const CHORD_PROGRESSION_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 500,
};
