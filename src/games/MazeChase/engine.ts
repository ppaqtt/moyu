export type CellType = 'wall' | 'path' | 'start' | 'end' | 'coin' | 'powerup';

export interface MazeCell {
  row: number;
  col: number;
  type: CellType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Enemy {
  row: number;
  col: number;
  lastMove: number;
  moveInterval: number;
}

export interface GameState {
  maze: MazeCell[][];
  playerRow: number;
  playerCol: number;
  enemies: Enemy[];
  score: number;
  lives: number;
  isComplete: boolean;
  isGameOver: boolean;
  level: number;
  coinsCollected: number;
  totalCoins: number;
  isPoweredUp: boolean;
  powerUpTimer: number;
}

export class MazeChaseEngine {
  private maze: MazeCell[][];
  private playerRow: number;
  private playerCol: number;
  private enemies: Enemy[];
  private score: number;
  private lives: number;
  private isComplete: boolean;
  private isGameOver: boolean;
  private level: number;
  private coinsCollected: number;
  private totalCoins: number;
  private isPoweredUp: boolean;
  private powerUpTimer: number;
  private lastUpdate: number;
  private rows: number;
  private cols: number;

  constructor(level: number = 1) {
    this.level = level;
    this.rows = Math.min(11 + level * 2, 17);
    this.cols = Math.min(11 + level * 2, 17);
    this.maze = [];
    this.playerRow = 1;
    this.playerCol = 1;
    this.enemies = [];
    this.score = 0;
    this.lives = 3;
    this.isComplete = false;
    this.isGameOver = false;
    this.coinsCollected = 0;
    this.totalCoins = 0;
    this.isPoweredUp = false;
    this.powerUpTimer = 0;
    this.lastUpdate = Date.now();
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
          type: 'wall'
        };
      }
    }

    // Recursive backtracking algorithm to generate maze
    this.carve(1, 1);

    // Set start and end
    this.maze[1][1].type = 'start';
    this.maze[this.rows - 2][this.cols - 2].type = 'end';
    this.playerRow = 1;
    this.playerCol = 1;

    // Add coins
    this.totalCoins = 0;
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.maze[r][c].type === 'path' && Math.random() < 0.3) {
          this.maze[r][c].type = 'coin';
          this.totalCoins++;
        }
      }
    }

    // Add powerups
    let powerupsPlaced = 0;
    for (let r = 1; r < this.rows - 1 && powerupsPlaced < 2; r++) {
      for (let c = 1; c < this.cols - 1 && powerupsPlaced < 2; c++) {
        if (this.maze[r][c].type === 'path' && Math.random() < 0.1) {
          this.maze[r][c].type = 'powerup';
          powerupsPlaced++;
        }
      }
    }

    // Add enemies
    this.enemies = [];
    const enemyCount = Math.min(1 + Math.floor(this.level / 2), 4);
    for (let i = 0; i < enemyCount; i++) {
      let enemyRow, enemyCol;
      do {
        enemyRow = Math.floor(Math.random() * (this.rows - 4)) + 2;
        enemyCol = Math.floor(Math.random() * (this.cols - 4)) + 2;
      } while (
        this.maze[enemyRow][enemyCol].type === 'wall' ||
        (Math.abs(enemyRow - this.playerRow) < 3 && Math.abs(enemyCol - this.playerCol) < 3)
      );

      this.enemies.push({
        row: enemyRow,
        col: enemyCol,
        lastMove: Date.now(),
        moveInterval: Math.max(500, 1000 - this.level * 50)
      });
    }

    this.coinsCollected = 0;
    this.isPoweredUp = false;
    this.powerUpTimer = 0;
    this.lastUpdate = Date.now();
  }

  private carve(r: number, c: number): void {
    this.maze[r][c].type = 'path';

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

      if (nr > 0 && nr < this.rows - 1 && nc > 0 && nc < this.cols - 1 && this.maze[nr][nc].type === 'wall') {
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
    if (this.isComplete || this.isGameOver) return;

    const newRow = this.playerRow + (direction === 'up' ? -1 : direction === 'down' ? 1 : 0);
    const newCol = this.playerCol + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0);

    if (this.canMoveTo(newRow, newCol)) {
      this.playerRow = newRow;
      this.playerCol = newCol;

      const cell = this.maze[newRow][newCol];

      if (cell.type === 'coin') {
        this.maze[newRow][newCol].type = 'path';
        this.coinsCollected++;
        this.score += 10;
      } else if (cell.type === 'powerup') {
        this.maze[newRow][newCol].type = 'path';
        this.isPoweredUp = true;
        this.powerUpTimer = 5000;
        this.score += 50;
      } else if (cell.type === 'end') {
        const bonus = this.totalCoins > 0 ? Math.floor((this.coinsCollected / this.totalCoins) * 100) : 0;
        this.score += 100 + bonus;
        this.isComplete = true;
      }

      this.checkEnemyCollision();
    }
  }

  private canMoveTo(row: number, col: number): boolean {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    return this.maze[row][col].type !== 'wall';
  }

  private checkEnemyCollision(): void {
    for (const enemy of this.enemies) {
      if (enemy.row === this.playerRow && enemy.col === this.playerCol) {
        if (this.isPoweredUp) {
          // Eat enemy
          this.score += 200;
          enemy.row = this.rows - 2;
          enemy.col = this.cols - 2;
          enemy.lastMove = Date.now();
        } else {
          this.lives--;
          if (this.lives <= 0) {
            this.isGameOver = true;
          } else {
            // Reset position
            this.playerRow = 1;
            this.playerCol = 1;
            this.isPoweredUp = false;
            this.powerUpTimer = 0;
          }
        }
      }
    }
  }

  public update(): void {
    if (this.isComplete || this.isGameOver) return;

    const now = Date.now();
    const delta = now - this.lastUpdate;
    this.lastUpdate = now;

    // Update powerup timer
    if (this.isPoweredUp) {
      this.powerUpTimer -= delta;
      if (this.powerUpTimer <= 0) {
        this.isPoweredUp = false;
      }
    }

    // Move enemies
    for (const enemy of this.enemies) {
      if (now - enemy.lastMove >= enemy.moveInterval) {
        enemy.lastMove = now;
        this.moveEnemy(enemy);
      }
    }

    this.checkEnemyCollision();
  }

  private moveEnemy(enemy: Enemy): void {
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];

    // Simple AI: prefer direction towards player
    const preferredDirections = directions.sort((a, b) => {
      const aDist = Math.abs((enemy.row + a.row) - this.playerRow) + Math.abs((enemy.col + a.col) - this.playerCol);
      const bDist = Math.abs((enemy.row + b.row) - this.playerRow) + Math.abs((enemy.col + b.col) - this.playerCol);
      return aDist - bDist;
    });

    for (const dir of preferredDirections) {
      const newRow = enemy.row + dir.row;
      const newCol = enemy.col + dir.col;

      if (this.canMoveTo(newRow, newCol)) {
        enemy.row = newRow;
        enemy.col = newCol;
        break;
      }
    }
  }

  public reset(): void {
    this.lives = 3;
    this.score = Math.max(0, this.score - 100);
    this.generateMaze();
  }

  public nextLevel(): void {
    this.level++;
    this.rows = Math.min(11 + this.level * 2, 17);
    this.cols = Math.min(11 + this.level * 2, 17);
    this.generateMaze();
  }

  public getState(): GameState {
    return {
      maze: this.maze.map(row => row.map(cell => ({ ...cell }))),
      playerRow: this.playerRow,
      playerCol: this.playerCol,
      enemies: this.enemies.map(e => ({ ...e })),
      score: this.score,
      lives: this.lives,
      isComplete: this.isComplete,
      isGameOver: this.isGameOver,
      level: this.level,
      coinsCollected: this.coinsCollected,
      totalCoins: this.totalCoins,
      isPoweredUp: this.isPoweredUp,
      powerUpTimer: this.powerUpTimer
    };
  }
}
