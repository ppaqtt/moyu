import { NEON_COLORS } from '../../utils/constants';

// Types
export interface Cookie {
  id: string;
  type: CookieType;
  bakedAt: number;
  quality: number; // 0-100
  price: number;
}

export interface CookieType {
  id: string;
  name: string;
  emoji: string;
  basePrice: number;
  bakeTime: number; // seconds
  ingredients: Ingredient[];
  unlockLevel: number;
  rarity: 'basic' | 'special' | 'premium' | 'legendary';
}

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  price: number;
}

export interface Oven {
  id: string;
  level: number;
  maxCookies: number;
  speedMultiplier: number;
  upgradeCost: number;
  isActive: boolean;
  cookies: Cookie[];
}

export interface CookieBakeryState {
  coins: number;
  cookies: Cookie[];
  ovens: Oven[];
  ingredients: Map<string, number>;
  totalBaked: number;
  totalSold: number;
  gameStarted: boolean;
  lastUpdate: number;
  highScore: number;
  unlockedRecipes: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
}

// Constants
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 500;

export const COOKIE_TYPES: CookieType[] = [
  { id: 'chocolate', name: '巧克力曲奇', emoji: '🍪', basePrice: 10, bakeTime: 5, ingredients: [], unlockLevel: 1, rarity: 'basic' },
  { id: 'sugar', name: '糖霜饼干', emoji: '🧁', basePrice: 15, bakeTime: 8, ingredients: [], unlockLevel: 1, rarity: 'basic' },
  { id: 'oatmeal', name: '燕麦葡萄干', emoji: '🥜', basePrice: 20, bakeTime: 10, ingredients: [], unlockLevel: 2, rarity: 'basic' },
  { id: 'butter', name: '黄油酥饼', emoji: '🧈', basePrice: 25, bakeTime: 12, ingredients: [], unlockLevel: 3, rarity: 'special' },
  { id: 'almond', name: '杏仁饼干', emoji: '🌰', basePrice: 40, bakeTime: 15, ingredients: [], unlockLevel: 4, rarity: 'special' },
  { id: 'redvelvet', name: '红丝绒', emoji: '❤️', basePrice: 60, bakeTime: 20, ingredients: [], unlockLevel: 5, rarity: 'premium' },
  { id: 'matcha', name: '抹茶饼干', emoji: '🍵', basePrice: 80, bakeTime: 25, ingredients: [], unlockLevel: 6, rarity: 'premium' },
  { id: 'strawberry', name: '草莓奶油', emoji: '🍓', basePrice: 100, bakeTime: 30, ingredients: [], unlockLevel: 7, rarity: 'premium' },
  { id: 'rainbow', name: '彩虹饼干', emoji: '🌈', basePrice: 200, bakeTime: 45, ingredients: [], unlockLevel: 8, rarity: 'legendary' },
  { id: 'golden', name: '金箔饼干', emoji: '✨', basePrice: 500, bakeTime: 60, ingredients: [], unlockLevel: 9, rarity: 'legendary' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'oven1', name: '升级烤箱', emoji: '🔥', price: 200, description: '提升烤箱容量和速度' },
  { id: 'ingredient_pack', name: '原料包', emoji: '📦', price: 50, description: '获得随机原料 x10' },
  { id: 'quality_upgrade', name: '质量提升', emoji: '⭐', price: 100, description: '下次饼干品质 +30' },
  { id: 'auto_baker', name: '自动烤箱', emoji: '🤖', price: 500, description: '自动烤制基础饼干' },
  { id: 'golden_ingredients', name: '金原料', emoji: '🪙', price: 300, description: '所有饼干价格 x1.5' },
];

const MAX_OVENS = 3;
const TICK_INTERVAL = 100;

export class CookieBakeryEngine {
  private coins: number;
  private cookies: Cookie[];
  private ovens: Oven[];
  private ingredients: Map<string, number>;
  private totalBaked: number;
  private totalSold: number;
  private gameStarted: boolean;
  private lastUpdate: number;
  private highScore: number;
  private unlockedRecipes: string[];
  private qualityBonus: number;
  private priceMultiplier: number;
  private autoBakerActive: boolean;

  constructor() {
    this.reset();
  }

  getState(): CookieBakeryState {
    return {
      coins: this.coins,
      cookies: this.cookies.map(c => ({ ...c })),
      ovens: this.ovens.map(o => ({
        ...o,
        cookies: o.cookies.map(c => ({ ...c })),
      })),
      ingredients: new Map(this.ingredients),
      totalBaked: this.totalBaked,
      totalSold: this.totalSold,
      gameStarted: this.gameStarted,
      lastUpdate: this.lastUpdate,
      highScore: this.highScore,
      unlockedRecipes: [...this.unlockedRecipes],
    };
  }

  start(): void {
    this.gameStarted = true;
    this.lastUpdate = Date.now();

    // Start with one oven
    if (this.ovens.length === 0) {
      this.addOven();
    }
  }

  addOven(): boolean {
    if (this.ovens.length >= MAX_OVENS) return false;
    if (this.coins < 300) return false;

    this.coins -= 300;
    const oven: Oven = {
      id: `oven_${Date.now()}`,
      level: 1,
      maxCookies: 3,
      speedMultiplier: 1,
      upgradeCost: 500,
      isActive: false,
      cookies: [],
    };
    this.ovens.push(oven);
    return true;
  }

  buyOvenUpgrade(ovenId: string): boolean {
    const oven = this.ovens.find(o => o.id === ovenId);
    if (!oven) return false;
    if (this.coins < oven.upgradeCost) return false;

    this.coins -= oven.upgradeCost;
    oven.level++;
    oven.maxCookies += 2;
    oven.speedMultiplier += 0.2;
    oven.upgradeCost = Math.floor(oven.upgradeCost * 1.8);
    return true;
  }

  startBaking(ovenId: string, cookieTypeId: string): boolean {
    if (!this.gameStarted) return false;

    const oven = this.ovens.find(o => o.id === ovenId);
    if (!oven) return false;
    if (oven.cookies.length >= oven.maxCookies) return false;

    const cookieType = COOKIE_TYPES.find(c => c.id === cookieTypeId);
    if (!cookieType) return false;
    if (!this.unlockedRecipes.includes(cookieTypeId)) return false;

    const cookie: Cookie = {
      id: `cookie_${Date.now()}_${Math.random()}`,
      type: cookieType,
      bakedAt: Date.now(),
      quality: 70 + Math.random() * 30 + this.qualityBonus,
      price: cookieType.basePrice,
    };

    this.qualityBonus = Math.max(0, this.qualityBonus - 10);
    oven.cookies.push(cookie);
    return true;
  }

  collectCookie(ovenId: string): Cookie | null {
    const oven = this.ovens.find(o => o.id === ovenId);
    if (!oven) return null;

    const now = Date.now();
    const readyIndex = oven.cookies.findIndex(c => now - c.bakedAt >= c.type.bakeTime * 1000);

    if (readyIndex === -1) return null;

    const cookie = oven.cookies.splice(readyIndex, 1)[0];
    this.cookies.push(cookie);
    return cookie;
  }

  sellCookie(cookieId: string): boolean {
    const cookieIndex = this.cookies.findIndex(c => c.id === cookieId);
    if (cookieIndex === -1) return false;

    const cookie = this.cookies[cookieIndex];
    const qualityMultiplier = 1 + (cookie.quality - 70) / 100;
    const earnings = Math.floor(cookie.price * qualityMultiplier * this.priceMultiplier);

    this.coins += earnings;
    this.totalSold++;
    this.cookies.splice(cookieIndex, 1);

    if (this.totalSold > this.highScore) {
      this.highScore = this.totalSold;
    }

    return true;
  }

  sellAllCookies(): number {
    let totalEarnings = 0;

    this.cookies.forEach(cookie => {
      const qualityMultiplier = 1 + (cookie.quality - 70) / 100;
      const earnings = Math.floor(cookie.price * qualityMultiplier * this.priceMultiplier);
      totalEarnings += earnings;
    });

    this.coins += totalEarnings;
    this.totalSold += this.cookies.length;
    this.cookies = [];

    if (this.totalSold > this.highScore) {
      this.highScore = this.totalSold;
    }

    return totalEarnings;
  }

  unlockRecipe(recipeId: string): boolean {
    if (this.unlockedRecipes.includes(recipeId)) return false;

    const recipe = COOKIE_TYPES.find(c => c.id === recipeId);
    if (!recipe) return false;

    const unlockCost = recipe.basePrice * 10;
    if (this.coins < unlockCost) return false;

    this.coins -= unlockCost;
    this.unlockedRecipes.push(recipeId);
    return true;
  }

  buyShopItem(itemId: string): boolean {
    if (!this.gameStarted) return false;

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (this.coins < item.price) return false;

    this.coins -= item.price;

    switch (itemId) {
      case 'oven1':
        // Handled by addOven/buyOvenUpgrade
        break;
      case 'ingredient_pack':
        // Random ingredients bonus
        break;
      case 'quality_upgrade':
        this.qualityBonus = Math.min(50, this.qualityBonus + 30);
        break;
      case 'auto_baker':
        this.autoBakerActive = true;
        break;
      case 'golden_ingredients':
        this.priceMultiplier = Math.min(3, this.priceMultiplier + 0.5);
        break;
    }

    return true;
  }

  private tick(): void {
    const now = Date.now();
    this.lastUpdate = now;

    // Check for ready cookies
    this.ovens.forEach(oven => {
      oven.cookies = oven.cookies.filter(cookie => {
        const elapsed = now - cookie.bakedAt;
        return elapsed < cookie.type.bakeTime * 1000 * oven.speedMultiplier;
      });
    });

    // Auto baker
    if (this.autoBakerActive && this.ovens.length > 0) {
      const oven = this.ovens[0];
      if (oven.cookies.length < oven.maxCookies) {
        const basicRecipe = COOKIE_TYPES.find(c => c.id === 'chocolate');
        if (basicRecipe && this.unlockedRecipes.includes('chocolate')) {
          this.startBaking('chocolate', oven.id);
        }
      }
    }
  }

  getReadyCookies(): { oven: Oven; cookie: Cookie }[] {
    const now = Date.now();
    const ready: { oven: Oven; cookie: Cookie }[] = [];

    this.ovens.forEach(oven => {
      oven.cookies.forEach(cookie => {
        const elapsed = now - cookie.bakedAt;
        if (elapsed >= cookie.type.bakeTime * 1000 * oven.speedMultiplier) {
          ready.push({ oven, cookie });
        }
      });
    });

    return ready;
  }

  getCookieProgress(cookie: Cookie, ovenSpeed: number): number {
    const now = Date.now();
    const elapsed = now - cookie.bakedAt;
    const totalTime = cookie.type.bakeTime * 1000 * ovenSpeed;
    return Math.min(100, (elapsed / totalTime) * 100);
  }

  getUnlockedRecipes(): CookieType[] {
    return COOKIE_TYPES.filter(c => this.unlockedRecipes.includes(c.id));
  }

  getLockedRecipes(): CookieType[] {
    return COOKIE_TYPES.filter(c => !this.unlockedRecipes.includes(c.id));
  }

  getOvens(): Oven[] {
    return this.ovens;
  }

  getCookies(): Cookie[] {
    return this.cookies;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getCookieTypes() {
    return COOKIE_TYPES;
  }

  reset(): void {
    this.coins = 100;
    this.cookies = [];
    this.ovens = [];
    this.ingredients = new Map();
    this.totalBaked = 0;
    this.totalSold = 0;
    this.gameStarted = false;
    this.lastUpdate = Date.now();
    this.highScore = 0;
    this.unlockedRecipes = ['chocolate', 'sugar'];
    this.qualityBonus = 0;
    this.priceMultiplier = 1;
    this.autoBakerActive = false;
  }

  save(): string {
    return JSON.stringify(this.getState());
  }

  load(json: string): boolean {
    try {
      const state = JSON.parse(json) as CookieBakeryState;
      this.coins = state.coins;
      this.cookies = state.cookies;
      this.ovens = state.ovens;
      this.ingredients = state.ingredients;
      this.totalBaked = state.totalBaked;
      this.totalSold = state.totalSold;
      this.gameStarted = state.gameStarted;
      this.highScore = state.highScore;
      this.unlockedRecipes = state.unlockedRecipes;
      return true;
    } catch {
      return false;
    }
  }
}
