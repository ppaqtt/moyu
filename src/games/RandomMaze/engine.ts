export type CellType = 'wall' | 'path' | 'start' | 'end';

export interface MazeCell {
  row: number;
  col: number;
  type: CellType;
  visited: boolean;
}

export interface GameState {
  maze: MazeCell[][];
  playerRow: number;
  playerCol: number;
  endRow: number;
  endCol: number;
  moves: number;
  isComplete: boolean;
  level: number;
}

export class RandomMazeEngine {
  private maze: MazeCell[][];
  private playerRow: number;
  private playerCol: number;
  private endRow: number;
  private endCol: number;
  private moves: number;
  private isComplete: boolean;
  private level: number;
  private rows: number;
  private cols: number;

  constructor(level: number = 1) {
    this.level = level;
    this.rows = Math.min(11 + level * 2, 21);
    this.cols = Math.min(11 + level * 2, 21);
    this.maze = [];
    this.playerRow = 1;
    this.playerCol = 1;
    this.endRow = this.rows - 2;
    this.endCol = this.cols - 2;
    this.moves = 0;
    this.isComplete = false;
    this.generateMaze();
  }

  private generateMaze(): void {
    // Initialize maze with walls
    this.maze = [];
    for (let r = 0; r < this.rows; r++) {
      this.maze[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.maze[r][c] = {
          row: r,
          col: c,
          type: 'wall',
          visited: false
        };
      }
    }

    // Recursive backtracking algorithm to generate maze
    this.carve(1, 1);

    // Set start and end
    this.maze[1][1].type = 'start';
    this.maze[this.endRow][this.endCol].type = 'end';
    this.playerRow = 1;
    this.playerCol = 1;
    this.moves = 0;
    this.isComplete = false;
  }

  private carve(r: number, c: number): void {
    this.maze[r][c].type = 'path';
    this.maze[r][c].visited = true;

    const directions = this.shuffle(['up', 'down', 'left', 'right']);

    for (const dir of directions) {
      let nr = r;
      let nc = c;

      switch (dir) {
        case 'up': nr -= 2; break;
        case 'down': nr += 2; break;
        case 'left': nc -= 2; break;
        case 'right': nc += 2; break;
      }

      if (nr > 0 && nr < this.rows - 1 && nc > 0 && nc < this.cols - 1 && !this.maze[nr][nc].visited) {
        // Knock down the wall between
        const wallR = r + (nr - r) / 2;
        const wallC = c + (nc - c) / 2;
        this.maze[wallR][wallC].type = 'path';
        this.carve(nr, nc);
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public move(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.isComplete) return;

    let newRow = this.playerRow;
    let newCol = this.playerCol;

    switch (direction) {
      case 'up': newRow--; break;
      case 'down': newRow++; break;
      case 'left': newCol--; break;
      case 'right': newCol++; break;
    }

    if (this.canMoveTo(newRow, newCol)) {
      this.playerRow = newRow;
      this.playerCol = newCol;
      this.moves++;

      if (newRow === this.endRow && newCol === this.endCol) {
        this.isComplete = true;
      }
    }
  }

  private canMoveTo(row: number, col: number): boolean {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    return this.maze[row][col].type !== 'wall';
  }

  public reset(): void {
    this.generateMaze();
  }

  public nextLevel(): void {
    this.level++;
    this.rows = Math.min(11 + this.level * 2, 21);
    this.cols = Math.min(11 + this.level * 2, 21);
    this.endRow = this.rows - 2;
    this.endCol = this.cols - 2;
    this.generateMaze();
  }

  public getState(): GameState {
    return {
      maze: this.maze.map(row => row.map(cell => ({ ...cell }))),
      playerRow: this.playerRow,
      playerCol: this.playerCol,
      endRow: this.endRow,
      endCol: this.endCol,
      moves: this.moves,
      isComplete: this.isComplete,
      level: this.level
    };
  }
}
