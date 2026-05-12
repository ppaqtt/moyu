// 英文填字游戏引擎

export interface Cell {
  row: number;
  col: number;
  letter: string;
  isBlack: boolean;
  number?: number;
  isRevealed: boolean;
  userInput: string;
}

export interface Word {
  id: number;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  length: number;
  isCompleted: boolean;
}

export interface GameState {
  grid: Cell[][];
  words: Word[];
  selectedCell: { row: number; col: number } | null;
  selectedDirection: 'across' | 'down';
  score: number;
  hintsUsed: number;
  isComplete: boolean;
  timeElapsed: number;
}

// 英文填字题库
const CROSSWORD_PUZZLES = [
  {
    size: 8,
    words: [
      { word: 'REACT', clue: 'Popular JavaScript library for building UIs', row: 0, col: 0, direction: 'across' as const },
      { word: 'REDUX', clue: 'State management library', row: 2, col: 0, direction: 'across' as const },
      { word: 'HOOKS', clue: 'React feature for using state in functions', row: 4, col: 0, direction: 'across' as const },
      { word: 'PROPS', clue: 'Data passed to components', row: 6, col: 0, direction: 'across' as const },
      { word: 'RENDER', clue: 'To display on screen', row: 0, col: 2, direction: 'down' as const },
      { word: 'EVENT', clue: 'User interaction like click', row: 0, col: 4, direction: 'down' as const },
      { word: 'STATE', clue: 'Component data that can change', row: 2, col: 6, direction: 'down' as const },
      { word: 'ASYNC', clue: 'Non-blocking operation', row: 4, col: 0, direction: 'down' as const },
    ]
  },
  {
    size: 10,
    words: [
      { word: 'JAVASCRIPT', clue: 'Language of the web', row: 0, col: 0, direction: 'across' as const },
      { word: 'HTML', clue: 'Markup language for web pages', row: 2, col: 0, direction: 'across' as const },
      { word: 'CSS', clue: 'Stylesheet language', row: 4, col: 2, direction: 'across' as const },
      { word: 'NODE', clue: 'JavaScript runtime', row: 6, col: 0, direction: 'across' as const },
      { word: 'JSON', clue: 'Data interchange format', row: 8, col: 0, direction: 'across' as const },
      { word: 'JAVA', clue: 'Object-oriented programming language', row: 0, col: 0, direction: 'down' as const },
      { word: 'API', clue: 'Application Programming Interface', row: 0, col: 4, direction: 'down' as const },
      { word: 'HTTP', clue: 'Web protocol', row: 2, col: 2, direction: 'down' as const },
      { word: 'SQL', clue: 'Database query language', row: 4, col: 6, direction: 'down' as const },
      { word: 'URL', clue: 'Web address', row: 6, col: 3, direction: 'down' as const },
    ]
  },
  {
    size: 12,
    words: [
      { word: 'TYPESCRIPT', clue: 'Typed superset of JavaScript', row: 0, col: 0, direction: 'across' as const },
      { word: 'WEBPACK', clue: 'Module bundler', row: 2, col: 0, direction: 'across' as const },
      { word: 'GITHUB', clue: 'Code hosting platform', row: 4, col: 2, direction: 'across' as const },
      { word: 'DOCKER', clue: 'Containerization platform', row: 6, col: 0, direction: 'across' as const },
      { word: 'LINUX', clue: 'Open source operating system', row: 8, col: 0, direction: 'across' as const },
      { word: 'PYTHON', clue: 'Popular programming language', row: 10, col: 0, direction: 'across' as const },
      { word: 'TERMINAL', clue: 'Command line interface', row: 0, col: 0, direction: 'down' as const },
      { word: 'VSCODE', clue: 'Popular code editor', row: 0, col: 4, direction: 'down' as const },
      { word: 'SERVER', clue: 'Computer that provides services', row: 0, col: 8, direction: 'down' as const },
      { word: 'GIT', clue: 'Version control system', row: 4, col: 2, direction: 'down' as const },
      { word: 'CLOUD', clue: 'Internet-based computing', row: 6, col: 6, direction: 'down' as const },
      { word: 'DEBUG', clue: 'Find and fix errors', row: 8, col: 4, direction: 'down' as const },
    ]
  },
  {
    size: 15,
    words: [
      { word: 'PROGRAMMING', clue: 'Writing computer code', row: 0, col: 0, direction: 'across' as const },
      { word: 'ALGORITHM', clue: 'Step-by-step procedure', row: 2, col: 0, direction: 'across' as const },
      { word: 'DATABASE', clue: 'Organized data collection', row: 4, col: 2, direction: 'across' as const },
      { word: 'FRAMEWORK', clue: 'Software development platform', row: 6, col: 0, direction: 'across' as const },
      { word: 'INTERFACE', clue: 'Point of interaction', row: 8, col: 0, direction: 'across' as const },
      { word: 'SECURITY', clue: 'Protection from threats', row: 10, col: 2, direction: 'across' as const },
      { word: 'NETWORK', clue: 'Connected computers', row: 12, col: 0, direction: 'across' as const },
      { word: 'APPLICATION', clue: 'Software program', row: 0, col: 0, direction: 'down' as const },
      { word: 'FUNCTION', clue: 'Reusable code block', row: 0, col: 4, direction: 'down' as const },
      { word: 'VARIABLE', clue: 'Named storage location', row: 0, col: 8, direction: 'down' as const },
      { word: 'COMPILE', clue: 'Convert code to machine language', row: 2, col: 12, direction: 'down' as const },
      { word: 'PACKAGE', clue: 'Software distribution unit', row: 6, col: 6, direction: 'down' as const },
      { word: 'LIBRARY', clue: 'Collection of code', row: 8, col: 2, direction: 'down' as const },
    ]
  }
];

export class CrosswordEngine {
  private grid: Cell[][] = [];
  private words: Word[] = [];
  private gridSize: number = 10;
  private score: number = 0;
  private hintsUsed: number = 0;
  private isComplete: boolean = false;
  private timeElapsed: number = 0;
  private selectedCell: { row: number; col: number } | null = null;
  private selectedDirection: 'across' | 'down' = 'across';
  private timerInterval: number | null = null;
  private currentPuzzleIndex: number = 0;

  constructor(difficulty: number = 1) {
    this.currentPuzzleIndex = Math.min(Math.max(difficulty, 0), CROSSWORD_PUZZLES.length - 1);
    this.reset();
  }

  public reset(): void {
    const puzzle = CROSSWORD_PUZZLES[this.currentPuzzleIndex];
    this.gridSize = puzzle.size;
    this.score = 0;
    this.hintsUsed = 0;
    this.isComplete = false;
    this.timeElapsed = 0;
    this.selectedCell = null;
    this.selectedDirection = 'across';

    // Initialize grid
    this.grid = Array.from({ length: this.gridSize }, (_, row) =>
      Array.from({ length: this.gridSize }, (_, col) => ({
        row,
        col,
        letter: '',
        isBlack: true,
        isRevealed: false,
        userInput: ''
      }))
    );

    // Place words and assign numbers
    this.words = [];
    let wordId = 1;
    const cellNumbers = new Map<string, number>();

    for (const wordData of puzzle.words) {
      const positions: { row: number; col: number }[] = [];
      
      for (let i = 0; i < wordData.word.length; i++) {
        const row = wordData.row + (wordData.direction === 'down' ? i : 0);
        const col = wordData.col + (wordData.direction === 'across' ? i : 0);
        
        if (row < this.gridSize && col < this.gridSize) {
          this.grid[row][col].isBlack = false;
          this.grid[row][col].letter = wordData.word[i];
          positions.push({ row, col });

          // Assign number to first cell of word
          if (i === 0) {
            const key = `${row}-${col}`;
            if (!cellNumbers.has(key)) {
              cellNumbers.set(key, wordId++);
            }
          }
        }
      }

      this.words.push({
        id: cellNumbers.get(`${wordData.row}-${wordData.col}`) || 0,
        word: wordData.word,
        clue: wordData.clue,
        row: wordData.row,
        col: wordData.col,
        direction: wordData.direction,
        length: wordData.word.length,
        isCompleted: false
      });
    }

    // Assign numbers to cells
    for (const [key, num] of cellNumbers) {
      const [row, col] = key.split('-').map(Number);
      this.grid[row][col].number = num;
    }
  }

  public startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = window.setInterval(() => {
      this.timeElapsed++;
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public selectCell(row: number, col: number): void {
    if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) return;
    if (this.grid[row][col].isBlack) return;

    // If clicking same cell, toggle direction
    if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
      this.toggleDirection();
    } else {
      this.selectedCell = { row, col };
    }
  }

  public toggleDirection(): void {
    this.selectedDirection = this.selectedDirection === 'across' ? 'down' : 'across';
  }

  public inputLetter(letter: string): void {
    if (!this.selectedCell || this.isComplete) return;
    
    const cell = this.grid[this.selectedCell.row][this.selectedCell.col];
    if (cell.isRevealed) return;

    cell.userInput = letter.toUpperCase();
    this.checkWordCompletion();
    this.moveToNextCell();
    this.checkGameComplete();
  }

  public deleteLetter(): void {
    if (!this.selectedCell || this.isComplete) return;
    
    const cell = this.grid[this.selectedCell.row][this.selectedCell.col];
    if (cell.isRevealed) return;

    if (cell.userInput) {
      cell.userInput = '';
    } else {
      this.moveToPreviousCell();
    }
    this.checkWordCompletion();
  }

  private moveToNextCell(): void {
    if (!this.selectedCell) return;

    let nextRow = this.selectedCell.row;
    let nextCol = this.selectedCell.col;

    if (this.selectedDirection === 'across') {
      nextCol++;
    } else {
      nextRow++;
    }

    if (nextRow < this.gridSize && nextCol < this.gridSize && !this.grid[nextRow][nextCol].isBlack) {
      this.selectedCell = { row: nextRow, col: nextCol };
    }
  }

  private moveToPreviousCell(): void {
    if (!this.selectedCell) return;

    let prevRow = this.selectedCell.row;
    let prevCol = this.selectedCell.col;

    if (this.selectedDirection === 'across') {
      prevCol--;
    } else {
      prevRow--;
    }

    if (prevRow >= 0 && prevCol >= 0 && !this.grid[prevRow][prevCol].isBlack) {
      this.selectedCell = { row: prevRow, col: prevCol };
    }
  }

  public moveSelection(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this.selectedCell) return;

    let newRow = this.selectedCell.row;
    let newCol = this.selectedCell.col;

    switch (direction) {
      case 'up': newRow--; break;
      case 'down': newRow++; break;
      case 'left': newCol--; break;
      case 'right': newCol++; break;
    }

    if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
      if (!this.grid[newRow][newCol].isBlack) {
        this.selectedCell = { row: newRow, col: newCol };
      }
    }
  }

  private checkWordCompletion(): void {
    for (const word of this.words) {
      let isComplete = true;
      
      for (let i = 0; i < word.length; i++) {
        const row = word.row + (word.direction === 'down' ? i : 0);
        const col = word.col + (word.direction === 'across' ? i : 0);
        const cell = this.grid[row][col];
        
        if (cell.userInput !== word.word[i]) {
          isComplete = false;
          break;
        }
      }

      if (isComplete && !word.isCompleted) {
        word.isCompleted = true;
        this.score += word.length * 10;
      } else if (!isComplete && word.isCompleted) {
        word.isCompleted = false;
        this.score -= word.length * 10;
      }
    }
  }

  private checkGameComplete(): void {
    const allCompleted = this.words.every(w => w.isCompleted);
    if (allCompleted) {
      this.isComplete = true;
      this.stopTimer();
      // Time bonus
      const timeBonus = Math.max(0, 300 - this.timeElapsed) * 2;
      this.score += timeBonus;
    }
  }

  public useHint(): boolean {
    if (!this.selectedCell || this.isComplete) return false;
    
    const cell = this.grid[this.selectedCell.row][this.selectedCell.col];
    if (cell.isRevealed || cell.userInput) return false;

    cell.isRevealed = true;
    cell.userInput = cell.letter;
    this.hintsUsed++;
    this.score = Math.max(0, this.score - 20);
    this.checkWordCompletion();
    this.checkGameComplete();
    return true;
  }

  public revealWord(wordId: number): boolean {
    const word = this.words.find(w => w.id === wordId);
    if (!word || word.isCompleted || this.isComplete) return false;

    for (let i = 0; i < word.length; i++) {
      const row = word.row + (word.direction === 'down' ? i : 0);
      const col = word.col + (word.direction === 'across' ? i : 0);
      const cell = this.grid[row][col];
      
      if (!cell.isRevealed) {
        cell.isRevealed = true;
        cell.userInput = word.word[i];
      }
    }

    this.hintsUsed++;
    this.score = Math.max(0, this.score - word.length * 15);
    word.isCompleted = true;
    this.checkGameComplete();
    return true;
  }

  public getState(): GameState {
    return {
      grid: this.grid.map(row => row.map(cell => ({ ...cell }))),
      words: this.words.map(w => ({ ...w })),
      selectedCell: this.selectedCell,
      selectedDirection: this.selectedDirection,
      score: this.score,
      hintsUsed: this.hintsUsed,
      isComplete: this.isComplete,
      timeElapsed: this.timeElapsed
    };
  }

  public getGrid(): Cell[][] {
    return this.grid.map(row => row.map(cell => ({ ...cell })));
  }

  public getWords(): Word[] {
    return this.words.map(w => ({ ...w }));
  }

  public getSelectedCell(): { row: number; col: number } | null {
    return this.selectedCell;
  }

  public getSelectedDirection(): 'across' | 'down' {
    return this.selectedDirection;
  }

  public getScore(): number {
    return this.score;
  }

  public getHintsUsed(): number {
    return this.hintsUsed;
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public getTimeElapsed(): number {
    return this.timeElapsed;
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public getCurrentClue(): Word | null {
    if (!this.selectedCell) return null;

    // Find word that contains selected cell in current direction
    return this.words.find(w => {
      if (w.direction !== this.selectedDirection) return false;
      
      for (let i = 0; i < w.length; i++) {
        const row = w.row + (w.direction === 'down' ? i : 0);
        const col = w.col + (w.direction === 'across' ? i : 0);
        if (row === this.selectedCell!.row && col === this.selectedCell!.col) {
          return true;
        }
      }
      return false;
    }) || null;
  }

  public getWordsForCell(row: number, col: number): Word[] {
    return this.words.filter(w => {
      for (let i = 0; i < w.length; i++) {
        const r = w.row + (w.direction === 'down' ? i : 0);
        const c = w.col + (w.direction === 'across' ? i : 0);
        if (r === row && c === col) return true;
      }
      return false;
    });
  }
}
