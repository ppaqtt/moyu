export type Operation = '+' | '-' | '*' | '/';

export interface Problem {
  id: number;
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  userAnswer: number | null;
  isCorrect: boolean | null;
}

export interface GameState {
  problems: Problem[];
  currentIndex: number;
  score: number;
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  startTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class MathKidsEngine {
  private problems: Problem[] = [];
  private currentIndex: number = 0;
  private score: number = 0;
  private totalProblems: number;
  private correctCount: number = 0;
  private wrongCount: number = 0;
  private startTime: number = 0;
  private difficulty: 'easy' | 'medium' | 'hard';
  private timeLimit: number = 0;

  constructor(totalProblems: number = 10, difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
    this.totalProblems = totalProblems;
    this.difficulty = difficulty;
    this.timeLimit = this.getTimeLimit(difficulty);
    this.generateProblems();
  }

  private getTimeLimit(diff: 'easy' | 'medium' | 'hard'): number {
    switch (diff) {
      case 'easy': return 30;
      case 'medium': return 20;
      case 'hard': return 15;
    }
  }

  private generateProblems(): void {
    this.problems = [];
    this.currentIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.startTime = Date.now();

    const ranges = this.getNumberRanges(this.difficulty);

    for (let i = 0; i < this.totalProblems; i++) {
      const operation = this.getRandomOperation(this.difficulty);
      const problem = this.generateProblem(i, operation, ranges);
      this.problems.push(problem);
    }
  }

  private getNumberRanges(diff: 'easy' | 'medium' | 'hard'): { min: number; max: number } {
    switch (diff) {
      case 'easy': return { min: 1, max: 10 };
      case 'medium': return { min: 5, max: 20 };
      case 'hard': return { min: 10, max: 50 };
    }
  }

  private getRandomOperation(diff: 'easy' | 'medium' | 'hard'): Operation {
    const ops: Operation[] = diff === 'easy' 
      ? ['+', '-'] 
      : diff === 'medium' 
        ? ['+', '-', '*'] 
        : ['+', '-', '*', '/'];
    return ops[Math.floor(Math.random() * ops.length)];
  }

  private generateProblem(
    id: number, 
    operation: Operation, 
    ranges: { min: number; max: number }
  ): Problem {
    let num1: number, num2: number, answer: number;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * (ranges.max - ranges.min)) + ranges.min;
        num2 = Math.floor(Math.random() * (ranges.max - ranges.min)) + ranges.min;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * (ranges.max - ranges.min)) + ranges.min + ranges.min;
        num2 = Math.floor(Math.random() * num1);
        answer = num1 - num2;
        break;
      case '*':
        const mulMax = this.difficulty === 'easy' ? 5 : this.difficulty === 'medium' ? 10 : 12;
        num1 = Math.floor(Math.random() * mulMax) + 2;
        num2 = Math.floor(Math.random() * mulMax) + 2;
        answer = num1 * num2;
        break;
      case '/':
        num2 = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer;
        break;
    }

    return {
      id,
      num1,
      num2,
      operation,
      answer,
      userAnswer: null,
      isCorrect: null
    };
  }

  public submitAnswer(answer: number): { isCorrect: boolean; message: string } {
    const problem = this.problems[this.currentIndex];
    const isCorrect = answer === problem.answer;

    problem.userAnswer = answer;
    problem.isCorrect = isCorrect;

    if (isCorrect) {
      this.correctCount++;
      this.score += this.calculateScore();
    } else {
      this.wrongCount++;
    }

    this.currentIndex++;

    if (this.currentIndex >= this.totalProblems) {
      return { 
        isCorrect, 
        message: `🎉 答题结束! 正确 ${this.correctCount} 题，得分 ${this.score}` 
      };
    }

    return { 
      isCorrect, 
      message: isCorrect ? '✅ 正确!' : `❌ 错误! 正确答案是 ${problem.answer}` 
    };
  }

  private calculateScore(): number {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const timeBonus = Math.max(0, Math.floor((this.timeLimit - elapsed / this.currentIndex) * 10));
    const difficultyBonus = this.difficulty === 'hard' ? 30 : this.difficulty === 'medium' ? 20 : 10;
    return 10 + timeBonus + difficultyBonus;
  }

  public getState(): GameState {
    return {
      problems: this.problems.map(p => ({ ...p })),
      currentIndex: this.currentIndex,
      score: this.score,
      totalProblems: this.totalProblems,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      startTime: this.startTime,
      difficulty: this.difficulty
    };
  }

  public getCurrentProblem(): Problem | null {
    if (this.currentIndex >= this.problems.length) return null;
    return { ...this.problems[this.currentIndex] };
  }

  public getProgress(): { current: number; total: number } {
    return { current: this.currentIndex + 1, total: this.totalProblems };
  }

  public isComplete(): boolean {
    return this.currentIndex >= this.totalProblems;
  }

  public getScore(): number {
    return this.score;
  }

  public reset(totalProblems: number, difficulty: 'easy' | 'medium' | 'hard'): void {
    this.totalProblems = totalProblems;
    this.difficulty = difficulty;
    this.timeLimit = this.getTimeLimit(difficulty);
    this.generateProblems();
  }
}
