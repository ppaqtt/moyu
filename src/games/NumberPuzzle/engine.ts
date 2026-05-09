export const NUMBER_PUZZLE_CONSTANTS = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 440,
  GRID_SIZE: 4,
  CELL_SIZE: 100,
  GAP: 4,
};

export const NUMBER_PUZZLE_ENGINE_CONSTANTS = NUMBER_PUZZLE_CONSTANTS;
export const NUMBER_PUZZLE_CONSTANTS_2 = NUMBER_PUZZLE_CONSTANTS;
export const NUMBER_PUZZLE_CONSTANTS_3 = NUMBER_PUZZLE_CONSTANTS;
export const NUMBER_PUZZLE_ENGINE_CONSTANTS_2 = NUMBER_PUZZLE_CONSTANTS;
export const NUMBER_PUZZLE_ENGINE_CONSTANTS_3 = NUMBER_PUZZLE_CONSTANTS;

export interface Position {
  row: number;
  col: number;
}

export interface NumberPuzzleState {
  board: number[][];
  emptyPos: Position;
  moveCount: number;
  isSolved: boolean;
  isGameOver: boolean;
  moves: Position[];
}

export class NumberPuzzleEngine {
  private board: number[][];
  private emptyPos: Position;
  private moveCount: number;
  private isSolved: boolean;
  private isGameOver: boolean;
  private moves: Position[];

  constructor(size: number = 4) {
    this.board = [];
    this.emptyPos = { row: 0, col: 0 };
    this.moveCount = 0;
    this.isSolved = false;
    this.isGameOver = false;
    this.moves = [];
    this.init(size);
  }

  private init(size: number): void {
    this.board = this.createSolvedBoard(size);
    this.emptyPos = { row: size - 1, col: size - 1 };
    this.moveCount = 0;
    this.isSolved = false;
    this.isGameOver = false;
    this.moves = [];
  }

  private createSolvedBoard(size: number): number[][] {
    const board: number[][] = [];
    let num = 1;
    for (let i = 0; i < size; i++) {
      board[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === size - 1 && j === size - 1) {
          board[i][j] = 0;
        } else {
          board[i][j] = num++;
        }
      }
    }
    return board;
  }

  getState(): NumberPuzzleState {
    return {
      board: this.board.map(row => [...row]),
      emptyPos: { ...this.emptyPos },
      moveCount: this.moveCount,
      isSolved: this.isSolved,
      isGameOver: this.isGameOver,
      moves: [...this.moves]
    };
  }

  reset(): void {
    this.init(4);
    this.shuffle(100);
  }

  shuffle(moves: number = 100): void {
    for (let i = 0; i < moves; i++) {
      const possibleMoves = this.getPossibleMoves();
      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      this.swapWithEmpty(randomMove.row, randomMove.col);
    }
    this.moveCount = 0;
    this.isSolved = false;
    this.isGameOver = false;
  }

  private getPossibleMoves(): Position[] {
    const moves: Position[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const newRow = this.emptyPos.row + dr;
      const newCol = this.emptyPos.col + dc;

      if (newRow >= 0 && newRow < this.board.length &&
          newCol >= 0 && newCol < this.board[0].length) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }

  move(row: number, col: number): boolean {
    if (this.isSolved || this.isGameOver) return false;

    if (!this.canMove(row, col)) return false;

    this.moves.push({ row: this.emptyPos.row, col: this.emptyPos.col });
    this.swapWithEmpty(row, col);
    this.moveCount++;

    if (this.checkWin()) {
      this.isSolved = true;
      this.isGameOver = true;
    }

    return true;
  }

  private canMove(row: number, col: number): boolean {
    const dr = Math.abs(row - this.emptyPos.row);
    const dc = Math.abs(col - this.emptyPos.col);

    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  private swapWithEmpty(row: number, col: number): void {
    const temp = this.board[row][col];
    this.board[row][col] = this.board[this.emptyPos.row][this.emptyPos.col];
    this.board[this.emptyPos.row][this.emptyPos.col] = temp;

    this.emptyPos = { row, col };
  }

  private checkWin(): boolean {
    const size = this.board.length;
    let expected = 1;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === size - 1 && j === size - 1) {
          if (this.board[i][j] !== 0) return false;
        } else {
          if (this.board[i][j] !== expected) return false;
          expected++;
        }
      }
    }

    return true;
  }

  getCellAt(row: number, col: number): number {
    if (row < 0 || row >= this.board.length ||
        col < 0 || col >= this.board[0].length) {
      return -1;
    }
    return this.board[row][col];
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawBoard(ctx);
    this.drawTiles(ctx);
    this.drawEmpty(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 400, 440);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 440);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const cellSize = 100;
    const gap = 4;
    const boardSize = this.board.length;
    const totalSize = boardSize * cellSize + (boardSize - 1) * gap;
    const offsetX = (400 - totalSize) / 2;
    const offsetY = (440 - totalSize - 30) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(offsetX - 10, offsetY - 10, totalSize + 20, totalSize + 20, 16);
    ctx.fill();
  }

  private drawTiles(ctx: CanvasRenderingContext2D): void {
    const cellSize = 100;
    const gap = 4;
    const boardSize = this.board.length;
    const totalSize = boardSize * cellSize + (boardSize - 1) * gap;
    const offsetX = (400 - totalSize) / 2;
    const offsetY = (440 - totalSize - 30) / 2;

    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const value = this.board[i][j];
        if (value === 0) continue;

        const x = offsetX + j * (cellSize + gap);
        const y = offsetY + i * (cellSize + gap);

        this.drawTile(ctx, x, y, cellSize, value);
      }
    }
  }

  private drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, value: number): void {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 12);
    ctx.fill();

    const gradient = ctx.createLinearGradient(x, y, x, y + size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 12);
    ctx.stroke();

    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toString(), x + size / 2, y + size / 2);
    ctx.shadowBlur = 0;
  }

  private drawEmpty(ctx: CanvasRenderingContext2D): void {
    const cellSize = 100;
    const gap = 4;
    const boardSize = this.board.length;
    const totalSize = boardSize * cellSize + (boardSize - 1) * gap;
    const offsetX = (400 - totalSize) / 2;
    const offsetY = (440 - totalSize - 30) / 2;

    const x = offsetX + this.emptyPos.col * (cellSize + gap);
    const y = offsetY + this.emptyPos.row * (cellSize + gap);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, cellSize, cellSize, 12);
    ctx.fill();
  }

  private drawWinEffect(ctx: CanvasRenderingContext2D): void {
    const cellSize = 100;
    const gap = 4;
    const boardSize = this.board.length;
    const totalSize = boardSize * cellSize + (boardSize - 1) * gap;
    const offsetX = (400 - totalSize) / 2;
    const offsetY = (440 - totalSize - 30) / 2;

    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.beginPath();
    ctx.roundRect(offsetX - 10, offsetY - 10, totalSize + 20, totalSize + 20, 16);
    ctx.fill();

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(offsetX - 10, offsetY - 10, totalSize + 20, totalSize + 20, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
