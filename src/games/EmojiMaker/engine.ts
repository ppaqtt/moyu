export interface Point {
  x: number;
  y: number;
}

export interface EmojiLayer {
  id: string;
  type: 'face' | 'eyes' | 'eyebrows' | 'nose' | 'mouth' | 'accessories' | 'text';
  shape: string;
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  visible: boolean;
}

export interface EmojiMakerState {
  layers: EmojiLayer[];
  selectedLayerId: string | null;
  backgroundColor: string;
  size: number;
}

export const EMOJI_SHAPES = {
  face: [
    { id: 'circle', name: '圆形', path: 'M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10' },
    { id: 'square', name: '方形', path: 'M15,15 L85,15 L85,85 L15,85 Z' },
    { id: 'rounded', name: '圆角', path: 'M25,10 L75,10 A15,15 0 0,1 90,25 L90,75 A15,15 0 0,1 75,90 L25,90 A15,15 0 0,1 10,75 L10,25 A15,15 0 0,1 25,10' },
    { id: 'heart', name: '心形', path: 'M50,85 C50,85 20,60 20,40 C20,25 30,15 42,15 C47,15 50,20 50,20 C50,20 53,15 58,15 C70,15 80,25 80,40 C80,60 50,85 50,85 Z' },
    { id: 'star', name: '星形', path: 'M50,10 L61,35 L88,35 L66,52 L74,78 L50,62 L26,78 L34,52 L12,35 L39,35 Z' },
    { id: 'cat', name: '猫咪', path: 'M30,25 L20,5 L40,20 L50,15 L60,20 L80,5 L70,25 A35,35 0 1,1 30,25' },
    { id: 'bear', name: '小熊', path: 'M25,30 A10,10 0 1,1 25,29 M75,30 A10,10 0 1,1 75,29 M50,20 A30,30 0 1,1 50,80 A30,30 0 1,1 50,20' },
    { id: 'robot', name: '机器人', path: 'M30,25 L30,15 L70,15 L70,25 M20,30 L80,30 L80,80 L20,80 Z M35,40 A5,5 0 1,1 35,39 M65,40 A5,5 0 1,1 65,39 M40,60 L60,60' }
  ],
  eyes: [
    { id: 'normal', name: '普通', left: 'M30,40 A8,8 0 1,1 30,39 M70,40 A8,8 0 1,1 70,39', right: 'M30,40 A8,8 0 1,1 30,39 M70,40 A8,8 0 1,1 70,39' },
    { id: 'happy', name: '开心', left: 'M25,42 Q35,35 45,42 M55,42 Q65,35 75,42', right: 'M25,42 Q35,35 45,42 M55,42 Q65,35 75,42' },
    { id: 'wink', name: '眨眼', left: 'M25,40 Q35,35 45,40 M55,42 Q65,35 75,42', right: 'M25,42 Q35,35 45,42 M55,40 Q65,35 75,40' },
    { id: 'heart_eyes', name: '爱心', left: 'M30,38 C30,38 25,32 25,38 C25,42 30,45 35,42 C35,42 40,45 45,42 C45,38 40,32 40,38 M60,38 C60,38 55,32 55,38 C55,42 60,45 65,42 C65,42 70,45 75,42 C75,38 70,32 70,38', right: 'M30,38 C30,38 25,32 25,38 C25,42 30,45 35,42 C35,42 40,45 45,42 C45,38 40,32 40,38 M60,38 C60,38 55,32 55,38 C55,42 60,45 65,42 C65,42 70,45 75,42 C75,38 70,32 70,38' },
    { id: 'star_eyes', name: '星星', left: 'M35,35 L37,40 L42,40 L38,43 L40,48 L35,45 L30,48 L32,43 L28,40 L33,40 Z M65,35 L67,40 L72,40 L68,43 L70,48 L65,45 L60,48 L62,43 L58,40 L63,40 Z', right: 'M35,35 L37,40 L42,40 L38,43 L40,48 L35,45 L30,48 L32,43 L28,40 L33,40 Z M65,35 L67,40 L72,40 L68,43 L70,48 L65,45 L60,48 L62,43 L58,40 L63,40 Z' },
    { id: 'closed', name: '闭眼', left: 'M25,42 Q35,48 45,42 M55,42 Q65,48 75,42', right: 'M25,42 Q35,48 45,42 M55,42 Q65,48 75,42' },
    { id: 'surprised', name: '惊讶', left: 'M30,40 A6,6 0 1,1 30,39 M70,40 A6,6 0 1,1 70,39', right: 'M30,40 A6,6 0 1,1 30,39 M70,40 A6,6 0 1,1 70,39' },
    { id: 'sunglasses', name: '墨镜', left: 'M22,38 L48,38 L48,48 L40,52 L30,52 L22,48 Z M52,38 L78,38 L78,48 L70,52 L60,52 L52,48 Z M48,42 L52,42', right: 'M22,38 L48,38 L48,48 L40,52 L30,52 L22,48 Z M52,38 L78,38 L78,48 L70,52 L60,52 L52,48 Z M48,42 L52,42' }
  ],
  eyebrows: [
    { id: 'none', name: '无', path: '' },
    { id: 'normal', name: '普通', path: 'M25,28 Q35,25 45,28 M55,28 Q65,25 75,28' },
    { id: 'angry', name: '生气', path: 'M25,32 L45,28 M55,28 L75,32' },
    { id: 'sad', name: '悲伤', path: 'M25,28 Q35,32 45,28 M55,28 Q65,32 75,28' },
    { id: 'surprised', name: '惊讶', path: 'M28,25 Q35,22 42,25 M58,25 Q65,22 72,25' },
    { id: 'raised', name: '挑眉', path: 'M25,30 Q35,22 45,30 M55,26 Q65,22 75,26' }
  ],
  mouth: [
    { id: 'smile', name: '微笑', path: 'M30,65 Q50,80 70,65' },
    { id: 'big_smile', name: '大笑', path: 'M30,62 Q50,85 70,62 Z' },
    { id: 'neutral', name: '平静', path: 'M35,70 L65,70' },
    { id: 'frown', name: '皱眉', path: 'M30,75 Q50,60 70,75' },
    { id: 'open', name: '张嘴', path: 'M40,68 A10,10 0 1,1 40,67' },
    { id: 'tongue', name: '吐舌', path: 'M35,68 Q50,75 65,68 L60,80 Q50,85 40,80 Z' },
    { id: 'cat', name: '猫嘴', path: 'M40,68 L50,75 L60,68' },
    { id: 'teeth', name: '露齿', path: 'M32,65 L68,65 L65,75 L35,75 Z M35,68 L65,68' },
    { id: 'kiss', name: '亲亲', path: 'M45,70 Q50,68 55,70 Q50,75 45,70' },
    { id: 'side', name: '撇嘴', path: 'M35,70 Q45,72 55,68' }
  ],
  accessories: [
    { id: 'none', name: '无', path: '' },
    { id: 'glasses', name: '眼镜', path: 'M25,38 L45,38 L45,48 L40,52 L30,52 L25,48 Z M55,38 L75,38 L75,48 L70,52 L60,52 L55,48 Z M45,42 L55,42' },
    { id: 'sweat', name: '汗滴', path: 'M82,25 Q88,35 82,45 Q76,35 82,25' },
    { id: 'blush', name: '腮红', path: 'M20,55 A8,5 0 1,1 20,54 M80,55 A8,5 0 1,1 80,54' },
    { id: 'tears', name: '眼泪', path: 'M28,48 Q25,58 28,68 Q31,58 28,48 M72,48 Q75,58 72,68 Q69,58 72,48' },
    { id: 'bandage', name: '绷带', path: 'M25,20 L75,20 L75,35 L25,35 Z M35,20 L35,35 M45,20 L45,35 M55,20 L55,35 M65,20 L65,35' },
    { id: 'bow', name: '蝴蝶结', path: 'M50,12 L40,5 L40,19 Z M50,12 L60,5 L60,19 Z M50,8 L50,16' },
    { id: 'hat', name: '帽子', path: 'M20,25 L80,25 L70,5 L30,5 Z' },
    { id: 'crown', name: '皇冠', path: 'M25,30 L25,10 L35,20 L50,5 L65,20 L75,10 L75,30 Z' },
    { id: 'mustache', name: '胡子', path: 'M50,75 Q40,70 30,75 Q40,80 50,75 Q60,80 70,75 Q60,70 50,75' },
    { id: 'freckles', name: '雀斑', path: 'M25,55 A1,1 0 1,1 25,54 M30,58 A1,1 0 1,1 30,57 M75,55 A1,1 0 1,1 75,54 M70,58 A1,1 0 1,1 70,57' }
  ]
};

export const EMOJI_COLORS = {
  face: ['#ffcc00', '#ffdb4d', '#ffb347', '#f4a460', '#d2691e', '#8b4513', '#ff9999', '#ffb6c1', '#98fb98', '#87ceeb', '#dda0dd', '#d3d3d3'],
  eyes: ['#000000', '#333333', '#ffffff', '#4169e1', '#32cd32', '#ff6347', '#9370db'],
  mouth: ['#000000', '#8b0000', '#ff6347', '#ff69b4'],
  accessories: ['#000000', '#ff0000', '#0000ff', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ffffff']
};

export class EmojiMakerEngine {
  private layers: EmojiLayer[] = [];
  private selectedLayerId: string | null = null;
  private backgroundColor: string = '#ffffff';
  private size: number = 400;

  constructor() {
    this.init();
  }

  init(): void {
    this.layers = [];
    this.selectedLayerId = null;
    this.backgroundColor = '#ffffff';
    this.addDefaultLayers();
  }

  private addDefaultLayers(): void {
    this.addLayer('face', 'circle', '#ffcc00', 50, 50, 1, 0);
    this.addLayer('eyes', 'normal', '#000000', 50, 50, 1, 0);
    this.addLayer('mouth', 'smile', '#000000', 50, 50, 1, 0);
  }

  getState(): EmojiMakerState {
    return {
      layers: [...this.layers],
      selectedLayerId: this.selectedLayerId,
      backgroundColor: this.backgroundColor,
      size: this.size
    };
  }

  addLayer(
    type: EmojiLayer['type'],
    shape: string,
    color: string,
    x: number = 50,
    y: number = 50,
    scale: number = 1,
    rotation: number = 0
  ): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const layer: EmojiLayer = {
      id,
      type,
      shape,
      color,
      x,
      y,
      scale,
      rotation,
      visible: true
    };
    this.layers.push(layer);
    this.selectedLayerId = id;
    return id;
  }

  removeLayer(id: string): void {
    this.layers = this.layers.filter(l => l.id !== id);
    if (this.selectedLayerId === id) {
      this.selectedLayerId = null;
    }
  }

  selectLayer(id: string | null): void {
    this.selectedLayerId = id;
  }

  updateLayer(id: string, updates: Partial<EmojiLayer>): void {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      Object.assign(layer, updates);
    }
  }

  moveLayer(id: string, dx: number, dy: number): void {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.x = Math.max(0, Math.min(100, layer.x + dx));
      layer.y = Math.max(0, Math.min(100, layer.y + dy));
    }
  }

  scaleLayer(id: string, delta: number): void {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.scale = Math.max(0.5, Math.min(2, layer.scale + delta));
    }
  }

  rotateLayer(id: string, delta: number): void {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.rotation = (layer.rotation + delta) % 360;
    }
  }

  setLayerColor(id: string, color: string): void {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.color = color;
    }
  }

  setLayerShape(id: string, shape: string): void {
    const layer = this.findLayerByType(id);
    if (layer) {
      layer.shape = shape;
    }
  }

  private findLayerByType(typeOrId: string): EmojiLayer | undefined {
    return this.layers.find(l => l.id === typeOrId || l.type === typeOrId);
  }

  toggleLayerVisibility(id: string): void {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.visible = !layer.visible;
    }
  }

  moveLayerUp(id: string): void {
    const index = this.layers.findIndex(l => l.id === id);
    if (index < this.layers.length - 1) {
      [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
    }
  }

  moveLayerDown(id: string): void {
    const index = this.layers.findIndex(l => l.id === id);
    if (index > 0) {
      [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
    }
  }

  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
  }

  setSize(size: number): void {
    this.size = size;
  }

  clear(): void {
    this.layers = [];
    this.selectedLayerId = null;
  }

  reset(): void {
    this.init();
  }

  saveEmoji(): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.size;
    canvas.height = this.size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.size, this.size);

    const scale = this.size / 100;

    for (const layer of this.layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.translate(layer.x * scale, layer.y * scale);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);

      const path = new Path2D(this.getShapePath(layer));
      ctx.fillStyle = layer.color;
      ctx.fill(path);

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }

  private getShapePath(layer: EmojiLayer): string {
    const shapes = EMOJI_SHAPES[layer.type as keyof typeof EMOJI_SHAPES];
    if (!shapes) return '';

    const shape = shapes.find((s: any) => s.id === layer.shape);
    if (!shape) return '';

    if (layer.type === 'eyes') {
      return (shape as any).left || '';
    }
    return (shape as any).path || '';
  }

  getRandomEmoji(): void {
    this.clear();

    const faceShapes = EMOJI_SHAPES.face;
    const eyeShapes = EMOJI_SHAPES.eyes;
    const mouthShapes = EMOJI_SHAPES.mouth;
    const eyebrowShapes = EMOJI_SHAPES.eyebrows;
    const accessoryShapes = EMOJI_SHAPES.accessories;

    const randomFace = faceShapes[Math.floor(Math.random() * faceShapes.length)];
    const randomEyes = eyeShapes[Math.floor(Math.random() * eyeShapes.length)];
    const randomMouth = mouthShapes[Math.floor(Math.random() * mouthShapes.length)];
    const randomEyebrows = eyebrowShapes[Math.floor(Math.random() * eyebrowShapes.length)];
    const randomAccessory = accessoryShapes[Math.floor(Math.random() * accessoryShapes.length)];

    const randomFaceColor = EMOJI_COLORS.face[Math.floor(Math.random() * EMOJI_COLORS.face.length)];
    const randomEyeColor = EMOJI_COLORS.eyes[Math.floor(Math.random() * EMOJI_COLORS.eyes.length)];
    const randomMouthColor = EMOJI_COLORS.mouth[Math.floor(Math.random() * EMOJI_COLORS.mouth.length)];

    this.addLayer('face', randomFace.id, randomFaceColor, 50, 50, 0.8 + Math.random() * 0.4, 0);
    this.addLayer('eyes', randomEyes.id, randomEyeColor, 50, 50, 0.9 + Math.random() * 0.2, 0);

    if (Math.random() > 0.3) {
      this.addLayer('eyebrows', randomEyebrows.id, '#000000', 50, 50, 1, 0);
    }

    this.addLayer('mouth', randomMouth.id, randomMouthColor, 50, 50 + Math.random() * 5, 0.9 + Math.random() * 0.2, 0);

    if (Math.random() > 0.5 && randomAccessory.id !== 'none') {
      const accessoryColor = EMOJI_COLORS.accessories[Math.floor(Math.random() * EMOJI_COLORS.accessories.length)];
      this.addLayer('accessories', randomAccessory.id, accessoryColor, 50, 50, 1, 0);
    }
  }
}
