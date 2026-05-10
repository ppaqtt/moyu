import { GAME_CONFIG } from '../../utils/constants';

export interface Player {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  hitTime: number | null;
  timing: 'perfect' | 'great' | 'good' | 'miss' | null;
}

export interface PlayerState {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  notes: Player[];
  health: number;
}

export interface BeatBattleState {
  player1: PlayerState;
  player2: PlayerState;
  isGameOver: boolean;
  gameTime: number;
  lastSpawnTime: number;
  winner: number | null;
  bpm: number;
}

export class BeatBattleEngine {
  private state: BeatBattleState;
  private noteIdCounter: number;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly noteSpeed: number;
  private readonly hitLineY: number;
  private readonly laneWidth: number;
  private readonly spawnInterval: number;
  private readonly player1Lanes: number;
  private readonly player2Lanes: number;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.canvasWidth = 600;
    this.canvasHeight = 700;
    this.noteSpeed = 0.35;
    this.hitLineY = 550;
    this.laneWidth = this.canvasWidth / 6;
    this.spawnInterval = 500;
    this.noteIdCounter = 0;
    this.player1Lanes = 3;
    this.player2Lanes = 3;
    this.state = this.createInitialState();
  }

  private createInitialState(): BeatBattleState {
    return {
      player1: {
        score: 0,
        combo: 0,
        maxCombo: 0,
        perfectCount: 0,
        greatCount: 0,
        goodCount: 0,
        missCount: 0,
        notes: [],
        health: 100,
      },
      player2: {
        score: 0,
        combo: 0,
        maxCombo: 0,
        perfectCount: 0,
        greatCount: 0,
        goodCount: 0,
        missCount: 0,
        notes: [],
        health: 100,
      },
      isGameOver: false,
      gameTime: 0,
      lastSpawnTime: 0,
      winner: null,
      bpm: 120,
    };
  }

  getState(): BeatBattleState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  getHitLineY(): number {
    return this.hitLineY;
  }

  getLaneWidth(): number {
    return this.laneWidth;
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
      this.spawnNotes();
      this.state.lastSpawnTime = this.state.gameTime;
    }

    this.updateNotes(this.state.player1.notes, deltaTime);
    this.updateNotes(this.state.player2.notes, deltaTime);

    this.checkMissedNotes(this.state.player1);
    this.checkMissedNotes(this.state.player2);

    this.state.player1.notes = this.state.player1.notes.filter(
      note => note.y < this.canvasHeight + 100
    );
    this.state.player2.notes = this.state.player2.notes.filter(
      note => note.y < this.canvasHeight + 100
    );

    if (this.state.player1.health <= 0 || this.state.player2.health <= 0 || this.state.gameTime > 120000) {
      this.state.isGameOver = true;
      if (this.state.player1.health <= 0) {
        this.state.winner = 2;
      } else if (this.state.player2.health <= 0) {
        this.state.winner = 1;
      } else {
        this.state.winner = this.state.player1.score > this.state.player2.score ? 1 :
                           this.state.player2.score > this.state.player1.score ? 2 : 0;
      }
    }
  }

  private spawnNotes(): void {
    const pattern = Math.random();
    if (pattern < 0.3) {
      this.spawnNote(0);
      this.spawnNote(5);
    } else if (pattern < 0.5) {
      this.spawnNote(Math.floor(Math.random() * 3));
      this.spawnNote(5 - Math.floor(Math.random() * 3));
    } else if (pattern < 0.7) {
      this.spawnNote(Math.floor(Math.random() * 3));
      this.spawnNote(3 + Math.floor(Math.random() * 3));
    } else {
      const lane1 = Math.floor(Math.random() * 3);
      const lane2 = 3 + Math.floor(Math.random() * 3);
      this.spawnNote(lane1);
      this.spawnNote(lane2);
    }

    if (Math.random() > 0.85) {
      const doubleLane = Math.floor(Math.random() * 6);
      this.spawnNote(doubleLane);
    }
  }

  private spawnNote(lane: number): void {
    const note: Player = {
      id: this.noteIdCounter++,
      lane,
      y: -50,
      hit: false,
      hitTime: null,
      timing: null,
    };
    if (lane < 3) {
      this.state.player1.notes.push(note);
    } else {
      this.state.player2.notes.push(note);
    }
  }

  private updateNotes(notes: Player[], deltaTime: number): void {
    notes.forEach(note => {
      if (!note.hit) {
        note.y += this.noteSpeed * deltaTime;
      }
    });
  }

  private checkMissedNotes(playerState: PlayerState): void {
    playerState.notes.forEach(note => {
      if (!note.hit && note.y > this.hitLineY + GAME_CONFIG.goodWindow) {
        this.registerMiss(note, playerState);
      }
    });
  }

  private registerMiss(note: Player, playerState: PlayerState): void {
    if (note.timing !== 'miss') {
      note.hit = true;
      note.hitTime = this.state.gameTime;
      note.timing = 'miss';
      playerState.missCount++;
      playerState.combo = 0;
      playerState.health -= 5;
      this.playSound('miss');
    }
  }

  handleTap(playerId: number, lane: number): { result: 'perfect' | 'great' | 'good' | 'miss'; score: number } {
    const playerState = playerId === 1 ? this.state.player1 : this.state.player2;
    const playerNotes = playerState.notes;

    const targetNotes = playerNotes.filter(
      note => !note.hit && note.lane === lane
    );

    if (targetNotes.length === 0) {
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
      score = GAME_CONFIG.perfectScore;
      playerState.perfectCount++;
    } else if (distance <= GAME_CONFIG.greatWindow) {
      timing = 'great';
      score = GAME_CONFIG.greatScore;
      playerState.greatCount++;
    } else if (distance <= GAME_CONFIG.goodWindow) {
      timing = 'good';
      score = GAME_CONFIG.goodScore;
      playerState.goodCount++;
    } else {
      timing = 'miss';
      this.registerMiss(closestNote, playerState);
      return { result: 'miss', score: 0 };
    }

    closestNote.hit = true;
    closestNote.hitTime = this.state.gameTime;
    closestNote.timing = timing;

    playerState.combo++;
    if (playerState.combo > playerState.maxCombo) {
      playerState.maxCombo = playerState.combo;
    }

    const comboMultiplier = Math.min(1 + Math.floor(playerState.combo / 10) * 0.1, 2);
    playerState.score += Math.floor(score * comboMultiplier);

    const opponent = playerId === 1 ? this.state.player2 : this.state.player1;
    opponent.health -= timing === 'perfect' ? 3 : timing === 'great' ? 2 : 1;

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

  getAccuracy(playerId: number): number {
    const playerState = playerId === 1 ? this.state.player1 : this.state.player2;
    const total = playerState.perfectCount + playerState.greatCount +
                  playerState.goodCount + playerState.missCount;
    if (total === 0) return 0;
    const weighted = (playerState.perfectCount * 100 +
                     playerState.greatCount * 80 +
                     playerState.goodCount * 50) / total;
    return Math.round(weighted);
  }
}
