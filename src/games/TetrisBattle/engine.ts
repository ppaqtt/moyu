const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

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
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]]
];

const PIECE_COLORS = [
  '#00f5ff',
  '#ffff00',
  '#a000ff',
  '#ff8c00',
  '#0000ff',
  '#00ff00',
  '#ff0000'
];

export interface PlayerState {
  board: number[][];
  currentPiece: Piece | null;
  currentPosition: Position;
  score: number;
  lines: number;
  isGameOver: boolean;
  pendingDirtyLines: number;
}

export interface BattleState {
  p1: PlayerState;
  p2: PlayerState;
  winner: 1 | 2 | null;
}

const LINE_SCORES = [0, 100, 300, 500, 800];
const DIRTY_LINE_BONUS = [0, 1, 2, 3, 4];

export class TetrisBattleEngine {
  private p1Board: number[][];
  private p1CurrentPiece: Piece | null;
  private p1CurrentPosition: Position;
  private p1Score: number;
  private p1Lines: number;
  private p1IsGameOver: boolean;
  private p1NextPieceType: number;
  private p1PendingDirtyLines: number;

  private p2Board: number[][];
  private p2CurrentPiece: Piece | null;
  private p2CurrentPosition: Position;
  private p2Score: number;
  private p2Lines: number;
  private p2IsGameOver: boolean;
  private p2NextPieceType: number;
  private p2PendingDirtyLines: number;

  private p1Speed: number;
  private p2Speed: number;

  constructor() {
    this.p1Board = [];
    this.p1CurrentPiece = null;
    this.p1CurrentPosition = { x: 0, y: 0 };
    this.p1Score = 0;
    this.p1Lines = 0;
    this.p1IsGameOver = false;
    this.p1NextPieceType = Math.floor(Math.random() * PIECES.length);
    this.p1PendingDirtyLines = 0;

    this.p2Board = [];
    this.p2CurrentPiece = null;
    this.p2CurrentPosition = { x: 0, y: 0 };
    this.p2Score = 0;
    this.p2Lines = 0;
    this.p2IsGameOver = false;
    this.p2NextPieceType = Math.floor(Math.random() * PIECES.length);
    this.p2PendingDirtyLines = 0;

    this.p1Speed = 1000;
    this.p2Speed = 1000;

    this.init();
  }

  init(): void {
    this.p1Board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    this.p1Score = 0;
    this.p1Lines = 0;
    this.p1IsGameOver = false;
    this.p1NextPieceType = Math.floor(Math.random() * PIECES.length);
    this.p1PendingDirtyLines = 0;
    this.spawnPiece(1);

    this.p2Board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    this.p2Score = 0;
    this.p2Lines = 0;
    this.p2IsGameOver = false;
    this.p2NextPieceType = Math.floor(Math.random() * PIECES.length);
    this.p2PendingDirtyLines = 0;
    this.spawnPiece(2);
  }

  getState(): BattleState {
    return {
      p1: {
        board: this.p1Board.map(row => [...row]),
        currentPiece: this.p1CurrentPiece ? { ...this.p1CurrentPiece, shape: this.p1CurrentPiece.shape.map(r => [...r]) } : null,
        currentPosition: { ...this.p1CurrentPosition },
        score: this.p1Score,
        lines: this.p1Lines,
        isGameOver: this.p1IsGameOver,
        pendingDirtyLines: this.p1PendingDirtyLines
      },
      p2: {
        board: this.p2Board.map(row => [...row]),
        currentPiece: this.p2CurrentPiece ? { ...this.p2CurrentPiece, shape: this.p2CurrentPiece.shape.map(r => [...r]) } : null,
        currentPosition: { ...this.p2CurrentPosition },
        score: this.p2Score,
        lines: this.p2Lines,
        isGameOver: this.p2IsGameOver,
        pendingDirtyLines: this.p2PendingDirtyLines
      },
      winner: this.p1IsGameOver ? 2 : this.p2IsGameOver ? 1 : null
    };
  }

  getP1Speed(): number {
    return this.p1Speed;
  }

  getP2Speed(): number {
    return this.p2Speed;
  }

  private spawnPiece(player: 1 | 2): void {
    let nextType: number;
    let currentPiece: Piece;
    let position: Position;

    if (player === 1) {
      nextType = this.p1NextPieceType;
      this.p1NextPieceType = Math.floor(Math.random() * PIECES.length);

      currentPiece = {
        shape: PIECES[nextType].map(row => [...row]),
        type: nextType
      };

      position = {
        x: Math.floor((BOARD_WIDTH - currentPiece.shape[0].length) / 2),
        y: 0
      };

      if (this.checkCollision(player, position.x, position.y, currentPiece.shape)) {
        this.p1IsGameOver = true;
        this.p1CurrentPiece = null;
      } else {
        this.p1CurrentPiece = currentPiece;
        this.p1CurrentPosition = position;
      }
    } else {
      nextType = this.p2NextPieceType;
      this.p2NextPieceType = Math.floor(Math.random() * PIECES.length);

      currentPiece = {
        shape: PIECES[nextType].map(row => [...row]),
        type: nextType
      };

      position = {
        x: Math.floor((BOARD_WIDTH - currentPiece.shape[0].length) / 2),
        y: 0
      };

      if (this.checkCollision(player, position.x, position.y, currentPiece.shape)) {
        this.p2IsGameOver = true;
        this.p2CurrentPiece = null;
      } else {
        this.p2CurrentPiece = currentPiece;
        this.p2CurrentPosition = position;
      }
    }
  }

  private checkCollision(player: 1 | 2, x: number, y: number, shape: number[][]): boolean {
    const board = player === 1 ? this.p1Board : this.p2Board;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }

          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  move(player: 1 | 2, direction: Direction): boolean {
    const isGameOver = player === 1 ? this.p1IsGameOver : this.p2IsGameOver;
    if (isGameOver) return false;

    const currentPiece = player === 1 ? this.p1CurrentPiece : this.p2CurrentPiece;
    if (!currentPiece) return false;

    let newX: number;
    let newY: number;

    if (player === 1) {
      newX = this.p1CurrentPosition.x;
      newY = this.p1CurrentPosition.y;
    } else {
      newX = this.p2CurrentPosition.x;
      newY = this.p2CurrentPosition.y;
    }

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

    if (!this.checkCollision(player, newX, newY, currentPiece.shape)) {
      if (player === 1) {
        this.p1CurrentPosition = { x: newX, y: newY };
      } else {
        this.p2CurrentPosition = { x: newX, y: newY };
      }
      return direction === 'down';
    }

    if (direction === 'down') {
      this.lockPiece(player);
      this.clearLines(player);
      this.spawnPiece(player);
    }

    return false;
  }

  rotate(player: 1 | 2): boolean {
    const isGameOver = player === 1 ? this.p1IsGameOver : this.p2IsGameOver;
    if (isGameOver) return false;

    const currentPiece = player === 1 ? this.p1CurrentPiece : this.p2CurrentPiece;
    if (!currentPiece) return false;

    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );

    const position = player === 1 ? this.p1CurrentPosition : this.p2CurrentPosition;

    if (!this.checkCollision(player, position.x, position.y, rotated)) {
      if (player === 1) {
        this.p1CurrentPiece!.shape = rotated;
      } else {
        this.p2CurrentPiece!.shape = rotated;
      }
      return true;
    }

    const kicks = [-1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.checkCollision(player, position.x + kick, position.y, rotated)) {
        if (player === 1) {
          this.p1CurrentPiece!.shape = rotated;
          this.p1CurrentPosition.x += kick;
        } else {
          this.p2CurrentPiece!.shape = rotated;
          this.p2CurrentPosition.x += kick;
        }
        return true;
      }
    }

    return false;
  }

  private lockPiece(player: 1 | 2): void {
    const currentPiece = player === 1 ? this.p1CurrentPiece : this.p2CurrentPiece;
    const position = player === 1 ? this.p1CurrentPosition : this.p2CurrentPosition;
    const board = player === 1 ? this.p1Board : this.p2Board;

    if (!currentPiece) return;

    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          const boardY = position.y + r;
          const boardX = position.x + c;

          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            board[boardY][boardX] = currentPiece.type + 1;
          }
        }
      }
    }
  }

  private clearLines(player: 1 | 2): void {
    const board = player === 1 ? this.p1Board : this.p2Board;
    let linesCleared = 0;

    for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== 0)) {
        board.splice(r, 1);
        board.unshift(Array(BOARD_WIDTH).fill(0));
        linesCleared++;
        r++;
      }
    }

    if (linesCleared > 0) {
      if (player === 1) {
        this.p1Score += LINE_SCORES[linesCleared];
        this.p1Lines += linesCleared;
        this.p2PendingDirtyLines += DIRTY_LINE_BONUS[linesCleared];
      } else {
        this.p2Score += LINE_SCORES[linesCleared];
        this.p2Lines += linesCleared;
        this.p1PendingDirtyLines += DIRTY_LINE_BONUS[linesCleared];
      }
    }
  }

  applyPendingDirtyLines(player: 1 | 2): void {
    if (player === 1 && this.p1PendingDirtyLines > 0) {
      this.addDirtyLines(1, this.p1PendingDirtyLines);
      this.p1PendingDirtyLines = 0;
    } else if (player === 2 && this.p2PendingDirtyLines > 0) {
      this.addDirtyLines(2, this.p2PendingDirtyLines);
      this.p2PendingDirtyLines = 0;
    }
  }

  private addDirtyLines(player: 1 | 2, count: number): void {
    const board = player === 1 ? this.p1Board : this.p2Board;

    for (let i = 0; i < count; i++) {
      board.shift();
      const dirtyRow = Array(BOARD_WIDTH).fill(0);
      dirtyRow[Math.floor(Math.random() * BOARD_WIDTH)] = 8;
      dirtyRow[Math.floor(Math.random() * BOARD_WIDTH)] = 8;
      board.push(dirtyRow);
    }
  }

  tick(player: 1 | 2): boolean {
    const isGameOver = player === 1 ? this.p1IsGameOver : this.p2IsGameOver;
    if (isGameOver) return false;
    return this.move(player, 'down');
  }

  reset(): void {
    this.init();
  }

  getPieceColor(type: number): string {
    return PIECE_COLORS[type - 1] || '#333';
  }

  getCanvasWidth(): number {
    return 800;
  }

  getCanvasHeight(): number {
    return 700;
  }

  getBoardOffset(): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
    return {
      p1: { x: 20, y: 50 },
      p2: { x: 420, y: 50 }
    };
  }

  getBoardDimensions(): { width: number; height: number } {
    return { width: BOARD_WIDTH * CELL_SIZE, height: BOARD_HEIGHT * CELL_SIZE };
  }

  getCellSize(): number {
    return CELL_SIZE;
  }
}
