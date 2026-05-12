export interface Point {
  x: number;
  y: number;
}

export interface ColorRegion {
  id: number;
  path: Path2D;
  color: string;
  number: number;
  filled: boolean;
}

export interface ColoringBookState {
  regions: ColorRegion[];
  selectedColor: string;
  selectedNumber: number;
  completedRegions: number;
  totalRegions: number;
  isComplete: boolean;
  currentTemplate: number;
  fillHistory: number[];
}

export const COLOR_PALETTE = [
  { number: 1, color: '#ff6b6b', name: '红色' },
  { number: 2, color: '#4ecdc4', name: '青色' },
  { number: 3, color: '#45b7d1', name: '蓝色' },
  { number: 4, color: '#96ceb4', name: '绿色' },
  { number: 5, color: '#feca57', name: '黄色' },
  { number: 6, color: '#ff9ff3', name: '粉色' },
  { number: 7, color: '#a29bfe', name: '紫色' },
  { number: 8, color: '#fd79a8', name: '玫红' },
  { number: 9, color: '#fdcb6e', name: '橙色' },
  { number: 10, color: '#6c5ce7', name: '深紫' },
  { number: 11, color: '#00b894', name: '青绿' },
  { number: 12, color: '#e17055', name: '珊瑚' },
];

export const TEMPLATES = [
  {
    name: '彩虹',
    createRegions: (ctx: CanvasRenderingContext2D, width: number, height: number): ColorRegion[] => {
      const regions: ColorRegion[] = [];
      const centerX = width / 2;
      const centerY = height * 0.7;
      const maxRadius = Math.min(width, height) * 0.4;
      
      for (let i = 0; i < 7; i++) {
        const path = new Path2D();
        const innerRadius = maxRadius * (0.3 + i * 0.1);
        const outerRadius = maxRadius * (0.4 + i * 0.1);
        
        path.arc(centerX, centerY, outerRadius, Math.PI, 0);
        path.arc(centerX, centerY, innerRadius, 0, Math.PI, true);
        path.closePath();
        
        regions.push({
          id: i,
          path,
          color: '#ffffff',
          number: (i % 7) + 1,
          filled: false
        });
      }
      
      const cloud1 = new Path2D();
      cloud1.arc(centerX - maxRadius * 0.8, centerY, 25, 0, Math.PI * 2);
      cloud1.arc(centerX - maxRadius * 0.6, centerY - 15, 30, 0, Math.PI * 2);
      cloud1.arc(centerX - maxRadius * 0.4, centerY, 25, 0, Math.PI * 2);
      regions.push({ id: 7, path: cloud1, color: '#ffffff', number: 8, filled: false });
      
      const cloud2 = new Path2D();
      cloud2.arc(centerX + maxRadius * 0.4, centerY, 25, 0, Math.PI * 2);
      cloud2.arc(centerX + maxRadius * 0.6, centerY - 15, 30, 0, Math.PI * 2);
      cloud2.arc(centerX + maxRadius * 0.8, centerY, 25, 0, Math.PI * 2);
      regions.push({ id: 8, path: cloud2, color: '#ffffff', number: 8, filled: false });
      
      return regions;
    }
  },
  {
    name: '花朵',
    createRegions: (ctx: CanvasRenderingContext2D, width: number, height: number): ColorRegion[] => {
      const regions: ColorRegion[] = [];
      const centerX = width / 2;
      const centerY = height / 2;
      
      for (let i = 0; i < 8; i++) {
        const path = new Path2D();
        const angle = (i / 8) * Math.PI * 2;
        const nextAngle = ((i + 1) / 8) * Math.PI * 2;
        
        path.moveTo(centerX, centerY);
        path.arc(centerX, centerY, 120, angle - 0.3, nextAngle - 0.3);
        path.closePath();
        
        regions.push({
          id: i,
          path,
          color: '#ffffff',
          number: (i % 4) + 1,
          filled: false
        });
      }
      
      const center = new Path2D();
      center.arc(centerX, centerY, 40, 0, Math.PI * 2);
      regions.push({ id: 8, path: center, color: '#ffffff', number: 5, filled: false });
      
      const stem = new Path2D();
      stem.rect(centerX - 10, centerY + 40, 20, 150);
      regions.push({ id: 9, path: stem, color: '#ffffff', number: 3, filled: false });
      
      const leaf1 = new Path2D();
      leaf1.ellipse(centerX - 40, centerY + 120, 30, 15, -0.5, 0, Math.PI * 2);
      regions.push({ id: 10, path: leaf1, color: '#ffffff', number: 3, filled: false });
      
      const leaf2 = new Path2D();
      leaf2.ellipse(centerX + 40, centerY + 100, 30, 15, 0.5, 0, Math.PI * 2);
      regions.push({ id: 11, path: leaf2, color: '#ffffff', number: 3, filled: false });
      
      return regions;
    }
  },
  {
    name: '蝴蝶',
    createRegions: (ctx: CanvasRenderingContext2D, width: number, height: number): ColorRegion[] => {
      const regions: ColorRegion[] = [];
      const centerX = width / 2;
      const centerY = height / 2;
      
      const body = new Path2D();
      body.ellipse(centerX, centerY, 15, 80, 0, 0, Math.PI * 2);
      regions.push({ id: 0, path: body, color: '#ffffff', number: 1, filled: false });
      
      const leftWingTop = new Path2D();
      leftWingTop.moveTo(centerX - 15, centerY - 40);
      leftWingTop.bezierCurveTo(centerX - 100, centerY - 120, centerX - 140, centerY - 60, centerX - 20, centerY - 20);
      leftWingTop.closePath();
      regions.push({ id: 1, path: leftWingTop, color: '#ffffff', number: 2, filled: false });
      
      const rightWingTop = new Path2D();
      rightWingTop.moveTo(centerX + 15, centerY - 40);
      rightWingTop.bezierCurveTo(centerX + 100, centerY - 120, centerX + 140, centerY - 60, centerX + 20, centerY - 20);
      rightWingTop.closePath();
      regions.push({ id: 2, path: rightWingTop, color: '#ffffff', number: 2, filled: false });
      
      const leftWingBottom = new Path2D();
      leftWingBottom.moveTo(centerX - 15, centerY + 40);
      leftWingBottom.bezierCurveTo(centerX - 80, centerY + 100, centerX - 100, centerY + 60, centerX - 20, centerY + 20);
      leftWingBottom.closePath();
      regions.push({ id: 3, path: leftWingBottom, color: '#ffffff', number: 3, filled: false });
      
      const rightWingBottom = new Path2D();
      rightWingBottom.moveTo(centerX + 15, centerY + 40);
      rightWingBottom.bezierCurveTo(centerX + 80, centerY + 100, centerX + 100, centerY + 60, centerX + 20, centerY + 20);
      rightWingBottom.closePath();
      regions.push({ id: 4, path: rightWingBottom, color: '#ffffff', number: 3, filled: false });
      
      for (let i = 0; i < 6; i++) {
        const spot = new Path2D();
        const x = centerX + (i < 3 ? -1 : 1) * (40 + (i % 3) * 25);
        const y = centerY - 60 + (i % 3) * 30;
        spot.arc(x, y, 8, 0, Math.PI * 2);
        regions.push({ id: 5 + i, path: spot, color: '#ffffff', number: 4, filled: false });
      }
      
      return regions;
    }
  }
];

export class ColoringBookEngine {
  private regions: ColorRegion[] = [];
  private selectedColor: string = COLOR_PALETTE[0].color;
  private selectedNumber: number = 1;
  private currentTemplate: number = 0;
  private fillHistory: number[] = [];

  constructor() {
    this.init();
  }

  init(): void {
    this.selectedColor = COLOR_PALETTE[0].color;
    this.selectedNumber = 1;
    this.currentTemplate = 0;
    this.fillHistory = [];
    this.regions = [];
  }

  loadTemplate(templateIndex: number, ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.currentTemplate = templateIndex;
    this.fillHistory = [];
    const template = TEMPLATES[templateIndex];
    if (template) {
      this.regions = template.createRegions(ctx, width, height);
    }
  }

  getState(): ColoringBookState {
    const completedRegions = this.regions.filter(r => r.filled).length;
    return {
      regions: [...this.regions],
      selectedColor: this.selectedColor,
      selectedNumber: this.selectedNumber,
      completedRegions,
      totalRegions: this.regions.length,
      isComplete: completedRegions === this.regions.length && this.regions.length > 0,
      currentTemplate: this.currentTemplate,
      fillHistory: [...this.fillHistory]
    };
  }

  setColor(color: string, number: number): void {
    this.selectedColor = color;
    this.selectedNumber = number;
  }

  fillRegion(x: number, y: number): boolean {
    for (const region of this.regions) {
      if (!region.filled && region.number === this.selectedNumber) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fill(new Path2D(region.path));
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
        }
      }
    }

    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      if (!region.filled && region.number === this.selectedNumber) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 800, 500);
          ctx.fillStyle = '#000000';
          ctx.fill(region.path);
          const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
          if (pixel[0] < 128) {
            region.color = this.selectedColor;
            region.filled = true;
            this.fillHistory.push(i);
            return true;
          }
        }
      }
    }
    return false;
  }

  fillRegionById(regionId: number): boolean {
    const region = this.regions.find(r => r.id === regionId);
    if (region && !region.filled && region.number === this.selectedNumber) {
      region.color = this.selectedColor;
      region.filled = true;
      this.fillHistory.push(regionId);
      return true;
    }
    return false;
  }

  undo(): void {
    if (this.fillHistory.length > 0) {
      const lastRegionId = this.fillHistory.pop();
      const region = this.regions.find(r => r.id === lastRegionId);
      if (region) {
        region.filled = false;
        region.color = '#ffffff';
      }
    }
  }

  reset(): void {
    for (const region of this.regions) {
      region.filled = false;
      region.color = '#ffffff';
    }
    this.fillHistory = [];
  }

  clear(): void {
    this.init();
  }

  saveImage(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png');
  }

  getProgress(): number {
    if (this.regions.length === 0) return 0;
    return Math.round((this.regions.filter(r => r.filled).length / this.regions.length) * 100);
  }
}
