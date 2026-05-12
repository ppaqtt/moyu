export interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number;
  genre: string;
  difficulty: number;
}

export interface GuessSongState {
  currentSong: Song | null;
  score: number;
  streak: number;
  maxStreak: number;
  totalRounds: number;
  correctAnswers: number;
  timeLeft: number;
  isPlaying: boolean;
  options: string[];
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  gamePhase: 'menu' | 'playing' | 'result' | 'gameover';
  difficulty: 'easy' | 'medium' | 'hard';
  hintUsed: boolean;
  pointsEarned: number;
}

const SONG_LIBRARY: Song[] = [
  { id: 1, title: '小星星', artist: '童谣', duration: 30, genre: '童谣', difficulty: 1 },
  { id: 2, title: '生日快乐', artist: '传统', duration: 25, genre: '童谣', difficulty: 1 },
  { id: 3, title: '玛丽有只小羊羔', artist: '童谣', duration: 28, genre: '童谣', difficulty: 1 },
  { id: 4, title: '两只老虎', artist: '童谣', duration: 32, genre: '童谣', difficulty: 1 },
  { id: 5, title: '欢乐颂', artist: '贝多芬', duration: 45, genre: '古典', difficulty: 2 },
  { id: 6, title: '致爱丽丝', artist: '贝多芬', duration: 60, genre: '古典', difficulty: 2 },
  { id: 7, title: '土耳其进行曲', artist: '莫扎特', duration: 55, genre: '古典', difficulty: 2 },
  { id: 8, title: '卡农', artist: '帕赫贝尔', duration: 50, genre: '古典', difficulty: 2 },
  { id: 9, title: '梦中的婚礼', artist: '理查德', duration: 65, genre: '轻音乐', difficulty: 2 },
  { id: 10, title: '天空之城', artist: '久石让', duration: 70, genre: '轻音乐', difficulty: 2 },
  { id: 11, title: '菊次郎的夏天', artist: '久石让', duration: 55, genre: '轻音乐', difficulty: 2 },
  { id: 12, title: '梁祝', artist: '陈钢', duration: 80, genre: '民乐', difficulty: 3 },
  { id: 13, title: '高山流水', artist: '古曲', duration: 75, genre: '民乐', difficulty: 3 },
  { id: 14, title: '春江花月夜', artist: '古曲', duration: 70, genre: '民乐', difficulty: 3 },
  { id: 15, title: '茉莉花', artist: '民歌', duration: 35, genre: '民歌', difficulty: 1 },
  { id: 16, title: '我的祖国', artist: '民歌', duration: 50, genre: '民歌', difficulty: 2 },
];

export class GuessSongEngine {
  private state: GuessSongState;
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private usedSongIds: Set<number> = new Set();

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GuessSongState {
    return {
      currentSong: null,
      score: 0,
      streak: 0,
      maxStreak: 0,
      totalRounds: 0,
      correctAnswers: 0,
      timeLeft: 15,
      isPlaying: false,
      options: [],
      selectedAnswer: null,
      isCorrect: null,
      gamePhase: 'menu',
      difficulty: 'easy',
      hintUsed: false,
      pointsEarned: 0,
    };
  }

  public start(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.state = this.getInitialState();
    this.state.difficulty = difficulty;
    this.state.gamePhase = 'playing';
    this.usedSongIds.clear();
    this.nextRound();

    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio not available');
    }
  }

  private nextRound(): void {
    const availableSongs = SONG_LIBRARY.filter(s => !this.usedSongIds.has(s.id));
    if (availableSongs.length < 4) {
      this.usedSongIds.clear();
    }

    const filteredSongs = availableSongs.filter(s => {
      if (this.state.difficulty === 'easy') return s.difficulty === 1;
      if (this.state.difficulty === 'medium') return s.difficulty <= 2;
      return true;
    });

    const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
    const correctSong = shuffled[0];
    this.usedSongIds.add(correctSong.id);

    const wrongOptions = shuffled.slice(1, 4).map(s => `${s.title} - ${s.artist}`);
    const allOptions = [correctSong.title + ' - ' + correctSong.artist, ...wrongOptions];
    this.state.options = allOptions.sort(() => Math.random() - 0.5);

    this.state.currentSong = correctSong;
    this.state.timeLeft = this.state.difficulty === 'hard' ? 10 : this.state.difficulty === 'medium' ? 12 : 15;
    this.state.selectedAnswer = null;
    this.state.isCorrect = null;
    this.state.hintUsed = false;
    this.state.isPlaying = true;
    this.state.totalRounds++;

    this.playMelody(correctSong);
  }

  private playMelody(song: Song): void {
    if (!this.audioContext) return;

    this.stopMelody();

    const frequencies = this.getMelodyFrequencies(song);
    let noteIndex = 0;

    const playNote = () => {
      if (noteIndex >= frequencies.length || !this.state.isPlaying) return;

      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.frequency.value = frequencies[noteIndex];
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3);

      osc.start(this.audioContext!.currentTime);
      osc.stop(this.audioContext!.currentTime + 0.3);

      noteIndex++;
      if (noteIndex < frequencies.length && this.state.isPlaying) {
        setTimeout(playNote, 300);
      }
    };

    playNote();
  }

  private getMelodyFrequencies(song: Song): number[] {
    const melodyMap: Record<number, number[]> = {
      1: [261.63, 261.63, 392.00, 392.00],
      2: [329.63, 329.63, 392.00, 329.63, 523.25, 493.88, 440.00],
      3: [392.00, 392.00, 329.63, 329.63, 261.63, 261.63, 392.00],
      4: [392.00, 440.00, 392.00, 329.63, 293.66, 293.66, 261.63],
      5: [523.25, 523.25, 659.25, 659.25],
      6: [329.63, 392.00, 523.25, 392.00],
      7: [392.00, 440.00, 523.25, 587.33, 523.25],
      8: [392.00, 440.00, 523.25, 659.25, 523.25, 392.00],
      9: [261.63, 329.63, 392.00, 523.25, 392.00],
      10: [293.66, 329.63, 392.00, 440.00, 392.00, 329.63],
      11: [392.00, 440.00, 523.25, 587.33, 523.25, 440.00],
      12: [261.63, 329.63, 392.00, 329.63, 392.00, 523.25],
      13: [329.63, 392.00, 440.00, 392.00, 440.00, 523.25],
      14: [261.63, 293.66, 329.63, 392.00, 329.63, 293.66],
      15: [329.63, 392.00, 329.63, 293.66, 261.63],
      16: [523.25, 523.25, 523.25, 523.25, 587.33, 659.25],
    };

    return melodyMap[song.id] || [440.00, 523.25, 659.25];
  }

  public stopMelody(): void {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
  }

  public replayMelody(): void {
    if (this.state.currentSong && this.state.isPlaying) {
      this.playMelody(this.state.currentSong);
    }
  }

  public useHint(): void {
    if (this.state.hintUsed || !this.state.currentSong) return;

    this.state.hintUsed = true;
    this.state.score = Math.max(0, this.state.score - 50);
  }

  public selectAnswer(answer: string): void {
    if (!this.state.currentSong || this.state.selectedAnswer !== null) return;

    const correctAnswer = this.state.currentSong.title + ' - ' + this.state.currentSong.artist;
    this.state.selectedAnswer = answer;
    this.state.isCorrect = answer === correctAnswer;

    if (this.state.isCorrect) {
      this.state.streak++;
      this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);
      this.state.correctAnswers++;

      const basePoints = this.state.difficulty === 'easy' ? 100 : this.state.difficulty === 'medium' ? 200 : 300;
      const streakBonus = this.state.streak * 10;
      const timeBonus = Math.floor(this.state.timeLeft * 5);
      const hintPenalty = this.state.hintUsed ? 50 : 0;

      this.state.pointsEarned = basePoints + streakBonus + timeBonus - hintPenalty;
      this.state.score += this.state.pointsEarned;
    } else {
      this.state.streak = 0;
      this.state.pointsEarned = 0;
    }

    this.state.isPlaying = false;
    this.stopMelody();
  }

  public nextQuestion(): void {
    if (this.state.totalRounds >= 10) {
      this.state.gamePhase = 'gameover';
    } else {
      this.nextRound();
    }
  }

  public tick(deltaTime: number): void {
    if (this.state.gamePhase !== 'playing' || !this.state.isPlaying) return;

    this.state.timeLeft -= deltaTime / 1000;

    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0;
      this.state.selectedAnswer = '';
      this.state.isCorrect = false;
      this.state.streak = 0;
      this.state.isPlaying = false;
      this.stopMelody();
    }
  }

  public getState(): GuessSongState {
    return { ...this.state };
  }

  public getAccuracy(): number {
    if (this.state.totalRounds === 0) return 0;
    return Math.round((this.state.correctAnswers / this.state.totalRounds) * 100);
  }

  public getSongInfo(): { title: string; artist: string; genre: string } | null {
    if (!this.state.currentSong) return null;
    return {
      title: this.state.currentSong.title,
      artist: this.state.currentSong.artist,
      genre: this.state.currentSong.genre,
    };
  }
}

export const GUESS_SONG_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 500,
  ROUNDS_PER_GAME: 10,
  TIME_EASY: 15,
  TIME_MEDIUM: 12,
  TIME_HARD: 10,
};
