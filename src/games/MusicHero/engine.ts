import { GAME_CONFIG } from '../../utils/constants';

export interface Note {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  hitTime: number | null;
  timing: 'perfect' | 'great' | 'good' | 'miss' | null;
  isGlowNote: boolean;
}

export interface MusicHeroState {
  notes: Note[];
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  isGameOver: boolean;
  isPaused: boolean;
  gameTime: number;
  lastSpawnTime: number;
  songProgress: number;
  currentStreak: number;
}

export class MusicHeroEngine {
  private state: MusicHeroState;
  private noteIdCounter: number;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly noteSpeed: number;
  private readonly hitLineY: number;
  private readonly laneWidth: number;
  private readonly numLanes: number;
  private readonly spawnInterval: number;
  private readonly laneColors: string[];

  constructor() {
    this.canvasWidth = 500;
    this.canvasHeight = 700;
    this.noteSpeed = 0.4;
    this.hitLineY = 620;
    this.laneWidth = this.canvasWidth / 4;
    this.numLanes = 4;
    this.spawnInterval = 400;
    this.noteIdCounter = 0;
    this.laneColors = ['#ff0055', '#00ff55', '#ffff00', '#0055ff'];
    this.state = this.createInitialState();
  }

  private createInitialState(): MusicHeroState {
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
      isPaused: false,
      gameTime: 0,
      lastSpawnTime: 0,
      songProgress: 0,
      currentStreak: 0,
    };
  }

  getState(): MusicHeroState {
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

  getLaneColors(): string[] {
    return [...this.laneColors];
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
    if (this.state.isGameOver || this.state.isPaused) return;

    this.state.gameTime += deltaTime;
    this.state.songProgress = Math.min(100, this.state.gameTime / 900);

    // Spawn notes - more complex patterns
    if (this.state.gameTime - this.state.lastSpawnTime > this.spawnInterval) {
      this.spawnNotePattern();
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

    // Game over after song ends
    if (this.state.songProgress >= 100) {
      this.state.isGameOver = true;
    }

    // Too many misses
    if (this.state.missCount >= 15) {
      this.state.isGameOver = true;
    }
  }

  private spawnNotePattern(): void {
    const patterns = [
      () => [Math.floor(Math.random() * this.numLanes)],
      () => [0, 3],
      () => [1, 2],
      () => [0, 1],
      () => [2, 3],
      () => {
        const base = Math.floor(Math.random() * 2);
        return [base, base + 2];
      },
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const lanes = pattern();

    // Difficulty increases over time
    const isGlow = this.state.songProgress > 50 && Math.random() < 0.2;

    lanes.forEach(lane => {
      const note: Note = {
        id: this.noteIdCounter++,
        lane,
        y: -50,
        hit: false,
        hitTime: null,
        timing: null,
        isGlowNote: isGlow,
      };
      this.state.notes.push(note);
    });
  }

  handleTap(lane: number): { result: 'perfect' | 'great' | 'good' | 'miss'; score: number } {
    // Find the closest note in this lane
    const laneNotes = this.state.notes.filter(t => !t.hit && t.lane === lane);
    const hitNote = laneNotes.reduce((closest, note) => {
      if (!closest) return note;
      const distClosest = Math.abs(closest.y - this.hitLineY);
      const distNote = Math.abs(note.y - this.hitLineY);
      return distNote < distClosest ? note : closest;
    }, null as Note | null);

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
    this.state.currentStreak++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const comboMultiplier = Math.min(1 + Math.floor(this.state.combo / 10) * 0.1, 2.5);
    const glowBonus = hitNote.isGlowNote ? 1.5 : 1;
    this.state.score += Math.floor(score * comboMultiplier * glowBonus);

    return { result: timing, score };
  }

  private registerMiss(note: Note): void {
    if (note.timing !== 'miss') {
      note.hit = true;
      note.hitTime = this.state.gameTime;
      note.timing = 'miss';
      this.state.missCount++;
      this.state.combo = 0;
      this.state.currentStreak = 0;
    }
  }

  getAccuracy(): number {
    const total = this.state.perfectCount + this.state.greatCount + this.state.goodCount + this.state.missCount;
    if (total === 0) return 0;
    const weighted = (this.state.perfectCount * 100 + this.state.greatCount * 80 + this.state.goodCount * 50) / total;
    return Math.round(weighted);
  }

  getSongProgress(): number {
    return this.state.songProgress;
  }

  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
  }
}
