import { ILLUSION_ART_CONSTANTS } from '../../utils/constants';

interface DrawingPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface Illusion {
  id: string;
  name: string;
  type: 'rotating' | 'strobing' | 'color-shift' | 'pattern';
  completed: boolean;
  targetSteps: number;
  currentSteps: number;
}

interface GameState {
  level: number;
  illusions: Illusion[];
  currentIllusion: Illusion | null;
  score: number;
  timeLeft: number;
  gameOver: boolean;
  levelComplete: boolean;
}

export class IllusionArtEngine {
  private state: GameState;
  private timerInterval: NodeJS.Timeout | null = null;
  private onTimeUpdate: (time: number) => void;
  private drawingPoints: DrawingPoint[] = [];

  constructor(onTimeUpdate: (time: number) => void) {
    this.onTimeUpdate = onTimeUpdate;
    this.state = this.createLevel(1);
  }

  private createLevel(level: number): GameState {
    const { TIME_LIMIT } = ILLUSION_ART_CONSTANTS;
    
    const illusions: Illusion[] = [
      { id: 'illusion-1', name: '旋转螺旋', type: 'rotating', completed: false, targetSteps: 50, currentSteps: 0 },
      { id: 'illusion-2', name: '频闪效果', type: 'strobing', completed: false, targetSteps: 30, currentSteps: 0 },
      { id: 'illusion-3', name: '色彩渐变', type: 'color-shift', completed: false, targetSteps: 40, currentSteps: 0 },
      { id: 'illusion-4', name: '几何图案', type: 'pattern', completed: false, targetSteps: 60, currentSteps: 0 },
    ];

    return {
      level,
      illusions,
      currentIllusion: illusions[0],
      score: 0,
      timeLeft: TIME_LIMIT,
      gameOver: false,
      levelComplete: false,
    };
  }

  public start(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.state.timeLeft > 0 && !this.state.gameOver && !this.state.levelComplete) {
        this.state.timeLeft--;
        this.onTimeUpdate(this.state.timeLeft);

        if (this.state.timeLeft === 0) {
          this.state.gameOver = true;
          this.stopTimer();
        }
      }
    }, 1000);
  }

  public stop(): void {
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public reset(): void {
    this.stop();
    this.drawingPoints = [];
    this.state = this.createLevel(this.state.level);
  }

  public nextLevel(): void {
    this.stop();
    this.drawingPoints = [];
    this.state = this.createLevel(this.state.level + 1);
  }

  public addDrawingPoint(x: number, y: number): void {
    if (!this.state.currentIllusion || this.state.gameOver || this.state.levelComplete) return;

    const point: DrawingPoint = {
      x,
      y,
      timestamp: Date.now(),
    };
    this.drawingPoints.push(point);

    const illusion = this.state.currentIllusion;
    illusion.currentSteps++;

    if (illusion.currentSteps >= illusion.targetSteps && !illusion.completed) {
      illusion.completed = true;
      const timeBonus = Math.floor(this.state.timeLeft / 3);
      this.state.score += 100 + timeBonus;

      const nextIllusionIndex = this.state.illusions.findIndex(i => !i.completed);
      if (nextIllusionIndex !== -1) {
        this.state.currentIllusion = this.state.illusions[nextIllusionIndex];
        this.drawingPoints = [];
      } else {
        this.state.levelComplete = true;
        this.state.score += this.state.timeLeft * 5;
        this.stopTimer();
      }
    }
  }

  public selectIllusion(id: string): void {
    const illusion = this.state.illusions.find(i => i.id === id);
    if (illusion && !illusion.completed) {
      this.state.currentIllusion = illusion;
      this.drawingPoints = [];
    }
  }

  public getIllusions(): Illusion[] {
    return this.state.illusions;
  }

  public getCurrentIllusion(): Illusion | null {
    return this.state.currentIllusion;
  }

  public getDrawingPoints(): DrawingPoint[] {
    return this.drawingPoints;
  }

  public getTimeLeft(): number {
    return this.state.timeLeft;
  }

  public getScore(): number {
    return this.state.score;
  }

  public getLevel(): number {
    return this.state.level;
  }

  public isGameOver(): boolean {
    return this.state.gameOver;
  }

  public isLevelComplete(): boolean {
    return this.state.levelComplete;
  }

  public getCompletedCount(): number {
    return this.state.illusions.filter(i => i.completed).length;
  }

  public getTotalCount(): number {
    return this.state.illusions.length;
  }
}
