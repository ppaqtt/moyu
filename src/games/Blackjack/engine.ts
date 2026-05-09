export type Suit = 'spade' | 'heart' | 'club' | 'diamond';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type GamePhase = 'betting' | 'playing' | 'dealer' | 'ended';

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  chips: number;
  bet: number;
  isAI: boolean;
  isBusted: boolean;
  isStand: boolean;
  isBlackjack: boolean;
}

export interface BlackjackState {
  players: Player[];
  dealerHand: Card[];
  deck: Card[];
  phase: GamePhase;
  currentPlayer: number;
  winner: number | null;
  message: string;
}

const CARD_VALUES: Record<Rank, number[]> = {
  'A': [1, 11],
  '2': [2],
  '3': [3],
  '4': [4],
  '5': [5],
  '6': [6],
  '7': [7],
  '8': [8],
  '9': [9],
  '10': [10],
  'J': [10],
  'Q': [10],
  'K': [10]
};

export class BlackjackEngine {
  private players: Player[];
  private dealerHand: Card[];
  private deck: Card[];
  private phase: GamePhase;
  private currentPlayer: number;
  private winner: number | null;
  private message: string;
  private dealerAce: boolean;

  constructor() {
    this.players = [];
    this.dealerHand = [];
    this.deck = [];
    this.phase = 'betting';
    this.currentPlayer = 0;
    this.winner = null;
    this.message = '请下注';
    this.dealerAce = false;
    this.init();
  }

  private init(): void {
    this.deck = this.createDeck();
    this.shuffleDeck();
    this.players = this.createPlayers();
    this.dealerHand = [];
    this.phase = 'betting';
    this.currentPlayer = 0;
    this.winner = null;
    this.message = '请下注';
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    const suits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          id: `${suit}_${rank}_${deck.length}`
        });
      }
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
      { id: 0, name: '玩家', hand: [], chips: 1000, bet: 0, isAI: false, isBusted: false, isStand: false, isBlackjack: false },
      { id: 1, name: '庄家', hand: [], chips: 0, bet: 0, isAI: true, isBusted: false, isStand: false, isBlackjack: false }
    ];
  }

  getState(): BlackjackState {
    return {
      players: this.players.map(p => ({
        ...p,
        hand: p.isAI ? [] : p.hand
      })),
      dealerHand: this.phase === 'ended' || this.phase === 'dealer' ? this.dealerHand : this.dealerHand.slice(0, 1),
      deck: [],
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      message: this.message
    };
  }

  getPlayerHand(playerId: number): Card[] {
    if (playerId === 1) {
      return this.dealerHand;
    }
    return this.players[playerId].hand;
  }

  placeBet(playerId: number, amount: number): boolean {
    if (this.phase !== 'betting') return false;

    const player = this.players[playerId];
    if (amount > player.chips || amount <= 0) return false;

    player.bet = amount;
    return true;
  }

  dealCards(): void {
    for (const player of this.players) {
      const card1 = this.deck.pop();
      const card2 = this.deck.pop();
      if (card1) player.hand.push(card1);
      if (card2) player.hand.push(card2);
    }

    const dealer1 = this.deck.pop();
    const dealer2 = this.deck.pop();
    if (dealer1) this.dealerHand.push(dealer1);
    if (dealer2) this.dealerHand.push(dealer2);

    if (dealer1?.rank === 'A') {
      this.dealerAce = true;
    }

    this.phase = 'playing';

    if (this.checkBlackjack(this.players[0].hand)) {
      this.players[0].isBlackjack = true;
      this.playDealer();
    }
  }

  private checkBlackjack(hand: Card[]): boolean {
    return hand.length === 2 && this.calculateHandValue(hand) === 21;
  }

  private calculateHandValue(hand: Card[]): number {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      const cardValues = CARD_VALUES[card.rank];
      if (card.rank === 'A') {
        aces++;
        value += 1;
      } else {
        value += cardValues[0];
      }
    }

    for (let i = 0; i < aces; i++) {
      if (value + 10 <= 21) {
        value += 10;
      }
    }

    return value;
  }

  hit(playerId: number): boolean {
    if (this.phase !== 'playing' || playerId !== this.currentPlayer) return false;

    const player = this.players[playerId];
    if (player.isBusted || player.isStand) return false;

    const card = this.deck.pop();
    if (!card) return false;

    player.hand.push(card);
    const handValue = this.calculateHandValue(player.hand);

    if (handValue > 21) {
      player.isBusted = true;
      this.endRound(playerId, false);
      return true;
    }

    if (handValue === 21) {
      this.stand(playerId);
    }

    return true;
  }

  stand(playerId: number): boolean {
    if (this.phase !== 'playing' || playerId !== this.currentPlayer) return false;

    const player = this.players[playerId];
    if (player.isBusted) return false;

    player.isStand = true;

    if (playerId === 0) {
      this.playDealer();
    }

    return true;
  }

  doubleDown(playerId: number): boolean {
    if (this.phase !== 'playing' || playerId !== this.currentPlayer) return false;

    const player = this.players[playerId];
    if (player.hand.length !== 2 || player.chips < player.bet) return false;

    player.chips -= player.bet;
    player.bet *= 2;

    const card = this.deck.pop();
    if (!card) return false;

    player.hand.push(card);

    const handValue = this.calculateHandValue(player.hand);
    if (handValue > 21) {
      player.isBusted = true;
    }

    player.isStand = true;
    this.playDealer();

    return true;
  }

  private playDealer(): void {
    this.phase = 'dealer';

    setTimeout(() => {
      while (this.calculateHandValue(this.dealerHand) < 17) {
        const card = this.deck.pop();
        if (card) {
          this.dealerHand.push(card);
        }
      }

      this.determineWinner();
    }, 1000);
  }

  private determineWinner(): void {
    const player = this.players[0];
    const dealerValue = this.calculateHandValue(this.dealerHand);
    const playerValue = this.calculateHandValue(player.hand);

    this.phase = 'ended';

    if (player.isBusted) {
      this.winner = 1;
      this.message = `你爆牌了! 庄家 ${dealerValue}点`;
    } else if (this.dealerHand.length > 0 && this.calculateHandValue(this.dealerHand) > 21) {
      this.winner = 0;
      player.chips += player.bet * 2;
      this.message = `庄家爆牌! 你赢了 ${player.bet} 筹码!`;
    } else if (player.isBlackjack && this.dealerHand.length === 2 && dealerValue === 21) {
      this.winner = null;
      player.chips += player.bet;
      this.message = '平局! 双方都是Blackjack';
    } else if (player.isBlackjack) {
      this.winner = 0;
      player.chips += Math.floor(player.bet * 2.5);
      this.message = 'Blackjack! 你赢了!';
    } else if (dealerValue > playerValue) {
      this.winner = 1;
      this.message = `庄家 ${dealerValue}点 > 你的 ${playerValue}点`;
    } else if (dealerValue < playerValue) {
      this.winner = 0;
      player.chips += player.bet * 2;
      this.message = `你赢了 ${player.bet} 筹码!`;
    } else {
      this.winner = null;
      player.chips += player.bet;
      this.message = '平局!';
    }
  }

  private endRound(winnerId: number, playerWon: boolean): void {
    const player = this.players[0];
    this.phase = 'ended';

    if (!playerWon) {
      this.winner = 1;
    }
  }

  getPlayerValue(playerId: number): number {
    const hand = this.getPlayerHand(playerId);
    return this.calculateHandValue(hand);
  }

  canDoubleDown(playerId: number): boolean {
    const player = this.players[playerId];
    return player.hand.length === 2 && player.chips >= player.bet && !player.isBusted && !player.isStand;
  }

  reset(): void {
    this.init();
  }

  getSuitSymbol(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      spade: '♠',
      heart: '♥',
      club: '♣',
      diamond: '♦'
    };
    return symbols[suit];
  }

  getCardColor(suit: Suit): string {
    return (suit === 'heart' || suit === 'diamond') ? '#ff0000' : '#000000';
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
    gradient.addColorStop(0, 'rgba(50, 50, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(20, 20, 40, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('二十一点', centerX, 40);

    ctx.font = '16px sans-serif';
    ctx.fillText(this.message, centerX, 70);

    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`玩家筹码: ${this.players[0].chips}`, 20, 30);
    ctx.fillText(`当前下注: ${this.players[0].bet}`, 20, 55);

    if (this.dealerHand.length > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      const dealerValue = this.phase === 'playing' || this.phase === 'betting'
        ? this.calculateHandValue([this.dealerHand[0]])
        : this.calculateHandValue(this.dealerHand);
      ctx.fillText(`庄家: ${dealerValue}点`, centerX, 120);

      this.renderCards(ctx, this.dealerHand, centerX - (this.dealerHand.length * 35), 130, 70, 100, this.phase === 'playing' || this.phase === 'betting');
    }

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    const playerValue = this.calculateHandValue(this.players[0].hand);
    ctx.fillText(`你: ${playerValue}点`, centerX, 360);

    this.renderCards(ctx, this.players[0].hand, centerX - (this.players[0].hand.length * 35), 380, 70, 100, true);

    if (this.players[0].isBusted) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('爆牌!', centerX, centerY);
    }
  }

  private renderCards(ctx: CanvasRenderingContext2D, cards: Card[], startX: number, startY: number, cardWidth: number, cardHeight: number, showBack: boolean = false): void {
    for (let i = 0; i < cards.length; i++) {
      const x = startX + i * (cardWidth * 0.6);
      const y = startY;

      const gradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f0f0f0');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, cardWidth, cardHeight, 8);
      ctx.fill();

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!showBack || i > 0) {
        const card = cards[i];
        const color = this.getCardColor(card.suit);
        const symbol = this.getSuitSymbol(card.suit);

        ctx.fillStyle = color;
        ctx.font = `bold ${cardWidth * 0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(card.rank, x + cardWidth / 2, y + cardHeight * 0.3);

        ctx.font = `${cardWidth * 0.4}px sans-serif`;
        ctx.fillText(symbol, x + cardWidth / 2, y + cardHeight * 0.7);

        ctx.textAlign = 'left';
        ctx.font = `${cardWidth * 0.2}px sans-serif`;
        ctx.fillText(card.rank, x + 5, y + 15);
        ctx.fillText(symbol, x + 5, y + 28);
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 5, cardWidth - 10, cardHeight - 10, 4);
        ctx.fill();

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}
