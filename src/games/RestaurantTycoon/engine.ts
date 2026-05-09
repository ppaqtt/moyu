export type DishType = 'burger' | 'pizza' | 'sushi' | 'steak' | 'dessert';
export type StationType = 'grill' | 'prep' | 'oven' | 'dessert';

export interface Dish {
  type: DishType;
  name: string;
  emoji: string;
  price: number;
  cookTime: number;
  ingredients: number;
  color: string;
}

export interface Order {
  id: number;
  dish: DishType;
  customer: string;
  patience: number;
  maxPatience: number;
  arrivedAt: number;
}

export interface Station {
  type: StationType;
  x: number;
  y: number;
  width: number;
  height: number;
  dish: DishType | null;
  progress: number;
  requiredTime: number;
}

export interface RestaurantState {
  money: number;
  reputation: number;
  customersServed: number;
  orders: Order[];
  stations: Station[];
  gameOver: boolean;
}

export const DISHES: Record<DishType, Dish> = {
  burger: {
    type: 'burger',
    name: '汉堡',
    emoji: '🍔',
    price: 15,
    cookTime: 3000,
    ingredients: 1,
    color: '#f4a460'
  },
  pizza: {
    type: 'pizza',
    name: '披萨',
    emoji: '🍕',
    price: 25,
    cookTime: 5000,
    ingredients: 2,
    color: '#ff6347'
  },
  sushi: {
    type: 'sushi',
    name: '寿司',
    emoji: '🍣',
    price: 30,
    cookTime: 4000,
    ingredients: 2,
    color: '#ff7f50'
  },
  steak: {
    type: 'steak',
    name: '牛排',
    emoji: '🥩',
    price: 40,
    cookTime: 6000,
    ingredients: 3,
    color: '#cd5c5c'
  },
  dessert: {
    type: 'dessert',
    name: '甜点',
    emoji: '🍰',
    price: 12,
    cookTime: 2000,
    ingredients: 1,
    color: '#ff69b4'
  }
};

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const INITIAL_MONEY = 200;
const INITIAL_REPUTATION = 50;
const MAX_REPUTATION = 100;

const CUSTOMER_NAMES = ['张三', '李四', '王五', '赵六', '钱七', '小红', '小明', '小华', '小丽', '小强'];

export class RestaurantTycoonEngine {
  private money: number;
  private reputation: number;
  private customersServed: number;
  private orders: Order[];
  private stations: Station[];
  private gameOver: boolean;
  private lastUpdate: number;
  private orderIdCounter: number;
  private customerSpawnTimer: number;
  private customerSpawnInterval: number;

  constructor() {
    this.money = INITIAL_MONEY;
    this.reputation = INITIAL_REPUTATION;
    this.customersServed = 0;
    this.orders = [];
    this.stations = [];
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.orderIdCounter = 0;
    this.customerSpawnTimer = 0;
    this.customerSpawnInterval = 5000;
    this.init();
  }

  private init(): void {
    this.stations = [
      { type: 'grill', x: 50, y: 50, width: 100, height: 80, dish: null, progress: 0, requiredTime: 3000 },
      { type: 'oven', x: 170, y: 50, width: 100, height: 80, dish: null, progress: 0, requiredTime: 5000 },
      { type: 'prep', x: 290, y: 50, width: 100, height: 80, dish: null, progress: 0, requiredTime: 4000 },
      { type: 'dessert', x: 410, y: 50, width: 100, height: 80, dish: null, progress: 0, requiredTime: 2000 }
    ];
  }

  getState(): RestaurantState {
    return {
      money: this.money,
      reputation: this.reputation,
      customersServed: this.customersServed,
      orders: [...this.orders],
      stations: [...this.stations],
      gameOver: this.gameOver
    };
  }

  getDish(type: DishType): Dish {
    return DISHES[type];
  }

  getStationsForDish(dishType: DishType): StationType[] {
    switch (dishType) {
      case 'burger':
      case 'steak':
        return ['grill'];
      case 'pizza':
        return ['oven'];
      case 'sushi':
        return ['prep'];
      case 'dessert':
        return ['dessert'];
      default:
        return ['prep'];
    }
  }

  startCooking(stationIndex: number, dishType: DishType): boolean {
    if (stationIndex < 0 || stationIndex >= this.stations.length) return false;
    const station = this.stations[stationIndex];
    if (station.dish !== null) return false;

    const dish = DISHES[dishType];
    station.dish = dishType;
    station.progress = 0;
    station.requiredTime = dish.cookTime;

    return true;
  }

  serveOrder(orderId: number): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    const dish = DISHES[order.dish];
    const station = this.stations.find(s => s.dish === order.dish);

    if (!station || station.progress < station.requiredTime * 0.8) {
      this.reputation -= 5;
      this.orders = this.orders.filter(o => o.id !== orderId);
      return false;
    }

    this.money += dish.price;
    this.customersServed++;
    station.dish = null;
    station.progress = 0;
    this.orders = this.orders.filter(o => o.id !== orderId);

    return true;
  }

  cancelStation(stationIndex: number): boolean {
    if (stationIndex < 0 || stationIndex >= this.stations.length) return false;
    const station = this.stations[stationIndex];
    if (station.dish === null) return false;

    station.dish = null;
    station.progress = 0;

    return true;
  }

  private spawnOrder(): void {
    const dishTypes: DishType[] = ['burger', 'pizza', 'sushi', 'steak', 'dessert'];
    const randomDish = dishTypes[Math.floor(Math.random() * dishTypes.length)];
    const randomCustomer = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];

    const order: Order = {
      id: this.orderIdCounter++,
      dish: randomDish,
      customer: randomCustomer,
      patience: 15000,
      maxPatience: 15000,
      arrivedAt: Date.now()
    };

    this.orders.push(order);
  }

  tick(): void {
    if (this.gameOver) return;

    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    this.customerSpawnTimer += deltaTime;
    if (this.customerSpawnTimer >= this.customerSpawnInterval && this.orders.length < 5) {
      this.spawnOrder();
      this.customerSpawnTimer = 0;
      this.customerSpawnInterval = Math.max(3000, this.customerSpawnInterval - 50);
    }

    for (const station of this.stations) {
      if (station.dish !== null) {
        station.progress += deltaTime;
      }
    }

    for (const order of this.orders) {
      order.patience -= deltaTime;
      if (order.patience <= 0) {
        this.reputation -= 10;
        this.orders = this.orders.filter(o => o.id !== order.id);
      }
    }

    this.reputation = Math.max(0, Math.min(MAX_REPUTATION, this.reputation));

    if (this.reputation <= 0 || this.money < -100) {
      this.gameOver = true;
    }
  }

  reset(): void {
    this.money = INITIAL_MONEY;
    this.reputation = INITIAL_REPUTATION;
    this.customersServed = 0;
    this.orders = [];
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.customerSpawnTimer = 0;
    this.customerSpawnInterval = 5000;
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
