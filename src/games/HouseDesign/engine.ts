export interface Furniture {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  emoji: string;
  price: number;
  rotation: number;
}

export interface Room {
  id: number;
  name: string;
  color: string;
  items: Furniture[];
  budget: number;
  spent: number;
}

export interface HouseDesignState {
  money: number;
  reputation: number;
  rooms: Room[];
  currentRoom: number;
  selectedFurniture: Furniture | null;
  isDecorating: boolean;
  completedRooms: number;
  totalSpent: number;
}

export class HouseDesignEngine {
  private state: HouseDesignState;
  private roomCount: number = 4;
  private canvasWidth: number;
  private canvasHeight: number;

  public furnitureTypes = [
    { type: 'sofa', name: '沙发', emoji: '🛋️', price: 500, width: 80, height: 40, color: '#8b4513' },
    { type: 'bed', name: '床', emoji: '🛏️', price: 800, width: 70, height: 100, color: '#4169e1' },
    { type: 'table', name: '桌子', emoji: '🪑', price: 200, width: 50, height: 50, color: '#deb887' },
    { type: 'tv', name: '电视', emoji: '📺', price: 600, width: 60, height: 30, color: '#2f4f4f' },
    { type: 'plant', name: '植物', emoji: '🪴', price: 50, width: 30, height: 30, color: '#228b22' },
    { type: 'lamp', name: '台灯', emoji: '💡', price: 80, width: 20, height: 20, color: '#ffd700' },
    { type: 'bookshelf', name: '书架', emoji: '📚', price: 300, width: 60, height: 80, color: '#8b4513' },
    { type: 'carpet', name: '地毯', emoji: '🟫', price: 150, width: 90, height: 60, color: '#cd853f' },
    { type: 'clock', name: '时钟', emoji: '🕐', price: 100, width: 25, height: 25, color: '#a9a9a9' },
    { type: 'mirror', name: '镜子', emoji: '🪞', price: 120, width: 30, height: 50, color: '#c0c0c0' },
    { type: 'desk', name: '书桌', emoji: '🖥️', price: 400, width: 70, height: 40, color: '#8b4513' },
    { type: 'wardrobe', name: '衣柜', emoji: '🗄️', price: 350, width: 60, height: 80, color: '#a0522d' },
  ];

  public roomConfigs = [
    { name: '客厅', color: '#f5f5dc', budget: 3000 },
    { name: '卧室', color: '#e6e6fa', budget: 2500 },
    { name: '厨房', color: '#fffaf0', budget: 2000 },
    { name: '浴室', color: '#e0ffff', budget: 1500 },
  ];

  constructor() {
    this.canvasWidth = 600;
    this.canvasHeight = 400;
    this.state = this.getInitialState();
  }

  private getInitialState(): HouseDesignState {
    const rooms: Room[] = this.roomConfigs.map((config, index) => ({
      id: index,
      name: config.name,
      color: config.color,
      items: [],
      budget: config.budget,
      spent: 0,
    }));

    return {
      money: 10000,
      reputation: 0,
      rooms,
      currentRoom: 0,
      selectedFurniture: null,
      isDecorating: false,
      completedRooms: 0,
      totalSpent: 0,
    };
  }

  public start(): void {
    this.state = this.getInitialState();
  }

  public selectRoom(index: number): void {
    if (index >= 0 && index < this.roomCount) {
      this.state.currentRoom = index;
    }
  }

  public selectFurniture(furnitureType: string): void {
    const type = this.furnitureTypes.find(f => f.type === furnitureType);
    if (type) {
      this.state.selectedFurniture = {
        id: Date.now(),
        ...type,
        x: 50,
        y: 50,
        rotation: 0,
      };
    }
  }

  public placeFurniture(x: number, y: number): boolean {
    if (!this.state.selectedFurniture) return false;

    const currentRoom = this.state.rooms[this.state.currentRoom];
    const furniture = this.state.selectedFurniture;

    if (currentRoom.spent + furniture.price > currentRoom.budget) {
      return false;
    }

    if (furniture.price > this.state.money) {
      return false;
    }

    if (x < 0 || x + furniture.width > this.canvasWidth ||
        y < 0 || y + furniture.height > this.canvasHeight) {
      return false;
    }

    const newFurniture: Furniture = {
      ...furniture,
      id: Date.now(),
      x,
      y,
    };

    currentRoom.items.push(newFurniture);
    currentRoom.spent += furniture.price;
    this.state.money -= furniture.price;
    this.state.totalSpent += furniture.price;

    if (currentRoom.items.length >= 5) {
      this.state.completedRooms++;
      this.calculateReputation();
    }

    this.state.selectedFurniture = null;

    return true;
  }

  public removeFurniture(furnitureId: number): void {
    const currentRoom = this.state.rooms[this.state.currentRoom];
    const index = currentRoom.items.findIndex(item => item.id === furnitureId);

    if (index !== -1) {
      const item = currentRoom.items[index];
      currentRoom.items.splice(index, 1);
      currentRoom.spent -= item.price;
      this.state.money += item.price;
      this.state.totalSpent -= item.price;
    }
  }

  public moveFurniture(furnitureId: number, x: number, y: number): void {
    const currentRoom = this.state.rooms[this.state.currentRoom];
    const furniture = currentRoom.items.find(item => item.id === furnitureId);

    if (furniture) {
      furniture.x = Math.max(0, Math.min(x, this.canvasWidth - furniture.width));
      furniture.y = Math.max(0, Math.min(y, this.canvasHeight - furniture.height));
    }
  }

  public rotateFurniture(furnitureId: number): void {
    const currentRoom = this.state.rooms[this.state.currentRoom];
    const furniture = currentRoom.items.find(item => item.id === furnitureId);

    if (furniture) {
      furniture.rotation = (furniture.rotation + 90) % 360;
      const temp = furniture.width;
      furniture.width = furniture.height;
      furniture.height = temp;
    }
  }

  private calculateReputation(): void {
    let totalScore = 0;
    let roomCount = 0;

    this.state.rooms.forEach(room => {
      if (room.items.length >= 5) {
        const budgetUsage = room.spent / room.budget;
        const itemCount = room.items.length;
        const score = Math.min(100, budgetUsage * 50 + itemCount * 10);
        totalScore += score;
        roomCount++;
      }
    });

    if (roomCount > 0) {
      this.state.reputation = Math.round(totalScore / roomCount);
    }
  }

  public getState(): HouseDesignState {
    return { ...this.state };
  }

  public getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  public getCurrentRoom(): Room {
    return this.state.rooms[this.state.currentRoom];
  }

  public canAfford(price: number): boolean {
    return this.state.money >= price;
  }

  public getBudgetRemaining(): number {
    const room = this.state.rooms[this.state.currentRoom];
    return room.budget - room.spent;
  }
}
