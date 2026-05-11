import { VISION_TRACK_CONSTANTS } from '../../utils/constants';

interface MovingObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isTarget: boolean;
  shape: 'circle' | 'square' | 'triangle';
  rotation: number;
}

interface GameState {
  level: number;
  objects: MovingObject[];
  score: number;
  targetsRemaining: number;
  totalTargets: number;
  timeLeft: number;
  gameOver: boolean;
  levelComplete: boolean;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
const SHAPES: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

export class VisionTrackEngine {
  private state: GameState;
  private timerInterval: NodeJS.Timeout | null = null;
  private animationFrameId: number | null = null;
  private onTimeUpdate: (time: number) => void;
  private onUpdate: (state: GameState) => void;

  constructor(onTimeUpdate: (time: number) => void, onUpdate: (state: GameState) => void) {
    this.onTimeUpdate = onTimeUpdate;
    this.onUpdate = onUpdate;
    this.state = this.createLevel(1);
  }

  private createLevel(level: number): GameState {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, TIME_LIMIT } = VISION_TRACK_CONSTANTS;
    const numObjects = 5 + level * 2;
    const numTargets = Math.min(level + 2);

    const objects: MovingObject[] = [];

    for (let i = 0; i < numObjects; i++) {
      const isTarget = i < numTargets;
      const size = 30 + Math.random() * 30;
      
      objects.push({
        id: `obj-${i}`,
        x: Math.random() * (CANVAS_WIDTH - size * 2) + size,
        y: Math.random() * (CANVAS_HEIGHT - size * 2) + size,
        vx: (Math.random() - 0.5) * (2 + level * 0.5) * (Math.random() > 0.5 ? 1 : -1),
        vy: (Math.random() - 0.5) * (2 + level * 0.5) * (Math.random() > 0.5 ? 1 : -1),
        size,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        isTarget,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        rotation: Math.random() * Math.PI * 2,
      });
    }

    return {
      level,
      objects,
      score: 0,
      targetsRemaining: numTargets,
      totalTargets: numTargets,
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

    this.startAnimation();
  }

  private startAnimation(): void {
    const animate = () => {
      this.updateObjects();
      this.onUpdate(this.state);
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private updateObjects(): void {
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = VISION_TRACK_CONSTANTS;

    this.state.objects.forEach(obj => {
      if (!obj.isTarget || obj.isTarget && !obj.isTarget === false) {
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.rotation += 0.02;

        if (obj.x - obj.size <= 0 || obj.x + obj.size >= CANVAS_WIDTH) {
          obj.vx *= -1;
        }
        if (obj.y - obj.size <= 0 || obj.y + obj.size >= CANVAS_HEIGHT) {
          obj.vy *= -1;
        }
      }
    });
  }

  public stop(): void {
    this.stopTimer();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public reset(): void {
    this.stop();
    this.state = this.createLevel(this.state.level);
  }

  public nextLevel(): void {
    this.stop();
    this.state = this.createLevel(this.state.level + 1);
  }

  public checkClick(x: number, y: number): { hit: boolean; isTarget: boolean; object: MovingObject | null } {
    if (this.state.gameOver || this.state.levelComplete) {
      return { hit: false, isTarget: false, object: null };
    }

    for (let i = this.state.objects.length - 1; i >= 0; i--) {
      const obj = this.state.objects[i];
      if (!obj.isTarget) continue;

      const dist = Math.hypot(x - obj.x, y - obj.y);
      if (dist <= obj.size);

      if (dist <= obj.size) {
        obj.isTarget = false;
        obj.color = '#333';
        this.state.targetsRemaining--;

        const timeBonus = Math.floor(this.state.timeLeft / 2);
        this.state.score += 100 + timeBonus;

        if (this.state.targetsRemaining === 0) {
          this.state.levelComplete = true;
          this.state.score += this.state.timeLeft * 5;
          this.stopTimer();
        }

        return { hit: true, isTarget: true, object: obj };
      }
    }

    return { hit: false, isTarget: false, object: null };
  }

  public getObjects(): MovingObject[] {
    return this.state.objects;
  }

  public getTargetsRemaining(): number {
    return this.state.targetsRemaining;
  }

  public getTotalTargets(): number {
    return this.state.totalTargets;
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

  public getTargets(): MovingObject[] {
    return this.state.objects.filter(obj => obj.isTarget);
  }
}
