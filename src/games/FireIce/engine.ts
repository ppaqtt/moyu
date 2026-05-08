export interface Position {
  x: number;
  y: number;
}

export interface Character {
  x: number;
  y: number;
  type: 'fire' | 'ice';
  isMoving: boolean;
  direction: 'up' | 'down' | 'left' | 'right';
  isDead: boolean;
}

export interface Door {
  x: number;
  y: number;
  color: 'fire' | 'ice' | 'both';
  isOpen: boolean;
}

export interface Collectible {
  x: number;
  y: number;
  type: 'fire' | 'ice' | 'both';
  collected: boolean;
}

export interface Level {
  walls: Position[];
  doors: Door[];
  collectibles: Collectible[];
  fireSpawn: Position;
  iceSpawn: Position;
  exit: Position;
}

export interface GameFireIceState {
  fire: Character;
  ice: Character;
  level: Level;
  levelNumber: number;
  score: number;
  isComplete: boolean;
  isGameOver: boolean;
}

const TILE_SIZE = 50;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 8;

const LEVELS: Level[] = [
  {
    walls: [
      {x:2,y:1},{x:2,y:2},{x:2,y:3},{x:2,y:4},{x:2,y:5},
      {x:5,y:2},{x:5,y:3},{x:5,y:4},{x:5,y:5},{x:5,y:6},
      {x:7,y:1},{x:7,y:2},{x:7,y:3},{x:7,y:4},{x:7,y:5}
    ],
    doors: [
      {x:3,y:3,color:'fire',isOpen:false},
      {x:6,y:4,color:'ice',isOpen:false}
    ],
    collectibles: [
      {x:1,y:2,type:'fire',collected:false},
      {x:8,y:5,type:'ice',collected:false}
    ],
    fireSpawn: {x:1,y:1},
    iceSpawn: {x:8,y:6},
    exit: {x:4,y:6}
  },
  {
    walls: [
      {x:1,y:1},{x:2,y:1},{x:3,y:1},{x:4,y:1},{x:5,y:1},{x:6,y:1},{x:7,y:1},
      {x:1,y:3},{x:2,y:3},{x:4,y:3},{x:5,y:3},{x:7,y:3},
      {x:1,y:5},{x:3,y:5},{x:4,y:5},{x:6,y:5},{x:7,y:5},
      {x:1,y:6},{x:2,y:6},{x:3,y:6},{x:4,y:6},{x:5,y:6},{x:6,y:6},{x:7,y:6}
    ],
    doors: [
      {x:3,y:3,color:'fire',isOpen:false},
      {x:6,y:3,color:'ice',isOpen:false}
    ],
    collectibles: [
      {x:2,y:2,type:'fire',collected:false},
      {x:5,y:2,type:'ice',collected:false},
      {x:2,y:4,type:'both',collected:false}
    ],
    fireSpawn: {x:0,y:0},
    iceSpawn: {x:8,y:0},
    exit: {x:4,y:7}
  }
];

export class GameFireIceEngine {
  private fire: Character;
  private ice: Character;
  private level: Level;
  private levelNumber: number;
  private score: number;
  private isComplete: boolean;
  private isGameOver: boolean;
  private moveDelay: number;
  private lastMove: number;

  constructor() {
    this.fire = { x: 0, y: 0, type: 'fire', isMoving: false, direction: 'right', isDead: false };
    this.ice = { x: 0, y: 0, type: 'ice', isMoving: false, direction: 'right', isDead: false };
    this.level = LEVELS[0];
    this.levelNumber = 0;
    this.score = 0;
    this.isComplete = false;
    this.isGameOver = false;
    this.moveDelay = 150;
    this.lastMove = 0;
    this.init();
  }

  init(): void {
    this.level = LEVELS[this.levelNumber];
    this.fire = {
      ...this.level.fireSpawn,
      type: 'fire',
      isMoving: false,
      direction: 'right',
      isDead: false
    };
    this.ice = {
      ...this.level.iceSpawn,
      type: 'ice',
      isMoving: false,
      direction: 'right',
      isDead: false
    };
    this.level.collectibles.forEach(c => c.collected = false);
    this.level.doors.forEach(d => d.isOpen = false);
    this.isComplete = false;
    this.isGameOver = false;
  }

  getState(): GameFireIceState {
    return {
      fire: { ...this.fire },
      ice: { ...this.ice },
      level: {
        ...this.level,
        walls: [...this.level.walls],
        doors: this.level.doors.map(d => ({ ...d })),
        collectibles: this.level.collectibles.map(c => ({ ...c }))
      },
      levelNumber: this.levelNumber,
      score: this.score,
      isComplete: this.isComplete,
      isGameOver: this.isGameOver
    };
  }

  private isWall(x: number, y: number): boolean {
    return this.level.walls.some(w => w.x === x && w.y === y);
  }

  private getDoor(x: number, y: number): Door | undefined {
    return this.level.doors.find(d => d.x === x && d.y === y);
  }

  private canMove(character: Character, dx: number, dy: number): boolean {
    const newX = character.x + dx;
    const newY = character.y + dy;

    if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
      return false;
    }

    if (this.isWall(newX, newY)) {
      return false;
    }

    const door = this.getDoor(newX, newY);
    if (door) {
      if (door.color === 'both') {
        return character.isDead ? false : true;
      }
      if (door.color === character.type && !door.isOpen) {
        return false;
      }
      if (door.color !== character.type && !door.isOpen) {
        return false;
      }
    }

    return true;
  }

  moveFire(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.isGameOver || this.fire.isDead) return;

    const now = Date.now();
    if (now - this.lastMove < this.moveDelay) return;
    this.lastMove = now;

    const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;

    if (this.canMove(this.fire, dx, dy)) {
      this.fire.x += dx;
      this.fire.y += dy;
      this.fire.direction = direction;
    }

    this.checkCollisions();
  }

  moveIce(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.isGameOver || this.ice.isDead) return;

    const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;

    if (this.canMove(this.ice, dx, dy)) {
      this.ice.x += dx;
      this.ice.y += dy;
      this.ice.direction = direction;
    }

    this.checkCollisions();
  }

  private checkCollisions(): void {
    for (const collectible of this.level.collectibles) {
      if (collectible.collected) continue;

      const fireAt = this.fire.x === collectible.x && this.fire.y === collectible.y;
      const iceAt = this.ice.x === collectible.x && this.ice.y === collectible.y;

      if (collectible.type === 'fire' && fireAt) {
        collectible.collected = true;
        this.score += 100;
        this.openMatchingDoor('fire');
      } else if (collectible.type === 'ice' && iceAt) {
        collectible.collected = true;
        this.score += 100;
        this.openMatchingDoor('ice');
      } else if (collectible.type === 'both' && fireAt && iceAt) {
        collectible.collected = true;
        this.score += 200;
        this.openMatchingDoor('both');
      }
    }

    const fireAtExit = this.fire.x === this.level.exit.x && this.fire.y === this.level.exit.y;
    const iceAtExit = this.ice.x === this.level.exit.x && this.ice.y === this.level.exit.y;

    if (fireAtExit && iceAtExit) {
      this.score += 500;
      this.nextLevel();
    }

    for (const door of this.level.doors) {
      if (door.isOpen) continue;
      if (door.color === 'fire' && this.fire.x === door.x && this.fire.y === door.y) {
        this.fire.isDead = true;
      }
      if (door.color === 'ice' && this.ice.x === door.x && this.ice.y === door.y) {
        this.ice.isDead = true;
      }
    }

    if (this.fire.isDead || this.ice.isDead) {
      this.isGameOver = true;
    }
  }

  private openMatchingDoor(type: 'fire' | 'ice' | 'both'): void {
    for (const door of this.level.doors) {
      if (type === 'both' || door.color === type) {
        door.isOpen = true;
      }
    }
  }

  private nextLevel(): void {
    this.levelNumber++;
    if (this.levelNumber >= LEVELS.length) {
      this.isComplete = true;
      this.isGameOver = true;
    } else {
      this.level = LEVELS[this.levelNumber];
      this.fire = {
        ...this.level.fireSpawn,
        type: 'fire',
        isMoving: false,
        direction: 'right',
        isDead: false
      };
      this.ice = {
        ...this.level.iceSpawn,
        type: 'ice',
        isMoving: false,
        direction: 'right',
        isDead: false
      };
    }
  }

  reset(): void {
    this.levelNumber = 0;
    this.score = 0;
    this.init();
  }

  restartLevel(): void {
    this.score = Math.max(0, this.score - 200);
    this.init();
  }
}
