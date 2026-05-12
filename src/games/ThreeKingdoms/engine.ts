export type Suit = 'spade' | 'heart' | 'club' | 'diamond';
export type CardType = 'basic' | 'trick' | 'delayedTrick' | 'equip';
export type BasicType = 'slash' | 'jink' | 'peach' | 'wine';
export type TrickType = 'duel' | 'dismantlement' | 'fireAttack' | 'peachGarden' | 'lightning';
export type EquipType = 'weapon' | 'armor' | 'horse';

export interface Card {
  id: string;
  suit: Suit;
  number: number;
  type: CardType;
  subType?: BasicType | TrickType | EquipType;
  name: string;
  description: string;
}

export type Kingdom = 'wei' | 'shu' | 'wu' | 'qun';

export interface Skill {
  name: string;
  description: string;
  triggered: boolean;
}

export interface General {
  id: number;
  name: string;
  kingdom: Kingdom;
  maxHp: number;
  hp: number;
  skills: Skill[];
  isTurned: boolean;
  hasSlash: boolean;
  hasJink: number;
  canUseWine: boolean;
  isWounded: boolean;
}

export interface Player {
  id: number;
  general: General | null;
  handCards: Card[];
  equipCards: { weapon: Card | null; armor: Card | null; horse: Card | null };
  isAlive: boolean;
  isDefending: boolean;
  defenseTarget: number | null;
  pendingDuel: boolean;
  pendingFireAttack: boolean;
}

export type GamePhase = 'setup' | 'draw' | 'main' | 'play' | 'discard' | 'response' | 'gameOver';
export type ActionType = 'none' | 'slash' | 'duel' | 'dismantlement' | 'fireAttack' | 'peach' | 'wine' | 'useEquip' | 'responseJink' | 'responseWine';

export interface ThreeKingdomsState {
  players: Player[];
  currentPlayer: number;
  phase: GamePhase;
  action: ActionType;
  deck: Card[];
  discardPile: Card[];
  message: string;
  selectedCard: Card | null;
  selectedTarget: number | null;
  canUseCards: Card[];
  pendingTargets: number[];
  winner: number | null;
  round: number;
  wineUsed: boolean;
  slashUsed: boolean;
  cardHistory: Card[];
}

const KINGDOM_COLORS: Record<Kingdom, string> = {
  wei: '#3498db',
  shu: '#e74c3c',
  wu: '#f1c40f',
  qun: '#9b59b6',
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦',
};

const SUIT_COLORS: Record<Suit, string> = {
  spade: '#2c3e50',
  heart: '#e74c3c',
  club: '#2c3e50',
  diamond: '#e74c3c',
};

const GENERALS_DATA: Array<{
  id: number;
  name: string;
  kingdom: Kingdom;
  maxHp: number;
  skills: Skill[];
}> = [
  {
    id: 1,
    name: '曹操',
    kingdom: 'wei',
    maxHp: 4,
    skills: [{ name: '奸雄', description: '当你受到伤害时，可以获得造成伤害的牌', triggered: false }],
  },
  {
    id: 2,
    name: '司马懿',
    kingdom: 'wei',
    maxHp: 3,
    skills: [{ name: '反馈', description: '当你受到伤害时，可以交换一张手牌', triggered: false }],
  },
  {
    id: 3,
    name: '刘备',
    kingdom: 'shu',
    maxHp: 4,
    skills: [{ name: '仁德', description: '出牌阶段，可以将任意张手牌交给其他角色', triggered: false }],
  },
  {
    id: 4,
    name: '关羽',
    kingdom: 'shu',
    maxHp: 4,
    skills: [{ name: '武圣', description: '可以将任意红色牌当【杀】使用', triggered: false }],
  },
  {
    id: 5,
    name: '张飞',
    kingdom: 'shu',
    maxHp: 4,
    skills: [{ name: '咆哮', description: '出牌阶段，使用【杀】无次数限制', triggered: false }],
  },
  {
    id: 6,
    name: '孙权',
    kingdom: 'wu',
    maxHp: 4,
    skills: [{ name: '制衡', description: '出牌阶段，可以弃置任意张牌并摸等量的牌', triggered: false }],
  },
  {
    id: 7,
    name: '周瑜',
    kingdom: 'wu',
    maxHp: 3,
    skills: [{ name: '英姿', description: '摸牌阶段，你可以多摸一张牌', triggered: false }],
  },
  {
    id: 8,
    name: '吕布',
    kingdom: 'qun',
    maxHp: 4,
    skills: [{ name: '无双', description: '【杀】需要两张【闪】才能抵消', triggered: false }],
  },
  {
    id: 9,
    name: '貂蝉',
    kingdom: 'qun',
    maxHp: 3,
    skills: [{ name: '离间', description: '出牌阶段，可以令两名男性角色拼点', triggered: false }],
  },
];

function createDeck(): Card[] {
  const deck: Card[] = [];
  let cardId = 0;

  const basicCards: Array<{ type: BasicType; count: number }> = [
    { type: 'slash', count: 20 },
    { type: 'jink', count: 15 },
    { type: 'peach', count: 8 },
    { type: 'wine', count: 5 },
  ];

  basicCards.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      const suits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const number = Math.floor(Math.random() * 13) + 1;
      deck.push({
        id: `card_${cardId++}`,
        suit,
        number,
        type: 'basic',
        subType: type,
        name: getCardName(type),
        description: getCardDescription(type),
      });
    }
  });

  for (let i = 0; i < 6; i++) {
    const suits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const number = Math.floor(Math.random() * 13) + 1;
    deck.push({
      id: `card_${cardId++}`,
      suit,
      number,
      type: 'trick',
      subType: 'duel',
      name: '决斗',
      description: '一名角色出一张【杀】，则另一名角色受一点伤害',
    });
  }

  for (let i = 0; i < 8; i++) {
    const suits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const number = Math.floor(Math.random() * 13) + 1;
    deck.push({
      id: `card_${cardId++}`,
      suit,
      number,
      type: 'trick',
      subType: 'dismantlement',
      name: '过河拆桥',
      description: '观看一名角色的一张手牌并将其弃置',
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

function getCardName(type: BasicType | TrickType): string {
  const names: Record<string, string> = {
    slash: '杀',
    jink: '闪',
    peach: '桃',
    wine: '酒',
    duel: '决斗',
    dismantlement: '过河拆桥',
    fireAttack: '火攻',
    peachGarden: '桃园结义',
    lightning: '闪电',
  };
  return names[type] || type;
}

function getCardDescription(type: BasicType | TrickType): string {
  const descriptions: Record<string, string> = {
    slash: '对一名角色造成一点伤害',
    jink: '抵消【杀】的效果',
    peach: '恢复一点体力',
    wine: '本回合下次【杀】造成额外伤害',
    duel: '两名角色轮流出【杀】，未出者受伤害',
    dismantlement: '观看并弃置一名角色的一张牌',
    fireAttack: '对一名角色造成一点火焰伤害',
    peachGarden: '所有角色各回复一点体力',
    lightning: '判定：若为黑桃2-9，受到3点伤害',
  };
  return descriptions[type] || '';
}

export class ThreeKingdomsEngine {
  private players: Player[] = [];
  private currentPlayer: number = 0;
  private phase: GamePhase = 'setup';
  private action: ActionType = 'none';
  private deck: Card[] = [];
  private discardPile: Card[] = [];
  private message: string = '等待游戏开始...';
  private selectedCard: Card | null = null;
  private selectedTarget: number | null = null;
  private winner: number | null = null;
  private round: number = 0;
  private wineUsed: boolean = false;
  private slashUsed: boolean = false;
  private cardHistory: Card[] = [];
  private aiTimeout: number = 0;

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    this.players = [];
    this.currentPlayer = 0;
    this.phase = 'setup';
    this.action = 'none';
    this.deck = createDeck();
    this.discardPile = [];
    this.message = '等待游戏开始...';
    this.selectedCard = null;
    this.selectedTarget = null;
    this.winner = null;
    this.round = 0;
    this.wineUsed = false;
    this.slashUsed = false;
    this.cardHistory = [];

    const shuffledGenerals = this.shuffleGenerals();
    
    for (let i = 0; i < 4; i++) {
      const generalData = shuffledGenerals[i];
      const general: General = {
        ...generalData,
        hp: generalData.maxHp,
        isTurned: false,
        hasSlash: false,
        hasJink: 0,
        canUseWine: true,
        isWounded: generalData.hp < generalData.maxHp,
      };

      const handCards: Card[] = [];
      for (let j = 0; j < 4; j++) {
        handCards.push(this.drawCard()!);
      }

      this.players.push({
        id: i,
        general,
        handCards,
        equipCards: { weapon: null, armor: null, horse: null },
        isAlive: true,
        isDefending: false,
        defenseTarget: null,
        pendingDuel: false,
        pendingFireAttack: false,
      });
    }
  }

  private shuffleGenerals() {
    const shuffled = [...GENERALS_DATA];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 4);
  }

  private drawCard(): Card | null {
    if (this.deck.length === 0) {
      if (this.discardPile.length === 0) return null;
      this.deck = shuffleDeck([...this.discardPile]);
      this.discardPile = [];
    }
    return this.deck.pop() || null;
  }

  getState(): ThreeKingdomsState {
    return {
      players: this.players.map(p => ({
        ...p,
        handCards: p.handCards.map(c => ({ ...c })),
        equipCards: {
          weapon: p.equipCards.weapon ? { ...p.equipCards.weapon } : null,
          armor: p.equipCards.armor ? { ...p.equipCards.armor } : null,
          horse: p.equipCards.horse ? { ...p.equipCards.horse } : null,
        },
      })),
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      action: this.action,
      deck: this.deck.map(c => ({ ...c })),
      discardPile: this.discardPile.map(c => ({ ...c })),
      message: this.message,
      selectedCard: this.selectedCard ? { ...this.selectedCard } : null,
      selectedTarget: this.selectedTarget,
      canUseCards: this.getCanUseCards(),
      pendingTargets: [],
      winner: this.winner,
      round: this.round,
      wineUsed: this.wineUsed,
      slashUsed: this.slashUsed,
      cardHistory: this.cardHistory.map(c => ({ ...c })),
    };
  }

  private getCanUseCards(): Card[] {
    const player = this.players[this.currentPlayer];
    if (!player || !player.isAlive || this.phase !== 'play') return [];
    
    const canUse: Card[] = [];
    
    player.handCards.forEach(card => {
      if (card.type === 'basic') {
        canUse.push(card);
      } else if (card.type === 'trick') {
        if (card.subType === 'peachGarden') {
          canUse.push(card);
        }
      }
    });
    
    return canUse;
  }

  startGame(): void {
    this.initGame();
    this.round = 1;
    this.currentPlayer = 0;
    this.phase = 'draw';
    this.message = '游戏开始！';
    
    setTimeout(() => this.startTurn(), 1000);
  }

  private startTurn(): void {
    const player = this.players[this.currentPlayer];
    if (!player.isAlive) {
      this.nextPlayer();
      return;
    }

    this.phase = 'draw';
    this.action = 'none';
    this.slashUsed = false;
    this.wineUsed = false;
    this.message = `${this.getPlayerName()} 的回合 - 摸牌阶段`;
    
    const card = this.drawCard();
    if (card) {
      player.handCards.push(card);
    }

    setTimeout(() => {
      this.phase = 'main';
      this.message = `${this.getPlayerName()} 的回合 - 出牌阶段`;
      
      if (this.currentPlayer !== 0) {
        setTimeout(() => this.aiPlayPhase(), 1000);
      }
    }, 1000);
  }

  private nextPlayer(): void {
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    
    const alivePlayers = this.players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      this.endGame();
      return;
    }

    if (this.currentPlayer === 0) {
      this.round++;
    }

    setTimeout(() => this.startTurn(), 500);
  }

  private getPlayerName(): string {
    const player = this.players[this.currentPlayer];
    return player?.general?.name || `玩家${this.currentPlayer + 1}`;
  }

  selectCard(cardId: string): void {
    if (this.currentPlayer !== 0 || this.phase !== 'play') return;
    
    const player = this.players[0];
    const card = player.handCards.find(c => c.id === cardId);
    
    if (!card) return;

    this.selectedCard = card;
    this.message = `选择使用 ${card.name} 的目标`;
  }

  selectTarget(playerId: number): void {
    if (this.currentPlayer !== 0) return;
    if (!this.selectedCard) return;

    const player = this.players[playerId];
    if (!player || !player.isAlive) return;

    this.selectedTarget = playerId;
    this.useCard();
  }

  private useCard(): void {
    if (!this.selectedCard || this.selectedTarget === null) return;

    const card = this.selectedCard;
    const targetId = this.selectedTarget;
    const player = this.players[this.currentPlayer];
    const target = this.players[targetId];

    player.handCards = player.handCards.filter(c => c.id !== card.id);
    this.discardPile.push(card);
    this.cardHistory.push(card);

    switch (card.subType) {
      case 'slash':
        this.useSlash(player, target, card);
        break;
      case 'peach':
        this.usePeach(player, card);
        break;
      case 'wine':
        this.useWine(player, card);
        break;
      case 'peachGarden':
        this.usePeachGarden(card);
        break;
      case 'duel':
        this.useDuel(player, target, card);
        break;
      default:
        this.message = `${this.getPlayerName()} 使用了 ${card.name}`;
    }

    this.selectedCard = null;
    this.selectedTarget = null;

    if (this.checkWinCondition()) {
      this.endGame();
    } else if (this.currentPlayer !== 0) {
      setTimeout(() => this.aiPlayPhase(), 1000);
    }
  }

  private useSlash(attacker: Player, target: Player, card: Card): void {
    if (!attacker.general || attacker.general.name === '张飞') {
      attacker.hasSlash = true;
    }
    
    this.message = `${attacker.general?.name} 对 ${target.general?.name} 使用了【杀】！`;
    
    const hasWuSheng = attacker.general?.name === '关羽';
    const canUseJink = hasWuSheng || 
      target.handCards.some(c => c.subType === 'jink') ||
      (target.equipCards.armor?.subType === 'eightTrigrams' && Math.random() > 0.5);

    if (canUseJink) {
      target.isDefending = true;
      target.defenseTarget = attacker.id;
      this.action = 'responseJink';
      
      if (targetId !== 0) {
        setTimeout(() => this.aiRespondJink(target), 1500);
      }
    } else {
      this.dealDamage(target, 1, attacker);
    }
  }

  private aiRespondJink(target: Player): void {
    if (!target.isDefending) return;

    const hasWuSheng = target.general?.name === '关羽';
    const jinkIndex = target.handCards.findIndex(c => 
      c.subType === 'jink' || (hasWuSheng && this.isRedCard(c))
    );

    if (jinkIndex !== -1) {
      const jink = target.handCards[jinkIndex];
      target.handCards.splice(jinkIndex, 1);
      this.discardPile.push(jink);
      this.message = `${target.general?.name} 使用了【闪】`;
      
      const attacker = this.players[target.defenseTarget!];
      if (attacker.general?.name === '吕布') {
        const secondJink = target.handCards.findIndex(c => c.subType === 'jink');
        if (secondJink !== -1) {
          const jink2 = target.handCards[secondJink];
          target.handCards.splice(secondJink, 1);
          this.discardPile.push(jink2);
          this.message += `和第二张【闪】`;
          target.isDefending = false;
          target.defenseTarget = null;
          return;
        }
      }
    } else {
      this.message = `${target.general?.name} 没有【闪】，受到伤害！`;
    }

    target.isDefending = false;
    const attacker = this.players[target.defenseTarget!];
    this.dealDamage(target, 1, attacker);
  }

  respondJink(): void {
    if (this.currentPlayer !== 0) return;
    const target = this.players[0];
    
    if (!target.isDefending) return;

    const jinkIndex = target.handCards.findIndex(c => c.subType === 'jink');
    if (jinkIndex !== -1) {
      const jink = target.handCards[jinkIndex];
      target.handCards.splice(jinkIndex, 1);
      this.discardPile.push(jink);
      this.message = `${target.general?.name} 使用了【闪】`;
      
      const attacker = this.players[target.defenseTarget!];
      if (attacker.general?.name === '吕布') {
        this.action = 'responseJink';
        this.message += ` - 吕布的无双！需要第二张【闪】`;
        return;
      }
    }

    target.isDefending = false;
    const attacker = this.players[target.defenseTarget!];
    this.dealDamage(target, 1, attacker);
  }

  private usePeach(player: Player, card: Card): void {
    if (player.general && player.general.hp < player.general.maxHp) {
      player.general.hp++;
      this.message = `${player.general.name} 使用【桃】回复一点体力`;
    } else {
      this.message = `${player.general?.name} 使用【桃】但体力已满`;
      this.discardPile.pop();
      player.handCards.push(card);
    }
  }

  private useWine(player: Player, card: Card): void {
    player.general!.canUseWine = false;
    this.wineUsed = true;
    this.message = `${player.general?.name} 使用【酒】，下次【杀】造成额外伤害`;
  }

  private usePeachGarden(card: Card): void {
    this.players.forEach(p => {
      if (p.isAlive && p.general && p.general.hp < p.general.maxHp) {
        p.general.hp++;
      }
    });
    this.message = '【桃园结义】生效！所有角色回复一点体力';
  }

  private useDuel(attacker: Player, target: Player, card: Card): void {
    this.message = `${attacker.general?.name} 对 ${target.general?.name} 发起【决斗】！`;
    target.pendingDuel = true;
    
    const hasSlash = target.handCards.some(c => c.subType === 'slash') ||
      (target.general?.name === '关羽' && target.handCards.some(c => this.isRedCard(c)));

    if (hasSlash) {
      if (targetId !== 0) {
        setTimeout(() => this.aiRespondDuel(target, attacker), 1000);
      } else {
        this.action = 'duel';
      }
    } else {
      this.dealDamage(target, 1, attacker);
    }
  }

  private aiRespondDuel(target: Player, attacker: Player): void {
    const slashIndex = target.handCards.findIndex(c => c.subType === 'slash');
    if (slashIndex === -1) {
      const redIndex = target.handCards.findIndex(c => this.isRedCard(c));
      if (redIndex !== -1 && target.general?.name === '关羽') {
        target.handCards.splice(redIndex, 1);
        this.discardPile.push(target.handCards[slashIndex] || target.handCards[0]);
      }
    } else {
      const slash = target.handCards[slashIndex];
      target.handCards.splice(slashIndex, 1);
      this.discardPile.push(slash);
    }

    target.pendingDuel = false;
    this.aiRespondDuel(attacker, target);
  }

  respondDuel(): void {
    if (this.currentPlayer !== 0 || this.action !== 'duel') return;
    
    const player = this.players[0];
    const slashIndex = player.handCards.findIndex(c => c.subType === 'slash');
    
    if (slashIndex !== -1) {
      const slash = player.handCards[slashIndex];
      player.handCards.splice(slashIndex, 1);
      this.discardPile.push(slash);
      this.message = `${player.general?.name} 出【杀】响应【决斗】`;
      this.action = 'none';
    } else {
      const attacker = this.players.find(p => p.pendingDuel);
      if (attacker) {
        attacker.pendingDuel = false;
        this.dealDamage(player, 1, attacker);
      }
      this.action = 'none';
    }
  }

  private dealDamage(target: Player, amount: number, source: Player): void {
    let damage = amount;
    
    if (source.general?.canUseWine === false) {
      damage++;
    }

    if (target.equipCards.armor?.subType === 'nineChapters') {
      damage = Math.max(1, damage - 1);
    }

    target.general!.hp -= damage;
    this.message = `${target.general?.name} 受到 ${damage} 点伤害`;

    if (source.general?.name === '曹操') {
      const card = this.discardPile[this.discardPile.length - 1];
      if (card) {
        source.handCards.push(card);
      }
    }

    if (target.general!.hp <= 0) {
      this.players[target.id].isAlive = false;
      this.message = `${target.general?.name} 阵亡！`;
    }

    target.general!.isWounded = target.general!.hp < target.general!.maxHp;
  }

  private isRedCard(card: Card): boolean {
    return card.suit === 'heart' || card.suit === 'diamond';
  }

  discardCard(cardId: string): void {
    if (this.currentPlayer !== 0) return;
    
    const player = this.players[0];
    const cardIndex = player.handCards.findIndex(c => c.id === cardId);
    
    if (cardIndex !== -1) {
      const card = player.handCards.splice(cardIndex, 1)[0];
      this.discardPile.push(card);
      this.message = `${player.general?.name} 弃置了 ${card.name}`;
    }

    this.checkDiscardPhase();
  }

  private checkDiscardPhase(): void {
    const player = this.players[this.currentPlayer];
    const maxHand = player.general?.maxHp || 4;
    
    if (player.handCards.length > maxHand) {
      this.phase = 'discard';
      this.message = `${this.getPlayerName()} 需要弃置 ${player.handCards.length - maxHand} 张手牌`;
      
      if (this.currentPlayer !== 0) {
        setTimeout(() => this.aiDiscard(), 1000);
      }
    } else {
      this.nextPlayer();
    }
  }

  private aiDiscard(): void {
    const player = this.players[this.currentPlayer];
    const maxHand = player.general?.maxHp || 4;
    const toDiscard = player.handCards.length - maxHand;
    
    for (let i = 0; i < toDiscard; i++) {
      const card = player.handCards.pop();
      if (card) {
        this.discardPile.push(card);
      }
    }
    
    this.message = `${this.getPlayerName()} 弃置了 ${toDiscard} 张手牌`;
    this.nextPlayer();
  }

  private aiPlayPhase(): void {
    const player = this.players[this.currentPlayer];
    if (!player.isAlive) {
      this.nextPlayer();
      return;
    }

    let usedCard = false;

    const peachIndex = player.handCards.findIndex(c => c.subType === 'peach');
    if (peachIndex !== -1 && player.general && player.general.hp < player.general.maxHp) {
      const peach = player.handCards.splice(peachIndex, 1)[0];
      this.discardPile.push(peach);
      player.general.hp++;
      this.message = `${player.general.name} 使用【桃】回复体力`;
      usedCard = true;
    }

    const slashCards = player.handCards.filter(c => c.subType === 'slash');
    const targets = this.players.filter(p => p.isAlive && p.id !== this.currentPlayer);
    
    if (slashCards.length > 0 && targets.length > 0) {
      const slash = slashCards[0];
      const target = targets[Math.floor(Math.random() * targets.length)];
      player.handCards = player.handCards.filter(c => c.id !== slash.id);
      this.discardPile.push(slash);
      this.useSlash(player, target, slash);
      usedCard = true;
    }

    if (usedCard) {
      setTimeout(() => {
        if (this.checkWinCondition()) {
          this.endGame();
        } else {
          setTimeout(() => this.aiPlayPhase(), 1500);
        }
      }, 2000);
    } else {
      this.checkDiscardPhase();
    }
  }

  private checkWinCondition(): boolean {
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    if (alivePlayers.length <= 1) {
      return true;
    }

    const differentKingdoms = new Set(alivePlayers.map(p => p.general?.kingdom));
    if (differentKingdoms.size === 1) {
      return true;
    }

    return false;
  }

  private endGame(): void {
    this.phase = 'gameOver';
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    if (alivePlayers.length === 1) {
      this.winner = alivePlayers[0].id;
      this.message = `${alivePlayers[0].general?.name} 获胜！`;
    } else {
      const kingdoms = new Set(alivePlayers.map(p => p.general?.kingdom));
      if (kingdoms.size === 1) {
        this.winner = alivePlayers[0].id;
        this.message = `${alivePlayers[0].general?.name} 阵营获胜！`;
      } else {
        this.message = '游戏结束，无获胜者';
      }
    }
  }

  cancelAction(): void {
    this.selectedCard = null;
    this.selectedTarget = null;
    this.action = 'none';
    this.message = `${this.getPlayerName()} 的出牌阶段`;
  }

  endTurn(): void {
    if (this.currentPlayer !== 0) return;
    this.checkDiscardPhase();
  }

  reset(): void {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
    }
    this.initGame();
  }

  getCardDisplay(card: Card): { symbol: string; color: string } {
    return {
      symbol: SUIT_SYMBOLS[card.suit],
      color: SUIT_COLORS[card.suit],
    };
  }

  getKingdomColor(kingdom: Kingdom): string {
    return KINGDOM_COLORS[kingdom];
  }

  getCardText(card: Card): string {
    const { symbol } = this.getCardDisplay(card);
    return `${symbol}${card.number}`;
  }
}
