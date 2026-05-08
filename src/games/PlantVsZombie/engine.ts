export interface Position {
  x: number;
  y: number;
}

export type PlantType = 'pea' | 'sunflower' | 'wallnut' | 'snowpea';
export type ZombieType = 'normal' | 'cone' | 'bucket';

export interface Plant {
  id: number;
  x: number;
  y: number;
  type: PlantType;
  health: number;
  lastAction: number;
}

export interface Projectile {
  x: number;
  y: number;
  damage: number;
  isSlow: boolean;
}

export interface Zombie {
  id: number;
  x: number;
  y: number;
  type: ZombieType;
  health: number;
  speed: number;
  isSlow: boolean;
  slowEndTime: number;
  lastAction: number;
}

export interface Lawnmower {
  x: number;
  y: number;
  isActive: boolean;
  used: boolean;
}

export interface GamePvZState {
  plants: Plant[];
  zombies: Zombie[];
  projectiles: Projectile[];
  lawnmowers: Lawnmower[];
  sun: number;
  score: number;
  wave: number;
  isGameOver: boolean;
  isPaused: boolean;
}

const GRID_COLS = 9;
const GRID_ROWS = 5;
const CELL_WIDTH = 80;
const CELL_HEIGHT = 100;
const CANVAS_WIDTH = GRID_COLS * CELL_WIDTH;
const CANVAS_HEIGHT = GRID_ROWS * CELL_HEIGHT;

const PLANT_CONFIG: Record<PlantType, { cost: number; cooldown: number; health: number; damage?: number; sunProduction?: number; slow?: boolean }> = {
  pea: { cost: 100, cooldown: 5000, health: 100, damage: 20 },
  sunflower: { cost: 50, cooldown: 7500, health: 100, sunProduction: 50 },
  wallnut: { cost: 50, cooldown: 20000, health: 400 },
  snowpea: { cost: 175, cooldown: 5000, health: 100, damage: 20, slow: true }
};

const ZOMBIE_CONFIG = {
  normal: { health: 100, speed: 0.3 },
  cone: { health: 200, speed: 0.25 },
  bucket: { health: 400, speed: 0.2 }
};

export class GamePvZEngine {
  private plants: Plant[];
  private zombies: Zombie[];
  private projectiles: Projectile[];
  private lawnmowers: Lawnmower[];
  private sun: number;
  private score: number;
  private wave: number;
  private isGameOver: boolean;
  private isPaused: boolean;
  private lastSunProduction: number;
  private lastZombieSpawn: number;
  private zombieSpawnInterval: number;
  private selectedPlant: PlantType | null;
  private plantIdCounter: number;
  private zombieIdCounter: number;
  private lastUpdate: number;

  constructor() {
    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.lawnmowers = [];
    this.sun = 150;
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.lastSunProduction = Date.now();
    this.lastZombieSpawn = Date.now();
    this.zombieSpawnInterval = 10000;
    this.selectedPlant = null;
    this.plantIdCounter = 0;
    this.zombieIdCounter = 0;
    this.lastUpdate = Date.now();
    this.init();
  }

  init(): void {
    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.lawnmowers = Array(GRID_ROWS).fill(null).map((_, i) => ({
      x: 0,
      y: i * CELL_HEIGHT,
      isActive: false,
      used: false
    }));
    this.sun = 150;
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.lastSunProduction = Date.now();
    this.lastZombieSpawn = Date.now();
    this.zombieSpawnInterval = 10000;
    this.selectedPlant = 'pea';
  }

  getState(): GamePvZState {
    return {
      plants: this.plants.map(p => ({ ...p })),
      zombies: this.zombies.map(z => ({ ...z })),
      projectiles: this.projectiles.map(p => ({ ...p })),
      lawnmowers: this.lawnmowers.map(l => ({ ...l })),
      sun: this.sun,
      score: this.score,
      wave: this.wave,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused
    };
  }

  selectPlant(type: PlantType): void {
    this.selectedPlant = type;
  }

  canPlacePlant(col: number, row: number): boolean {
    if (this.sun < PLANT_CONFIG[this.selectedPlant!].cost) return false;
    if (this.plants.some(p => p.x === col && p.y === row)) return false;
    return true;
  }

  placePlant(col: number, row: number): boolean {
    if (!this.selectedPlant || !this.canPlacePlant(col, row)) return false;

    const config = PLANT_CONFIG[this.selectedPlant];
    this.sun -= config.cost;

    this.plants.push({
      id: ++this.plantIdCounter,
      x: col,
      y: row,
      type: this.selectedPlant,
      health: config.health,
      lastAction: Date.now()
    });

    return true;
  }

  collectSun(x: number, y: number): boolean {
    const sunY = y * CELL_HEIGHT + 50;
    if (Math.abs(x - 200) < 50 && Math.abs(y - sunY) < 50) {
      this.sun += 25;
      return true;
    }
    return false;
  }

  tick(): void {
    if (this.isGameOver || this.isPaused) return;

    const now = Date.now();

    for (const plant of this.plants) {
      const config = PLANT_CONFIG[plant.type];

      if (plant.type === 'sunflower') {
        if (now - plant.lastAction >= 20000) {
          this.sun += config.sunProduction;
          plant.lastAction = now;
        }
      }

      if ((plant.type === 'pea' || plant.type === 'snowpea') && now - plant.lastAction >= 1500) {
        const hasZombieInRow = this.zombies.some(z => z.y === plant.y && z.x > plant.x);
        if (hasZombieInRow) {
          this.projectiles.push({
            x: plant.x * CELL_WIDTH + CELL_WIDTH,
            y: plant.y * CELL_HEIGHT + CELL_HEIGHT / 2,
            damage: config.damage,
            isSlow: plant.type === 'snowpea'
          });
          plant.lastAction = now;
        }
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += 5;

      if (proj.x > CANVAS_WIDTH) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (const zombie of this.zombies) {
        const zombieCenterX = zombie.x + 30;
        const zombieCenterY = zombie.y * CELL_HEIGHT + CELL_HEIGHT / 2;

        if (Math.abs(proj.x - zombieCenterX) < 30 && Math.abs(proj.y - zombieCenterY) < 40) {
          zombie.health -= proj.damage;
          if (proj.isSlow) {
            zombie.isSlow = true;
            zombie.slowEndTime = now + 3000;
          }
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];

      if (zombie.isSlow && now > zombie.slowEndTime) {
        zombie.isSlow = false;
      }

      const speed = zombie.isSlow ? zombie.speed * 0.5 : zombie.speed;
      zombie.x -= speed;

      const blockingPlant = this.plants.find(p => 
        Math.abs(p.x * CELL_WIDTH + CELL_WIDTH / 2 - zombie.x - 30) < 40 &&
        p.y === zombie.y
      );

      if (blockingPlant) {
        if (now - zombie.lastAction >= 1000) {
          blockingPlant.health -= 10;
          zombie.lastAction = now;

          if (blockingPlant.health <= 0) {
            this.plants = this.plants.filter(p => p.id !== blockingPlant.id);
          }
        }
      }

      if (zombie.health <= 0) {
        this.score += 10;
        this.zombies.splice(i, 1);
        continue;
      }

      if (zombie.x < -60) {
        const mower = this.lawnmowers.find(m => m.y === zombie.y * CELL_HEIGHT && !m.used);
        if (mower) {
          mower.isActive = true;
          mower.used = true;
        } else {
          this.isGameOver = true;
        }
      }
    }

    for (const mower of this.lawnmowers) {
      if (mower.isActive) {
        mower.x += 3;

        for (let i = this.zombies.length - 1; i >= 0; i--) {
          const zombie = this.zombies[i];
          if (zombie.y * CELL_HEIGHT === mower.y && Math.abs(zombie.x - mower.x) < 40) {
            this.zombies.splice(i, 1);
            this.score += 5;
          }
        }

        if (mower.x > CANVAS_WIDTH + 100) {
          mower.isActive = false;
        }
      }
    }

    if (now - this.lastZombieSpawn > this.zombieSpawnInterval) {
      this.spawnZombie();
      this.lastZombieSpawn = now;
      this.zombieSpawnInterval = Math.max(3000, this.zombieSpawnInterval - 500);
    }

    if (now - this.lastSunProduction > 10000) {
      this.sun += 25 + Math.floor(Math.random() * 26);
      this.lastSunProduction = now;
    }
  }

  private spawnZombie(): void {
    const row = Math.floor(Math.random() * GRID_ROWS);
    const types: ZombieType[] = ['normal'];
    if (this.wave >= 2) types.push('cone');
    if (this.wave >= 3) types.push('bucket');

    const type = types[Math.floor(Math.random() * types.length)];
    const config = ZOMBIE_CONFIG[type];

    this.zombies.push({
      id: ++this.zombieIdCounter,
      x: CANVAS_WIDTH + 50,
      y: row,
      type,
      health: config.health,
      speed: config.speed,
      isSlow: false,
      slowEndTime: 0,
      lastAction: Date.now()
    });

    if (this.wave % 5 === 0) {
      this.zombies.push({
        id: ++this.zombieIdCounter,
        x: CANVAS_WIDTH + 100,
        y: Math.floor(Math.random() * GRID_ROWS),
        type: 'normal',
        health: config.health,
        speed: config.speed,
        isSlow: false,
        slowEndTime: 0,
        lastAction: Date.now()
      });
    }
  }

  getSelectedPlant(): PlantType | null {
    return this.selectedPlant;
  }

  getPlantConfig(): typeof PLANT_CONFIG {
    return PLANT_CONFIG;
  }

  pause(): void {
    this.isPaused = !this.isPaused;
  }

  reset(): void {
    this.init();
  }
}
