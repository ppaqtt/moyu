import { FIND_DIFFERENCE_PRO_CONSTANTS } from '../../utils/constants';

interface Difference {
  x: number;
  y: number;
  radius: number;
  found: boolean;
  type: 'color' | 'shape' | 'size' | 'position' | 'missing';
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

const SCENES = [
  {
    name: '森林冒险',
    emojiGrid: [
      ['🌲', '🌳', '🌴', '🌵', '🌿', '☘️'],
      ['🍀', '🎄', '🌲', '🌳', '🌴', '🌵'],
      ['🌿', '☘️', '🍀', '🎄', '🌲', '🌳'],
      ['🌴', '🌵', '🌿', '☘️', '🍀', '🎄'],
      ['🌲', '🌳', '🌴', '🌵', '🌿', '☘️'],
      ['🍀', '🎄', '🌲', '🌳', '🌴', '🌵'],
    ],
  },
  {
    name: '水果乐园',
    emojiGrid: [
      ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉'],
      ['🍇', '🍓', '🍒', '🍑', '🍍', '🥝'],
      ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉'],
      ['🍇', '🍓', '🍒', '🍑', '🍍', '🥝'],
      ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉'],
      ['🍇', '🍓', '🍒', '🍑', '🍍', '🥝'],
    ],
  },
  {
    name: '城市景观',
    emojiGrid: [
      ['🏠', '🏡', '🏢', '🏣', '🏤', '🏥'],
      ['🏦', '🏨', '🏩', '🏪', '🏫', '🏬'],
      ['🏭', '🏯', '🏰', '💒', '🏠', '🏡'],
      ['🏢', '🏣', '🏤', '🏥', '🏦', '🏨'],
      ['🏩', '🏪', '🏫', '🏬', '🏭', '🏯'],
      ['🏰', '💒', '🏠', '🏡', '🏢', '🏣'],
    ],
  },
  {
    name: '海洋世界',
    emojiGrid: [
      ['🐟', '🐠', '🐡', '🦈', '🐙', '🐚'],
      ['🐬', '🐳', '🐋', '🦀', '🦞', '🦐'],
      ['🐟', '🐠', '🐡', '🦈', '🐙', '🐚'],
      ['🐬', '🐳', '🐋', '🦀', '🦞', '🦐'],
      ['🐟', '🐠', '🐡', '🦈', '🐙', '🐚'],
      ['🐬', '🐳', '🐋', '🦀', '🦞', '🦐'],
    ],
  },
  {
    name: '太空探索',
    emojiGrid: [
      ['🚀', '🛸', '🌍', '🌙', '⭐', '🌟'],
      ['✨', '💫', '🌌', '🪐', '☄️', '🌠'],
      ['🚀', '🛸', '🌍', '🌙', '⭐', '🌟'],
      ['✨', '💫', '🌌', '🪐', '☄️', '🌠'],
      ['🚀', '🛸', '🌍', '🌙', '⭐', '🌟'],
      ['✨', '💫', '🌌', '🪐', '☄️', '🌠'],
    ],
  },
];

const DIFFERENCE_TYPES: Array<'color' | 'shape' | 'size' | 'position' | 'missing'> = [
  'color', 'shape', 'size', 'position', 'missing'
];

export class FindDifferenceProEngine {
  private state: GameState;
  private timerInterval: NodeJS.Timeout | null = null;
  private onTimeUpdate: (time: number) => void;
  private currentScene: typeof SCENES[0];

  constructor(onTimeUpdate: (time: number) => void) {
    this.onTimeUpdate = onTimeUpdate;
    this.state = this.createLevel(1);
    this.currentScene = SCENES[0];
  }

  private createLevel(level: number): GameState {
    const { DIFFERENCES_PER_LEVEL, TIME_LIMIT } = FIND_DIFFERENCE_PRO_CONSTANTS;
    const sceneIndex = (level - 1) % SCENES.length;
    this.currentScene = SCENES[sceneIndex];

    const differences: Difference[] = [];
    const gridCols = 6;
    const gridRows = 6;
    const cellWidth = FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_WIDTH / gridCols;
    const cellHeight = FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_HEIGHT / gridRows;

    const usedPositions = new Set<string>();

    for (let i = 0; i < DIFFERENCES_PER_LEVEL; i++) {
      let col, row, key;
      let attempts = 0;
      do {
        col = Math.floor(Math.random() * gridCols);
        row = Math.floor(Math.random() * gridRows);
        key = `${col},${row}`;
        attempts++;
      } while (usedPositions.has(key) && attempts < 100);

      if (attempts < 100) {
        usedPositions.add(key);
        
        differences.push({
          x: col * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * 40,
          y: row * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * 30,
          radius: 35 + Math.random() * 15,
          found: false,
          type: DIFFERENCE_TYPES[i % DIFFERENCE_TYPES.length],
        });
      }
    }

    return {
      level,
      differences,
      foundCount: 0,
      totalDifferences: differences.length,
      timeLeft: TIME_LIMIT + (level - 1) * 10,
      score: 0,
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

          const timeBonus = Math.floor(this.state.timeLeft / 5);
          const distBonus = Math.floor((1 - dist / diff.radius) * 30);
          const typeBonus = ['missing', 'position', 'size', 'shape', 'color'].indexOf(diff.type) * 10;
          this.state.score += 150 + timeBonus + distBonus + typeBonus;

          if (this.state.foundCount === this.state.totalDifferences) {
            this.state.levelComplete = true;
            this.state.score += this.state.timeLeft * 8;
            this.stopTimer();
          }

          return { found: true, index: i };
        }
      }
    }

    return { found: false, index: -1 };
  }

  public getScene(): typeof SCENES[0] {
    return this.currentScene;
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

  public getDifferenceType(index: number): string {
    const typeNames: Record<string, string> = {
      color: '颜色变化',
      shape: '形状变化',
      size: '大小变化',
      position: '位置变化',
      missing: '缺失元素',
    };
    return typeNames[this.state.differences[index].type] || '未知';
  }
}
