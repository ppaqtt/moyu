import { HIDDEN_PICTURE_CONSTANTS } from '../../utils/constants';

interface HiddenItem {
  id: string;
  x: number;
  y: number;
  emoji: string;
  name: string;
  found: boolean;
}

interface GameState {
  level: number;
  items: HiddenItem[];
  foundCount: number;
  totalItems: number;
  timeLeft: number;
  score: number;
  gameOver: boolean;
  levelComplete: boolean;
}

const LEVELS = [
  {
    name: '森林探险',
    background: '🌳',
    items: [
      { emoji: '🦊', name: '小狐狸' },
      { emoji: '🦉', name: '猫头鹰' },
      { emoji: '🐿️', name: '松鼠' },
      { emoji: '🍄', name: '蘑菇' },
      { emoji: '🌸', name: '樱花' },
      { emoji: '🦋', name: '蝴蝶' },
    ],
  },
  {
    name: '海底世界',
    background: '🌊',
    items: [
      { emoji: '🐙', name: '章鱼' },
      { emoji: '🐠', name: '热带鱼' },
      { emoji: '🦀', name: '螃蟹' },
      { emoji: '🐚', name: '贝壳' },
      { emoji: '🪸', name: '珊瑚' },
      { emoji: '🐡', name: '河豚' },
      { emoji: '🦑', name: '乌贼' },
    ],
  },
  {
    name: '太空冒险',
    background: '🌌',
    items: [
      { emoji: '🚀', name: '火箭' },
      { emoji: '🛸', name: 'UFO' },
      { emoji: '👽', name: '外星人' },
      { emoji: '🪐', name: '土星' },
      { emoji: '☄️', name: '彗星' },
      { emoji: '🌙', name: '月亮' },
      { emoji: '⭐', name: '星星' },
      { emoji: '🛰️', name: '卫星' },
    ],
  },
  {
    name: '圣诞节',
    background: '🎄',
    items: [
      { emoji: '🎅', name: '圣诞老人' },
      { emoji: '🎁', name: '礼物' },
      { emoji: '⛄', name: '雪人' },
      { emoji: '🦌', name: '驯鹿' },
      { emoji: '🔔', name: '铃铛' },
      { emoji: '🍪', name: '饼干' },
      { emoji: '🧦', name: '袜子' },
      { emoji: '🎄', name: '圣诞树' },
      { emoji: '🕯️', name: '蜡烛' },
    ],
  },
];

const DISTRACTORS = [
  '🌟', '✨', '💫', '🔮', '🎯', '🎨', '🎭', '🎪',
  '🎢', '🎡', '🎠', '🎰', '🎲', '🧩', '🧸', '🎮',
  '📱', '📷', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺',
  '🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🍪', '🍩',
  '🍦', '🍧', '🍨', '🍰', '🎂', '🍫', '🍬', '🍭',
];

export class HiddenPictureEngine {
  private state: GameState;
  private timerInterval: NodeJS.Timeout | null = null;
  private onTimeUpdate: (time: number) => void;

  constructor(onTimeUpdate: (time: number) => void) {
    this.onTimeUpdate = onTimeUpdate;
    this.state = this.createLevel(1);
  }

  private createLevel(level: number): GameState {
    const { TIME_LIMIT, CANVAS_WIDTH, CANVAS_HEIGHT } = HIDDEN_PICTURE_CONSTANTS;
    const levelConfig = LEVELS[(level - 1) % LEVELS.length];
    
    const items: HiddenItem[] = [];
    const usedPositions: { x: number; y: number }[] = [];

    const isPositionValid = (x: number, y: number): boolean => {
      const minDistance = 60;
      for (const pos of usedPositions) {
        const dist = Math.hypot(x - pos.x, y - pos.y);
        if (dist < minDistance) return false;
      }
      return true;
    };

    levelConfig.items.forEach((item, index) => {
      let x, y;
      let attempts = 0;
      do {
        x = 50 + Math.random() * (CANVAS_WIDTH - 100);
        y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
        attempts++;
      } while (!isPositionValid(x, y) && attempts < 100);

      items.push({
        id: `item-${index}`,
        x,
        y,
        emoji: item.emoji,
        name: item.name,
        found: false,
      });
      usedPositions.push({ x, y });
    });

    for (let i = 0; i < 50 + level * 5; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = 50 + Math.random() * (CANVAS_WIDTH - 100);
        y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
        attempts++;
      } while (!isPositionValid(x, y) && attempts < 100);

      usedPositions.push({ x, y });
    }

    return {
      level,
      items,
      foundCount: 0,
      totalItems: items.length,
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

  public checkClick(x: number, y: number): { found: boolean; item: HiddenItem | null } {
    if (this.state.gameOver || this.state.levelComplete) {
      return { found: false, item: null };
    }

    for (const item of this.state.items) {
      if (!item.found) {
        const dist = Math.hypot(x - item.x, y - item.y);
        if (dist <= 40) {
          item.found = true;
          this.state.foundCount++;
          
          const timeBonus = Math.floor(this.state.timeLeft / 3);
          this.state.score += 100 + timeBonus;

          if (this.state.foundCount === this.state.totalItems) {
            this.state.levelComplete = true;
            this.state.score += this.state.timeLeft * 5;
            this.stopTimer();
          }

          return { found: true, item };
        }
      }
    }

    return { found: false, item: null };
  }

  public getLevelConfig() {
    return LEVELS[(this.state.level - 1) % LEVELS.length];
  }

  public getItems(): HiddenItem[] {
    return this.state.items;
  }

  public getFoundCount(): number {
    return this.state.foundCount;
  }

  public getTotalItems(): number {
    return this.state.totalItems;
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

  public getDistractors() {
    const distractors = [];
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = HIDDEN_PICTURE_CONSTANTS;
    const numDistractors = 50 + this.state.level * 5;
    
    for (let i = 0; i < numDistractors; i++) {
      distractors.push({
        x: 30 + Math.random() * (CANVAS_WIDTH - 60),
        y: 30 + Math.random() * (CANVAS_HEIGHT - 60),
        emoji: DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)],
      });
    }
    
    return distractors;
  }
}
