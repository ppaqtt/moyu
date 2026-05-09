export type OilWellStatus = 'empty' | 'drilling' | 'producing' | 'depleted';
export type OilFieldType = 'small' | 'medium' | 'large' | 'giant';

export interface OilWell {
  id: number;
  x: number;
  y: number;
  status: OilWellStatus;
  depth: number;
  maxDepth: number;
  productionRate: number;
  drillProgress: number;
  oilReserves: number;
}

export interface OilField {
  id: number;
  type: OilFieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  wells: OilWell[];
  color: string;
  discovered: boolean;
}

export interface OilTycoonState {
  money: number;
  oil: number;
  totalOilProduced: number;
  revenue: number;
  fields: OilField[];
  drillers: number;
  gameOver: boolean;
}

export const FIELD_CONFIG: Record<OilFieldType, { 
  name: string; 
  emoji: string;
  width: number;
  height: number;
  wellCount: number;
  baseDepth: number;
  baseProduction: number;
  color: string;
  unlockCost: number;
}> = {
  small: {
    name: '小型油田',
    emoji: '🛢️',
    width: 150,
    height: 150,
    wellCount: 2,
    baseDepth: 50,
    baseProduction: 5,
    color: '#8b4513',
    unlockCost: 0
  },
  medium: {
    name: '中型油田',
    emoji: '⛽',
    width: 180,
    height: 180,
    wellCount: 3,
    baseDepth: 80,
    baseProduction: 8,
    color: '#654321',
    unlockCost: 2000
  },
  large: {
    name: '大型油田',
    emoji: '🏭',
    width: 200,
    height: 200,
    wellCount: 4,
    baseDepth: 120,
    baseProduction: 12,
    color: '#3d2b1f',
    unlockCost: 5000
  },
  giant: {
    name: '巨型油田',
    emoji: '🌍',
    width: 220,
    height: 220,
    wellCount: 6,
    baseDepth: 150,
    baseProduction: 18,
    color: '#1a1a1a',
    unlockCost: 15000
  }
};

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const INITIAL_MONEY = 1000;
const OIL_PRICE = 10;
const DRILL_COST = 50;
const DRILL_SPEED = 0.02;

export class OilTycoonEngine {
  private money: number;
  private oil: number;
  private totalOilProduced: number;
  private revenue: number;
  private fields: OilField[];
  private drillers: number;
  private gameOver: boolean;
  private lastUpdate: number;
  private sellPrice: number;

  constructor() {
    this.money = INITIAL_MONEY;
    this.oil = 0;
    this.totalOilProduced = 0;
    this.revenue = 0;
    this.fields = [];
    this.drillers = 2;
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.sellPrice = OIL_PRICE;
    this.init();
  }

  private init(): void {
    this.fields = [];
    
    const smallField: OilField = {
      id: 0,
      type: 'small',
      x: 100,
      y: 80,
      width: 150,
      height: 150,
      wells: [],
      color: FIELD_CONFIG.small.color,
      discovered: true
    };

    const positions = [
      { x: 20, y: 20 },
      { x: 90, y: 80 }
    ];

    for (let i = 0; i < FIELD_CONFIG.small.wellCount; i++) {
      smallField.wells.push({
        id: i,
        x: positions[i].x,
        y: positions[i].y,
        status: 'empty',
        depth: 0,
        maxDepth: FIELD_CONFIG.small.baseDepth,
        productionRate: 0,
        drillProgress: 0,
        oilReserves: 0
      });
    }

    this.fields.push(smallField);
  }

  getState(): OilTycoonState {
    return {
      money: this.money,
      oil: this.oil,
      totalOilProduced: this.totalOilProduced,
      revenue: this.revenue,
      fields: JSON.parse(JSON.stringify(this.fields)),
      drillers: this.drillers,
      gameOver: this.gameOver
    };
  }

  getFieldConfig(type: OilFieldType) {
    return FIELD_CONFIG[type];
  }

  unlockField(type: OilFieldType): boolean {
    if (this.fields.some(f => f.type === type)) return false;
    
    const config = FIELD_CONFIG[type];
    if (this.money < config.unlockCost) return false;

    this.money -= config.unlockCost;

    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < config.wellCount; i++) {
      positions.push({
        x: Math.random() * (config.width - 40) + 10,
        y: Math.random() * (config.height - 40) + 10
      });
    }

    const field: OilField = {
      id: this.fields.length,
      type,
      x: 350 + Math.random() * 200,
      y: 50 + Math.random() * 300,
      width: config.width,
      height: config.height,
      wells: positions.map((pos, i) => ({
        id: i,
        x: pos.x,
        y: pos.y,
        status: 'empty',
        depth: 0,
        maxDepth: config.baseDepth + Math.random() * 30,
        productionRate: 0,
        drillProgress: 0,
        oilReserves: Math.floor(config.baseProduction * (20 + Math.random() * 30))
      })),
      color: config.color,
      discovered: true
    };

    this.fields.push(field);
    return true;
  }

  startDrilling(fieldId: number, wellId: number): boolean {
    const field = this.fields.find(f => f.id === fieldId);
    if (!field) return false;

    const well = field.wells.find(w => w.id === wellId);
    if (!well || well.status !== 'empty') return false;
    if (this.money < DRILL_COST) return false;

    this.money -= DRILL_COST;
    well.status = 'drilling';
    well.drillProgress = 0;

    return true;
  }

  upgradeDriller(): boolean {
    if (this.money < 500) return false;
    this.money -= 500;
    this.drillers++;
    return true;
  }

  sellOil(): boolean {
    if (this.oil <= 0) return false;

    const revenue = Math.floor(this.oil) * this.sellPrice;
    this.money += revenue;
    this.revenue += revenue;
    this.oil = 0;

    this.sellPrice = OIL_PRICE + Math.random() * 5;

    return true;
  }

  tick(): void {
    if (this.gameOver) return;

    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    for (const field of this.fields) {
      for (const well of field.wells) {
        if (well.status === 'drilling') {
          const drillAmount = DRILL_SPEED * this.drillers * deltaTime;
          well.drillProgress += drillAmount;
          well.depth = well.maxDepth * Math.min(well.drillProgress, 1);

          if (well.drillProgress >= 1) {
            well.status = 'producing';
            well.productionRate = field.type === 'small' ? 0.02 : 
              field.type === 'medium' ? 0.03 : 
              field.type === 'large' ? 0.04 : 0.06;
          }
        }

        if (well.status === 'producing') {
          const production = well.productionRate * well.oilReserves * (deltaTime / 1000);
          this.oil += production;
          this.totalOilProduced += production;
          well.oilReserves -= production;

          if (well.oilReserves <= 0) {
            well.status = 'depleted';
            well.oilReserves = 0;
          }
        }
      }
    }

    if (this.money < -200) {
      this.gameOver = true;
    }
  }

  reset(): void {
    this.money = INITIAL_MONEY;
    this.oil = 0;
    this.totalOilProduced = 0;
    this.revenue = 0;
    this.drillers = 2;
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.sellPrice = OIL_PRICE;
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
