// 找不同游戏引擎
import { FINDDIFF_CONSTANTS } from '../../utils/constants';

interface Difference {
  x: number;
  y: number;
  radius: number;
  found: boolean;
}

interface GameState {
  level: number;
  differences: Difference[];
  foundCount: number;
  totalDifferences: number;
  timeLeft: number;
  score: number;
  gameOver: boolean;
  levelComplete: boolean;
}

// 图片场景数据（使用emoji生成简单图案）
const SCENES = [
  {
    emojis: ['🌲', '🌳', '🌴', '🌵', '🌿', '☘️', '🍀', '🎄'],
    layout: [
      ['🌲', '🌳', '🌴', '🌵'],
      ['🌿', '☘️', '🍀', '🌲'],
      ['🌳', '🌵', '🌿', '🌴'],
      ['🌴', '🌲', '☘️', '🍀']
    ]
  },
  {
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓'],
    layout: [
      ['🍎', '🍐', '🍊', '🍋'],
      ['🍌', '🍉', '🍇', '🍓'],
      ['🍓', '🍎', '🍌', '🍉'],
      ['🍊', '🍇', '🍐', '🍋']
    ]
  },
  {
    emojis: ['🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨'],
    layout: [
      ['🏠', '🏡', '🏢', '🏣'],
      ['🏤', '🏥', '🏦', '🏨'],
      ['🏨', '🏤', '🏡', '🏥'],
      ['🏢', '🏦', '🏠', '🏣']
    ]
  }
];

export class FindDiffEngine {
  private state: GameState;
  private timerInterval: NodeJS.Timeout | null = null;
  private onTimeUpdate: (time: number) => void;

  constructor(onTimeUpdate: (time: number) => void) {
    this.onTimeUpdate = onTimeUpdate;
    this.state = this.createLevel(1);
  }

  private createLevel(level: number): GameState {
    const { DIFF_COUNT, TIME_LIMIT } = FINDDIFF_CONSTANTS;
    const sceneIndex = (level - 1) % SCENES.length;

    // 生成不同之处
    const differences: Difference[] = [];
    const gridSize = 4;
    const cellWidth = 200;
    const cellHeight = 150;

    for (let i = 0; i < DIFF_COUNT; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * gridSize) * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * 50;
        y = Math.floor(Math.random() * gridSize) * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * 30;
        attempts++;
      } while (
        attempts < 100 &&
        differences.some(d => Math.hypot(d.x - x, d.y - y) < 80)
      );

      differences.push({
        x: Math.max(20, Math.min(780, x)),
        y: Math.max(20, Math.min(580, y)),
        radius: 25 + Math.random() * 10,
        found: false
      });
    }

    return {
      level,
      differences,
      foundCount: 0,
      totalDifferences: DIFF_COUNT,
      timeLeft: TIME_LIMIT + (level - 1) * 10, // 每关增加10秒
      score: 0,
      gameOver: false,
      levelComplete: false
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
    this.stopTimer();
    this.state = this.createLevel(this.state.level);
  }

  public nextLevel(): void {
    this.stopTimer();
    this.state = this.createLevel(this.state.level + 1);
  }

  public checkClick(x: number, y: number): { found: boolean; index: number } {
    if (this.state.gameOver || this.state.levelComplete) {
      return { found: false, index: -1 };
    }

    for (let i = 0; i < this.state.differences.length; i++) {
      const diff = this.state.differences[i];
      if (!diff.found) {
        const dist = Math.hypot(x - diff.x, y - diff.y);
        if (dist <= diff.radius) {
          diff.found = true;
          this.state.foundCount++;

          // 计分：基于剩余时间和距离
          const timeBonus = Math.floor(this.state.timeLeft / 10);
          const distBonus = Math.floor((1 - dist / diff.radius) * 20);
          this.state.score += 100 + timeBonus + distBonus;

          if (this.state.foundCount === this.state.totalDifferences) {
            this.state.levelComplete = true;
            this.state.score += this.state.timeLeft * 5; // 时间奖励
            this.stopTimer();
          }

          return { found: true, index: i };
        }
      }
    }

    return { found: false, index: -1 };
  }

  public getScene(): typeof SCENES[0] {
    return SCENES[(this.state.level - 1) % SCENES.length];
  }

  public getDifferences(): Difference[] {
    return this.state.differences;
  }

  public getFoundCount(): number {
    return this.state.foundCount;
  }

  public getTotalDifferences(): number {
    return this.state.totalDifferences;
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
}
