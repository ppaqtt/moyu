// 记忆翻牌游戏引擎
export interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameState {
  cards: Card[];
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  isComplete: boolean;
  startTime: number;
  maxMoves: number;
}

export class MemoryMatchEngine {
  private cards: Card[] = [];
  private moves: number = 0;
  private matchedPairs: number = 0;
  private totalPairs: number;
  private maxMoves: number;
  private flippedCards: number[] = [];
  private isProcessing: boolean = false;

  // 记忆翻牌游戏的符号 - 使用emoji和特殊符号
  private readonly symbols = [
    '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑',
    '🌸', '🌺', '🌻', '🌷', '🌹', '🪻', '🌼', '💐',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '⭐', '🌙', '☀️', '🌈', '☁️', '❄️', '🔥', '💧',
    '🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎢',
    '🚀', '✈️', '🚁', '🚢', '🚂', '🚗', '🏎️', '🚲',
    '💎', '👑', '🎁', '🎀', '🎈', '🎉', '🎊', '🏆',
    '🎸', '🎺', '🎻', '🥁', '🎵', '🎶', '🎼', '🎹'
  ];

  constructor(pairs: number = 8, maxMoves: number = 30) {
    this.totalPairs = Math.min(pairs, 20);
    this.maxMoves = maxMoves;
    this.reset();
  }

  public reset(): void {
    this.cards = [];
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.isProcessing = false;

    // 选择随机符号
    const selectedSymbols = this.shuffle([...this.symbols]).slice(0, this.totalPairs);
    
    // 创建卡片对
    let cardId = 0;
    for (const symbol of selectedSymbols) {
      this.cards.push({ id: cardId++, symbol, isFlipped: false, isMatched: false });
      this.cards.push({ id: cardId++, symbol, isFlipped: false, isMatched: false });
    }

    // 打乱卡片
    this.cards = this.shuffle(this.cards);
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public flipCard(cardId: number): { success: boolean; message: string; isMatch: boolean } {
    if (this.isProcessing) {
      return { success: false, message: '请等待...', isMatch: false };
    }

    const card = this.cards.find(c => c.id === cardId);
    if (!card) {
      return { success: false, message: '卡片不存在', isMatch: false };
    }

    if (card.isFlipped || card.isMatched) {
      return { success: false, message: '这张牌已翻开', isMatch: false };
    }

    if (this.flippedCards.length >= 2) {
      return { success: false, message: '已有两张牌翻开', isMatch: false };
    }

    // 翻开卡片
    card.isFlipped = true;
    this.flippedCards.push(cardId);

    if (this.flippedCards.length === 2) {
      this.moves++;
      return this.checkMatch();
    }

    return { success: true, message: '翻开了一张牌', isMatch: false };
  }

  private checkMatch(): { success: boolean; message: string; isMatch: boolean } {
    const [id1, id2] = this.flippedCards;
    const card1 = this.cards.find(c => c.id === id1)!;
    const card2 = this.cards.find(c => c.id === id2)!;

    if (card1.symbol === card2.symbol) {
      // 匹配成功
      card1.isMatched = true;
      card2.isMatched = true;
      this.matchedPairs++;
      this.flippedCards = [];

      if (this.matchedPairs === this.totalPairs) {
        return { success: true, message: '🎉 恭喜通关!', isMatch: true };
      }

      return { success: true, message: '配对成功!', isMatch: true };
    } else {
      // 不匹配，需要翻回去
      this.isProcessing = true;
      setTimeout(() => {
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.flippedCards = [];
        this.isProcessing = false;
      }, 1000);

      return { success: true, message: '不匹配...', isMatch: false };
    }
  }

  public getState(): GameState {
    return {
      cards: this.cards.map(c => ({ ...c })),
      moves: this.moves,
      matchedPairs: this.matchedPairs,
      totalPairs: this.totalPairs,
      isComplete: this.matchedPairs === this.totalPairs,
      startTime: Date.now(),
      maxMoves: this.maxMoves
    };
  }

  public tick(): void {
    // 无需周期性更新
  }

  public getCards(): Card[] {
    return this.cards.map(c => ({ ...c }));
  }

  public getMoves(): number {
    return this.moves;
  }

  public getRemainingMoves(): number {
    return Math.max(0, this.maxMoves - this.moves);
  }

  public getMatchedPairs(): number {
    return this.matchedPairs;
  }

  public getTotalPairs(): number {
    return this.totalPairs;
  }

  public isGameComplete(): boolean {
    return this.matchedPairs === this.totalPairs;
  }

  public isGameOver(): boolean {
    return this.moves >= this.maxMoves && !this.isGameComplete();
  }

  public getHint(): number | null {
    // 找一个未匹配且未翻开的牌
    const unmatched = this.cards.filter(c => !c.isMatched && !c.isFlipped);
    if (unmatched.length === 0) return null;

    // 找一个有配对的牌
    for (const card of unmatched) {
      const pair = this.cards.find(c => 
        c.symbol === card.symbol && c.id !== card.id && !c.isMatched && !c.isFlipped
      );
      if (pair) {
        return card.id;
      }
    }

    return unmatched[0].id;
  }

  public setDifficulty(pairs: number, moves: number): void {
    this.totalPairs = Math.min(pairs, 20);
    this.maxMoves = moves;
  }

  public getGridSize(): { rows: number; cols: number } {
    const totalCards = this.totalPairs * 2;
    const cols = Math.ceil(Math.sqrt(totalCards));
    const rows = Math.ceil(totalCards / cols);
    return { rows, cols };
  }
}
