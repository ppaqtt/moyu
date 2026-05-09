export interface Tile {
  id: number;
  x: number;
  y: number;
  size: number;
  value: number;
  isRevealed: boolean;
  isMatched: boolean;
  animationState: 'idle' | 'flip' | 'matched' | 'wrong';
  flipStartTime: number;
}

export interface QuickMemoryState {
  tiles: Tile[];
  score: number;
  round: number;
  phase: 'showing' | 'playing' | 'result';
  showTime: number;
  matchCount: number;
  totalPairs: number;
  timeLeft: number;
  lastClickTime: number;
  selectedTiles: number[];
  isGameOver: boolean;
  reactionTimes: number[];
}

export interface QuickMemoryEngine {
  getState(): QuickMemoryState;
  handleClick(id: number): 'match' | 'wrong' | 'none';
  tick(): void;
  reset(): void;
  startNewRound(): void;
  checkGameOver(): boolean;
  getReactionTime(): number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const GRID_SIZE = 4;
const CELL_SIZE = 100;
const GAP = 20;
const SHOW_DURATION = 2000;
const RESULT_DURATION = 1000;
const GAME_DURATION = 60;

export class QuickMemoryEngine implements QuickMemoryEngine {
  private tiles: Tile[] = [];
  private score: number = 0;
  private round: number = 1;
  private phase: 'showing' | 'playing' | 'result' = 'showing';
  private showTime: number = 0;
  private matchCount: number = 0;
  private totalPairs: number = (GRID_SIZE * GRID_SIZE) / 2;
  private timeLeft: number = GAME_DURATION;
  private lastClickTime: number = 0;
  private selectedTiles: number[] = [];
  private isGameOver: boolean = false;
  private reactionTimes: number[] = [];
  private lastUpdate: number = 0;
  private phaseStartTime: number = 0;
  private tilesToMatch: number[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    this.tiles = [];
    this.score = 0;
    this.round = 1;
    this.phase = 'showing';
    this.showTime = SHOW_DURATION;
    this.matchCount = 0;
    this.timeLeft = GAME_DURATION;
    this.lastClickTime = 0;
    this.selectedTiles = [];
    this.isGameOver = false;
    this.reactionTimes = [];
    this.lastUpdate = Date.now();
    this.phaseStartTime = Date.now();
    this.tilesToMatch = [];
    this.generateTiles();
  }

  private generateTiles(): void {
    this.tiles = [];
    const values: number[] = [];
    const numPairs = Math.min(this.round + 2, 8);

    for (let i = 0; i < numPairs; i++) {
      const value = i + 1;
      values.push(value, value);
    }

    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    const padding = (CANVAS_WIDTH - GRID_SIZE * CELL_SIZE - (GRID_SIZE - 1) * GAP) / 2;

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      this.tiles.push({
        id: i,
        x: padding + col * (CELL_SIZE + GAP),
        y: padding + row * (CELL_SIZE + GAP),
        size: CELL_SIZE,
        value: i < values.length ? values[i] : 0,
        isRevealed: false,
        isMatched: false,
        animationState: 'idle',
        flipStartTime: 0
      });
    }

    this.tilesToMatch = this.tiles.filter(t => t.value > 0).map(t => t.id);
  }

  getState(): QuickMemoryState {
    return {
      tiles: this.tiles.map(t => ({ ...t })),
      score: this.score,
      round: this.round,
      phase: this.phase,
      showTime: this.showTime,
      matchCount: this.matchCount,
      totalPairs: this.tiles.filter(t => t.value > 0).length / 2,
      timeLeft: this.timeLeft,
      lastClickTime: this.lastClickTime,
      selectedTiles: [...this.selectedTiles],
      isGameOver: this.isGameOver,
      reactionTimes: [...this.reactionTimes]
    };
  }

  handleClick(id: number): 'match' | 'wrong' | 'none' {
    if (this.phase !== 'playing' || this.isGameOver) return 'none';

    const tile = this.tiles.find(t => t.id === id);
    if (!tile || tile.isRevealed || tile.isMatched) return 'none';

    const now = Date.now();
    const reactionTime = now - this.lastClickTime;
    this.lastClickTime = now;

    tile.isRevealed = true;
    tile.animationState = 'flip';
    tile.flipStartTime = now;

    this.selectedTiles.push(id);

    if (this.selectedTiles.length === 2) {
      const [firstId, secondId] = this.selectedTiles;
      const firstTile = this.tiles.find(t => t.id === firstId)!;
      const secondTile = this.tiles.find(t => t.id === secondId)!;

      if (firstTile.value === secondTile.value) {
        firstTile.isMatched = true;
        secondTile.isMatched = true;
        firstTile.animationState = 'matched';
        secondTile.animationState = 'matched';
        this.matchCount++;
        this.score += 100 + Math.max(0, 200 - reactionTime);
        this.reactionTimes.push(reactionTime);
        this.selectedTiles = [];

        if (this.matchCount >= this.tilesToMatch.length / 2) {
          this.phase = 'result';
          this.phaseStartTime = now;
          this.round++;
        }

        return 'match';
      } else {
        firstTile.animationState = 'wrong';
        secondTile.animationState = 'wrong';

        setTimeout(() => {
          firstTile.isRevealed = false;
          secondTile.isRevealed = false;
          firstTile.animationState = 'idle';
          secondTile.animationState = 'idle';
        }, 500);

        this.selectedTiles = [];
        this.score = Math.max(0, this.score - 10);
        return 'wrong';
      }
    }

    return 'none';
  }

  tick(): void {
    if (this.isGameOver) return;

    const now = Date.now();

    if (now - this.lastUpdate >= 1000) {
      this.timeLeft--;
      this.lastUpdate = now;

      if (this.timeLeft <= 0) {
        this.isGameOver = true;
        return;
      }
    }

    if (this.phase === 'showing') {
      if (now - this.phaseStartTime >= SHOW_DURATION) {
        this.phase = 'playing';
        this.phaseStartTime = now;
        this.lastClickTime = now;
        this.tiles.forEach(t => {
          if (t.value > 0) {
            t.isRevealed = false;
          }
        });
      }
    } else if (this.phase === 'result') {
      if (now - this.phaseStartTime >= RESULT_DURATION) {
        this.phase = 'showing';
        this.phaseStartTime = now;
        this.matchCount = 0;
        this.selectedTiles = [];
        this.generateTiles();
      }
    }
  }

  reset(): void {
    this.init();
  }

  startNewRound(): void {
    this.phase = 'showing';
    this.phaseStartTime = Date.now();
    this.matchCount = 0;
    this.selectedTiles = [];
    this.generateTiles();
  }

  checkGameOver(): boolean {
    return this.isGameOver;
  }

  getReactionTime(): number {
    if (this.reactionTimes.length === 0) return 0;
    return Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length);
  }
}

export const createEngine = (): QuickMemoryEngine => {
  return new QuickMemoryEngine();
};
