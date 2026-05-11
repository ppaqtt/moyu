
export type Operation = '+' | '-' | '×' | '÷';

export interface SpeedMathProblem {
  id: number;
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  options: number[];
}

export interface GameState {
  score: number;
  streak: number;
  maxStreak: number;
  problemsSolved: number;
  timeLeft: number;
  isPlaying: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  currentProblem: SpeedMathProblem | null;
  gameMode: 'timed' | 'endless';
}

export class SpeedMathEngine {
  private score: number = 0;
  private streak: number = 0;
  private maxStreak: number = 0;
  private problemsSolved: number = 0;
  private timeLeft: number = 60;
  private isPlaying: boolean = false;
  private difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  private currentProblem: SpeedMathProblem | null = null;
  private gameMode: 'timed' | 'endless' = 'timed';
  private timer: number | null = null;
  private onTimeUpdate: ((time: number) =&gt; void) | null = null;

  constructor() {}

  setTimeUpdateCallback(callback: (time: number) =&gt; void) {
    this.onTimeUpdate = callback;
  }

  startGame(difficulty: 'easy' | 'medium' | 'hard', mode: 'timed' | 'endless') {
    this.difficulty = difficulty;
    this.gameMode = mode;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.problemsSolved = 0;
    this.timeLeft = mode === 'timed' ? 60 : 0;
    this.isPlaying = true;
    this.generateProblem();
    
    if (mode === 'timed') {
      this.startTimer();
    }
  }

  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = window.setInterval(() =&gt; {
      this.timeLeft--;
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.timeLeft);
      }
      if (this.timeLeft &lt;= 0) {
        this.endGame();
      }
    }, 1000);
  }

  private endGame() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  stopGame() {
    this.endGame();
  }

  private getOperation(difficulty: 'easy' | 'medium' | 'hard'): Operation {
    const easyOps: Operation[] = ['+', '-'];
    const mediumOps: Operation[] = ['+', '-', '×'];
    const hardOps: Operation[] = ['+', '-', '×', '÷'];
    
    const ops = difficulty === 'easy' ? easyOps : 
                difficulty === 'medium' ? mediumOps : hardOps;
    
    return ops[Math.floor(Math.random() * ops.length)];
  }

  private getNumberRange(difficulty: 'easy' | 'medium' | 'hard'): { min: number; max: number } {
    switch (difficulty) {
      case 'easy':
        return { min: 1, max: 10 };
      case 'medium':
        return { min: 5, max: 25 };
      case 'hard':
        return { min: 10, max: 50 };
    }
  }

  private generateProblem() {
    const operation = this.getOperation(this.difficulty);
    const range = this.getNumberRange(this.difficulty);
    let num1: number, num2: number, answer: number;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min + range.min;
        num2 = Math.floor(Math.random() * (num1 - range.min + 1)) + range.min;
        answer = num1 - num2;
        break;
      case '×':
        const mulMax = this.difficulty === 'easy' ? 10 : this.difficulty === 'medium' ? 12 : 15;
        num1 = Math.floor(Math.random() * (mulMax - 2 + 1)) + 2;
        num2 = Math.floor(Math.random() * (mulMax - 2 + 1)) + 2;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer;
        break;
      default:
        num1 = 0;
        num2 = 0;
        answer = 0;
    }

    const options = this.generateOptions(answer, operation);
    this.currentProblem = {
      id: Date.now(),
      num1,
      num2,
      operation,
      answer,
      options
    };
  }

  private generateOptions(correctAnswer: number, operation: Operation): number[] {
    const options = new Set&lt;number&gt;();
    options.add(correctAnswer);
    
    while (options.size &lt; 4) {
      let wrongAnswer: number;
      const variation = Math.floor(Math.random() * 10) + 1;
      
      if (operation === '×' || operation === '÷') {
        wrongAnswer = correctAnswer + (Math.random() &gt; 0.5 ? variation : -variation);
        if (wrongAnswer &lt; 0) wrongAnswer = correctAnswer + variation;
      } else {
        wrongAnswer = correctAnswer + (Math.random() &gt; 0.5 ? variation : -variation);
        if (wrongAnswer &lt; 0) wrongAnswer = correctAnswer + variation;
      }
      
      options.add(wrongAnswer);
    }
    
    return Array.from(options).sort(() =&gt; Math.random() - 0.5);
  }

  submitAnswer(selectedAnswer: number): { isCorrect: boolean; points: number } {
    if (!this.currentProblem || !this.isPlaying) {
      return { isCorrect: false, points: 0 };
    }

    const isCorrect = selectedAnswer === this.currentProblem.answer;
    let points = 0;

    if (isCorrect) {
      this.streak++;
      if (this.streak &gt; this.maxStreak) {
        this.maxStreak = this.streak;
      }
      this.problemsSolved++;
      
      const basePoints = this.difficulty === 'easy' ? 10 : 
                        this.difficulty === 'medium' ? 20 : 30;
      const streakBonus = Math.min(this.streak * 2, 20);
      points = basePoints + streakBonus;
      this.score += points;

      if (this.gameMode === 'endless') {
        this.timeLeft += this.difficulty === 'easy' ? 3 : 
                         this.difficulty === 'medium' ? 2 : 1;
        if (this.onTimeUpdate) {
          this.onTimeUpdate(this.timeLeft);
        }
      }

      this.generateProblem();
    } else {
      this.streak = 0;
    }

    return { isCorrect, points };
  }

  getState(): GameState {
    return {
      score: this.score,
      streak: this.streak,
      maxStreak: this.maxStreak,
      problemsSolved: this.problemsSolved,
      timeLeft: this.timeLeft,
      isPlaying: this.isPlaying,
      difficulty: this.difficulty,
      currentProblem: this.currentProblem,
      gameMode: this.gameMode
    };
  }
}
