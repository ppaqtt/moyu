export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  align: 'left' | 'center' | 'right';
  rotation: number;
  shadow: boolean;
}

export interface MemeLayer {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface MemeMakerState {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundImage: string | null;
  textElements: TextElement[];
  selectedTextId: string | null;
  topText: string;
  bottomText: string;
  textStyle: 'top' | 'bottom';
  fontSize: number;
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontFamily: string;
}

export const FONT_FAMILIES = [
  'Impact',
  'Arial Black',
  'Comic Sans MS',
  'Helvetica',
  'Georgia',
  'Times New Roman'
];

export const TEXT_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#ffff00', '#00ff00', '#0000ff',
  '#ff00ff', '#00ffff', '#ff8800', '#ff0088', '#ffd700'
];

export const STROKE_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#0000ff', '#00ff00', '#8b4513'
];

export const CANVAS_PRESETS = [
  { name: 'Instagram', width: 400, height: 400 },
  { name: 'Twitter', width: 500, height: 300 },
  { name: '微信', width: 350, height: 400 },
  { name: '横版', width: 600, height: 350 }
];

export class MemeMakerEngine {
  private canvasWidth: number = 400;
  private canvasHeight: number = 400;
  private backgroundColor: string = '#ffffff';
  private backgroundImage: string | null = null;
  private textElements: TextElement[] = [];
  private selectedTextId: string | null = null;
  private topText: string = '';
  private bottomText: string = '';
  private textStyle: 'top' | 'bottom' = 'top';
  private fontSize: number = 48;
  private textColor: string = '#ffffff';
  private strokeColor: string = '#000000';
  private strokeWidth: number = 3;
  private fontFamily: string = 'Impact';

  constructor() {
    this.init();
  }

  init(): void {
    this.canvasWidth = 400;
    this.canvasHeight = 400;
    this.backgroundColor = '#ffffff';
    this.backgroundImage = null;
    this.textElements = [];
    this.selectedTextId = null;
    this.topText = '';
    this.bottomText = '';
    this.textStyle = 'top';
    this.fontSize = 48;
    this.textColor = '#ffffff';
    this.strokeColor = '#000000';
    this.strokeWidth = 3;
    this.fontFamily = 'Impact';
  }

  getState(): MemeMakerState {
    return {
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      backgroundColor: this.backgroundColor,
      backgroundImage: this.backgroundImage,
      textElements: [...this.textElements],
      selectedTextId: this.selectedTextId,
      topText: this.topText,
      bottomText: this.bottomText,
      textStyle: this.textStyle,
      fontSize: this.fontSize,
      textColor: this.textColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      fontFamily: this.fontFamily
    };
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
  }

  setBackgroundImage(dataUrl: string): void {
    this.backgroundImage = dataUrl;
  }

  removeBackgroundImage(): void {
    this.backgroundImage = null;
  }

  setTopText(text: string): void {
    this.topText = text;
  }

  setBottomText(text: string): void {
    this.bottomText = text;
  }

  setTextStyle(style: 'top' | 'bottom'): void {
    this.textStyle = style;
  }

  setFontSize(size: number): void {
    this.fontSize = Math.max(12, Math.min(120, size));
  }

  setTextColor(color: string): void {
    this.textColor = color;
  }

  setStrokeColor(color: string): void {
    this.strokeColor = color;
  }

  setStrokeWidth(width: number): void {
    this.strokeWidth = Math.max(0, Math.min(10, width));
  }

  setFontFamily(family: string): void {
    this.fontFamily = family;
  }

  selectText(id: string | null): void {
    this.selectedTextId = id;
  }

  getSelectedText(): TextElement | null {
    if (!this.selectedTextId) return null;
    return this.textElements.find(t => t.id === this.selectedTextId) || null;
  }

  updateSelectedText(updates: Partial<TextElement>): void {
    if (!this.selectedTextId) return;
    const text = this.textElements.find(t => t.id === this.selectedTextId);
    if (text) {
      Object.assign(text, updates);
    }
  }

  addTextElement(): TextElement {
    const id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const y = this.textStyle === 'top' ? 60 : this.canvasHeight - 60;

    const element: TextElement = {
      id,
      text: this.textStyle === 'top' ? this.topText : this.bottomText,
      x: this.canvasWidth / 2,
      y,
      fontSize: this.fontSize,
      color: this.textColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      fontFamily: this.fontFamily,
      fontWeight: 'bold',
      fontStyle: 'normal',
      align: 'center',
      rotation: 0,
      shadow: true
    };

    this.textElements.push(element);
    this.selectedTextId = id;
    return element;
  }

  removeTextElement(id: string): void {
    this.textElements = this.textElements.filter(t => t.id !== id);
    if (this.selectedTextId === id) {
      this.selectedTextId = null;
    }
  }

  moveText(id: string, dx: number, dy: number): void {
    const text = this.textElements.find(t => t.id === id);
    if (text) {
      text.x = Math.max(0, Math.min(this.canvasWidth, text.x + dx));
      text.y = Math.max(0, Math.min(this.canvasHeight, text.y + dy));
    }
  }

  rotateText(id: string, delta: number): void {
    const text = this.textElements.find(t => t.id === id);
    if (text) {
      text.rotation = (text.rotation + delta) % 360;
    }
  }

  clearTexts(): void {
    this.textElements = [];
    this.selectedTextId = null;
    this.topText = '';
    this.bottomText = '';
  }

  loadTemplate(template: { width: number; height: number; image: string }): void {
    this.canvasWidth = template.width;
    this.canvasHeight = template.height;
    this.backgroundImage = template.image;
    this.textElements = [];
    this.selectedTextId = null;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    scale: number = 1,
    displayWidth: number,
    displayHeight: number
  ): void {
    ctx.save();

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (this.backgroundImage) {
      const img = new Image();
      img.src = this.backgroundImage;
      ctx.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight);
    }

    for (const element of this.textElements) {
      this.drawTextElement(ctx, element);
    }

    if (this.selectedTextId) {
      const selected = this.textElements.find(t => t.id === this.selectedTextId);
      if (selected) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const metrics = ctx.measureText(selected.text);
        const padding = 10;
        ctx.strokeRect(
          selected.x - metrics.width / 2 - padding,
          selected.y - selected.fontSize / 2 - padding,
          metrics.width + padding * 2,
          selected.fontSize + padding * 2
        );
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }

  private drawTextElement(ctx: CanvasRenderingContext2D, element: TextElement): void {
    ctx.save();
    ctx.translate(element.x, element.y);
    ctx.rotate((element.rotation * Math.PI) / 180);

    ctx.font = `${element.fontWeight} ${element.fontStyle} ${element.fontSize}px "${element.fontFamily}"`;
    ctx.textAlign = element.align;
    ctx.textBaseline = 'middle';

    if (element.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    if (element.strokeWidth > 0) {
      ctx.strokeStyle = element.strokeColor;
      ctx.lineWidth = element.strokeWidth * 2;
      ctx.lineJoin = 'round';
      ctx.strokeText(element.text, 0, 0);
    }

    ctx.fillStyle = element.color;
    ctx.fillText(element.text, 0, 0);

    ctx.restore();
  }

  getTextAtPoint(x: number, y: number): TextElement | null {
    for (let i = this.textElements.length - 1; i >= 0; i--) {
      const element = this.textElements[i];
      ctx.save();
      ctx.font = `${element.fontWeight} ${element.fontStyle} ${element.fontSize}px "${element.fontFamily}"`;
      const metrics = ctx.measureText(element.text);
      ctx.restore();

      const halfWidth = metrics.width / 2;
      const halfHeight = element.fontSize / 2;

      if (
        x >= element.x - halfWidth &&
        x <= element.x + halfWidth &&
        y >= element.y - halfHeight &&
        y <= element.y + halfHeight
      ) {
        return element;
      }
    }
    return null;
  }

  private ctx: CanvasRenderingContext2D | null = null;

  saveMeme(): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (this.backgroundImage) {
      const img = new Image();
      img.src = this.backgroundImage;
      const drawImage = () => {
        ctx.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight);
        for (const element of this.textElements) {
          this.drawTextElement(ctx, element);
        }
      };
      if (img.complete) {
        drawImage();
      } else {
        img.onload = drawImage;
      }
    } else {
      for (const element of this.textElements) {
        this.drawTextElement(ctx, element);
      }
    }

    return canvas.toDataURL('image/png');
  }

  exportAsDataUrl(): string {
    return this.saveMeme();
  }

  reset(): void {
    this.init();
  }
}
