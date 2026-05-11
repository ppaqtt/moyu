
export interface NumberCell {
  id: number;
  value: number;
  row: number;
  col: number;
  isSelected: boolean;
  isMatched: boolean;
  isNew: boolean;
}

export interface GameState {
  grid: NumberCell[][];
  score: number;
  moves: number;
  level: number;
  isGameOver: boolean;
  target: number;
  lastMatch: { sum: number; cells: { row: number; col: number }[] } | null;
}

const GRID_SIZE = 6;
const TARGET_SUM = 10;

export class NumberMatchEngine {
  private grid: NumberCell[][];
  private score: number;
  private moves: number;
  private level: number;
  private isGameOver: boolean;
  private target: number;
  private selectedCells: { row: number; col: number }[];
  private lastMatch: { sum: number; cells: { row: number; col: number }[] } | null;
  private nextId: number;

  constructor() {
    this.grid = [];
    this.score = 0;
    this.moves = 0;
    this.level = 1;
    this.isGameOver = false;
    this.target = TARGET_SUM;
    this.selectedCells = [];
    this.lastMatch = null;
    this.nextId = 0;
    this.init();
  }

  init(): void {
    this.grid = [];
    this.score = 0;
    this.moves = 0;
    this.level = 1;
    this.isGameOver = false;
    this.target = TARGET_SUM;
    this.selectedCells = [];
    this.lastMatch = null;
    this.nextId = 0;
    this.generateGrid();
  }

  private generateGrid(): void {
    this.grid = [];
    for (let row = 0; row &lt; GRID_SIZE; row++) {
      this.grid[row] = [];
      for (let col = 0; col &lt; GRID_SIZE; col++) {
        this.grid[row][col] = {
          id: this.nextId++,
          value: Math.floor(Math.random() * 9) + 1,
          row,
          col,
          isSelected: false,
          isMatched: false,
          isNew: false
        };
      }
    }
  }

  selectCell(row: number, col: number): void {
    if (this.isGameOver) return;
    
    const cell = this.grid[row][col];
    if (cell.isMatched) return;

    const existingIndex = this.selectedCells.findIndex(c =&gt; c.row === row &amp;&amp; c.col === col);
    if (existingIndex !== -1) {
      this.selectedCells.splice(existingIndex, 1);
      cell.isSelected = false;
      return;
    }

    this.selectedCells.push({ row, col });
    cell.isSelected = true;
  }

  checkMatch(): boolean {
    if (this.selectedCells.length === 0) return false;

    const sum = this.selectedCells.reduce((total, c) =&gt; total + this.grid[c.row][c.col].value, 0);
    
    if (sum === this.target) {
      this.lastMatch = { sum, cells: [...this.selectedCells] };
      
      this.selectedCells.forEach(({ row, col }) =&gt; {
        this.grid[row][col].isMatched = true;
        this.grid[row][col].isSelected = false;
      });

      const points = this.selectedCells.length * 10 * this.level;
      this.score += points;
      this.moves++;

      this.selectedCells = [];

      setTimeout(() =&gt; {
        this.removeAndRefill();
      }, 300);

      return true;
    }

    this.selectedCells.forEach(({ row, col }) =&gt; {
      this.grid[row][col].isSelected = false;
    });
    this.selectedCells = [];

    return false;
  }

  private removeAndRefill(): void {
    const matchedPositions: { row: number; col: number }[] = [];
    
    for (let row = 0; row &lt; GRID_SIZE; row++) {
      for (let col = 0; col &lt; GRID_SIZE; col++) {
        if (this.grid[row][col].isMatched) {
          matchedPositions.push({ row, col });
        }
      }
    }

    for (let col = 0; col &lt; GRID_SIZE; col++) {
      const column = [];
      for (let row = GRID_SIZE - 1; row &gt;= 0; row--) {
        if (!this.grid[row][col].isMatched) {
          column.push(this.grid[row][col]);
        }
      }

      const numToAdd = GRID_SIZE - column.length;
      for (let i = 0; i &lt; numToAdd; i++) {
        column.push({
          id: this.nextId++,
          value: Math.floor(Math.random() * 9) + 1,
          row: -1,
          col,
          isSelected: false,
          isMatched: false,
          isNew: true
        });
      }

      for (let row = GRID_SIZE - 1; row &gt;= 0; row--) {
        this.grid[row][col] = column[GRID_SIZE - 1 - row];
        this.grid[row][col].row = row;
        this.grid[row][col].isNew = true;
      }
    }

    setTimeout(() =&gt; {
      for (let row = 0; row &lt; GRID_SIZE; row++) {
        for (let col = 0; col &lt; GRID_SIZE; col++) {
          this.grid[row][col].isMatched = false;
          this.grid[row][col].isNew = false;
        }
      }
      this.lastMatch = null;
      this.checkGameOver();
    }, 100);
  }

  private checkGameOver(): void {
    for (let row = 0; row &lt; GRID_SIZE; row++) {
      for (let col = 0; col &lt; GRID_SIZE; col++) {
        if (this.canFormSum(row, col, this.target, new Set())) {
          return;
        }
      }
    }
    this.isGameOver = true;
  }

  private canFormSum(row: number, col: number, remainingSum: number, visited: Set&lt;string&gt;): boolean {
    if (remainingSum === 0) return true;
    if (remainingSum &lt; 0) return false;
    if (visited.has(`${row},${col}`)) return false;
    
    visited.add(`${row},${col}`);

    const cell = this.grid[row][col];
    if (cell.isMatched) return false;

    const newValue = remainingSum - cell.value;
    if (newValue === 0) return true;

    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];

    for (const { dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow &gt;= 0 &amp;&amp; newRow &lt; GRID_SIZE &amp;&amp; newCol &gt;= 0 &amp;&amp; newCol &lt; GRID_SIZE) {
        const newVisited = new Set(visited);
        if (this.canFormSum(newRow, newCol, newValue, newVisited)) {
          return true;
        }
      }
    }

    return false;
  }

  nextLevel(): void {
    this.level++;
    this.moves = 0;
    this.target = TARGET_SUM + (this.level - 1) * 2;
    this.generateGrid();
    this.isGameOver = false;
  }

  reset(): void {
    this.init();
  }

  getState(): GameState {
    return {
      grid: this.grid.map(row =&gt; row.map(cell =&gt; ({ ...cell }))),
      score: this.score,
      moves: this.moves,
      level: this.level,
      isGameOver: this.isGameOver,
      target: this.target,
      lastMatch: this.lastMatch ? { ...this.lastMatch, cells: [...this.lastMatch.cells.map(c =&gt; ({ ...c })) } : null
    };
  }

  getSelectedSum(): number {
    return this.selectedCells.reduce((total, c) =&gt; total + this.grid[c.row][c.col].value, 0);
  }
}
