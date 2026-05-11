export type Direction = 'left' | 'right' | 'down';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  shape: number[][];
  type: number;
}

export const TETRIS_99_CONSTANTS = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  CELL_SIZE: 28,
  INITIAL_SPEED: 800,
  SPEED_DECREASE: 50,
  MIN_SPEED: 100,
};

const PIECES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
];

const RETRO_COLORS = [
  '#00ffff',
  '#ffff00',
  '#a000f0',
  '#f0a000',
  '#0000f0',
  '#00f000',
  '#f00000',
];

export interface Tetris99State {
  board: number[][];
  currentPiece: Piece | null;
  currentPosition: Position;
  nextPiece: Piece;
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export class Tetris99Engine {
  private board: number[][] = [];
  private currentPiece: Piece | null = null;
  private currentPosition: Position = { x: 0, y: 0 };
  private nextPiece: Piece = this.createPiece();
  private score: number = 0;
  private level: number = 1;
  private lines: number = 0;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    this.init();
  }

  private createPiece(): Piece {
    const type = Math.floor(Math.random() * PIECES.length);
    return {
      shape: PIECES[type].map((row) => [...row]),
      type,
    };
  }

  init(): void {
    this.board = Array(TETRIS_99_CONSTANTS.BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(TETRIS_99_CONSTANTS.BOARD_WIDTH).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.nextPiece = this.createPiece();
    this.spawnPiece();
  }

  getState(): Tetris99State {
    return {
      board: this.board.map((row) => [...row]),
      currentPiece: this.currentPiece
        ? { ...this.currentPiece, shape: this.currentPiece.shape.map((r) => [...r]) }
        : null,
      currentPosition: { ...this.currentPosition },
      nextPiece: { ...this.nextPiece, shape: this.nextPiece.shape.map((r) => [...r]) },
      score: this.score,
      level: this.level,
      lines: this.lines,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
    };
  }

  getPieceColor(type: number): string {
    return type >= 0 && type < RETRO_COLORS.length ? RETRO_COLORS[type] : '#333333';
  }

  private spawnPiece(): void {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.createPiece();
    this.currentPosition = {
      x: Math.floor((TETRIS_99_CONSTANTS.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2),
      y: 0,
    };

    if (this.checkCollision(this.currentPosition.x, this.currentPosition.y, this.currentPiece.shape)) {
      this.isGameOver = true;
      this.currentPiece = null;
    }
  }

  private checkCollision(x: number, y: number, shape: number[][]): boolean {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          if (
            newX < 0 ||
            newX >= TETRIS_99_CONSTANTS.BOARD_WIDTH ||
            newY >= TETRIS_99_CONSTANTS.BOARD_HEIGHT
          ) {
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
      if (direction === 'down') {
        this.score += 1;
      }
      return true;
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
      this.currentPiece!.shape.map((row) => row[i]).reverse()
    );

    if (!this.checkCollision(this.currentPosition.x, this.currentPosition.y, rotated)) {
      this.currentPiece.shape = rotated;
      return true;
    }

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

  hardDrop(): void {
    if (this.isGameOver || this.isPaused || !this.currentPiece) return;

    let dropDistance = 0;
    while (
      !this.checkCollision(
        this.currentPosition.x,
        this.currentPosition.y + 1,
        this.currentPiece.shape
      )
    ) {
      this.currentPosition.y++;
      dropDistance++;
    }

    this.score += dropDistance * 2;
    this.lockPiece();
    this.clearLines();
    this.spawnPiece();
  }

  private lockPiece(): void {
    if (!this.currentPiece) return;

    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const boardY = this.currentPosition.y + row;
          const boardX = this.currentPosition.x + col;

          if (
            boardY >= 0 &&
            boardY < TETRIS_99_CONSTANTS.BOARD_HEIGHT &&
            boardX >= 0 &&
            boardX < TETRIS_99_CONSTANTS.BOARD_WIDTH
          ) {
            this.board[boardY][boardX] = this.currentPiece.type + 1;
          }
        }
      }
    }
  }

  private clearLines(): void {
    let linesCleared = 0;

    for (let row = TETRIS_99_CONSTANTS.BOARD_HEIGHT - 1; row >= 0; row--) {
      if (this.board[row].every((cell) => cell !== 0)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(TETRIS_99_CONSTANTS.BOARD_WIDTH).fill(0));
        linesCleared++;
        row++;
      }
    }

    if (linesCleared > 0) {
      const lineScores = [0, 100, 300, 500, 800];
      this.score += lineScores[linesCleared] * this.level;
      this.lines += linesCleared;

      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
      }
    }
  }

  tick(): boolean {
    if (this.isGameOver || this.isPaused) return false;
    return this.move('down');
  }

  getCurrentSpeed(): number {
    return Math.max(
      TETRIS_99_CONSTANTS.MIN_SPEED,
      TETRIS_99_CONSTANTS.INITIAL_SPEED - (this.level - 1) * TETRIS_99_CONSTANTS.SPEED_DECREASE
    );
  }

  togglePause(): void {
    if (!this.isGameOver) {
      this.isPaused = !this.isPaused;
    }
  }

  reset(): void {
    this.init();
  }
}
