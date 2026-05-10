// BlockBuilder Engine - 3D积木搭建物理引擎

export interface Block3D {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  color: string;
  fallen: boolean;
}

export interface BlockBuilderState {
  blocks: Block3D[];
  currentBlock: Block3D | null;
  score: number;
  level: number;
  phase: 'building' | 'dropping' | 'settling' | 'gameover';
  cameraAngle: number;
  cameraHeight: number;
  showShadow: boolean;
  nextColor: string;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BLOCK_SIZE = 50;
const GRAVITY = 0.5;
const GROUND_Y = 500;
const DROP_SPEED = 8;
const SETTLE_THRESHOLD = 0.1;

const BLOCK_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dfe6e9', '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7'
];

export class BlockBuilderEngine {
  private blocks: Block3D[] = [];
  private currentBlock: Block3D | null = null;
  private score: number = 0;
  private level: number = 1;
  private phase: 'building' | 'dropping' | 'settling' | 'gameover' = 'building';
  private cameraAngle: number = 0;
  private cameraHeight: number = 400;
  private nextColor: string;
  private animationTimer: number = 0;

  constructor() {
    this.nextColor = this.getRandomColor();
    this.spawnNewBlock();
  }

  private getRandomColor(): string {
    return BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  }

  private spawnNewBlock(): void {
    const isWide = Math.random() > 0.5;
    const isLong = Math.random() > 0.5;
    
    const width = isWide ? BLOCK_SIZE * 2 : BLOCK_SIZE;
    const depth = isLong ? BLOCK_SIZE * 2 : BLOCK_SIZE;
    
    const offsetX = (Math.random() - 0.5) * 30;
    
    this.currentBlock = {
      x: CANVAS_WIDTH / 2 + offsetX - width / 2,
      y: 50,
      z: this.blocks.length === 0 ? 0 : this.blocks.length * 5,
      width,
      height: BLOCK_SIZE / 2,
      depth,
      color: this.nextColor,
      fallen: false
    };
    
    this.nextColor = this.getRandomColor();
  }

  getState(): BlockBuilderState {
    return {
      blocks: this.blocks.map(b => ({ ...b })),
      currentBlock: this.currentBlock ? { ...this.currentBlock } : null,
      score: this.score,
      level: this.level,
      phase: this.phase,
      cameraAngle: this.cameraAngle,
      cameraHeight: this.cameraHeight,
      showShadow: true,
      nextColor: this.nextColor
    };
  }

  tick(): void {
    this.animationTimer++;
    this.cameraAngle = Math.sin(this.animationTimer * 0.01) * 15;
    
    if (this.phase === 'dropping' && this.currentBlock) {
      this.currentBlock.y += DROP_SPEED;
      
      const topBlock = this.blocks.length > 0 
        ? this.blocks[this.blocks.length - 1] 
        : null;
      
      const stackY = topBlock 
        ? topBlock.y - topBlock.height / 2 - this.currentBlock.height / 2 
        : GROUND_Y - this.currentBlock.height / 2;
      
      if (this.currentBlock.y >= stackY) {
        this.currentBlock.y = stackY;
        this.phase = 'settling';
        
        const prevBlock = topBlock;
        if (prevBlock) {
          this.calculateOverlap();
        }
        
        this.blocks.push(this.currentBlock);
        this.currentBlock = null;
        this.level++;
        this.score += 10;
      }
    }
    
    if (this.phase === 'settling') {
      this.phase = 'building';
      this.spawnNewBlock();
    }
    
    if (this.phase === 'building') {
      this.cameraHeight = Math.max(200, 500 - this.blocks.length * 20);
    }
  }

  private calculateOverlap(): void {
    if (!this.currentBlock || this.blocks.length < 2) return;
    
    const current = this.currentBlock;
    const prev = this.blocks[this.blocks.length - 2];
    
    const prevTop = {
      left: prev.x,
      right: prev.x + prev.width,
      front: prev.z,
      back: prev.z + prev.depth
    };
    
    const currBottom = {
      left: current.x,
      right: current.x + current.width,
      front: current.z,
      back: current.z + current.depth
    };
    
    const overlapLeft = Math.max(prevTop.left, currBottom.left);
    const overlapRight = Math.min(prevTop.right, currBottom.right);
    const overlapFront = Math.max(prevTop.front, currBottom.front);
    const overlapBack = Math.min(prevTop.back, currBottom.back);
    
    const overlapWidth = overlapRight - overlapLeft;
    const overlapDepth = overlapBack - overlapFront;
    
    if (overlapWidth <= 0 || overlapDepth <= 0) {
      current.fallen = true;
      this.phase = 'gameover';
      return;
    }
    
    const areaRatio = (overlapWidth * overlapDepth) / (current.width * current.depth);
    
    if (areaRatio < 0.3) {
      this.phase = 'gameover';
      return;
    }
    
    const newWidth = overlapWidth;
    const newDepth = overlapDepth;
    
    const centerX = (overlapLeft + overlapRight) / 2;
    const centerZ = (overlapFront + overlapBack) / 2;
    
    current.x = centerX - newWidth / 2;
    current.z = centerZ - newDepth / 2;
    current.width = newWidth;
    current.depth = newDepth;
    
    if (areaRatio > 0.9) {
      this.score += 20;
    } else if (areaRatio > 0.7) {
      this.score += 15;
    } else {
      this.score += 10;
    }
  }

  drop(): void {
    if (this.phase === 'building' && this.currentBlock) {
      this.phase = 'dropping';
    }
  }

  moveBlock(direction: 'left' | 'right' | 'forward' | 'back'): void {
    if (this.phase !== 'building' || !this.currentBlock) return;
    
    const speed = 5;
    switch (direction) {
      case 'left':
        this.currentBlock.x -= speed;
        break;
      case 'right':
        this.currentBlock.x += speed;
        break;
      case 'forward':
        this.currentBlock.z -= speed;
        break;
      case 'back':
        this.currentBlock.z += speed;
        break;
    }
  }

  reset(): void {
    this.blocks = [];
    this.currentBlock = null;
    this.score = 0;
    this.level = 1;
    this.phase = 'building';
    this.cameraAngle = 0;
    this.cameraHeight = 400;
    this.animationTimer = 0;
    this.nextColor = this.getRandomColor();
    this.spawnNewBlock();
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
