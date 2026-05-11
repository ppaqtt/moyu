
export interface SudokuCell {
  value: number;
  isGiven: boolean;
  isError: boolean;
  isSelected: boolean;
  region: number;
}

export type SudokuVariant = 'standard' | 'diagonal' | 'jigsaw';

export interface GameState {
  board: SudokuCell[][];
  selectedCell: { row: number; col: number } | null;
  mistakes: number;
  hints: number;
  isComplete: boolean;
  variant: SudokuVariant;
  difficulty: 'easy' | 'medium' | 'hard';
}

const BOARD_SIZE = 9;
const BOX_SIZE = 3;

const JIGSAW_REGIONS = [
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 0, 1, 1, 2, 2, 2, 2],
  [0, 3, 3, 3, 1, 1, 1, 2, 2],
  [3, 3, 3, 4, 4, 4, 5, 5, 2],
  [3, 3, 4, 4, 4, 5, 5, 5, 5],
  [6, 3, 4, 4, 7, 5, 5, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 7, 7, 7, 8, 8, 8, 8],
  [6, 6, 6, 7, 7, 8, 8, 8, 8]
];

export class SudokuVariantsEngine {
  private board: SudokuCell[][];
  private solution: number[][];
  private selectedCell: { row: number; col: number } | null;
  private mistakes: number;
  private hints: number;
  private isComplete: boolean;
  private variant: SudokuVariant;
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(variant: SudokuVariant = 'standard', difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
    this.board = [];
    this.solution = [];
    this.selectedCell = null;
    this.mistakes = 0;
    this.hints = 3;
    this.isComplete = false;
    this.variant = variant;
    this.difficulty = difficulty;
    this.init();
  }

  init(): void {
    this.board = Array(BOARD_SIZE).fill(null).map(() =&gt;
      Array(BOARD_SIZE).fill(null).map(() =&gt; ({
        value: 0,
        isGiven: false,
        isError: false,
        isSelected: false,
        region: 0
      }))
    );
    this.solution = Array(BOARD_SIZE).fill(null).map(() =&gt; Array(BOARD_SIZE).fill(0));
    this.selectedCell = null;
    this.mistakes = 0;
    this.hints = 3;
    this.isComplete = false;
    this.generatePuzzle();
  }

  setVariant(variant: SudokuVariant): void {
    this.variant = variant;
    this.init();
  }

  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    this.init();
  }

  private generatePuzzle(): void {
    this.fillBoard(this.solution);

    const puzzle = this.solution.map(row =&gt; [...row]);
    const cellsToRemove = this.getCellsToRemove();

    const positions: { row: number; col: number }[] = [];
    for (let r = 0; r &lt; BOARD_SIZE; r++) {
      for (let c = 0; c &lt; BOARD_SIZE; c++) {
        positions.push({ row: r, col: c });
      }
    }

    for (let i = positions.length - 1; i &gt; 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removed = 0;
    for (const pos of positions) {
      if (removed &gt;= cellsToRemove) break;
      puzzle[pos.row][pos.col] = 0;
      removed++;
    }

    for (let r = 0; r &lt; BOARD_SIZE; r++) {
      for (let c = 0; c &lt; BOARD_SIZE; c++) {
        this.board[r][c] = {
          value: puzzle[r][c],
          isGiven: puzzle[r][c] !== 0,
          isError: false,
          isSelected: false,
          region: this.getRegion(r, c)
        };
      }
    }
  }

  private getCellsToRemove(): number {
    switch (this.difficulty) {
      case 'easy': return 30;
      case 'medium': return 45;
      case 'hard': return 55;
    }
  }

  private getRegion(row: number, col: number): number {
    if (this.variant === 'jigsaw') {
      return JIGSAW_REGIONS[row][col];
    }
    return Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
  }

  private fillBoard(board: number[][]): boolean {
    const emptyCell = this.findEmpty(board);
    if (!emptyCell) return true;

    const { row, col } = emptyCell;
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) {
      if (this.isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        if (this.fillBoard(board)) return true;
        board[row][col] = 0;
      }
    }

    return false;
  }

  private findEmpty(board: number[][]): { row: number; col: number } | null {
    for (let r = 0; r &lt; BOARD_SIZE; r++) {
      for (let c = 0; c &lt; BOARD_SIZE; c++) {
        if (board[r][c] === 0) return { row: r, col: c };
      }
    }
    return null;
  }

  private isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
    for (let c = 0; c &lt; BOARD_SIZE; c++) {
      if (board[row][c] === num) return false;
    }

    for (let r = 0; r &lt; BOARD_SIZE; r++) {
      if (board[r][col] === num) return false;
    }

    if (this.variant === 'jigsaw') {
      const targetRegion = JIGSAW_REGIONS[row][col];
      for (let r = 0; r &lt; BOARD_SIZE; r++) {
        for (let c = 0; c &lt; BOARD_SIZE; c++) {
          if (JIGSAW_REGIONS[r][c] === targetRegion &amp;&amp; board[r][c] === num) {
            return false;
          }
        }
      }
    } else {
      const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
      const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
      for (let r = boxRow; r &lt; boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c &lt; boxCol + BOX_SIZE; c++) {
          if (board[r][c] === num) return false;
        }
      }
    }

    if (this.variant === 'diagonal') {
      if (row === col) {
        for (let i = 0; i &lt; BOARD_SIZE; i++) {
          if (board[i][i] === num) return false;
        }
      }
      if (row + col === BOARD_SIZE - 1) {
        for (let i = 0; i &lt; BOARD_SIZE; i++) {
          if (board[i][BOARD_SIZE - 1 - i] === num) return false;
        }
      }
    }

    return true;
  }

  private shuffleArray&lt;T&gt;(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i &gt; 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getState(): GameState {
    return {
      board: this.board.map(row =&gt; row.map(cell =&gt; ({ ...cell }))),
      selectedCell: this.selectedCell ? { ...this.selectedCell } : null,
      mistakes: this.mistakes,
      hints: this.hints,
      isComplete: this.isComplete,
      variant: this.variant,
      difficulty: this.difficulty
    };
  }

  selectCell(row: number, col: number): void {
    if (this.isComplete) return;

    if (this.selectedCell) {
      this.board[this.selectedCell.row][this.selectedCell.col].isSelected = false;
    }

    this.selectedCell = { row, col };
    this.board[row][col].isSelected = true;
  }

  enterNumber(num: number): void {
    if (!this.selectedCell || this.isComplete) return;

    const { row, col } = this.selectedCell;
    if (this.board[row][col].isGiven) return;

    if (num === 0) {
      this.board[row][col].value = 0;
      this.board[row][col].isError = false;
      return;
    }

    if (this.solution[row][col] === num) {
      this.board[row][col].value = num;
      this.board[row][col].isError = false;
      this.clearErrors();
      this.checkComplete();
    } else {
      this.board[row][col].isError = true;
      this.mistakes++;
      if (this.mistakes &gt;= 3) {
        this.isComplete = true;
      }
    }
  }

  useHint(): boolean {
    if (!this.selectedCell || this.hints &lt;= 0 || this.isComplete) return false;

    const { row, col } = this.selectedCell;
    if (this.board[row][col].isGiven) return false;

    this.board[row][col].value = this.solution[row][col];
    this.board[row][col].isError = false;
    this.hints--;
    this.clearErrors();
    this.checkComplete();

    return true;
  }

  private clearErrors(): void {
    for (let r = 0; r &lt; BOARD_SIZE; r++) {
      for (let c = 0; c &lt; BOARD_SIZE; c++) {
        if (this.board[r][c].value === this.solution[r][c]) {
          this.board[r][c].isError = false;
        }
      }
    }
  }

  private checkComplete(): void {
    for (let r = 0; r &lt; BOARD_SIZE; r++) {
      for (let c = 0; c &lt; BOARD_SIZE; c++) {
        if (this.board[r][c].value !== this.solution[r][c]) {
          return;
        }
      }
    }
    this.isComplete = true;
  }

  reset(): void {
    this.init();
  }
}
