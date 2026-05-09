import { SPEED_ESCAPE_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CAR_WIDTH,
  CAR_HEIGHT,
  INITIAL_SPEED,
  LANE_COUNT
} = SPEED_ESCAPE_CONSTANTS;

export interface Vehicle {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
  speed: number;
  type: 'player' | 'police' | 'obstacle';
  color: string;
}

export interface Collectible {
  x: number;
  y: number;
  lane: number;
  type: 'coin' | 'nitro' | 'repair';
  width: number;
  height: number;
  active: boolean;
  collected: boolean;
}

export interface SpeedEscapeState {
  player: Vehicle;
  vehicles: Vehicle[];
  collectibles: Collectible[];
  score: number;
  distance: number;
  coins: number;
  lives: number;
  speed: number;
  gameOver: boolean;
  gameStarted: boolean;
  isAccelerating: boolean;
  isBraking: boolean;
  nitroActive: boolean;
  nitroTimer: number;
  invincible: boolean;
  invincibleTimer: number;
  elapsedTime: number;
}

type GameEventCallback = () => void;
type GameOverCallback = (score: number) => void;
type ScoreUpdateCallback = (score: number, coins: number, lives: number) => void;

export class SpeedEscapeEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;

  private state: SpeedEscapeState;

  private vehicleSpawnTimer: number = 0;
  private policeSpawnTimer: number = 0;
  private collectibleSpawnTimer: number = 0;
  private scoreTimer: number = 0;

  private onHit?: GameEventCallback;
  private onCollect?: GameEventCallback;
  private onNitro?: GameEventCallback;
  private onGameOver?: GameOverCallback;
  private onScoreUpdate?: ScoreUpdateCallback;

  private roadOffset: number = 0;
  private laneWidth: number = CANVAS_WIDTH / LANE_COUNT;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.laneWidth = CANVAS_WIDTH / LANE_COUNT;
    this.init();
  }

  private init(): void {
    const playerLane = Math.floor(LANE_COUNT / 2);

    this.state = {
      player: {
        x: this.getLaneX(playerLane) + (this.laneWidth - CAR_WIDTH) / 2,
        y: CANVAS_HEIGHT - CAR_HEIGHT - 50,
        width: CAR_WIDTH,
        height: CAR_HEIGHT,
        lane: playerLane,
        speed: 0,
        type: 'player',
        color: '#E74C3C'
      },
      vehicles: [],
      collectibles: [],
      score: 0,
      distance: 0,
      coins: 0,
      lives: 3,
      speed: INITIAL_SPEED,
      gameOver: false,
      gameStarted: false,
      isAccelerating: false,
      isBraking: false,
      nitroActive: false,
      nitroTimer: 0,
      invincible: false,
      invincibleTimer: 0,
      elapsedTime: 0
    };
  }

  private getLaneX(lane: number): number {
    return lane * this.laneWidth;
  }

  private getLaneCenter(lane: number): number {
    return this.getLaneX(lane) + this.laneWidth / 2;
  }

  setCallbacks(callbacks: {
    onHit?: GameEventCallback;
    onCollect?: GameEventCallback;
    onNitro?: GameEventCallback;
    onGameOver?: GameOverCallback;
    onScoreUpdate?: ScoreUpdateCallback;
  }): void {
    this.onHit = callbacks.onHit;
    this.onCollect = callbacks.onCollect;
    this.onNitro = callbacks.onNitro;
    this.onGameOver = callbacks.onGameOver;
    this.onScoreUpdate = callbacks.onScoreUpdate;
  }

  start(): void {
    if (this.animationId !== null) return;
    this.state.gameStarted = true;
    this.state.speed = INITIAL_SPEED;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset(): void {
    this.stop();
    this.init();
  }

  moveLeft(): void {
    if (!this.state.gameStarted || this.state.gameOver) return;
    if (this.state.player.lane > 0) {
      this.state.player.lane--;
      this.state.player.x = this.getLaneCenter(this.state.player.lane) - CAR_WIDTH / 2;
    }
  }

  moveRight(): void {
    if (!this.state.gameStarted || this.state.gameOver) return;
    if (this.state.player.lane < LANE_COUNT - 1) {
      this.state.player.lane++;
      this.state.player.x = this.getLaneCenter(this.state.player.lane) - CAR_WIDTH / 2;
    }
  }

  accelerate(): void {
    if (!this.state.gameStarted || this.state.gameOver) return;
    this.state.isAccelerating = true;
  }

  releaseAccelerate(): void {
    this.state.isAccelerating = false;
  }

  brake(): void {
    if (!this.state.gameStarted || this.state.gameOver) return;
    this.state.isBraking = true;
  }

  releaseBrake(): void {
    this.state.isBraking = false;
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 3);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    if (!this.state.gameOver) {
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update(deltaTime: number): void {
    if (this.state.gameOver) return;

    this.state.elapsedTime += deltaTime / 60;

    let currentSpeed = this.state.speed;
    if (this.state.isAccelerating) {
      currentSpeed += 0.3 * deltaTime;
    }
    if (this.state.isBraking) {
      currentSpeed -= 0.5 * deltaTime;
    }
    if (this.state.nitroActive) {
      currentSpeed += 2 * deltaTime;
    }

    currentSpeed = Math.max(3, Math.min(currentSpeed, 15));
    this.state.speed = currentSpeed;

    if (this.state.nitroTimer > 0) {
      this.state.nitroTimer -= deltaTime;
      if (this.state.nitroTimer <= 0) {
        this.state.nitroActive = false;
      }
    }

    if (this.state.invincibleTimer > 0) {
      this.state.invincibleTimer -= deltaTime;
      if (this.state.invincibleTimer <= 0) {
        this.state.invincible = false;
      }
    }

    this.roadOffset += currentSpeed * deltaTime * 0.5;
    if (this.roadOffset >= 100) {
      this.roadOffset = 0;
    }

    this.state.distance += currentSpeed * deltaTime * 0.1;

    this.state.vehicles.forEach(vehicle => {
      if (vehicle.type === 'police') {
        vehicle.y += (currentSpeed + 2) * deltaTime;
      } else {
        vehicle.y -= (currentSpeed - vehicle.speed) * deltaTime;
      }
    });

    this.state.collectibles.forEach(collectible => {
      if (!collectible.collected && collectible.active) {
        collectible.y -= currentSpeed * deltaTime;
      }
    });

    this.state.vehicles = this.state.vehicles.filter(v => {
      if (v.type === 'police') {
        return v.y < CANVAS_HEIGHT + 100;
      }
      return v.y > -100;
    });

    this.state.collectibles = this.state.collectibles.filter(c => {
      return c.y > -50 && (!c.collected);
    });

    this.vehicleSpawnTimer += deltaTime;
    if (this.vehicleSpawnTimer > 60 + Math.random() * 40) {
      this.spawnVehicle();
      this.vehicleSpawnTimer = 0;
    }

    this.policeSpawnTimer += deltaTime;
    if (this.policeSpawnTimer > 120 + Math.random() * 80) {
      this.spawnPolice();
      this.policeSpawnTimer = 0;
    }

    this.collectibleSpawnTimer += deltaTime;
    if (this.collectibleSpawnTimer > 80 + Math.random() * 60) {
      this.spawnCollectible();
      this.collectibleSpawnTimer = 0;
    }

    this.checkCollisions();

    this.scoreTimer += deltaTime;
    if (this.scoreTimer > 10) {
      const distanceScore = Math.floor(this.state.distance);
      const timeScore = Math.floor(this.state.elapsedTime * 2);
      const coinScore = this.state.coins * 10;
      this.state.score = distanceScore + timeScore + coinScore;
      this.scoreTimer = 0;
      this.onScoreUpdate?.(this.state.score, this.state.coins, this.state.lives);
    }

    if (this.state.speed < INITIAL_SPEED) {
      this.state.speed += 0.001 * deltaTime;
    }
  }

  private spawnVehicle(): void {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const colors = ['#3498DB', '#9B59B6', '#1ABC9C', '#F39C12', '#7F8C8D'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const speed = 1 + Math.random() * 3;

    this.state.vehicles.push({
      x: this.getLaneCenter(lane) - CAR_WIDTH / 2,
      y: CANVAS_HEIGHT + 50,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
      lane,
      speed,
      type: 'obstacle',
      color
    });
  }

  private spawnPolice(): void {
    const lane = Math.floor(Math.random() * LANE_COUNT);

    this.state.vehicles.push({
      x: this.getLaneCenter(lane) - CAR_WIDTH / 2,
      y: -CAR_HEIGHT - 50,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
      lane,
      speed: 0,
      type: 'police',
      color: '#2980B9'
    });
  }

  private spawnCollectible(): void {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const rand = Math.random();
    let type: Collectible['type'];
    let width = 25;
    let height = 25;

    if (rand < 0.5) {
      type = 'coin';
      width = 20;
      height = 20;
    } else if (rand < 0.8) {
      type = 'nitro';
      width = 30;
      height = 20;
    } else {
      type = 'repair';
      width = 25;
      height = 25;
    }

    this.state.collectibles.push({
      x: this.getLaneCenter(lane) - width / 2,
      y: CANVAS_HEIGHT + 50,
      lane,
      type,
      width,
      height,
      active: true,
      collected: false
    });
  }

  private checkCollisions(): void {
    const playerBox = {
      x: this.state.player.x + 5,
      y: this.state.player.y + 5,
      width: this.state.player.width - 10,
      height: this.state.player.height - 10
    };

    for (const vehicle of this.state.vehicles) {
      const vehicleBox = {
        x: vehicle.x + 5,
        y: vehicle.y + 5,
        width: vehicle.width - 10,
        height: vehicle.height - 10
      };

      if (this.checkBoxCollision(playerBox, vehicleBox)) {
        if (!this.state.invincible) {
          this.state.lives--;
          this.state.invincible = true;
          this.state.invincibleTimer = 90;
          this.onHit?.();

          if (this.state.lives <= 0) {
            this.state.gameOver = true;
            this.onGameOver?.(this.state.score);
            return;
          }
        }

        if (vehicle.type === 'police') {
          vehicle.y = CANVAS_HEIGHT + 200;
        } else {
          vehicle.y = -200;
        }
      }
    }

    for (const collectible of this.state.collectibles) {
      if (collectible.collected || !collectible.active) continue;

      const collectibleBox = {
        x: collectible.x,
        y: collectible.y,
        width: collectible.width,
        height: collectible.height
      };

      if (this.checkBoxCollision(playerBox, collectibleBox)) {
        collectible.collected = true;
        collectible.active = false;

        switch (collectible.type) {
          case 'coin':
            this.state.coins++;
            this.state.score += 50;
            break;
          case 'nitro':
            this.state.nitroActive = true;
            this.state.nitroTimer = 120;
            this.onNitro?.();
            break;
          case 'repair':
            if (this.state.lives < 3) {
              this.state.lives++;
            }
            break;
        }

        this.onCollect?.();
      }
    }
  }

  private checkBoxCollision(a: { x: number; y: number; width: number; height: number },
                           b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  private render(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const roadGradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    roadGradient.addColorStop(0, '#2d3436');
    roadGradient.addColorStop(0.5, '#636e72');
    roadGradient.addColorStop(1, '#2d3436');
    this.ctx.fillStyle = roadGradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.strokeStyle = '#f1f2f6';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, CANVAS_HEIGHT);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(CANVAS_WIDTH, 0);
    this.ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#f1f2f6';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([40, 30]);
    for (let lane = 1; lane < LANE_COUNT; lane++) {
      const x = this.getLaneX(lane);
      this.ctx.beginPath();
      for (let y = -this.roadOffset; y < CANVAS_HEIGHT + 50; y += 70) {
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, Math.min(y + 40, CANVAS_HEIGHT));
      }
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]);

    this.state.collectibles.forEach(collectible => {
      if (collectible.collected || !collectible.active) return;

      const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
      const cx = collectible.x + collectible.width / 2;
      const cy = collectible.y + collectible.height / 2;

      if (collectible.type === 'coin') {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, (collectible.width / 2) * pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFA500';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('$', cx, cy);
      } else if (collectible.type === 'nitro') {
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.beginPath();
        this.ctx.roundRect(collectible.x - 2, collectible.y - 2,
                          collectible.width + 4, collectible.height + 4,
                          5);
        this.ctx.fill();
        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillRect(collectible.x, collectible.y,
                         collectible.width, collectible.height);
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('N2O', cx, cy);
      } else if (collectible.type === 'repair') {
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, (collectible.width / 2) * pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#008000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('+', cx, cy);
      }
    });

    this.state.vehicles.forEach(vehicle => {
      this.drawCar(vehicle.x, vehicle.y, vehicle.color, vehicle.type === 'police');
    });

    const playerAlpha = this.state.invincible ?
      (Math.sin(Date.now() / 50) * 0.3 + 0.7) : 1;
    this.ctx.globalAlpha = playerAlpha;

    if (this.state.nitroActive) {
      this.ctx.fillStyle = '#FF4500';
      this.ctx.beginPath();
      this.ctx.moveTo(this.state.player.x + 5, this.state.player.y + this.state.player.height);
      this.ctx.lineTo(this.state.player.x - 10, this.state.player.y + this.state.player.height + 20);
      this.ctx.lineTo(this.state.player.x + this.state.player.width - 5, this.state.player.y + this.state.player.height);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.moveTo(this.state.player.x + 8, this.state.player.y + this.state.player.height);
      this.ctx.lineTo(this.state.player.x - 5, this.state.player.y + this.state.player.height + 15);
      this.ctx.lineTo(this.state.player.x + this.state.player.width - 8, this.state.player.y + this.state.player.height);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.drawCar(this.state.player.x, this.state.player.y, this.state.player.color, false, true);
    this.ctx.globalAlpha = 1;

    if (this.state.nitroActive) {
      this.ctx.fillStyle = 'rgba(255, 69, 0, 0.2)';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('NITRO!', CANVAS_WIDTH / 2, 50);
    }
  }

  private drawCar(x: number, y: number, color: string, isPolice: boolean = false, isPlayer: boolean = false): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y + 10, this.state.player.width, this.state.player.height - 10, 5);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x + 5, y, this.state.player.width - 10, 25, [10, 10, 0, 0]);
    this.ctx.fill();

    if (isPolice) {
      this.ctx.fillStyle = '#FF0000';
      this.ctx.beginPath();
      this.ctx.arc(x + this.state.player.width / 2, y + 5, 6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#0000FF';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const angle = Date.now() / 200 + i * (Math.PI * 2 / 3);
        const lx = x + this.state.player.width / 2 + Math.cos(angle) * 8;
        const ly = y + 5 + Math.sin(angle) * 8;
        this.ctx.beginPath();
        this.ctx.moveTo(x + this.state.player.width / 2, y + 5);
        this.ctx.lineTo(lx, ly);
        this.ctx.stroke();
      }
    }

    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(x + 8, y + 5, 10, 10);
    this.ctx.fillRect(x + this.state.player.width - 18, y + 5, 10, 10);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + 3, y + this.state.player.height - 10, 8, 8);
    this.ctx.fillRect(x + this.state.player.width - 11, y + this.state.player.height - 10, 8, 8);
    this.ctx.fillRect(x + 3, y + 15, 8, 8);
    this.ctx.fillRect(x + this.state.player.width - 11, y + 15, 8, 8);

    if (isPlayer) {
      this.ctx.fillStyle = '#FF0000';
      this.ctx.beginPath();
      this.ctx.arc(x + 5, y + this.state.player.height / 2 + 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x + this.state.player.width - 5, y + this.state.player.height / 2 + 5, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  getScore(): number {
    return this.state.score;
  }

  getCoins(): number {
    return this.state.coins;
  }

  getLives(): number {
    return this.state.lives;
  }

  getSpeed(): number {
    return this.state.speed;
  }

  isGameOver(): boolean {
    return this.state.gameOver;
  }

  isGameStarted(): boolean {
    return this.state.gameStarted;
  }

  getElapsedTime(): number {
    return this.state.elapsedTime;
  }
}
