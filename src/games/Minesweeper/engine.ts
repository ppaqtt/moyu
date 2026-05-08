export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface GameMinesweeperState {
  board: Cell[][];
  rows: number;
  cols: number;
  mines: number;
  flags: number;
  score: number;
  isGameOver: boolean;
  isWon: boolean;
  time: number;
}

export class GameMinesweeperEngine {
  private board: Cell[][];
  private rows: number;
  private cols: number;
  private totalMines: number;
  private flags: number;
  private score: number;
  private isGameOver: boolean;
  private isWon: boolean;
  private isFirstClick: boolean;
  private time: number;
  private timer: number | null;

  constructor(rows: number = 16, cols: number = 16, mines: number = 40) {
    this.rows = rows;
    this.cols = cols;
    this.totalMines = mines;
    this.board = [];
    this.flags = 0;
    this.score = 0;
    this.isGameOver = false;
    this.isWon = false;
    this.isFirstClick = true;
    this.time = 0;
    this.timer = null;
    this.init();
  }

  init(): void {
    this.board = Array(this.rows).fill(null).map(() =>
      Array(this.cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      }))
    );
    this.flags = 0;
    this.score = 0;
    this.isGameOver = false;
    this.isWon = false;
    this.isFirstClick = true;
    this.time = 0;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private placeMines(excludeRow: number, excludeCol: number): void {
    const excludeSet = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = excludeRow + dr;
        const c = excludeCol + dc;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          excludeSet.add(`${r},${c}`);
        }
      }
    }

    let placed = 0;
    while (placed < this.totalMines) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      const key = `${r},${c}`;

      if (!this.board[r][c].isMine && !excludeSet.has(key)) {
        this.board[r][c].isMine = true;
        placed++;
      }
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c].isMine) {
          this.board[r][c].adjacentMines = this.countAdjacentMines(r, c);
        }
      }
    }
  }

  private countAdjacentMines(row: number, col: number): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c].isMine) {
          count++;
        }
      }
    }
    return count;
  }

  getState(): GameMinesweeperState {
    return {
      board: this.board.map(row => row.map(cell => ({ ...cell }))),
      rows: this.rows,
      cols: this.cols,
      mines: this.totalMines,
      flags: this.flags,
      score: this.score,
      isGameOver: this.isGameOver,
      isWon: this.isWon,
      time: this.time
    };
  }

  reveal(row: number, col: number): void {
    if (this.isGameOver || this.isWon) return;
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    if (this.board[row][col].isRevealed || this.board[row][col].isFlagged) return;

    if (this.isFirstClick) {
      this.placeMines(row, col);
      this.isFirstClick = false;
      this.startTimer();
    }

    const cell = this.board[row][col];

    if (cell.isMine) {
      this.isGameOver = true;
      this.revealAllMines();
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      return;
    }

    this.floodReveal(row, col);
    this.score += 10;
    this.checkWin();
  }

  private floodReveal(row: number, col: number): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    const cell = this.board[row][col];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;

    cell.isRevealed = true;

    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            this.floodReveal(row + dr, col + dc);
          }
        }
      }
    }
  }

  toggleFlag(row: number, col: number): void {
    if (this.isGameOver || this.isWon) return;
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    const cell = this.board[row][col];
    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    this.flags += cell.isFlagged ? 1 : -1;
  }

  private revealAllMines(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c].isMine) {
          this.board[r][c].isRevealed = true;
        }
      }
    }
  }

  private checkWin(): void {
    let unrevealedNonMines = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c].isRevealed && !this.board[r][c].isMine) {
          unrevealedNonMines++;
        }
      }
    }

    if (unrevealedNonMines === 0) {
      this.isWon = true;
      this.score += 1000 + (this.totalMines - this.flags) * 50;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  private startTimer(): void {
    this.timer = window.setInterval(() => {
      this.time++;
    }, 1000);
  }

  reset(): void {
    this.init();
  }
}
