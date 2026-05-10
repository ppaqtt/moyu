export interface Track {
  id: number;
  name: string;
  color: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  waveform: number[];
}

export interface Loop {
  id: number;
  name: string;
  bpm: number;
  tracks: Track[];
  duration: number;
}

export interface MixMasterState {
  currentLoop: Loop | null;
  loops: Loop[];
  currentLoopIndex: number;
  isPlaying: boolean;
  currentTime: number;
  masterVolume: number;
  score: number;
}

export class MixMasterEngine {
  private state: MixMasterState;
  private audioContext: AudioContext | null = null;
  private oscillators: Map<number, OscillatorNode[]> = new Map();
  private isPlaying: boolean = false;
  private gameLoopId: number | null = null;

  private trackConfigs = [
    { name: '鼓点', color: '#ff6b6b', baseFreq: 80 },
    { name: '贝斯', color: '#feca57', baseFreq: 110 },
    { name: '旋律', color: '#48dbfb', baseFreq: 440 },
    { name: '合成器', color: '#ff9ff3', baseFreq: 880 },
  ];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): MixMasterState {
    return {
      currentLoop: null,
      loops: this.generateLoops(),
      currentLoopIndex: 0,
      isPlaying: false,
      currentTime: 0,
      masterVolume: 70,
      score: 0,
    };
  }

  private generateLoops(): Loop[] {
    const loops: Loop[] = [];

    const loopNames = ['基础节拍', '舞曲节奏', '电子氛围', '嘻哈节拍'];
    const bpms = [100, 120, 90, 95];

    for (let i = 0; i < 4; i++) {
      const tracks: Track[] = this.trackConfigs.map((config, trackIndex) => ({
        id: trackIndex,
        name: config.name,
        color: config.color,
        volume: 70,
        pan: 0,
        mute: false,
        solo: false,
        waveform: this.generateWaveform(trackIndex, i),
      }));

      loops.push({
        id: i,
        name: loopNames[i],
        bpm: bpms[i],
        tracks,
        duration: 8000,
      });
    }

    return loops;
  }

  private generateWaveform(trackIndex: number, loopIndex: number): number[] {
    const waveform: number[] = [];
    const steps = 32;

    for (let i = 0; i < steps; i++) {
      let value = 0;

      if (trackIndex === 0) {
        value = (i % 4 === 0) ? 1 : (i % 2 === 0 ? 0.5 : 0);
      } else if (trackIndex === 1) {
        value = (i % 8 === 0) ? 0.8 : (i % 4 === 2 ? 0.6 : 0.3);
      } else if (trackIndex === 2) {
        const pattern = [1, 0.5, 0.8, 0, 0.6, 1, 0.3, 0.7];
        value = pattern[(i + loopIndex * 2) % pattern.length] * (Math.sin(i * 0.5) * 0.3 + 0.7);
      } else {
        const pattern = [0.8, 0, 0.6, 0.4, 1, 0.3, 0.7, 0];
        value = pattern[(i + loopIndex) % pattern.length];
      }

      waveform.push(value);
    }

    return waveform;
  }

  public start(): void {
    this.state = this.getInitialState();
    this.state.currentLoop = this.state.loops[0];
    this.isPlaying = false;

    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio not available');
    }
  }

  public play(): void {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.state.isPlaying = true;
    this.state.currentTime = 0;

    this.startPlayback();
  }

  private startPlayback(): void {
    if (!this.isPlaying || !this.state.currentLoop || !this.audioContext) return;

    const loop = this.state.currentLoop;
    const stepDuration = loop.duration / 32;
    let currentStep = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.audioContext) return;

      loop.tracks.forEach((track, trackIndex) => {
        if (track.mute) return;

        const hasSoloTrack = loop.tracks.some(t => t.solo);
        if (hasSoloTrack && !track.solo) return;

        const value = track.waveform[currentStep];
        if (value > 0) {
          this.playSound(trackIndex, value * (track.volume / 100));
        }
      });

      currentStep = (currentStep + 1) % 32;
      this.state.currentTime = (currentStep / 32) * loop.duration;

      this.gameLoopId = window.setTimeout(playStep, stepDuration);
    };

    playStep();
  }

  private playSound(trackIndex: number, volume: number): void {
    if (!this.audioContext) return;

    try {
      const config = this.trackConfigs[trackIndex];
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = trackIndex === 0 ? 'square' : trackIndex === 1 ? 'sawtooth' : 'sine';
      oscillator.frequency.value = config.baseFreq * (1 + Math.random() * 0.1);

      gainNode.gain.setValueAtTime(volume * (this.state.masterVolume / 100) * 0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch (e) {
      // Audio not available
    }
  }

  public stop(): void {
    this.isPlaying = false;
    this.state.isPlaying = false;

    if (this.gameLoopId) {
      clearTimeout(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  public selectLoop(index: number): void {
    if (index >= 0 && index < this.state.loops.length) {
      this.stop();
      this.state.currentLoopIndex = index;
      this.state.currentLoop = this.state.loops[index];
      this.state.currentTime = 0;
    }
  }

  public setTrackVolume(trackIndex: number, volume: number): void {
    if (this.state.currentLoop && this.state.currentLoop.tracks[trackIndex]) {
      this.state.currentLoop.tracks[trackIndex].volume = Math.max(0, Math.min(100, volume));
      this.calculateScore();
    }
  }

  public toggleTrackMute(trackIndex: number): void {
    if (this.state.currentLoop && this.state.currentLoop.tracks[trackIndex]) {
      this.state.currentLoop.tracks[trackIndex].mute = !this.state.currentLoop.tracks[trackIndex].mute;
    }
  }

  public toggleTrackSolo(trackIndex: number): void {
    if (this.state.currentLoop && this.state.currentLoop.tracks[trackIndex]) {
      this.state.currentLoop.tracks[trackIndex].solo = !this.state.currentLoop.tracks[trackIndex].solo;
    }
  }

  public setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(100, volume));
  }

  private calculateScore(): void {
    if (!this.state.currentLoop) return;

    let activeTracks = 0;
    let balanced = true;
    const volumes: number[] = [];

    this.state.currentLoop.tracks.forEach(track => {
      if (!track.mute) {
        activeTracks++;
        volumes.push(track.volume);

        const hasSoloTrack = this.state.currentLoop!.tracks.some(t => t.solo);
        if (hasSoloTrack && !track.solo) {
          activeTracks--;
        }
      }
    });

    if (volumes.length >= 2) {
      const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / volumes.length;
      balanced = variance < 400;
    }

    let score = activeTracks * 100;
    if (balanced && activeTracks >= 2) score += 200;
    if (activeTracks === 4) score += 300;

    this.state.score = Math.min(1000, score);
  }

  public getState(): MixMasterState {
    return { ...this.state };
  }

  public getCurrentStep(): number {
    if (!this.state.currentLoop) return 0;
    return Math.floor((this.state.currentTime / this.state.currentLoop.duration) * 32);
  }
}

export const TRACK_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'];
