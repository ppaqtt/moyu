export interface Beat {
  id: number;
  lane: number;
  y: number;
  speed: number;
  hit: boolean;
  hitTime?: number;
  timing?: 'perfect' | 'great' | 'good' | 'miss';
  type: 'normal' | 'hold' | 'slide';
  holdDuration?: number;
  isHolding?: boolean;
  holdProgress?: number;
}

export interface BeatMasterState {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  notes: Beat[];
  isGameOver: boolean;
  bpm: number;
  songProgress: number;
  multiplier: number;
}

export class BeatMasterEngine {
  private state: BeatMasterState;
  private laneCount: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private hitLineY: number;
  private noteSpeed: number;
  private lastSpawnTime: number;
  private spawnInterval: number;
  private gameTime: number;
  private beatPattern: number[][];
  private currentBeatIndex: number;
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;

  constructor() {
    this.laneCount = 6;
    this.canvasWidth = 500;
    this.canvasHeight = 700;
    this.hitLineY = this.canvasHeight - 120;
    this.noteSpeed = 5;
    this.lastSpawnTime = 0;
    this.spawnInterval = 400;
    this.gameTime = 0;
    this.currentBeatIndex = 0;
    this.beatPattern = this.generateBeatPattern();
    
    this.state = this.getInitialState();
  }

  private getInitialState(): BeatMasterState {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      notes: [],
      isGameOver: false,
      bpm: 120,
      songProgress: 0,
      multiplier: 1,
    };
  }

  private generateBeatPattern(): number[][] {
    const patterns: number[][] = [];
    const bpm = 120;
    const beatDuration = 60000 / bpm;
    
    for (let i = 0; i < 100; i++) {
      const time = i * beatDuration;
      const pattern: number[] = [];
      
      if (i % 4 === 0) {
        pattern.push(0, 5);
      } else if (i % 4 === 2) {
        pattern.push(2, 3);
      } else if (i % 2 === 1) {
        const lane = Math.floor(Math.random() * this.laneCount);
        pattern.push(lane);
      }
      
      if (Math.random() > 0.85 && i > 8) {
        const extraLane = Math.floor(Math.random() * this.laneCount);
        if (!pattern.includes(extraLane)) {
          pattern.push(extraLane);
        }
      }
      
      patterns.push([time, ...pattern]);
    }
    
    return patterns;
  }

  public start(): void {
    this.state = this.getInitialState();
    this.beatPattern = this.generateBeatPattern();
    this.currentBeatIndex = 0;
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
      this.currentBeatIndex < this.beatPattern.length &&
      this.beatPattern[this.currentBeatIndex][0] <= this.gameTime + 2000
    ) {
      const beatData = this.beatPattern[this.currentBeatIndex];
      for (let i = 1; i < beatData.length; i++) {
        this.spawnNote(beatData[i]);
      }
      this.currentBeatIndex++;
    }

    this.state.notes.forEach(note => {
      if (!note.hit) {
        note.y += this.noteSpeed * (deltaTime / 16);
      }
    });

    const missedNotes = this.state.notes.filter(
      note => !note.hit && note.y > this.hitLineY + 100
    );
    
    missedNotes.forEach(note => {
      this.handleMiss(note);
    });

    this.state.notes = this.state.notes.filter(
      note => !note.hit || (note.hitTime && Date.now() - note.hitTime < 500)
    );

    if (this.state.missCount >= 20) {
      this.state.isGameOver = true;
      this.isPlaying = false;
    }
  }

  private spawnNote(lane: number): void {
    const note: Beat = {
      id: Date.now() + Math.random(),
      lane,
      y: -50,
      speed: this.noteSpeed,
      hit: false,
      type: Math.random() > 0.9 ? 'hold' : 'normal',
    };
    this.state.notes.push(note);
  }

  public handleTap(lane: number): { result: string; score: number } {
    const targetNotes = this.state.notes.filter(
      note => !note.hit && note.lane === lane
    );

    if (targetNotes.length === 0) {
      return { result: 'miss', score: 0 };
    }

    const closestNote = targetNotes.reduce((closest, note) => {
      const closestDist = Math.abs(closest.y - this.hitLineY);
      const noteDist = Math.abs(note.y - this.hitLineY);
      return noteDist < closestDist ? note : closest;
    });

    const distance = Math.abs(closestNote.y - this.hitLineY);

    let result: 'perfect' | 'great' | 'good' | 'miss';
    let score = 0;

    if (distance <= 20) {
      result = 'perfect';
      score = 300;
      this.state.perfectCount++;
    } else if (distance <= 45) {
      result = 'great';
      score = 200;
      this.state.greatCount++;
    } else if (distance <= 70) {
      result = 'good';
      score = 100;
      this.state.goodCount++;
    } else {
      result = 'miss';
      score = 0;
      this.handleMiss(closestNote);
      return { result, score };
    }

    closestNote.hit = true;
    closestNote.hitTime = Date.now();
    closestNote.timing = result;

    this.state.combo++;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
    this.state.multiplier = 1 + Math.floor(this.state.combo / 10) * 0.1;
    this.state.score += Math.floor(score * this.state.multiplier);

    this.playHitSound(result);

    return { result, score };
  }

  private handleMiss(note: Beat): void {
    note.hit = true;
    note.hitTime = Date.now();
    note.timing = 'miss';
    this.state.combo = 0;
    this.state.multiplier = 1;
    this.state.missCount++;
  }

  private playHitSound(type: string): void {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const frequencies: Record<string, number> = {
        perfect: 880,
        great: 660,
        good: 440,
        miss: 220,
      };
      
      oscillator.frequency.value = frequencies[type] || 440;
      oscillator.type = type === 'miss' ? 'sawtooth' : 'sine';
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not available
    }
  }

  public getState(): BeatMasterState {
    return { ...this.state };
  }

  public getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  public getHitLineY(): number {
    return this.hitLineY;
  }

  public getLaneWidth(): number {
    return this.canvasWidth / this.laneCount;
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
}
