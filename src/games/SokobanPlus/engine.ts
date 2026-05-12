export interface Position {
  x: number;
  y: number;
}

export interface Box {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isOnTarget: boolean;
}

export interface GameState {
  playerPos: Position;
  boxes: Box[];
  level: number;
  moves: number;
  pushes: number;
  isComplete: boolean;
  gridWidth: number;
  gridHeight: number;
}

export class SokobanPlusEngine {
  private playerPos: Position = { x: 1, y: 1 };
  private boxes: Box[] = [];
  private walls: Set<string> = new Set();
  private targets: Position[] = [];
  private level: number = 1;
  private moves: number = 0;
  private pushes: number = 0;
  private isComplete: boolean = false;
  private gridWidth: number = 8;
  private gridHeight: number = 8;

  private readonly levels: { layout: string; name: string }[] = [
    {
      name: '第一关 - 热身',
      layout: `
        ########
        #......#
        #..$...#
        #..@...#
        #..#.$.#
        #......#
        ########
      `
    },
    {
      name: '第二关 - 练习',
      layout: `
        ########
        #......#
        #.$.$..#
        #......#
        #.$....#
        #..@...#
        #..#.$.#
        ########
      `
    },
    {
      name: '第三关 - 挑战',
      layout: `
        #########
        #.......#
        #.$$....#
        #..#.#..#
        #..$....#
        #..@..$.#
        #...#...#
        #########
      `
    },
    {
      name: '第四关 - 进阶',
      layout: `
        ##########
        #........#
        #..$$$...#
        #..#.#.#.#
        #..$.....#
        #...#$...#
        #....@...#
        ##########
      `
    },
    {
      name: '第五关 - 大师',
      layout: `
        ############
        #..........#
        #...$$$$...#
        #...#..#...#
        #...#..#...#
        #.$.#..#.$##
        #.$.....$.#
        #...@.....#
        ############
      `
    }
  ];

  constructor() {
    this.loadLevel(1);
  }

  private loadLevel(levelNum: number): void {
    this.level = levelNum;
    this.isComplete = false;
    this.moves = 0;
    this.pushes = 0;
    this.walls.clear();
    this.targets = [];
    this.boxes = [];

    const levelData = this.levels[levelNum - 1];
    const layout = levelData.layout.trim().split('\n').map(line => line.trim());

    this.gridHeight = layout.length;
    this.gridWidth = Math.max(...layout.map(line => line.length));

    let boxId = 0;
    for (let y = 0; y < layout.length; y++) {
      for (let x = 0; x < layout[y].length; x++) {
        const char = layout[y][x];
        const key = `${x},${y}`;

        switch (char) {
          case '#':
            this.walls.add(key);
            break;
          case '@':
            this.playerPos = { x, y };
            break;
          case '$':
            this.boxes.push({
              id: boxId++,
              x, y,
              targetX: -1,
              targetY: -1,
              isOnTarget: false
            });
            break;
          case '.':
            this.targets.push({ x, y });
            break;
          case '*':
            this.targets.push({ x, y });
            this.boxes.push({
              id: boxId++,
              x, y,
              targetX: x,
              targetY: y,
              isOnTarget: true
            });
            break;
          case '+':
            this.playerPos = { x, y };
            this.targets.push({ x, y });
            break;
        }
      }
    }
  }

  private isWall(x: number, y: number): boolean {
    return this.walls.has(`${x},${y}`);
  }

  private getBoxAt(x: number, y: number): Box | undefined {
    return this.boxes.find(b => b.x === x && b.y === y);
  }

  private isTarget(x: number, y: number): boolean {
    return this.targets.some(t => t.x === x && t.y === y);
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

    if (this.isWall(newX, newY)) {
      return { success: false, message: '撞墙了!' };
    }

    const box = this.getBoxAt(newX, newY);
    if (box) {
      let boxNewX = newX;
      let boxNewY = newY;

      switch (direction) {
        case 'up': boxNewY--; break;
        case 'down': boxNewY++; break;
        case 'left': boxNewX--; break;
        case 'right': boxNewX++; break;
      }

      if (this.isWall(boxNewX, boxNewY) || this.getBoxAt(boxNewX, boxNewY)) {
        return { success: false, message: '箱子推不动!' };
      }

      box.x = boxNewX;
      box.y = boxNewY;
      box.isOnTarget = this.isTarget(boxNewX, boxNewY);
      this.pushes++;
    }

    this.playerPos = { x: newX, y: newY };
    this.moves++;

    if (this.checkCompletion()) {
      this.isComplete = true;
      return { success: true, message: '🎉 关卡完成!' };
    }

    return { success: true, message: '移动了' };
  }

  private checkCompletion(): boolean {
    return this.boxes.every(box => box.isOnTarget);
  }

  public getState(): GameState {
    return {
      playerPos: { ...this.playerPos },
      boxes: this.boxes.map(b => ({ ...b })),
      level: this.level,
      moves: this.moves,
      pushes: this.pushes,
      isComplete: this.isComplete,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight
    };
  }

  public getWalls(): Set<string> {
    return this.walls;
  }

  public getTargets(): Position[] {
    return this.targets;
  }

  public nextLevel(): void {
    if (this.level < this.levels.length) {
      this.loadLevel(this.level + 1);
    }
  }

  public resetLevel(): void {
    this.loadLevel(this.level);
  }

  public getLevel(): number {
    return this.level;
  }

  public getTotalLevels(): number {
    return this.levels.length;
  }

  public getLevelName(): string {
    return this.levels[this.level - 1].name;
  }

  public isLevelComplete(): boolean {
    return this.isComplete;
  }

  public undo(): void {
    // Simplified undo - just reset the level
    this.resetLevel();
  }
}
