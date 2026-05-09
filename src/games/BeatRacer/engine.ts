import { GAME_CONFIG } from '../../utils/constants';

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rock' | 'car' | 'barrier';
  lane: number;
}

export interface BeatMarker {
  id: number;
  y: number;
  hit: boolean;
  hitTime: number | null;
  timing: 'perfect' | 'great' | 'good' | 'miss' | null;
}

export interface BeatRacerState {
  carX: number;
  carY: number;
  speed: number;
  obstacles: Obstacle[];
  beatMarkers: BeatMarker[];
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  distance: number;
  isGameOver: boolean;
  gameTime: number;
  lastBeatSpawn: number;
  beatInterval: number;
  obstaclesAvoided: number;
}

export class BeatRacerEngine {
  private state: BeatRacerState;
  private markerIdCounter: number;
  private obstacleIdCounter: number;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly carWidth: number;
  private readonly carHeight: number;
  private readonly numLanes: number;
  private readonly laneWidth: number;
  private readonly baseSpeed: number;
  private readonly boostAmount: number;
  private readonly beatMarkerSpeed: number;

  constructor() {
    this.canvasWidth = 600;
    this.canvasHeight = 500;
    this.carWidth = 60;
    this.carHeight = 100;
    this.numLanes = 3;
    this.laneWidth = this.canvasWidth / this.numLanes;
    this.baseSpeed = 0.15;
    this.boostAmount = 0.3;
    this.beatMarkerSpeed = 0.5;
    this.markerIdCounter = 0;
    this.obstacleIdCounter = 0;
    this.state = this.createInitialState();
  }

  private createInitialState(): BeatRacerState {
    return {
      carX: this.canvasWidth / 2 - this.carWidth / 2,
      carY: this.canvasHeight - this.carHeight - 30,
      speed: this.baseSpeed,
      obstacles: [],
      beatMarkers: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      distance: 0,
      isGameOver: false,
      gameTime: 0,
      lastBeatSpawn: -1000,
      beatInterval: 800,
      obstaclesAvoided: 0,
    };
  }

  getState(): BeatRacerState {
    return { ...this.state };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  getCarSize(): { width: number; height: number } {
    return { width: this.carWidth, height: this.carHeight };
  }

  getLaneWidth(): number {
    return this.laneWidth;
  }

  reset(): void {
    this.markerIdCounter = 0;
    this.obstacleIdCounter = 0;
    this.state = this.createInitialState();
  }

  start(): void {
    this.reset();
    this.state.lastBeatSpawn = -1000;
  }

  tick(deltaTime: number): void {
    if (this.state.isGameOver) return;

    this.state.gameTime += deltaTime;

    // Spawn beat markers
    if (this.state.gameTime - this.state.lastBeatSpawn > this.state.beatInterval) {
      this.spawnBeatMarker();
      this.state.lastBeatSpawn = this.state.gameTime;
    }

    // Speed decay
    this.state.speed = Math.max(this.baseSpeed, this.state.speed - 0.0003 * deltaTime);

    // Update beat marker positions
    this.state.beatMarkers.forEach(marker => {
      if (!marker.hit) {
        marker.y += this.beatMarkerSpeed * deltaTime;
      }
    });

    // Spawn obstacles based on speed
    if (Math.random() < 0.005 * (1 + this.state.speed / this.baseSpeed)) {
      this.spawnObstacle();
    }

    // Update obstacle positions
    this.state.obstacles.forEach(obstacle => {
      obstacle.y += this.state.speed * deltaTime;
    });

    // Check for collisions
    this.state.obstacles.forEach(obstacle => {
      if (this.checkCollision(obstacle)) {
        this.state.isGameOver = true;
      }
    });

    // Check for missed beat markers
    this.state.beatMarkers.forEach(marker => {
      if (!marker.hit && marker.y > this.state.carY - 50) {
        this.registerMiss(marker);
      }
    });

    // Remove old markers and obstacles
    this.state.beatMarkers = this.state.beatMarkers.filter(
      marker => marker.y < this.canvasHeight + 100 && !marker.hit
    );
    this.state.obstacles = this.state.obstacles.filter(obstacle => {
      if (obstacle.y > this.canvasHeight) {
        this.state.obstaclesAvoided++;
        return false;
      }
      return true;
    });

    // Update distance
    this.state.distance += this.state.speed * deltaTime * 0.1;

    // Game over conditions
    if (this.state.missCount >= 20) {
      this.state.isGameOver = true;
    }
  }

  private spawnBeatMarker(): void {
    const marker: BeatMarker = {
      id: this.markerIdCounter++,
      y: -30,
      hit: false,
      hitTime: null,
      timing: null,
    };
    this.state.beatMarkers.push(marker);
  }

  private spawnObstacle(): void {
    const lane = Math.floor(Math.random() * this.numLanes);
    const types: Array<'rock' | 'car' | 'barrier'> = ['rock', 'car', 'barrier'];
    const obstacle: Obstacle = {
      id: this.obstacleIdCounter++,
      x: lane * this.laneWidth + 10,
      y: -100,
      width: this.laneWidth - 20,
      height: 60,
      type: types[Math.floor(Math.random() * types.length)],
      lane,
    };
    this.state.obstacles.push(obstacle);
  }

  private checkCollision(obstacle: Obstacle): boolean {
    const carRight = this.state.carX + this.carWidth;
    const carBottom = this.state.carY + this.carHeight;
    const obsRight = obstacle.x + obstacle.width;
    const obsBottom = obstacle.y + obstacle.height;

    return (
      this.state.carX < obsRight &&
      carRight > obstacle.x &&
      this.state.carY < obsBottom &&
      carBottom > obstacle.y
    );
  }

  handleTap(): { result: 'perfect' | 'great' | 'good' | 'miss'; score: number } {
    if (this.state.isGameOver) return { result: 'miss', score: 0 };

    // Find closest beat marker
    const closestMarker = this.state.beatMarkers
      .filter(m => !m.hit)
      .reduce((closest, marker) => {
        if (!closest) return marker;
        const distClosest = Math.abs(closest.y - this.state.carY);
        const distMarker = Math.abs(marker.y - this.state.carY);
        return distMarker < distClosest ? marker : closest;
      }, null as BeatMarker | null);

    if (!closestMarker) {
      return { result: 'miss', score: 0 };
    }

    const distance = Math.abs(closestMarker.y - this.state.carY);
    let timing: 'perfect' | 'great' | 'good' | 'miss';
    let score: number;

    if (distance <= GAME_CONFIG.perfectWindow * 2) {
      timing = 'perfect';
      score = GAME_CONFIG.perfectScore * 2;
      this.state.perfectCount++;
      this.state.speed = Math.min(this.state.speed + this.boostAmount, this.baseSpeed * 3);
    } else if (distance <= GAME_CONFIG.greatWindow * 2) {
      timing = 'great';
      score = GAME_CONFIG.greatScore * 2;
      this.state.greatCount++;
      this.state.speed = Math.min(this.state.speed + this.boostAmount * 0.7, this.baseSpeed * 2.5);
    } else if (distance <= GAME_CONFIG.goodWindow * 2) {
      timing = 'good';
      score = GAME_CONFIG.goodScore * 2;
      this.state.goodCount++;
      this.state.speed = Math.min(this.state.speed + this.boostAmount * 0.4, this.baseSpeed * 2);
    } else {
      timing = 'miss';
      score = 0;
      this.registerMiss(closestMarker);
      return { result: 'miss', score: 0 };
    }

    closestMarker.hit = true;
    closestMarker.hitTime = this.state.gameTime;
    closestMarker.timing = timing;

    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const comboMultiplier = Math.min(1 + Math.floor(this.state.combo / 5) * 0.1, 2);
    this.state.score += Math.floor(score * comboMultiplier);

    return { result: timing, score };
  }

  handleLaneChange(direction: 'left' | 'right'): void {
    const currentLane = Math.floor((this.state.carX + this.carWidth / 2) / this.laneWidth);
    let newLane = currentLane;

    if (direction === 'left' && currentLane > 0) {
      newLane = currentLane - 1;
    } else if (direction === 'right' && currentLane < this.numLanes - 1) {
      newLane = currentLane + 1;
    }

    this.state.carX = newLane * this.laneWidth + this.laneWidth / 2 - this.carWidth / 2;
  }

  private registerMiss(marker: BeatMarker): void {
    if (marker.timing !== 'miss') {
      marker.hit = true;
      marker.hitTime = this.state.gameTime;
      marker.timing = 'miss';
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

  getSpeedPercentage(): number {
    return Math.round((this.state.speed / this.baseSpeed) * 100);
  }
}
