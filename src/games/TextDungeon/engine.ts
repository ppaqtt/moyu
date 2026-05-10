export type Direction = 'north' | 'south' | 'east' | 'west';
export type EnemyType = 'slime' | 'goblin' | 'skeleton' | 'orc' | 'dragon';
export type ItemType = 'weapon' | 'armor' | 'potion' | 'key' | 'treasure';

export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  exp: number;
  gold: number;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  value: number;
  effect?: {
    hp?: number;
    attack?: number;
    defense?: number;
  };
  description: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  exits: Partial<Record<Direction, string>>;
  enemies: Enemy[];
  items: Item[];
  visited: boolean;
  isBoss?: boolean;
  isExit?: boolean;
  isEntrance?: boolean;
}

export interface Player {
  name: string;
  level: number;
  exp: number;
  expToLevel: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  gold: number;
  weapons: Item[];
  armors: Item[];
  potions: number;
  keys: number;
  inventory: Item[];
}

export interface GameState {
  currentRoomId: string;
  player: Player;
  combatLog: string[];
  floor: number;
  maxFloors: number;
  isInCombat: boolean;
  currentEnemy: Enemy | null;
  isGameOver: boolean;
  hasWon: boolean;
}

const ENEMIES_BY_FLOOR: Record<number, EnemyType[]> = {
  1: ['slime', 'slime'],
  2: ['slime', 'goblin'],
  3: ['goblin', 'skeleton'],
  4: ['skeleton', 'orc'],
  5: ['orc', 'dragon'],
};

const ENEMY_DATA: Record<EnemyType, Omit<Enemy, 'id' | 'hp' | 'maxHp'>> = {
  slime: {
    name: '史莱姆',
    type: 'slime',
    attack: 5,
    defense: 2,
    exp: 10,
    gold: 5,
    description: '一团黏糊糊的绿色果冻状生物，看起来人畜无害。'
  },
  goblin: {
    name: '哥布林',
    type: 'goblin',
    attack: 10,
    defense: 5,
    exp: 25,
    gold: 15,
    description: '绿皮肤的小怪物，拿着生锈的匕首，性格狡诈。'
  },
  skeleton: {
    name: '骷髅战士',
    type: 'skeleton',
    attack: 15,
    defense: 10,
    exp: 40,
    gold: 25,
    description: '由白骨组成的战士，眼窝中燃烧着幽蓝色的火焰。'
  },
  orc: {
    name: '兽人战士',
    type: 'orc',
    attack: 25,
    defense: 20,
    exp: 75,
    gold: 50,
    description: '体型魁梧的绿皮战士，手持巨斧，性格凶残。'
  },
  dragon: {
    name: '远古巨龙',
    type: 'dragon',
    attack: 40,
    defense: 30,
    exp: 200,
    gold: 200,
    description: '传说中的强大生物，周身缠绕着火焰，令人望而生畏。'
  }
};

const ITEMS: Item[] = [
  { id: 'hp_potion', name: '生命药水', type: 'potion', value: 30, effect: { hp: 30 }, description: '恢复30点生命值' },
  { id: 'hp_potion_large', name: '大生命药水', type: 'potion', value: 80, effect: { hp: 80 }, description: '恢复80点生命值' },
  { id: 'iron_sword', name: '铁剑', type: 'weapon', value: 50, effect: { attack: 5 }, description: '攻击力+5' },
  { id: 'steel_sword', name: '钢剑', type: 'weapon', value: 100, effect: { attack: 10 }, description: '攻击力+10' },
  { id: 'leather_armor', name: '皮甲', type: 'armor', value: 40, effect: { defense: 3 }, description: '防御力+3' },
  { id: 'chain_mail', name: '锁子甲', type: 'armor', value: 80, effect: { defense: 7 }, description: '防御力+7' },
  { id: 'dungeon_key', name: '地牢钥匙', type: 'key', value: 0, description: '可以打开上锁的门' },
  { id: 'gold_chest', name: '黄金宝箱', type: 'treasure', value: 100, description: '里面装满了金币！' },
  { id: 'ruby', name: '红宝石', type: 'treasure', value: 150, description: '一颗璀璨的红宝石，价值连城' },
];

function generateFloor(floor: number): Room[] {
  const roomCount = 5 + Math.floor(Math.random() * 3);
  const rooms: Room[] = [];

  const roomTemplates = [
    { name: '阴暗的石室', desc: '墙壁上布满了青苔，空气中弥漫着潮湿的气息。' },
    { name: '破败的大厅', desc: '这里曾经是贵族的宴会厅，如今只剩下断壁残垣。' },
    { name: '潮湿的地下室', desc: '脚下传来滴水声，四周阴暗潮湿。' },
    { name: '古老的祭坛', desc: '一个神秘的祭坛矗立在房间中央，似乎隐藏着什么秘密。' },
    { name: '堆满骸骨的房间', desc: '地上散落着各种生物的骨头，令人毛骨悚然。' },
    { name: '崩塌的走廊', desc: '天花板随时可能坍塌，你需要小心通过。' },
    { name: '神秘的洞穴', desc: '钟乳石从洞顶垂下，在火把的照耀下闪闪发光。' },
  ];

  for (let i = 0; i < roomCount; i++) {
    const template = roomTemplates[i % roomTemplates.length];
    const isEntrance = i === 0;
    const isExit = i === roomCount - 1;
    const isBoss = floor === 5 && isExit;

    const enemyCount = isBoss ? 0 : (Math.random() < 0.6 ? Math.floor(Math.random() * 2) + 1 : 0);
    const itemCount = Math.random() < 0.4 ? 1 : 0;

    const enemies: Enemy[] = [];
    const floorEnemies = ENEMIES_BY_FLOOR[Math.min(floor, 5)] || ENEMIES_BY_FLOOR[5];
    for (let j = 0; j < enemyCount; j++) {
      const type = floorEnemies[Math.floor(Math.random() * floorEnemies.length)];
      const base = ENEMY_DATA[type];
      const level = floor;
      const hp = base.hp !== undefined ? base.hp : 20 + floor * 10;
      const maxHp = hp + level * 5;
      enemies.push({
        ...base,
        id: `${floor}-${i}-enemy-${j}`,
        hp: hp + level * 5,
        maxHp,
      });
    }

    const items: Item[] = [];
    if (itemCount > 0) {
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      items.push({ ...item, id: `${floor}-${i}-item-${Date.now()}` });
    }

    rooms.push({
      id: `${floor}-${i}`,
      name: isEntrance ? '地牢入口' : isExit ? '通往下一层的阶梯' : template.name,
      description: isEntrance
        ? '你站在地牢的入口处，前方是一片漆黑。火把的光芒在风中摇曳。'
        : isExit
        ? '一道向上的阶梯出现在你面前，似乎通往更深处的地牢...或者出口。'
        : `${template.desc}${isBoss ? ' 一股强大的气息弥漫在空气中...' : ''}`,
      exits: {},
      enemies,
      items,
      visited: isEntrance,
      isBoss,
      isExit,
      isEntrance,
    });
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const chance = Math.random();
    if (chance < 0.8) {
      rooms[i].exits.south = rooms[i + 1].id;
      rooms[i + 1].exits.north = rooms[i].id;
    } else if (chance < 0.9) {
      rooms[i].exits.east = rooms[i + 1].id;
      rooms[i + 1].exits.west = rooms[i].id;
    }
    if (i < rooms.length - 2 && Math.random() < 0.3) {
      rooms[i].exits.east = rooms[i + 2].id;
      rooms[i + 2].exits.west = rooms[i].id;
    }
  }

  return rooms;
}

export class TextDungeonEngine {
  private state: GameState;
  private rooms: Map<string, Room>;
  private onStateChange?: (state: GameState) => void;

  constructor() {
    this.rooms = new Map();
    const firstFloor = generateFloor(1);
    firstFloor.forEach(r => this.rooms.set(r.id, r));

    const player: Player = {
      name: '冒险者',
      level: 1,
      exp: 0,
      expToLevel: 50,
      hp: 100,
      maxHp: 100,
      attack: 15,
      defense: 5,
      gold: 20,
      weapons: [],
      armors: [],
      potions: 3,
      keys: 0,
      inventory: [],
    };

    this.state = {
      currentRoomId: firstFloor[0].id,
      player,
      combatLog: [],
      floor: 1,
      maxFloors: 5,
      isInCombat: false,
      currentEnemy: null,
      isGameOver: false,
      hasWon: false,
    };
  }

  public setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  private notifyChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getCurrentRoom(): Room | null {
    return this.rooms.get(this.state.currentRoomId) || null;
  }

  public getPlayer(): Player {
    return { ...this.state.player };
  }

  public addCombatLog(message: string): void {
    this.state.combatLog.push(message);
    if (this.state.combatLog.length > 50) {
      this.state.combatLog.shift();
    }
  }

  public move(direction: Direction): string {
    if (this.state.isInCombat) {
      return '你还在战斗中！';
    }

    const room = this.getCurrentRoom();
    if (!room) return '找不到当前房间';

    const nextRoomId = room.exits[direction];
    if (!nextRoomId) {
      return `这个方向没有出路。`;
    }

    const nextRoom = this.rooms.get(nextRoomId);
    if (!nextRoom) return '无法移动';

    nextRoom.visited = true;
    this.state.currentRoomId = nextRoomId;

    if (nextRoom.isExit && nextRoom.isBoss) {
      this.state.currentEnemy = this.createBossEnemy();
      this.state.isInCombat = true;
      this.addCombatLog(`你遭遇了 ${this.state.currentEnemy.name}！`);
      this.notifyChange();
      return `你进入了 ${nextRoom.name}。一场 boss 战即将开始！`;
    }

    let result = `你进入了 ${nextRoom.name}。\n\n${nextRoom.description}`;

    if (nextRoom.enemies.length > 0) {
      const enemy = nextRoom.enemies[0];
      this.state.currentEnemy = enemy;
      this.state.isInCombat = true;
      result += `\n\n你发现了 ${enemy.name}！`;
    }

    if (nextRoom.items.length > 0) {
      const item = nextRoom.items[0];
      this.addItemToInventory(item);
      nextRoom.items.shift();
      result += `\n\n你发现了 ${item.name}！`;
    }

    this.notifyChange();
    return result;
  }

  private createBossEnemy(): Enemy {
    const bossData = ENEMY_DATA.dragon;
    return {
      ...bossData,
      id: `boss-${this.state.floor}`,
      hp: 150 + this.state.floor * 30,
      maxHp: 150 + this.state.floor * 30,
    };
  }

  public attack(): { playerDamage: number; enemyDamage: number; enemyDefeated: boolean; playerDefeated: boolean } {
    if (!this.state.isInCombat || !this.state.currentEnemy) {
      return { playerDamage: 0, enemyDamage: 0, enemyDefeated: false, playerDefeated: false };
    }

    const player = this.state.player;
    const enemy = this.state.currentEnemy;

    const playerDamage = Math.max(1, player.attack - enemy.defense / 2 + Math.floor(Math.random() * 5));
    enemy.hp -= playerDamage;
    this.addCombatLog(`你对 ${enemy.name} 造成了 ${playerDamage} 点伤害！`);

    let enemyDamage = 0;
    let enemyDefeated = false;
    let playerDefeated = false;

    if (enemy.hp <= 0) {
      enemyDefeated = true;
      this.addCombatLog(`你击败了 ${enemy.name}！`);

      player.exp += enemy.exp;
      player.gold += enemy.gold;
      this.addCombatLog(`获得了 ${enemy.exp} 经验值和 ${enemy.gold} 金币！`);

      this.checkLevelUp();

      const room = this.getCurrentRoom();
      if (room) {
        room.enemies = room.enemies.filter(e => e.id !== enemy.id);
      }

      this.state.currentEnemy = null;
      this.state.isInCombat = false;

      if (room?.isExit && room.isBoss) {
        this.handleFloorClear();
      }
    } else {
      enemyDamage = Math.max(1, enemy.attack - player.defense / 2 + Math.floor(Math.random() * 3));
      player.hp -= enemyDamage;
      this.addCombatLog(`${enemy.name} 对你造成了 ${enemyDamage} 点伤害！`);

      if (player.hp <= 0) {
        playerDefeated = true;
        this.state.isGameOver = true;
        this.addCombatLog('你倒下了...');
      }
    }

    this.notifyChange();
    return { playerDamage, enemyDamage, enemyDefeated, playerDefeated };
  }

  public usePotion(): string {
    if (this.state.isInCombat && this.state.currentEnemy) {
      return '战斗中不能使用药水！';
    }

    if (this.state.player.potions <= 0) {
      return '你没有药水了！';
    }

    const healAmount = 30;
    const oldHp = this.state.player.hp;
    this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + healAmount);
    this.state.player.potions--;

    const healed = this.state.player.hp - oldHp;
    this.addCombatLog(`使用了生命药水，恢复 ${healed} 点生命值！`);

    this.notifyChange();
    return `使用了生命药水，恢复 ${healed} 点生命值！`;
  }

  public flee(): boolean {
    if (!this.state.isInCombat) return false;

    const chance = 0.4 + (this.state.player.luck / 100 || 0);
    if (Math.random() < chance) {
      this.state.isInCombat = false;
      this.state.currentEnemy = null;
      this.addCombatLog('你成功逃跑了！');
      this.notifyChange();
      return true;
    } else {
      const enemy = this.state.currentEnemy!;
      const damage = Math.max(1, enemy.attack - this.state.player.defense / 2);
      this.state.player.hp -= damage;
      this.addCombatLog(`逃跑失败！${enemy.name} 趁机攻击了你，造成 ${damage} 点伤害！`);

      if (this.state.player.hp <= 0) {
        this.state.isGameOver = true;
      }

      this.notifyChange();
      return false;
    }
  }

  private checkLevelUp(): void {
    const player = this.state.player;
    while (player.exp >= player.expToLevel) {
      player.exp -= player.expToLevel;
      player.level++;
      player.maxHp += 10;
      player.hp = player.maxHp;
      player.attack += 3;
      player.defense += 2;
      player.expToLevel = Math.floor(player.expToLevel * 1.5);

      this.addCombatLog(`升级了！你现在是 ${player.level} 级！`);
    }
  }

  private addItemToInventory(item: Item): void {
    const player = this.state.player;

    if (item.type === 'potion') {
      player.potions++;
    } else if (item.type === 'key') {
      player.keys++;
    } else if (item.type === 'weapon') {
      if (item.effect?.attack) {
        player.attack += item.effect.attack;
        player.weapons.push(item);
        this.addCombatLog(`装备了 ${item.name}，攻击力 +${item.effect.attack}！`);
      }
    } else if (item.type === 'armor') {
      if (item.effect?.defense) {
        player.defense += item.effect.defense;
        player.armors.push(item);
        this.addCombatLog(`装备了 ${item.name}，防御力 +${item.effect.defense}！`);
      }
    } else {
      player.gold += item.value;
      this.addCombatLog(`获得了 ${item.name}，价值 ${item.value} 金币！`);
    }
  }

  private handleFloorClear(): void {
    if (this.state.floor >= this.state.maxFloors) {
      this.state.hasWon = true;
      this.addCombatLog('恭喜你通关了地牢！你成为了传说中的英雄！');
    } else {
      this.state.floor++;
      const nextFloor = generateFloor(this.state.floor);
      nextFloor.forEach(r => this.rooms.set(r.id, r));

      const entrance = nextFloor.find(r => r.isEntrance);
      if (entrance) {
        this.state.currentRoomId = entrance.id;
      }

      this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + 30);
      this.state.player.potions += 2;
      this.addCombatLog(`你进入了第 ${this.state.floor} 层！生命值恢复了一些，并获得了2瓶药水！`);
    }

    this.notifyChange();
  }

  public restart(): void {
    this.rooms.clear();
    const firstFloor = generateFloor(1);
    firstFloor.forEach(r => this.rooms.set(r.id, r));

    const player: Player = {
      name: '冒险者',
      level: 1,
      exp: 0,
      expToLevel: 50,
      hp: 100,
      maxHp: 100,
      attack: 15,
      defense: 5,
      gold: 20,
      weapons: [],
      armors: [],
      potions: 3,
      keys: 0,
      inventory: [],
    };

    this.state = {
      currentRoomId: firstFloor[0].id,
      player,
      combatLog: ['欢迎来到文字地牢！祝你好运，冒险者！'],
      floor: 1,
      maxFloors: 5,
      isInCombat: false,
      currentEnemy: null,
      isGameOver: false,
      hasWon: false,
    };

    this.notifyChange();
  }

  public saveState(): string {
    return JSON.stringify({
      state: this.state,
      rooms: Array.from(this.rooms.entries())
    });
  }

  public loadState(savedData: string): boolean {
    try {
      const data = JSON.parse(savedData);
      this.state = data.state;
      this.rooms = new Map(data.rooms);
      this.notifyChange();
      return true;
    } catch {
      return false;
    }
  }
}
