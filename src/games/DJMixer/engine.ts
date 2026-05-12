export interface Sample {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  isPlaying: boolean;
  volume: number;
}

export interface BeatSlot {
  id: number;
  x: number;
  y: number;
  sample: Sample | null;
  hit: boolean;
  hitTime: number | null;
}

export interface DJMixerState {
  samples: Sample[];
  beatGrid: BeatSlot[];
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  currentBeat: number;
  isPlaying: boolean;
  isGameOver: boolean;
  gameTime: number;
}

export class DJMixerEngine {
  private state: DJMixerState;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly gridCols: number;
  private readonly gridRows: number;
  private readonly beatInterval: number;

  constructor() {
    this.canvasWidth = 600;
    this.canvasHeight = 500;
    this.gridCols = 8;
    this.gridRows = 4;
    this.beatInterval = 400;
    this.state = this.createInitialState();
  }

  private createInitialState(): DJMixerState {
    const sampleColors = [
      '#ff00ff', '#00ffff', '#ffff00', '#ff8800',
      '#00ff00', '#ff0044', '#8800ff', '#00ff88',
    ];
    const sampleNames = ['Kick', 'Snare', 'HiHat', 'Clap', 'Tom', 'Cymbal', 'Rim', 'Shaker'];

    const samples: Sample[] = sampleNames.map((name, i) => ({
      id: `sample-${i}`,
      name,
      color: sampleColors[i],
      x: 0,
      y: 0,
      gridX: 0,
      gridY: i,
      isPlaying: false,
      volume: 1,
    }));

    const beatGrid: BeatSlot[] = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        beatGrid.push({
          id: row * this.gridCols + col,
          x: 0,
          y: 0,
          sample: null,
          hit: false,
          hitTime: null,
        });
      }
    }

    return {
      samples,
      beatGrid,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      currentBeat: 0,
      isPlaying: false,
      isGameOver: false,
      gameTime: 0,
    };
  }

  getState(): DJMixerState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  getGridSize(): { cols: number; rows: number } {
    return { cols: this.gridCols, rows: this.gridRows };
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  start(): void {
    this.reset();
    this.state.isPlaying = true;
    this.state.currentBeat = 0;
    this.state.gameTime = 0;
  }

  tick(deltaTime: number): void {
    if (!this.state.isPlaying || this.state.isGameOver) return;

    this.state.gameTime += deltaTime;

    // Check if current beat should trigger
    const beatDuration = this.beatInterval;
    const newBeat = Math.floor(this.state.gameTime / beatDuration);

    if (newBeat !== this.state.currentBeat && newBeat < this.gridCols) {
      this.state.currentBeat = newBeat;
    }

    // Game over after all beats
    if (this.state.gameTime > this.gridCols * beatDuration + 2000) {
      this.state.isPlaying = false;
      this.state.isGameOver = true;
    }

    // Clear hit effects after time
    this.state.beatGrid.forEach(slot => {
      if (slot.hit && slot.hitTime && this.state.gameTime - slot.hitTime > 500) {
        slot.hit = false;
        slot.hitTime = null;
      }
    });
  }

  placeSample(sampleId: string, gridIndex: number): { result: 'perfect' | 'great' | 'good' | 'miss'; score: number } {
    if (gridIndex < 0 || gridIndex >= this.state.beatGrid.length) {
      return { result: 'miss', score: 0 };
    }

    const slot = this.state.beatGrid[gridIndex];
    const sample = this.state.samples.find(s => s.id === sampleId);

    if (!sample) {
      return { result: 'miss', score: 0 };
    }

    // Check if slot is already occupied
    if (slot.sample !== null) {
      // Remove previous sample
      const prevSample = slot.sample;
      prevSample.gridX = -1;
      prevSample.gridY = parseInt(prevSample.id.split('-')[1]);
    }

    slot.sample = { ...sample };
    slot.sample.gridX = gridIndex % this.gridCols;
    slot.sample.gridY = Math.floor(gridIndex / this.gridCols);
    slot.hit = true;
    slot.hitTime = this.state.gameTime;

    // Score based on timing
    const col = gridIndex % this.gridCols;
    const expectedBeat = col;
    const timingDiff = Math.abs(this.state.currentBeat - expectedBeat);

    let result: 'perfect' | 'great' | 'good' | 'miss';
    let score: number;

    if (timingDiff === 0) {
      result = 'perfect';
      score = 100;
      this.state.perfectCount++;
    } else if (timingDiff <= 1) {
      result = 'great';
      score = 75;
      this.state.greatCount++;
    } else if (timingDiff <= 2) {
      result = 'good';
      score = 50;
      this.state.goodCount++;
    } else {
      result = 'miss';
      score = 0;
      this.state.missCount++;
    }

    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const multiplier = Math.min(1 + Math.floor(this.state.combo / 5) * 0.1, 2);
    this.state.score += Math.floor(score * multiplier);

    return { result, score };
  }

  hitBeat(col: number): { result: 'perfect' | 'great' | 'good' | 'miss'; score: number; hasSample: boolean } {
    // Check if there's a sample in this beat column
    const slotsInCol = this.state.beatGrid.filter(
      (slot, i) => i % this.gridCols === col && slot.sample !== null
    );

    if (slotsInCol.length === 0) {
      this.state.combo = 0;
      return { result: 'miss', score: 0, hasSample: false };
    }

    // Score the closest slot
    let bestSlot: BeatSlot | null = null;
    let minDist = Infinity;

    slotsInCol.forEach(slot => {
      if (slot.hit) return;
      const dist = Math.abs(this.state.currentBeat - col);
      if (dist < minDist) {
        minDist = dist;
        bestSlot = slot;
      }
    });

    if (!bestSlot) {
      return { result: 'miss', score: 0, hasSample: false };
    }

    bestSlot.hit = true;
    bestSlot.hitTime = this.state.gameTime;

    let result: 'perfect' | 'great' | 'good' | 'miss';
    let score: number;

    if (minDist === 0) {
      result = 'perfect';
      score = 100;
      this.state.perfectCount++;
    } else if (minDist <= 1) {
      result = 'great';
      score = 75;
      this.state.greatCount++;
    } else {
      result = 'good';
      score = 50;
      this.state.goodCount++;
    }

    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const multiplier = Math.min(1 + Math.floor(this.state.combo / 5) * 0.1, 2);
    this.state.score += Math.floor(score * multiplier);

    return { result, score, hasSample: true };
  }

  removeSample(gridIndex: number): void {
    if (gridIndex < 0 || gridIndex >= this.state.beatGrid.length) return;
    const slot = this.state.beatGrid[gridIndex];
    if (slot.sample) {
      slot.sample = null;
    }
  }

  getCurrentBeat(): number {
    return this.state.currentBeat;
  }

  getAccuracy(): number {
    const total = this.state.perfectCount + this.state.greatCount + this.state.goodCount + this.state.missCount;
    if (total === 0) return 0;
    const weighted = (this.state.perfectCount * 100 + this.state.greatCount * 80 + this.state.goodCount * 50) / total;
    return Math.round(weighted);
  }
}
