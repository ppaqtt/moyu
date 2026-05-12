export interface Note {
  id: number;
  lane: number;
  y: number;
  targetY: number;
  speed: number;
  isHit: boolean;
  hitTime: number;
  type: 'normal' | 'special';
}

export interface RhythmTapState {
  notes: Note[];
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  isPlaying: boolean;
  gameOver: boolean;
  lastNoteId: number;
  bpm: number;
  beatInterval: number;
  nextBeatTime: number;
}

export interface RhythmTapEngine {
  getState(): RhythmTapState;
  handleHit(lane: number): 'perfect' | 'great' | 'good' | 'miss';
  tick(): void;
  reset(): void;
  checkGameOver(): boolean;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 700;
const LANE_COUNT = 4;
const LANE_WIDTH = 80;
const NOTE_SIZE = 60;
const TARGET_Y = 550;
const NOTE_SPEED = 8;
const PERFECT_WINDOW = 50;
const GREAT_WINDOW = 100;
const GOOD_WINDOW = 150;
const GAME_DURATION = 60;

export class RhythmTapEngine implements RhythmTapEngine {
  private notes: Note[] = [];
  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private perfectCount: number = 0;
  private greatCount: number = 0;
  private goodCount: number = 0;
  private missCount: number = 0;
  private isPlaying: boolean = false;
  private gameOver: boolean = false;
  private lastNoteId: number = 0;
  private bpm: number = 120;
  private beatInterval: number = 500;
  private nextBeatTime: number = 0;
  private lastUpdate: number = 0;
  private gameStartTime: number = 0;
  private timeLeft: number = GAME_DURATION;
  private laneHitEffects: { lane: number; time: number; result: string }[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    this.notes = [];
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.isPlaying = false;
    this.gameOver = false;
    this.lastNoteId = 0;
    this.bpm = 120;
    this.beatInterval = 60000 / this.bpm;
    this.lastUpdate = Date.now();
    this.gameStartTime = Date.now();
    this.timeLeft = GAME_DURATION;
    this.nextBeatTime = Date.now() + 1000;
    this.laneHitEffects = [];
  }

  private spawnNote(): void {
    const patterns = [
      [0], [1], [2], [3],
      [0, 2], [1, 3], [0, 1], [2, 3],
      [0, 1, 2], [1, 2, 3],
      [0], [3]
    ];

    const patternIndex = Math.floor(Math.random() * patterns.length);
    const lanes = patterns[patternIndex];

    const travelTime = (TARGET_Y + 100) / NOTE_SPEED;

    lanes.forEach(lane => {
      this.notes.push({
        id: ++this.lastNoteId,
        lane,
        y: -NOTE_SIZE,
        targetY: TARGET_Y,
        speed: NOTE_SPEED,
        isHit: false,
        hitTime: 0,
        type: Math.random() < 0.1 ? 'special' : 'normal'
      });
    });
  }

  getState(): RhythmTapState {
    return {
      notes: this.notes.map(n => ({ ...n })),
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      perfectCount: this.perfectCount,
      greatCount: this.greatCount,
      goodCount: this.goodCount,
      missCount: this.missCount,
      isPlaying: this.isPlaying,
      gameOver: this.gameOver,
      lastNoteId: this.lastNoteId,
      bpm: this.bpm,
      beatInterval: this.beatInterval,
      nextBeatTime: this.nextBeatTime
    };
  }

  handleHit(lane: number): 'perfect' | 'great' | 'good' | 'miss' {
    if (!this.isPlaying || this.gameOver) return 'miss';

    const hitNotes = this.notes
      .filter(n => n.lane === lane && !n.isHit && n.y >= TARGET_Y - 100 && n.y <= TARGET_Y + 100)
      .sort((a, b) => Math.abs(a.y - TARGET_Y) - Math.abs(b.y - TARGET_Y));

    if (hitNotes.length === 0) {
      this.combo = 0;
      this.missCount++;
      return 'miss';
    }

    const note = hitNotes[0];
    const distance = Math.abs(note.y - TARGET_Y);

    note.isHit = true;
    note.hitTime = Date.now();

    let result: 'perfect' | 'great' | 'good' | 'miss';

    if (distance <= PERFECT_WINDOW) {
      result = 'perfect';
      this.perfectCount++;
      this.combo++;
      const comboBonus = Math.min(this.combo, 10) * 10;
      this.score += 100 + comboBonus;
    } else if (distance <= GREAT_WINDOW) {
      result = 'great';
      this.greatCount++;
      this.combo++;
      const comboBonus = Math.min(this.combo, 10) * 5;
      this.score += 75 + comboBonus;
    } else if (distance <= GOOD_WINDOW) {
      result = 'good';
      this.goodCount++;
      this.combo++;
      this.score += 50;
    } else {
      result = 'miss';
      this.missCount++;
      this.combo = 0;
      this.score = Math.max(0, this.score - 10);
    }

    this.maxCombo = Math.max(this.maxCombo, this.combo);

    this.laneHitEffects.push({
      lane,
      time: Date.now(),
      result
    });

    return result;
  }

  tick(): void {
    if (this.gameOver) return;

    const now = Date.now();

    if (now - this.lastUpdate >= 1000) {
      this.timeLeft--;
      this.lastUpdate = now;

      if (this.timeLeft <= 0) {
        this.gameOver = true;
        return;
      }
    }

    if (this.isPlaying) {
      if (now >= this.nextBeatTime) {
        this.spawnNote();
        this.nextBeatTime += this.beatInterval;
      }

      this.notes.forEach(note => {
        if (!note.isHit) {
          note.y += note.speed;

          if (note.y > TARGET_Y + 100) {
            note.isHit = true;
            this.combo = 0;
            this.missCount++;
          }
        }
      });

      this.notes = this.notes.filter(note => {
        if (note.isHit && note.hitTime > 0) {
          return now - note.hitTime < 500;
        }
        return note.y < CANVAS_HEIGHT + 100;
      });

      this.laneHitEffects = this.laneHitEffects.filter(
        effect => now - effect.time < 300
      );
    }
  }

  reset(): void {
    this.init();
    this.isPlaying = true;
  }

  checkGameOver(): boolean {
    return this.gameOver;
  }

  startGame(): void {
    this.isPlaying = true;
  }
}

export const createEngine = (): RhythmTapEngine => {
  return new RhythmTapEngine();
};
