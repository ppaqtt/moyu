export type CellType = 'wall' | 'path' | 'start' | 'end' | 'key' | 'door';

export interface MazeCell {
  row: number;
  col: number;
  type: CellType;
  visited: boolean;
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  hasKey: boolean;
}

export interface GameState {
  maze: MazeCell[][];
  player: Player;
  moves: number;
  isComplete: boolean;
  level: number;
  keysCollected: number;
  totalKeys: number;
}

export class Maze3DEngine {
  private maze: MazeCell[][];
  private player: Player;
  private moves: number;
  private isComplete: boolean;
  private level: number;
  private rows: number;
  private cols: number;
  private keysCollected: number;
  private totalKeys: number;
  private FOV: number;
  private moveSpeed: number;
  private rotateSpeed: number;

  constructor(level: number = 1) {
    this.level = level;
    this.rows = Math.min(9 + level * 2, 15);
    this.cols = Math.min(9 + level * 2, 15);
    this.FOV = Math.PI / 3;
    this.moveSpeed = 0.1;
    this.rotateSpeed = 0.1;
    this.maze = [];
    this.player = {
      x: 1.5,
      y: 1.5,
      angle: 0,
      hasKey: false
    };
    this.moves = 0;
    this.isComplete = false;
    this.keysCollected = 0;
    this.totalKeys = 1 + Math.floor(level / 2);
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
    this.maze[this.rows - 2][this.cols - 2].type = 'end';
    
    // Place keys and doors
    this.placeKeysAndDoors();
    
    // Reset player
    this.player = {
      x: 1.5,
      y: 1.5,
      angle: Math.PI / 4,
      hasKey: false
    };
    this.moves = 0;
    this.isComplete = false;
    this.keysCollected = 0;
  }

  private placeKeysAndDoors(): void {
    const emptyCells: { row: number; col: number }[] = [];
    
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.maze[r][c].type === 'path') {
          emptyCells.push({ row: r, col: c });
        }
      }
    }

    // Shuffle and place keys
    for (let i = 0; i < this.totalKeys && emptyCells.length > 0; i++) {
      const idx = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells.splice(idx, 1)[0];
      this.maze[cell.row][cell.col].type = 'key';
    }

    // Place door near end
    if (this.totalKeys > 0 && this.rows > 5 && this.cols > 5) {
      const endR = this.rows - 2;
      const endC = this.cols - 2;
      
      if (endR > 2 && this.maze[endR - 1][endC].type === 'path') {
        this.maze[endR - 1][endC].type = 'door';
      } else if (endC > 2 && this.maze[endR][endC - 1].type === 'path') {
        this.maze[endR][endC - 1].type = 'door';
      }
    }
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

  public move(direction: 'forward' | 'backward'): void {
    if (this.isComplete) return;

    const dx = Math.cos(this.player.angle) * (direction === 'forward' ? this.moveSpeed : -this.moveSpeed);
    const dy = Math.sin(this.player.angle) * (direction === 'forward' ? this.moveSpeed : -this.moveSpeed);

    const newX = this.player.x + dx;
    const newY = this.player.y + dy;

    const mapX = Math.floor(newX);
    const mapY = Math.floor(newY);

    if (this.canMoveTo(mapX, mapY)) {
      this.player.x = newX;
      this.player.y = newY;
      this.moves++;
      this.checkCell(mapX, mapY);
    } else {
      // Check slide along walls
      if (this.canMoveTo(Math.floor(this.player.x), mapY)) {
        this.player.y = newY;
        this.moves++;
        this.checkCell(Math.floor(this.player.x), mapY);
      } else if (this.canMoveTo(mapX, Math.floor(this.player.y))) {
        this.player.x = newX;
        this.moves++;
        this.checkCell(mapX, Math.floor(this.player.y));
      }
    }
  }

  public rotate(direction: 'left' | 'right'): void {
    if (this.isComplete) return;
    this.player.angle += direction === 'left' ? -this.rotateSpeed : this.rotateSpeed;
  }

  private canMoveTo(mapX: number, mapY: number): boolean {
    if (mapX < 0 || mapX >= this.cols || mapY < 0 || mapY >= this.rows) {
      return false;
    }
    
    const cell = this.maze[mapY][mapX];
    
    if (cell.type === 'wall') return false;
    if (cell.type === 'door' && this.keysCollected < this.totalKeys) return false;
    
    return true;
  }

  private checkCell(mapX: number, mapY: number): void {
    const cell = this.maze[mapY][mapX];
    
    if (cell.type === 'key') {
      this.maze[mapY][mapX].type = 'path';
      this.keysCollected++;
    } else if (cell.type === 'end') {
      this.isComplete = true;
    }
  }

  public castRay(angle: number): { distance: number; cellType: CellType; textureX: number } {
    const rayAngle = angle;
    const cos = Math.cos(rayAngle);
    const sin = Math.sin(rayAngle);

    let x = this.player.x;
    let y = this.player.y;
    let distance = 0;
    const stepSize = 0.02;
    const maxDistance = 20;

    while (distance < maxDistance) {
      x += cos * stepSize;
      y += sin * stepSize;
      distance += stepSize;

      const mapX = Math.floor(x);
      const mapY = Math.floor(y);

      if (mapX < 0 || mapX >= this.cols || mapY < 0 || mapY >= this.rows) {
        return { distance, cellType: 'wall', textureX: 0 };
      }

      const cell = this.maze[mapY][mapX];
      if (cell.type === 'wall' || cell.type === 'door') {
        const textureX = (cell.type === 'wall') ? (x + y) % 1 : 0.5;
        return { distance, cellType: cell.type, textureX };
      }
    }

    return { distance: maxDistance, cellType: 'path', textureX: 0 };
  }

  public reset(): void {
    this.generateMaze();
  }

  public nextLevel(): void {
    this.level++;
    this.rows = Math.min(9 + this.level * 2, 15);
    this.cols = Math.min(9 + this.level * 2, 15);
    this.totalKeys = 1 + Math.floor(this.level / 2);
    this.generateMaze();
  }

  public getState(): GameState {
    return {
      maze: this.maze.map(row => row.map(cell => ({ ...cell }))),
      player: { ...this.player },
      moves: this.moves,
      isComplete: this.isComplete,
      level: this.level,
      keysCollected: this.keysCollected,
      totalKeys: this.totalKeys
    };
  }
}
