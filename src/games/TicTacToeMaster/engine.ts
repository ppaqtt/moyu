import { TICTACTOE_MASTER_CONSTANTS } from '../../utils/constants';

const { GRID_SIZE, CELL_SIZE } = TICTACTOE_MASTER_CONSTANTS;

export type Player = 'X' | 'O';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  board: (Player | null)[][];
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | 'draw' | null;
  difficulty: Difficulty;
  winningLine: Position[];
}

export class TicTacToeMasterEngine {
  private board: (Player | null)[][];
  private currentPlayer: Player;
  private isGameOver: boolean;
  private winner: Player | 'draw' | null;
  private difficulty: Difficulty;
  private winningLine: Position[];

  constructor(difficulty: Difficulty = 'medium') {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'X';
    this.isGameOver = false;
    this.winner = null;
    this.difficulty = difficulty;
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
      difficulty: this.difficulty,
      winningLine: this.winningLine,
    };
  }

  reset(difficulty?: Difficulty): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'X';
    this.isGameOver = false;
    this.winner = null;
    if (difficulty) {
      this.difficulty = difficulty;
    }
    this.winningLine = [];
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
  }

  makeMove(row: number, col: number): boolean {
    if (this.isGameOver || !this.isValidPosition(row, col) || this.board[row][col] !== null) {
      return false;
    }

    this.board[row][col] = this.currentPlayer;
    
    if (this.checkWin(row, col)) {
      this.isGameOver = true;
      this.winner = this.currentPlayer;
    } else if (this.isBoardFull()) {
      this.isGameOver = true;
      this.winner = 'draw';
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    return true;
  }

  private isBoardFull(): boolean {
    return this.board.every(row => row.every(cell => cell !== null));
  }

  private checkWin(row: number, col: number): boolean {
    const player = this.board[row][col];
    if (!player) return false;

    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of directions) {
      const line: Position[] = [{ row, col }];
      
      for (let i = 1; i < GRID_SIZE; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (this.isValidPosition(r, c) && this.board[r][c] === player) {
          line.push({ row: r, col: c });
        } else {
          break;
        }
      }

      for (let i = 1; i < GRID_SIZE; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (this.isValidPosition(r, c) && this.board[r][c] === player) {
          line.push({ row: r, col: c });
        } else {
          break;
        }
      }

      if (line.length >= GRID_SIZE) {
        this.winningLine = line;
        return true;
      }
    }

    return false;
  }

  async makeAIMove(): Promise<Position | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.isGameOver || this.currentPlayer !== 'O') {
          resolve(null);
          return;
        }

        const move = this.getBestMove();
        if (move) {
          this.makeMove(move.row, move.col);
        }
        resolve(move);
      }, 500);
    });
  }

  private getBestMove(): Position | null {
    switch (this.difficulty) {
      case 'easy':
        return this.getRandomMove();
      case 'medium':
        return Math.random() > 0.5 ? this.getOptimalMove() : this.getRandomMove();
      case 'hard':
        return this.getOptimalMove();
      default:
        return this.getRandomMove();
    }
  }

  private getRandomMove(): Position | null {
    const emptyCells: Position[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (this.board[row][col] === null) {
          emptyCells.push({ row, col });
        }
      }
    }
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  private getOptimalMove(): Position | null {
    let bestScore = -Infinity;
    let bestMove: Position | null = null;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (this.board[row][col] === null) {
          this.board[row][col] = 'O';
          const score = this.minimax(false, 0);
          this.board[row][col] = null;

          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }

    return bestMove;
  }

  private minimax(isMaximizing: boolean, depth: number): number {
    const result = this.evaluateBoard();
    if (result !== null) {
      return result;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (this.board[row][col] === null) {
            this.board[row][col] = 'O';
            const score = this.minimax(false, depth + 1);
            this.board[row][col] = null;
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (this.board[row][col] === null) {
            this.board[row][col] = 'X';
            const score = this.minimax(true, depth + 1);
            this.board[row][col] = null;
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  }

  private evaluateBoard(): number | null {
    for (let row = 0; row < GRID_SIZE; row++) {
      if (this.board[row][0] && this.board[row][0] === this.board[row][1] && this.board[row][1] === this.board[row][2]) {
        return this.board[row][0] === 'O' ? 10 : -10;
      }
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      if (this.board[0][col] && this.board[0][col] === this.board[1][col] && this.board[1][col] === this.board[2][col]) {
        return this.board[0][col] === 'O' ? 10 : -10;
      }
    }

    if (this.board[0][0] && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) {
      return this.board[0][0] === 'O' ? 10 : -10;
    }

    if (this.board[0][2] && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) {
      return this.board[0][2] === 'O' ? 10 : -10;
    }

    if (this.isBoardFull()) {
      return 0;
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    this.drawGrid(ctx);
    this.drawPieces(ctx);
    this.drawWinningLine(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 4;

    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 20);
      ctx.lineTo(i * CELL_SIZE, 3 * CELL_SIZE - 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(20, i * CELL_SIZE);
      ctx.lineTo(3 * CELL_SIZE - 20, i * CELL_SIZE);
      ctx.stroke();
    }
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const piece = this.board[row][col];
        if (piece) {
          const x = col * CELL_SIZE + CELL_SIZE / 2;
          const y = row * CELL_SIZE + CELL_SIZE / 2;
          
          if (piece === 'X') {
            this.drawX(ctx, x, y);
          } else {
            this.drawO(ctx, x, y);
          }
        }
      }
    }
  }

  private drawX(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const size = CELL_SIZE * 0.35;
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
  }

  private drawO(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const radius = CELL_SIZE * 0.3;
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 8;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawWinningLine(ctx: CanvasRenderingContext2D): void {
    if (this.winningLine.length < GRID_SIZE) return;

    const first = this.winningLine[0];
    const last = this.winningLine[this.winningLine.length - 1];

    const x1 = first.col * CELL_SIZE + CELL_SIZE / 2;
    const y1 = first.row * CELL_SIZE + CELL_SIZE / 2;
    const x2 = last.col * CELL_SIZE + CELL_SIZE / 2;
    const y2 = last.row * CELL_SIZE + CELL_SIZE / 2;

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}
