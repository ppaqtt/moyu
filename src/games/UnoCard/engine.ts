export type UnoColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type UnoType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface UnoCard {
  color: UnoColor;
  type: UnoType;
  value: number;
  id: string;
}

export type GameDirection = 'clockwise' | 'counterclockwise';
export type GamePhase = 'setup' | 'playing' | 'ended';

export interface Player {
  id: number;
  name: string;
  hand: UnoCard[];
  isAI: boolean;
  score: number;
}

export interface UnoState {
  players: Player[];
  currentPlayer: number;
  direction: GameDirection;
  phase: GamePhase;
  deck: UnoCard[];
  discardPile: UnoCard[];
  topCard: UnoCard | null;
  currentColor: UnoColor | null;
  winner: number | null;
  drawCount: number;
  mustPlayDrawn: boolean;
}

export class UnoEngine {
  private players: Player[];
  private currentPlayer: number;
  private direction: GameDirection;
  private phase: GamePhase;
  private deck: UnoCard[];
  private discardPile: UnoCard[];
  private topCard: UnoCard | null;
  private currentColor: UnoColor | null;
  private winner: number | null;
  private drawCount: number;
  private mustPlayDrawn: boolean;

  constructor() {
    this.players = [];
    this.currentPlayer = 0;
    this.direction = 'clockwise';
    this.phase = 'setup';
    this.deck = [];
    this.discardPile = [];
    this.topCard = null;
    this.currentColor = null;
    this.winner = null;
    this.drawCount = 0;
    this.mustPlayDrawn = false;
    this.init();
  }

  private init(): void {
    this.deck = this.createDeck();
    this.shuffleDeck();
    this.players = this.createPlayers();
    this.dealCards();
    this.setupFirstCard();
    this.currentPlayer = 0;
    this.direction = 'clockwise';
    this.phase = 'playing';
    this.winner = null;
    this.drawCount = 0;
    this.mustPlayDrawn = false;
  }

  private createDeck(): UnoCard[] {
    const deck: UnoCard[] = [];
    const colors: UnoColor[] = ['red', 'yellow', 'green', 'blue'];
    let idCounter = 0;

    for (const color of colors) {
      deck.push({ color, type: 'number', value: 0, id: `${color}_0_${idCounter++}` });

      for (let i = 1; i <= 9; i++) {
        deck.push({ color, type: 'number', value: i, id: `${color}_${i}_${idCounter++}` });
        deck.push({ color, type: 'number', value: i, id: `${color}_${i}_${idCounter++}` });
      }

      for (let i = 0; i < 2; i++) {
        deck.push({ color, type: 'skip', value: -1, id: `${color}_skip_${idCounter++}` });
        deck.push({ color, type: 'reverse', value: -1, id: `${color}_reverse_${idCounter++}` });
        deck.push({ color, type: 'draw2', value: -1, id: `${color}_draw2_${idCounter++}` });
      }
    }

    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'wild', type: 'wild', value: -1, id: `wild_${idCounter++}` });
      deck.push({ color: 'wild', type: 'wild4', value: -1, id: `wild4_${idCounter++}` });
    }

    return deck;
  }

  private shuffleDeck(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  private createPlayers(): Player[] {
    return [
      { id: 0, name: '玩家', hand: [], isAI: false, score: 0 },
      { id: 1, name: 'AI 1', hand: [], isAI: true, score: 0 },
      { id: 2, name: 'AI 2', hand: [], isAI: true, score: 0 },
      { id: 3, name: 'AI 3', hand: [], isAI: true, score: 0 }
    ];
  }

  private dealCards(): void {
    for (let i = 0; i < 7; i++) {
      for (const player of this.players) {
        const card = this.deck.pop();
        if (card) {
          player.hand.push(card);
        }
      }
    }
  }

  private setupFirstCard(): void {
    let card = this.deck.pop();
    while (card && (card.type === 'wild' || card.type === 'wild4')) {
      this.deck.unshift(card);
      card = this.deck.pop();
    }

    if (card) {
      this.topCard = card;
      this.currentColor = card.color;
      this.discardPile.push(card);
    }
  }

  getState(): UnoState {
    return {
      players: this.players.map(p => ({
        ...p,
        hand: p.isAI ? p.hand.map(() => ({ color: 'wild', type: 'wild', value: -1, id: 'hidden' })) : p.hand
      })),
      currentPlayer: this.currentPlayer,
      direction: this.direction,
      phase: this.phase,
      deck: [],
      discardPile: this.discardPile,
      topCard: this.topCard,
      currentColor: this.currentColor,
      winner: this.winner,
      drawCount: this.drawCount,
      mustPlayDrawn: this.mustPlayDrawn
    };
  }

  getPlayerHand(playerId: number): UnoCard[] {
    return this.players[playerId].hand;
  }

  canPlayCard(card: UnoCard, topCard: UnoCard | null, currentColor: UnoColor | null): boolean {
    if (!topCard || !currentColor) return true;

    if (card.type === 'wild' || card.type === 'wild4') return true;

    if (card.color === currentColor) return true;

    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;

    if (card.type !== 'number' && card.type === topCard.type) return true;

    return false;
  }

  playCard(playerId: number, cardId: string, chosenColor?: UnoColor): boolean {
    if (this.phase !== 'playing' || playerId !== this.currentPlayer) return false;

    const player = this.players[playerId];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];

    if (!this.canPlayCard(card, this.topCard, this.currentColor)) return false;

    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.topCard = card;

    if (card.color === 'wild') {
      if (!chosenColor || chosenColor === 'wild') return false;
      this.currentColor = chosenColor;
    } else {
      this.currentColor = card.color;
    }

    this.applyCardEffect(card);

    if (player.hand.length === 0) {
      this.endGame(playerId);
      return true;
    }

    if (player.hand.length === 1) {
      this.message = `${player.name} UNO!`;
    }

    this.moveToNextPlayer();
    return true;
  }

  private applyCardEffect(card: UnoCard): void {
    switch (card.type) {
      case 'skip':
        this.moveToNextPlayer();
        break;
      case 'reverse':
        this.direction = this.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        if (this.players.filter(p => !p.isAI).length === 1) {
          this.moveToNextPlayer();
        }
        break;
      case 'draw2':
        this.drawCount = 2;
        break;
      case 'wild4':
        this.drawCount = 4;
        break;
    }
  }

  drawCard(playerId: number): boolean {
    if (this.phase !== 'playing' || playerId !== this.currentPlayer) return false;

    const player = this.players[playerId];

    if (this.drawCount > 0) {
      for (let i = 0; i < this.drawCount; i++) {
        const card = this.deck.pop();
        if (card) {
          player.hand.push(card);
        }
      }
      this.drawCount = 0;
      this.moveToNextPlayer();
      return true;
    }

    const card = this.deck.pop();
    if (!card) {
      this.reshuffleDeck();
      return this.drawCard(playerId);
    }

    player.hand.push(card);

    if (this.canPlayCard(card, this.topCard, this.currentColor)) {
      this.mustPlayDrawn = true;
      return true;
    }

    this.moveToNextPlayer();
    return true;
  }

  playDrawnCard(playerId: number, chosenColor?: UnoColor): boolean {
    if (!this.mustPlayDrawn || playerId !== this.currentPlayer) return false;

    const player = this.players[playerId];
    const card = player.hand[player.hand.length - 1];

    if (!this.canPlayCard(card, this.topCard, this.currentColor)) return false;

    player.hand.pop();
    this.discardPile.push(card);
    this.topCard = card;

    if (card.color === 'wild') {
      if (!chosenColor || chosenColor === 'wild') return false;
      this.currentColor = chosenColor;
    } else {
      this.currentColor = card.color;
    }

    this.mustPlayDrawn = false;
    this.applyCardEffect(card);

    if (player.hand.length === 0) {
      this.endGame(playerId);
      return true;
    }

    this.moveToNextPlayer();
    return true;
  }

  private reshuffleDeck(): void {
    if (this.discardPile.length <= 1) return;

    const topCard = this.discardPile.pop();
    this.deck = [...this.discardPile];
    this.discardPile = topCard ? [topCard] : [];
    this.shuffleDeck();
  }

  private moveToNextPlayer(): void {
    this.mustPlayDrawn = false;

    if (this.direction === 'clockwise') {
      this.currentPlayer = (this.currentPlayer + 1) % 4;
    } else {
      this.currentPlayer = (this.currentPlayer - 1 + 4) % 4;
    }

    if (this.players[this.currentPlayer].isAI) {
      setTimeout(() => this.aiTurn(), 1500);
    }
  }

  private aiTurn(): void {
    const player = this.players[this.currentPlayer];

    if (this.drawCount > 0) {
      this.drawCard(this.currentPlayer);
      return;
    }

    const playableCards = player.hand.filter(card =>
      this.canPlayCard(card, this.topCard, this.currentColor)
    );

    if (playableCards.length > 0) {
      const card = this.selectBestCard(playableCards);
      let chosenColor: UnoColor | undefined;

      if (card.color === 'wild') {
        chosenColor = this.selectBestColor(player.hand);
      }

      this.playCard(this.currentPlayer, card.id, chosenColor);
    } else {
      this.drawCard(this.currentPlayer);
    }
  }

  private selectBestCard(cards: UnoCard[]): UnoCard {
    const wild4 = cards.find(c => c.type === 'wild4');
    if (wild4) return wild4;

    const wild = cards.find(c => c.type === 'wild');
    if (wild) return wild;

    const draw2 = cards.find(c => c.type === 'draw2');
    if (draw2) return draw2;

    const skip = cards.find(c => c.type === 'skip');
    if (skip) return skip;

    const reverse = cards.find(c => c.type === 'reverse');
    if (reverse) return reverse;

    return cards[0];
  }

  private selectBestColor(hand: UnoCard[]): UnoColor {
    const colorCounts: Record<string, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
    for (const card of hand) {
      if (card.color !== 'wild') {
        colorCounts[card.color]++;
      }
    }

    let bestColor: UnoColor = 'red';
    let maxCount = 0;

    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestColor = color as UnoColor;
      }
    }

    return bestColor;
  }

  private endGame(winnerId: number): void {
    this.winner = winnerId;
    this.phase = 'ended';

    const winner = this.players[winnerId];
    winner.score += this.calculateScore();
  }

  private calculateScore(): number {
    let score = 0;
    for (const player of this.players) {
      for (const card of player.hand) {
        if (card.type === 'number') {
          score += card.value;
        } else if (card.type === 'draw2' || card.type === 'reverse' || card.type === 'skip') {
          score += 20;
        } else {
          score += 50;
        }
      }
    }
    return score;
  }

  reset(): void {
    this.init();
  }

  getColorName(color: UnoColor): string {
    const names: Record<UnoColor, string> = {
      red: '红',
      yellow: '黄',
      green: '绿',
      blue: '蓝',
      wild: '万能'
    };
    return names[color];
  }

  getCardDisplay(card: UnoCard): string {
    if (card.type === 'number') return card.value.toString();
    if (card.type === 'skip') return '禁';
    if (card.type === 'reverse') return '转';
    if (card.type === 'draw2') return '+2';
    if (card.type === 'wild') return '万能';
    if (card.type === 'wild4') return '+4';
    return '';
  }

  getColorHex(color: UnoColor): string {
    const colors: Record<UnoColor, string> = {
      red: '#ff4444',
      yellow: '#ffcc00',
      green: '#44ff44',
      blue: '#4444ff',
      wild: '#333333'
    };
    return colors[color];
  }

  message: string = '';

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 250);
    gradient.addColorStop(0, 'rgba(100, 100, 150, 0.3)');
    gradient.addColorStop(1, 'rgba(50, 50, 80, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNO', centerX, 40);

    if (this.topCard) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`当前颜色: ${this.getColorName(this.currentColor || 'red')}`, centerX, 70);

      this.renderUnoCard(ctx, this.topCard, centerX - 40, centerY - 60, 80, 120);
    }

    if (this.deck.length > 0) {
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.roundRect(centerX + 20, centerY - 60, 80, 120, 10);
      ctx.fill();

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('UNO', centerX + 60, centerY);

      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${this.deck.length}`, centerX + 60, centerY + 20);
    }

    const positions = [
      { x: centerX, y: height - 80, label: '玩家' },
      { x: 60, y: centerY, label: 'AI 1' },
      { x: centerX, y: 100, label: 'AI 2' },
      { x: width - 60, y: centerY, label: 'AI 3' }
    ];

    for (let i = 0; i < 4; i++) {
      const pos = positions[i];
      const player = this.players[i];

      ctx.fillStyle = this.currentPlayer === i ? 'rgba(255, 215, 0, 0.3)' : 'rgba(100, 100, 100, 0.3)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = this.currentPlayer === i ? '#ffd700' : '#666';
      ctx.lineWidth = this.currentPlayer === i ? 3 : 1;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pos.label, pos.x, pos.y - 5);
      ctx.fillText(`${player.hand.length}张`, pos.x, pos.y + 10);

      if (player.hand.length === 1) {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('UNO!', pos.x, pos.y - 25);
      }
    }

    if (this.drawCount > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`+${this.drawCount}`, centerX, centerY - 100);
    }
  }

  private renderUnoCard(ctx: CanvasRenderingContext2D, card: UnoCard, x: number, y: number, width: number, height: number): void {
    const color = this.getColorHex(card.color);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width * 0.35, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = `bold ${width * 0.25}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getCardDisplay(card), x + width / 2, y + height / 2);

    ctx.font = `${width * 0.15}px sans-serif`;
    ctx.fillText(this.getCardDisplay(card), x + 15, y + 20);
    ctx.fillText(this.getCardDisplay(card), x + width - 15, y + height - 20);
  }
}
