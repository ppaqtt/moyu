export interface ColorTile {
  row: number;
  col: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TargetColor {
  color: string;
  count: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  score: number;
  isCombo: boolean;
  time: number;
}

export interface ColorMatchState {
  tiles: ColorTile[];
  targetColors: TargetColor[];
  score: number;
  combo: number;
  timeLeft: number;
  isGameOver: boolean;
  scorePopups: ScorePopup[];
  matchCount: number;
}

export interface ColorMatchEngineInterface {
  getState(): ColorMatchState;
  handleClick(x: number, y: number): boolean;
  tick(): void;
  reset(): void;
  getScore(): number;
  getTimeLeft(): number;
  isGameOver(): boolean;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 4;
const TILE_SIZE = 80;
const TILE_GAP = 15;
const GRID_OFFSET_X = (CANVAS_WIDTH - (GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * TILE_GAP)) / 2;
const GRID_OFFSET_Y = 150;
const GAME_DURATION = 60;
const BASE_SCORE = 10;
const WRONG_PENALTY = 5;
const COMBO_THRESHOLD = 3;
const COMBO_MULTIPLIER = 1.5;
const MATCH_TIMEOUT = 5000;

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#FD79A8',
  '#A29BFE',
  '#FF9FF3'
];

export class ColorMatchEngine implements ColorMatchEngineInterface {
  private tiles: ColorTile[] = [];
  private targetColors: TargetColor[] = [];
  private score: number = 0;
  private combo: number = 0;
  private timeLeft: number = GAME_DURATION;
  private _isGameOver: boolean = false;
  private scorePopups: ScorePopup[] = [];
  private lastUpdate: number = 0;
  private matchCount: number = 0;
  private selectedTile: ColorTile | null = null;
  private matchStartTime: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.tiles = [];
    this.targetColors = [];
    this.score = 0;
    this.combo = 0;
    this.timeLeft = GAME_DURATION;
    this._isGameOver = false;
    this.scorePopups = [];
    this.lastUpdate = Date.now();
    this.matchCount = 0;
    this.selectedTile = null;
    this.matchStartTime = 0;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.tiles.push({
          row,
          col,
          color,
          x: GRID_OFFSET_X + col * (TILE_SIZE + TILE_GAP),
          y: GRID_OFFSET_Y + row * (TILE_SIZE + TILE_GAP),
          width: TILE_SIZE,
          height: TILE_SIZE
        });
      }
    }

    this.generateNewTarget();
  }

  private generateNewTarget(): void {
    this.targetColors = [];
    const numTargets = 2 + Math.floor(Math.random() * 2);
    const usedColors: string[] = [];

    for (let i = 0; i < numTargets; i++) {
      let color: string;
      do {
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (usedColors.includes(color));

      usedColors.push(color);
      const count = 2 + Math.floor(Math.random() * 2);

      this.targetColors.push({ color, count });
    }

    this.matchStartTime = Date.now();
    this.selectedTile = null;
  }

  private getTileAt(x: number, y: number): ColorTile | null {
    for (const tile of this.tiles) {
      if (
        x >= tile.x &&
        x <= tile.x + tile.width &&
        y >= tile.y &&
        y <= tile.y + tile.height
      ) {
        return tile;
      }
    }
    return null;
  }

  private shuffleTiles(): void {
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempColor = this.tiles[i].color;
      this.tiles[i].color = this.tiles[j].color;
      this.tiles[j].color = tempColor;
    }
  }

  private countColorMatches(target: TargetColor): number {
    let count = 0;
    for (const tile of this.tiles) {
      if (tile.color === target.color) {
        count++;
      }
    }
    return count;
  }

  getState(): ColorMatchState {
    return {
      tiles: this.tiles.map(t => ({ ...t })),
      targetColors: [...this.targetColors],
      score: this.score,
      combo: this.combo,
      timeLeft: this.timeLeft,
      isGameOver: this._isGameOver,
      scorePopups: [...this.scorePopups],
      matchCount: this.matchCount
    };
  }

  getScore(): number {
    return this.score;
  }

  getTimeLeft(): number {
    return this.timeLeft;
  }

  isGameOver(): boolean {
    return this._isGameOver;
  }

  handleClick(x: number, y: number): boolean {
    if (this._isGameOver) return false;

    const tile = this.getTileAt(x, y);
    if (!tile) {
      return false;
    }

    let matchedTarget: TargetColor | null = null;
    for (const target of this.targetColors) {
      if (target.color === tile.color) {
        matchedTarget = target;
        break;
      }
    }

    if (matchedTarget) {
      let points = BASE_SCORE;
      this.combo++;
      this.matchCount++;

      if (this.combo >= COMBO_THRESHOLD) {
        points = Math.floor(points * COMBO_MULTIPLIER);
        this.combo = 0;
      }

      this.score += points;

      const tileIndex = this.tiles.indexOf(tile);
      this.tiles[tileIndex].color = COLORS[Math.floor(Math.random() * COLORS.length)];

      this.scorePopups.push({
        x: tile.x + tile.width / 2,
        y: tile.y,
        score: points,
        isCombo: this.combo >= COMBO_THRESHOLD - 1,
        time: Date.now()
      });

      const remainingTarget = this.countColorMatches(matchedTarget);
      if (remainingTarget < matchedTarget.count) {
        this.generateNewTarget();
        this.shuffleTiles();
      }

      return true;
    } else {
      this.score = Math.max(0, this.score - WRONG_PENALTY);
      this.combo = 0;

      this.scorePopups.push({
        x: tile.x + tile.width / 2,
        y: tile.y,
        score: -WRONG_PENALTY,
        isCombo: false,
        time: Date.now()
      });

      return false;
    }
  }

  tick(): void {
    if (this._isGameOver) return;

    const now = Date.now();

    if (now - this.lastUpdate >= 1000) {
      this.timeLeft--;
      this.lastUpdate = now;

      if (this.timeLeft <= 0) {
        this._isGameOver = true;
        return;
      }
    }

    if (now - this.matchStartTime > MATCH_TIMEOUT) {
      this.generateNewTarget();
      this.shuffleTiles();
    }

    this.scorePopups = this.scorePopups.filter(
      popup => now - popup.time < 1000
    );
  }

  reset(): void {
    this.init();
  }
}

export const createEngine = (): ColorMatchEngine => {
  return new ColorMatchEngine();
};
