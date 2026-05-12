import { GAME_CONFIG } from '../../utils/constants';

export interface Note {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  hitTime: number | null;
  timing: 'perfect' | 'great' | 'good' | 'miss' | null;
}

export interface RhythmMasterState {
  notes: Note[];
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  isGameOver: boolean;
  gameTime: number;
  lastSpawnTime: number;
}

export class RhythmMasterEngine {
  private state: RhythmMasterState;
  private noteIdCounter: number;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly noteSpeed: number;
  private readonly hitLineY: number;
  private readonly laneWidth: number;
  private readonly spawnInterval: number;

  constructor() {
    this.canvasWidth = 500;
    this.canvasHeight = 700;
    this.noteSpeed = 0.3;
    this.hitLineY = 600;
    this.laneWidth = this.canvasWidth / 5;
    this.spawnInterval = 600;
    this.noteIdCounter = 0;
    this.state = this.createInitialState();
  }

  private createInitialState(): RhythmMasterState {
    return {
      notes: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      isGameOver: false,
      gameTime: 0,
      lastSpawnTime: 0,
    };
  }

  getState(): RhythmMasterState {
    return { ...this.state };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  getHitLineY(): number {
    return this.hitLineY;
  }

  getLaneWidth(): number {
    return this.laneWidth;
  }

  reset(): void {
    this.noteIdCounter = 0;
    this.state = this.createInitialState();
  }

  start(): void {
    this.reset();
    this.state.lastSpawnTime = -this.spawnInterval;
  }

  tick(deltaTime: number): void {
    if (this.state.isGameOver) return;

    this.state.gameTime += deltaTime;

    // Spawn notes
    if (this.state.gameTime - this.state.lastSpawnTime > this.spawnInterval) {
      this.spawnNote();
      this.state.lastSpawnTime = this.state.gameTime;
    }

    // Update note positions
    this.state.notes.forEach(note => {
      if (!note.hit) {
        note.y += this.noteSpeed * deltaTime;
      }
    });

    // Check for missed notes
    this.state.notes.forEach(note => {
      if (!note.hit && note.y > this.hitLineY + GAME_CONFIG.goodWindow) {
        this.registerMiss(note);
      }
    });

    // Remove old notes
    this.state.notes = this.state.notes.filter(
      note => note.y < this.canvasHeight + 100 && !note.hit
    );

    // Check game over (after 90 seconds or no more notes)
    if (this.state.gameTime > 90000) {
      this.state.isGameOver = true;
    }
  }

  private spawnNote(): void {
    const lane = Math.floor(Math.random() * 5);
    const note: Note = {
      id: this.noteIdCounter++,
      lane,
      y: -50,
      hit: false,
      hitTime: null,
      timing: null,
    };
    this.state.notes.push(note);
  }

  handleTap(lane: number): { result: 'perfect' | 'great' | 'good' | 'miss'; score: number } {
    const hitNote = this.state.notes.find(
      note => !note.hit && note.lane === lane
    );

    if (!hitNote) {
      return { result: 'miss', score: 0 };
    }

    const distance = Math.abs(hitNote.y - this.hitLineY);
    let timing: 'perfect' | 'great' | 'good' | 'miss';
    let score: number;

    if (distance <= GAME_CONFIG.perfectWindow) {
      timing = 'perfect';
      score = GAME_CONFIG.perfectScore;
      this.state.perfectCount++;
    } else if (distance <= GAME_CONFIG.greatWindow) {
      timing = 'great';
      score = GAME_CONFIG.greatScore;
      this.state.greatCount++;
    } else if (distance <= GAME_CONFIG.goodWindow) {
      timing = 'good';
      score = GAME_CONFIG.goodScore;
      this.state.goodCount++;
    } else {
      timing = 'miss';
      score = 0;
      this.registerMiss(hitNote);
      return { result: 'miss', score: 0 };
    }

    hitNote.hit = true;
    hitNote.hitTime = this.state.gameTime;
    hitNote.timing = timing;

    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const comboMultiplier = Math.min(1 + Math.floor(this.state.combo / 10) * 0.1, 2);
    this.state.score += Math.floor(score * comboMultiplier);

    return { result: timing, score };
  }

  private registerMiss(note: Note): void {
    if (note.timing !== 'miss') {
      note.hit = true;
      note.hitTime = this.state.gameTime;
      note.timing = 'miss';
      this.state.missCount++;
      this.state.combo = 0;
    }
  }

  getAccuracy(): number {
    const total = this.state.perfectCount + this.state.greatCount + this.state.goodCount + this.state.missCount;
    if (total === 0) return 0;
    const weighted = (this.state.perfectCount * 100 + this.state.greatCount * 80 + this.state.goodCount * 50) / total;
    return Math.round(weighted);
  }

  getComboMultiplier(): number {
    return Math.min(1 + Math.floor(this.state.combo / 10) * 0.1, 2);
  }
}
