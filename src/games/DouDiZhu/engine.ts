export type Suit = 'spade' | 'heart' | 'club' | 'diamond' | 'joker';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | 'small' | 'big';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type CardType = 'single' | 'pair' | 'triple' | 'triple_with_single' | 'triple_with_pair' | 'straight' | 'double_straight' | 'triple_straight' | 'bomb' | 'rocket' | 'quad_with_two' | 'quad_with_two_pairs';

export interface PlayedHand {
  type: CardType;
  cards: Card[];
  value: number;
}

export type PlayerRole = 'landlord' | 'farmer';
export type GamePhase = 'bidding' | 'playing' | 'ended';

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  role: PlayerRole | null;
  isAI: boolean;
  bidScore: number;
}

export interface DouDiZhuState {
  players: Player[];
  currentPlayer: number;
  phase: GamePhase;
  lastPlayedHand: PlayedHand | null;
  lastPlayedBy: number;
  landlordCards: Card[];
  deck: Card[];
  bidRound: number;
  currentBid: number;
  winner: number | null;
  scores: number[];
}

const CARD_RANK_VALUE: Record<Rank, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
  'small': 16, 'big': 17
};

export class DouDiZhuEngine {
  private players: Player[];
  private currentPlayer: number;
  private phase: GamePhase;
  private lastPlayedHand: PlayedHand | null;
  private lastPlayedBy: number;
  private landlordCards: Card[];
  private deck: Card[];
  private bidRound: number;
  private currentBid: number;
  private winner: number | null;
  private scores: number[];

  constructor() {
    this.players = [];
    this.currentPlayer = 0;
    this.phase = 'bidding';
    this.lastPlayedHand = null;
    this.lastPlayedBy = -1;
    this.landlordCards = [];
    this.deck = [];
    this.bidRound = 0;
    this.currentBid = 0;
    this.winner = null;
    this.scores = [0, 0, 0];
    this.init();
  }

  private init(): void {
    this.deck = this.createDeck();
    this.shuffleDeck();
    this.players = this.createPlayers();
    this.dealCards();
    this.currentPlayer = 0;
    this.phase = 'bidding';
    this.lastPlayedHand = null;
    this.lastPlayedBy = -1;
    this.bidRound = 0;
    this.currentBid = 0;
    this.winner = null;
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    const suits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
    const ranks: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          id: `${suit}_${rank}_${deck.length}`
        });
      }
    }

    deck.push({ suit: 'joker', rank: 'small', id: 'joker_small' });
    deck.push({ suit: 'joker', rank: 'big', id: 'joker_big' });

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
      { id: 0, name: '玩家', hand: [], role: null, isAI: false, bidScore: 0 },
      { id: 1, name: 'AI 1', hand: [], role: null, isAI: true, bidScore: 0 },
      { id: 2, name: 'AI 2', hand: [], role: null, isAI: true, bidScore: 0 }
    ];
  }

  private dealCards(): void {
    for (let i = 0; i < 51; i++) {
      this.players[i % 3].hand.push(this.deck[i]);
    }

    for (const player of this.players) {
      player.hand.sort((a, b) => CARD_RANK_VALUE[b.rank] - CARD_RANK_VALUE[a.rank]);
    }

    this.landlordCards = this.deck.slice(51, 54);
  }

  getState(): DouDiZhuState {
    return {
      players: this.players.map(p => ({
        ...p,
        hand: p.isAI ? p.hand.map(() => ({ suit: 'joker', rank: 'small', id: 'hidden' })) : p.hand
      })),
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      lastPlayedHand: this.lastPlayedHand,
      lastPlayedBy: this.lastPlayedBy,
      landlordCards: this.landlordCards,
      deck: [],
      bidRound: this.bidRound,
      currentBid: this.currentBid,
      winner: this.winner,
      scores: this.scores
    };
  }

  getPlayerHand(playerId: number): Card[] {
    return this.players[playerId].hand;
  }

  bid(playerId: number, score: number): boolean {
    if (this.phase !== 'bidding' || playerId !== this.currentPlayer) return false;
    if (score !== 0 && score <= this.currentBid) return false;
    if (score !== 0 && score !== 1 && score !== 2 && score !== 3) return false;

    this.players[playerId].bidScore = score;

    if (score > this.currentBid) {
      this.currentBid = score;
    }

    this.bidRound++;

    if (this.bidRound >= 3 && this.currentBid > 0) {
      const landlord = this.players.findIndex(p => p.bidScore === this.currentBid);
      this.assignLandlord(landlord);
      return true;
    }

    if (this.bidRound >= 3 && this.currentBid === 0) {
      this.restartBidding();
      return true;
    }

    this.currentPlayer = (this.currentPlayer + 1) % 3;

    if (this.players[this.currentPlayer].isAI) {
      setTimeout(() => this.aiBid(), 1000);
    }

    return true;
  }

  private aiBid(): void {
    const player = this.players[this.currentPlayer];
    const handStrength = this.evaluateHandStrength(player.hand);

    let bidScore = 0;
    if (handStrength > 0.7 && this.currentBid < 3) bidScore = 3;
    else if (handStrength > 0.5 && this.currentBid < 2) bidScore = 2;
    else if (handStrength > 0.3 && this.currentBid < 1) bidScore = 1;

    this.bid(this.currentPlayer, bidScore);
  }

  private evaluateHandStrength(hand: Card[]): number {
    let strength = 0;
    const hasRocket = hand.some(c => c.rank === 'small') && hand.some(c => c.rank === 'big');
    if (hasRocket) strength += 0.3;

    const bombCount = this.countBombs(hand);
    strength += bombCount * 0.15;

    const highCards = hand.filter(c => CARD_RANK_VALUE[c.rank] >= 14).length;
    strength += highCards * 0.03;

    return Math.min(strength, 1);
  }

  private countBombs(hand: Card[]): number {
    const rankCount: Record<string, number> = {};
    for (const card of hand) {
      rankCount[card.rank] = (rankCount[card.rank] || 0) + 1;
    }
    return Object.values(rankCount).filter(c => c === 4).length;
  }

  private assignLandlord(landlordId: number): void {
    this.players[landlordId].role = 'landlord';
    this.players[landlordId].hand.push(...this.landlordCards);
    this.players[landlordId].hand.sort((a, b) => CARD_RANK_VALUE[b.rank] - CARD_RANK_VALUE[a.rank]);

    for (let i = 0; i < 3; i++) {
      if (i !== landlordId) {
        this.players[i].role = 'farmer';
      }
    }

    this.currentPlayer = landlordId;
    this.phase = 'playing';
  }

  private restartBidding(): void {
    this.init();
  }

  playCards(playerId: number, cardIds: string[]): boolean {
    if (this.phase !== 'playing' || playerId !== this.currentPlayer) return false;

    const cards = this.players[playerId].hand.filter(c => cardIds.includes(c.id));
    if (cards.length !== cardIds.length) return false;

    const handType = this.identifyHandType(cards);
    if (!handType) return false;

    if (this.lastPlayedHand && this.lastPlayedBy !== playerId) {
      if (!this.canBeat(handType, this.lastPlayedHand)) return false;
    }

    this.players[playerId].hand = this.players[playerId].hand.filter(c => !cardIds.includes(c.id));

    this.lastPlayedHand = handType;
    this.lastPlayedBy = playerId;

    if (this.players[playerId].hand.length === 0) {
      this.endGame(playerId);
      return true;
    }

    this.currentPlayer = (this.currentPlayer + 1) % 3;

    if (this.players[this.currentPlayer].isAI) {
      setTimeout(() => this.aiPlay(), 1500);
    }

    return true;
  }

  pass(playerId: number): boolean {
    if (this.phase !== 'playing' || playerId !== this.currentPlayer) return false;
    if (this.lastPlayedHand === null || this.lastPlayedBy === playerId) return false;

    this.currentPlayer = (this.currentPlayer + 1) % 3;

    if (this.currentPlayer === this.lastPlayedBy) {
      this.lastPlayedHand = null;
    }

    if (this.players[this.currentPlayer].isAI) {
      setTimeout(() => this.aiPlay(), 1500);
    }

    return true;
  }

  private aiPlay(): void {
    const player = this.players[this.currentPlayer];

    if (this.lastPlayedHand && this.lastPlayedBy !== this.currentPlayer) {
      const beatingHand = this.findBeatingHand(player.hand, this.lastPlayedHand);
      if (beatingHand) {
        this.playCards(this.currentPlayer, beatingHand.map(c => c.id));
      } else {
        this.pass(this.currentPlayer);
      }
    } else {
      const hand = this.selectBestHand(player.hand);
      if (hand) {
        this.playCards(this.currentPlayer, hand.map(c => c.id));
      }
    }
  }

  private findBeatingHand(hand: Card[], target: PlayedHand): Card[] | null {
    const possibleHands = this.generateAllPossibleHands(hand);

    for (const possibleHand of possibleHands) {
      const handType = this.identifyHandType(possibleHand);
      if (handType && this.canBeat(handType, target)) {
        return possibleHand;
      }
    }

    return null;
  }

  private selectBestHand(hand: Card[]): Card[] | null {
    const singles = hand.filter((c, i, arr) => arr.filter(x => x.rank === c.rank).length === 1);
    if (singles.length > 0) {
      return [singles[0]];
    }

    const pairs = this.findPairs(hand);
    if (pairs.length > 0) {
      return pairs[0];
    }

    if (hand.length > 0) {
      return [hand[0]];
    }

    return null;
  }

  private generateAllPossibleHands(hand: Card[]): Card[][] {
    const hands: Card[][] = [];

    for (const card of hand) {
      hands.push([card]);
    }

    const pairs = this.findPairs(hand);
    hands.push(...pairs);

    const triples = this.findTriples(hand);
    hands.push(...triples);

    const bombs = this.findBombs(hand);
    hands.push(...bombs);

    const rocket = this.findRocket(hand);
    if (rocket) hands.push(rocket);

    return hands;
  }

  private findPairs(hand: Card[]): Card[][] {
    const pairs: Card[][] = [];
    const rankGroups = this.groupByRank(hand);
    for (const [rank, cards] of Object.entries(rankGroups)) {
      if (cards.length >= 2 && rank !== 'small' && rank !== 'big') {
        pairs.push(cards.slice(0, 2));
      }
    }
    return pairs;
  }

  private findTriples(hand: Card[]): Card[][] {
    const triples: Card[][] = [];
    const rankGroups = this.groupByRank(hand);
    for (const [rank, cards] of Object.entries(rankGroups)) {
      if (cards.length >= 3 && rank !== 'small' && rank !== 'big') {
        triples.push(cards.slice(0, 3));
      }
    }
    return triples;
  }

  private findBombs(hand: Card[]): Card[][] {
    const bombs: Card[][] = [];
    const rankGroups = this.groupByRank(hand);
    for (const [rank, cards] of Object.entries(rankGroups)) {
      if (cards.length === 4) {
        bombs.push(cards);
      }
    }
    return bombs;
  }

  private findRocket(hand: Card[]): Card[] | null {
    const small = hand.find(c => c.rank === 'small');
    const big = hand.find(c => c.rank === 'big');
    if (small && big) return [small, big];
    return null;
  }

  private groupByRank(hand: Card[]): Record<string, Card[]> {
    const groups: Record<string, Card[]> = {};
    for (const card of hand) {
      if (!groups[card.rank]) groups[card.rank] = [];
      groups[card.rank].push(card);
    }
    return groups;
  }

  identifyHandType(cards: Card[]): PlayedHand | null {
    if (cards.length === 0) return null;

    const sorted = [...cards].sort((a, b) => CARD_RANK_VALUE[b.rank] - CARD_RANK_VALUE[a.rank]);

    if (cards.length === 1) {
      return { type: 'single', cards, value: CARD_RANK_VALUE[sorted[0].rank] };
    }

    if (cards.length === 2 && sorted[0].rank === 'small' && sorted[1].rank === 'big') {
      return { type: 'rocket', cards, value: 100 };
    }

    const rankGroups = this.groupByRank(sorted);
    const groupSizes = Object.values(rankGroups).map(g => g.length);

    if (cards.length === 2 && groupSizes[0] === 2) {
      return { type: 'pair', cards, value: CARD_RANK_VALUE[sorted[0].rank] };
    }

    if (cards.length === 4 && groupSizes[0] === 4) {
      return { type: 'bomb', cards, value: CARD_RANK_VALUE[sorted[0].rank] + 50 };
    }

    if (cards.length === 3 && groupSizes[0] === 3) {
      return { type: 'triple', cards, value: CARD_RANK_VALUE[sorted[0].rank] };
    }

    if (cards.length === 4 && groupSizes[0] === 3) {
      return { type: 'triple_with_single', cards, value: CARD_RANK_VALUE[Object.keys(rankGroups)[0]] };
    }

    if (cards.length === 5 && groupSizes[0] === 3 && groupSizes[1] === 2) {
      return { type: 'triple_with_pair', cards, value: CARD_RANK_VALUE[Object.keys(rankGroups)[0]] };
    }

    if (this.isStraight(sorted)) {
      return { type: 'straight', cards, value: CARD_RANK_VALUE[sorted[0].rank] };
    }

    return null;
  }

  private isStraight(cards: Card[]): boolean {
    if (cards.length < 5) return false;
    const values = cards.map(c => CARD_RANK_VALUE[c.rank]).sort((a, b) => b - a);
    if (values[0] > 14) return false;
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] - values[i] !== 1) return false;
    }
    return true;
  }

  canBeat(hand1: PlayedHand, hand2: PlayedHand): boolean {
    if (hand1.type === 'rocket') return true;
    if (hand2.type === 'rocket') return false;
    if (hand1.type === 'bomb' && hand2.type !== 'bomb') return true;
    if (hand1.type !== 'bomb' && hand2.type === 'bomb') return false;

    if (hand1.type !== hand2.type) return false;
    if (hand1.cards.length !== hand2.cards.length) return false;

    return hand1.value > hand2.value;
  }

  private endGame(winnerId: number): void {
    this.winner = winnerId;
    this.phase = 'ended';

    const winnerIsLandlord = this.players[winnerId].role === 'landlord';
    const baseScore = this.currentBid || 1;
    const multiplier = this.lastPlayedHand?.type === 'bomb' || this.lastPlayedHand?.type === 'rocket' ? 2 : 1;
    const finalScore = baseScore * multiplier;

    if (winnerIsLandlord) {
      this.scores[winnerId] += finalScore * 2;
      for (let i = 0; i < 3; i++) {
        if (i !== winnerId) this.scores[i] -= finalScore;
      }
    } else {
      for (let i = 0; i < 3; i++) {
        if (this.players[i].role === 'farmer') {
          this.scores[i] += finalScore;
        } else {
          this.scores[i] -= finalScore * 2;
        }
      }
    }
  }

  reset(): void {
    this.init();
  }

  getHint(playerId: number): Card[] | null {
    const hand = this.players[playerId].hand;

    if (this.lastPlayedHand && this.lastPlayedBy !== playerId) {
      return this.findBeatingHand(hand, this.lastPlayedHand);
    }

    return this.selectBestHand(hand);
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.landlordCards.length > 0 && this.phase === 'bidding') {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('底牌', centerX, centerY - 40);

      this.renderCards(ctx, this.landlordCards, centerX - 60, centerY - 20, 40, 25);
    }

    if (this.lastPlayedHand) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('上一轮出牌', centerX, centerY + 60);
      this.renderCards(ctx, this.lastPlayedHand.cards, centerX - (this.lastPlayedHand.cards.length * 25), centerY + 75, 50, 30);
    }
  }

  private renderCards(ctx: CanvasRenderingContext2D, cards: Card[], startX: number, startY: number, cardWidth: number, cardHeight: number): void {
    for (let i = 0; i < cards.length; i++) {
      const x = startX + i * (cardWidth * 0.7);
      const y = startY;

      const gradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#e0e0e0');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, cardWidth, cardHeight, 5);
      ctx.fill();

      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.stroke();

      const card = cards[i];
      const color = (card.suit === 'heart' || card.suit === 'diamond') ? '#ff0000' : '#000000';
      ctx.fillStyle = color;
      ctx.font = `bold ${cardWidth * 0.3}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.getRankDisplay(card.rank), x + cardWidth / 2, y + cardHeight * 0.4);

      ctx.font = `${cardWidth * 0.2}px sans-serif`;
      ctx.fillText(this.getSuitDisplay(card.suit), x + cardWidth / 2, y + cardHeight * 0.75);
    }
  }

  private getRankDisplay(rank: Rank): string {
    if (rank === 'small') return '小王';
    if (rank === 'big') return '大王';
    return rank;
  }

  private getSuitDisplay(suit: Suit): string {
    const displays: Record<Suit, string> = {
      spade: '♠',
      heart: '♥',
      club: '♣',
      diamond: '♦',
      joker: '🃏'
    };
    return displays[suit];
  }
}
