export interface Track {
  id: number;
  name: string;
  category: string;
  mood: string;
  notes: number[];
  duration: number;
  bpm: number;
  color: string;
}

export interface MusicPlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  isLooping: boolean;
  trackList: Track[];
  visualizerData: number[];
  selectedCategory: string | null;
}

export class MusicPlayerEngine {
  private state: MusicPlayerState;
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number = 0;
  private trackTimeout: number | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): MusicPlayerState {
    return {
      isPlaying: false,
      currentTrackIndex: 0,
      currentTime: 0,
      volume: 0.7,
      isMuted: false,
      isShuffled: false,
      isLooping: false,
      trackList: this.generateTracks(),
      visualizerData: new Array(32).fill(0),
      selectedCategory: null,
    };
  }

  private generateTracks(): Track[] {
    return [
      {
        id: 1,
        name: '星空漫步',
        category: '轻音乐',
        mood: '放松',
        notes: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63],
        duration: 30,
        bpm: 70,
        color: '#00ffff',
      },
      {
        id: 2,
        name: '海浪声',
        category: '自然',
        mood: '平静',
        notes: [196.00, 220.00, 246.94, 261.63, 220.00, 196.00],
        duration: 25,
        bpm: 60,
        color: '#00d2ff',
      },
      {
        id: 3,
        name: '森林清晨',
        category: '自然',
        mood: '清新',
        notes: [293.66, 349.23, 440.00, 523.25, 440.00, 349.23, 293.66],
        duration: 28,
        bpm: 75,
        color: '#22c55e',
      },
      {
        id: 4,
        name: '月光曲',
        category: '古典',
        mood: '浪漫',
        notes: [329.63, 392.00, 440.00, 523.25, 659.25, 523.25, 440.00],
        duration: 35,
        bpm: 65,
        color: '#a855f7',
      },
      {
        id: 5,
        name: '雨后彩虹',
        category: '轻音乐',
        mood: '愉悦',
        notes: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 392.00],
        duration: 26,
        bpm: 85,
        color: '#ff6b9d',
      },
      {
        id: 6,
        name: '梦幻夜',
        category: '电子',
        mood: '梦幻',
        notes: [220.00, 261.63, 329.63, 392.00, 329.63, 261.63, 220.00],
        duration: 32,
        bpm: 80,
        color: '#ff00ff',
      },
      {
        id: 7,
        name: '咖啡时光',
        category: '爵士',
        mood: '悠闲',
        notes: [246.94, 293.66, 329.63, 349.23, 293.66, 246.94, 220.00],
        duration: 30,
        bpm: 72,
        color: '#f59e0b',
      },
      {
        id: 8,
        name: '星际旅行',
        category: '电子',
        mood: '科幻',
        notes: [174.61, 196.00, 220.00, 246.94, 293.66, 246.94, 220.00],
        duration: 34,
        bpm: 90,
        color: '#3b82f6',
      },
      {
        id: 9,
        name: '樱花树下',
        category: '和风',
        mood: '优雅',
        notes: [392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00],
        duration: 28,
        bpm: 68,
        color: '#ffb7c5',
      },
      {
        id: 10,
        name: '瀑布冥想',
        category: '冥想',
        mood: '宁静',
        notes: [130.81, 164.81, 196.00, 164.81, 130.81, 98.00],
        duration: 40,
        bpm: 50,
        color: '#06b6d4',
      },
    ];
  }

  public initialize(): void {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (e) {
      console.log('Audio context not available');
    }
  }

  public play(): void {
    if (!this.audioContext) {
      this.initialize();
    }

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.state.isPlaying = true;
    this.playCurrentTrack();
    this.startVisualizer();
  }

  public pause(): void {
    this.state.isPlaying = false;
    this.stopCurrentTrack();
    this.stopVisualizer();
  }

  public toggle(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private playCurrentTrack(): void {
    if (this.trackTimeout) {
      clearTimeout(this.trackTimeout);
    }

    const track = this.state.trackList[this.state.currentTrackIndex];
    if (!track) return;

    const noteInterval = (60 / track.bpm) * 1000 / 2;
    let noteIndex = 0;

    const playNote = () => {
      if (!this.state.isPlaying) return;

      const frequency = track.notes[noteIndex % track.notes.length];
      this.playNote(frequency, noteInterval * 0.8);

      noteIndex++;
      this.state.currentTime = (noteIndex * noteInterval) / 1000;

      if (noteIndex < track.notes.length * 10) {
        this.trackTimeout = window.setTimeout(playNote, noteInterval);
      }
    };

    playNote();
  }

  private playNote(frequency: number, duration: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const osc = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();

    osc.connect(noteGain);
    noteGain.connect(this.gainNode);

    osc.frequency.value = frequency;
    osc.type = 'sine';

    const vol = this.state.isMuted ? 0 : this.state.volume * 0.3;
    noteGain.gain.setValueAtTime(vol, this.audioContext.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration / 1000);
  }

  private stopCurrentTrack(): void {
    if (this.trackTimeout) {
      clearTimeout(this.trackTimeout);
      this.trackTimeout = null;
    }
  }

  private startVisualizer(): void {
    const updateVisualizer = () => {
      if (!this.state.isPlaying || !this.analyser) {
        this.state.visualizerData = new Array(32).fill(0);
        return;
      }

      const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
      this.analyser!.getByteFrequencyData(dataArray);

      this.state.visualizerData = Array.from(dataArray.slice(0, 32)).map(v => v / 255);

      this.animationFrame = requestAnimationFrame(updateVisualizer);
    };

    updateVisualizer();
  }

  private stopVisualizer(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.state.visualizerData = new Array(32).fill(0);
  }

  public next(): void {
    this.stopCurrentTrack();
    this.state.currentTime = 0;
    this.state.currentTrackIndex = (this.state.currentTrackIndex + 1) % this.state.trackList.length;
    if (this.state.isPlaying) {
      this.playCurrentTrack();
    }
  }

  public previous(): void {
    this.stopCurrentTrack();
    this.state.currentTime = 0;
    this.state.currentTrackIndex = (this.state.currentTrackIndex - 1 + this.state.trackList.length) % this.state.trackList.length;
    if (this.state.isPlaying) {
      this.playCurrentTrack();
    }
  }

  public seek(time: number): void {
    this.state.currentTime = Math.max(0, Math.min(time, this.getCurrentTrack()?.duration || 0));
  }

  public setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.value = this.state.isMuted ? 0 : this.state.volume;
    }
  }

  public toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.value = this.state.isMuted ? 0 : this.state.volume;
    }
  }

  public toggleShuffle(): void {
    this.state.isShuffled = !this.state.isShuffled;
  }

  public toggleLoop(): void {
    this.state.isLooping = !this.state.isLooping;
  }

  public selectTrack(index: number): void {
    this.stopCurrentTrack();
    this.state.currentTrackIndex = index;
    this.state.currentTime = 0;
    if (this.state.isPlaying) {
      this.playCurrentTrack();
    }
  }

  public filterByCategory(category: string | null): void {
    this.state.selectedCategory = category;
  }

  public getCurrentTrack(): Track | null {
    return this.state.trackList[this.state.currentTrackIndex] || null;
  }

  public getState(): MusicPlayerState {
    return { ...this.state };
  }

  public getCategories(): string[] {
    return [...new Set(this.state.trackList.map(t => t.category))];
  }

  public getFilteredTracks(): Track[] {
    if (!this.state.selectedCategory) {
      return this.state.trackList;
    }
    return this.state.trackList.filter(t => t.category === this.state.selectedCategory);
  }

  public cleanup(): void {
    this.stopCurrentTrack();
    this.stopVisualizer();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const MUSIC_PLAYER_CONSTANTS = {
  CANVAS_WIDTH: 500,
  CANVAS_HEIGHT: 700,
  VISUALIZER_BARS: 32,
  DEFAULT_VOLUME: 0.7,
};
