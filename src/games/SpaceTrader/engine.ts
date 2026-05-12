export type PlanetType = 'rocky' | 'gas' | 'ocean' | 'desert' | 'ice';
export type CargoType = 'ore' | 'fuel' | 'food' | 'tech' | 'luxury';

export interface Planet {
  id: string;
  name: string;
  type: PlanetType;
  x: number;
  y: number;
  prices: Record<CargoType, number>;
  supply: Record<CargoType, number>;
  color: string;
  emoji: string;
}

export interface Cargo {
  type: CargoType;
  quantity: number;
  buyPrice: number;
}

export interface SpaceTraderState {
  credits: number;
  fuel: number;
  maxFuel: number;
  cargo: Cargo[];
  maxCargo: number;
  currentPlanet: string;
  planets: Planet[];
  visitedPlanets: string[];
  day: number;
  gameOver: boolean;
}

const PLANETS_DATA: Record<string, Omit<Planet, 'x' | 'y'>> = {
  terra: {
    id: 'terra',
    name: '地球',
    type: 'ocean',
    emoji: '🌍',
    color: '#4a90d9',
    prices: { ore: 100, fuel: 50, food: 30, tech: 200, luxury: 150 },
    supply: { ore: 50, fuel: 100, food: 80, tech: 30, luxury: 40 }
  },
  mars: {
    id: 'mars',
    name: '火星',
    type: 'desert',
    emoji: '🔴',
    color: '#d35400',
    prices: { ore: 80, fuel: 60, food: 120, tech: 150, luxury: 180 },
    supply: { ore: 90, fuel: 70, food: 20, tech: 50, luxury: 30 }
  },
  europa: {
    id: 'europa',
    name: '欧罗巴',
    type: 'ice',
    emoji: '❄️',
    color: '#a8d8ff',
    prices: { ore: 120, fuel: 40, food: 100, tech: 180, luxury: 200 },
    supply: { ore: 60, fuel: 120, food: 30, tech: 40, luxury: 20 }
  },
  titan: {
    id: 'titan',
    name: '泰坦',
    type: 'gas',
    emoji: '🪐',
    color: '#f39c12',
    prices: { ore: 150, fuel: 30, food: 80, tech: 220, luxury: 170 },
    supply: { ore: 40, fuel: 110, food: 50, tech: 20, luxury: 60 }
  },
  kepler: {
    id: 'kepler',
    name: '开普勒',
    type: 'rocky',
    emoji: '🪨',
    color: '#7f8c8d',
    prices: { ore: 60, fuel: 90, food: 70, tech: 160, luxury: 220 },
    supply: { ore: 100, fuel: 50, food: 60, tech: 60, luxury: 10 }
  },
  neptune: {
    id: 'neptune',
    name: '海王星',
    type: 'ocean',
    emoji: '🌊',
    color: '#5dade2',
    prices: { ore: 140, fuel: 35, food: 110, tech: 190, luxury: 130 },
    supply: { ore: 30, fuel: 130, food: 40, tech: 30, luxury: 70 }
  }
};

const CARGO_CONFIG: Record<CargoType, { name: string; emoji: string; color: string }> = {
  ore: { name: '矿石', emoji: '⛏️', color: '#95a5a6' },
  fuel: { name: '燃料', emoji: '⛽', color: '#e74c3c' },
  food: { name: '食物', emoji: '🍖', color: '#27ae60' },
  tech: { name: '科技', emoji: '🔧', color: '#3498db' },
  luxury: { name: '奢侈品', emoji: '💎', color: '#9b59b6' }
};

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const FUEL_COST_PER_UNIT = 1;
const INITIAL_CREDITS = 500;
const INITIAL_FUEL = 100;
const MAX_FUEL = 100;
const MAX_CARGO = 20;

export class SpaceTraderEngine {
  private credits: number;
  private fuel: number;
  private maxFuel: number;
  private cargo: Cargo[];
  private maxCargo: number;
  private currentPlanet: string;
  private planets: Planet[];
  private visitedPlanets: string[];
  private day: number;
  private gameOver: boolean;

  constructor() {
    this.credits = INITIAL_CREDITS;
    this.fuel = INITIAL_FUEL;
    this.maxFuel = MAX_FUEL;
    this.cargo = [];
    this.maxCargo = MAX_CARGO;
    this.currentPlanet = 'terra';
    this.planets = [];
    this.visitedPlanets = ['terra'];
    this.day = 1;
    this.gameOver = false;
    this.init();
  }

  private init(): void {
    const positions = [
      { x: 350, y: 250 },
      { x: 550, y: 150 },
      { x: 150, y: 350 },
      { x: 600, y: 350 },
      { x: 100, y: 150 },
      { x: 400, y: 400 }
    ];

    const keys = Object.keys(PLANETS_DATA);
    this.planets = keys.map((key, i) => ({
      ...PLANETS_DATA[key],
      x: positions[i].x,
      y: positions[i].y
    }));
  }

  getState(): SpaceTraderState {
    return {
      credits: this.credits,
      fuel: this.fuel,
      maxFuel: this.maxFuel,
      cargo: [...this.cargo],
      maxCargo: this.maxCargo,
      currentPlanet: this.currentPlanet,
      planets: [...this.planets],
      visitedPlanets: [...this.visitedPlanets],
      day: this.day,
      gameOver: this.gameOver
    };
  }

  getCurrentPlanet(): Planet | undefined {
    return this.planets.find(p => p.id === this.currentPlanet);
  }

  getCargoInfo(type: CargoType): { name: string; emoji: string; color: string } {
    return CARGO_CONFIG[type];
  }

  getPlanetAtPosition(x: number, y: number): Planet | undefined {
    const clickRadius = 40;
    return this.planets.find(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) < clickRadius;
    });
  }

  travelTo(planetId: string): boolean {
    const targetPlanet = this.planets.find(p => p.id === planetId);
    const currentPlanetObj = this.getCurrentPlanet();
    
    if (!targetPlanet || !currentPlanetObj) return false;
    if (planetId === this.currentPlanet) return false;

    const dx = targetPlanet.x - currentPlanetObj.x;
    const dy = targetPlanet.y - currentPlanetObj.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const fuelCost = Math.floor(distance / 10) * FUEL_COST_PER_UNIT;

    if (this.fuel < fuelCost) return false;

    this.fuel -= fuelCost;
    this.currentPlanet = planetId;
    this.day++;

    if (!this.visitedPlanets.includes(planetId)) {
      this.visitedPlanets.push(planetId);
    }

    this.updatePrices(targetPlanet);

    if (this.fuel <= 0 || this.credits <= 0) {
      this.gameOver = true;
    }

    return true;
  }

  private updatePrices(planet: Planet): void {
    const variation = 0.2;
    planet.prices = Object.fromEntries(
      Object.entries(planet.prices).map(([key, base]) => {
        const variance = 1 + (Math.random() - 0.5) * variation;
        return [key, Math.floor(base * variance)];
      })
    ) as Record<CargoType, number>;
  }

  buyCargo(type: CargoType, quantity: number): boolean {
    const planet = this.getCurrentPlanet();
    if (!planet) return false;

    const currentCargoQty = this.cargo.reduce((sum, c) => sum + c.quantity, 0);
    if (currentCargoQty + quantity > this.maxCargo) return false;

    const price = planet.prices[type];
    const totalCost = price * quantity;
    if (this.credits < totalCost) return false;
    if (planet.supply[type] < quantity) return false;

    this.credits -= totalCost;
    planet.supply[type] -= quantity;

    const existing = this.cargo.find(c => c.type === type);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cargo.push({ type, quantity, buyPrice: price });
    }

    return true;
  }

  sellCargo(type: CargoType, quantity: number): boolean {
    const planet = this.getCurrentPlanet();
    if (!planet) return false;

    const cargoItem = this.cargo.find(c => c.type === type);
    if (!cargoItem || cargoItem.quantity < quantity) return false;

    const price = planet.prices[type];
    const revenue = price * quantity;

    this.credits += revenue;
    cargoItem.quantity -= quantity;
    planet.supply[type] += quantity;

    if (cargoItem.quantity === 0) {
      this.cargo = this.cargo.filter(c => c.type !== type);
    }

    return true;
  }

  refuel(amount: number): boolean {
    const planet = this.getCurrentPlanet();
    if (!planet) return false;

    const fuelPrice = planet.prices.fuel;
    const maxRefuel = this.maxFuel - this.fuel;
    const actualRefuel = Math.min(amount, maxRefuel);
    const cost = fuelPrice * actualRefuel;

    if (this.credits < cost) {
      const affordable = Math.floor(this.credits / fuelPrice);
      if (affordable <= 0) return false;
      this.credits -= affordable * fuelPrice;
      this.fuel += affordable;
    } else {
      this.credits -= cost;
      this.fuel += actualRefuel;
    }

    return true;
  }

  getProfit(type: CargoType): number {
    const cargo = this.cargo.find(c => c.type === type);
    const planet = this.getCurrentPlanet();
    if (!cargo || !planet) return 0;
    return planet.prices[type] - cargo.buyPrice;
  }

  tick(): void {
  }

  reset(): void {
    this.credits = INITIAL_CREDITS;
    this.fuel = INITIAL_FUEL;
    this.cargo = [];
    this.currentPlanet = 'terra';
    this.visitedPlanets = ['terra'];
    this.day = 1;
    this.gameOver = false;
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
