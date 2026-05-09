export interface Product {
  id: string;
  name: string;
  emoji: string;
  color: string;
  price: number;
}

export interface ShelfItem {
  productId: string;
  slotIndex: number;
}

export interface CustomerWant {
  productId: string;
  emoji: string;
  name: string;
}

export interface Customer {
  id: string;
  wants: CustomerWant[];
  patience: number;
  maxPatience: number;
  x: number;
  y: number;
  satisfied: boolean;
  leaving: boolean;
}

export interface ShopMasterState {
  score: number;
  coins: number;
  shelves: (string | null)[];
  customers: Customer[];
  timeRemaining: number;
  gameOver: boolean;
  gameStarted: boolean;
  customerSatisfaction: number;
  totalCustomers: number;
  satisfiedCustomers: number;
}

export const PRODUCTS: Product[] = [
  { id: 'apple', name: '苹果', emoji: '🍎', color: '#ff6347', price: 5 },
  { id: 'banana', name: '香蕉', emoji: '🍌', color: '#ffd700', price: 3 },
  { id: 'bread', name: '面包', emoji: '🍞', color: '#deb887', price: 8 },
  { id: 'milk', name: '牛奶', emoji: '🥛', color: '#f5f5f5', price: 10 },
  { id: 'cheese', name: '奶酪', emoji: '🧀', color: '#ffeb3b', price: 15 },
  { id: 'meat', name: '肉', emoji: '🥩', color: '#8b4513', price: 25 },
  { id: 'fish', name: '鱼', emoji: '🐟', color: '#87ceeb', price: 20 },
  { id: 'egg', name: '鸡蛋', emoji: '🥚', color: '#fffacd', price: 6 }
];

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const SHELF_COUNT = 8;
const CUSTOMER_SPAWN_INTERVAL = 4000;
const CUSTOMER_PATIENCE = 8000;
const GAME_DURATION = 90;
const COIN_REWARD = 20;
const SATISFACTION_BONUS = 10;
const LOST_CUSTOMER_PENALTY = 15;

export class ShopMasterEngine {
  private score: number;
  private coins: number;
  private shelves: (string | null)[];
  private customers: Customer[];
  private timeRemaining: number;
  private gameOver: boolean;
  private gameStarted: boolean;
  private lastCustomerSpawn: number;
  private customerSatisfaction: number;
  private totalCustomers: number;
  private satisfiedCustomers: number;
  private gameStartTime: number;

  constructor() {
    this.score = 0;
    this.coins = 0;
    this.shelves = new Array(SHELF_COUNT).fill(null);
    this.customers = [];
    this.timeRemaining = GAME_DURATION;
    this.gameOver = false;
    this.gameStarted = false;
    this.lastCustomerSpawn = 0;
    this.customerSatisfaction = 100;
    this.totalCustomers = 0;
    this.satisfiedCustomers = 0;
    this.gameStartTime = 0;
  }

  getState(): ShopMasterState {
    return {
      score: this.score,
      coins: this.coins,
      shelves: [...this.shelves],
      customers: this.customers.map(c => ({ ...c, wants: [...c.wants] })),
      timeRemaining: this.timeRemaining,
      gameOver: this.gameOver,
      gameStarted: this.gameStarted,
      customerSatisfaction: this.customerSatisfaction,
      totalCustomers: this.totalCustomers,
      satisfiedCustomers: this.satisfiedCustomers
    };
  }

  start(): void {
    this.gameStarted = true;
    this.gameStartTime = Date.now();
    this.lastCustomerSpawn = Date.now();
    this.spawnCustomer();
  }

  private spawnCustomer(): void {
    const wantCount = Math.min(3, Math.floor(Math.random() * 3) + 1);
    const wants: CustomerWant[] = [];
    const availableProducts = [...PRODUCTS];

    for (let i = 0; i < wantCount; i++) {
      if (availableProducts.length === 0) break;
      const index = Math.floor(Math.random() * availableProducts.length);
      const product = availableProducts.splice(index, 1)[0];
      wants.push({
        productId: product.id,
        emoji: product.emoji,
        name: product.name
      });
    }

    const customer: Customer = {
      id: `customer_${Date.now()}_${Math.random()}`,
      wants,
      patience: CUSTOMER_PATIENCE,
      maxPatience: CUSTOMER_PATIENCE,
      x: CANVAS_WIDTH + 50,
      y: 280,
      satisfied: false,
      leaving: false
    };

    this.customers.push(customer);
    this.totalCustomers++;
  }

  private getRandomProductsOnShelves(): string[] {
    return this.shelves.filter(id => id !== null) as string[];
  }

  private trySatisfyCustomer(customer: Customer): boolean {
    const availableProducts = this.getRandomProductsOnShelves();
    const wantedIds = customer.wants.map(w => w.productId);

    const canSatisfy = wantedIds.every(wantId => availableProducts.includes(wantId));

    if (canSatisfy) {
      wantedIds.forEach(wantId => {
        const slotIndex = this.shelves.findIndex(id => id === wantId);
        if (slotIndex !== -1) {
          this.shelves[slotIndex] = null;
        }
      });

      this.coins += COIN_REWARD + customer.wants.length * 5;
      this.score += COIN_REWARD + customer.wants.length * 5;
      this.satisfiedCustomers++;
      this.customerSatisfaction = Math.min(100, this.customerSatisfaction + SATISFACTION_BONUS);
      customer.satisfied = true;
      customer.leaving = true;
      return true;
    }

    return false;
  }

  handleClick(x: number, y: number): { type: 'shelf' | 'customer'; index?: number; customerId?: string } | null {
    if (!this.gameStarted || this.gameOver) return null;

    const shelfWidth = 70;
    const shelfHeight = 50;
    const shelfStartX = 80;
    const shelfStartY = 60;
    const shelfGap = 10;

    for (let i = 0; i < SHELF_COUNT; i++) {
      const shelfX = shelfStartX + (i % 4) * (shelfWidth + shelfGap);
      const shelfY = shelfStartY + Math.floor(i / 4) * (shelfHeight + shelfGap + 60);

      if (x >= shelfX && x <= shelfX + shelfWidth && y >= shelfY && y <= shelfY + shelfHeight) {
        return { type: 'shelf', index: i };
      }
    }

    for (const customer of this.customers) {
      if (customer.leaving || customer.satisfied) continue;
      const customerWidth = 80;
      const customerHeight = 120;
      if (x >= customer.x - customerWidth / 2 && x <= customer.x + customerWidth / 2 &&
          y >= customer.y - customerHeight / 2 && y <= customer.y + customerHeight / 2) {
        const success = this.trySatisfyCustomer(customer);
        return { type: 'customer', customerId: customer.id };
      }
    }

    return null;
  }

  selectProductForShelf(productId: string, shelfIndex: number): void {
    if (!this.gameStarted || this.gameOver) return;
    if (shelfIndex < 0 || shelfIndex >= SHELF_COUNT) return;

    this.shelves[shelfIndex] = productId;
  }

  removeFromShelf(shelfIndex: number): void {
    if (!this.gameStarted || this.gameOver) return;
    if (shelfIndex < 0 || shelfIndex >= SHELF_COUNT) return;

    this.shelves[shelfIndex] = null;
  }

  tick(): void {
    if (!this.gameStarted || this.gameOver) return;

    const now = Date.now();
    const elapsed = Math.floor((now - this.gameStartTime) / 1000);
    this.timeRemaining = Math.max(0, GAME_DURATION - elapsed);

    if (this.timeRemaining <= 0) {
      this.gameOver = true;
      return;
    }

    if (now - this.lastCustomerSpawn > CUSTOMER_SPAWN_INTERVAL && this.customers.length < 4) {
      this.spawnCustomer();
      this.lastCustomerSpawn = now;
    }

    for (const customer of this.customers) {
      if (customer.satisfied || customer.leaving) {
        customer.x -= 3;
        if (customer.x < -100) {
          customer.leaving = false;
        }
        continue;
      }

      customer.patience -= 16;

      if (customer.patience <= 0) {
        customer.leaving = true;
        this.customerSatisfaction = Math.max(0, this.customerSatisfaction - LOST_CUSTOMER_PENALTY);
        this.score = Math.max(0, this.score - LOST_CUSTOMER_PENALTY * 2);

        if (this.customerSatisfaction <= 0) {
          this.gameOver = true;
          return;
        }
      }
    }

    this.customers = this.customers.filter(c => c.x > -100 || c.leaving);
  }

  reset(): void {
    this.score = 0;
    this.coins = 0;
    this.shelves = new Array(SHELF_COUNT).fill(null);
    this.customers = [];
    this.timeRemaining = GAME_DURATION;
    this.gameOver = false;
    this.gameStarted = false;
    this.lastCustomerSpawn = 0;
    this.customerSatisfaction = 100;
    this.totalCustomers = 0;
    this.satisfiedCustomers = 0;
    this.gameStartTime = 0;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getShelfCount() {
    return SHELF_COUNT;
  }

  getProducts() {
    return PRODUCTS;
  }

  getShelfPosition(index: number) {
    const shelfWidth = 70;
    const shelfHeight = 50;
    const shelfStartX = 80;
    const shelfStartY = 60;
    const shelfGap = 10;

    return {
      x: shelfStartX + (index % 4) * (shelfWidth + shelfGap),
      y: shelfStartY + Math.floor(index / 4) * (shelfHeight + shelfGap + 60),
      width: shelfWidth,
      height: shelfHeight
    };
  }
}
