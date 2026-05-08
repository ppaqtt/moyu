import { TETRIS_CONSTANTS } from '../../utils/constants';

const { BOARD_WIDTH, BOARD_HEIGHT } = TETRIS_CONSTANTS;

export type Direction = 'left' | 'right' | 'down';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  shape: number[][];
  type: number;
}

const PIECES: number[][][] = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]] // Z
];

const PIECE_COLORS = [
  '#00f5ff', // I - 青色
  '#ffff00', // O - 黄色
  '#a000ff', // T - 紫色
  '#ff8c00', // L - 橙色
  '#0000ff', // J - 蓝色
  '#00ff00', // S - 绿色
  '#ff0000' // Z - 红色
];

export interface GameTetrisState {
  board: number[][];
  currentPiece: Piece | null;
  currentPosition: Position;
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  isPaused: boolean;
  speed: number;
}

export class GameTetrisEngine {
  private board: number[][];
  private currentPiece: Piece | null;
  private currentPosition: Position;
  private score: number;
  private level: number;
  private lines: number;
  private isGameOver: boolean;
  private isPaused: boolean;
  private speed: number;
  private nextPieceType: number;

  constructor() {
    this.board = [];
    this.currentPiece = null;
    this.currentPosition = { x: 0, y: 0 };
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.speed = TETRIS_CONSTANTS.INITIAL_SPEED;
    this.nextPieceType = 0;
    this.init();
  }

  init(): void {
    this.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.speed = TETRIS_CONSTANTS.INITIAL_SPEED;
    this.nextPieceType = Math.floor(Math.random() * PIECES.length);
    this.spawnPiece();
  }

  getState(): GameTetrisState {
    return {
      board: this.board.map(row => [...row]),
      currentPiece: this.currentPiece ? { ...this.currentPiece, shape: this.currentPiece.shape.map(r => [...r]) } : null,
      currentPosition: { ...this.currentPosition },
      score: this.score,
      level: this.level,
      lines: this.lines,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
      speed: this.speed
    };
  }

  getNextPieceType(): number {
    return this.nextPieceType;
  }

  getCurrentPieceColor(): string {
    if (!this.currentPiece) return '#333';
    return PIECE_COLORS[this.currentPiece.type];
  }

  private spawnPiece(): void {
    const type = this.nextPieceType;
    this.nextPieceType = Math.floor(Math.random() * PIECES.length);

    this.currentPiece = {
      shape: PIECES[type].map(row => [...row]),
      type
    };

    this.currentPosition = {
      x: Math.floor((BOARD_WIDTH - this.currentPiece.shape[0].length) / 2),
      y: 0
    };

    if (this.checkCollision(this.currentPosition.x, this.currentPosition.y, this.currentPiece.shape)) {
      this.isGameOver = true;
      this.currentPiece = null;
    }
  }

  private checkCollision(x: number, y: number, shape: number[][]): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }

          if (newY >= 0 && this.board[newY][newX]) {
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
      return direction === 'down';
    }

    if (direction === 'down') {
      this.lockPiece();
      this.clearLines();
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
      return true;
    }

    // Try wall kicks
    const kicks = [-1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.checkCollision(this.currentPosition.x + kick, this.currentPosition.y, rotated)) {
        this.currentPiece.shape = rotated;
        this.currentPosition.x += kick;
        return true;
      }
    }

    return false;
  }

  hardDrop(): boolean {
    if (this.isGameOver || this.isPaused || !this.currentPiece) return false;

    let dropDistance = 0;
    while (!this.checkCollision(this.currentPosition.x, this.currentPosition.y + 1, this.currentPiece.shape)) {
      this.currentPosition.y++;
      dropDistance++;
    }

    this.score += dropDistance * 2;
    this.lockPiece();
    this.clearLines();
    this.spawnPiece();
    return true;
  }

  private lockPiece(): void {
    if (!this.currentPiece) return;

    for (let r = 0; r < this.currentPiece.shape.length; r++) {
      for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
        if (this.currentPiece.shape[r][c]) {
          const boardY = this.currentPosition.y + r;
          const boardX = this.currentPosition.x + c;

          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            this.board[boardY][boardX] = this.currentPiece.type + 1;
          }
        }
      }
    }
  }

  private clearLines(): void {
    let linesCleared = 0;

    for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(BOARD_WIDTH).fill(0));
        linesCleared++;
        r++;
      }
    }

    if (linesCleared > 0) {
      const lineScores = [0, 100, 300, 500, 800];
      this.score += lineScores[linesCleared] * this.level;
      this.lines += linesCleared;

      const newLevel = Math.floor(this.lines / TETRIS_CONSTANTS.LINES_PER_LEVEL) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.speed = TETRIS_CONSTANTS.INITIAL_SPEED * Math.pow(TETRIS_CONSTANTS.SPEED_INCREMENT, this.level - 1);
      }
    }
  }

  tick(): boolean {
    if (this.isGameOver || this.isPaused) return false;
    return this.move('down');
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  reset(): void {
    this.init();
  }

  getPieceColor(type: number): string {
    return PIECE_COLORS[type - 1] || '#333';
  }
}
