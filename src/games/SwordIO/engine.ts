import { NEON_COLORS } from '../../utils/constants';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_RADIUS = 15;
const SWORD_LENGTH = 60;
const SWORD_WIDTH = 8;
const PLAYER_SPEED = 4;
const ROTATION_SPEED = 0.15;
const AI_COUNT = 15;
const SWORD_DAMAGE = 25;
const MAX_HEALTH = 100;

export interface Position {
  x: number;
  y: number;
}

export interface Sword {
  angle: number;
  length: number;
  width: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  name: string;
  health: number;
  maxHealth: number;
  sword: Sword;
  score: number;
  isDead: boolean;
  kills: number;
}

export interface AIPlayer {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  name: string;
  health: number;
  maxHealth: number;
  sword: Sword;
  score: number;
  isDead: boolean;
  kills: number;
  targetAngle: number;
  changeDirTimer: number;
  attackCooldown: number;
}

export interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SwordGameState {
  player: Player;
  aiPlayers: AIPlayer[];
  particles: Particle[];
  camera: Position;
  gameOver: boolean;
  rank: number;
}

const AI_NAMES = ['剑客', '刀客', '武士', '骑士', '刺客', '忍者', '战士', '勇士', '斗士', '猛将', '英雄', '豪杰', '侠客', '游侠', '武者'];

export class SwordIOEngine {
  private player: Player;
  private aiPlayers: AIPlayer[];
  private particles: Particle[];
  private camera: Position;
  private gameOver: boolean;
  private keys: { [key: string]: boolean };
  private mousePos: Position;
  private rank: number;

  constructor() {
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: PLAYER_RADIUS,
      color: NEON_COLORS.neonCyan,
      name: '玩家',
      health: MAX_HEALTH,
      maxHealth: MAX_HEALTH,
      sword: { angle: 0, length: SWORD_LENGTH, width: SWORD_WIDTH },
      score: 0,
      isDead: false,
      kills: 0
    };
    this.aiPlayers = [];
    this.particles = [];
    this.camera = { x: 0, y: 0 };
    this.gameOver = false;
    this.keys = {};
    this.mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    this.rank = 1;
    this.init();
  }

  init(): void {
    this.player.x = CANVAS_WIDTH / 2;
    this.player.y = CANVAS_HEIGHT / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.health = MAX_HEALTH;
    this.player.sword = { angle: 0, length: SWORD_LENGTH, width: SWORD_WIDTH };
    this.player.score = 0;
    this.player.isDead = false;
    this.player.kills = 0;

    this.aiPlayers = [];
    for (let i = 0; i < AI_COUNT; i++) {
      this.spawnAIPlayer(i);
    }

    this.particles = [];
    this.camera = { x: 0, y: 0 };
    this.gameOver = false;
    this.rank = AI_COUNT + 1;
  }

  spawnAIPlayer(id: number): void {
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonPurple, NEON_COLORS.neonGreen, NEON_COLORS.gold, NEON_COLORS.danger, NEON_COLORS.warning];
    const angle = (id / AI_COUNT) * Math.PI * 2;
    const distance = 200 + Math.random() * 200;

    this.aiPlayers.push({
      id,
      x: CANVAS_WIDTH / 2 + Math.cos(angle) * distance,
      y: CANVAS_HEIGHT / 2 + Math.sin(angle) * distance,
      vx: 0,
      vy: 0,
      radius: PLAYER_RADIUS,
      color: colors[id % colors.length],
      name: AI_NAMES[id % AI_NAMES.length],
      health: MAX_HEALTH,
      maxHealth: MAX_HEALTH,
      sword: { angle: Math.random() * Math.PI * 2, length: SWORD_LENGTH, width: SWORD_WIDTH },
      score: 0,
      isDead: false,
      kills: 0,
      targetAngle: Math.random() * Math.PI * 2,
      changeDirTimer: 0,
      attackCooldown: 0
    });
  }

  createParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  setKey(key: string, pressed: boolean): void {
    this.keys[key] = pressed;
  }

  updateMousePos(x: number, y: number): void {
    this.mousePos = { x, y };
  }

  private getSwordTip(player: { x: number; y: number; sword: Sword }): Position {
    return {
      x: player.x + Math.cos(player.sword.angle) * player.sword.length,
      y: player.y + Math.sin(player.sword.angle) * player.sword.length
    };
  }

  private getSwordBase(player: { x: number; y: number; sword: Sword }): Position {
    return {
      x: player.x + Math.cos(player.sword.angle) * player.radius,
      y: player.y + Math.sin(player.sword.angle) * player.radius
    };
  }

  private lineCircleCollision(lineStart: Position, lineEnd: Position, circle: Position, radius: number): boolean {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const fx = lineStart.x - circle.x;
    const fy = lineStart.y - circle.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return false;

    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }

  private updatePlayer(): void {
    if (this.player.isDead) return;

    let dx = 0;
    let dy = 0;

    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy = -1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy = 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx = -1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx = 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
    }

    this.player.vx += dx * 0.5;
    this.player.vy += dy * 0.5;
    this.player.vx *= 0.9;
    this.player.vy *= 0.9;

    this.player.x += this.player.vx * PLAYER_SPEED;
    this.player.y += this.player.vy * PLAYER_SPEED;

    this.player.x = Math.max(this.player.radius, Math.min(CANVAS_WIDTH - this.player.radius, this.player.x));
    this.player.y = Math.max(this.player.radius, Math.min(CANVAS_HEIGHT - this.player.radius, this.player.y));

    const targetAngle = Math.atan2(this.mousePos.y - CANVAS_HEIGHT / 2, this.mousePos.x - CANVAS_WIDTH / 2);
    let angleDiff = targetAngle - this.player.sword.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.player.sword.angle += angleDiff * ROTATION_SPEED;
  }

  private updateAI(): void {
    this.aiPlayers.forEach(ai => {
      if (ai.isDead) return;

      ai.changeDirTimer--;
      ai.attackCooldown--;

      if (ai.changeDirTimer <= 0) {
        ai.targetAngle = Math.random() * Math.PI * 2;
        ai.changeDirTimer = 30 + Math.random() * 60;
      }

      let angleDiff = ai.targetAngle - ai.sword.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      ai.sword.angle += angleDiff * ROTATION_SPEED * 0.5;

      const moveAngle = ai.sword.angle + Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      ai.vx += Math.cos(moveAngle) * 0.3;
      ai.vy += Math.sin(moveAngle) * 0.3;
      ai.vx *= 0.9;
      ai.vy *= 0.9;

      ai.x += ai.vx * PLAYER_SPEED * 0.8;
      ai.y += ai.vy * PLAYER_SPEED * 0.8;

      ai.x = Math.max(ai.radius, Math.min(CANVAS_WIDTH - ai.radius, ai.x));
      ai.y = Math.max(ai.radius, Math.min(CANVAS_HEIGHT - ai.radius, ai.y));
    });
  }

  private checkCollisions(): void {
    if (this.player.isDead) return;

    const playerSwordTip = this.getSwordTip(this.player);
    const playerSwordBase = this.getSwordBase(this.player);

    for (const ai of this.aiPlayers) {
      if (ai.isDead) continue;

      const aiSwordTip = this.getSwordTip(ai);
      const aiSwordBase = this.getSwordBase(ai);

      if (this.lineCircleCollision(playerSwordBase, playerSwordTip, { x: ai.x, y: ai.y }, ai.radius)) {
        ai.health -= SWORD_DAMAGE;
        this.createParticles(ai.x, ai.y, ai.color, 5);

        if (ai.health <= 0) {
          ai.isDead = true;
          this.player.kills++;
          this.player.score += 100;
          this.createParticles(ai.x, ai.y, ai.color, 15);
          setTimeout(() => this.respawnAI(ai.id), 3000);
        }
      }

      if (this.lineCircleCollision(aiSwordBase, aiSwordTip, { x: this.player.x, y: this.player.y }, this.player.radius)) {
        this.player.health -= SWORD_DAMAGE;
        this.createParticles(this.player.x, this.player.y, this.player.color, 5);

        if (this.player.health <= 0) {
          this.player.isDead = true;
          this.gameOver = true;
          this.createParticles(this.player.x, this.player.y, this.player.color, 20);
        }
      }

      for (const otherAI of this.aiPlayers) {
        if (otherAI.id === ai.id || otherAI.isDead) continue;

        const otherSwordTip = this.getSwordTip(otherAI);
        const otherSwordBase = this.getSwordBase(otherAI);

        if (this.lineCircleCollision(aiSwordBase, aiSwordTip, { x: otherAI.x, y: otherAI.y }, otherAI.radius)) {
          otherAI.health -= SWORD_DAMAGE;
          if (otherAI.health <= 0) {
            otherAI.isDead = true;
            ai.kills++;
            ai.score += 100;
            this.createParticles(otherAI.x, otherAI.y, otherAI.color, 15);
            setTimeout(() => this.respawnAI(otherAI.id), 3000);
          }
        }
      }
    }
  }

  private respawnAI(id: number): void {
    const ai = this.aiPlayers.find(a => a.id === id);
    if (ai) {
      ai.isDead = false;
      ai.health = MAX_HEALTH;
      ai.score = Math.max(0, ai.score - 50);
      ai.kills = 0;

      const angle = Math.random() * Math.PI * 2;
      const distance = 200 + Math.random() * 200;
      ai.x = CANVAS_WIDTH / 2 + Math.cos(angle) * distance;
      ai.y = CANVAS_HEIGHT / 2 + Math.sin(angle) * distance;
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private calculateRank(): void {
    const scores = [
      { id: -1, score: this.player.score },
      ...this.aiPlayers.map(ai => ({ id: ai.id, score: ai.score }))
    ];

    scores.sort((a, b) => b.score - a.score);
    this.rank = scores.findIndex(s => s.id === -1) + 1;
  }

  tick(): void {
    if (this.gameOver) return;

    this.updatePlayer();
    this.updateAI();
    this.checkCollisions();
    this.updateParticles();
    this.calculateRank();
  }

  getState(): SwordGameState {
    return {
      player: { ...this.player },
      aiPlayers: this.aiPlayers.map(ai => ({ ...ai })),
      particles: [...this.particles],
      camera: { ...this.camera },
      gameOver: this.gameOver,
      rank: this.rank
    };
  }

  reset(): void {
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
