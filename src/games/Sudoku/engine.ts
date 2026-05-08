export interface SudokuCell {
  value: number;
  isGiven: boolean;
  isError: boolean;
  isSelected: boolean;
  notes: number[];
}

export interface GameSudokuState {
  board: SudokuCell[][];
  selectedCell: { row: number; col: number } | null;
  mistakes: number;
  hints: number;
  isComplete: boolean;
  isPaused: boolean;
}

const BOARD_SIZE = 9;
const BOX_SIZE = 3;

export class GameSudokuEngine {
  private board: SudokuCell[][];
  private solution: number[][];
  private selectedCell: { row: number; col: number } | null;
  private mistakes: number;
  private hints: number;
  private isComplete: boolean;
  private isPaused: boolean;
  private difficulty: number;

  constructor(difficulty: number = 0) {
    this.board = [];
    this.solution = [];
    this.selectedCell = null;
    this.mistakes = 0;
    this.hints = 3;
    this.isComplete = false;
    this.isPaused = false;
    this.difficulty = difficulty;
    this.init();
  }

  init(): void {
    this.board = Array(BOARD_SIZE).fill(null).map(() =>
      Array(BOARD_SIZE).fill(null).map(() => ({
        value: 0,
        isGiven: false,
        isError: false,
        isSelected: false,
        notes: []
      }))
    );
    this.solution = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    this.selectedCell = null;
    this.mistakes = 0;
    this.hints = 3;
    this.isComplete = false;
    this.generatePuzzle();
  }

  private generatePuzzle(): void {
    this.fillBoard(this.solution);

    const puzzle = this.solution.map(row => [...row]);
    const cellsToRemove = [30, 45, 55][this.difficulty];

    let removed = 0;
    const positions: { row: number; col: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        positions.push({ row: r, col: c });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (const pos of positions) {
      if (removed >= cellsToRemove) break;
      puzzle[pos.row][pos.col] = 0;
      removed++;
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        this.board[r][c] = {
          value: puzzle[r][c],
          isGiven: puzzle[r][c] !== 0,
          isError: false,
          isSelected: false,
          notes: []
        };
      }
    }
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
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === 0) return { row: r, col: c };
      }
    }
    return null;
  }

  private isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[row][c] === num) return false;
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[r][col] === num) return false;
    }

    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
        if (board[r][c] === num) return false;
      }
    }

    return true;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getState(): GameSudokuState {
    return {
      board: this.board.map(row => row.map(cell => ({ ...cell }))),
      selectedCell: this.selectedCell ? { ...this.selectedCell } : null,
      mistakes: this.mistakes,
      hints: this.hints,
      isComplete: this.isComplete,
      isPaused: this.isPaused
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
      this.board[row][col].notes = [];
      return;
    }

    if (this.solution[row][col] === num) {
      this.board[row][col].value = num;
      this.board[row][col].isError = false;
      this.board[row][col].notes = [];
      this.clearErrors();
      this.checkComplete();
    } else {
      this.board[row][col].isError = true;
      this.mistakes++;
      if (this.mistakes >= 3) {
        this.isComplete = true;
      }
    }
  }

  toggleNote(num: number): void {
    if (!this.selectedCell || this.isComplete) return;

    const { row, col } = this.selectedCell;
    if (this.board[row][col].isGiven || this.board[row][col].value !== 0) return;

    const notes = this.board[row][col].notes;
    const index = notes.indexOf(num);
    if (index === -1) {
      notes.push(num);
    } else {
      notes.splice(index, 1);
    }
    this.board[row][col].notes = [...notes];
  }

  useHint(): boolean {
    if (!this.selectedCell || this.hints <= 0 || this.isComplete) return false;

    const { row, col } = this.selectedCell;
    if (this.board[row][col].isGiven) return false;

    this.board[row][col].value = this.solution[row][col];
    this.board[row][col].isError = false;
    this.board[row][col].notes = [];
    this.hints--;
    this.clearErrors();
    this.checkComplete();

    return true;
  }

  private clearErrors(): void {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.board[r][c].value === this.solution[r][c]) {
          this.board[r][c].isError = false;
        }
      }
    }
  }

  private checkComplete(): void {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.board[r][c].value !== this.solution[r][c]) {
          return;
        }
      }
    }
    this.isComplete = true;
  }

  setDifficulty(diff: number): void {
    this.difficulty = diff;
    this.init();
  }

  reset(): void {
    this.init();
  }
}
