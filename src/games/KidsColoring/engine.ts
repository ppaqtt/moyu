export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  brushSize: number;
}

export interface ColoringState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  currentColor: string;
  brushSize: number;
  selectedTemplate: number;
  isErasing: boolean;
}

export interface Template {
  id: number;
  name: string;
  emoji: string;
  regions: { path: string; filled: boolean; color: string }[];
}

export class KidsColoringEngine {
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private currentColor: string = '#FF6B6B';
  private brushSize: number = 8;
  private selectedTemplate: number = 0;
  private isErasing: boolean = false;
  
  private readonly templates: Template[] = [
    {
      id: 0,
      name: '小猫咪',
      emoji: '🐱',
      regions: [
        { path: 'M50,30 Q70,10 90,30 Q100,50 90,70 L70,80 L50,70 Q40,50 50,30', filled: false, color: '' },
        { path: 'M45,35 Q35,25 40,40', filled: false, color: '' },
        { path: 'M95,35 Q105,25 100,40', filled: false, color: '' },
        { path: 'M55,50 Q70,45 85,50 Q70,65 55,50', filled: false, color: '' },
        { path: 'M60,52 Q65,55 70,52', filled: false, color: '' },
        { path: 'M65,58 Q70,62 75,58', filled: false, color: '' },
      ]
    },
    {
      id: 1,
      name: '彩虹',
      emoji: '🌈',
      regions: [
        { path: 'M20,70 A50,50 0 0,1 180,70', filled: false, color: '' },
        { path: 'M30,70 A40,40 0 0,1 170,70', filled: false, color: '' },
        { path: 'M40,70 A30,30 0 0,1 160,70', filled: false, color: '' },
        { path: 'M50,70 A20,20 0 0,1 150,70', filled: false, color: '' },
        { path: 'M60,70 A10,10 0 0,1 140,70', filled: false, color: '' },
      ]
    },
    {
      id: 2,
      name: '花朵',
      emoji: '🌸',
      regions: [
        { path: 'M100,80 L100,40 Q85,35 80,50 Q75,35 60,45 Q65,60 80,65 L80,80', filled: false, color: '' },
        { path: 'M100,80 L100,40 Q115,35 120,50 Q125,35 140,45 Q135,60 120,65 L120,80', filled: false, color: '' },
        { path: 'M80,80 L80,95 Q65,100 60,85 Q55,100 70,105 L80,80', filled: false, color: '' },
        { path: 'M120,80 L120,95 Q135,100 140,85 Q145,100 130,105 L120,80', filled: false, color: '' },
        { path: 'M100,100 A15,15 0 1,1 100,130 A15,15 0 1,1 100,100', filled: false, color: '' },
      ]
    },
    {
      id: 3,
      name: '小鱼',
      emoji: '🐟',
      regions: [
        { path: 'M40,60 Q60,40 100,50 Q140,40 160,60 Q140,80 100,70 Q60,80 40,60', filled: false, color: '' },
        { path: 'M160,60 L180,45 L180,75 Z', filled: false, color: '' },
        { path: 'M60,55 A5,5 0 1,1 60,65 A5,5 0 1,1 60,55', filled: false, color: '' },
        { path: 'M90,55 Q100,50 110,55', filled: false, color: '' },
        { path: 'M100,60 L130,60', filled: false, color: '' },
        { path: 'M105,65 L125,65', filled: false, color: '' },
      ]
    },
    {
      id: 4,
      name: '蝴蝶',
      emoji: '🦋',
      regions: [
        { path: 'M50,50 Q20,20 30,50 Q20,80 50,60', filled: false, color: '' },
        { path: 'M150,50 Q180,20 170,50 Q180,80 150,60', filled: false, color: '' },
        { path: 'M50,80 Q30,100 50,110 Q70,100 50,80', filled: false, color: '' },
        { path: 'M150,80 Q170,100 150,110 Q130,100 150,80', filled: false, color: '' },
        { path: 'M95,40 L105,40 L105,120 L95,120 Z', filled: false, color: '' },
      ]
    }
  ];

  private readonly colors = [
    '#FF6B6B', '#FF8E72', '#FFA94D', '#FFD43B', '#A9E34B',
    '#69DB7C', '#38D9A9', '#66D9E8', '#74C0FC', '#9775FA',
    '#B197FC', '#F783AC', '#E599F7', '#FFFFFF', '#343A40'
  ];

  public startStroke(x: number, y: number): void {
    if (this.isErasing) {
      this.currentStroke = {
        points: [{ x, y }],
        color: '#1a1a2e',
        brushSize: this.brushSize * 2
      };
    } else {
      this.currentStroke = {
        points: [{ x, y }],
        color: this.currentColor,
        brushSize: this.brushSize
      };
    }
  }

  public continueStroke(x: number, y: number): void {
    if (this.currentStroke) {
      this.currentStroke.points.push({ x, y });
    }
  }

  public endStroke(): void {
    if (this.currentStroke && this.currentStroke.points.length > 1) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
  }

  public setColor(color: string): void {
    this.currentColor = color;
    this.isErasing = false;
  }

  public setBrushSize(size: number): void {
    this.brushSize = Math.max(2, Math.min(30, size));
  }

  public selectTemplate(index: number): void {
    if (index >= 0 && index < this.templates.length) {
      this.selectedTemplate = index;
    }
  }

  public setEraser(enabled: boolean): void {
    this.isErasing = enabled;
  }

  public clear(): void {
    this.strokes = [];
    this.currentStroke = null;
  }

  public undo(): void {
    if (this.strokes.length > 0) {
      this.strokes.pop();
    }
  }

  public getState(): ColoringState {
    return {
      strokes: this.strokes.map(s => ({ ...s, points: [...s.points] })),
      currentStroke: this.currentStroke ? { ...this.currentStroke, points: [...this.currentStroke.points] } : null,
      currentColor: this.currentColor,
      brushSize: this.brushSize,
      selectedTemplate: this.selectedTemplate,
      isErasing: this.isErasing
    };
  }

  public getColors(): string[] {
    return this.colors;
  }

  public getTemplates(): Template[] {
    return this.templates;
  }

  public getCurrentColor(): string {
    return this.currentColor;
  }

  public getBrushSize(): number {
    return this.brushSize;
  }

  public getSelectedTemplate(): Template {
    return this.templates[this.selectedTemplate];
  }
}
