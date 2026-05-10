export interface Position {
  x: number;
  y: number;
}

export interface Item {
  id: string;
  type: 'key' | 'code' | 'lever' | 'note';
  name: string;
  description: string;
  x: number;
  y: number;
  collected: boolean;
  used: boolean;
}

export interface Puzzle {
  id: string;
  type: 'key_lock' | 'code_lock' | 'lever_puzzle';
  solved: boolean;
  hint: string;
  solution: string;
  reward?: string;
}

export interface GameState {
  playerPos: Position;
  inventory: Item[];
  puzzles: Puzzle[];
  items: Item[];
  room: number;
  isEscaped: boolean;
  moves: number;
  messages: string[];
}

export class RoomEscapeEngine {
  private playerPos: Position = { x: 1, y: 1 };
  private inventory: Item[] = [];
  private puzzles: Puzzle[] = [];
  private items: Item[] = [];
  private room: number = 1;
  private isEscaped: boolean = false;
  private moves: number = 0;
  private messages: string[] = [];
  private gridSize = 7;

  private roomLayouts: { walls: Position[]; doors: { x: number; y: number; toRoom: number }[]; items: Omit<Item, 'id'>[]; puzzles: Omit<Puzzle, 'id'>[] }[] = [
    {
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
        { x: 0, y: 1 }, { x: 6, y: 1 },
        { x: 0, y: 2 }, { x: 6, y: 2 },
        { x: 0, y: 3 }, { x: 6, y: 3 },
        { x: 0, y: 4 }, { x: 6, y: 4 },
        { x: 0, y: 5 }, { x: 6, y: 5 },
        { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
      ],
      doors: [{ x: 6, y: 3, toRoom: 2 }],
      items: [
        { type: 'key', name: '锈迹钥匙', description: '一把生锈的钥匙', x: 2, y: 2, collected: false, used: false },
        { type: 'note', name: '纸条', description: '上面写着: "密码是1234"', x: 4, y: 4, collected: false, used: false },
      ],
      puzzles: [
        { type: 'key_lock', solved: false, hint: '需要钥匙才能打开', solution: 'key_锈迹钥匙' },
      ]
    },
    {
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
        { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 6, y: 1 },
        { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 6, y: 2 },
        { x: 0, y: 3 }, { x: 6, y: 3 },
        { x: 0, y: 4 }, { x: 6, y: 4 },
        { x: 0, y: 5 }, { x: 6, y: 5 },
        { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
      ],
      doors: [{ x: 0, y: 3, toRoom: 1 }, { x: 6, y: 3, toRoom: 3 }],
      items: [
        { type: 'code', name: '数字密码', description: '密码提示卡', x: 4, y: 2, collected: false, used: false },
      ],
      puzzles: [
        { type: 'code_lock', solved: false, hint: '输入4位数字密码', solution: '1234' },
      ]
    },
    {
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
        { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
        { x: 0, y: 2 }, { x: 4, y: 2 }, { x: 6, y: 2 },
        { x: 0, y: 3 }, { x: 6, y: 3 },
        { x: 0, y: 4 }, { x: 6, y: 4 },
        { x: 0, y: 5 }, { x: 6, y: 5 },
        { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
      ],
      doors: [{ x: 0, y: 3, toRoom: 2 }],
      items: [
        { type: 'lever', name: '控制杆', description: '可以拉动', x: 2, y: 2, collected: false, used: false },
      ],
      puzzles: [
        { type: 'lever_puzzle', solved: false, hint: '拉动控制杆', solution: 'lever_控制杆' },
      ]
    }
  ];

  constructor() {
    this.loadRoom(1);
  }

  private loadRoom(roomNum: number): void {
    this.room = roomNum;
    this.playerPos = { x: 1, y: 1 };
    
    const layout = this.roomLayouts[roomNum - 1];
    
    this.items = layout.items.map((item, idx) => ({
      ...item,
      id: `${roomNum}_${item.type}_${idx}`
    }));
    
    this.puzzles = layout.puzzles.map((puzzle, idx) => ({
      ...puzzle,
      id: `${roomNum}_${puzzle.type}_${idx}`
    }));
    
    this.messages.push(`进入房间 ${roomNum}`);
  }

  public move(direction: 'up' | 'down' | 'left' | 'right'): { success: boolean; message: string } {
    if (this.isEscaped) {
      return { success: false, message: '你已经逃出去了!' };
    }

    let newX = this.playerPos.x;
    let newY = this.playerPos.y;

    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    const layout = this.roomLayouts[this.room - 1];
    
    if (layout.walls.some(w => w.x === newX && w.y === newY)) {
      return { success: false, message: '撞到墙了!' };
    }

    const door = layout.doors.find(d => d.x === newX && d.y === newY);
    if (door) {
      const puzzle = this.puzzles.find(p => !p.solved);
      if (puzzle) {
        return { success: false, message: `门锁着! ${puzzle.hint}` };
      }
      this.loadRoom(door.toRoom);
      return { success: true, message: '穿过门...' };
    }

    this.playerPos = { x: newX, y: newY };
    this.moves++;

    const item = this.items.find(i => i.x === newX && i.y === newY && !i.collected);
    if (item) {
      item.collected = true;
      this.inventory.push(item);
      this.messages.push(`捡起了 ${item.name}`);
      return { success: true, message: `发现 ${item.name}!` };
    }

    return { success: true, message: '移动了' };
  }

  public interact(): { success: boolean; message: string } {
    const item = this.items.find(i => 
      Math.abs(i.x - this.playerPos.x) <= 1 && 
      Math.abs(i.y - this.playerPos.y) <= 1 && 
      !i.collected
    );

    if (item && item.type === 'note') {
      item.collected = true;
      this.inventory.push(item);
      this.messages.push(`发现纸条: ${item.description}`);
      return { success: true, message: `纸条内容: ${item.description}` };
    }

    return { success: false, message: '附近没有可交互的物品' };
  }

  public useItem(itemId: string): { success: boolean; message: string } {
    const item = this.inventory.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: '物品不存在' };
    }

    const puzzle = this.puzzles.find(p => !p.solved);
    if (!puzzle) {
      return { success: false, message: '没有未解决的谜题' };
    }

    if (puzzle.type === 'key_lock' && item.type === 'key') {
      puzzle.solved = true;
      item.used = true;
      this.messages.push(`用 ${item.name} 解锁了门!`);
      return { success: true, message: `成功解锁!` };
    }

    return { success: false, message: '这个物品不能用在这里' };
  }

  public solveCode(code: string): { success: boolean; message: string } {
    const puzzle = this.puzzles.find(p => p.type === 'code_lock' && !p.solved);
    if (!puzzle) {
      return { success: false, message: '没有数字密码锁' };
    }

    if (code === puzzle.solution) {
      puzzle.solved = true;
      this.messages.push('密码正确!');
      return { success: true, message: '🎉 密码锁打开了!' };
    }

    return { success: false, message: '密码错误!' };
  }

  public pullLever(): { success: boolean; message: string } {
    const puzzle = this.puzzles.find(p => p.type === 'lever_puzzle' && !p.solved);
    if (!puzzle) {
      return { success: false, message: '没有控制杆' };
    }

    puzzle.solved = true;
    this.isEscaped = true;
    this.messages.push('🎉 拉动控制杆! 门打开了!');
    return { success: true, message: '🎉 你逃出了密室!' };
  }

  public getState(): GameState {
    return {
      playerPos: { ...this.playerPos },
      inventory: this.inventory.map(i => ({ ...i })),
      puzzles: this.puzzles.map(p => ({ ...p })),
      items: this.items.map(i => ({ ...i })),
      room: this.room,
      isEscaped: this.isEscaped,
      moves: this.moves,
      messages: [...this.messages]
    };
  }

  public getLayout() {
    return this.roomLayouts[this.room - 1];
  }

  public getRoom(): number {
    return this.room;
  }

  public isEscapedGame(): boolean {
    return this.isEscaped;
  }

  public reset(): void {
    this.inventory = [];
    this.isEscaped = false;
    this.moves = 0;
    this.messages = [];
    this.loadRoom(1);
  }
}
