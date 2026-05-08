import { FUSION_CONSTANTS } from '../../utils/constants';

const { GRID_SIZE, GAP, CANVAS_WIDTH, CANVAS_HEIGHT } = FUSION_CONSTANTS;

export type Direction = 'left' | 'right' | 'down';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  shape: number[][];
  value: number;
}

const PIECES: number[][][] = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]]
];

export interface GameFusionState {
  grid: number[][];
  currentPiece: Piece | null;
  currentPosition: Position;
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export class GameFusionEngine {
  private grid: number[][];
  private currentPiece: Piece | null;
  private currentPosition: Position;
  private score: number;
  private isGameOver: boolean;
  private isPaused: boolean;
  private dropTimer: number;
  private lastDropTime: number;
  private nextPieceValue: number;

  constructor() {
    this.grid = [];
    this.currentPiece = null;
    this.currentPosition = { x: 0, y: 0 };
    this.score = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.dropTimer = 0;
    this.lastDropTime = 0;
    this.nextPieceValue = 2;
    this.init();
  }

  init(): void {
    this.grid = Array(5).fill(null).map(() => Array(GRID_SIZE).fill(0));
    this.score = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.dropTimer = 0;
    this.lastDropTime = Date.now();
    this.nextPieceValue = Math.random() < 0.9 ? 2 : 4;
    this.spawnPiece();
  }

  getState(): GameFusionState {
    return {
      grid: this.grid.map(row => [...row]),
      currentPiece: this.currentPiece ? {
        shape: this.currentPiece.shape.map(r => [...r]),
        value: this.currentPiece.value
      } : null,
      currentPosition: { ...this.currentPosition },
      score: this.score,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused
    };
  }

  private spawnPiece(): void {
    const pieceType = Math.floor(Math.random() * PIECES.length);

    this.currentPiece = {
      shape: PIECES[pieceType].map(row => [...row]),
      value: this.nextPieceValue
    };

    this.nextPieceValue = Math.random() < 0.9 ? 2 : 4;

    this.currentPosition = {
      x: Math.floor((GRID_SIZE - this.currentPiece.shape[0].length) / 2),
      y: 0
    };

    if (this.checkCollision(this.currentPosition.x, this.currentPosition.y, this.currentPiece.shape)) {
      this.isGameOver = true;
      this.currentPiece = null;
    }

    this.lastDropTime = Date.now();
  }

  private checkCollision(x: number, y: number, shape: number[][]): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;

          if (newX < 0 || newX >= GRID_SIZE || newY >= 5) {
            return true;
          }

          if (newY >= 0 && this.grid[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  move(direction: Direction): boolean {
    if (this.isGameOver || this.isPaused || !this.currentPiece) return false;

    let newX = this.currentPosition.x;
    let newY = this.currentPosition.y;

    switch (direction) {
      case 'left':
        newX -= 1;
        break;
      case 'right':
        newX += 1;
        break;
      case 'down':
        newY += 1;
        break;
    }

    if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
      this.currentPosition = { x: newX, y: newY };
      this.lastDropTime = Date.now();
      return true;
    }

    if (direction === 'down') {
      this.lockPiece();
      this.mergeGrid();
      this.spawnPiece();
    }

    return false;
  }

  rotate(): boolean {
    if (this.isGameOver || this.isPaused || !this.currentPiece) return false;

    const rotated = this.currentPiece.shape[0].map((_, i) =>
      this.currentPiece!.shape.map(row => row[i]).reverse()
    );

    if (!this.checkCollision(this.currentPosition.x, this.currentPosition.y, rotated)) {
      this.currentPiece.shape = rotated;
      this.lastDropTime = Date.now();
      return true;
    }

    return false;
  }

  hardDrop(): void {
    if (this.isGameOver || this.isPaused || !this.currentPiece) return;

    while (!this.checkCollision(this.currentPosition.x, this.currentPosition.y + 1, this.currentPiece.shape)) {
      this.currentPosition.y++;
    }

    this.lockPiece();
    this.mergeGrid();
    this.spawnPiece();
  }

  private lockPiece(): void {
    if (!this.currentPiece) return;

    for (let r = 0; r < this.currentPiece.shape.length; r++) {
      for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
        if (this.currentPiece.shape[r][c]) {
          const gridY = this.currentPosition.y + r;
          const gridX = this.currentPosition.x + c;

          if (gridY >= 0 && gridY < 5 && gridX >= 0 && gridX < GRID_SIZE) {
            this.grid[gridY][gridX] = this.currentPiece.value;
          }
        }
      }
    }
  }

  private mergeGrid(): void {
    let merged = true;
    while (merged) {
      merged = false;

      for (let y = 4; y >= 0; y--) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (this.grid[y][x] === 0) {
            for (let aboveY = y - 1; aboveY >= 0; aboveY--) {
              if (this.grid[aboveY][x] !== 0) {
                this.grid[y][x] = this.grid[aboveY][x];
                this.grid[aboveY][x] = 0;
                merged = true;
                break;
              }
            }
          }
        }
      }

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < GRID_SIZE - 1; x++) {
          if (this.grid[y][x] === this.grid[y][x + 1] && this.grid[y][x] !== 0) {
            this.grid[y][x] *= 2;
            this.score += this.grid[y][x];
            this.grid[y][x + 1] = 0;
            merged = true;
          }
        }
      }

      for (let y = 4; y >= 0; y--) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (this.grid[y][x] === 0) {
            for (let aboveY = y - 1; aboveY >= 0; aboveY--) {
              if (this.grid[aboveY][x] !== 0) {
                this.grid[y][x] = this.grid[aboveY][x];
                this.grid[aboveY][x] = 0;
                merged = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  tick(): boolean {
    if (this.isGameOver || this.isPaused) return false;

    const now = Date.now();
    if (now - this.lastDropTime >= FUSION_CONSTANTS.DROP_INTERVAL) {
      this.lastDropTime = now;
      return this.move('down');
    }

    return false;
  }

  pause(): void {
    this.isPaused = !this.isPaused;
  }

  reset(): void {
    this.init();
  }
}
