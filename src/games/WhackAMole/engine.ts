export interface Hole {
  x: number;
  y: number;
  radius: number;
  hasMole: boolean;
  moleUp: boolean;
  moleY: number;
  moleState: 'hidden' | 'rising' | 'up' | 'falling';
  hitTime: number;
  spawnTime: number;
}

export interface Mole {
  x: number;
  y: number;
  size: number;
  isHit: boolean;
  score: number;
}

export interface HitEffect {
  x: number;
  y: number;
  time: number;
  score: number;
}

export interface WhackAMoleState {
  holes: Hole[];
  score: number;
  combo: number;
  timeLeft: number;
  isGameOver: boolean;
  hitEffects: HitEffect[];
  currentHole: number;
}

export interface WhackAMoleEngine {
  getState(): WhackAMoleState;
  handleClick(x: number, y: number): boolean;
  tick(): void;
  reset(): void;
  getScore(): number;
  getTimeLeft(): number;
  checkGameOver(): boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const HOLE_RADIUS = 50;
const MOLE_SIZE = 60;
const GAME_DURATION = 60;
const BASE_SCORE = 10;
const MISS_PENALTY = 5;
const COMBO_THRESHOLD = 3;
const COMBO_MULTIPLIER = 1.5;
const SPAWN_INTERVAL = 1200;
const MOLE_UP_DURATION = 1500;
const HIT_WINDOW = 500;

export class WhackAMoleEngine implements WhackAMoleEngine {
  private holes: Hole[] = [];
  private score: number = 0;
  private combo: number = 0;
  private timeLeft: number = GAME_DURATION;
  private gameOver: boolean = false;
  private hitEffects: HitEffect[] = [];
  private lastUpdate: number = 0;
  private lastSpawn: number = 0;
  private currentHole: number = -1;
  private gameStartTime: number = 0;
  private animationFrame: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.holes = [];
    const holeSpacingX = CANVAS_WIDTH / (GRID_COLS + 1);
    const holeSpacingY = CANVAS_HEIGHT / (GRID_ROWS + 1);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = holeSpacingX * (col + 1);
        const y = holeSpacingY * (row + 1);
        this.holes.push({
          x,
          y,
          radius: HOLE_RADIUS,
          hasMole: false,
          moleUp: false,
          moleY: 0,
          moleState: 'hidden',
          hitTime: 0,
          spawnTime: 0
        });
      }
    }

    this.score = 0;
    this.combo = 0;
    this.timeLeft = GAME_DURATION;
    this.gameOver = false;
    this.hitEffects = [];
    this.lastUpdate = Date.now();
    this.lastSpawn = Date.now();
    this.gameStartTime = Date.now();
    this.currentHole = -1;
    this.animationFrame = 0;
  }

  getState(): WhackAMoleState {
    return {
      holes: this.holes.map(h => ({ ...h })),
      score: this.score,
      combo: this.combo,
      timeLeft: this.timeLeft,
      isGameOver: this.gameOver,
      hitEffects: [...this.hitEffects],
      currentHole: this.currentHole
    };
  }

  getScore(): number {
    return this.score;
  }

  getTimeLeft(): number {
    return this.timeLeft;
  }

  checkGameOver(): boolean {
    return this.gameOver;
  }

  handleClick(x: number, y: number): boolean {
    if (this.gameOver) return false;

    for (let i = 0; i < this.holes.length; i++) {
      const hole = this.holes[i];
      const dx = x - hole.x;
      const dy = y - (hole.y + MOLE_SIZE / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MOLE_SIZE / 2 && hole.moleUp && hole.moleState !== 'falling') {
        hole.moleState = 'falling';
        hole.hitTime = Date.now();

        let points = BASE_SCORE;
        this.combo++;

        if (this.combo >= COMBO_THRESHOLD) {
          points = Math.floor(points * COMBO_MULTIPLIER);
        }

        this.score += points;

        this.hitEffects.push({
          x: hole.x,
          y: hole.y,
          time: Date.now(),
          score: points
        });

        this.currentHole = -1;

        return true;
      }
    }

    this.combo = 0;
    return false;
  }

  tick(): void {
    if (this.gameOver) return;

    const now = Date.now();
    this.animationFrame++;

    if (now - this.lastUpdate >= 1000) {
      this.timeLeft--;
      this.lastUpdate = now;

      if (this.timeLeft <= 0) {
        this.gameOver = true;
        return;
      }
    }

    if (now - this.lastSpawn > SPAWN_INTERVAL && this.currentHole === -1) {
      const availableHoles = this.holes
        .map((hole, index) => ({ hole, index }))
        .filter(({ hole }) => hole.moleState === 'hidden');

      if (availableHoles.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableHoles.length);
        const selectedHole = availableHoles[randomIndex];
        selectedHole.hole.moleState = 'rising';
        selectedHole.hole.spawnTime = now;
        this.currentHole = selectedHole.index;
        this.lastSpawn = now;
      }
    }

    for (const hole of this.holes) {
      if (hole.moleState === 'rising') {
        const elapsed = now - hole.spawnTime;
        const progress = Math.min(elapsed / 300, 1);
        hole.moleY = -MOLE_SIZE * progress;
        hole.moleUp = progress > 0.5;

        if (progress >= 1) {
          hole.moleState = 'up';
          hole.moleUp = true;
        }
      } else if (hole.moleState === 'up') {
        hole.moleY = 0;
        hole.moleUp = true;
        const elapsed = now - hole.spawnTime;

        if (elapsed > MOLE_UP_DURATION) {
          hole.moleState = 'falling';
          hole.hitTime = now;
          hole.moleUp = false;
        }
      } else if (hole.moleState === 'falling') {
        const elapsed = now - hole.hitTime;
        const progress = Math.min(elapsed / 300, 1);
        hole.moleY = -MOLE_SIZE * (1 - progress);

        if (progress >= 1) {
          hole.moleState = 'hidden';
          hole.moleY = -MOLE_SIZE;
          hole.moleUp = false;
          hole.hasMole = false;

          if (this.currentHole !== -1 && this.holes[this.currentHole] === hole) {
            this.currentHole = -1;
            this.combo = 0;
          }
        }
      }
    }

    this.hitEffects = this.hitEffects.filter(
      effect => now - effect.time < 1000
    );
  }

  reset(): void {
    this.init();
  }
}

export const createEngine = (): WhackAMoleEngine => {
  return new WhackAMoleEngine();
};
