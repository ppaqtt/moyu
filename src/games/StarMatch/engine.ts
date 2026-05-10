export interface Star {
  id: number;
  type: 'star' | 'moon' | 'sun' | 'planet';
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
  x: number;
  y: number;
}

export interface GameState {
  stars: Star[];
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  isComplete: boolean;
  startTime: number;
}

export class StarMatchEngine {
  private stars: Star[] = [];
  private moves: number = 0;
  private matchedPairs: number = 0;
  private totalPairs: number;
  private flippedStars: number[] = [];
  private isProcessing: boolean = false;

  private readonly starTypes = [
    { type: 'star' as const, value: 1, emoji: '⭐' },
    { type: 'star' as const, value: 2, emoji: '🌟' },
    { type: 'moon' as const, value: 1, emoji: '🌙' },
    { type: 'moon' as const, value: 2, emoji: '🌛' },
    { type: 'sun' as const, value: 1, emoji: '☀️' },
    { type: 'sun' as const, value: 2, emoji: '🌤️' },
    { type: 'planet' as const, value: 1, emoji: '🪐' },
    { type: 'planet' as const, value: 2, emoji: '🌍' },
  ];

  constructor(pairs: number = 6) {
    this.totalPairs = Math.min(pairs, 8);
    this.reset();
  }

  public reset(): void {
    this.stars = [];
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedStars = [];
    this.isProcessing = false;

    const selectedTypes = this.shuffle([...this.starTypes]).slice(0, this.totalPairs);
    
    let id = 0;
    for (const starType of selectedTypes) {
      this.stars.push({
        id: id++,
        type: starType.type,
        value: starType.value,
        isFlipped: false,
        isMatched: false,
        x: 0,
        y: 0
      });
      this.stars.push({
        id: id++,
        type: starType.type,
        value: starType.value,
        isFlipped: false,
        isMatched: false,
        x: 0,
        y: 0
      });
    }

    this.shuffleArray(this.stars);
    this.assignPositions();
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private shuffle<T>(array: T[]): T[] {
    return this.shuffleArray([...array]);
  }

  private assignPositions(): void {
    const gridCols = Math.ceil(Math.sqrt(this.totalPairs * 2));
    this.stars.forEach((star, index) => {
      star.x = index % gridCols;
      star.y = Math.floor(index / gridCols);
    });
  }

  public flipStar(starId: number): { success: boolean; message: string; isMatch: boolean } {
    if (this.isProcessing) {
      return { success: false, message: '请等待...', isMatch: false };
    }

    const star = this.stars.find(s => s.id === starId);
    if (!star) {
      return { success: false, message: '星星不存在', isMatch: false };
    }

    if (star.isFlipped || star.isMatched) {
      return { success: false, message: '这张牌已翻开', isMatch: false };
    }

    if (this.flippedStars.length >= 2) {
      return { success: false, message: '已有两张牌翻开', isMatch: false };
    }

    star.isFlipped = true;
    this.flippedStars.push(starId);

    if (this.flippedStars.length === 2) {
      this.moves++;
      return this.checkMatch();
    }

    return { success: true, message: '翻开了一张牌', isMatch: false };
  }

  private checkMatch(): { success: boolean; message: string; isMatch: boolean } {
    const [id1, id2] = this.flippedStars;
    const star1 = this.stars.find(s => s.id === id1)!;
    const star2 = this.stars.find(s => s.id === id2)!;

    if (star1.type === star2.type && star1.value === star2.value) {
      star1.isMatched = true;
      star2.isMatched = true;
      this.matchedPairs++;
      this.flippedStars = [];

      if (this.matchedPairs === this.totalPairs) {
        return { success: true, message: '🎉 恭喜通关!', isMatch: true };
      }

      return { success: true, message: '配对成功!', isMatch: true };
    } else {
      this.isProcessing = true;
      setTimeout(() => {
        star1.isFlipped = false;
        star2.isFlipped = false;
        this.flippedStars = [];
        this.isProcessing = false;
      }, 1000);

      return { success: true, message: '不匹配...', isMatch: false };
    }
  }

  public getState(): GameState {
    return {
      stars: this.stars.map(s => ({ ...s })),
      moves: this.moves,
      matchedPairs: this.matchedPairs,
      totalPairs: this.totalPairs,
      isComplete: this.matchedPairs === this.totalPairs,
      startTime: Date.now()
    };
  }

  public getGridSize(): { rows: number; cols: number } {
    const total = this.totalPairs * 2;
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    return { rows, cols };
  }

  public getMoves(): number {
    return this.moves;
  }

  public getMatchedPairs(): number {
    return this.matchedPairs;
  }

  public getTotalPairs(): number {
    return this.totalPairs;
  }

  public isComplete(): boolean {
    return this.matchedPairs === this.totalPairs;
  }

  public setDifficulty(pairs: number): void {
    this.totalPairs = Math.min(pairs, 8);
    this.reset();
  }

  public getStarEmoji(type: string, value: number): string {
    const starType = this.starTypes.find(s => s.type === type && s.value === value);
    return starType?.emoji || '⭐';
  }
}
