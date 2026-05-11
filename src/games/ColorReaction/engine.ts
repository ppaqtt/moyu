export interface ColorOption {
  id: string;
  name: string;
  color: string;
}

export interface ColorReactionState {
  phase: 'idle' | 'ready' | 'show' | 'result' | 'gameover';
  score: number;
  round: number;
  totalRounds: number;
  targetColor: string;
  targetName: string;
  options: ColorOption[];
  reactionTime: number;
  bestTime: number;
  averageTime: number;
  lastResult: 'correct' | 'wrong' | null;
  isGameOver: boolean;
  reactionTimes: number[];
  showStartTime: number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const TOTAL_ROUNDS = 10;
const MIN_READY_TIME = 1000;
const MAX_READY_TIME = 3000;
const PERFECT_THRESHOLD = 300;
const GREAT_THRESHOLD = 500;
const GOOD_THRESHOLD = 800;

const COLORS: ColorOption[] = [
  { id: 'red', name: '红色', color: '#FF4444' },
  { id: 'blue', name: '蓝色', color: '#4488FF' },
  { id: 'green', name: '绿色', color: '#44FF44' },
  { id: 'yellow', name: '黄色', color: '#FFFF44' },
  { id: 'purple', name: '紫色', color: '#AA44FF' },
  { id: 'orange', name: '橙色', color: '#FFAA44' },
];

export class ColorReactionEngine {
  private phase: ColorReactionState['phase'] = 'idle';
  private score: number = 0;
  private round: number = 0;
  private totalRounds: number = TOTAL_ROUNDS;
  private targetColor: string = '';
  private targetName: string = '';
  private options: ColorOption[] = [];
  private reactionTime: number = 0;
  private bestTime: number = Infinity;
  private averageTime: number = 0;
  private lastResult: 'correct' | 'wrong' | null = null;
  private isGameOver: boolean = false;
  private reactionTimes: number[] = [];
  private showStartTime: number = 0;
  private readyStartTime: number = 0;
  private showDelay: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.phase = 'idle';
    this.score = 0;
    this.round = 0;
    this.totalRounds = TOTAL_ROUNDS;
    this.targetColor = '';
    this.targetName = '';
    this.options = [];
    this.reactionTime = 0;
    this.bestTime = Infinity;
    this.averageTime = 0;
    this.lastResult = null;
    this.isGameOver = false;
    this.reactionTimes = [];
    this.showStartTime = 0;
    this.readyStartTime = 0;
  }

  private generateRound(): void {
    const targetIndex = Math.floor(Math.random() * COLORS.length);
    this.targetColor = COLORS[targetIndex].color;
    this.targetName = COLORS[targetIndex].name;

    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    const selectedColors = shuffledColors.slice(0, 4);
    
    if (!selectedColors.find(c => c.id === COLORS[targetIndex].id)) {
      selectedColors[Math.floor(Math.random() * selectedColors.length)] = COLORS[targetIndex];
    }
    
    this.options = selectedColors.sort(() => Math.random() - 0.5);
  }

  startRound(): void {
    this.phase = 'ready';
    this.readyStartTime = Date.now();
    this.showDelay = MIN_READY_TIME + Math.random() * (MAX_READY_TIME - MIN_READY_TIME);
  }

  getState(): ColorReactionState {
    return {
      phase: this.phase,
      score: this.score,
      round: this.round,
      totalRounds: this.totalRounds,
      targetColor: this.targetColor,
      targetName: this.targetName,
      options: [...this.options],
      reactionTime: this.reactionTime,
      bestTime: this.bestTime,
      averageTime: this.averageTime,
      lastResult: this.lastResult,
      isGameOver: this.isGameOver,
      reactionTimes: [...this.reactionTimes],
      showStartTime: this.showStartTime,
    };
  }

  handleAnswer(optionId: string): boolean {
    if (this.phase !== 'show') return false;

    this.reactionTime = Date.now() - this.showStartTime;
    const isCorrect = COLORS.find(c => c.color === this.targetColor)?.id === optionId;

    if (isCorrect) {
      this.reactionTimes.push(this.reactionTime);
      
      if (this.reactionTime < this.bestTime) {
        this.bestTime = this.reactionTime;
      }
      
      this.averageTime = Math.round(
        this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
      );

      if (this.reactionTime <= PERFECT_THRESHOLD) {
        this.score += 100;
      } else if (this.reactionTime <= GREAT_THRESHOLD) {
        this.score += 75;
      } else if (this.reactionTime <= GOOD_THRESHOLD) {
        this.score += 50;
      } else {
        this.score += 25;
      }
      
      this.lastResult = 'correct';
    } else {
      this.lastResult = 'wrong';
      this.score = Math.max(0, this.score - 20);
    }

    this.round++;
    
    if (this.round >= this.totalRounds) {
      this.isGameOver = true;
      this.phase = 'gameover';
    } else {
      this.phase = 'result';
    }

    return isCorrect;
  }

  tick(): void {
    if (this.phase === 'ready' && Date.now() - this.readyStartTime >= this.showDelay) {
      this.phase = 'show';
      this.showStartTime = Date.now();
      this.generateRound();
    }
  }

  reset(): void {
    this.init();
  }

  checkGameOver(): boolean {
    return this.isGameOver;
  }
}

export const createEngine = (): ColorReactionEngine => {
  return new ColorReactionEngine();
};
