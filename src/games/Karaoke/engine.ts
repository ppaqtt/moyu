export interface LyricLine {
  id: number;
  text: string;
  pinyin?: string;
  startTime: number;
  endTime: number;
  pitch?: number;
}

export interface SingingResult {
  lineIndex: number;
  accuracy: number;
  score: number;
}

export interface KaraokeState {
  currentLineIndex: number;
  score: number;
  totalAccuracy: number;
  isGameOver: boolean;
  lyrics: LyricLine[];
  currentTime: number;
  lineResults: SingingResult[];
  isSinging: boolean;
  currentPitch: number;
  pitchAccuracy: number;
  streak: number;
}

export class KaraokeEngine {
  private state: KaraokeState;
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private gameTime: number = 0;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): KaraokeState {
    return {
      currentLineIndex: 0,
      score: 0,
      totalAccuracy: 0,
      isGameOver: false,
      lyrics: this.generateLyrics(),
      currentTime: 0,
      lineResults: [],
      isSinging: false,
      currentPitch: 0,
      pitchAccuracy: 0,
      streak: 0,
    };
  }

  private generateLyrics(): LyricLine[] {
    const songs = [
      {
        name: '小星星',
        lyrics: [
          { text: '一闪一闪亮晶晶', pinyin: 'yi shan yi shan liang jing jing', pitch: 5 },
          { text: '满天都是小星星', pinyin: 'man tian dou shi xiao xing xing', pitch: 3 },
          { text: '挂在天空放光明', pinyin: 'gua zai tian kong fang guang ming', pitch: 5 },
          { text: '好像许多小眼睛', pinyin: 'hao xiang xu duo xiao yan jing', pitch: 3 },
          { text: '一闪一闪亮晶晶', pinyin: 'yi shan yi shan liang jing jing', pitch: 5 },
          { text: '满天都是小星星', pinyin: 'man tian dou shi xiao xing xing', pitch: 3 },
        ]
      },
      {
        name: '生日快乐',
        lyrics: [
          { text: '祝你生日快乐', pinyin: 'zhu ni sheng ri kuai le', pitch: 5 },
          { text: '祝你生日快乐', pinyin: 'zhu ni sheng ri kuai le', pitch: 5 },
          { text: '祝你生日快乐', pinyin: 'zhu ni sheng ri kuai le', pitch: 5 },
          { text: '祝你天天快乐', pinyin: 'zhu ni tian tian kuai le', pitch: 3 },
        ]
      },
      {
        name: '两只老虎',
        lyrics: [
          { text: '两只老虎跑得快', pinyin: 'liang zhi lao hu pao de kuai', pitch: 5 },
          { text: '跑得快', pinyin: 'pao de kuai', pitch: 5 },
          { text: '一只没有耳朵', pinyin: 'yi zhi mei you er duo', pitch: 3 },
          { text: '一只没有尾巴', pinyin: 'yi zhi mei you wei ba', pitch: 3 },
          { text: '真奇怪', pinyin: 'zhen qi guai', pitch: 5 },
          { text: '真奇怪', pinyin: 'zhen qi guai', pitch: 3 },
        ]
      }
    ];

    const song = songs[Math.floor(Math.random() * songs.length)];
    const lineDuration = 3000;
    const lyrics: LyricLine[] = [];

    song.lyrics.forEach((line, index) => {
      lyrics.push({
        id: index,
        text: line.text,
        pinyin: line.pinyin,
        startTime: index * lineDuration,
        endTime: (index + 1) * lineDuration,
        pitch: line.pitch,
      });
    });

    return lyrics;
  }

  public start(): void {
    this.state = this.getInitialState();
    this.state.lyrics = this.generateLyrics();
    this.gameTime = 0;
    this.isPlaying = true;

    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio not available');
    }
  }

  public tick(deltaTime: number): void {
    if (!this.isPlaying || this.state.isGameOver) return;

    this.gameTime += deltaTime;
    this.state.currentTime = this.gameTime;

    const currentLine = this.state.lyrics[this.state.currentLineIndex];
    if (currentLine && this.gameTime >= currentLine.endTime) {
      this.state.currentLineIndex++;
    }

    if (this.state.currentLineIndex >= this.state.lyrics.length) {
      this.state.isGameOver = true;
      this.isPlaying = false;
    }
  }

  public sing(pitch: number): { accuracy: number; score: number; isCorrect: boolean } {
    if (!this.isPlaying || this.state.isGameOver) {
      return { accuracy: 0, score: 0, isCorrect: false };
    }

    this.state.currentPitch = pitch;

    const currentLine = this.state.lyrics[this.state.currentLineIndex];
    if (!currentLine) {
      return { accuracy: 0, score: 0, isCorrect: false };
    }

    const targetPitch = currentLine.pitch || 5;
    const pitchDiff = Math.abs(pitch - targetPitch);

    let accuracy: number;
    let score: number;

    if (pitchDiff === 0) {
      accuracy = 100;
      score = 100;
    } else if (pitchDiff === 1) {
      accuracy = 80;
      score = 80;
    } else if (pitchDiff === 2) {
      accuracy = 60;
      score = 50;
    } else {
      accuracy = 30;
      score = 20;
    }

    this.state.pitchAccuracy = accuracy;
    this.state.totalAccuracy += accuracy;
    this.state.score += score;
    this.state.streak++;

    this.playTone(pitch);

    return {
      accuracy,
      score,
      isCorrect: pitchDiff <= 1,
    };
  }

  public selectNextLine(): void {
    if (this.state.currentLineIndex < this.state.lyrics.length - 1) {
      this.state.currentLineIndex++;
    }
  }

  public selectPrevLine(): void {
    if (this.state.currentLineIndex > 0) {
      this.state.currentLineIndex--;
    }
  }

  private playTone(pitch: number): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const baseFreq = 261.63;
      oscillator.frequency.value = baseFreq * Math.pow(2, pitch / 12);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not available
    }
  }

  public getState(): KaraokeState {
    return { ...this.state };
  }

  public getAverageAccuracy(): number {
    const total = this.state.lineResults.length;
    if (total === 0) return 100;
    const avg = this.state.lineResults.reduce((sum, r) => sum + r.accuracy, 0) / total;
    return Math.round(avg * 100) / 100;
  }

  public getTotalLines(): number {
    return this.state.lyrics.length;
  }

  public getCompletedLines(): number {
    return this.state.currentLineIndex;
  }
}

export const PITCH_LABELS = ['1', '2', '3', '4', '5', '6', '7'];
export const PITCH_COLORS = ['#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'];
