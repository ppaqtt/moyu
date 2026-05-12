// 数字华容道游戏引擎
export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  board: number[][];
  emptyPos: Position;
  moves: number;
  isComplete: boolean;
  startTime: number;
  size: number;
}

export class NumberSlideEngine {
  private board: number[][] = [];
  private emptyPos: Position = { row: 0, col: 0 };
  private moves: number = 0;
  private isComplete: boolean = false;
  private readonly size: number;
  private readonly totalCells: number;

  constructor(size: number = 4) {
    this.size = size;
    this.totalCells = size * size;
    this.reset();
  }

  public reset(): void {
    // 初始化数字板 (1到size*size-1, 0表示空)
    const numbers = Array.from({ length: this.totalCells }, (_, i) => i);
    this.board = [];
    
    for (let i = 0; i < this.size; i++) {
      this.board.push(numbers.slice(i * this.size, (i + 1) * this.size));
    }
    
    this.emptyPos = { row: this.size - 1, col: this.size - 1 };
    this.moves = 0;
    this.isComplete = false;
    
    // 打乱数字
    this.shuffle();
  }

  private shuffle(): void {
    // 使用有效移动来打乱，确保有解
    const shuffleMoves = this.size * this.size * 20;
    
    for (let i = 0; i < shuffleMoves; i++) {
      const validMoves = this.getValidMoves();
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        this.swap(this.emptyPos, randomMove, true);
      }
    }
  }

  private getValidMoves(): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];

    for (const dir of directions) {
      const newRow = this.emptyPos.row + dir.row;
      const newCol = this.emptyPos.col + dir.col;
      
      if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }

  private swap(pos: Position, withPos: Position, silent: boolean = false): void {
    const temp = this.board[pos.row][pos.col];
    this.board[pos.row][pos.col] = this.board[withPos.row][withPos.col];
    this.board[withPos.row][withPos.col] = temp;
    
    if (!silent) {
      this.emptyPos = { ...withPos };
    }
  }

  public move(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (this.isComplete) return false;

    let targetRow = this.emptyPos.row;
    let targetCol = this.emptyPos.col;

    switch (direction) {
      case 'up':
        targetRow -= 1;
        break;
      case 'down':
        targetRow += 1;
        break;
      case 'left':
        targetCol -= 1;
        break;
      case 'right':
        targetCol += 1;
        break;
    }

    if (targetRow < 0 || targetRow >= this.size || targetCol < 0 || targetCol >= this.size) {
      return false;
    }

    this.swap(this.emptyPos, { row: targetRow, col: targetCol });
    this.moves++;
    
    // 检查是否完成
    if (this.checkWin()) {
      this.isComplete = true;
    }

    return true;
  }

  public moveTile(row: number, col: number): boolean {
    if (this.isComplete) return false;
    if (this.board[row][col] === 0) return false;

    // 检查是否与空位相邻
    const rowDiff = Math.abs(row - this.emptyPos.row);
    const colDiff = Math.abs(col - this.emptyPos.col);

    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      this.swap(this.emptyPos, { row, col });
      this.moves++;
      
      if (this.checkWin()) {
        this.isComplete = true;
      }
      
      return true;
    }

    return false;
  }

  private checkWin(): boolean {
    const targetNumber = 1;
    
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (row === this.size - 1 && col === this.size - 1) {
          // 最后一个位置应该是0
          if (this.board[row][col] !== 0) return false;
        } else {
          // 其他位置应该是递增的数字
          const expectedNumber = row * this.size + col + 1;
          if (this.board[row][col] !== expectedNumber) return false;
        }
      }
    }

    return true;
  }

  public getState(): GameState {
    return {
      board: this.board.map(row => [...row]),
      emptyPos: { ...this.emptyPos },
      moves: this.moves,
      isComplete: this.isComplete,
      startTime: Date.now(),
      size: this.size
    };
  }

  public tick(): void {
    // 无需周期性更新
  }

  public getBoard(): number[][] {
    return this.board.map(row => [...row]);
  }

  public getEmptyPos(): Position {
    return { ...this.emptyPos };
  }

  public getMoves(): number {
    return this.moves;
  }

  public getSize(): number {
    return this.size;
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public isAdjacent(row: number, col: number): boolean {
    const rowDiff = Math.abs(row - this.emptyPos.row);
    const colDiff = Math.abs(col - this.emptyPos.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  public getHint(): { row: number; col: number } | null {
    // 找到应该在该位置但不在该位置的数字
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const expectedNumber = row === this.size - 1 && col === this.size - 1 ? 0 : row * this.size + col + 1;
        if (this.board[row][col] !== expectedNumber) {
          // 找到这个数字应该在哪里
          const correctNumber = this.board[row][col];
          if (correctNumber !== 0) {
            const correctRow = Math.floor((correctNumber - 1) / this.size);
            const correctCol = (correctNumber - 1) % this.size;
            // 如果这个位置与空位相邻，给出提示
            if (this.isAdjacent(correctRow, correctCol)) {
              return { row: correctRow, col: correctCol };
            }
          }
        }
      }
    }
    
    // 如果没有明显的提示，返回空位相邻的任意一个
    const adjacent = this.getValidMoves();
    return adjacent.length > 0 ? adjacent[0] : null;
  }

  public getComplexity(): number {
    // 计算已排序的数字比例
    let sorted = 0;
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (row === this.size - 1 && col === this.size - 1) {
          if (this.board[row][col] === 0) sorted++;
        } else {
          const expectedNumber = row * this.size + col + 1;
          if (this.board[row][col] === expectedNumber) sorted++;
        }
      }
    }
    return sorted / this.totalCells;
  }
}
