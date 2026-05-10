export interface Frame {
  id: string;
  imageData: ImageData | null;
  duration: number;
}

export interface GifMakerState {
  frames: Frame[];
  currentFrameIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  isPlaying: boolean;
  fps: number;
  selectedTool: 'pencil' | 'eraser' | 'fill';
  selectedColor: string;
  brushSize: number;
}

export const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#ff0088', '#8800ff', '#00ff88', '#ff4444', '#44ff44', '#4444ff', '#ffd700'
];

export const DEFAULT_FPS = 12;
export const MIN_FPS = 1;
export const MAX_FPS = 30;
export const DEFAULT_FRAME_DURATION = 1000 / DEFAULT_FPS;

export class GifMakerEngine {
  private frames: Frame[] = [];
  private currentFrameIndex: number = 0;
  private canvasWidth: number = 200;
  private canvasHeight: number = 200;
  private isPlaying: boolean = false;
  private fps: number = DEFAULT_FPS;
  private selectedTool: 'pencil' | 'eraser' | 'fill' = 'pencil';
  private selectedColor: string = '#000000';
  private brushSize: number = 4;
  private currentPoints: { x: number; y: number }[] = [];
  private animationId: number | null = null;

  constructor() {
    this.init();
  }

  init(): void {
    this.frames = [this.createEmptyFrame()];
    this.currentFrameIndex = 0;
    this.canvasWidth = 200;
    this.canvasHeight = 200;
    this.isPlaying = false;
    this.fps = DEFAULT_FPS;
    this.selectedTool = 'pencil';
    this.selectedColor = '#000000';
    this.brushSize = 4;
    this.currentPoints = [];
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private createEmptyFrame(): Frame {
    return {
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageData: null,
      duration: DEFAULT_FRAME_DURATION
    };
  }

  getState(): GifMakerState {
    return {
      frames: [...this.frames],
      currentFrameIndex: this.currentFrameIndex,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      isPlaying: this.isPlaying,
      fps: this.fps,
      selectedTool: this.selectedTool,
      selectedColor: this.selectedColor,
      brushSize: this.brushSize
    };
  }

  setTool(tool: 'pencil' | 'eraser' | 'fill'): void {
    this.selectedTool = tool;
  }

  setColor(color: string): void {
    this.selectedColor = color;
  }

  setBrushSize(size: number): void {
    this.brushSize = size;
  }

  setFps(fps: number): void {
    this.fps = Math.max(MIN_FPS, Math.min(MAX_FPS, fps));
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.frames = [this.createEmptyFrame()];
    this.currentFrameIndex = 0;
  }

  getCurrentFrame(): Frame | null {
    return this.frames[this.currentFrameIndex] || null;
  }

  getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  setCurrentFrameIndex(index: number): void {
    if (index >= 0 && index < this.frames.length) {
      this.currentFrameIndex = index;
    }
  }

  addFrame(afterCurrent: boolean = true): void {
    const newFrame = this.createEmptyFrame();
    if (afterCurrent) {
      this.frames.splice(this.currentFrameIndex + 1, 0, newFrame);
      this.currentFrameIndex++;
    } else {
      this.frames.push(newFrame);
      this.currentFrameIndex = this.frames.length - 1;
    }
  }

  duplicateFrame(index: number): void {
    if (index < 0 || index >= this.frames.length) return;

    const sourceFrame = this.frames[index];
    const newFrame: Frame = {
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageData: sourceFrame.imageData ? 
        new ImageData(
          new Uint8ClampedArray(sourceFrame.imageData.data),
          sourceFrame.imageData.width,
          sourceFrame.imageData.height
        ) : null,
      duration: sourceFrame.duration
    };

    this.frames.splice(index + 1, 0, newFrame);
    this.currentFrameIndex = index + 1;
  }

  deleteFrame(index: number): void {
    if (this.frames.length <= 1) return;
    if (index < 0 || index >= this.frames.length) return;

    this.frames.splice(index, 1);
    if (this.currentFrameIndex >= this.frames.length) {
      this.currentFrameIndex = this.frames.length - 1;
    }
  }

  moveFrame(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.frames.length) return;
    if (toIndex < 0 || toIndex >= this.frames.length) return;

    const [frame] = this.frames.splice(fromIndex, 1);
    this.frames.splice(toIndex, 0, frame);
    this.currentFrameIndex = toIndex;
  }

  updateFrameImageData(index: number, imageData: ImageData): void {
    if (index >= 0 && index < this.frames.length) {
      this.frames[index].imageData = imageData;
    }
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  clearCurrentFrame(): void {
    if (this.currentFrameIndex >= 0 && this.currentFrameIndex < this.frames.length) {
      this.frames[this.currentFrameIndex].imageData = null;
    }
  }

  drawOnCanvas(
    ctx: CanvasRenderingContext2D,
    scale: number = 1,
    showGrid: boolean = false
  ): void {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.canvasWidth * scale, this.canvasHeight * scale);

    const frame = this.getCurrentFrame();
    if (frame?.imageData) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = frame.imageData.width;
      tempCanvas.height = frame.imageData.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(frame.imageData, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, this.canvasWidth * scale, this.canvasHeight * scale);
      }
    }

    if (showGrid) {
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 1;
      const gridSize = 10 * scale;
      for (let x = gridSize; x < this.canvasWidth * scale; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasHeight * scale);
        ctx.stroke();
      }
      for (let y = gridSize; y < this.canvasHeight * scale; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasWidth * scale, y);
        ctx.stroke();
      }
    }
  }

  startDrawing(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    this.currentPoints = [{ x, y }];
    this.drawPoint(x, y, ctx);
  }

  continueDrawing(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    if (this.currentPoints.length === 0) return;

    const lastPoint = this.currentPoints[this.currentPoints.length - 1];
    this.drawLine(lastPoint.x, lastPoint.y, x, y, ctx);
    this.currentPoints.push({ x, y });
  }

  endDrawing(): void {
    this.currentPoints = [];
    this.saveCurrentFrame();
  }

  private drawPoint(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    if (this.selectedTool === 'pencil') {
      ctx.fillStyle = this.selectedColor;
      ctx.beginPath();
      ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.selectedTool === 'eraser') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number, ctx: CanvasRenderingContext2D): void {
    if (this.selectedTool === 'fill') return;

    const color = this.selectedTool === 'eraser' ? '#ffffff' : this.selectedColor;
    ctx.strokeStyle = color;
    ctx.lineWidth = this.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  fillAtPoint(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    const imageData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    const data = imageData.data;
    const width = imageData.width;

    const startIdx = (Math.floor(y) * width + Math.floor(x)) * 4;
    const targetColor = {
      r: data[startIdx],
      g: data[startIdx + 1],
      b: data[startIdx + 2],
      a: data[startIdx + 3]
    };

    const fillColor = this.hexToRgb(this.selectedColor);
    if (!fillColor) return;

    if (targetColor.r === fillColor.r && targetColor.g === fillColor.g && targetColor.b === fillColor.b) {
      return;
    }

    const stack: [number, number][] = [[Math.floor(x), Math.floor(y)]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;

      if (visited.has(key)) continue;
      if (cx < 0 || cx >= width || cy < 0 || cy >= this.canvasHeight) continue;

      const idx = (cy * width + cx) * 4;
      if (
        data[idx] !== targetColor.r ||
        data[idx + 1] !== targetColor.g ||
        data[idx + 2] !== targetColor.b ||
        data[idx + 3] !== targetColor.a
      ) {
        continue;
      }

      visited.add(key);
      data[idx] = fillColor.r;
      data[idx + 1] = fillColor.g;
      data[idx + 2] = fillColor.b;
      data[idx + 3] = 255;

      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
    this.saveCurrentFrame();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private saveCurrentFrame(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const frame = this.getCurrentFrame();
    if (frame?.imageData) {
      ctx.putImageData(frame.imageData, 0, 0);
    }

    this.frames[this.currentFrameIndex].imageData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
  }

  getFrameImageData(frameIndex: number): ImageData | null {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      return this.frames[frameIndex].imageData;
    }
    return null;
  }

  exportAsGif(onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      const frames: ImageData[] = [];
      for (const frame of this.frames) {
        if (frame.imageData) {
          frames.push(frame.imageData);
        }
      }

      if (frames.length === 0) {
        resolve('');
        return;
      }

      const gifFrames: { pixels: Uint8ClampedArray; delay: number }[] = frames.map(f => ({
        pixels: f.data,
        delay: Math.round(1000 / this.fps)
      }));

      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = this.canvasWidth;
      resultCanvas.height = this.canvasHeight;
      const resultCtx = resultCanvas.getContext('2d');

      if (!resultCtx) {
        resolve('');
        return;
      }

      const framesData: string[] = [];
      let currentFrame = 0;

      const processFrames = () => {
        if (currentFrame >= gifFrames.length) {
          const dataUrl = resultCanvas.toDataURL('image/gif');
          resolve(dataUrl);
          return;
        }

        const frameData = gifFrames[currentFrame];
        const imgData = new ImageData(frameData.pixels, this.canvasWidth, this.canvasHeight);
        resultCtx.putImageData(imgData, 0, 0);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvasWidth;
        tempCanvas.height = this.canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imgData, 0, 0);
          framesData.push(resultCanvas.toDataURL('image/png'));
        }

        currentFrame++;
        if (onProgress) {
          onProgress(Math.round((currentFrame / gifFrames.length) * 100));
        }

        setTimeout(processFrames, 10);
      };

      processFrames();
    });
  }

  exportAsFrames(): { imageData: string; delay: number }[] {
    return this.frames.map((frame, index) => {
      let dataUrl = '';
      if (frame.imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = frame.imageData.width;
        canvas.height = frame.imageData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(frame.imageData, 0, 0);
          dataUrl = canvas.toDataURL('image/png');
        }
      }
      return {
        imageData: dataUrl,
        delay: Math.round(1000 / this.fps)
      };
    });
  }

  reset(): void {
    this.init();
  }
}
