export type CellType = 'wall' | 'path' | 'start' | 'end' | 'box' | 'target' | 'switch' | 'door' | 'key' | 'lock';

export interface MazeCell {
  row: number;
  col: number;
  type: CellType;
  activated: boolean;
}

export interface GameState {
  maze: MazeCell[][];
  playerRow: number;
  playerCol: number;
  moves: number;
  pushes: number;
  isComplete: boolean;
  level: number;
  keysCollected: number;
}

const LEVELS = [
  // Level 1: Simple box pushing
  {
    maze: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'start', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'path', 'box', 'path', 'target', 'path', 'wall'],
      ['wall', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ]
  },
  // Level 2: Two boxes
  {
    maze: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'start', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'path', 'box', 'path', 'box', 'path', 'path', 'wall'],
      ['wall', 'path', 'path', 'path', 'path', 'target', 'path', 'wall'],
      ['wall', 'path', 'path', 'path', 'path', 'target', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ]
  },
  // Level 3: Switch and door
  {
    maze: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'start', 'path', 'path', 'wall', 'path', 'end', 'wall'],
      ['wall', 'path', 'box', 'path', 'door', 'path', 'path', 'wall'],
      ['wall', 'path', 'path', 'switch', 'wall', 'path', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ]
  },
  // Level 4: Key and lock
  {
    maze: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'start', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'path', 'wall', 'wall', 'lock', 'wall', 'path', 'wall'],
      ['wall', 'path', 'key', 'path', 'path', 'end', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ]
  },
  // Level 5: Complex puzzle
  {
    maze: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'start', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'path', 'box', 'path', 'wall', 'path', 'key', 'path', 'wall'],
      ['wall', 'path', 'path', 'switch', 'wall', 'lock', 'path', 'wall'],
      ['wall', 'path', 'target', 'path', 'door', 'path', 'end', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ]
  }
];

export class MazePuzzleEngine {
  private maze: MazeCell[][];
  private playerRow: number;
  private playerCol: number;
  private moves: number;
  private pushes: number;
  private isComplete: boolean;
  private level: number;
  private keysCollected: number;
  private history: { maze: MazeCell[][], playerRow: number, playerCol: number, keysCollected: number }[];

  constructor(level: number = 0) {
    this.level = level;
    this.maze = [];
    this.playerRow = 0;
    this.playerCol = 0;
    this.moves = 0;
    this.pushes = 0;
    this.isComplete = false;
    this.keysCollected = 0;
    this.history = [];
    this.loadLevel(level);
  }

  private loadLevel(levelIndex: number): void {
    const levelData = LEVELS[levelIndex % LEVELS.length];
    this.maze = [];
    this.moves = 0;
    this.pushes = 0;
    this.isComplete = false;
    this.keysCollected = 0;
    this.history = [];

    for (let row = 0; row < levelData.maze.length; row++) {
      this.maze[row] = [];
      for (let col = 0; col < levelData.maze[row].length; col++) {
        const type = levelData.maze[row][col] as CellType;
        this.maze[row][col] = {
          row,
          col,
          type,
          activated: false
        };

        if (type === 'start') {
          this.playerRow = row;
          this.playerCol = col;
        }
      }
    }
  }

  private saveState(): void {
    this.history.push({
      maze: this.maze.map(row => row.map(cell => ({ ...cell }))),
      playerRow: this.playerRow,
      playerCol: this.playerCol,
      keysCollected: this.keysCollected
    });
  }

  public undo(): void {
    if (this.history.length > 0) {
      const state = this.history.pop()!;
      this.maze = state.maze;
      this.playerRow = state.playerRow;
      this.playerCol = state.playerCol;
      this.keysCollected = state.keysCollected;
      this.moves = Math.max(0, this.moves - 1);
    }
  }

  public move(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.isComplete) return;

    const dRow = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
    const dCol = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;

    const newRow = this.playerRow + dRow;
    const newCol = this.playerCol + dCol;

    if (newRow < 0 || newRow >= this.maze.length || newCol < 0 || newCol >= this.maze[0].length) {
      return;
    }

    const targetCell = this.maze[newRow][newCol];

    switch (targetCell.type) {
      case 'wall':
        return;
      case 'lock':
        if (this.keysCollected > 0) {
          this.saveState();
          this.keysCollected--;
          targetCell.type = 'path';
          this.playerRow = newRow;
          this.playerCol = newCol;
          this.moves++;
        }
        return;
      case 'door':
        const switchActivated = this.maze.some(row => 
          row.some(cell => cell.type === 'switch' && cell.activated)
        );
        if (!switchActivated) {
          return;
        }
        this.saveState();
        targetCell.type = 'path';
        this.playerRow = newRow;
        this.playerCol = newCol;
        this.moves++;
        return;
      case 'box':
        const boxNewRow = newRow + dRow;
        const boxNewCol = newCol + dCol;

        if (boxNewRow < 0 || boxNewRow >= this.maze.length || boxNewCol < 0 || boxNewCol >= this.maze[0].length) {
          return;
        }

        const boxTargetCell = this.maze[boxNewRow][boxNewCol];

        if (boxTargetCell.type === 'path' || boxTargetCell.type === 'target' || boxTargetCell.type === 'switch') {
          this.saveState();
          
          if (boxTargetCell.type === 'target') {
            targetCell.type = 'path';
            boxTargetCell.type = 'box';
            boxTargetCell.activated = true;
          } else if (boxTargetCell.type === 'switch') {
            targetCell.type = 'path';
            boxTargetCell.type = 'box';
            boxTargetCell.activated = true;
            // Activate all switches
            this.maze.forEach(row => {
              row.forEach(cell => {
                if (cell.type === 'switch') {
                  cell.activated = true;
                }
              });
            });
          } else {
            targetCell.type = 'path';
            boxTargetCell.type = 'box';
          }

          this.playerRow = newRow;
          this.playerCol = newCol;
          this.moves++;
          this.pushes++;

          this.checkWinCondition();
        }
        return;
      case 'key':
        this.saveState();
        this.keysCollected++;
        targetCell.type = 'path';
        this.playerRow = newRow;
        this.playerCol = newCol;
        this.moves++;
        return;
      case 'end':
        this.saveState();
        this.playerRow = newRow;
        this.playerCol = newCol;
        this.moves++;
        this.checkWinCondition();
        return;
      case 'switch':
        this.saveState();
        targetCell.activated = !targetCell.activated;
        this.playerRow = newRow;
        this.playerCol = newCol;
        this.moves++;
        return;
      default:
        this.saveState();
        this.playerRow = newRow;
        this.playerCol = newCol;
        this.moves++;
        this.checkWinCondition();
    }
  }

  private checkWinCondition(): void {
    // Check if all targets have boxes on them
    const allTargetsFilled = this.maze.every(row =>
      row.every(cell => {
        if (cell.type === 'target') {
          return false;
        }
        return true;
      })
    );

    // Check if player is at end
    const playerAtEnd = this.maze[this.playerRow][this.playerCol].type === 'end';

    // Check if level has end point
    const hasEndPoint = this.maze.some(row => row.some(cell => cell.type === 'end'));

    if (hasEndPoint) {
      this.isComplete = playerAtEnd && allTargetsFilled;
    } else {
      this.isComplete = allTargetsFilled;
    }
  }

  public reset(): void {
    this.loadLevel(this.level);
  }

  public nextLevel(): void {
    this.level++;
    this.loadLevel(this.level);
  }

  public getState(): GameState {
    return {
      maze: this.maze.map(row => row.map(cell => ({ ...cell }))),
      playerRow: this.playerRow,
      playerCol: this.playerCol,
      moves: this.moves,
      pushes: this.pushes,
      isComplete: this.isComplete,
      level: this.level,
      keysCollected: this.keysCollected
    };
  }
}
