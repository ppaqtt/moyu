export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface OrderItem {
  id: string;
  ingredients: string[];
  completed: boolean;
  timeLimit: number;
  startTime: number;
  score: number;
}

export interface CookingState {
  panX: number;
  panY: number;
  ingredients: Ingredient[];
  currentIngredients: string[];
  isCooking: boolean;
  cookProgress: number;
  cookStartTime: number;
}

export interface Customer {
  id: string;
  order: OrderItem;
  patience: number;
  maxPatience: number;
  x: number;
  satisfied: boolean;
}

export interface CookingMasterState {
  score: number;
  orders: OrderItem[];
  cooking: CookingState | null;
  customers: Customer[];
  timeRemaining: number;
  gameOver: boolean;
  gameStarted: boolean;
}

export const INGREDIENTS: Ingredient[] = [
  { id: 'tomato', name: '番茄', emoji: '🍅', color: '#ff6347' },
  { id: 'lettuce', name: '生菜', emoji: '🥬', color: '#90ee90' },
  { id: 'cheese', name: '奶酪', emoji: '🧀', color: '#ffd700' },
  { id: 'meat', name: '肉', emoji: '🥩', color: '#8b4513' },
  { id: 'egg', name: '鸡蛋', emoji: '🥚', color: '#fffacd' },
  { id: 'bread', name: '面包', emoji: '🍞', color: '#deb887' },
  { id: 'fish', name: '鱼', emoji: '🐟', color: '#87ceeb' },
  { id: 'rice', name: '米饭', emoji: '🍚', color: '#fafafa' }
];

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const STOVE_X = 350;
const STOVE_Y = 280;
const PAN_RADIUS = 40;
const ORDER_TIME_LIMIT = 15000;
const COOK_TIME = 2500;
const ORDER_SCORE = 100;
const TIME_BONUS_MULTIPLIER = 2;
const MAX_ORDERS = 3;
const CUSTOMER_SPAWN_INTERVAL = 8000;
const PATIENCE_DECAY_RATE = 0.0008;

const RECIPES = [
  ['bread', 'lettuce', 'tomato'],
  ['bread', 'meat', 'cheese'],
  ['rice', 'egg', 'fish'],
  ['bread', 'egg', 'cheese'],
  ['tomato', 'lettuce', 'cheese'],
  ['meat', 'rice', 'egg'],
  ['fish', 'rice', 'tomato'],
  ['bread', 'fish', 'cheese']
];

export class CookingMasterEngine {
  private score: number;
  private orders: OrderItem[];
  private cooking: CookingState | null;
  private customers: Customer[];
  private timeRemaining: number;
  private gameOver: boolean;
  private gameStarted: boolean;
  private lastOrderSpawn: number;
  private gameDuration: number;

  constructor() {
    this.score = 0;
    this.orders = [];
    this.cooking = null;
    this.customers = [];
    this.timeRemaining = 90;
    this.gameOver = false;
    this.gameStarted = false;
    this.lastOrderSpawn = 0;
    this.gameDuration = 90000;
  }

  getState(): CookingMasterState {
    return {
      score: this.score,
      orders: this.orders.map(o => ({ ...o })),
      cooking: this.cooking ? { ...this.cooking, ingredients: [...this.cooking.ingredients] } : null,
      customers: this.customers.map(c => ({
        ...c,
        order: { ...c.order }
      })),
      timeRemaining: this.timeRemaining,
      gameOver: this.gameOver,
      gameStarted: this.gameStarted
    };
  }

  start(): void {
    this.gameStarted = true;
    this.lastOrderSpawn = Date.now();
    this.spawnOrder();
  }

  private spawnOrder(): void {
    if (this.orders.length >= MAX_ORDERS) return;

    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const order: OrderItem = {
      id: `order_${Date.now()}_${Math.random()}`,
      ingredients: [...recipe],
      completed: false,
      timeLimit: ORDER_TIME_LIMIT,
      startTime: Date.now(),
      score: ORDER_SCORE
    };

    this.orders.push(order);
  }

  selectIngredient(ingredientId: string): void {
    if (!this.gameStarted || this.gameOver) return;

    if (!this.cooking) {
      this.cooking = {
        panX: STOVE_X,
        panY: STOVE_Y,
        ingredients: INGREDIENTS,
        currentIngredients: [],
        isCooking: false,
        cookProgress: 0,
        cookStartTime: 0
      };
    }

    if (this.cooking.currentIngredients.length < 3) {
      this.cooking.currentIngredients.push(ingredientId);
    }
  }

  startCooking(): void {
    if (!this.cooking || this.cooking.isCooking || this.cooking.currentIngredients.length === 0) return;
    this.cooking.isCooking = true;
    this.cooking.cookStartTime = Date.now();
  }

  completeCooking(): { success: boolean; order: OrderItem | null } {
    if (!this.cooking || !this.cooking.isCooking) {
      return { success: false, order: null };
    }

    const cookedIngredients = [...this.cooking.currentIngredients].sort();

    for (let i = 0; i < this.orders.length; i++) {
      const order = this.orders[i];
      if (order.completed) continue;

      const orderIngredients = [...order.ingredients].sort();
      const match = cookedIngredients.length === orderIngredients.length &&
        cookedIngredients.every((ing, idx) => ing === orderIngredients[idx]);

      if (match) {
        const elapsed = Date.now() - order.startTime;
        const timeBonus = Math.max(0, ORDER_TIME_LIMIT - elapsed) / ORDER_TIME_LIMIT;
        const pointsEarned = Math.floor(order.score + order.score * timeBonus * TIME_BONUS_MULTIPLIER);

        this.score += pointsEarned;
        order.completed = true;

        this.cooking = null;
        this.orders = this.orders.filter(o => o.id !== order.id);

        return { success: true, order };
      }
    }

    this.cooking = null;
    return { success: false, order: null };
  }

  clearPan(): void {
    this.cooking = null;
  }

  tick(): void {
    if (!this.gameStarted || this.gameOver) return;

    const now = Date.now();
    this.timeRemaining = Math.max(0, this.gameDuration - (now - this.lastOrderSpawn) % this.gameDuration - (this.getElapsedTime() % this.gameDuration));

    if (now - this.lastOrderSpawn > CUSTOMER_SPAWN_INTERVAL) {
      this.spawnOrder();
      this.lastOrderSpawn = now;
    }

    for (const order of this.orders) {
      if (!order.completed) {
        const elapsed = now - order.startTime;
        if (elapsed > order.timeLimit) {
          this.gameOver = true;
          return;
        }
      }
    }

    if (this.cooking && this.cooking.isCooking) {
      const elapsed = now - this.cooking.cookStartTime;
      this.cooking.cookProgress = Math.min(1, elapsed / COOK_TIME);

      if (this.cooking.cookProgress >= 1) {
        this.completeCooking();
      }
    }
  }

  private getElapsedTime(): number {
    return this.gameDuration - this.timeRemaining;
  }

  reset(): void {
    this.score = 0;
    this.orders = [];
    this.cooking = null;
    this.customers = [];
    this.timeRemaining = 90;
    this.gameOver = false;
    this.gameStarted = false;
    this.lastOrderSpawn = 0;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getStovePosition() {
    return { x: STOVE_X, y: STOVE_Y };
  }

  getPanRadius() {
    return PAN_RADIUS;
  }

  getIngredients() {
    return INGREDIENTS;
  }
}
