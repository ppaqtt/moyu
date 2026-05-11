// Typing Advance Game Engine - 打字进阶游戏引擎

export interface TextItem {
  id: string;
  text: string;
  category: 'programming' | 'poetry' | 'speech' | 'classic';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  errorChars: number;
  totalTime: number;
}

export interface GameState {
  currentText: string;
  userInput: string;
  currentIndex: number;
  startTime: number | null;
  endTime: number | null;
  totalChars: number;
  correctChars: number;
  errorChars: number;
  isComplete: boolean;
  gameOver: boolean;
  wpm: number;
  accuracy: number;
  mode: 'challenge' | 'endless';
  level: number;
  score: number;
}

// Advanced Text Database
export const TEXT_DATABASE: TextItem[] = [
  { id: 'p1', text: 'function hello() { console.log("Hello, World!"); }', category: 'programming', difficulty: 'easy' },
  { id: 'p2', text: 'const numbers = [1, 2, 3, 4, 5]; const doubled = numbers.map(n => n * 2);', category: 'programming', difficulty: 'medium' },
  { id: 'p3', text: 'class Person { constructor(name) { this.name = name; } greet() { return `Hello, ${this.name}!`; } }', category: 'programming', difficulty: 'hard' },
  { id: 'po1', text: 'To be, or not to be, that is the question.', category: 'poetry', difficulty: 'easy' },
  { id: 'po2', text: 'Some say the world will end in fire, Some say in ice.', category: 'poetry', difficulty: 'medium' },
  { id: 'po3', text: 'I am the master of my fate, I am the captain of my soul.', category: 'poetry', difficulty: 'hard' },
  { id: 's1', text: 'I have a dream that one day this nation will rise up.', category: 'speech', difficulty: 'easy' },
  { id: 's2', text: 'Ask not what your country can do for you, ask what you can do for your country.', category: 'speech', difficulty: 'medium' },
  { id: 's3', text: 'Four score and seven years ago our fathers brought forth on this continent.', category: 'speech', difficulty: 'hard' },
  { id: 'c1', text: 'It was the best of times, it was the worst of times.', category: 'classic', difficulty: 'easy' },
  { id: 'c2', text: 'Call me Ishmael. Some years ago—never mind how long precisely.', category: 'classic', difficulty: 'medium' },
  { id: 'c3', text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune.', category: 'classic', difficulty: 'hard' },
];

export class TypingAdvanceEngine {
  private currentText: string = '';
  private userInput: string = '';
  private currentIndex: number = 0;
  private startTime: number | null = null;
  private endTime: number | null = null;
  private totalChars: number = 0;
  private correctChars: number = 0;
  private errorChars: number = 0;
  private isComplete: boolean = false;
  private gameOver: boolean = false;
  private wpm: number = 0;
  private accuracy: number = 100;
  private mode: 'challenge' | 'endless' = 'challenge';
  private level: number = 1;
  private score: number = 0;
  private usedTextIds: Set<string> = new Set();
  private difficulty: 'easy' | 'medium' | 'hard' = 'easy';

  constructor(mode: 'challenge' | 'endless' = 'challenge', difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
    this.mode = mode;
    this.difficulty = difficulty;
    this.reset();
  }

  public reset(): void {
    this.currentText = '';
    this.userInput = '';
    this.currentIndex = 0;
    this.startTime = null;
    this.endTime = null;
    this.totalChars = 0;
    this.correctChars = 0;
    this.errorChars = 0;
    this.isComplete = false;
    this.gameOver = false;
    this.wpm = 0;
    this.accuracy = 100;
    this.level = 1;
    this.score = 0;
    this.usedTextIds.clear();
    this.selectNextText();
  }

  private selectNextText(): void {
    // Filter available texts
    let available = TEXT_DATABASE.filter(t => 
      !this.usedTextIds.has(t.id) && 
      (this.difficulty === 'easy' ? t.difficulty === 'easy' : 
       this.difficulty === 'medium' ? t.difficulty !== 'hard' : true)
    );
    
    if (available.length === 0) {
      this.usedTextIds.clear();
      available = TEXT_DATABASE.filter(t => 
        this.difficulty === 'easy' ? t.difficulty === 'easy' : 
        this.difficulty === 'medium' ? t.difficulty !== 'hard' : true
      );
    }
    
    const selected = available[Math.floor(Math.random() * available.length)];
    this.currentText = selected.text;
    this.usedTextIds.add(selected.id);
    this.userInput = '';
    this.currentIndex = 0;
    this.isComplete = false;
  }

  public start(): void {
    if (!this.startTime) {
      this.startTime = Date.now();
    }
  }

  public end(): void {
    if (!this.endTime) {
      this.endTime = Date.now();
      this.isComplete = true;
      this.calculateStats();
      
      if (this.mode === 'challenge') {
        this.gameOver = true;
      }
    }
  }

  private calculateStats(): void {
    if (!this.startTime) return;
    
    const end = this.endTime || Date.now();
    const elapsedMinutes = (end - this.startTime) / 1000 / 60;
    
    if (elapsedMinutes > 0) {
      this.wpm = Math.round(this.correctChars / 5 / elapsedMinutes);
    }
    
    const totalTyped = this.correctChars + this.errorChars;
    this.accuracy = totalTyped > 0 ? Math.round((this.correctChars / totalTyped) * 100) : 100;
  }

  public inputKey(key: string): void {
    if (this.isComplete || this.gameOver) return;
    
    if (!this.startTime) {
      this.start();
    }
    
    if (this.currentIndex >= this.currentText.length) {
      this.handleTextComplete();
      return;
    }
    
    const expectedChar = this.currentText[this.currentIndex];
    const isCorrect = key === expectedChar;
    
    if (isCorrect) {
      this.correctChars++;
    } else {
      this.errorChars++;
    }
    
    this.userInput += key;
    this.currentIndex++;
    
    // Check if text is complete
    if (this.currentIndex >= this.currentText.length) {
      this.handleTextComplete();
    }
    
    this.calculateStats();
  }

  private handleTextComplete(): void {
    // Calculate score for this text
    this.isComplete = true;
    const basePoints = this.difficulty === 'easy' ? 50 : 
                      this.difficulty === 'medium' ? 100 : 200;
    const accuracyBonus = Math.max(0, Math.round(this.accuracy - 80) * 2);
    this.score += basePoints + accuracyBonus;
    
    // Increment level
    this.level++;
    
    if (this.mode === 'endless') {
      // In endless mode, select next text
      setTimeout(() => {
        this.selectNextText();
        this.isComplete = false;
      }, 1500);
    } else {
      this.end();
    }
  }

  public deleteChar(): void {
    if (this.currentIndex > 0 && !this.isComplete) {
      this.currentIndex--;
      this.userInput = this.userInput.slice(0, -1);
    }
  }

  public getState(): GameState {
    return {
      currentText: this.currentText,
      userInput: this.userInput,
      currentIndex: this.currentIndex,
      startTime: this.startTime,
      endTime: this.endTime,
      totalChars: this.currentText.length,
      correctChars: this.correctChars,
      errorChars: this.errorChars,
      isComplete: this.isComplete,
      gameOver: this.gameOver,
      wpm: this.wpm,
      accuracy: this.accuracy,
      mode: this.mode,
      level: this.level,
      score: this.score,
    };
  }

  public setMode(mode: 'challenge' | 'endless'): void {
    this.mode = mode;
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }

  public getStats(): TypingStats {
    const end = this.endTime || Date.now();
    const totalTime = this.startTime ? (end - this.startTime) / 1000 : 0;
    return {
      wpm: this.wpm,
      accuracy: this.accuracy,
      correctChars: this.correctChars,
      errorChars: this.errorChars,
      totalTime: totalTime,
    };
  }
}