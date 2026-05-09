export type Suit = 'spade' | 'heart' | 'club' | 'diamond';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';
export type PlayerStatus = 'active' | 'folded' | 'allin';

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  chips: number;
  bet: number;
  totalBet: number;
  status: PlayerStatus;
  isAI: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
}

export interface TexasPokerState {
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  currentPlayer: number;
  phase: GamePhase;
  deck: Card[];
  dealer: number;
  winners: number[];
  lastAction: { player: number; action: PlayerAction; amount: number } | null;
}

export type HandRank =
  | 'high_card'
  | 'one_pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush';

export interface HandEvaluation {
  rank: HandRank;
  value: number;
  kickers: number[];
}

const CARD_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const HAND_RANK_VALUES: Record<HandRank, number> = {
  'high_card': 1,
  'one_pair': 2,
  'two_pair': 3,
  'three_of_a_kind': 4,
  'straight': 5,
  'flush': 6,
  'full_house': 7,
  'four_of_a_kind': 8,
  'straight_flush': 9,
  'royal_flush': 10
};

export class TexasPokerEngine {
  private players: Player[];
  private communityCards: Card[];
  private pot: number;
  private currentBet: number;
  private currentPlayer: number;
  private phase: GamePhase;
  private deck: Card[];
  private dealer: number;
  private winners: number[];
  private lastAction: { player: number; action: PlayerAction; amount: number } | null;
  private smallBlind: number;
  private bigBlind: number;

  constructor() {
    this.players = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.currentPlayer = 0;
    this.phase = 'preflop';
    this.deck = [];
    this.dealer = 0;
    this.winners = [];
    this.lastAction = null;
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.init();
  }

  private init(): void {
    this.deck = this.createDeck();
    this.shuffleDeck();
    this.players = this.createPlayers();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.phase = 'preflop';
    this.winners = [];
    this.lastAction = null;
    this.dealCards();
    this.postBlinds();
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    const suits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

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
      { id: 0, name: '玩家', hand: [], chips: 1000, bet: 0, totalBet: 0, status: 'active', isAI: false, isDealer: true, isSmallBlind: false, isBigBlind: false },
      { id: 1, name: 'AI 1', hand: [], chips: 1000, bet: 0, totalBet: 0, status: 'active', isAI: true, isDealer: false, isSmallBlind: true, isBigBlind: false },
      { id: 2, name: 'AI 2', hand: [], chips: 1000, bet: 0, totalBet: 0, status: 'active', isAI: true, isDealer: false, isSmallBlind: false, isBigBlind: true },
      { id: 3, name: 'AI 3', hand: [], chips: 1000, bet: 0, totalBet: 0, status: 'active', isAI: true, isDealer: false, isSmallBlind: false, isBigBlind: false }
    ];
  }

  private dealCards(): void {
    for (let i = 0; i < 2; i++) {
      for (const player of this.players) {
        const card = this.deck.pop();
        if (card) {
          player.hand.push(card);
        }
      }
    }
  }

  private postBlinds(): void {
    const sbPlayer = this.players.find(p => p.isSmallBlind);
    const bbPlayer = this.players.find(p => p.isBigBlind);

    if (sbPlayer) {
      const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
      sbPlayer.chips -= sbAmount;
      sbPlayer.bet = sbAmount;
      sbPlayer.totalBet = sbAmount;
    }

    if (bbPlayer) {
      const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
      bbPlayer.chips -= bbAmount;
      bbPlayer.bet = bbAmount;
      bbPlayer.totalBet = bbAmount;
    }

    this.currentBet = this.bigBlind;
    this.pot = (sbPlayer?.bet || 0) + (bbPlayer?.bet || 0);
    this.currentPlayer = 3;
  }

  getState(): TexasPokerState {
    return {
      players: this.players.map(p => ({
        ...p,
        hand: p.isAI ? [] : p.hand
      })),
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      deck: [],
      dealer: this.dealer,
      winners: this.winners,
      lastAction: this.lastAction
    };
  }

  getPlayerHand(playerId: number): Card[] {
    return this.players[playerId].hand;
  }

  getValidActions(playerId: number): PlayerAction[] {
    const player = this.players[playerId];
    if (player.status !== 'active') return [];

    const actions: PlayerAction[] = ['fold'];

    if (this.currentBet === 0 || player.bet === this.currentBet) {
      actions.push('check');
    }

    if (player.chips > 0) {
      const callAmount = this.currentBet - player.bet;
      if (callAmount > 0 && player.chips >= callAmount) {
        actions.push('call');
      }

      if (player.chips > callAmount) {
        actions.push('raise');
      }

      actions.push('allin');
    }

    return actions;
  }

  performAction(playerId: number, action: PlayerAction, amount: number = 0): boolean {
    if (playerId !== this.currentPlayer) return false;

    const player = this.players[playerId];
    const validActions = this.getValidActions(playerId);

    if (!validActions.includes(action)) return false;

    switch (action) {
      case 'fold':
        player.status = 'folded';
        break;

      case 'check':
        break;

      case 'call':
        const callAmount = this.currentBet - player.bet;
        const actualCall = Math.min(callAmount, player.chips);
        player.chips -= actualCall;
        player.bet += actualCall;
        player.totalBet += actualCall;
        this.pot += actualCall;
        break;

      case 'raise':
        const raiseAmount = Math.max(amount, this.bigBlind);
        const totalBet = this.currentBet + raiseAmount;
        const actualRaise = Math.min(totalBet - player.bet, player.chips);

        if (actualRaise <= 0) return false;

        player.chips -= actualRaise;
        player.bet += actualRaise;
        player.totalBet += actualRaise;
        this.pot += actualRaise;
        this.currentBet = player.bet;
        break;

      case 'allin':
        const allInAmount = player.chips;
        player.bet += allInAmount;
        player.totalBet += allInAmount;
        this.pot += allInAmount;
        player.chips = 0;
        player.status = 'allin';

        if (player.bet > this.currentBet) {
          this.currentBet = player.bet;
        }
        break;
    }

    this.lastAction = { player: playerId, action, amount };

    if (this.isRoundComplete()) {
      this.advancePhase();
    } else {
      this.moveToNextPlayer();
    }

    return true;
  }

  private isRoundComplete(): boolean {
    const activePlayers = this.players.filter(p => p.status === 'active');

    if (activePlayers.length === 0) return true;

    const allBetsEqual = activePlayers.every(p => p.bet === this.currentBet);
    return allBetsEqual;
  }

  private moveToNextPlayer(): void {
    do {
      this.currentPlayer = (this.currentPlayer + 1) % 4;
    } while (this.players[this.currentPlayer].status !== 'active');

    if (this.players[this.currentPlayer].isAI) {
      setTimeout(() => this.aiAction(), 1500);
    }
  }

  private aiAction(): void {
    const player = this.players[this.currentPlayer];
    const handStrength = this.evaluateHandStrength(player.hand);
    const validActions = this.getValidActions(this.currentPlayer);

    let action: PlayerAction = 'fold';
    let amount = 0;

    if (handStrength > 0.7) {
      if (validActions.includes('raise')) {
        action = 'raise';
        amount = this.bigBlind * 2;
      } else if (validActions.includes('allin')) {
        action = 'allin';
      } else if (validActions.includes('call')) {
        action = 'call';
      } else {
        action = 'check';
      }
    } else if (handStrength > 0.4) {
      if (validActions.includes('call')) {
        action = 'call';
      } else if (validActions.includes('check')) {
        action = 'check';
      } else {
        action = 'fold';
      }
    } else {
      if (this.currentBet === 0 && validActions.includes('check')) {
        action = 'check';
      } else {
        action = 'fold';
      }
    }

    this.performAction(this.currentPlayer, action, amount);
  }

  private evaluateHandStrength(hand: Card[]): number {
    const allCards = [...hand, ...this.communityCards];
    if (allCards.length < 5) {
      const values = hand.map(c => CARD_VALUES[c.rank]);
      const maxValue = Math.max(...values);
      return maxValue / 14 * 0.5;
    }

    const evaluation = this.evaluateHand(allCards);
    return HAND_RANK_VALUES[evaluation.rank] / 10;
  }

  private advancePhase(): void {
    for (const player of this.players) {
      this.pot += player.bet;
      player.bet = 0;
    }
    this.currentBet = 0;

    switch (this.phase) {
      case 'preflop':
        this.dealCommunityCards(3);
        this.phase = 'flop';
        break;
      case 'flop':
        this.dealCommunityCards(1);
        this.phase = 'turn';
        break;
      case 'turn':
        this.dealCommunityCards(1);
        this.phase = 'river';
        break;
      case 'river':
        this.phase = 'showdown';
        this.determineWinners();
        return;
    }

    const activePlayers = this.players.filter(p => p.status === 'active');
    if (activePlayers.length === 1) {
      this.winners = [activePlayers[0].id];
      this.phase = 'ended';
      this.awardPot();
      return;
    }

    this.currentPlayer = (this.dealer + 1) % 4;
    while (this.players[this.currentPlayer].status !== 'active') {
      this.currentPlayer = (this.currentPlayer + 1) % 4;
    }

    if (this.players[this.currentPlayer].isAI) {
      setTimeout(() => this.aiAction(), 1000);
    }
  }

  private dealCommunityCards(count: number): void {
    for (let i = 0; i < count; i++) {
      const card = this.deck.pop();
      if (card) {
        this.communityCards.push(card);
      }
    }
  }

  private determineWinners(): void {
    const activePlayers = this.players.filter(p => p.status !== 'folded');
    const evaluations: { playerId: number; evaluation: HandEvaluation }[] = [];

    for (const player of activePlayers) {
      const allCards = [...player.hand, ...this.communityCards];
      const evaluation = this.evaluateHand(allCards);
      evaluations.push({ playerId: player.id, evaluation });
    }

    evaluations.sort((a, b) => {
      if (a.evaluation.value !== b.evaluation.value) {
        return b.evaluation.value - a.evaluation.value;
      }
      for (let i = 0; i < a.evaluation.kickers.length; i++) {
        if (a.evaluation.kickers[i] !== b.evaluation.kickers[i]) {
          return b.evaluation.kickers[i] - a.evaluation.kickers[i];
        }
      }
      return 0;
    });

    const bestValue = evaluations[0].evaluation.value;
    this.winners = evaluations
      .filter(e => e.evaluation.value === bestValue)
      .map(e => e.playerId);

    this.awardPot();
    this.phase = 'ended';
  }

  private evaluateHand(cards: Card[]): HandEvaluation {
    const values = cards.map(c => CARD_VALUES[c.rank]).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);

    const isFlush = suits.some(suit => suits.filter(s => s === suit).length >= 5);
    const isStraight = this.hasStraight(values);

    if (isFlush && isStraight) {
      const flushCards = cards.filter(c => {
        const flushSuit = suits.find(s => suits.filter(x => x === s).length >= 5);
        return c.suit === flushSuit;
      });
      const flushValues = flushCards.map(c => CARD_VALUES[c.rank]).sort((a, b) => b - a);

      if (flushValues[0] === 14) {
        return { rank: 'royal_flush', value: 10, kickers: [] };
      }
      return { rank: 'straight_flush', value: 9, kickers: flushValues.slice(0, 5) };
    }

    const groups = this.groupByValue(values);
    const groupSizes = Object.values(groups).sort((a, b) => b - a);

    if (groupSizes[0] === 4) {
      const quadValue = parseInt(Object.keys(groups).find(k => groups[k] === 4) || '0');
      const kickers = values.filter(v => v !== quadValue).slice(0, 1);
      return { rank: 'four_of_a_kind', value: 8, kickers: [quadValue, ...kickers] };
    }

    if (groupSizes[0] === 3 && groupSizes[1] >= 2) {
      const tripValue = parseInt(Object.keys(groups).find(k => groups[k] === 3) || '0');
      const pairValue = parseInt(Object.keys(groups).find(k => groups[k] >= 2 && parseInt(k) !== tripValue) || '0');
      return { rank: 'full_house', value: 7, kickers: [tripValue, pairValue] };
    }

    if (isFlush) {
      const flushCards = cards.filter(c => {
        const flushSuit = suits.find(s => suits.filter(x => x === s).length >= 5);
        return c.suit === flushSuit;
      });
      const flushValues = flushCards.map(c => CARD_VALUES[c.rank]).sort((a, b) => b - a);
      return { rank: 'flush', value: 6, kickers: flushValues.slice(0, 5) };
    }

    if (isStraight) {
      const straightHigh = this.getStraightHigh(values);
      return { rank: 'straight', value: 5, kickers: [straightHigh] };
    }

    if (groupSizes[0] === 3) {
      const tripValue = parseInt(Object.keys(groups).find(k => groups[k] === 3) || '0');
      const kickers = values.filter(v => v !== tripValue).slice(0, 2);
      return { rank: 'three_of_a_kind', value: 4, kickers: [tripValue, ...kickers] };
    }

    if (groupSizes[0] === 2 && groupSizes[1] === 2) {
      const pairValues = Object.keys(groups)
        .filter(k => groups[k] === 2)
        .map(k => parseInt(k))
        .sort((a, b) => b - a);
      const kicker = values.filter(v => !pairValues.includes(v))[0];
      return { rank: 'two_pair', value: 3, kickers: [...pairValues, kicker] };
    }

    if (groupSizes[0] === 2) {
      const pairValue = parseInt(Object.keys(groups).find(k => groups[k] === 2) || '0');
      const kickers = values.filter(v => v !== pairValue).slice(0, 3);
      return { rank: 'one_pair', value: 2, kickers: [pairValue, ...kickers] };
    }

    return { rank: 'high_card', value: 1, kickers: values.slice(0, 5) };
  }

  private groupByValue(values: number[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const value of values) {
      groups[value] = (groups[value] || 0) + 1;
    }
    return groups;
  }

  private hasStraight(values: number[]): boolean {
    const unique = [...new Set(values)].sort((a, b) => b - a);
    if (unique.length < 5) return false;

    for (let i = 0; i <= unique.length - 5; i++) {
      if (unique[i] - unique[i + 4] === 4) return true;
    }

    if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) {
      return true;
    }

    return false;
  }

  private getStraightHigh(values: number[]): number {
    const unique = [...new Set(values)].sort((a, b) => b - a);

    for (let i = 0; i <= unique.length - 5; i++) {
      if (unique[i] - unique[i + 4] === 4) return unique[i];
    }

    return 5;
  }

  private awardPot(): void {
    const winAmount = Math.floor(this.pot / this.winners.length);
    for (const winnerId of this.winners) {
      this.players[winnerId].chips += winAmount;
    }
  }

  reset(): void {
    this.init();
  }

  getHandRankName(rank: HandRank): string {
    const names: Record<HandRank, string> = {
      'high_card': '高牌',
      'one_pair': '一对',
      'two_pair': '两对',
      'three_of_a_kind': '三条',
      'straight': '顺子',
      'flush': '同花',
      'full_house': '葫芦',
      'four_of_a_kind': '四条',
      'straight_flush': '同花顺',
      'royal_flush': '皇家同花顺'
    };
    return names[rank];
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 250);
    gradient.addColorStop(0, 'rgba(0, 80, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 40, 0, 0.1)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 300, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 280, 160, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (this.communityCards.length > 0) {
      const cardWidth = 50;
      const cardHeight = 70;
      const startX = centerX - (this.communityCards.length * cardWidth * 0.7) / 2;

      for (let i = 0; i < this.communityCards.length; i++) {
        this.renderCard(ctx, this.communityCards[i], startX + i * cardWidth * 0.7, centerY - cardHeight / 2, cardWidth, cardHeight);
      }
    }

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`底池: ${this.pot}`, centerX, centerY + 80);
    ctx.fillText(`当前下注: ${this.currentBet}`, centerX, centerY + 105);

    const positions = [
      { x: centerX, y: height - 100, label: '玩家' },
      { x: 80, y: centerY, label: 'AI 1' },
      { x: centerX, y: 60, label: 'AI 2' },
      { x: width - 80, y: centerY, label: 'AI 3' }
    ];

    for (let i = 0; i < 4; i++) {
      const pos = positions[i];
      const player = this.players[i];

      ctx.fillStyle = player.status === 'folded' ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 100, 0, 0.6)';
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
      ctx.fillText(`${player.chips}`, pos.x, pos.y + 10);

      if (player.isDealer) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '10px sans-serif';
        ctx.fillText('D', pos.x + 25, pos.y - 20);
      }

      if (player.bet > 0) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '11px sans-serif';
        ctx.fillText(`${player.bet}`, pos.x, pos.y - 45);
      }
    }
  }

  private renderCard(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f0f0f0');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.stroke();

    const color = (card.suit === 'heart' || card.suit === 'diamond') ? '#ff0000' : '#000000';
    ctx.fillStyle = color;
    ctx.font = `bold ${width * 0.25}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(card.rank, x + width / 2, y + height * 0.35);

    ctx.font = `${width * 0.3}px sans-serif`;
    const suitSymbol = { spade: '♠', heart: '♥', club: '♣', diamond: '♦' }[card.suit];
    ctx.fillText(suitSymbol, x + width / 2, y + height * 0.7);
  }
}
