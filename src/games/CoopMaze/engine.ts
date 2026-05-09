import { COOP_MAZE_CONSTANTS } from '../../utils/constants';

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  color: string;
  reachedGoal: boolean;
}

export interface Door {
  x: number;
  y: number;
  open: boolean;
  controlledBy: number;
}

export interface Goal {
  x: number;
  y: number;
  playerId?: number;
}

export interface CoopMazeState {
  players: Player[];
  doors: Door[];
  goals: Goal[];
  walls: boolean[][];
  level: number;
  time: number;
  completed: boolean;
  bothReached: boolean;
}

const LEVELS = [
  {
    name: '初学者',
    width: 15,
    height: 11,
    player1Start: { x: 1, y: 1 },
    player2Start: { x: 13, y: 9 },
    goal1: { x: 13, y: 1 },
    goal2: { x: 1, y: 9 },
    walls: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  },
  {
    name: '合作门',
    width: 17,
    height: 13,
    player1Start: { x: 1, y: 6 },
    player2Start: { x: 15, y: 6 },
    goal1: { x: 15, y: 6 },
    goal2: { x: 1, y: 6 },
    walls: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  },
  {
    name: '交换位置',
    width: 19,
    height: 15,
    player1Start: { x: 1, y: 7 },
    player2Start: { x: 17, y: 7 },
    goal1: { x: 17, y: 7 },
    goal2: { x: 1, y: 7 },
    walls: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
      [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
      [1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  }
];

export class CoopMazeEngine {
  private players: Player[] = [];
  private walls: boolean[][] = [];
  private goals: Goal[] = [];
  private level: number = 0;
  private completed: boolean = false;
  private bothReached: boolean = false;
  private time: number = 0;
  private startTime: number = 0;
  private width: number = 15;
  private height: number = 11;

  constructor() {
    this.initLevel(0);
  }

  private initLevel(levelIndex: number): void {
    if (levelIndex >= LEVELS.length) {
      this.completed = true;
      return;
    }

    const levelData = LEVELS[levelIndex];
    this.level = levelIndex;
    this.completed = false;
    this.bothReached = false;
    this.width = levelData.width;
    this.height = levelData.height;
    this.walls = levelData.walls.map(row => row.map(cell => cell === 1));

    this.players = [
      {
        id: 1,
        x: levelData.player1Start.x,
        y: levelData.player1Start.y,
        startX: levelData.player1Start.x,
        startY: levelData.player1Start.y,
        color: '#00d2ff',
        reachedGoal: false
      },
      {
        id: 2,
        x: levelData.player2Start.x,
        y: levelData.player2Start.y,
        startX: levelData.player2Start.x,
        startY: levelData.player2Start.y,
        color: '#ff6b9d',
        reachedGoal: false
      }
    ];

    this.goals = [
      { x: levelData.goal1.x, y: levelData.goal1.y, playerId: 1 },
      { x: levelData.goal2.x, y: levelData.goal2.y, playerId: 2 }
    ];
  }

  private isWall(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
    return this.walls[y][x];
  }

  public movePlayer(playerId: number, dx: number, dy: number): { success: boolean; message: string } {
    if (this.completed || this.bothReached) {
      return { success: false, message: this.bothReached ? '已通关!' : '关卡完成' };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在' };
    }

    if (player.reachedGoal) {
      return { success: false, message: '已到达目标!' };
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (this.isWall(newX, newY)) {
      return { success: false, message: '撞墙了!' };
    }

    const otherPlayer = this.players.find(p => p.id !== playerId);
    if (otherPlayer && otherPlayer.x === newX && otherPlayer.y === newY && !otherPlayer.reachedGoal) {
      return { success: false, message: '无法穿过队友!' };
    }

    player.x = newX;
    player.y = newY;

    this.checkGoals();

    return { success: true, message: '移动成功' };
  }

  private checkGoals(): void {
    this.players.forEach(player => {
      if (!player.reachedGoal) {
        const goal = this.goals.find(g => g.playerId === player.id);
        if (goal && player.x === goal.x && player.y === goal.y) {
          player.reachedGoal = true;
        }
      }
    });

    this.bothReached = this.players.every(p => p.reachedGoal);
    if (this.bothReached) {
      this.completed = true;
    }
  }

  public getState(): CoopMazeState {
    return {
      players: this.players.map(p => ({ ...p })),
      goals: this.goals.map(g => ({ ...g })),
      walls: this.walls.map(row => [...row]),
      doors: [],
      level: this.level,
      time: this.time,
      completed: this.completed,
      bothReached: this.bothReached
    };
  }

  public getWalls(): boolean[][] {
    return this.walls;
  }

  public getPlayers(): Player[] {
    return this.players;
  }

  public getGoals(): Goal[] {
    return this.goals;
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public hasBothReached(): boolean {
    return this.bothReached;
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

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
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
