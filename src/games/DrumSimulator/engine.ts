export interface DrumHit {
  id: number;
  drumIndex: number;
  time: number;
  hit: boolean;
  timing?: 'perfect' | 'great' | 'good' | 'miss';
}

export interface DrumPattern {
  time: number;
  drums: number[];
}

export interface DrumSimulatorState {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  upcomingHits: DrumHit[];
  isGameOver: boolean;
  bpm: number;
  songProgress: number;
  multiplier: number;
  totalHits: number;
  currentStreak: number;
}

export class DrumSimulatorEngine {
  private state: DrumSimulatorState;
  private drumCount: number = 4;
  private canvasWidth: number;
  private canvasHeight: number;
  private gameTime: number;
  private patterns: DrumPattern[];
  private currentPatternIndex: number;
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private hitWindow: number = 150;

  constructor() {
    this.canvasWidth = 700;
    this.canvasHeight = 500;
    this.gameTime = 0;
    this.currentPatternIndex = 0;
    this.patterns = this.generateDrumPatterns();
    this.state = this.getInitialState();
  }

  private getInitialState(): DrumSimulatorState {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      upcomingHits: [],
      isGameOver: false,
      bpm: 100,
      songProgress: 0,
      multiplier: 1,
      totalHits: 0,
      currentStreak: 0,
    };
  }

  private generateDrumPatterns(): DrumPattern[] {
    const patterns: DrumPattern[] = [];
    const bpm = 100;
    const beatDuration = 60000 / bpm;
    const drumNames = ['底鼓', '军鼓', '踩镲', '强音镲'];

    for (let measure = 0; measure < 50; measure++) {
      for (let beat = 0; beat < 4; beat++) {
        const time = (measure * 4 + beat) * beatDuration;
        const drums: number[] = [];

        if (beat === 0 || beat === 2) {
          drums.push(0);
        }
        if (beat === 1 || beat === 3) {
          drums.push(1);
        }

        if (Math.random() > 0.6) {
          drums.push(2);
        }

        if (measure % 4 === 3 && beat === 0) {
          drums.push(3);
        }

        if (drums.length > 0) {
          patterns.push({ time, drums });
        }
      }

      if (measure % 2 === 1) {
        const fillTime = (measure * 4 + 4) * beatDuration;
        const fillDrums = [1, 2, 1, 0];
        patterns.push({ time: fillTime, drums: fillDrums });
      }
    }

    return patterns;
  }

  public start(): void {
    this.state = this.getInitialState();
    this.patterns = this.generateDrumPatterns();
    this.currentPatternIndex = 0;
    this.gameTime = 0;
    this.isPlaying = true;

    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio not available');
    }
  }

  public tick(deltaTime: number): void {
    if (!this.isPlaying || this.state.isGameOver) return;

    this.gameTime += deltaTime;
    this.state.songProgress = this.gameTime / 1000;

    while (
      this.currentPatternIndex < this.patterns.length &&
      this.patterns[this.currentPatternIndex].time <= this.gameTime + 2000
    ) {
      const pattern = this.patterns[this.currentPatternIndex];
      pattern.drums.forEach(drumIndex => {
        this.state.upcomingHits.push({
          id: Date.now() + Math.random() + drumIndex,
          drumIndex,
          time: pattern.time,
          hit: false,
        });
      });
      this.currentPatternIndex++;
    }

    this.state.upcomingHits = this.state.upcomingHits.filter(hit => {
      if (hit.hit) {
        return Date.now() - hit.time < 500;
      }
      const timeDiff = this.gameTime - hit.time;
      if (timeDiff > this.hitWindow) {
        this.handleMiss(hit);
        return false;
      }
      return true;
    });

    if (this.state.totalHits >= 50) {
      this.state.isGameOver = true;
      this.isPlaying = false;
    }
  }

  public handleHit(drumIndex: number): { result: string; score: number } {
    const timeWindow = this.hitWindow;
    const targetHits = this.state.upcomingHits.filter(
      hit => !hit.hit && hit.drumIndex === drumIndex
    );

    if (targetHits.length === 0) {
      this.playDrumSound(drumIndex, false);
      return { result: 'empty', score: 0 };
    }

    const closestHit = targetHits.reduce((closest, hit) => {
      const closestDiff = Math.abs(closest.time - this.gameTime);
      const hitDiff = Math.abs(hit.time - this.gameTime);
      return hitDiff < closestDiff ? hit : closest;
    });

    const timeDiff = Math.abs(closestHit.time - this.gameTime);

    let result: 'perfect' | 'great' | 'good' | 'miss';
    let score = 0;

    if (timeDiff <= 30) {
      result = 'perfect';
      score = 300;
      this.state.perfectCount++;
    } else if (timeDiff <= 60) {
      result = 'great';
      score = 200;
      this.state.greatCount++;
    } else if (timeDiff <= timeWindow) {
      result = 'good';
      score = 100;
      this.state.goodCount++;
    } else {
      result = 'miss';
      score = 0;
      this.handleMiss(closestHit);
      return { result, score };
    }

    closestHit.hit = true;
    closestHit.timing = result;

    this.state.combo++;
    this.state.currentStreak++;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
    this.state.multiplier = 1 + Math.floor(this.state.combo / 10) * 0.1;
    this.state.score += Math.floor(score * this.state.multiplier);
    this.state.totalHits++;

    this.playDrumSound(drumIndex, true);

    return { result, score };
  }

  private handleMiss(hit: DrumHit): void {
    hit.hit = true;
    hit.timing = 'miss';
    this.state.combo = 0;
    this.state.multiplier = 1;
    this.state.currentStreak = 0;
    this.state.missCount++;
  }

  private playDrumSound(drumIndex: number, hit: boolean): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const frequencies = [60, 200, 400, 600];
      oscillator.frequency.value = frequencies[drumIndex] || 200;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(hit ? 0.3 : 0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch (e) {
      // Audio not available
    }
  }

  public getState(): DrumSimulatorState {
    return { ...this.state };
  }

  public getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  public getAccuracy(): number {
    const total = this.state.perfectCount + this.state.greatCount +
                  this.state.goodCount + this.state.missCount;
    if (total === 0) return 100;
    const accuracy = ((this.state.perfectCount * 100 +
                      this.state.greatCount * 80 +
                      this.state.goodCount * 50) / total);
    return Math.round(accuracy * 100) / 100;
  }

  public getDrumPositions(): { x: number; y: number; radius: number }[] {
    return [
      { x: this.canvasWidth / 2, y: this.canvasHeight / 2 - 50, radius: 60 },
      { x: this.canvasWidth / 2 - 120, y: this.canvasHeight / 2 + 40, radius: 50 },
      { x: this.canvasWidth / 2 + 120, y: this.canvasHeight / 2 + 40, radius: 50 },
      { x: this.canvasWidth / 2, y: this.canvasHeight / 2 + 120, radius: 45 },
    ];
  }
}

export const DRUM_NAMES = ['底鼓', '军鼓', '踩镲', '强音镲'];
export const DRUM_KEYS = ['S', 'D', 'K', 'L'];
export const DRUM_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'];
