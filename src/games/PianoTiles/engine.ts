import { GAME_CONFIG } from '../../utils/constants';

export interface Tile {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  hitTime: number | null;
  timing: 'perfect' | 'great' | 'good' | 'miss' | null;
  isBlack: boolean;
}

export interface PianoTilesState {
  tiles: Tile[];
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  isGameOver: boolean;
  gameTime: number;
  lastSpawnTime: number;
  speed: number;
  level: number;
}

export class PianoTilesEngine {
  private state: PianoTilesState;
  private tileIdCounter: number;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly tileWidth: number;
  private readonly hitLineY: number;
  private readonly numLanes: number;
  private readonly baseSpeed: number;
  private readonly spawnInterval: number;

  constructor() {
    this.canvasWidth = 400;
    this.canvasHeight = 700;
    this.tileWidth = this.canvasWidth / 4;
    this.hitLineY = 600;
    this.numLanes = 4;
    this.baseSpeed = 0.35;
    this.spawnInterval = 500;
    this.tileIdCounter = 0;
    this.state = this.createInitialState();
  }

  private createInitialState(): PianoTilesState {
    return {
      tiles: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      isGameOver: false,
      gameTime: 0,
      lastSpawnTime: 0,
      speed: this.baseSpeed,
      level: 1,
    };
  }

  getState(): PianoTilesState {
    return { ...this.state };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  getHitLineY(): number {
    return this.hitLineY;
  }

  getTileWidth(): number {
    return this.tileWidth;
  }

  getNumLanes(): number {
    return this.numLanes;
  }

  reset(): void {
    this.tileIdCounter = 0;
    this.state = this.createInitialState();
  }

  start(): void {
    this.reset();
    this.state.lastSpawnTime = -this.spawnInterval;
  }

  tick(deltaTime: number): void {
    if (this.state.isGameOver) return;

    this.state.gameTime += deltaTime;

    // Increase speed over time
    this.state.level = Math.floor(this.state.gameTime / 15000) + 1;
    this.state.speed = this.baseSpeed * (1 + (this.state.level - 1) * 0.15);
    const adjustedSpawnInterval = Math.max(250, this.spawnInterval - (this.state.level - 1) * 30);

    // Spawn tiles
    if (this.state.gameTime - this.state.lastSpawnTime > adjustedSpawnInterval) {
      this.spawnTile();
      this.state.lastSpawnTime = this.state.gameTime;
    }

    // Update tile positions
    this.state.tiles.forEach(tile => {
      if (!tile.hit) {
        tile.y += this.state.speed * deltaTime;
      }
    });

    // Check for missed tiles (only black tiles that pass the line)
    this.state.tiles.forEach(tile => {
      if (!tile.hit && tile.isBlack && tile.y > this.hitLineY + GAME_CONFIG.goodWindow) {
        this.registerMiss(tile);
      }
    });

    // Remove old tiles
    this.state.tiles = this.state.tiles.filter(
      tile => tile.y < this.canvasHeight + 100 && !tile.hit
    );

    // Game over if too many misses or time limit
    if (this.state.missCount >= 10 || this.state.gameTime > 120000) {
      this.state.isGameOver = true;
    }
  }

  private spawnTile(): void {
    const lane = Math.floor(Math.random() * this.numLanes);
    const tile: Tile = {
      id: this.tileIdCounter++,
      lane,
      y: -80,
      hit: false,
      hitTime: null,
      timing: null,
      isBlack: true,
    };
    this.state.tiles.push(tile);
  }

  handleTap(lane: number): { result: 'perfect' | 'great' | 'good' | 'miss' | 'wrong'; score: number } {
    // Find the closest black tile in this lane
    const blackTiles = this.state.tiles.filter(t => !t.hit && t.isBlack && t.lane === lane);
    const hitTile = blackTiles.reduce((closest, tile) => {
      if (!closest) return tile;
      const distClosest = Math.abs(closest.y - this.hitLineY);
      const distTile = Math.abs(tile.y - this.hitLineY);
      return distTile < distClosest ? tile : closest;
    }, null as Tile | null);

    // Check if user tapped on white area (wrong lane)
    if (!hitTile) {
      // Check if there are any black tiles in other lanes near the hit line
      const anyBlackNearLine = this.state.tiles.some(
        t => !t.hit && t.isBlack && Math.abs(t.y - this.hitLineY) < GAME_CONFIG.goodWindow * 2
      );
      if (anyBlackNearLine) {
        this.state.combo = 0;
        return { result: 'wrong', score: 0 };
      }
    }

    if (!hitTile) {
      return { result: 'miss', score: 0 };
    }

    const distance = Math.abs(hitTile.y - this.hitLineY);
    let timing: 'perfect' | 'great' | 'good' | 'miss';
    let score: number;

    if (distance <= GAME_CONFIG.perfectWindow) {
      timing = 'perfect';
      score = GAME_CONFIG.perfectScore;
      this.state.perfectCount++;
    } else if (distance <= GAME_CONFIG.greatWindow) {
      timing = 'great';
      score = GAME_CONFIG.greatScore;
      this.state.greatCount++;
    } else if (distance <= GAME_CONFIG.goodWindow) {
      timing = 'good';
      score = GAME_CONFIG.goodScore;
      this.state.goodCount++;
    } else {
      timing = 'miss';
      score = 0;
      this.registerMiss(hitTile);
      return { result: 'miss', score: 0 };
    }

    hitTile.hit = true;
    hitTile.hitTime = this.state.gameTime;
    hitTile.timing = timing;

    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const comboMultiplier = Math.min(1 + Math.floor(this.state.combo / 10) * 0.1, 2);
    const levelBonus = 1 + (this.state.level - 1) * 0.1;
    this.state.score += Math.floor(score * comboMultiplier * levelBonus);

    return { result: timing, score };
  }

  private registerMiss(tile: Tile): void {
    if (tile.timing !== 'miss') {
      tile.hit = true;
      tile.hitTime = this.state.gameTime;
      tile.timing = 'miss';
      this.state.missCount++;
      this.state.combo = 0;
    }
  }

  getAccuracy(): number {
    const total = this.state.perfectCount + this.state.greatCount + this.state.goodCount + this.state.missCount;
    if (total === 0) return 0;
    const weighted = (this.state.perfectCount * 100 + this.state.greatCount * 80 + this.state.goodCount * 50) / total;
    return Math.round(weighted);
  }

  getLevel(): number {
    return this.state.level;
  }

  getSpeed(): number {
    return this.state.speed;
  }

  getComboMultiplier(): number {
    return Math.min(1 + Math.floor(this.state.combo / 10) * 0.1, 2);
  }
}
