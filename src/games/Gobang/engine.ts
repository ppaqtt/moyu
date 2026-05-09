import { GOBANG_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, CELL_SIZE, WIN_COUNT } = GOBANG_CONSTANTS;

export type Player = 'black' | 'white';

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  board: (Player | null)[][];
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | null;
  lastMove: Position | null;
  winningLine: Position[];
}

export class GobangEngine {
  private board: (Player | null)[][];
  private currentPlayer: Player;
  private isGameOver: boolean;
  private winner: Player | null;
  private lastMove: Position | null;
  private winningLine: Position[];
  private aiThinking: boolean = false;

  constructor() {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'black';
    this.isGameOver = false;
    this.winner = null;
    this.lastMove = null;
    this.winningLine = [];
  }

  private createEmptyBoard(): (Player | null)[][] {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  }

  getState(): GameState {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      isGameOver: this.isGameOver,
      winner: this.winner,
      lastMove: this.lastMove,
      winningLine: this.winningLine
    };
  }

  reset(): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'black';
    this.isGameOver = false;
    this.winner = null;
    this.lastMove = null;
    this.winningLine = [];
    this.aiThinking = false;
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
  }

  getCell(row: number, col: number): Player | null {
    if (!this.isValidPosition(row, col)) return null;
    return this.board[row][col];
  }

  placeStone(row: number, col: number): boolean {
    if (this.isGameOver || this.aiThinking) return false;
    if (!this.isValidPosition(row, col)) return false;
    if (this.board[row][col] !== null) return false;

    this.board[row][col] = this.currentPlayer;
    this.lastMove = { row, col };

    if (this.checkWin(row, col)) {
      this.isGameOver = true;
      this.winner = this.currentPlayer;
    } else if (this.isBoardFull()) {
      this.isGameOver = true;
      this.winner = null;
    } else {
      this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    }

    return true;
  }

  private isBoardFull(): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (this.board[row][col] === null) return false;
      }
    }
    return true;
  }

  private checkWin(row: number, col: number): boolean {
    const player = this.board[row][col];
    if (!player) return false;

    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ];

    for (const { dr, dc } of directions) {
      const line: Position[] = [{ row, col }];

      for (let i = 1; i < WIN_COUNT; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (this.board[r]?.[c] === player) {
          line.push({ row: r, col: c });
        } else {
          break;
        }
      }

      for (let i = 1; i < WIN_COUNT; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (this.board[r]?.[c] === player) {
          line.push({ row: r, col: c });
        } else {
          break;
        }
      }

      if (line.length >= WIN_COUNT) {
        this.winningLine = line.slice(0, WIN_COUNT);
        return true;
      }
    }

    return false;
  }

  makeAIMove(): Promise<Position | null> {
    return new Promise((resolve) => {
      if (this.isGameOver || this.currentPlayer !== 'white') {
        resolve(null);
        return;
      }

      this.aiThinking = true;

      setTimeout(() => {
        const move = this.findBestMove();
        this.aiThinking = false;

        if (move) {
          this.placeStone(move.row, move.col);
        }
        resolve(move);
      }, 500);
    });
  }

  private findBestMove(): Position | null {
    let bestScore = -Infinity;
    let bestMove: Position | null = null;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (this.board[row][col] === null) {
          const score = this.evaluatePosition(row, col);
          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }

    return bestMove;
  }

  private evaluatePosition(row: number, col: number): number {
    let score = 0;
    const opponent = 'black';

    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ];

    for (const { dr, dc } of directions) {
      const myLine = this.countLine(row, col, 'white', dr, dc);
      const oppLine = this.countLine(row, col, opponent, dr, dc);

      if (myLine.count >= 4) {
        score += 10000;
      } else if (myLine.count === 3 && myLine.openEnds === 2) {
        score += 1000;
      } else if (myLine.count === 3 && myLine.openEnds === 1) {
        score += 100;
      } else if (myLine.count === 2 && myLine.openEnds === 2) {
        score += 50;
      } else if (myLine.count === 2 && myLine.openEnds === 1) {
        score += 10;
      }

      if (oppLine.count >= 4) {
        score += 5000;
      } else if (oppLine.count === 3 && oppLine.openEnds === 2) {
        score += 800;
      } else if (oppLine.count === 3 && oppLine.openEnds === 1) {
        score += 80;
      } else if (oppLine.count === 2 && oppLine.openEnds === 2) {
        score += 40;
      }
    }

    const centerBonus = (GRID_SIZE / 2 - Math.abs(col - GRID_SIZE / 2)) * 2 +
                        (GRID_SIZE / 2 - Math.abs(row - GRID_SIZE / 2)) * 2;
    score += centerBonus;

    if (this.lastMove) {
      const distFromLast = Math.abs(row - this.lastMove.row) + Math.abs(col - this.lastMove.col);
      if (distFromLast <= 2) {
        score += 5;
      }
    }

    return score;
  }

  private countLine(
    row: number,
    col: number,
    player: Player,
    dr: number,
    dc: number
  ): { count: number; openEnds: number } {
    let count = 1;
    let openEnds = 0;

    for (let i = 1; i <= 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (this.board[r]?.[c] === player) {
        count++;
      } else {
        if (this.isValidPosition(r, c) && this.board[r]?.[c] === null) {
          openEnds++;
        }
        break;
      }
    }

    for (let i = 1; i <= 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (this.board[r]?.[c] === player) {
        count++;
      } else {
        if (this.isValidPosition(r, c) && this.board[r]?.[c] === null) {
          openEnds++;
        }
        break;
      }
    }

    return { count, openEnds };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawGrid(ctx);
    this.drawStars(ctx);
    this.drawStones(ctx);
    this.drawLastMove(ctx);
    this.drawWinningLine(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const offset = CELL_SIZE / 2;

    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;

    for (let i = 0; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(offset + i * CELL_SIZE, offset);
      ctx.lineTo(offset + i * CELL_SIZE, CANVAS_HEIGHT - offset);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offset, offset + i * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH - offset, offset + i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    const boardSize = (GRID_SIZE - 1) * CELL_SIZE;
    ctx.strokeRect(offset, offset, boardSize, boardSize);
  }

  private drawStars(ctx: CanvasRenderingContext2D): void {
    const offset = CELL_SIZE / 2;
    const starPositions = [
      { row: 3, col: 3 },
      { row: 3, col: 11 },
      { row: 7, col: 7 },
      { row: 11, col: 3 },
      { row: 11, col: 11 }
    ];

    ctx.fillStyle = '#654321';
    for (const { row, col } of starPositions) {
      const x = offset + col * CELL_SIZE;
      const y = offset + row * CELL_SIZE;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawStones(ctx: CanvasRenderingContext2D): void {
    const offset = CELL_SIZE / 2;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const player = this.board[row][col];
        if (player) {
          const x = offset + col * CELL_SIZE;
          const y = offset + row * CELL_SIZE;
          const radius = CELL_SIZE * 0.4;

          if (player === 'black') {
            this.drawBlackStone(ctx, x, y, radius);
          } else {
            this.drawWhiteStone(ctx, x, y, radius);
          }
        }
      }
    }
  }

  private drawBlackStone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, '#4a4a4a');
    gradient.addColorStop(0.5, '#1a1a1a');
    gradient.addColorStop(1, '#000000');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawWhiteStone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.7, '#e8e8e8');
    gradient.addColorStop(1, '#cccccc');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - radius * 0.15, y - radius * 0.15, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  }

  private drawLastMove(ctx: CanvasRenderingContext2D): void {
    if (!this.lastMove) return;

    const offset = CELL_SIZE / 2;
    const x = offset + this.lastMove.col * CELL_SIZE;
    const y = offset + this.lastMove.row * CELL_SIZE;
    const size = CELL_SIZE * 0.5;

    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);
  }

  private drawWinningLine(ctx: CanvasRenderingContext2D): void {
    if (this.winningLine.length === 0) return;

    const offset = CELL_SIZE / 2;

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    const start = this.winningLine[0];
    const end = this.winningLine[this.winningLine.length - 1];
    ctx.moveTo(offset + start.col * CELL_SIZE, offset + start.row * CELL_SIZE);
    ctx.lineTo(offset + end.col * CELL_SIZE, offset + end.row * CELL_SIZE);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(offset + start.col * CELL_SIZE, offset + start.row * CELL_SIZE);
    ctx.lineTo(offset + end.col * CELL_SIZE, offset + end.row * CELL_SIZE);
    ctx.stroke();
  }

  getAIMove(): Position | null {
    return this.findBestMove();
  }
}
