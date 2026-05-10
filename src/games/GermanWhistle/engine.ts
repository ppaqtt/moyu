export type Fruit = 'apple' | 'banana' | 'cherry' | 'grape' | 'strawberry' | 'orange' | 'watermelon' | 'lemon';
export type CardType = 'fruit' | 'whistle' | 'cherryBomb' | 'flipAll' | 'switchHands';

export interface Card {
  id: string;
  type: CardType;
  fruit?: Fruit;
  description: string;
}

export interface Player {
  id: number;
  name: string;
  handCards: Card[];
  isAlive: boolean;
  cardCount: number;
  reactionTime: number;
  lastReactionTime: number;
}

export type GamePhase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';
export type GameStatus = 'waiting' | 'flipping' | 'checking' | 'reaction' | 'penalty' | 'eliminated';

export interface GermanWhistleState {
  players: Player[];
  tableCards: Card[];
  currentPlayer: number;
  phase: GamePhase;
  status: GameStatus;
  message: string;
  winner: number | null;
  round: number;
  fruitCounts: Record<Fruit, number>;
  canRing: boolean;
  lastFlipPlayer: number | null;
  penaltyCard: Card | null;
  winnerAnnounced: boolean;
}

const FRUITS: Fruit[] = ['apple', 'banana', 'cherry', 'grape', 'strawberry', 'orange', 'watermelon', 'lemon'];
const FRUIT_SYMBOLS: Record<Fruit, string> = {
  apple: '🍎',
  banana: '🍌',
  cherry: '🍒',
  grape: '🍇',
  strawberry: '🍓',
  orange: '🍊',
  watermelon: '🍉',
  lemon: '🍋',
};

const PLAYER_NAMES = ['你', '小红', '小明', '小华'];

function createDeck(): Card[] {
  const deck: Card[] = [];
  let cardId = 0;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 4; j++) {
      deck.push({
        id: `card_${cardId++}`,
        type: 'fruit',
        fruit: FRUITS[i],
        description: `翻开${FRUIT_SYMBOLS[FRUITS[i]]}`,
      });
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card_${cardId++}`,
      type: 'whistle',
      description: '抢铃!',
    });
  }

  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `card_${cardId++}`,
      type: 'cherryBomb',
      description: '樱桃炸弹! 所有人翻牌',
    });
  }

  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `card_${cardId++}`,
      type: 'flipAll',
      description: '全部翻牌!',
    });
  }

  return shuffleDeck(deck);
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export class GermanWhistleEngine {
  private players: Player[] = [];
  private tableCards: Card[] = [];
  private currentPlayer: number = 0;
  private phase: GamePhase = 'setup';
  private status: GameStatus = 'waiting';
  private message: string = '等待游戏开始...';
  private winner: number | null = null;
  private round: number = 1;
  private deck: Card[] = [];
  private canRing: boolean = false;
  private lastFlipPlayer: number | null = null;
  private penaltyCard: Card | null = null;
  private winnerAnnounced: boolean = false;
  private aiTimeout: number = 0;
  private reactionStartTime: number = 0;

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    this.players = [];
    this.tableCards = [];
    this.currentPlayer = 0;
    this.phase = 'setup';
    this.status = 'waiting';
    this.message = '等待游戏开始...';
    this.winner = null;
    this.round = 1;
    this.deck = createDeck();
    this.canRing = false;
    this.lastFlipPlayer = null;
    this.penaltyCard = null;
    this.winnerAnnounced = false;

    for (let i = 0; i < 4; i++) {
      const handCards: Card[] = [];
      for (let j = 0; j < 5; j++) {
        if (this.deck.length > 0) {
          handCards.push(this.deck.pop()!);
        }
      }
      
      this.players.push({
        id: i,
        name: PLAYER_NAMES[i] || `玩家${i + 1}`,
        handCards,
        isAlive: true,
        cardCount: handCards.length,
        reactionTime: 0,
        lastReactionTime: 0,
      });
    }

    for (let i = 0; i < 2; i++) {
      if (this.deck.length > 0) {
        this.tableCards.push(this.deck.pop()!);
      }
    }
  }

  private shuffleDeck(): void {
    this.deck = shuffleDeck([...this.deck, ...this.tableCards]);
    this.tableCards = [];
    for (let i = 0; i < 2 && this.deck.length > 0; i++) {
      this.tableCards.push(this.deck.pop()!);
    }
  }

  getState(): GermanWhistleState {
    return {
      players: this.players.map(p => ({ ...p, handCards: p.handCards.map(c => ({ ...c })) })),
      tableCards: this.tableCards.map(c => ({ ...c })),
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      status: this.status,
      message: this.message,
      winner: this.winner,
      round: this.round,
      fruitCounts: this.getFruitCounts(),
      canRing: this.canRing,
      lastFlipPlayer: this.lastFlipPlayer,
      penaltyCard: this.penaltyCard,
      winnerAnnounced: this.winnerAnnounced,
    };
  }

  private getFruitCounts(): Record<Fruit, number> {
    const counts: Record<Fruit, number> = {
      apple: 0, banana: 0, cherry: 0, grape: 0,
      strawberry: 0, orange: 0, watermelon: 0, lemon: 0,
    };
    
    this.tableCards.forEach(card => {
      if (card.type === 'fruit' && card.fruit) {
        counts[card.fruit]++;
      }
    });
    
    return counts;
  }

  private checkFiveFruits(): boolean {
    const counts = this.getFruitCounts();
    return Object.values(counts).some(count => count >= 5);
  }

  startGame(): void {
    this.initGame();
    this.phase = 'playing';
    this.status = 'flipping';
    this.message = '游戏开始！开始翻牌...';
    
    setTimeout(() => this.startRound(), 1000);
  }

  private startRound(): void {
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    if (alivePlayers.length === 1) {
      this.endGame(alivePlayers[0].id);
      return;
    }

    this.phase = 'playing';
    this.status = 'flipping';
    this.canRing = false;
    this.message = `第${this.round}轮开始！`;

    this.shuffleDeck();
    
    if (this.currentPlayer >= this.players.length) {
      this.currentPlayer = 0;
      while (!this.players[this.currentPlayer].isAlive) {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
      }
    }

    setTimeout(() => this.nextFlip(), 1500);
  }

  private nextFlip(): void {
    const currentPlayer = this.players[this.currentPlayer];
    
    if (!currentPlayer.isAlive) {
      this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
      this.nextFlip();
      return;
    }

    if (currentPlayer.handCards.length === 0) {
      this.eliminatePlayer(this.currentPlayer);
      return;
    }

    this.status = 'flipping';
    this.lastFlipPlayer = this.currentPlayer;
    this.reactionStartTime = Date.now();
    
    const card = currentPlayer.handCards.shift()!;
    this.tableCards.push(card);
    
    this.message = `${currentPlayer.name} 翻开了 ${this.getCardDisplay(card)}`;

    this.processCard(card);
  }

  private getCardDisplay(card: Card): string {
    if (card.type === 'fruit' && card.fruit) {
      return FRUIT_SYMBOLS[card.fruit];
    } else if (card.type === 'whistle') {
      return '🔔';
    } else if (card.type === 'cherryBomb') {
      return '💣';
    } else if (card.type === 'flipAll') {
      return '📚';
    }
    return '❓';
  }

  private processCard(card: Card): void {
    switch (card.type) {
      case 'whistle':
        this.canRing = true;
        this.status = 'reaction';
        this.message += ' - 有人按铃！';
        
        if (this.currentPlayer !== 0) {
          setTimeout(() => this.aiReact(), Math.random() * 2000 + 500);
        }
        break;
        
      case 'cherryBomb':
        this.message += ' - 樱桃炸弹！所有人翻牌！';
        this.status = 'checking';
        
        setTimeout(() => {
          this.flipAllCards();
          this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
          setTimeout(() => this.nextFlip(), 2000);
        }, 1000);
        break;
        
      case 'flipAll':
        this.message += ' - 全部翻牌！';
        this.status = 'checking';
        
        setTimeout(() => {
          this.flipAllCards();
          this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
          setTimeout(() => this.nextFlip(), 2000);
        }, 1000);
        break;
        
      case 'fruit':
        if (this.checkFiveFruits()) {
          this.canRing = true;
          this.status = 'reaction';
          this.message += ' - 有5个相同水果！按铃！';
          
          if (this.currentPlayer !== 0) {
            setTimeout(() => this.aiReact(), Math.random() * 2000 + 500);
          }
        } else {
          setTimeout(() => {
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            setTimeout(() => this.nextFlip(), 500);
          }, 1000);
        }
        break;
    }
  }

  private flipAllCards(): void {
    const flippedFruits = this.tableCards.filter(c => c.type === 'fruit');
    this.tableCards = this.tableCards.filter(c => c.type !== 'fruit');
    
    const newCards: Card[] = [];
    for (let i = 0; i < 2 && this.deck.length > 0; i++) {
      newCards.push(this.deck.pop()!);
    }
    
    flippedFruits.forEach(c => {
      if (this.deck.length > 0) {
        this.deck.push(this.deck.pop()!);
      }
    });
    
    newCards.forEach(c => this.tableCards.push(c));
    
    this.message = `翻牌结果: ${this.tableCards.map(c => this.getCardDisplay(c)).join(' ')}`;
  }

  ring(playerId: number): void {
    if (!this.canRing || this.status !== 'reaction') {
      if (playerId === 0) {
        this.message = '还不能按铃！';
      }
      return;
    }

    if (this.checkFiveFruits()) {
      const player = this.players[playerId];
      player.reactionTime = Date.now() - this.reactionStartTime;
      player.lastReactionTime = player.reactionTime;
      
      this.status = 'penalty';
      this.message = `${player.name} 正确按铃！反应时间: ${player.reactionTime}ms`;
      
      this.canRing = false;
      
      const alivePlayers = this.players.filter(p => p.isAlive && p.id !== playerId);
      alivePlayers.forEach(p => {
        if (p.handCards.length > 0) {
          const penaltyCard = p.handCards.shift()!;
          this.tableCards.push(penaltyCard);
          p.cardCount = p.handCards.length;
          this.message += ` ${p.name} 受到惩罚，翻开 ${this.getCardDisplay(penaltyCard)}`;
        }
      });

      if (player.handCards.length === 0) {
        this.eliminatePlayer(playerId);
      }

      setTimeout(() => {
        this.round++;
        this.startRound();
      }, 3000);
    } else {
      this.status = 'penalty';
      const player = this.players[playerId];
      this.penaltyCard = this.deck.length > 0 ? this.deck.pop()! : null;
      
      if (this.penaltyCard) {
        player.handCards.push(this.penaltyCard);
        player.cardCount = player.handCards.length;
      }
      
      this.message = `${player.name} 错误按铃！受到惩罚，获得一张牌`;
      this.canRing = false;

      setTimeout(() => {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        setTimeout(() => this.nextFlip(), 1000);
      }, 2000);
    }
  }

  private aiReact(): void {
    if (this.status !== 'reaction') return;
    
    const aiPlayers = this.players.filter(p => p.isAlive && p.id !== 0);
    
    for (const ai of aiPlayers) {
      const shouldRing = Math.random() < 0.7;
      
      if (shouldRing) {
        this.ring(ai.id);
        return;
      }
    }

    setTimeout(() => {
      if (this.status === 'reaction') {
        this.message += ' 没有人按铃...';
        setTimeout(() => {
          this.canRing = false;
          this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
          setTimeout(() => this.nextFlip(), 1000);
        }, 1000);
      }
    }, 2000);
  }

  private eliminatePlayer(playerId: number): void {
    const player = this.players[playerId];
    player.isAlive = false;
    
    this.message = `${player.name} 出完了所有手牌！`;
    
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    if (alivePlayers.length === 1) {
      this.endGame(alivePlayers[0].id);
    } else if (alivePlayers.length === 0) {
      this.message = '没有获胜者！';
      this.phase = 'gameOver';
    } else {
      if (playerId <= this.currentPlayer) {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        while (!this.players[this.currentPlayer].isAlive) {
          this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        }
      }
      
      setTimeout(() => this.startRound(), 2000);
    }
  }

  private endGame(winnerId: number): void {
    this.phase = 'gameOver';
    this.winner = winnerId;
    this.winnerAnnounced = true;
    const winner = this.players[winnerId];
    this.message = `🎉 ${winner.name} 获胜！🎉`;
  }

  getCardSymbol(card: Card): string {
    return this.getCardDisplay(card);
  }

  getFruitSymbol(fruit: Fruit): string {
    return FRUIT_SYMBOLS[fruit];
  }

  reset(): void {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
    }
    this.initGame();
  }

  canPlayerRing(): boolean {
    return this.canRing && this.status === 'reaction' && this.players[0].isAlive;
  }

  getCurrentPlayer(): Player | null {
    return this.players[this.currentPlayer];
  }

  isFiveFruits(): boolean {
    return this.checkFiveFruits();
  }
}
