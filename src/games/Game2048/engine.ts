import { GAME_2048_CONSTANTS } from '../../utils/constants';

const { GRID_SIZE } = GAME_2048_CONSTANTS;

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Game2048State {
  grid: number[][];
  score: number;
  isGameOver: boolean;
  isWon: boolean;
}

export class Game2048Engine {
  private grid: number[][];
  private score: number;
  private isGameOver: boolean;
  private isWon: boolean;

  constructor() {
    this.grid = [];
    this.score = 0;
    this.isGameOver = false;
    this.isWon = false;
    this.init();
  }

  init(): void {
    this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    this.score = 0;
    this.isGameOver = false;
    this.isWon = false;
    this.addRandomTile();
    this.addRandomTile();
  }

  getState(): Game2048State {
    return {
      grid: this.grid.map(row => [...row]),
      score: this.score,
      isGameOver: this.isGameOver,
      isWon: this.isWon
    };
  }

  addRandomTile(): void {
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] === 0) {
          emptyCells.push([r, c]);
        }
      }
    }

    if (emptyCells.length > 0) {
      const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  move(direction: Direction): boolean {
    if (this.isGameOver) return false;

    const oldGrid = this.grid.map(row => [...row]);
    let moved = false;

    switch (direction) {
      case 'left':
        moved = this.moveLeft();
        break;
      case 'right':
        moved = this.moveRight();
        break;
      case 'up':
        moved = this.moveUp();
        break;
      case 'down':
        moved = this.moveDown();
        break;
    }

    if (moved) {
      this.addRandomTile();
      this.checkWin();
      if (this.isGameOver === false) {
        this.isGameOver = this.checkGameOver();
      }
    }

    return moved;
  }

  private moveLeft(): boolean {
    let moved = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = this.grid[r].filter(val => val !== 0);
      const newRow: number[] = [];

      for (let i = 0; i < row.length; i++) {
        if (i < row.length - 1 && row[i] === row[i + 1]) {
          const merged = row[i] * 2;
          newRow.push(merged);
          this.score += merged;
          if (merged === 2048) this.isWon = true;
          i++;
        } else {
          newRow.push(row[i]);
        }
      }

      while (newRow.length < GRID_SIZE) {
        newRow.push(0);
      }

      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] !== newRow[c]) {
          moved = true;
        }
        this.grid[r][c] = newRow[c];
      }
    }
    return moved;
  }

  private moveRight(): boolean {
    let moved = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = this.grid[r].filter(val => val !== 0).reverse();
      const newRow: number[] = [];

      for (let i = 0; i < row.length; i++) {
        if (i < row.length - 1 && row[i] === row[i + 1]) {
          const merged = row[i] * 2;
          newRow.push(merged);
          this.score += merged;
          if (merged === 2048) this.isWon = true;
          i++;
        } else {
          newRow.push(row[i]);
        }
      }

      while (newRow.length < GRID_SIZE) {
        newRow.push(0);
      }

      const reversed = newRow.reverse();
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] !== reversed[c]) {
          moved = true;
        }
        this.grid[r][c] = reversed[c];
      }
    }
    return moved;
  }

  private moveUp(): boolean {
    let moved = false;
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        if (this.grid[r][c] !== 0) {
          col.push(this.grid[r][c]);
        }
      }

      const newCol: number[] = [];
      for (let i = 0; i < col.length; i++) {
        if (i < col.length - 1 && col[i] === col[i + 1]) {
          const merged = col[i] * 2;
          newCol.push(merged);
          this.score += merged;
          if (merged === 2048) this.isWon = true;
          i++;
        } else {
          newCol.push(col[i]);
        }
      }

      while (newCol.length < GRID_SIZE) {
        newCol.push(0);
      }

      for (let r = 0; r < GRID_SIZE; r++) {
        if (this.grid[r][c] !== newCol[r]) {
          moved = true;
        }
        this.grid[r][c] = newCol[r];
      }
    }
    return moved;
  }

  private moveDown(): boolean {
    let moved = false;
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = [];
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (this.grid[r][c] !== 0) {
          col.push(this.grid[r][c]);
        }
      }

      const newCol: number[] = [];
      for (let i = 0; i < col.length; i++) {
        if (i < col.length - 1 && col[i] === col[i + 1]) {
          const merged = col[i] * 2;
          newCol.push(merged);
          this.score += merged;
          if (merged === 2048) this.isWon = true;
          i++;
        } else {
          newCol.push(col[i]);
        }
      }

      while (newCol.length < GRID_SIZE) {
        newCol.push(0);
      }

      const reversed = newCol.reverse();
      for (let r = 0; r < GRID_SIZE; r++) {
        if (this.grid[r][c] !== reversed[r]) {
          moved = true;
        }
        this.grid[r][c] = reversed[r];
      }
    }
    return moved;
  }

  checkWin(): void {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] === 2048) {
          this.isWon = true;
          return;
        }
      }
    }
  }

  checkGameOver(): boolean {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] === 0) return false;
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const current = this.grid[r][c];
        if (c < GRID_SIZE - 1 && current === this.grid[r][c + 1]) return false;
        if (r < GRID_SIZE - 1 && current === this.grid[r + 1][c]) return false;
      }
    }

    return true;
  }

  reset(): void {
    this.init();
  }
}
