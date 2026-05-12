export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'brush' | 'eraser' | 'spray' | 'marker';
  opacity: number;
}

export interface SimpleDrawState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  isDrawing: boolean;
  backgroundColor: string;
}

export const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088',
  '#8800ff', '#00ff88', '#ff4444', '#44ff44', '#4444ff',
  '#ffd700', '#ff6b9d', '#a855f7', '#22c55e', '#3b82f6',
  '#f97316', '#14b8a6', '#ec4899', '#8b5cf6', '#06b6d4'
];

export const BRUSH_SIZES = [1, 2, 4, 8, 12, 16, 24, 32];

export const BACKGROUNDS = [
  { name: '白色', color: '#ffffff' },
  { name: '黑色', color: '#1a1a2e' },
  { name: '网格', color: 'grid' },
  { name: '点阵', color: 'dots' },
  { name: '横线', color: 'lines' }
];

export class SimpleDrawEngine {
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private isDrawing: boolean = false;
  private currentColor: string = '#000000';
  private currentWidth: number = 4;
  private currentTool: 'brush' | 'eraser' | 'spray' | 'marker' = 'brush';
  private currentOpacity: number = 1;
  private backgroundColor: string = '#ffffff';

  constructor() {
    this.init();
  }

  init(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.currentColor = '#000000';
    this.currentWidth = 4;
    this.currentTool = 'brush';
    this.currentOpacity = 1;
    this.backgroundColor = '#ffffff';
  }

  getState(): SimpleDrawState {
    return {
      strokes: [...this.strokes],
      currentStroke: this.currentStroke,
      isDrawing: this.isDrawing,
      backgroundColor: this.backgroundColor
    };
  }

  startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.currentStroke = {
      points: [{ x, y }],
      color: this.currentTool === 'eraser' ? this.backgroundColor : this.currentColor,
      width: this.currentWidth,
      tool: this.currentTool,
      opacity: this.currentOpacity
    };
  }

  continueDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.currentStroke) return;

    if (this.currentTool === 'spray') {
      for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * this.currentWidth * 2;
        const offsetY = (Math.random() - 0.5) * this.currentWidth * 2;
        this.currentStroke.points.push({ x: x + offsetX, y: y + offsetY });
      }
    } else {
      this.currentStroke.points.push({ x, y });
    }
  }

  endDrawing(): void {
    if (!this.isDrawing || !this.currentStroke) return;

    this.isDrawing = false;
    if (this.currentStroke.points.length > 0) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
  }

  setColor(color: string): void {
    this.currentColor = color;
    if (this.currentTool === 'eraser') {
      this.currentTool = 'brush';
    }
  }

  setWidth(width: number): void {
    this.currentWidth = width;
  }

  setTool(tool: 'brush' | 'eraser' | 'spray' | 'marker'): void {
    this.currentTool = tool;
    if (tool === 'marker') {
      this.currentOpacity = 0.5;
    } else {
      this.currentOpacity = 1;
    }
  }

  setOpacity(opacity: number): void {
    this.currentOpacity = opacity;
  }

  setBackground(color: string): void {
    this.backgroundColor = color;
  }

  undo(): void {
    if (this.strokes.length > 0) {
      this.strokes.pop();
    }
  }

  redo(): void {
  }

  clear(): void {
    this.strokes = [];
    this.currentStroke = null;
  }

  saveDrawing(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    this.drawOnContext(ctx);

    return canvas.toDataURL('image/png');
  }

  drawOnContext(ctx: CanvasRenderingContext2D): void {
    for (const stroke of this.strokes) {
      this.drawStroke(ctx, stroke);
    }
    if (this.currentStroke) {
      this.drawStroke(ctx, this.currentStroke);
    }
  }

  private drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    if (stroke.points.length < 1) return;

    ctx.save();
    ctx.globalAlpha = stroke.opacity;

    if (stroke.tool === 'spray') {
      ctx.fillStyle = stroke.color;
      for (const point of stroke.points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, stroke.width / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (this.backgroundColor === 'grid') {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (this.backgroundColor === 'dots') {
      ctx.fillStyle = '#e0e0e0';
      const dotSize = 2;
      const spacing = 20;
      for (let x = spacing; x < width; x += spacing) {
        for (let y = spacing; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (this.backgroundColor === 'lines') {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const lineHeight = 30;
      for (let y = lineHeight; y < height; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
  }

  reset(): void {
    this.init();
  }
}
