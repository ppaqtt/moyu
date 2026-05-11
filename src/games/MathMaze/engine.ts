
export type Operation = '+' | '-' | '×' | '÷';

export interface MazeCell {
  id: string;
  row: number;
  col: number;
  type: 'start' | 'end' | 'number' | 'operator' | 'empty';
  value?: number;
  operator?: Operation;
  isPath: boolean;
  isVisited: boolean;
  isCurrent: boolean;
}

export interface GameState {
  maze: MazeCell[][];
  score: number;
  level: number;
  currentValue: number;
  targetValue: number;
  moves: number;
  isComplete: boolean;
  isGameOver: boolean;
  path: { row: number; col: number }[];
}

const MAZE_SIZE = 7;

export class MathMazeEngine {
  private maze: MazeCell[][];
  private score: number;
  private level: number;
  private currentValue: number;
  private targetValue: number;
  private moves: number;
  private isComplete: boolean;
  private isGameOver: boolean;
  private path: { row: number; col: number }[];
  private currentPosition: { row: number; col: number };

  constructor() {
    this.maze = [];
    this.score = 0;
    this.level = 1;
    this.currentValue = 0;
    this.targetValue = 10;
    this.moves = 0;
    this.isComplete = false;
    this.isGameOver = false;
    this.path = [];
    this.currentPosition = { row: 0, col: 0 };
    this.init();
  }

  init(): void {
    this.score = 0;
    this.level = 1;
    this.moves = 0;
    this.isComplete = false;
    this.isGameOver = false;
    this.path = [];
    this.generateMaze();
  }

  private generateMaze(): void {
    this.maze = [];
    this.currentValue = 0;
    this.targetValue = 10 + (this.level - 1) * 5;
    this.path = [];

    for (let row = 0; row &lt; MAZE_SIZE; row++) {
      this.maze[row] = [];
      for (let col = 0; col &lt; MAZE_SIZE; col++) {
        this.maze[row][col] = {
          id: `${row}-${col}`,
          row,
          col,
          type: 'empty',
          isPath: false,
          isVisited: false,
          isCurrent: false
        };
      }
    }

    this.currentPosition = { row: 0, col: 0 };
    this.maze[0][0] = {
      id: '0-0',
      row: 0,
      col: 0,
      type: 'start',
      isPath: true,
      isVisited: true,
      isCurrent: true
    };
    this.path.push({ row: 0, col: 0 });

    this.maze[MAZE_SIZE - 1][MAZE_SIZE - 1] = {
      id: `${MAZE_SIZE - 1}-${MAZE_SIZE - 1}`,
      row: MAZE_SIZE - 1,
      col: MAZE_SIZE - 1,
      type: 'end',
      isPath: false,
      isVisited: false,
      isCurrent: false
    };

    const usedPositions = new Set(['0-0', `${MAZE_SIZE - 1}-${MAZE_SIZE - 1}`]);
    const numCells = Math.floor(MAZE_SIZE * MAZE_SIZE * 0.4);
    const opCells = Math.floor(MAZE_SIZE * MAZE_SIZE * 0.3);

    for (let i = 0; i &lt; numCells; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * MAZE_SIZE);
        col = Math.floor(Math.random() * MAZE_SIZE);
      } while (usedPositions.has(`${row}-${col}`));

      usedPositions.add(`${row}-${col}`);
      this.maze[row][col] = {
        id: `${row}-${col}`,
        row,
        col,
        type: 'number',
        value: Math.floor(Math.random() * 9) + 1,
        isPath: false,
        isVisited: false,
        isCurrent: false
      };
    }

    for (let i = 0; i &lt; opCells; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * MAZE_SIZE);
        col = Math.floor(Math.random() * MAZE_SIZE);
      } while (usedPositions.has(`${row}-${col}`));

      usedPositions.add(`${row}-${col}`);
      const operators: Operation[] = ['+', '-', '×', '÷'];
      const operator = operators[Math.floor(Math.random() * operators.length)];
      this.maze[row][col] = {
        id: `${row}-${col}`,
        row,
        col,
        type: 'operator',
        operator,
        isPath: false,
        isVisited: false,
        isCurrent: false
      };
    }
  }

  move(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.isComplete || this.isGameOver) return;

    const newPosition = { ...this.currentPosition };
    switch (direction) {
      case 'up':
        newPosition.row--;
        break;
      case 'down':
        newPosition.row++;
        break;
      case 'left':
        newPosition.col--;
        break;
      case 'right':
        newPosition.col++;
        break;
    }

    if (newPosition.row &lt; 0 || newPosition.row &gt;= MAZE_SIZE ||
        newPosition.col &lt; 0 || newPosition.col &gt;= MAZE_SIZE) {
      return;
    }

    const targetCell = this.maze[newPosition.row][newPosition.col];

    this.maze[this.currentPosition.row][this.currentPosition.col].isCurrent = false;

    this.currentPosition = newPosition;
    this.moves++;
    this.path.push({ ...newPosition });

    targetCell.isCurrent = true;
    targetCell.isVisited = true;
    targetCell.isPath = true;

    const lastCell = this.maze[this.path[this.path.length - 2].row][this.path[this.path.length - 2].col];

    if (targetCell.type === 'number') {
      if (lastCell.type === 'start') {
        this.currentValue = targetCell.value!;
      } else if (lastCell.type === 'operator') {
        const op = lastCell.operator!;
        const num1 = this.currentValue;
        const num2 = targetCell.value!;
        
        switch (op) {
          case '+':
            this.currentValue = num1 + num2;
            break;
          case '-':
            this.currentValue = num1 - num2;
            break;
          case '×':
            this.currentValue = num1 * num2;
            break;
          case '÷':
            if (num2 !== 0 &amp;&amp; num1 % num2 === 0) {
              this.currentValue = Math.floor(num1 / num2);
            }
            break;
        }
      }
    }

    if (targetCell.type === 'end') {
      this.isComplete = true;
      if (this.currentValue === this.targetValue) {
        const bonus = Math.max(0, (100 - this.moves * 2));
        this.score += 100 + bonus + this.level * 50;
      } else {
        this.isGameOver = true;
      }
    }
  }

  reset(): void {
    this.init();
  }

  nextLevel(): void {
    this.level++;
    this.moves = 0;
    this.isComplete = false;
    this.isGameOver = false;
    this.generateMaze();
  }

  getState(): GameState {
    return {
      maze: this.maze.map(row =&gt; row.map(cell =&gt; ({ ...cell }))),
      score: this.score,
      level: this.level,
      currentValue: this.currentValue,
      targetValue: this.targetValue,
      moves: this.moves,
      isComplete: this.isComplete,
      isGameOver: this.isGameOver,
      path: this.path.map(p =&gt; ({ ...p }))
    };
  }
}
