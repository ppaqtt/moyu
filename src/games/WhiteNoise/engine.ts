export interface SoundLayer {
  id: number;
  name: string;
  icon: string;
  volume: number;
  isPlaying: boolean;
  color: string;
  type: 'rain' | 'nature' | 'urban' | 'fire' | 'ambient';
}

export interface WhiteNoiseState {
  layers: SoundLayer[];
  masterVolume: number;
  isPlaying: boolean;
  selectedPreset: string | null;
  timerMinutes: number;
  timerActive: boolean;
  timeRemaining: number;
  showVisualizer: boolean;
}

export class WhiteNoiseEngine {
  private state: WhiteNoiseState;
  private audioContext: AudioContext | null = null;
  private gainNodes: Map<number, GainNode> = new Map();
  private noiseBuffers: Map<number, AudioBufferSourceNode> = new Map();
  private timerInterval: number | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): WhiteNoiseState {
    return {
      layers: [
        { id: 1, name: '雨声', icon: '🌧️', volume: 0.5, isPlaying: false, color: '#00d2ff', type: 'nature' },
        { id: 2, name: '海浪', icon: '🌊', volume: 0.5, isPlaying: false, color: '#3b82f6', type: 'nature' },
        { id: 3, name: '森林', icon: '🌲', volume: 0.5, isPlaying: false, color: '#22c55e', type: 'nature' },
        { id: 4, name: '鸟鸣', icon: '🐦', volume: 0.5, isPlaying: false, color: '#84cc16', type: 'nature' },
        { id: 5, name: '风声', icon: '💨', volume: 0.5, isPlaying: false, color: '#a855f7', type: 'nature' },
        { id: 6, name: '雷声', icon: '⛈️', volume: 0.5, isPlaying: false, color: '#6366f1', type: 'nature' },
        { id: 7, name: '篝火', icon: '🔥', volume: 0.5, isPlaying: false, color: '#f59e0b', type: 'fire' },
        { id: 8, name: '咖啡厅', icon: '☕', volume: 0.5, isPlaying: false, color: '#a3835a', type: 'ambient' },
        { id: 9, name: '图书馆', icon: '📚', volume: 0.5, isPlaying: false, color: '#ec4899', type: 'ambient' },
        { id: 10, name: '白噪音', icon: '📻', volume: 0.5, isPlaying: false, color: '#ffffff', type: 'ambient' },
      ],
      masterVolume: 0.7,
      isPlaying: false,
      selectedPreset: null,
      timerMinutes: 30,
      timerActive: false,
      timeRemaining: 0,
      showVisualizer: true,
    };
  }

  public initialize(): void {
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.state.masterVolume;
    } catch (e) {
      console.log('Audio context not available');
    }
  }

  public toggleMaster(): void {
    if (!this.audioContext) {
      this.initialize();
    }

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.state.isPlaying = !this.state.isPlaying;

    if (this.state.isPlaying) {
      this.state.layers.forEach(layer => {
        if (layer.isPlaying) {
          this.startNoiseLayer(layer.id);
        }
      });
    } else {
      this.stopAllLayers();
    }
  }

  public toggleLayer(layerId: number): void {
    const layer = this.state.layers.find(l => l.id === layerId);
    if (!layer) return;

    layer.isPlaying = !layer.isPlaying;

    if (this.state.isPlaying) {
      if (layer.isPlaying) {
        this.startNoiseLayer(layerId);
      } else {
        this.stopNoiseLayer(layerId);
      }
    }
  }

  private startNoiseLayer(layerId: number): void {
    if (!this.audioContext || !this.masterGain) return;

    this.stopNoiseLayer(layerId);

    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    const layer = this.state.layers.find(l => l.id === layerId);
    const noiseType = layer?.type || 'ambient';

    for (let i = 0; i < bufferSize; i++) {
      output[i] = this.generateNoise(i, noiseType, layer?.id || 1);
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = layer?.volume || 0.5;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = this.getFilterType(layerId);
    filter.frequency.value = this.getFilterFrequency(layerId);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseSource.start();

    this.noiseBuffers.set(layerId, noiseSource);
    this.gainNodes.set(layerId, gainNode);
  }

  private generateNoise(index: number, type: string, layerId: number): number {
    let noise = Math.random() * 2 - 1;

    switch (type) {
      case 'nature':
        noise = this.applyNatureModulation(noise, index, layerId);
        break;
      case 'fire':
        noise = this.applyFireModulation(noise, index);
        break;
      case 'ambient':
        noise = this.applyAmbientModulation(noise, index, layerId);
        break;
    }

    return noise;
  }

  private applyNatureModulation(noise: number, index: number, layerId: number): number {
    const modulation = Math.sin(index / 10000 * (layerId + 1)) * 0.3;
    const wave = Math.sin(index / 5000) * 0.2;
    return noise * 0.5 + modulation * 0.3 + wave * 0.2;
  }

  private applyFireModulation(noise: number, index: number): number {
    const crackle = Math.random() > 0.995 ? Math.random() * 0.5 : 0;
    const base = Math.sin(index / 8000) * 0.3;
    return noise * 0.4 + base * 0.4 + crackle * 0.2;
  }

  private applyAmbientModulation(noise: number, index: number, layerId: number): number {
    const modulation = Math.sin(index / 20000 * layerId) * 0.2;
    return noise * 0.6 + modulation;
  }

  private getFilterType(layerId: number): BiquadFilterType {
    const filterTypes: BiquadFilterType[] = ['lowpass', 'bandpass', 'lowpass', 'bandpass', 'highpass', 'lowpass', 'lowpass', 'bandpass', 'bandpass', 'highpass'];
    return filterTypes[layerId % filterTypes.length];
  }

  private getFilterFrequency(layerId: number): number {
    const frequencies = [2000, 1500, 3000, 2500, 1000, 800, 1200, 1800, 2200, 4000];
    return frequencies[layerId % frequencies.length];
  }

  private stopNoiseLayer(layerId: number): void {
    const source = this.noiseBuffers.get(layerId);
    if (source) {
      try {
        source.stop();
      } catch (e) {
      }
      this.noiseBuffers.delete(layerId);
    }
    this.gainNodes.delete(layerId);
  }

  private stopAllLayers(): void {
    this.noiseBuffers.forEach((source, id) => {
      try {
        source.stop();
      } catch (e) {
      }
    });
    this.noiseBuffers.clear();
    this.gainNodes.clear();
  }

  public setLayerVolume(layerId: number, volume: number): void {
    const layer = this.state.layers.find(l => l.id === layerId);
    if (!layer) return;

    layer.volume = Math.max(0, Math.min(1, volume));

    const gainNode = this.gainNodes.get(layerId);
    if (gainNode) {
      gainNode.gain.value = layer.volume;
    }
  }

  public setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.state.masterVolume;
    }
  }

  public applyPreset(presetName: string): void {
    this.state.selectedPreset = presetName;
    this.stopAllLayers();

    const presets: Record<string, number[]> = {
      '雨天': [1],
      '海边': [2],
      '森林': [3, 4],
      '夜晚': [5, 10],
      '篝火': [7],
      '咖啡厅': [8],
      '专注': [10, 5],
      '睡眠': [1, 2, 10],
    };

    const presetLayers = presets[presetName] || [];
    presetLayers.forEach(layerId => {
      const layer = this.state.layers.find(l => l.id === layerId);
      if (layer) {
        layer.isPlaying = true;
        if (this.state.isPlaying) {
          this.startNoiseLayer(layerId);
        }
      }
    });

    this.state.layers.forEach(layer => {
      if (!presetLayers.includes(layer.id)) {
        layer.isPlaying = false;
      }
    });
  }

  public startTimer(): void {
    if (this.state.timerActive) {
      this.stopTimer();
      return;
    }

    this.state.timerActive = true;
    this.state.timeRemaining = this.state.timerMinutes * 60;

    this.timerInterval = window.setInterval(() => {
      this.state.timeRemaining--;

      if (this.state.timeRemaining <= 0) {
        this.stopTimer();
        this.stopAllLayers();
        this.state.isPlaying = false;
      }
    }, 1000);
  }

  public stopTimer(): void {
    this.state.timerActive = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public setTimerMinutes(minutes: number): void {
    this.state.timerMinutes = Math.max(5, Math.min(180, minutes));
  }

  public toggleVisualizer(): void {
    this.state.showVisualizer = !this.state.showVisualizer;
  }

  public getPresetList(): { name: string; icon: string; layers: string[] }[] {
    return [
      { name: '雨天', icon: '🌧️', layers: ['雨声'] },
      { name: '海边', icon: '🌊', layers: ['海浪'] },
      { name: '森林', icon: '🌲', layers: ['森林', '鸟鸣'] },
      { name: '夜晚', icon: '🌙', layers: ['风声', '白噪音'] },
      { name: '篝火', icon: '🔥', layers: ['篝火'] },
      { name: '咖啡厅', icon: '☕', layers: ['咖啡厅'] },
      { name: '专注', icon: '🎯', layers: ['白噪音', '风声'] },
      { name: '睡眠', icon: '😴', layers: ['雨声', '海浪', '白噪音'] },
    ];
  }

  public getState(): WhiteNoiseState {
    return { ...this.state };
  }

  public cleanup(): void {
    this.stopTimer();
    this.stopAllLayers();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const WHITE_NOISE_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 700,
  TIMER_PRESETS: [5, 10, 15, 30, 45, 60, 90, 120],
};
