import { COOP_RUN_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  LANE_COUNT,
  GROUND_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  MAX_SPEED,
  OBSTACLE_SPAWN_INTERVAL,
  COLLECTIBLE_SPAWN_INTERVAL,
  REVIVE_RANGE,
  REVIVE_TIME,
  DOUBLE_SCORE_RANGE
} = COOP_RUN_CONSTANTS;

export interface Player {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  isAlive: boolean;
  reviveTimer: number;
  score: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'barrier' | 'low' | 'high';
  forBoth: boolean;
}

export interface Collectible {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'coin' | 'gem';
  forBoth: boolean;
}

export interface CoopRunState {
  player1: Player;
  player2: Player;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  speed: number;
  score: number;
  gameOver: boolean;
  bothAlive: boolean;
}

type GameEventCallback = () => void;
type GameOverCallback = (score: number, bothDied: boolean) => void;
type ScoreUpdateCallback = (score: number, bothAlive: boolean) => void;
type CollectCallback = (isDouble: boolean) => void;
type ReviveCallback = () => void;

export class CoopRunEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private obstacleSpawnTimer: number = 0;
  private collectibleSpawnTimer: number = 0;

  private onGameOver?: GameOverCallback;
  private onScoreUpdate?: ScoreUpdateCallback;
  private onCollect?: CollectCallback;
  private onRevive?: ReviveCallback;

  private gameStarted: boolean = false;

  public player1: Player;
  public player2: Player;
  public obstacles: Obstacle[];
  public collectibles: Collectible[];
  public speed: number;
  public score: number;
  public gameOver: boolean;
  public bothAlive: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.init();
  }

  private init(): void {
    const leftAreaWidth = CANVAS_WIDTH / 2;
    const rightAreaStart = leftAreaWidth;

    this.player1 = {
      x: 80,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      lane: 1,
      isJumping: false,
      isSliding: false,
      isAlive: true,
      reviveTimer: 0,
      score: 0
    };

    this.player2 = {
      x: rightAreaStart + 80,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      lane: 1,
      isJumping: false,
      isSliding: false,
      isAlive: true,
      reviveTimer: 0,
      score: 0
    };

    this.obstacles = [];
    this.collectibles = [];
    this.speed = INITIAL_SPEED;
    this.score = 0;
    this.gameOver = false;
    this.bothAlive = true;
    this.gameStarted = false;
    this.obstacleSpawnTimer = 0;
    this.collectibleSpawnTimer = 0;
  }

  setCallbacks(callbacks: {
    onGameOver?: GameOverCallback;
    onScoreUpdate?: ScoreUpdateCallback;
    onCollect?: CollectCallback;
    onRevive?: ReviveCallback;
  }): void {
    this.onGameOver = callbacks.onGameOver;
    this.onScoreUpdate = callbacks.onScoreUpdate;
    this.onCollect = callbacks.onCollect;
    this.onRevive = callbacks.onRevive;
  }

  start(): void {
    if (this.animationId !== null) return;
    this.gameStarted = true;
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

  movePlayer1(direction: 'left' | 'right'): void {
    if (!this.gameStarted || this.gameOver || !this.player1.isAlive) return;
    if (direction === 'left' && this.player1.lane > 0) {
      this.player1.lane--;
    } else if (direction === 'right' && this.player1.lane < LANE_COUNT - 1) {
      this.player1.lane++;
    }
  }

  movePlayer2(direction: 'left' | 'right'): void {
    if (!this.gameStarted || this.gameOver || !this.player2.isAlive) return;
    if (direction === 'left' && this.player2.lane > 0) {
      this.player2.lane--;
    } else if (direction === 'right' && this.player2.lane < LANE_COUNT - 1) {
      this.player2.lane++;
    }
  }

  jumpPlayer1(): void {
    if (!this.gameStarted || this.gameOver || !this.player1.isAlive) return;
    if (!this.player1.isJumping) {
      this.player1.vy = JUMP_FORCE;
      this.player1.isJumping = true;
      this.player1.isSliding = false;
    }
  }

  jumpPlayer2(): void {
    if (!this.gameStarted || this.gameOver || !this.player2.isAlive) return;
    if (!this.player2.isJumping) {
      this.player2.vy = JUMP_FORCE;
      this.player2.isJumping = true;
      this.player2.isSliding = false;
    }
  }

  slidePlayer1(): void {
    if (!this.gameStarted || this.gameOver || !this.player1.isAlive) return;
    if (!this.player1.isJumping) {
      this.player1.isSliding = true;
      this.player1.height = PLAYER_HEIGHT * 0.4;
      this.player1.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.player1.height;
    }
  }

  slidePlayer2(): void {
    if (!this.gameStarted || this.gameOver || !this.player2.isAlive) return;
    if (!this.player2.isJumping) {
      this.player2.isSliding = true;
      this.player2.height = PLAYER_HEIGHT * 0.4;
      this.player2.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.player2.height;
    }
  }

  releaseSlidePlayer1(): void {
    if (this.player1.isSliding) {
      this.player1.isSliding = false;
      this.player1.height = PLAYER_HEIGHT;
      this.player1.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.player1.height;
    }
  }

  releaseSlidePlayer2(): void {
    if (this.player2.isSliding) {
      this.player2.isSliding = false;
      this.player2.height = PLAYER_HEIGHT;
      this.player2.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.player2.height;
    }
  }

  revivePlayer1(): void {
    if (!this.gameStarted || this.gameOver || this.player1.isAlive) return;
    const p1x = this.player1.x + this.player1.width / 2;
    const p2x = this.player2.x + this.player2.width / 2;
    const distance = Math.abs(p1x - p2x);
    if (distance <= REVIVE_RANGE) {
      this.player1.isAlive = true;
      this.player1.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
      this.player1.vy = 0;
      this.player1.isJumping = false;
      this.player1.reviveTimer = REVIVE_TIME;
      this.onRevive?.();
    }
  }

  revivePlayer2(): void {
    if (!this.gameStarted || this.gameOver || this.player2.isAlive) return;
    const p1x = this.player1.x + this.player1.width / 2;
    const p2x = this.player2.x + this.player2.width / 2;
    const distance = Math.abs(p1x - p2x);
    if (distance <= REVIVE_RANGE) {
      this.player2.isAlive = true;
      this.player2.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
      this.player2.vy = 0;
      this.player2.isJumping = false;
      this.player2.reviveTimer = REVIVE_TIME;
      this.onRevive?.();
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 3);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    if (!this.gameOver) {
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update(deltaTime: number): void {
    if (this.gameOver) return;

    const adjustedSpeed = this.speed * deltaTime;

    this.updatePlayer(this.player1, adjustedSpeed, deltaTime);
    this.updatePlayer(this.player2, adjustedSpeed, deltaTime);

    this.obstacles.forEach(obstacle => {
      obstacle.x -= adjustedSpeed;
    });
    this.obstacles = this.obstacles.filter(o => o.x + o.width > -50);

    this.collectibles.forEach(collectible => {
      collectible.x -= adjustedSpeed;
    });
    this.collectibles = this.collectibles.filter(c => c.x + c.width > -50);

    this.obstacleSpawnTimer += deltaTime;
    if (this.obstacleSpawnTimer > OBSTACLE_SPAWN_INTERVAL + Math.random() * 40) {
      this.spawnObstacle();
      this.obstacleSpawnTimer = 0;
    }

    this.collectibleSpawnTimer += deltaTime;
    if (this.collectibleSpawnTimer > COLLECTIBLE_SPAWN_INTERVAL + Math.random() * 60) {
      this.spawnCollectible();
      this.collectibleSpawnTimer = 0;
    }

    this.checkCollisions();

    this.bothAlive = this.player1.isAlive && this.player2.isAlive;

    if (!this.bothAlive && !this.player1.isAlive && !this.player2.isAlive) {
      this.gameOver = true;
      this.onGameOver?.(this.score, true);
      return;
    }

    const scoreMultiplier = this.bothAlive ? 2 : 1;
    this.score += adjustedSpeed * 0.1 * scoreMultiplier;

    if (this.speed < MAX_SPEED) {
      this.speed += SPEED_INCREMENT * deltaTime;
    }

    this.onScoreUpdate?.(Math.floor(this.score), this.bothAlive);
  }

  private updatePlayer(player: Player, adjustedSpeed: number, deltaTime: number): void {
    if (!player.isAlive) return;

    const laneWidth = (CANVAS_WIDTH / 2 - 40) / LANE_COUNT;
    const targetX = 20 + player.lane * laneWidth + laneWidth / 2 - player.width / 2;
    player.x += (targetX - player.x) * 0.15;

    if (player.reviveTimer > 0) {
      player.reviveTimer -= deltaTime;
    }

    player.vy += GRAVITY * deltaTime;
    player.y += player.vy * deltaTime;

    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - player.height;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.isJumping = false;
    }
  }

  private spawnObstacle(): void {
    const forBoth = Math.random() < 0.3;
    const leftLane = Math.floor(Math.random() * LANE_COUNT);
    const rightLane = Math.floor(Math.random() * LANE_COUNT);

    if (forBoth) {
      const type = Math.random() < 0.5 ? 'barrier' : (Math.random() < 0.5 ? 'low' : 'high');
      const laneWidth = (CANVAS_WIDTH / 2 - 40) / LANE_COUNT;
      const leftX = 20 + leftLane * laneWidth + laneWidth / 2 - 20;
      const rightX = CANVAS_WIDTH / 2 + 20 + rightLane * laneWidth + laneWidth / 2 - 20;

      this.obstacles.push({
        x: leftX,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - (type === 'high' ? PLAYER_HEIGHT * 1.5 : PLAYER_HEIGHT),
        width: 40,
        height: type === 'high' ? PLAYER_HEIGHT * 0.5 : PLAYER_HEIGHT,
        type,
        forBoth: true
      });

      this.obstacles.push({
        x: rightX,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - (type === 'high' ? PLAYER_HEIGHT * 1.5 : PLAYER_HEIGHT),
        width: 40,
        height: type === 'high' ? PLAYER_HEIGHT * 0.5 : PLAYER_HEIGHT,
        type,
        forBoth: true
      });
    } else {
      const isLeft = Math.random() < 0.5;
      const lane = isLeft ? leftLane : rightLane;
      const type = Math.random() < 0.5 ? 'barrier' : (Math.random() < 0.5 ? 'low' : 'high');
      const laneWidth = (CANVAS_WIDTH / 2 - 40) / LANE_COUNT;
      const x = (isLeft ? 0 : CANVAS_WIDTH / 2) + 20 + lane * laneWidth + laneWidth / 2 - 20;

      this.obstacles.push({
        x,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - (type === 'high' ? PLAYER_HEIGHT * 1.5 : PLAYER_HEIGHT),
        width: 40,
        height: type === 'high' ? PLAYER_HEIGHT * 0.5 : PLAYER_HEIGHT,
        type,
        forBoth: false
      });
    }
  }

  private spawnCollectible(): void {
    const forBoth = Math.random() < 0.4;
    const leftLane = Math.floor(Math.random() * LANE_COUNT);
    const rightLane = Math.floor(Math.random() * LANE_COUNT);
    const type = Math.random() < 0.7 ? 'coin' : 'gem';
    const y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT - 40 - Math.random() * 60;

    if (forBoth) {
      const laneWidth = (CANVAS_WIDTH / 2 - 40) / LANE_COUNT;
      const leftX = 20 + leftLane * laneWidth + laneWidth / 2 - 15;
      const rightX = CANVAS_WIDTH / 2 + 20 + rightLane * laneWidth + laneWidth / 2 - 15;

      this.collectibles.push({ x: leftX, y, width: 30, height: 30, type, forBoth: true });
      this.collectibles.push({ x: rightX, y, width: 30, height: 30, type, forBoth: true });
    } else {
      const isLeft = Math.random() < 0.5;
      const lane = isLeft ? leftLane : rightLane;
      const laneWidth = (CANVAS_WIDTH / 2 - 40) / LANE_COUNT;
      const x = (isLeft ? 0 : CANVAS_WIDTH / 2) + 20 + lane * laneWidth + laneWidth / 2 - 15;

      this.collectibles.push({ x, y, width: 30, height: 30, type, forBoth: true });
    }
  }

  private checkCollisions(): void {
    this.checkPlayerCollisions(this.player1, true);
    this.checkPlayerCollisions(this.player2, false);
    this.checkCollectibleCollisions(this.player1, true);
    this.checkCollectibleCollisions(this.player2, false);
  }

  private checkPlayerCollisions(player: Player, isPlayer1: boolean): void {
    if (!player.isAlive) return;

    const playerBox = {
      x: player.x + 5,
      y: player.y + 5,
      width: player.width - 10,
      height: player.height - 10
    };

    for (const obstacle of this.obstacles) {
      const isLeftSide = obstacle.x < CANVAS_WIDTH / 2;
      if (isPlayer1 !== isLeftSide && !obstacle.forBoth) continue;

      if (obstacle.type === 'low' && player.isSliding) continue;
      if (obstacle.type === 'high' && player.isJumping && player.y < CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT * 1.2) continue;

      if (this.checkBoxCollision(playerBox, obstacle)) {
        player.isAlive = false;
        break;
      }
    }
  }

  private checkCollectibleCollisions(player: Player, isPlayer1: boolean): void {
    if (!player.isAlive) return;

    const playerBox = {
      x: player.x + 5,
      y: player.y + 5,
      width: player.width - 10,
      height: player.height - 10
    };

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i];
      const isLeftSide = collectible.x < CANVAS_WIDTH / 2;
      if (isPlayer1 !== isLeftSide && !collectible.forBoth) continue;

      if (this.checkBoxCollision(playerBox, collectible)) {
        const otherPlayer = isPlayer1 ? this.player2 : this.player1;
        const otherNear = otherPlayer.isAlive &&
          Math.abs((player.x + player.width / 2) - (otherPlayer.x + otherPlayer.width / 2)) < DOUBLE_SCORE_RANGE;

        const points = collectible.type === 'gem' ? 50 : 10;
        const multiplier = otherNear && otherPlayer.isAlive ? 4 : 2;

        this.score += points * multiplier;
        player.score += points * multiplier;

        if (otherNear && otherPlayer.isAlive) {
          otherPlayer.score += points * 2;
        }

        this.onCollect?.(otherNear && otherPlayer.isAlive);
        this.collectibles.splice(i, 1);
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
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(CANVAS_WIDTH / 2, 0);
    this.ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - GROUND_HEIGHT);
    this.ctx.stroke();

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    this.ctx.strokeStyle = 'rgba(108, 92, 231, 0.5)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
    this.ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
    this.ctx.stroke();

    const laneWidth = (CANVAS_WIDTH / 2 - 40) / LANE_COUNT;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 1; i < LANE_COUNT; i++) {
      const x = i * laneWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT - GROUND_HEIGHT);
      this.ctx.stroke();

      const x2 = CANVAS_WIDTH / 2 + i * laneWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x2, 0);
      this.ctx.lineTo(x2, CANVAS_HEIGHT - GROUND_HEIGHT);
      this.ctx.stroke();
    }

    this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
    this.collectibles.forEach(collectible => this.drawCollectible(collectible));

    this.drawPlayer(this.player1, '#ff6b9d', 'P1');
    this.drawPlayer(this.player2, '#00d2ff', 'P2');

    if (!this.player1.isAlive && this.player2.isAlive) {
      const p1x = this.player1.x + this.player1.width / 2;
      const p2x = this.player2.x + this.player2.width / 2;
      if (Math.abs(p1x - p2x) <= REVIVE_RANGE) {
        this.drawReviveHint(this.player1, 'P1');
      }
    }

    if (!this.player2.isAlive && this.player1.isAlive) {
      const p1x = this.player1.x + this.player1.width / 2;
      const p2x = this.player2.x + this.player2.width / 2;
      if (Math.abs(p1x - p2x) <= REVIVE_RANGE) {
        this.drawReviveHint(this.player2, 'P2');
      }
    }

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('P1: WASD', CANVAS_WIDTH / 4, 30);
    this.ctx.fillText('P2: 方向键', (CANVAS_WIDTH * 3) / 4, 30);
  }

  private drawPlayer(player: Player, color: string, label: string): void {
    if (!player.isAlive) {
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(player.x, player.y, player.width, player.height);
      this.ctx.globalAlpha = 1;
      return;
    }

    if (player.reviveTimer > 0) {
      this.ctx.strokeStyle = '#39ff14';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 + 10, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    const bounce = Math.sin(Date.now() / 150) * 2;
    const drawY = player.isJumping ? player.y : player.y + bounce;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(player.x + player.width / 2, drawY + 12, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffe4c4';
    this.ctx.beginPath();
    this.ctx.arc(player.x + player.width / 2, drawY + 10, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(player.x + player.width / 2 - 3, drawY + 9, 2, 0, Math.PI * 2);
    this.ctx.arc(player.x + player.width / 2 + 3, drawY + 9, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.fillRect(player.x + 5, drawY + player.height - 25, player.width - 10, 25);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, player.x + player.width / 2, drawY + 14);
  }

  private drawObstacle(obstacle: Obstacle): void {
    if (obstacle.type === 'barrier') {
      this.ctx.fillStyle = '#ff4757';
      this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      this.ctx.fillStyle = '#ff6b81';
      this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 10);
    } else if (obstacle.type === 'low') {
      this.ctx.fillStyle = '#ffa502';
      this.ctx.fillRect(obstacle.x, obstacle.y + obstacle.height - 15, obstacle.width, 15);
      this.ctx.fillStyle = '#ff7f50';
      this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 12, obstacle.width - 10, 8);
    } else if (obstacle.type === 'high') {
      this.ctx.fillStyle = '#3742fa';
      this.ctx.fillRect(obstacle.x + 10, obstacle.y, obstacle.width - 20, obstacle.height);
      this.ctx.fillStyle = '#5352ed';
      this.ctx.beginPath();
      this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
      this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
      this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private drawCollectible(collectible: Collectible): void {
    const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
    const cx = collectible.x + collectible.width / 2;
    const cy = collectible.y + collectible.height / 2;

    if (collectible.type === 'coin') {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, (collectible.width / 2) * pulse, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffed4a';
      this.ctx.beginPath();
      this.ctx.arc(cx - 3, cy - 3, 5, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = '#a855f7';
      this.ctx.beginPath();
      this.ctx.moveTo(cx, collectible.y);
      this.ctx.lineTo(cx + collectible.width / 2, cy);
      this.ctx.lineTo(cx, collectible.y + collectible.height);
      this.ctx.lineTo(cx - collectible.width / 2, cy);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#c084fc';
      this.ctx.beginPath();
      this.ctx.moveTo(cx, collectible.y + 5);
      this.ctx.lineTo(cx + 8, cy);
      this.ctx.lineTo(cx, cy - 5);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private drawReviveHint(player: Player, label: string): void {
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${label} 按 E 复活`, player.x + player.width / 2, player.y - 20);
  }

  getScore(): number {
    return Math.floor(this.score);
  }

  getPlayer1Alive(): boolean {
    return this.player1.isAlive;
  }

  getPlayer2Alive(): boolean {
    return this.player2.isAlive;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  isGameStarted(): boolean {
    return this.gameStarted;
  }

  isBothAlive(): boolean {
    return this.bothAlive;
  }
}
