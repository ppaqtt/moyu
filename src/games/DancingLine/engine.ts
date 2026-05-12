import { DANCING_LINE_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, LINE_WIDTH, NODE_RADIUS, SEGMENT_LENGTH } = DANCING_LINE_CONSTANTS;

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  start: Point;
  end: Point;
  direction: number;
}

export interface Node {
  x: number;
  y: number;
  radius: number;
  hit: boolean;
  timing: number;
  type: 'normal' | 'jump';
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'static' | 'moving';
  direction?: number;
  speed?: number;
  color: string;
}

export interface GameDancingState {
  lineSegments: Segment[];
  headPosition: Point;
  direction: number;
  nodes: Node[];
  obstacles: Obstacle[];
  score: number;
  distanceScore: number;
  perfectScore: number;
  combo: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
  beatPhase: number;
  currentNodeIndex: number;
  pathProgress: number;
}

type Direction = 'left' | 'right' | 'straight';

const BEAT_INTERVAL = 500;
const PERFECT_WINDOW = 100;
const GOOD_WINDOW = 200;
const LINE_SPEED = 3;
const PATH_GENERATION_LENGTH = 2000;

export class DancingLineEngine {
  private lineSegments: Segment[] = [];
  private headPosition: Point;
  private direction: number;
  private nodes: Node[] = [];
  private obstacles: Obstacle[] = [];
  private score: number = 0;
  private distanceScore: number = 0;
  private perfectScore: number = 0;
  private combo: number = 0;
  private lives: number = 3;
  private isGameOver: boolean = false;
  private isPlaying: boolean = false;
  private beatPhase: number = 0;
  private currentNodeIndex: number = 0;
  private pathProgress: number = 0;
  private lastBeatTime: number = 0;
  private pathPoints: Point[] = [];
  private pathIndex: number = 0;
  private beatInterval: number = BEAT_INTERVAL;
  private directionChanges: number[] = [];
  private nextDirectionChange: number = 0;

  constructor() {
    this.headPosition = { x: 100, y: CANVAS_HEIGHT / 2 };
    this.direction = 0;
    this.generateInitialPath();
    this.generateObstacles();
    this.generateNodes();
  }

  private generateInitialPath(): void {
    this.pathPoints = [];
    let x = 50;
    let y = CANVAS_HEIGHT / 2;
    this.directionChanges = [];

    for (let i = 0; i < PATH_GENERATION_LENGTH; i++) {
      this.pathPoints.push({ x, y });

      if (i > 0 && i % 8 === 0) {
        this.directionChanges.push(i);
      }

      const beatProgress = (i % 8) / 8;
      const wave = Math.sin(beatProgress * Math.PI * 2) * 30;
      const turn = Math.random() > 0.7 ? (Math.random() - 0.5) * 0.5 : 0;

      x += SEGMENT_LENGTH * 0.5;
      y += turn * SEGMENT_LENGTH + wave * 0.1;

      y = Math.max(100, Math.min(CANVAS_HEIGHT - 100, y));
    }

    this.nextDirectionChange = this.directionChanges[0] || 100;
  }

  private generateObstacles(): void {
    this.obstacles = [];
    const colors = ['#ff6b6b', '#ee5a5a', '#ff4757', '#ff3838'];

    for (let i = 50; i < PATH_GENERATION_LENGTH; i += 15 + Math.floor(Math.random() * 10)) {
      const pathPoint = this.pathPoints[i];
      if (!pathPoint) continue;

      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 200;

      const obstacleWidth = 30 + Math.random() * 40;
      const obstacleHeight = 30 + Math.random() * 40;

      this.obstacles.push({
        x: pathPoint.x + offsetX - obstacleWidth / 2,
        y: pathPoint.y + offsetY - obstacleHeight / 2,
        width: obstacleWidth,
        height: obstacleHeight,
        type: Math.random() > 0.7 ? 'moving' : 'static',
        direction: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private generateNodes(): void {
    this.nodes = [];

    for (let i = 20; i < PATH_GENERATION_LENGTH; i += 20 + Math.floor(Math.random() * 15)) {
      const pathPoint = this.pathPoints[i];
      if (!pathPoint) continue;

      const isJump = Math.random() > 0.7;

      this.nodes.push({
        x: pathPoint.x,
        y: pathPoint.y,
        radius: NODE_RADIUS,
        hit: false,
        timing: i,
        type: isJump ? 'jump' : 'normal'
      });
    }
  }

  getState(): GameDancingState {
    return {
      lineSegments: this.lineSegments.map(s => ({ ...s })),
      headPosition: { ...this.headPosition },
      direction: this.direction,
      nodes: this.nodes.map(n => ({ ...n })),
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distanceScore: this.distanceScore,
      perfectScore: this.perfectScore,
      combo: this.combo,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      beatPhase: this.beatPhase,
      currentNodeIndex: this.currentNodeIndex,
      pathProgress: this.pathProgress
    };
  }

  start(): void {
    if (!this.isPlaying && !this.isGameOver) {
      this.isPlaying = true;
      this.lastBeatTime = Date.now();
    }
  }

  turnLeft(): void {
    if (!this.isPlaying) this.start();
    this.direction -= 0.3;
  }

  turnRight(): void {
    if (!this.isPlaying) this.start();
    this.direction += 0.3;
  }

  jump(): void {
    if (!this.isPlaying) this.start();
    this.headPosition.y -= 50;
    this.direction += 0.1;
  }

  tryHitNode(): { hit: boolean; perfect: boolean; node: Node | null } {
    const nearbyNodes = this.nodes.filter(
      n => !n.hit && Math.abs(n.x - this.headPosition.x) < 100
    );

    if (nearbyNodes.length === 0) {
      return { hit: false, perfect: false, node: null };
    }

    const closestNode = nearbyNodes.reduce((closest, node) => {
      const distToClosest = Math.abs(closest.x - this.headPosition.x);
      const distToNode = Math.abs(node.x - this.headPosition.x);
      return distToNode < distToClosest ? node : closest;
    });

    const distance = Math.abs(closestNode.x - this.headPosition.x);
    const isPerfect = distance < PERFECT_WINDOW;
    const isGood = distance < GOOD_WINDOW;

    if (isGood) {
      closestNode.hit = true;

      if (closestNode.type === 'jump') {
        this.jump();
      }

      if (isPerfect) {
        this.perfectScore += 100;
        this.combo++;
        this.score += 100 * this.combo;
        return { hit: true, perfect: true, node: closestNode };
      } else {
        this.combo = Math.max(1, this.combo);
        this.score += 50 * this.combo;
        return { hit: true, perfect: false, node: closestNode };
      }
    }

    return { hit: false, perfect: false, node: null };
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();
    if (now - this.lastBeatTime > this.beatInterval) {
      this.beatPhase = (this.beatPhase + 1) % 8;
      this.lastBeatTime = now;
    }

    const speed = LINE_SPEED + this.beatPhase * 0.1;

    if (this.pathIndex < this.pathPoints.length - 1) {
      const targetPoint = this.pathPoints[this.pathIndex + 1];
      if (targetPoint) {
        const dx = targetPoint.x - this.headPosition.x;
        const dy = targetPoint.y - this.headPosition.y;
        const targetDirection = Math.atan2(dy, dx);

        let angleDiff = targetDirection - this.direction;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.direction += angleDiff * 0.1;

        this.headPosition.x += Math.cos(this.direction) * speed;
        this.headPosition.y += Math.sin(this.direction) * speed;

        const prevSegment = this.lineSegments[this.lineSegments.length - 1];
        if (!prevSegment || 
            Math.abs(prevSegment.end.x - this.headPosition.x) > 1 ||
            Math.abs(prevSegment.end.y - this.headPosition.y) > 1) {
          this.lineSegments.push({
            start: prevSegment?.end || this.headPosition,
            end: { ...this.headPosition },
            direction: this.direction
          });

          if (this.lineSegments.length > 200) {
            this.lineSegments.shift();
          }
        }

        this.pathIndex++;
        this.distanceScore += 1;
        this.score += Math.floor(this.distanceScore / 100);
      }
    }

    this.checkCollisions();
    this.updateMovingObstacles();
    this.checkNodes();
  }

  private checkCollisions(): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.x < this.headPosition.x + LINE_WIDTH &&
          obstacle.x + obstacle.width > this.headPosition.x - LINE_WIDTH &&
          obstacle.y < this.headPosition.y + LINE_WIDTH &&
          obstacle.y + obstacle.height > this.headPosition.y - LINE_WIDTH) {
        this.lives--;
        this.combo = 0;
        this.headPosition.y -= 30;

        if (this.lives <= 0) {
          this.isGameOver = true;
          this.isPlaying = false;
        }
        break;
      }
    }
  }

  private updateMovingObstacles(): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.type === 'moving' && obstacle.direction !== undefined && obstacle.speed !== undefined) {
        obstacle.x += Math.cos(obstacle.direction) * obstacle.speed;
        obstacle.y += Math.sin(obstacle.direction) * obstacle.speed;

        if (obstacle.x < 0 || obstacle.x > CANVAS_WIDTH - obstacle.width) {
          obstacle.direction = Math.PI - obstacle.direction;
        }
        if (obstacle.y < 0 || obstacle.y > CANVAS_HEIGHT - obstacle.height) {
          obstacle.direction = -obstacle.direction;
        }
      }
    }
  }

  private checkNodes(): void {
    for (let i = this.currentNodeIndex; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.x < this.headPosition.x - 150 && !node.hit) {
        this.combo = 0;
        this.currentNodeIndex = i;
        break;
      }
      if (node.x >= this.headPosition.x - 150) {
        break;
      }
    }
  }

  reset(): void {
    this.lineSegments = [];
    this.headPosition = { x: 100, y: CANVAS_HEIGHT / 2 };
    this.direction = 0;
    this.nodes = [];
    this.obstacles = [];
    this.score = 0;
    this.distanceScore = 0;
    this.perfectScore = 0;
    this.combo = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isPlaying = false;
    this.beatPhase = 0;
    this.currentNodeIndex = 0;
    this.pathProgress = 0;
    this.pathIndex = 0;
    this.lastBeatTime = 0;

    this.generateInitialPath();
    this.generateObstacles();
    this.generateNodes();
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getLives(): number {
    return this.lives;
  }

  getCombo(): number {
    return this.combo;
  }
}
