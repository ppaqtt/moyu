export interface Position {
  x: number;
  y: number;
}

export interface Key {
  id: number;
  type: 'bronze' | 'silver' | 'gold';
  x: number;
  y: number;
  collected: boolean;
}

export interface Door {
  id: number;
  type: 'bronze' | 'silver' | 'gold';
  x: number;
  y: number;
  unlocked: boolean;
  requires: number;
}

export interface GameState {
  playerPos: Position;
  keys: Key[];
  doors: Door[];
  collectedKeys: { bronze: number; silver: number; gold: number };
  level: number;
  isComplete: boolean;
  moves: number;
}

export class KeyUnlockEngine {
  private playerPos: Position = { x: 1, y: 1 };
  private keys: Key[] = [];
  private doors: Door[] = [];
  private collectedKeys = { bronze: 0, silver: 0, gold: 0 };
  private level: number = 1;
  private isComplete: boolean = false;
  private moves: number = 0;
  private gridWidth: number = 8;
  private gridHeight: number = 8;
  private walls: Position[] = [];

  constructor() {
    this.generateLevel(1);
  }

  private generateLevel(levelNum: number): void {
    this.level = levelNum;
    this.isComplete = false;
    this.moves = 0;
    this.collectedKeys = { bronze: 0, silver: 0, gold: 0 };
    this.gridWidth = 7 + Math.floor(levelNum / 2);
    this.gridHeight = 7 + Math.floor(levelNum / 2);

    const difficulty = Math.min(levelNum, 5);
    
    this.playerPos = { x: 1, y: this.gridHeight - 2 };
    
    this.keys = [];
    this.doors = [];
    this.walls = [];

    for (let x = 0; x < this.gridWidth; x++) {
      this.walls.push({ x, y: 0 });
      this.walls.push({ x, y: this.gridHeight - 1 });
    }
    for (let y = 1; y < this.gridHeight - 1; y++) {
      this.walls.push({ x: 0, y });
      this.walls.push({ x: this.gridWidth - 1, y });
    }

    const numKeys = 1 + difficulty;
    for (let i = 0; i < numKeys; i++) {
      const pos = this.getRandomEmptyPosition();
      const type = i === 0 ? 'bronze' : i === 1 ? 'silver' : 'gold';
      this.keys.push({ id: i, type, x: pos.x, y: pos.y, collected: false });
    }

    const numDoors = difficulty;
    const doorTypes: ('bronze' | 'silver' | 'gold')[] = ['bronze'];
    if (difficulty >= 2) doorTypes.push('silver');
    if (difficulty >= 3) doorTypes.push('gold');

    for (let i = 0; i < numDoors; i++) {
      const pos = this.getRandomEmptyPosition();
      const type = doorTypes[i % doorTypes.length];
      this.doors.push({ 
        id: i, 
        type, 
        x: pos.x, 
        y: pos.y, 
        unlocked: false,
        requires: type === 'bronze' ? 1 : type === 'silver' ? 2 : 3
      });
    }

    const exitPos = this.getRandomEmptyPosition();
    this.doors.push({
      id: 999,
      type: 'gold',
      x: exitPos.x,
      y: exitPos.y,
      unlocked: false,
      requires: 3
    });
  }

  private getRandomEmptyPosition(): Position {
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * (this.gridWidth - 2)) + 1;
      const y = Math.floor(Math.random() * (this.gridHeight - 2)) + 1;
      
      if (this.isPositionEmpty(x, y)) {
        return { x, y };
      }
      attempts++;
    }
    return { x: 2, y: 2 };
  }

  private isPositionEmpty(x: number, y: number): boolean {
    if (x === this.playerPos.x && y === this.playerPos.y) return false;
    if (this.walls.some(w => w.x === x && w.y === y)) return false;
    if (this.keys.some(k => k.x === x && k.y === y)) return false;
    if (this.doors.some(d => d.x === x && d.y === y)) return false;
    return true;
  }

  public move(direction: 'up' | 'down' | 'left' | 'right'): { success: boolean; message: string } {
    if (this.isComplete) {
      return { success: false, message: '关卡已完成!' };
    }

    let newX = this.playerPos.x;
    let newY = this.playerPos.y;

    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    if (this.walls.some(w => w.x === newX && w.y === newY)) {
      return { success: false, message: '撞墙了!' };
    }

    const door = this.doors.find(d => d.x === newX && d.y === newY && !d.unlocked);
    if (door) {
      if (door.type === 'bronze' && this.collectedKeys.bronze < 1) {
        return { success: false, message: '需要1把铜钥匙!' };
      }
      if (door.type === 'silver' && this.collectedKeys.silver < 1) {
        return { success: false, message: '需要1把银钥匙!' };
      }
      if (door.type === 'gold' && this.collectedKeys.gold < 1) {
        return { success: false, message: '需要1把金钥匙!' };
      }
      
      if (door.type === 'bronze') this.collectedKeys.bronze--;
      else if (door.type === 'silver') this.collectedKeys.silver--;
      else if (door.type === 'gold') this.collectedKeys.gold--;
      
      door.unlocked = true;
    }

    this.playerPos = { x: newX, y: newY };
    this.moves++;

    const key = this.keys.find(k => k.x === newX && k.y === newY && !k.collected);
    if (key) {
      key.collected = true;
      this.collectedKeys[key.type]++;
    }

    if (this.doors.some(d => d.id === 999 && d.unlocked && d.x === newX && d.y === newY)) {
      this.isComplete = true;
      return { success: true, message: '🎉 关卡完成!' };
    }

    return { success: true, message: '移动了' };
  }

  public getState(): GameState {
    return {
      playerPos: { ...this.playerPos },
      keys: this.keys.map(k => ({ ...k })),
      doors: this.doors.map(d => ({ ...d })),
      collectedKeys: { ...this.collectedKeys },
      level: this.level,
      isComplete: this.isComplete,
      moves: this.moves
    };
  }

  public getGridSize(): { width: number; height: number } {
    return { width: this.gridWidth, height: this.gridHeight };
  }

  public nextLevel(): void {
    this.generateLevel(this.level + 1);
  }

  public resetLevel(): void {
    this.generateLevel(this.level);
  }

  public getLevel(): number {
    return this.level;
  }

  public isLevelComplete(): boolean {
    return this.isComplete;
  }

  public getMoves(): number {
    return this.moves;
  }
}
