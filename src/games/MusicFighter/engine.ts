import { GAME_CONFIG } from '../../utils/constants';

export interface FighterNote {
  id: number;
  type: 'punch' | 'kick';
  y: number;
  hit: boolean;
  hitTime: number | null;
  timing: 'perfect' | 'great' | 'good' | 'miss' | null;
}

export interface FighterState {
  playerHealth: number;
  enemyHealth: number;
  playerScore: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  notes: FighterNote[];
  currentAttack: 'none' | 'punch' | 'kick';
  enemyState: 'idle' | 'attacking' | 'hurt' | 'dizzy';
  isGameOver: boolean;
  gameTime: number;
  lastSpawnTime: number;
  winner: 'player' | 'enemy' | null;
}

export class MusicFighterEngine {
  private state: FighterState;
  private noteIdCounter: number;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly noteSpeed: number;
  private readonly hitLineY: number;
  private readonly spawnInterval: number;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.canvasWidth = 500;
    this.canvasHeight = 600;
    this.noteSpeed = 0.4;
    this.hitLineY = 450;
    this.spawnInterval = 600;
    this.noteIdCounter = 0;
    this.state = this.createInitialState();
  }

  private createInitialState(): FighterState {
    return {
      playerHealth: 100,
      enemyHealth: 100,
      playerScore: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      notes: [],
      currentAttack: 'none',
      enemyState: 'idle',
      isGameOver: false,
      gameTime: 0,
      lastSpawnTime: 0,
      winner: null,
    };
  }

  getState(): FighterState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  getHitLineY(): number {
    return this.hitLineY;
  }

  reset(): void {
    this.noteIdCounter = 0;
    this.state = this.createInitialState();
  }

  start(): void {
    this.reset();
    this.state.lastSpawnTime = -this.spawnInterval;
    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio not available');
    }
  }

  tick(deltaTime: number): void {
    if (this.state.isGameOver) return;

    this.state.gameTime += deltaTime;

    if (this.state.gameTime - this.state.lastSpawnTime > this.spawnInterval) {
      this.spawnNote();
      this.state.lastSpawnTime = this.state.gameTime;
    }

    this.state.notes.forEach(note => {
      if (!note.hit) {
        note.y += this.noteSpeed * deltaTime;
      }
    });

    this.state.notes.forEach(note => {
      if (!note.hit && note.y > this.hitLineY + GAME_CONFIG.goodWindow) {
        this.registerMiss(note);
      }
    });

    this.state.notes = this.state.notes.filter(
      note => note.y < this.canvasHeight + 100
    );

    if (this.state.playerHealth <= 0 || this.state.enemyHealth <= 0) {
      this.state.isGameOver = true;
      this.state.winner = this.state.enemyHealth <= 0 ? 'player' : 'enemy';
    }

    if (this.state.currentAttack !== 'none') {
      setTimeout(() => {
        this.state.currentAttack = 'none';
      }, 200);
    }
  }

  private spawnNote(): void {
    const type = Math.random() > 0.5 ? 'punch' : 'kick';
    const note: FighterNote = {
      id: this.noteIdCounter++,
      type,
      y: -50,
      hit: false,
      hitTime: null,
      timing: null,
    };
    this.state.notes.push(note);

    if (Math.random() > 0.7) {
      const extraNote: FighterNote = {
        id: this.noteIdCounter++,
        type: Math.random() > 0.5 ? 'punch' : 'kick',
        y: -50,
        hit: false,
        hitTime: null,
        timing: null,
      };
      this.state.notes.push(extraNote);
    }
  }

  private registerMiss(note: FighterNote): void {
    if (note.timing !== 'miss') {
      note.hit = true;
      note.hitTime = this.state.gameTime;
      note.timing = 'miss';
      this.state.missCount++;
      this.state.combo = 0;
      this.state.playerHealth -= 5;
      this.state.enemyState = 'attacking';
      this.playSound('miss');
    }
  }

  handleTap(type: 'punch' | 'kick'): { result: 'perfect' | 'great' | 'good' | 'miss'; score: number } {
    const targetNotes = this.state.notes.filter(
      note => !note.hit && note.type === type
    );

    if (targetNotes.length === 0) {
      this.state.combo = 0;
      this.playSound('miss');
      return { result: 'miss', score: 0 };
    }

    const closestNote = targetNotes.reduce((closest, note) => {
      const closestDist = Math.abs(closest.y - this.hitLineY);
      const noteDist = Math.abs(note.y - this.hitLineY);
      return noteDist < closestDist ? note : closest;
    });

    const distance = Math.abs(closestNote.y - this.hitLineY);
    let timing: 'perfect' | 'great' | 'good' | 'miss';
    let score = 0;

    if (distance <= GAME_CONFIG.perfectWindow) {
      timing = 'perfect';
      score = 150;
      this.state.perfectCount++;
      this.state.enemyHealth -= 8;
    } else if (distance <= GAME_CONFIG.greatWindow) {
      timing = 'great';
      score = 100;
      this.state.greatCount++;
      this.state.enemyHealth -= 5;
    } else if (distance <= GAME_CONFIG.goodWindow) {
      timing = 'good';
      score = 50;
      this.state.goodCount++;
      this.state.enemyHealth -= 3;
    } else {
      timing = 'miss';
      this.registerMiss(closestNote);
      return { result: 'miss', score: 0 };
    }

    closestNote.hit = true;
    closestNote.hitTime = this.state.gameTime;
    closestNote.timing = timing;

    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const comboMultiplier = Math.min(1 + Math.floor(this.state.combo / 10) * 0.1, 2);
    this.state.playerScore += Math.floor(score * comboMultiplier);

    this.state.currentAttack = type;
    this.state.enemyState = 'hurt';

    this.playSound(timing);

    return { result: timing, score };
  }

  private playSound(type: string): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const frequencies: Record<string, number> = {
        perfect: 880,
        great: 660,
        good: 440,
        miss: 220,
      };

      oscillator.frequency.value = frequencies[type] || 440;
      oscillator.type = type === 'miss' ? 'sawtooth' : 'sine';

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not available
    }
  }

  getAccuracy(): number {
    const total = this.state.perfectCount + this.state.greatCount +
                  this.state.goodCount + this.state.missCount;
    if (total === 0) return 0;
    const weighted = (this.state.perfectCount * 100 +
                     this.state.greatCount * 80 +
                     this.state.goodCount * 50) / total;
    return Math.round(weighted);
  }
}
