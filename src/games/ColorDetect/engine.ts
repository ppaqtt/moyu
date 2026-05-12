export interface ColorOption {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface ColorDetectState {
  phase: 'idle' | 'playing' | 'result' | 'gameover';
  score: number;
  round: number;
  totalRounds: number;
  currentWord: string;
  currentColor: string;
  currentTextColor: string;
  options: ColorOption[];
  correctOption: string;
  timeLeft: number;
  lastResult: 'correct' | 'wrong' | 'timeout' | null;
  streak: number;
  bestStreak: number;
  isGameOver: boolean;
}

export interface ColorDetectEngine {
  getState(): ColorDetectState;
  handleAnswer(optionId: string): boolean;
  tick(): void;
  reset(): void;
  checkGameOver(): boolean;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 650;
const TOTAL_ROUNDS = 20;
const ROUND_DURATION = 5000;
const GAME_DURATION = 90;

const COLORS: { id: string; name: string; hex: string }[] = [
  { id: 'red', name: '红色', hex: '#FF4444' },
  { id: 'blue', name: '蓝色', hex: '#4488FF' },
  { id: 'green', name: '绿色', hex: '#44FF44' },
  { id: 'yellow', name: '黄色', hex: '#FFFF44' },
  { id: 'purple', name: '紫色', hex: '#AA44FF' },
  { id: 'orange', name: '橙色', hex: '#FFAA44' },
  { id: 'pink', name: '粉色', hex: '#FF44AA' },
  { id: 'cyan', name: '青色', hex: '#44FFFF' },
];

const WORDS = ['红', '蓝', '绿', '黄', '紫', '橙', '粉', '青'];

export class ColorDetectEngine implements ColorDetectEngine {
  private phase: 'idle' | 'playing' | 'result' | 'gameover' = 'idle';
  private score: number = 0;
  private round: number = 0;
  private totalRounds: number = TOTAL_ROUNDS;
  private currentWord: string = '';
  private currentColor: string = '';
  private currentTextColor: string = '';
  private options: ColorOption[] = [];
  private correctOption: string = '';
  private timeLeft: number = ROUND_DURATION;
  private lastResult: 'correct' | 'wrong' | 'timeout' | null = null;
  private streak: number = 0;
  private bestStreak: number = 0;
  private isGameOver: boolean = false;
  private lastUpdate: number = 0;
  private gameStartTime: number = 0;
  private totalTimeLeft: number = GAME_DURATION;
  private roundStartTime: number = 0;
  private difficulty: number = 1;

  constructor() {
    this.init();
  }

  private init(): void {
    this.phase = 'idle';
    this.score = 0;
    this.round = 0;
    this.currentWord = '';
    this.currentColor = '';
    this.currentTextColor = '';
    this.options = [];
    this.correctOption = '';
    this.timeLeft = ROUND_DURATION;
    this.lastResult = null;
    this.streak = 0;
    this.bestStreak = 0;
    this.isGameOver = false;
    this.lastUpdate = Date.now();
    this.gameStartTime = Date.now();
    this.totalTimeLeft = GAME_DURATION;
    this.difficulty = 1;
  }

  private generateRound(): void {
    const wordIndex = Math.floor(Math.random() * WORDS.length);
    this.currentWord = WORDS[wordIndex];

    const actualColorIndex = Math.floor(Math.random() * COLORS.length);
    this.currentColor = COLORS[actualColorIndex].hex;

    let textColorIndex: number;
    const trapEnabled = Math.random() < Math.min(0.4 + this.difficulty * 0.1, 0.7);

    if (trapEnabled) {
      const wrongColors = COLORS.filter((_, i) => i !== actualColorIndex);
      textColorIndex = COLORS.indexOf(wrongColors[Math.floor(Math.random() * wrongColors.length)]);
    } else {
      textColorIndex = actualColorIndex;
    }
    this.currentTextColor = COLORS[textColorIndex].hex;

    this.correctOption = COLORS[actualColorIndex].id;

    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    this.options = shuffledColors.slice(0, 4).map(c => ({
      id: c.id,
      name: c.name,
      color: c.hex,
      textColor: '#FFFFFF'
    }));

    this.timeLeft = Math.max(ROUND_DURATION - this.difficulty * 200, 2500);
    this.roundStartTime = Date.now();
    this.lastResult = null;
  }

  getState(): ColorDetectState {
    return {
      phase: this.phase,
      score: this.score,
      round: this.round,
      totalRounds: this.totalRounds,
      currentWord: this.currentWord,
      currentColor: this.currentColor,
      currentTextColor: this.currentTextColor,
      options: [...this.options],
      correctOption: this.correctOption,
      timeLeft: this.timeLeft,
      lastResult: this.lastResult,
      streak: this.streak,
      bestStreak: this.bestStreak,
      isGameOver: this.isGameOver
    };
  }

  handleAnswer(optionId: string): boolean {
    if (this.phase !== 'playing') return false;

    const isCorrect = optionId === this.correctOption;

    if (isCorrect) {
      const timeBonus = Math.floor(this.timeLeft / 50);
      const streakBonus = Math.min(this.streak * 5, 50);
      this.score += 100 + timeBonus + streakBonus;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.lastResult = 'correct';
    } else {
      this.streak = 0;
      this.lastResult = 'wrong';
      this.score = Math.max(0, this.score - 25);
    }

    this.round++;
    this.difficulty = Math.min(1 + Math.floor(this.round / 5), 10);

    if (this.round >= this.totalRounds) {
      this.isGameOver = true;
    } else {
      this.phase = 'result';
      setTimeout(() => {
        this.phase = 'playing';
        this.generateRound();
      }, 500);
    }

    return isCorrect;
  }

  tick(): void {
    if (this.isGameOver) return;

    const now = Date.now();

    if (now - this.lastUpdate >= 1000) {
      this.totalTimeLeft--;
      this.lastUpdate = now;

      if (this.totalTimeLeft <= 0) {
        this.isGameOver = true;
        return;
      }
    }

    if (this.phase === 'playing') {
      const elapsed = Date.now() - this.roundStartTime;
      this.timeLeft = Math.max(ROUND_DURATION - this.difficulty * 200, 2500) - elapsed;

      if (this.timeLeft <= 0) {
        this.streak = 0;
        this.lastResult = 'timeout';
        this.score = Math.max(0, this.score - 50);
        this.round++;

        if (this.round >= this.totalRounds) {
          this.isGameOver = true;
        } else {
          this.phase = 'result';
          setTimeout(() => {
            this.phase = 'playing';
            this.generateRound();
          }, 500);
        }
      }
    }
  }

  reset(): void {
    this.init();
    this.phase = 'playing';
    this.generateRound();
  }

  checkGameOver(): boolean {
    return this.isGameOver;
  }
}

export const createEngine = (): ColorDetectEngine => {
  return new ColorDetectEngine();
};
