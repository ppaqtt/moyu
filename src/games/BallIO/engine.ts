import { NEON_COLORS } from '../../utils/constants';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1800;
const BASE_RADIUS = 15;
const MIN_RADIUS = 10;
const MAX_RADIUS = 150;
const FOOD_COUNT = 200;
const AI_COUNT = 20;
const SPLIT_COOLDOWN = 300;
const EJECT_COOLDOWN = 10;

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Food extends Position {
  color: string;
  radius: number;
}

export interface Cell extends Position, Velocity {
  radius: number;
  mass: number;
}

export interface PlayerBall {
  cells: Cell[];
  color: string;
  name: string;
  score: number;
  splitCooldown: number;
  ejectCooldown: number;
}

export interface AIBall {
  id: number;
  x: number;
  y: number;
  radius: number;
  mass: number;
  vx: number;
  vy: number;
  color: string;
  name: string;
  targetX: number;
  targetY: number;
  changeTargetTimer: number;
}

export interface Virus extends Position {
  radius: number;
  color: string;
}

export interface BallGameState {
  player: PlayerBall;
  aiBalls: AIBall[];
  foods: Food[];
  viruses: Virus[];
  camera: Position;
  gameOver: boolean;
  rank: number;
}

const AI_NAMES = ['小球', '吞噬者', '巨兽', '泡泡', '圆圆', '大球', '球球', '吃货', '滚球', '气球', '汤圆', '珍珠', '宝石', '星球', '气球', '泡泡糖', '棉花糖', '雪球', '火球', '雷球'];

export class BallIOEngine {
  private player: PlayerBall;
  private aiBalls: AIBall[];
  private foods: Food[];
  private viruses: Virus[];
  private camera: Position;
  private gameOver: boolean;
  private mousePos: Position;
  private rank: number;

  constructor() {
    this.player = {
      cells: [],
      color: NEON_COLORS.neonCyan,
      name: '玩家',
      score: 0,
      splitCooldown: 0,
      ejectCooldown: 0
    };
    this.aiBalls = [];
    this.foods = [];
    this.viruses = [];
    this.camera = { x: 0, y: 0 };
    this.gameOver = false;
    this.mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    this.rank = 1;
    this.init();
  }

  init(): void {
    const startX = MAP_WIDTH / 2;
    const startY = MAP_HEIGHT / 2;

    this.player.cells = [{
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      radius: BASE_RADIUS,
      mass: BASE_RADIUS * BASE_RADIUS
    }];
    this.player.score = Math.floor(BASE_RADIUS * BASE_RADIUS / 100);
    this.player.splitCooldown = 0;
    this.player.ejectCooldown = 0;

    this.aiBalls = [];
    for (let i = 0; i < AI_COUNT; i++) {
      this.spawnAIBall(i);
    }

    this.foods = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      this.spawnFood();
    }

    this.viruses = [];
    for (let i = 0; i < 10; i++) {
      this.spawnVirus();
    }

    this.camera = { x: startX - CANVAS_WIDTH / 2, y: startY - CANVAS_HEIGHT / 2 };
    this.gameOver = false;
    this.rank = AI_COUNT + 1;
  }

  spawnAIBall(id: number): void {
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonPurple, NEON_COLORS.neonGreen, NEON_COLORS.gold, NEON_COLORS.danger, NEON_COLORS.warning];
    const radius = MIN_RADIUS + Math.random() * 40;

    this.aiBalls.push({
      id,
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT,
      radius,
      mass: radius * radius,
      vx: 0,
      vy: 0,
      color: colors[id % colors.length],
      name: AI_NAMES[id % AI_NAMES.length],
      targetX: Math.random() * MAP_WIDTH,
      targetY: Math.random() * MAP_HEIGHT,
      changeTargetTimer: 0
    });
  }

  spawnFood(): void {
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonCyan, NEON_COLORS.neonGreen, NEON_COLORS.gold, NEON_COLORS.neonPurple, NEON_COLORS.warning];
    this.foods.push({
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 3 + Math.random() * 3
    });
  }

  spawnVirus(): void {
    this.viruses.push({
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT,
      radius: 30,
      color: '#00ff00'
    });
  }

  updateMousePos(x: number, y: number): void {
    this.mousePos = { x, y };
  }

  split(): void {
    if (this.player.splitCooldown > 0) return;

    const newCells: Cell[] = [];
    this.player.cells.forEach(cell => {
      if (cell.radius >= 30 && this.player.cells.length + newCells.length < 16) {
        const newRadius = cell.radius / Math.sqrt(2);
        const angle = Math.atan2(this.mousePos.y - CANVAS_HEIGHT / 2, this.mousePos.x - CANVAS_WIDTH / 2);

        newCells.push({
          x: cell.x + Math.cos(angle) * cell.radius,
          y: cell.y + Math.sin(angle) * cell.radius,
          vx: Math.cos(angle) * 10,
          vy: Math.sin(angle) * 10,
          radius: newRadius,
          mass: newRadius * newRadius
        });

        cell.radius = newRadius;
        cell.mass = newRadius * newRadius;
        cell.vx = -Math.cos(angle) * 5;
        cell.vy = -Math.sin(angle) * 5;
      }
    });

    this.player.cells.push(...newCells);
    this.player.splitCooldown = SPLIT_COOLDOWN;
  }

  eject(): void {
    if (this.player.ejectCooldown > 0) return;

    this.player.cells.forEach(cell => {
      if (cell.radius > 20) {
        const angle = Math.atan2(this.mousePos.y - CANVAS_HEIGHT / 2, this.mousePos.x - CANVAS_WIDTH / 2);
        const ejectRadius = 5;
        cell.radius = Math.sqrt(cell.radius * cell.radius - ejectRadius * ejectRadius);
        cell.mass = cell.radius * cell.radius;

        this.foods.push({
          x: cell.x + Math.cos(angle) * (cell.radius + 10),
          y: cell.y + Math.sin(angle) * (cell.radius + 10),
          color: this.player.color,
          radius: ejectRadius
        });
      }
    });

    this.player.ejectCooldown = EJECT_COOLDOWN;
  }

  private updatePlayer(): void {
    if (this.player.splitCooldown > 0) this.player.splitCooldown--;
    if (this.player.ejectCooldown > 0) this.player.ejectCooldown--;

    const targetX = this.mousePos.x - CANVAS_WIDTH / 2 + this.camera.x;
    const targetY = this.mousePos.y - CANVAS_HEIGHT / 2 + this.camera.y;

    this.player.cells.forEach(cell => {
      const dx = targetX - cell.x;
      const dy = targetY - cell.y;
      const dist = Math.hypot(dx, dy);
      const maxSpeed = 200 / Math.sqrt(cell.radius);

      if (dist > 0) {
        const speed = Math.min(dist * 0.05, maxSpeed);
        cell.vx += (dx / dist) * speed * 0.1;
        cell.vy += (dy / dist) * speed * 0.1;
      }

      cell.vx *= 0.95;
      cell.vy *= 0.95;

      cell.x += cell.vx;
      cell.y += cell.vy;

      cell.x = Math.max(cell.radius, Math.min(MAP_WIDTH - cell.radius, cell.x));
      cell.y = Math.max(cell.radius, Math.min(MAP_HEIGHT - cell.radius, cell.y));
    });

    for (let i = 0; i < this.player.cells.length; i++) {
      for (let j = i + 1; j < this.player.cells.length; j++) {
        const cell1 = this.player.cells[i];
        const cell2 = this.player.cells[j];
        const dist = Math.hypot(cell1.x - cell2.x, cell1.y - cell2.y);
        const minDist = cell1.radius + cell2.radius;

        if (dist < minDist && this.player.splitCooldown <= 200) {
          const angle = Math.atan2(cell2.y - cell1.y, cell2.x - cell1.x);
          const overlap = minDist - dist;
          const moveX = Math.cos(angle) * overlap * 0.5;
          const moveY = Math.sin(angle) * overlap * 0.5;

          cell1.x -= moveX;
          cell1.y -= moveY;
          cell2.x += moveX;
          cell2.y += moveY;

          if (dist < 5 && Math.abs(cell1.radius - cell2.radius) < 5) {
            cell1.radius = Math.sqrt(cell1.radius * cell1.radius + cell2.radius * cell2.radius);
            cell1.mass = cell1.radius * cell1.radius;
            this.player.cells.splice(j, 1);
            j--;
          }
        }
      }
    }

    let totalMass = 0;
    this.player.cells.forEach(cell => {
      totalMass += cell.mass;
    });
    this.player.score = Math.floor(totalMass / 100);

    if (this.player.cells.length === 0 || this.player.cells.every(c => c.radius < MIN_RADIUS)) {
      this.gameOver = true;
    }
  }

  private updateAI(): void {
    this.aiBalls.forEach(ai => {
      ai.changeTargetTimer--;
      if (ai.changeTargetTimer <= 0) {
        ai.targetX = Math.random() * MAP_WIDTH;
        ai.targetY = Math.random() * MAP_HEIGHT;
        ai.changeTargetTimer = 60 + Math.random() * 120;
      }

      const dx = ai.targetX - ai.x;
      const dy = ai.targetY - ai.y;
      const dist = Math.hypot(dx, dy);
      const maxSpeed = 150 / Math.sqrt(ai.radius);

      if (dist > 0) {
        const speed = Math.min(dist * 0.02, maxSpeed);
        ai.vx += (dx / dist) * speed * 0.1;
        ai.vy += (dy / dist) * speed * 0.1;
      }

      ai.vx *= 0.95;
      ai.vy *= 0.95;

      ai.x += ai.vx;
      ai.y += ai.vy;

      ai.x = Math.max(ai.radius, Math.min(MAP_WIDTH - ai.radius, ai.x));
      ai.y = Math.max(ai.radius, Math.min(MAP_HEIGHT - ai.radius, ai.y));
    });
  }

  private checkCollisions(): void {
    this.player.cells.forEach(cell => {
      for (let i = this.foods.length - 1; i >= 0; i--) {
        const food = this.foods[i];
        const dist = Math.hypot(cell.x - food.x, cell.y - food.y);
        if (dist < cell.radius + food.radius) {
          const newMass = cell.mass + food.radius * food.radius;
          cell.radius = Math.sqrt(newMass);
          cell.mass = newMass;
          this.foods.splice(i, 1);
        }
      }
    });

    for (let i = this.aiBalls.length - 1; i >= 0; i--) {
      const ai = this.aiBalls[i];

      this.player.cells.forEach(cell => {
        const dist = Math.hypot(cell.x - ai.x, cell.y - ai.y);
        if (dist < cell.radius + ai.radius) {
          if (cell.radius > ai.radius * 1.2) {
            const newMass = cell.mass + ai.mass * 0.8;
            cell.radius = Math.sqrt(newMass);
            cell.mass = newMass;
            this.aiBalls.splice(i, 1);
            setTimeout(() => this.spawnAIBall(ai.id), 5000);
          } else if (ai.radius > cell.radius * 1.2) {
            ai.mass += cell.mass * 0.8;
            ai.radius = Math.sqrt(ai.mass);
            const cellIndex = this.player.cells.indexOf(cell);
            if (cellIndex > -1) {
              this.player.cells.splice(cellIndex, 1);
            }
          }
        }
      });
    }

    for (let i = 0; i < this.aiBalls.length; i++) {
      for (let j = i + 1; j < this.aiBalls.length; j++) {
        const ai1 = this.aiBalls[i];
        const ai2 = this.aiBalls[j];
        const dist = Math.hypot(ai1.x - ai2.x, ai1.y - ai2.y);

        if (dist < ai1.radius + ai2.radius) {
          if (ai1.radius > ai2.radius * 1.2) {
            ai1.mass += ai2.mass * 0.8;
            ai1.radius = Math.sqrt(ai1.mass);
            this.aiBalls.splice(j, 1);
            setTimeout(() => this.spawnAIBall(ai2.id), 5000);
            j--;
          } else if (ai2.radius > ai1.radius * 1.2) {
            ai2.mass += ai1.mass * 0.8;
            ai2.radius = Math.sqrt(ai2.mass);
            this.aiBalls.splice(i, 1);
            setTimeout(() => this.spawnAIBall(ai1.id), 5000);
            i--;
            break;
          }
        }
      }
    }

    this.player.cells.forEach(cell => {
      this.viruses.forEach(virus => {
        const dist = Math.hypot(cell.x - virus.x, cell.y - virus.y);
        if (dist < cell.radius + virus.radius && cell.radius > virus.radius * 1.2) {
          if (cell.radius > 60) {
            const newRadius = cell.radius / Math.sqrt(2);
            this.player.cells.push({
              x: cell.x + 20,
              y: cell.y,
              vx: 5,
              vy: 0,
              radius: newRadius,
              mass: newRadius * newRadius
            });
            cell.radius = newRadius;
            cell.mass = newRadius * newRadius;
            cell.vx = -5;
          }
        }
      });
    });
  }

  private updateFood(): void {
    if (this.foods.length < FOOD_COUNT) {
      this.spawnFood();
    }
  }

  private updateCamera(): void {
    if (this.player.cells.length > 0) {
      let totalX = 0, totalY = 0, totalMass = 0;
      this.player.cells.forEach(cell => {
        totalX += cell.x * cell.mass;
        totalY += cell.y * cell.mass;
        totalMass += cell.mass;
      });
      const centerX = totalX / totalMass;
      const centerY = totalY / totalMass;

      const zoom = Math.max(0.3, 1 - (Math.sqrt(totalMass) / 1000));
      this.camera.x += (centerX - CANVAS_WIDTH / 2 / zoom - this.camera.x) * 0.1;
      this.camera.y += (centerY - CANVAS_HEIGHT / 2 / zoom - this.camera.y) * 0.1;
    }
  }

  private calculateRank(): void {
    const playerMass = this.player.cells.reduce((sum, cell) => sum + cell.mass, 0);
    let rank = 1;
    this.aiBalls.forEach(ai => {
      if (ai.mass > playerMass) rank++;
    });
    this.rank = rank;
  }

  tick(): void {
    if (this.gameOver) return;

    this.updatePlayer();
    this.updateAI();
    this.checkCollisions();
    this.updateFood();
    this.updateCamera();
    this.calculateRank();
  }

  getState(): BallGameState {
    return {
      player: {
        ...this.player,
        cells: this.player.cells.map(c => ({ ...c }))
      },
      aiBalls: this.aiBalls.map(ai => ({ ...ai })),
      foods: [...this.foods],
      viruses: [...this.viruses],
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

  getMapSize(): { width: number; height: number } {
    return { width: MAP_WIDTH, height: MAP_HEIGHT };
  }
}
