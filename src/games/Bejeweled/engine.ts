export interface Position {
  row: number;
  col: number;
}

export interface Gem {
  type: number;
  isSelected: boolean;
  isMatched: boolean;
  isNew: boolean;
}

export interface GameBejeweledState {
  board: Gem[][];
  score: number;
  combo: number;
  isGameOver: boolean;
  level: number;
  targetScore: number;
}

const GEM_TYPES = 7;
const BOARD_SIZE = 8;

const GEM_ICONS = ['💎', '💠', '🔮', '💜', '💛', '🟡', '🔶'];
const GEM_COLORS = ['#3498db', '#00f5ff', '#9b59b6', '#8e44ad', '#f1c40f', '#f39c12', '#e67e22'];

export class GameBejeweledEngine {
  private board: Gem[][];
  private score: number;
  private combo: number;
  private isGameOver: boolean;
  private level: number;
  private targetScore: number;
  private onStateChange?: () => void;

  constructor(onStateChange?: () => void) {
    this.board = [];
    this.score = 0;
    this.combo = 0;
    this.isGameOver = false;
    this.level = 1;
    this.targetScore = 1000;
    this.onStateChange = onStateChange;
    this.init();
  }

  setOnStateChange(callback: () => void): void {
    this.onStateChange = callback;
  }

  init(): void {
    this.board = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      this.board[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        let type: number;
        do {
          type = Math.floor(Math.random() * GEM_TYPES);
        } while (this.wouldMatch(r, c, type));
        
        this.board[r][c] = {
          type,
          isSelected: false,
          isMatched: false,
          isNew: true
        };
      }
    }
    this.score = 0;
    this.combo = 0;
    this.isGameOver = false;
  }

  private wouldMatch(row: number, col: number, type: number): boolean {
    if (col >= 2) {
      if (this.board[row][col - 1]?.type === type && 
          this.board[row][col - 2]?.type === type) {
        return true;
      }
    }
    if (row >= 2) {
      if (this.board[row - 1]?.[col]?.type === type && 
          this.board[row - 2]?.[col]?.type === type) {
        return true;
      }
    }
    return false;
  }

  getState(): GameBejeweledState {
    return {
      board: this.board.map(row => row.map(gem => ({ ...gem }))),
      score: this.score,
      combo: this.combo,
      isGameOver: this.isGameOver,
      level: this.level,
      targetScore: this.targetScore
    };
  }

  selectGem(row: number, col: number): boolean {
    if (this.isGameOver) return false;

    const gem = this.board[row][col];
    
    const selectedGem = this.findSelectedGem();
    if (selectedGem) {
      const { row: selRow, col: selCol } = selectedGem;
      
      if (selRow === row && selCol === col) {
        this.board[selRow][selCol].isSelected = false;
        this.onStateChange?.();
        return false;
      }

      const isAdjacent = 
        (Math.abs(selRow - row) === 1 && selCol === col) ||
        (Math.abs(selCol - col) === 1 && selRow === row);

      if (isAdjacent) {
        this.board[selRow][selCol].isSelected = false;
        return this.swapGems(selRow, selCol, row, col);
      } else {
        this.board[selRow][selCol].isSelected = false;
        gem.isSelected = true;
        this.onStateChange?.();
        return false;
      }
    }

    gem.isSelected = true;
    this.onStateChange?.();
    return false;
  }

  private findSelectedGem(): Position | null {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.board[r][c].isSelected) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  private swapGems(row1: number, col1: number, row2: number, col2: number): boolean {
    const temp = this.board[row1][col1].type;
    this.board[row1][col1].type = this.board[row2][col2].type;
    this.board[row2][col2].type = temp;

    const matches = this.findMatches();
    if (matches.length > 0) {
      this.combo = 0;
      this.processMatches(matches);
      return true;
    }

    this.board[row1][col1].type = this.board[row2][col2].type;
    this.board[row2][col2].type = temp;
    this.onStateChange?.();
    return false;
  }

  private findMatches(): Position[] {
    const matches: Position[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const type = this.board[r][c].type;
        if (type !== -1 && 
            type === this.board[r][c + 1].type && 
            type === this.board[r][c + 2].type) {
          let end = c + 2;
          while (end < BOARD_SIZE - 1 && this.board[r][end + 1].type === type) {
            end++;
          }
          for (let i = c; i <= end; i++) {
            if (!matches.some(m => m.row === r && m.col === i)) {
              matches.push({ row: r, col: i });
            }
          }
        }
      }
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        const type = this.board[r][c].type;
        if (type !== -1 && 
            type === this.board[r + 1][c].type && 
            type === this.board[r + 2][c].type) {
          let end = r + 2;
          while (end < BOARD_SIZE - 1 && this.board[end + 1][c].type === type) {
            end++;
          }
          for (let i = r; i <= end; i++) {
            if (!matches.some(m => m.row === i && m.col === c)) {
              matches.push({ row: i, col: c });
            }
          }
        }
      }
    }

    return matches;
  }

  private processMatches(matches: Position[]): void {
    this.combo++;
    const baseScore = matches.length * 10;
    const comboBonus = Math.pow(2, this.combo - 1);
    this.score += baseScore * comboBonus;

    for (const pos of matches) {
      this.board[pos.row][pos.col].isMatched = true;
      this.board[pos.row][pos.col].type = -1;
    }

    if (this.score >= this.targetScore) {
      this.level++;
      this.targetScore = Math.floor(this.targetScore * 1.5);
    }

    this.dropGems();
    this.fillBoard();

    const newMatches = this.findMatches();
    if (newMatches.length > 0) {
      setTimeout(() => this.processMatches(newMatches), 300);
    }

    this.onStateChange?.();
  }

  private dropGems(): void {
    for (let c = 0; c < BOARD_SIZE; c++) {
      let writeRow = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (this.board[r][c].type !== -1) {
          if (writeRow !== r) {
            this.board[writeRow][c].type = this.board[r][c].type;
            this.board[r][c].type = -1;
            this.board[writeRow][c].isNew = true;
          }
          writeRow--;
        }
      }
    }
  }

  private fillBoard(): void {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (this.board[r][c].type === -1) {
          let type: number;
          do {
            type = Math.floor(Math.random() * GEM_TYPES);
          } while (this.wouldFillMatch(r, c, type));
          
          this.board[r][c].type = type;
          this.board[r][c].isMatched = false;
          this.board[r][c].isNew = true;
        }
      }
    }
  }

  private wouldFillMatch(row: number, col: number, type: number): boolean {
    if (col >= 2) {
      if (this.board[row][col - 1]?.type === type && 
          this.board[row][col - 2]?.type === type) {
        return true;
      }
    }
    if (col <= BOARD_SIZE - 3) {
      if (this.board[row][col + 1]?.type === type && 
          this.board[row][col + 2]?.type === type) {
        return true;
      }
    }
    if (row >= 2) {
      if (this.board[row - 1]?.[col]?.type === type && 
          this.board[row - 2]?.[col]?.type === type) {
        return true;
      }
    }
    if (row <= BOARD_SIZE - 3) {
      if (this.board[row + 1]?.[col]?.type === type && 
          this.board[row + 2]?.[col]?.type === type) {
        return true;
      }
    }
    return false;
  }

  hasValidMoves(): boolean {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (c < BOARD_SIZE - 1) {
          const temp = this.board[r][c].type;
          this.board[r][c].type = this.board[r][c + 1].type;
          this.board[r][c + 1].type = temp;
          
          if (this.findMatches().length > 0) {
            this.board[r][c + 1].type = this.board[r][c].type;
            this.board[r][c].type = temp;
            return true;
          }
          
          this.board[r][c + 1].type = this.board[r][c].type;
          this.board[r][c].type = temp;
        }
        
        if (r < BOARD_SIZE - 1) {
          const temp = this.board[r][c].type;
          this.board[r][c].type = this.board[r + 1][c].type;
          this.board[r + 1][c].type = temp;
          
          if (this.findMatches().length > 0) {
            this.board[r + 1][c].type = this.board[r][c].type;
            this.board[r][c].type = temp;
            return true;
          }
          
          this.board[r + 1][c].type = this.board[r][c].type;
          this.board[r][c].type = temp;
        }
      }
    }
    return false;
  }

  reset(): void {
    this.init();
  }
}
