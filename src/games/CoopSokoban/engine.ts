import { COOP_SOKOBAN_CONSTANTS } from '../../utils/constants';

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  x: number;
  y: number;
  color: string;
}

export interface Box {
  x: number;
  y: number;
  onTarget: boolean;
}

export interface CoopSokobanState {
  players: Player[];
  boxes: Box[];
  targets: Position[];
  walls: Position[];
  level: number;
  moves: { player1: number; player2: number };
  completed: boolean;
  time: number;
}

const LEVELS = [
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 0, 3, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ],
    name: '初学者',
    player1Start: { x: 1, y: 1 },
    player2Start: { x: 6, y: 1 }
  },
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 3, 0, 1, 0, 3, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 0, 1, 0, 3, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    name: '合作挑战',
    player1Start: { x: 1, y: 4 },
    player2Start: { x: 7, y: 4 }
  },
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 0, 0, 0, 0, 3, 0, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 3, 0, 0, 0, 0, 3, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    name: '双人配合',
    player1Start: { x: 1, y: 1 },
    player2Start: { x: 8, y: 1 }
  }
];

export class CoopSokobanEngine {
  private players: Player[] = [];
  private boxes: Box[] = [];
  private targets: Position[] = [];
  private walls: Position[] = [];
  private map: number[][] = [];
  private level: number = 0;
  private completed: boolean = false;
  private time: number = 0;
  private canvasWidth: number;
  private canvasHeight: number;
  private startTime: number = 0;

  constructor() {
    this.canvasWidth = COOP_SOKOBAN_CONSTANTS.CANVAS_WIDTH;
    this.canvasHeight = COOP_SOKOBAN_CONSTANTS.CANVAS_HEIGHT;
    this.initLevel(0);
  }

  private initLevel(levelIndex: number): void {
    if (levelIndex >= LEVELS.length) {
      this.completed = true;
      return;
    }

    const levelData = LEVELS[levelIndex];
    this.map = JSON.parse(JSON.stringify(levelData.map));
    this.level = levelIndex;
    this.completed = false;
    this.boxes = [];
    this.targets = [];
    this.walls = [];

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        switch (this.map[y][x]) {
          case 1:
            this.walls.push({ x, y });
            break;
          case 2:
            this.targets.push({ x, y });
            break;
          case 3:
            this.boxes.push({ x, y, onTarget: false });
            break;
        }
      }
    }

    this.players = [
      { id: 1, x: levelData.player1Start.x, y: levelData.player1Start.y, color: '#00d2ff' },
      { id: 2, x: levelData.player2Start.x, y: levelData.player2Start.y, color: '#ff6b9d' }
    ];

    this.updateBoxTargets();
  }

  private updateBoxTargets(): void {
    this.boxes.forEach(box => {
      box.onTarget = this.targets.some(t => t.x === box.x && t.y === box.y);
    });
  }

  private isWall(x: number, y: number): boolean {
    if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) return true;
    return this.map[y][x] === 1;
  }

  private getBoxAt(x: number, y: number): Box | undefined {
    return this.boxes.find(b => b.x === x && b.y === y);
  }

  private getPlayerAt(x: number, y: number): Player | undefined {
    return this.players.find(p => p.x === x && p.y === y);
  }

  public movePlayer(playerId: number, dx: number, dy: number): { success: boolean; message: string } {
    if (this.completed) {
      return { success: false, message: '关卡已完成!' };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在' };
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (this.isWall(newX, newY)) {
      return { success: false, message: '撞墙了!' };
    }

    const otherPlayer = this.getPlayerAt(newX, newY);
    if (otherPlayer && otherPlayer.id !== playerId) {
      return { success: false, message: '无法穿过队友!' };
    }

    const box = this.getBoxAt(newX, newY);
    if (box) {
      const boxNewX = newX + dx;
      const boxNewY = newY + dy;

      if (this.isWall(boxNewX, boxNewY) || this.getBoxAt(boxNewX, boxNewY) || this.getPlayerAt(boxNewX, boxNewY)) {
        return { success: false, message: '箱子推不动!' };
      }

      box.x = boxNewX;
      box.y = boxNewY;
    }

    player.x = newX;
    player.y = newY;

    this.updateBoxTargets();

    if (this.checkWin()) {
      this.completed = true;
      return { success: true, message: '🎉 恭喜通关!' };
    }

    return { success: true, message: '移动成功' };
  }

  private checkWin(): boolean {
    return this.boxes.every(box => 
      this.targets.some(t => t.x === box.x && t.y === box.y)
    );
  }

  public getState(): CoopSokobanState {
    return {
      players: this.players.map(p => ({ ...p })),
      boxes: this.boxes.map(b => ({ ...b })),
      targets: this.targets.map(t => ({ ...t })),
      walls: this.walls.map(w => ({ ...w })),
      level: this.level,
      moves: { player1: 0, player2: 0 },
      completed: this.completed,
      time: this.time
    };
  }

  public getMap(): number[][] {
    return this.map;
  }

  public getPlayers(): Player[] {
    return this.players;
  }

  public getBoxes(): Box[] {
    return this.boxes;
  }

  public getTargets(): Position[] {
    return this.targets;
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public getLevel(): number {
    return this.level;
  }

  public getTotalLevels(): number {
    return LEVELS.length;
  }

  public getLevelName(): string {
    return LEVELS[this.level].name;
  }

  public nextLevel(): boolean {
    if (this.level < LEVELS.length - 1) {
      this.initLevel(this.level + 1);
      return true;
    }
    return false;
  }

  public reset(): void {
    this.initLevel(this.level);
  }

  public startTimer(): void {
    this.startTime = Date.now();
  }

  public updateTimer(): void {
    if (!this.completed && this.startTime > 0) {
      this.time = Math.floor((Date.now() - this.startTime) / 1000);
    }
  }

  public getTime(): number {
    return this.time;
  }
}
