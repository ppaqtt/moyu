export interface CodeArtState {
  code: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  errors: string[];
  lastGenerated: number;
}

export interface ArtPattern {
  name: string;
  code: string;
  description: string;
}

export const DEFAULT_PATTERNS: ArtPattern[] = [
  {
    name: '渐变圆圈',
    description: '多层渐变圆圈图案',
    code: `// 渐变圆圈
const cx = width / 2;
const cy = height / 2;
for (let i = 0; i < 20; i++) {
  const radius = 10 + i * 12;
  const hue = (i * 18) % 360;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = \`hsla(\${hue}, 70%, 50%, 0.7)\`;
  ctx.fill();
}`
  },
  {
    name: '彩色条纹',
    description: '彩虹条纹效果',
    code: `// 彩色条纹
for (let y = 0; y < height; y += 8) {
  const hue = (y * 360 / height) % 360;
  ctx.fillStyle = \`hsl(\${hue}, 80%, 60%)\`;
  ctx.fillRect(0, y, width, 6);
}`
  },
  {
    name: '螺旋图案',
    description: '数学螺旋线',
    code: `// 螺旋图案
ctx.strokeStyle = '#fff';
ctx.lineWidth = 2;
for (let angle = 0; angle < 20 * Math.PI; angle += 0.1) {
  const r = angle * 5;
  const x = width / 2 + r * Math.cos(angle);
  const y = height / 2 + r * Math.sin(angle);
  ctx.beginPath();
  ctx.arc(x, y, 1, 0, Math.PI * 2);
  ctx.fillStyle = \`hsl(\${angle * 20}, 80%, 60%)\`;
  ctx.fill();
}`
  },
  {
    name: '粒子星空',
    description: '闪烁的星空效果',
    code: `// 粒子星空
for (let i = 0; i < 200; i++) {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const size = Math.random() * 3;
  const brightness = Math.random();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = \`rgba(255, 255, 255, \${brightness})\`;
  ctx.fill();
}`
  },
  {
    name: '圆形网格',
    description: '规律排列的圆点',
    code: `// 圆形网格
for (let x = 20; x < width; x += 40) {
  for (let y = 20; y < height; y += 40) {
    const dist = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
    const hue = (dist / 3) % 360;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = \`hsl(\${hue}, 70%, 50%)\`;
    ctx.fill();
  }
}`
  },
  {
    name: '波形图案',
    description: '正弦波叠加效果',
    code: `// 波形图案
for (let x = 0; x < width; x++) {
  for (let wave = 1; wave <= 5; wave++) {
    const y = height / 2 + Math.sin(x / 30 * wave) * (30 * wave);
    const hue = (x + wave * 50) % 360;
    ctx.fillStyle = \`hsla(\${hue}, 70%, 50%, 0.5)\`;
    ctx.fillRect(x, y, 1, 5);
  }
}`
  },
  {
    name: '三角分形',
    description: '谢尔宾斯基三角形',
    code: `// 谢尔宾斯基三角
function drawTriangle(x, y, size, depth) {
  if (depth === 0) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size / 2, y - size * 0.866);
    ctx.lineTo(x + size, y);
    ctx.closePath();
    ctx.fillStyle = \`hsl(\${depth * 30}, 70%, 50%)\`;
    ctx.fill();
    return;
  }
  drawTriangle(x, y, size / 2, depth - 1);
  drawTriangle(x + size / 4, y - size * 0.433, size / 2, depth - 1);
  drawTriangle(x + size / 2, y, size / 2, depth - 1);
}
drawTriangle(20, height - 20, width - 40, 5);`
  },
  {
    name: '万花筒',
    description: '旋转对称图案',
    code: `// 万花筒
const cx = width / 2;
const cy = height / 2;
for (let i = 0; i < 12; i++) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(i * Math.PI / 6);
  const gradient = ctx.createLinearGradient(0, 0, width / 2, 0);
  gradient.addColorStop(0, \`hsl(\${i * 30}, 80%, 50%)\`);
  gradient.addColorStop(1, \`hsl(\${i * 30 + 30}, 80%, 50%)\`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width / 3, -50);
  ctx.lineTo(width / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}`
  }
];

export class CodeArtEngine {
  private code: string = '';
  private canvasWidth: number = 400;
  private canvasHeight: number = 400;
  private backgroundColor: string = '#0a0a1a';
  private errors: string[] = [];
  private lastGenerated: number = 0;

  constructor() {
    this.init();
  }

  init(): void {
    this.code = DEFAULT_PATTERNS[0].code;
    this.canvasWidth = 400;
    this.canvasHeight = 400;
    this.backgroundColor = '#0a0a1a';
    this.errors = [];
    this.lastGenerated = 0;
  }

  getState(): CodeArtState {
    return {
      code: this.code,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      backgroundColor: this.backgroundColor,
      errors: [...this.errors],
      lastGenerated: this.lastGenerated
    };
  }

  setCode(code: string): void {
    this.code = code;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
  }

  getPatterns(): ArtPattern[] {
    return DEFAULT_PATTERNS;
  }

  loadPattern(pattern: ArtPattern): void {
    this.code = pattern.code;
  }

  generate(ctx: CanvasRenderingContext2D): void {
    this.errors = [];

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const width = this.canvasWidth;
    const height = this.canvasHeight;

    try {
      const func = new Function('ctx', 'width', 'height', this.code);
      func(ctx, width, height);
      this.lastGenerated = Date.now();
    } catch (error: any) {
      this.errors = [error.message || '代码执行错误'];
      this.drawErrorMessage(ctx);
    }
  }

  private drawErrorMessage(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(10, 10, this.canvasWidth - 20, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.errors[0] || '未知错误', 20, 30);
  }

  validateCode(): string[] {
    const errors: string[] = [];
    try {
      new Function('ctx', 'width', 'height', this.code);
    } catch (error: any) {
      errors.push(error.message || '代码语法错误');
    }
    return errors;
  }

  exportAsPNG(ctx: CanvasRenderingContext2D): string {
    const canvas = ctx.canvas;
    return canvas.toDataURL('image/png');
  }

  exportAsSVG(): string {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.canvasWidth}" height="${this.canvasHeight}">`;
    svg += `<rect width="100%" height="100%" fill="${this.backgroundColor}"/>`;
    svg += `<text x="50%" y="50%" text-anchor="middle" fill="#888">使用Canvas渲染后导出</text>`;
    svg += '</svg>';
    return svg;
  }

  reset(): void {
    this.code = DEFAULT_PATTERNS[0].code;
    this.errors = [];
  }
}
