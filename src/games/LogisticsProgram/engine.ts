// 物流编程游戏引擎

export interface Position {
  x: number;
  y: number;
}

export interface Package {
  id: string;
  start: Position;
  end: Position;
  color: string;
  name: string;
  delivered: boolean;
}

export interface Road {
  from: Position;
  to: Position;
}

export interface Level {
  id: number;
  name: string;
  gridSize: { width: number; height: number };
  packages: Package[];
  obstacles: Position[];
  warehouses: Position[];
  lesson: string;
  maxMoves: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PACKAGE_NAMES = ['食品', '电子产品', '服装', '药品', '玩具', '书籍'];

const LEVELS: Level[] = [
  {
    id: 1,
    name: '初次配送',
    gridSize: { width: 6, height: 6 },
    packages: [
      {
        id: 'pkg1',
        start: { x: 0, y: 0 },
        end: { x: 5, y: 5 },
        color: COLORS[0],
        name: PACKAGE_NAMES[0],
        delivered: false
      }
    ],
    obstacles: [],
    warehouses: [],
    lesson: '点击格子规划路径，将包裹从起点运送到终点！',
    maxMoves: 20
  },
  {
    id: 2,
    name: '绕过障碍',
    gridSize: { width: 7, height: 7 },
    packages: [
      {
        id: 'pkg1',
        start: { x: 0, y: 3 },
        end: { x: 6, y: 3 },
        color: COLORS[1],
        name: PACKAGE_NAMES[1],
        delivered: false
      }
    ],
    obstacles: [{ x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }],
    warehouses: [],
    lesson: '障碍物无法通过，需要规划绕行路线。',
    maxMoves: 25
  },
  {
    id: 3,
    name: '双包裹配送',
    gridSize: { width: 8, height: 8 },
    packages: [
      {
        id: 'pkg1',
        start: { x: 0, y: 0 },
        end: { x: 7, y: 7 },
        color: COLORS[0],
        name: PACKAGE_NAMES[0],
        delivered: false
      },
      {
        id: 'pkg2',
        start: { x: 7, y: 0 },
        end: { x: 0, y: 7 },
        color: COLORS[2],
        name: PACKAGE_NAMES[2],
        delivered: false
      }
    ],
    obstacles: [{ x: 3, y: 3 }, { x: 4, y: 4 }],
    warehouses: [],
    lesson: '配送多个包裹，点击包裹切换当前配送的包裹。',
    maxMoves: 40
  },
  {
    id: 4,
    name: '仓库中转',
    gridSize: { width: 8, height: 8 },
    packages: [
      {
        id: 'pkg1',
        start: { x: 0, y: 0 },
        end: { x: 7, y: 7 },
        color: COLORS[3],
        name: PACKAGE_NAMES[3],
        delivered: false
      }
    ],
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }
    ],
    warehouses: [{ x: 4, y: 4 }],
    lesson: '仓库可以作为中转站，路径必须经过仓库。',
    maxMoves: 35
  },
  {
    id: 5,
    name: '复杂配送',
    gridSize: { width: 10, height: 10 },
    packages: [
      {
        id: 'pkg1',
        start: { x: 0, y: 0 },
        end: { x: 9, y: 9 },
        color: COLORS[0],
        name: PACKAGE_NAMES[0],
        delivered: false
      },
      {
        id: 'pkg2',
        start: { x: 9, y: 0 },
        end: { x: 0, y: 9 },
        color: COLORS[1],
        name: PACKAGE_NAMES[1],
        delivered: false
      },
      {
        id: 'pkg3',
        start: { x: 0, y: 9 },
        end: { x: 9, y: 0 },
        color: COLORS[2],
        name: PACKAGE_NAMES[2],
        delivered: false
      }
    ],
    obstacles: [
      { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 },
      { x: 5, y: 3 }, { x: 5, y: 6 }
    ],
    warehouses: [{ x: 5, y: 5 }],
    lesson: '三个包裹，一个仓库，规划最优配送路线！',
    maxMoves: 80
  }
];

export class LogisticsProgramEngine {
  private currentLevel: number = 0;
  private packages: Package[] = [];
  private currentPackageIndex: number = 0;
  private path: Position[] = [];
  private movesUsed: number = 0;
  private isSimulating: boolean = false;

  constructor() {
    this.loadLevel(0);
  }

  public loadLevel(levelIndex: number) {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;
    this.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    this.packages = level.packages.map(pkg => ({ ...pkg, delivered: false }));
    this.currentPackageIndex = 0;
    this.path = [];
    this.movesUsed = 0;
    this.isSimulating = false;
  }

  public getLevel(): Level {
    return LEVELS[this.currentLevel];
  }

  public getCurrentLevelIndex(): number {
    return this.currentLevel;
  }

  public getTotalLevels(): number {
    return LEVELS.length;
  }

  public getPackages(): Package[] {
    return this.packages;
  }

  public getCurrentPackageIndex(): number {
    return this.currentPackageIndex;
  }

  public getPath(): Position[] {
    return this.path;
  }

  public getMovesUsed(): number {
    return this.movesUsed;
  }

  public isSimulatingPath(): boolean {
    return this.isSimulating;
  }

  public selectPackage(index: number) {
    if (index >= 0 && index < this.packages.length && !this.packages[index].delivered) {
      this.currentPackageIndex = index;
      this.path = [];
    }
  }

  public addToPath(pos: Position): boolean {
    const level = this.getLevel();
    const currentPkg = this.packages[this.currentPackageIndex];
    
    if (currentPkg.delivered) return false;
    
    if (this.path.length === 0) {
      if (pos.x === currentPkg.start.x && pos.y === currentPkg.start.y) {
        this.path = [pos];
        return true;
      }
      return false;
    }

    const lastPos = this.path[this.path.length - 1];
    
    if (!this.isAdjacent(lastPos, pos)) return false;
    
    if (this.path.some(p => p.x === pos.x && p.y === pos.y)) return false;
    
    if (level.obstacles.some(o => o.x === pos.x && o.y === pos.y)) return false;
    
    if (pos.x < 0 || pos.x >= level.gridSize.width || pos.y < 0 || pos.y >= level.gridSize.height) return false;
    
    if (this.movesUsed + this.path.length >= level.maxMoves) return false;

    this.path.push(pos);
    
    if (pos.x === currentPkg.end.x && pos.y === currentPkg.end.y) {
      if (this.checkWarehouseRequirement()) {
        return true;
      }
    }
    
    return true;
  }

  private isAdjacent(p1: Position, p2: Position): boolean {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  private checkWarehouseRequirement(): boolean {
    const level = this.getLevel();
    if (level.warehouses.length === 0) return true;
    
    return level.warehouses.some(warehouse => 
      this.path.some(p => p.x === warehouse.x && p.y === warehouse.y)
    );
  }

  public undoPath() {
    if (this.path.length > 0) {
      this.path.pop();
    }
  }

  public clearPath() {
    this.path = [];
  }

  public async simulatePath(): Promise<boolean> {
    const level = this.getLevel();
    const currentPkg = this.packages[this.currentPackageIndex];
    
    if (this.path.length < 2) return false;
    
    const lastPos = this.path[this.path.length - 1];
    if (lastPos.x !== currentPkg.end.x || lastPos.y !== currentPkg.end.y) {
      return false;
    }

    if (!this.checkWarehouseRequirement()) {
      return false;
    }

    this.isSimulating = true;
    await this.delay(500);
    
    this.packages[this.currentPackageIndex].delivered = true;
    this.movesUsed += this.path.length - 1;
    this.path = [];
    
    const nextUndelivered = this.packages.findIndex(p => !p.delivered);
    if (nextUndelivered !== -1) {
      this.currentPackageIndex = nextUndelivered;
    }
    
    this.isSimulating = false;
    return true;
  }

  public isCompleted(): boolean {
    return this.packages.every(pkg => pkg.delivered);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public reset() {
    this.loadLevel(this.currentLevel);
  }
}
