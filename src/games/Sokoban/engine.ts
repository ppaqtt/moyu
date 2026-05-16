// 推箱子游戏引擎
import { SOKOBAN_CONSTANTS } from '../../utils/constants';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  player: Position;
  boxes: Position[];
  targets: Position[];
  walls: Position[];
  level: number;
  moves: number;
  pushes: number;
  completed: boolean;
}

// 关卡设计：0=空地, 1=墙, 2=目标点, 3=箱子, 4=玩家
const LEVELS = [
  // Level 1 - 简单入门
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 0, 3, 0, 1],
      [1, 0, 0, 4, 0, 0, 1],
      [1, 0, 2, 0, 2, 0, 1],
      [1, 0, 2, 0, 2, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    name: '初学者'
  },
  // Level 2
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 2, 1, 0, 0, 0, 1],
      [1, 0, 3, 0, 3, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ],
    name: '小小挑战'
  },
  // Level 3
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 3, 0, 3, 0, 1],
      [1, 0, 0, 4, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 1, 1, 1],
      [1, 0, 2, 2, 2, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ],
    name: '中级'
  },
  // Level 4
  {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 0, 0, 2, 1],
      [1, 0, 0, 3, 0, 3, 0, 0, 1],
      [1, 0, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 0, 3, 0, 3, 0, 0, 1],
      [1, 2, 0, 0, 0, 0, 0, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    name: '进阶级'
  },
  // Level 5 - 经典关卡
  {
    map: [
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 2, 2, 2, 1, 0],
      [0, 1, 2, 3, 2, 1, 1],
      [1, 1, 3, 3, 4, 0, 1],
      [1, 2, 2, 3, 2, 2, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    name: '经典'
  }
];

export class SokobanEngine {
  private state: GameState;
  private map: number[][];
  private readonly width: number;
  private readonly height: number;

  constructor() {
    const levelData = LEVELS[0];
    this.map = JSON.parse(JSON.stringify(levelData.map));
    this.height = this.map.length;
    this.width = this.map[0].length;
    this.state = this.parseLevel(levelData.map, 1);
  }

  private parseLevel(map: number[][], level: number): GameState {
    const player: Position = { x: 0, y: 0 };
    const boxes: Position[] = [];
    const targets: Position[] = [];
    const walls: Position[] = [];

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        switch (map[y][x]) {
          case 1:
            walls.push({ x, y });
            break;
          case 2:
            targets.push({ x, y });
            break;
          case 3:
            boxes.push({ x, y });
            break;
          case 4:
            player.x = x;
            player.y = y;
            break;
        }
      }
    }

    return {
      player,
      boxes,
      targets,
      walls,
      level,
      moves: 0,
      pushes: 0,
      completed: false
    };
  }

  public reset(): void {
    const levelData = LEVELS[this.state.level - 1];
    this.map = JSON.parse(JSON.stringify(levelData.map));
    this.state = this.parseLevel(levelData.map, this.state.level);
  }

  public move(dx: number, dy: number): { success: boolean; message: string } {
    if (this.state.completed) {
      return { success: false, message: '关卡已完成' };
    }

    const newX = this.state.player.x + dx;
    const newY = this.state.player.y + dy;

    // 检查是否撞墙
    if (this.isWall(newX, newY)) {
      return { success: false, message: '撞墙了' };
    }

    // 检查是否是箱子
    const boxIndex = this.getBoxAt(newX, newY);
    if (boxIndex !== -1) {
      // 尝试推动箱子
      const boxNewX = newX + dx;
      const boxNewY = newY + dy;

      // 箱子不能推到墙里
      if (this.isWall(boxNewX, boxNewY)) {
        return { success: false, message: '箱子推不动' };
      }

      // 箱子不能推到另一个箱子里
      if (this.getBoxAt(boxNewX, boxNewY) !== -1) {
        return { success: false, message: '箱子推不动' };
      }

      // 推动箱子
      this.state.boxes[boxIndex].x = boxNewX;
      this.state.boxes[boxIndex].y = boxNewY;
      this.state.pushes++;
    }

    // 移动玩家
    this.state.player.x = newX;
    this.state.player.y = newY;
    this.state.moves++;

    // 检查是否通关
    if (this.checkWin()) {
      this.state.completed = true;
      return { success: true, message: '🎉 恭喜过关！' };
    }

    return { success: true, message: `移动 (${this.state.moves}步)` };
  }

  private isWall(x: number, y: number): boolean {
    if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
      return true;
    }
    return this.map[y][x] === 1;
  }

  private getBoxAt(x: number, y: number): number {
    return this.state.boxes.findIndex(box => box.x === x && box.y === y);
  }

  private checkWin(): boolean {
    return this.state.boxes.every(box =>
      this.state.targets.some(target => target.x === box.x && target.y === box.y)
    );
  }

  public nextLevel(): boolean {
    if (this.state.level < LEVELS.length) {
      const levelData = LEVELS[this.state.level];
      this.map = JSON.parse(JSON.stringify(levelData.map));
      this.state = this.parseLevel(levelData.map, this.state.level + 1);
      return true;
    }
    return false;
  }

  public previousLevel(): boolean {
    if (this.state.level > 1) {
      const levelData = LEVELS[this.state.level - 2];
      this.map = JSON.parse(JSON.stringify(levelData.map));
      this.state = this.parseLevel(levelData.map, this.state.level - 1);
      return true;
    }
    return false;
  }

  public goToLevel(level: number): boolean {
    if (level >= 1 && level <= LEVELS.length) {
      const levelData = LEVELS[level - 1];
      this.map = JSON.parse(JSON.stringify(levelData.map));
      this.state = this.parseLevel(levelData.map, level);
      return true;
    }
    return false;
  }

  public getMap(): number[][] {
    return this.map;
  }

  public getPlayer(): Position {
    return this.state.player;
  }

  public getBoxes(): Position[] {
    return this.state.boxes;
  }

  public getTargets(): Position[] {
    return this.state.targets;
  }

  public getMoves(): number {
    return this.state.moves;
  }

  public getPushes(): number {
    return this.state.pushes;
  }

  public getLevel(): number {
    return this.state.level;
  }

  public getTotalLevels(): number {
    return LEVELS.length;
  }

  public isCompleted(): boolean {
    return this.state.completed;
  }

  public isBoxOnTarget(box: Position): boolean {
    return this.state.targets.some(target => target.x === box.x && target.y === box.y);
  }

  public getLevelName(): string {
    return LEVELS[this.state.level - 1].name;
  }

  public undo(): { success: boolean; message: string } {
    // 简化版撤销：重置当前关卡
    this.reset();
    return { success: true, message: '已撤销' };
  }
}
