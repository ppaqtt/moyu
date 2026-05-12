export interface Position {
  x: number;
  y: number;
}

export type SpaceType = 'property' | 'chance' | 'community' | 'tax' | 'special';

export type PropertyColor = 'brown' | 'lightBlue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'blue';

export type SpecialType = 'go' | 'jail' | 'freeParking' | 'goToJail' | 'incomeTax';

export interface Property {
  id: number;
  name: string;
  price: number;
  color: PropertyColor;
  rent: number[];
  housePrice: number;
  mortgageValue: number;
  owner: number | null;
  houses: number;
  isMortgaged: boolean;
}

export interface Space {
  id: number;
  type: SpaceType;
  name: string;
  property?: Property;
  specialType?: SpecialType;
}

export interface Player {
  id: number;
  name: string;
  position: number;
  money: number;
  properties: number[];
  isBankrupt: boolean;
  isInJail: boolean;
  jailTurns: number;
  color: string;
}

export interface DiceResult {
  dice1: number;
  dice2: number;
  isDouble: boolean;
}

export interface CardEffect {
  type: 'move' | 'money' | 'getOutOfJail' | 'goToJail';
  amount?: number;
  targetPosition?: number;
  description: string;
}

export interface MonopolyState {
  players: Player[];
  spaces: Space[];
  currentPlayerIndex: number;
  diceResult: DiceResult | null;
  phase: 'idle' | 'rolling' | 'moving' | 'buying' | 'building' | 'gameOver';
  winner: number | null;
  message: string;
  chanceCards: CardEffect[];
  communityCards: CardEffect[];
  canBuild: boolean;
  selectedProperty: number | null;
}

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 700;
const BOARD_MARGIN = 50;
const CELL_SIZE = 60;
const PLAYER_TOKEN_SIZE = 20;
const INITIAL_MONEY = 1500;
const HOUSE_COST = 50;
const HOTEL_COST = 50;
const MAX_HOUSES = 4;
const JAIL_MAX_TURNS = 3;

const PROPERTY_DATA: Array<{
  id: number;
  name: string;
  price: number;
  color: PropertyColor;
  rent: number[];
  housePrice: number;
}> = [
  { id: 1, name: '地中海街', price: 60, color: 'brown', rent: [2, 10, 30, 90, 160, 250], housePrice: 50 },
  { id: 3, name: '柏林街', price: 60, color: 'brown', rent: [2, 10, 30, 90, 160, 250], housePrice: 50 },
  { id: 6, name: '罗马街', price: 100, color: 'lightBlue', rent: [4, 20, 60, 180, 320, 450], housePrice: 50 },
  { id: 8, name: '维也纳街', price: 100, color: 'lightBlue', rent: [4, 20, 60, 180, 320, 450], housePrice: 50 },
  { id: 9, name: '慕尼黑街', price: 120, color: 'lightBlue', rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
  { id: 11, name: '巴黎街', price: 140, color: 'pink', rent: [6, 30, 90, 270, 400, 550], housePrice: 100 },
  { id: 13, name: '马德里街', price: 140, color: 'pink', rent: [8, 40, 100, 300, 450, 600], housePrice: 100 },
  { id: 14, name: '巴塞罗那街', price: 160, color: 'pink', rent: [8, 40, 100, 300, 450, 600], housePrice: 100 },
  { id: 16, name: '伦敦街', price: 180, color: 'orange', rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
  { id: 18, name: '阿姆斯特丹街', price: 180, color: 'orange', rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
  { id: 19, name: '布鲁塞尔街', price: 200, color: 'orange', rent: [12, 60, 180, 500, 700, 900], housePrice: 100 },
  { id: 21, name: '法兰克福街', price: 220, color: 'red', rent: [14, 70, 200, 550, 750, 950], housePrice: 150 },
  { id: 23, name: '苏黎世街', price: 220, color: 'red', rent: [14, 70, 200, 550, 750, 950], housePrice: 150 },
  { id: 24, name: '日内瓦街', price: 240, color: 'red', rent: [16, 80, 220, 600, 800, 1000], housePrice: 150 },
  { id: 26, name: '米兰街', price: 260, color: 'yellow', rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
  { id: 27, name: '威尼斯街', price: 260, color: 'yellow', rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
  { id: 29, name: '佛罗伦萨街', price: 280, color: 'yellow', rent: [20, 100, 300, 750, 925, 1100], housePrice: 150 },
  { id: 31, name: '维也纳大道', price: 300, color: 'green', rent: [22, 110, 330, 800, 975, 1150], housePrice: 200 },
  { id: 32, name: '布拉格街', price: 300, color: 'green', rent: [22, 110, 330, 800, 975, 1150], housePrice: 200 },
  { id: 34, name: '华沙街', price: 320, color: 'green', rent: [24, 120, 360, 850, 1025, 1200], housePrice: 200 },
  { id: 37, name: '斯德哥尔摩街', price: 350, color: 'blue', rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200 },
  { id: 39, name: '莫斯科街', price: 400, color: 'blue', rent: [35, 175, 500, 1100, 1300, 1500], housePrice: 200 },
];

const CHANCE_CARDS: CardEffect[] = [
  { type: 'move', targetPosition: 0, description: '向起点出发！' },
  { type: 'move', targetPosition: 24, description: '前往日内瓦街！' },
  { type: 'money', amount: 150, description: '银行错误付款给你！+150' },
  { type: 'money', amount: -50, description: '支付学校费用！-50' },
  { type: 'move', targetPosition: 10, description: '前往监狱附近！' },
  { type: 'getOutOfJail', description: '获得出狱卡！' },
  { type: 'money', amount: 100, description: '周年纪念日！+100' },
  { type: 'goToJail', description: '你被抓到超速！前往监狱！' },
];

const COMMUNITY_CARDS: CardEffect[] = [
  { type: 'move', targetPosition: 0, description: '向起点出发！' },
  { type: 'money', amount: 200, description: '所得税退款！+200' },
  { type: 'money', amount: -100, description: '支付医院费用！-100' },
  { type: 'money', amount: 50, description: '生日礼物！+50' },
  { type: 'move', targetPosition: 10, description: '前往自由公园！' },
  { type: 'getOutOfJail', description: '获得出狱卡！' },
  { type: 'money', amount: 100, description: '保险到期！+100' },
  { type: 'goToJail', description: '你被指控逃税！前往监狱！' },
];

export class MonopolyEngine {
  private players: Player[] = [];
  private spaces: Space[] = [];
  private currentPlayerIndex: number = 0;
  private diceResult: DiceResult | null = null;
  private phase: 'idle' | 'rolling' | 'moving' | 'buying' | 'building' | 'gameOver' = 'idle';
  private winner: number | null = null;
  private message: string = '点击"掷骰子"开始游戏';
  private chanceCards: CardEffect[] = [];
  private communityCards: CardEffect[] = [];
  private consecutiveDoubles: number = 0;
  private selectedProperty: number | null = null;

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    this.initSpaces();
    this.initPlayers();
    this.initCards();
    this.currentPlayerIndex = 0;
    this.phase = 'idle';
    this.winner = null;
    this.message = '玩家1的回合 - 点击"掷骰子"开始';
    this.consecutiveDoubles = 0;
    this.selectedProperty = null;
  }

  private initSpaces(): void {
    this.spaces = [];
    
    const specialSpaces: { id: number; name: string; type: SpaceType; specialType?: SpecialType }[] = [
      { id: 0, name: '起点', type: 'special', specialType: 'go' },
      { id: 2, name: '社会福利', type: 'community' },
      { id: 4, name: '所得税', type: 'tax', specialType: 'incomeTax' },
      { id: 5, name: '火车站', type: 'special' },
      { id: 7, name: '机遇', type: 'chance' },
      { id: 10, name: '自由公园', type: 'special', specialType: 'freeParking' },
      { id: 12, name: '电力公司', type: 'special' },
      { id: 15, name: '火车站', type: 'special' },
      { id: 17, name: '社区福利', type: 'community' },
      { id: 20, name: '免费停车', type: 'special' },
      { id: 22, name: '机遇', type: 'chance' },
      { id: 25, name: '火车站', type: 'special' },
      { id: 28, name: '自来水公司', type: 'special' },
      { id: 30, name: '进监狱', type: 'special', specialType: 'goToJail' },
      { id: 33, name: '社区福利', type: 'community' },
      { id: 35, name: '火车站', type: 'special' },
      { id: 36, name: '机遇', type: 'chance' },
      { id: 38, name: '奢侈品税', type: 'tax', specialType: 'incomeTax' },
    ];

    for (let i = 0; i < 40; i++) {
      const propertyData = PROPERTY_DATA.find(p => p.id === i);
      if (propertyData) {
        this.spaces.push({
          id: i,
          type: 'property',
          name: propertyData.name,
          property: {
            id: propertyData.id,
            name: propertyData.name,
            price: propertyData.price,
            color: propertyData.color,
            rent: propertyData.rent,
            housePrice: propertyData.housePrice,
            mortgageValue: Math.floor(propertyData.price / 2),
            owner: null,
            houses: 0,
            isMortgaged: false,
          },
        });
      } else {
        const special = specialSpaces.find(s => s.id === i);
        if (special) {
          this.spaces.push({
            id: special.id,
            type: special.type,
            name: special.name,
            specialType: special.specialType,
          });
        } else {
          this.spaces.push({
            id: i,
            type: 'special',
            name: `位置 ${i}`,
          });
        }
      }
    }
  }

  private initPlayers(): void {
    this.players = [
      {
        id: 0,
        name: '玩家',
        position: 0,
        money: INITIAL_MONEY,
        properties: [],
        isBankrupt: false,
        isInJail: false,
        jailTurns: 0,
        color: '#ff6b9d',
      },
      {
        id: 1,
        name: 'AI-小红',
        position: 0,
        money: INITIAL_MONEY,
        properties: [],
        isBankrupt: false,
        isInJail: false,
        jailTurns: 0,
        color: '#00d2ff',
      },
      {
        id: 2,
        name: 'AI-小蓝',
        position: 0,
        money: INITIAL_MONEY,
        properties: [],
        isBankrupt: false,
        isInJail: false,
        jailTurns: 0,
        color: '#39ff14',
      },
    ];
  }

  private initCards(): void {
    this.chanceCards = [...CHANCE_CARDS];
    this.communityCards = [...COMMUNITY_CARDS];
    this.shuffleCards(this.chanceCards);
    this.shuffleCards(this.communityCards);
  }

  private shuffleCards(cards: CardEffect[]): void {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  getState(): MonopolyState {
    return {
      players: this.players.map(p => ({ ...p, properties: [...p.properties] })),
      spaces: this.spaces.map(s => ({
        ...s,
        property: s.property ? { ...s.property } : undefined,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      diceResult: this.diceResult ? { ...this.diceResult } : null,
      phase: this.phase,
      winner: this.winner,
      message: this.message,
      chanceCards: [...this.chanceCards],
      communityCards: [...this.communityCards],
      canBuild: this.canCurrentPlayerBuild(),
      selectedProperty: this.selectedProperty,
    };
  }

  rollDice(): void {
    if (this.phase !== 'idle' && this.phase !== 'building') return;
    
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer.isBankrupt) {
      this.nextTurn();
      return;
    }

    this.phase = 'rolling';
    
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const isDouble = dice1 === dice2;
    
    this.diceResult = { dice1, dice2, isDouble };

    if (currentPlayer.isInJail) {
      if (isDouble) {
        currentPlayer.isInJail = false;
        currentPlayer.jailTurns = 0;
        this.message = `${currentPlayer.name} 掷出 ${dice1}+${dice2}=${dice1+dice2}，出狱！`;
        this.consecutiveDoubles = 0;
        this.movePlayer(dice1 + dice2);
      } else {
        currentPlayer.jailTurns++;
        if (currentPlayer.jailTurns >= JAIL_MAX_TURNS) {
          currentPlayer.isInJail = false;
          currentPlayer.jailTurns = 0;
          this.payMoney(currentPlayer.id, 50);
          this.message = `${currentPlayer.name} 掷出 ${dice1}+${dice2}=${dice1+dice2}，支付50出狱费后出狱`;
          this.consecutiveDoubles = 0;
          this.movePlayer(dice1 + dice2);
        } else {
          this.message = `${currentPlayer.name} 在监狱中，掷出 ${dice1}+${dice2}，未能出狱`;
          this.phase = 'idle';
          setTimeout(() => this.nextTurn(), 1500);
        }
      }
    } else {
      this.consecutiveDoubles = isDouble ? this.consecutiveDoubles + 1 : 0;
      
      if (this.consecutiveDoubles >= 3) {
        this.message = `${currentPlayer.name} 连续3次掷出双数，进入监狱！`;
        currentPlayer.isInJail = true;
        currentPlayer.position = 30;
        this.consecutiveDoubles = 0;
        this.phase = 'idle';
        setTimeout(() => this.nextTurn(), 1500);
      } else {
        this.message = `${currentPlayer.name} 掷出 ${dice1}+${dice2}=${dice1+dice2}`;
        this.movePlayer(dice1 + dice2);
      }
    }
  }

  private movePlayer(steps: number): void {
    const player = this.players[this.currentPlayerIndex];
    const oldPosition = player.position;
    player.position = (player.position + steps) % 40;
    
    if (player.position < oldPosition) {
      player.money += 200;
      this.message += '，路过起点获得200金币！';
    }

    this.phase = 'moving';
    setTimeout(() => this.handleLandedSpace(), 500);
  }

  private handleLandedSpace(): void {
    const player = this.players[this.currentPlayerIndex];
    const space = this.spaces[player.position];

    switch (space.type) {
      case 'property':
        this.handleProperty(player, space.property!);
        break;
      case 'chance':
        this.drawCard('chance');
        break;
      case 'community':
        this.drawCard('community');
        break;
      case 'tax':
        this.handleTax(player, space);
        break;
      case 'special':
        this.handleSpecial(player, space);
        break;
    }
  }

  private handleProperty(player: Player, property: Property): void {
    if (property.owner === null) {
      if (player.id === 0) {
        this.phase = 'buying';
        this.message = `${player.name} 落在 ${property.name}，价格 ${property.price} 金币，是否购买？`;
      } else {
        if (player.money >= property.price) {
          this.buyProperty(property.id);
        } else {
          this.message = `${player.name} 落在 ${property.name}，但金币不足无法购买`;
          this.phase = 'idle';
          setTimeout(() => this.nextTurn(), 1500);
        }
      }
    } else if (property.owner !== player.id) {
      if (property.isMortgaged) {
        this.message = `${player.name} 落在 ${property.name}，该地已被抵押，无需支付租金`;
        this.phase = 'idle';
        setTimeout(() => this.nextTurn(), 1500);
      } else {
        const rent = this.calculateRent(property);
        this.message = `${player.name} 落在 ${property.name}，需要支付 ${rent} 金币租金`;
        setTimeout(() => {
          this.payRent(player, property.owner!, rent);
        }, 1000);
      }
    } else {
      this.message = `${player.name} 落在自己的 ${property.name}`;
      this.phase = 'idle';
      setTimeout(() => this.nextTurn(), 1500);
    }
  }

  private calculateRent(property: Property): number {
    if (property.houses === 0) {
      return property.rent[0];
    } else if (property.houses >= 5) {
      return property.rent[5];
    } else {
      return property.rent[property.houses];
    }
  }

  private payRent(payer: Player, ownerId: number, amount: number): void {
    if (payer.money >= amount) {
      payer.money -= amount;
      this.players[ownerId].money += amount;
      this.message = `${payer.name} 支付给 ${this.players[ownerId].name} ${amount} 金币租金`;
    } else {
      const maxPay = payer.money;
      payer.money = 0;
      this.players[ownerId].money += maxPay;
      
      if (payer.id === 0) {
        this.handleBankruptcy(payer, ownerId);
      } else {
        payer.isBankrupt = true;
        this.message = `${payer.name} 破产！`;
        this.checkGameOver();
      }
    }
    this.phase = 'idle';
    setTimeout(() => this.nextTurn(), 1500);
  }

  private handleTax(player: Player, space: Space): void {
    const taxAmount = space.name.includes('所得税') ? 200 : 100;
    this.message = `${player.name} 落在 ${space.name}，支付 ${taxAmount} 金币税款`;
    this.payMoney(player.id, taxAmount);
    this.phase = 'idle';
    setTimeout(() => this.nextTurn(), 1500);
  }

  private handleSpecial(player: Player, space: Space): void {
    switch (space.specialType) {
      case 'go':
        this.message = `${player.name} 落在起点！`;
        break;
      case 'freeParking':
        this.message = `${player.name} 落在自由公园，休息一下！`;
        break;
      case 'goToJail':
        this.message = `${player.name} 进入监狱！`;
        player.isInJail = true;
        player.position = 30;
        break;
      default:
        if (space.name === '火车站') {
          this.message = `${player.name} 落在 ${space.name}，可使用快速交通`;
        } else {
          this.message = `${player.name} 落在 ${space.name}`;
        }
    }
    this.phase = 'idle';
    setTimeout(() => this.nextTurn(), 1500);
  }

  private drawCard(type: 'chance' | 'community'): void {
    const cards = type === 'chance' ? this.chanceCards : this.communityCards;
    if (cards.length === 0) {
      this.initCards();
    }
    const card = cards.shift()!;
    cards.push(card);
    
    this.message = `${type === 'chance' ? '机遇' : '社区福利'}卡：${card.description}`;
    
    setTimeout(() => this.applyCardEffect(card), 1000);
  }

  private applyCardEffect(card: CardEffect): void {
    const player = this.players[this.currentPlayerIndex];
    
    switch (card.type) {
      case 'move':
        player.position = card.targetPosition!;
        this.handleLandedSpace();
        break;
      case 'money':
        if (card.amount! > 0) {
          player.money += card.amount!;
        } else {
          this.payMoney(player.id, Math.abs(card.amount!));
        }
        this.phase = 'idle';
        setTimeout(() => this.nextTurn(), 1500);
        break;
      case 'getOutOfJail':
        this.message += ` - 获得出狱卡！`;
        this.phase = 'idle';
        setTimeout(() => this.nextTurn(), 1500);
        break;
      case 'goToJail':
        player.isInJail = true;
        player.position = 30;
        this.phase = 'idle';
        setTimeout(() => this.nextTurn(), 1500);
        break;
    }
  }

  buyProperty(propertyId?: number): void {
    const player = this.players[this.currentPlayerIndex];
    const property = this.spaces.find(s => s.property?.id === (propertyId ?? this.selectedProperty))?.property;
    
    if (!property || property.owner !== null) return;
    if (player.money < property.price) {
      this.message = '金币不足，无法购买！';
      return;
    }

    player.money -= property.price;
    property.owner = player.id;
    player.properties.push(property.id);
    this.message = `${player.name} 购买了 ${property.name}！`;
    this.phase = 'idle';
    
    if (player.id !== 0) {
      setTimeout(() => this.nextTurn(), 1500);
    }
  }

  skipBuy(): void {
    this.message = `${this.players[this.currentPlayerIndex].name} 选择不购买`;
    this.phase = 'idle';
    setTimeout(() => this.nextTurn(), 1000);
  }

  private payMoney(playerId: number, amount: number): boolean {
    const player = this.players[playerId];
    if (player.money >= amount) {
      player.money -= amount;
      return true;
    } else {
      this.handleBankruptcy(player, -1);
      return false;
    }
  }

  private handleBankruptcy(player: Player, creditorId: number): void {
    player.isBankrupt = true;
    
    for (const propId of player.properties) {
      const prop = this.spaces.find(s => s.property?.id === propId)?.property;
      if (prop) {
        prop.owner = creditorId;
        if (creditorId >= 0) {
          this.players[creditorId].properties.push(propId);
        }
      }
    }
    player.properties = [];
    
    if (player.id === 0) {
      this.phase = 'gameOver';
      this.winner = this.players.find(p => p.id !== 0 && !p.isBankrupt)?.id ?? null;
      this.message = `你破产了！${this.winner ? this.players[this.winner].name + ' 获胜！' : '所有玩家都破产了！'}`;
    } else {
      this.checkGameOver();
    }
  }

  private checkGameOver(): void {
    const activePlayers = this.players.filter(p => !p.isBankrupt);
    if (activePlayers.length <= 1) {
      this.phase = 'gameOver';
      this.winner = activePlayers[0]?.id ?? null;
      if (this.winner !== null) {
        this.message = `游戏结束！${this.players[this.winner].name} 获胜！`;
      } else {
        this.message = '游戏结束！没有获胜者！';
      }
    }
  }

  private canCurrentPlayerBuild(): boolean {
    const player = this.players[this.currentPlayerIndex];
    if (player.id !== 0 || player.isBankrupt) return false;
    
    const colorGroups = this.getColorGroups();
    for (const group of colorGroups) {
      const owned = group.filter(id => {
        const prop = this.spaces.find(s => s.property?.id === id)?.property;
        return prop?.owner === player.id && !prop.isMortgaged;
      });
      if (owned.length === group.length && owned.length > 0) {
        return true;
      }
    }
    return false;
  }

  private getColorGroups(): number[][] {
    return [
      [1, 3],
      [6, 8, 9],
      [11, 13, 14],
      [16, 18, 19],
      [21, 23, 24],
      [26, 27, 29],
      [31, 32, 34],
      [37, 39],
    ];
  }

  selectProperty(propertyId: number): void {
    if (this.phase !== 'building') return;
    this.selectedProperty = propertyId;
  }

  buildHouse(): void {
    if (!this.canCurrentPlayerBuild()) return;
    
    const player = this.players[this.currentPlayerIndex];
    const prop = this.spaces.find(s => s.property?.id === this.selectedProperty)?.property;
    
    if (!prop || prop.owner !== player.id) return;
    if (prop.houses >= 5) return;
    if (prop.isMortgaged) return;
    
    const colorGroup = this.getColorGroups().find(g => g.includes(prop.id));
    if (!colorGroup) return;
    
    const sameColorOwned = colorGroup.filter(id => {
      const p = this.spaces.find(s => s.property?.id === id)?.property;
      return p?.owner === player.id && !p.isMortgaged;
    });
    
    if (sameColorOwned.length !== colorGroup.length) return;
    
    const cost = prop.houses === 4 ? HOTEL_COST : prop.housePrice;
    if (player.money < cost) {
      this.message = '金币不足，无法建造！';
      return;
    }
    
    player.money -= cost;
    prop.houses++;
    
    const buildingType = prop.houses === 5 ? '酒店' : `${prop.houses}栋房子`;
    this.message = `${player.name} 在 ${prop.name} 建造了${buildingType}！花费 ${cost} 金币`;
    this.selectedProperty = null;
  }

  sellProperty(propertyId: number): void {
    const player = this.players[this.currentPlayerIndex];
    if (player.id !== 0 || player.isBankrupt) return;
    
    const prop = this.spaces.find(s => s.property?.id === propertyId)?.property;
    if (!prop || prop.owner !== player.id) return;
    
    const sellPrice = Math.floor(prop.price / 2);
    player.money += sellPrice;
    prop.owner = null;
    player.properties = player.properties.filter(id => id !== propertyId);
    prop.houses = 0;
    
    this.message = `${player.name} 出售了 ${prop.name}，获得 ${sellPrice} 金币`;
  }

  mortgageProperty(propertyId: number): void {
    const player = this.players[this.currentPlayerIndex];
    if (player.id !== 0 || player.isBankrupt) return;
    
    const prop = this.spaces.find(s => s.property?.id === propertyId)?.property;
    if (!prop || prop.owner !== player.id || prop.isMortgaged) return;
    
    player.money += prop.mortgageValue;
    prop.isMortgaged = true;
    
    this.message = `${player.name} 抵押了 ${prop.name}，获得 ${prop.mortgageValue} 金币`;
  }

  unmortgageProperty(propertyId: number): void {
    const player = this.players[this.currentPlayerIndex];
    if (player.id !== 0 || player.isBankrupt) return;
    
    const prop = this.spaces.find(s => s.property?.id === propertyId)?.property;
    if (!prop || prop.owner !== player.id || !prop.isMortgaged) return;
    
    const cost = Math.floor(prop.mortgageValue * 1.1);
    if (player.money < cost) {
      this.message = '金币不足，无法解除抵押！';
      return;
    }
    
    player.money -= cost;
    prop.isMortgaged = false;
    
    this.message = `${player.name} 解除抵押了 ${prop.name}，花费 ${cost} 金币`;
  }

  private nextTurn(): void {
    if (this.phase === 'gameOver') return;
    
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (this.players[this.currentPlayerIndex].isBankrupt);
    
    this.diceResult = null;
    this.phase = 'idle';
    this.message = `${this.players[this.currentPlayerIndex].name} 的回合 - 点击"掷骰子"`;
    this.selectedProperty = null;
    
    if (this.players[this.currentPlayerIndex].id !== 0) {
      setTimeout(() => this.aiTurn(), 1000);
    }
  }

  private aiTurn(): void {
    if (this.phase === 'gameOver') return;
    
    const player = this.players[this.currentPlayerIndex];
    if (player.id === 0 || player.isBankrupt) return;
    
    this.rollDice();
    
    setTimeout(() => {
      if (this.phase === 'buying') {
        const state = this.getState();
        const space = state.spaces[player.position];
        if (space.property && Math.random() > 0.3) {
          this.buyProperty();
        } else {
          this.skipBuy();
        }
      }
    }, 2000);
  }

  startBuilding(): void {
    if (!this.canCurrentPlayerBuild()) return;
    this.phase = 'building';
    this.message = '选择要建造的地产';
    this.selectedProperty = null;
  }

  cancelBuilding(): void {
    this.phase = 'idle';
    this.message = `${this.players[this.currentPlayerIndex].name} 的回合结束`;
    this.selectedProperty = null;
    setTimeout(() => this.nextTurn(), 1000);
  }

  reset(): void {
    this.initGame();
  }

  getSpacePosition(spaceId: number): { x: number; y: number } {
    const boardSize = CANVAS_WIDTH - BOARD_MARGIN * 2;
    const cellSize = boardSize / 10;
    
    if (spaceId < 10) {
      return {
        x: BOARD_MARGIN + (9 - spaceId) * cellSize + cellSize / 2,
        y: BOARD_MARGIN + cellSize * 9.5,
      };
    } else if (spaceId < 20) {
      return {
        x: BOARD_MARGIN + cellSize * 0.5,
        y: BOARD_MARGIN + (19 - spaceId) * cellSize + cellSize / 2,
      };
    } else if (spaceId < 30) {
      return {
        x: BOARD_MARGIN + (spaceId - 20) * cellSize + cellSize / 2,
        y: BOARD_MARGIN + cellSize * 0.5,
      };
    } else {
      return {
        x: BOARD_MARGIN + (39 - spaceId) * cellSize + cellSize / 2,
        y: BOARD_MARGIN + (spaceId - 30) * cellSize + cellSize / 2,
      };
    }
  }

  getPlayerPosition(playerId: number): { x: number; y: number } {
    const player = this.players[playerId];
    const basePos = this.getSpacePosition(player.position);
    
    const offset = (playerId % 3) * 8 - 8;
    return {
      x: basePos.x + offset,
      y: basePos.y + (playerId < 3 ? -5 : 5),
    };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
