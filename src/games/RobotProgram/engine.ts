// 机器人编程游戏引擎

export interface Position {
  x: number;
  y: number;
}

export interface Command {
  type: 'forward' | 'turnLeft' | 'turnRight' | 'pickUp' | 'drop';
  id: string;
}

export const DIRECTIONS = ['up', 'right', 'down', 'left'] as const;
export type Direction = typeof DIRECTIONS[number];

export interface Level {
  id: number;
  name: string;
  gridSize: { width: number; height: number };
  start: Position;
  goal: Position;
  obstacles: Position[];
  items: Position[];
  initialDirection: Direction;
  lesson: string;
}

const LEVELS: Level[] = [
  {
    id: 1,
    name: '第一步',
    gridSize: { width: 5, height: 5 },
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    obstacles: [],
    items: [],
    initialDirection: 'right',
    lesson: '学习基础：使用"前进"命令让机器人到达目标位置。'
  },
  {
    id: 2,
    name: '转弯学习',
    gridSize: { width: 5, height: 5 },
    start: { x: 0, y: 0 },
    goal: { x: 2, y: 2 },
    obstacles: [],
    items: [],
    initialDirection: 'right',
    lesson: '学习转弯：结合"前进"和"转弯"命令规划路径。'
  },
  {
    id: 3,
    name: '避开障碍',
    gridSize: { width: 5, height: 5 },
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    obstacles: [{ x: 2, y: 2 }],
    items: [],
    initialDirection: 'right',
    lesson: '避开障碍：障碍物用红色方块表示，需要绕行通过。'
  },
  {
    id: 4,
    name: '收集物品',
    gridSize: { width: 6, height: 6 },
    start: { x: 0, y: 0 },
    goal: { x: 5, y: 5 },
    obstacles: [],
    items: [{ x: 2, y: 2 }, { x: 3, y: 3 }],
    initialDirection: 'right',
    lesson: '收集物品：使用"拾取"命令收集蓝色物品，然后到达目标。'
  },
  {
    id: 5,
    name: '复杂路径',
    gridSize: { width: 7, height: 7 },
    start: { x: 0, y: 3 },
    goal: { x: 6, y: 3 },
    obstacles: [
      { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 },
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }
    ],
    items: [{ x: 3, y: 1 }, { x: 3, y: 5 }],
    initialDirection: 'right',
    lesson: '复杂路径规划：综合运用所学命令完成挑战！'
  }
];

export class RobotProgramEngine {
  private currentLevel: number = 0;
  private robotPosition: Position = { x: 0, y: 0 };
  private robotDirection: Direction = 'right';
  private commands: Command[] = [];
  private collectedItems: Position[] = [];
  private isRunning: boolean = false;
  private commandIndex: number = 0;

  constructor() {
    this.loadLevel(0);
  }

  public loadLevel(levelIndex: number) {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;
    this.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    this.robotPosition = { ...level.start };
    this.robotDirection = level.initialDirection;
    this.commands = [];
    this.collectedItems = [];
    this.isRunning = false;
    this.commandIndex = 0;
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

  public getRobotPosition(): Position {
    return this.robotPosition;
  }

  public getRobotDirection(): Direction {
    return this.robotDirection;
  }

  public getCommands(): Command[] {
    return this.commands;
  }

  public getCollectedItems(): Position[] {
    return this.collectedItems;
  }

  public addCommand(type: Command['type']) {
    const command: Command = {
      type,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    this.commands.push(command);
  }

  public removeCommand(index: number) {
    if (index >= 0 && index < this.commands.length) {
      this.commands.splice(index, 1);
    }
  }

  public moveCommand(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= this.commands.length) return;
    if (toIndex < 0 || toIndex >= this.commands.length) return;
    
    const [command] = this.commands.splice(fromIndex, 1);
    this.commands.splice(toIndex, 0, command);
  }

  public clearCommands() {
    this.commands = [];
    this.isRunning = false;
    this.commandIndex = 0;
  }

  public reset() {
    const level = LEVELS[this.currentLevel];
    this.robotPosition = { ...level.start };
    this.robotDirection = level.initialDirection;
    this.collectedItems = [];
    this.isRunning = false;
    this.commandIndex = 0;
  }

  public async executeCommands(): Promise<boolean> {
    this.isRunning = true;
    this.reset();
    
    for (let i = 0; i < this.commands.length; i++) {
      this.commandIndex = i;
      const command = this.commands[i];
      const success = this.executeCommand(command);
      
      if (!success) {
        this.isRunning = false;
        return false;
      }
      
      // 检查是否完成
      if (this.isCompleted()) {
        this.isRunning = false;
        return true;
      }
      
      await this.delay(300);
    }
    
    this.isRunning = false;
    return this.isCompleted();
  }

  private executeCommand(command: Command): boolean {
    const level = LEVELS[this.currentLevel];
    
    switch (command.type) {
      case 'forward': {
        const newPos = this.getNextPosition();
        if (this.isValidPosition(newPos, level)) {
          this.robotPosition = newPos;
          // 检查是否有物品可以拾取
          const itemIndex = level.items.findIndex(item => 
            item.x === newPos.x && item.y === newPos.y &&
            !this.collectedItems.some(collected => 
              collected.x === item.x && collected.y === item.y
            )
          );
          if (itemIndex !== -1) {
            this.collectedItems.push(level.items[itemIndex]);
          }
          return true;
        }
        return false;
      }
      
      case 'turnLeft':
        this.robotDirection = DIRECTIONS[(DIRECTIONS.indexOf(this.robotDirection) + 3) % 4];
        return true;
      
      case 'turnRight':
        this.robotDirection = DIRECTIONS[(DIRECTIONS.indexOf(this.robotDirection) + 1) % 4];
        return true;
      
      case 'pickUp': {
        const itemIndex = level.items.findIndex(item => 
          item.x === this.robotPosition.x && item.y === this.robotPosition.y &&
          !this.collectedItems.some(collected => 
            collected.x === item.x && collected.y === item.y
          )
        );
        if (itemIndex !== -1) {
          this.collectedItems.push(level.items[itemIndex]);
          return true;
        }
        return false;
      }
      
      case 'drop':
        // For now, drop is not used in levels
        return true;
    }
  }

  private getNextPosition(): Position {
    switch (this.robotDirection) {
      case 'up': return { x: this.robotPosition.x, y: this.robotPosition.y - 1 };
      case 'down': return { x: this.robotPosition.x, y: this.robotPosition.y + 1 };
      case 'left': return { x: this.robotPosition.x - 1, y: this.robotPosition.y };
      case 'right': return { x: this.robotPosition.x + 1, y: this.robotPosition.y };
    }
  }

  private isValidPosition(pos: Position, level: Level): boolean {
    // Check boundaries
    if (pos.x < 0 || pos.x >= level.gridSize.width) return false;
    if (pos.y < 0 || pos.y >= level.gridSize.height) return false;
    
    // Check obstacles
    return !level.obstacles.some(obstacle => 
      obstacle.x === pos.x && obstacle.y === pos.y
    );
  }

  public isCompleted(): boolean {
    const level = LEVELS[this.currentLevel];
    
    // Check if robot is at goal
    const atGoal = this.robotPosition.x === level.goal.x && 
                   this.robotPosition.y === level.goal.y;
    
    // Check if all items are collected
    const allCollected = level.items.every(item => 
      this.collectedItems.some(collected => 
        collected.x === item.x && collected.y === item.y
      )
    );
    
    return atGoal && allCollected;
  }

  public isRunningProgram(): boolean {
    return this.isRunning;
  }

  public getCurrentCommandIndex(): number {
    return this.commandIndex;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
