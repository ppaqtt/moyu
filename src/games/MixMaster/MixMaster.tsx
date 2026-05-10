import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MixMasterEngine, TRACK_COLORS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new MixMasterEngine();

export default function MixMaster() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
  const [loopNames, setLoopNames] = useState<string[]>([]);
  const [trackVolumes, setTrackVolumes] = useState<number[]>([70, 70, 70, 70]);
  const [trackMutes, setTrackMutes] = useState<boolean[]>([false, false, false, false]);
  const [trackSolos, setTrackSolos] = useState<boolean[]>([false, false, false, false]);
  const [masterVolume, setMasterVolume] = useState(70);
  const [score, setScore] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [waveforms, setWaveforms] = useState<number[][]>([]);

  const trackNames = ['鼓点', '贝斯', '旋律', '合成器'];

  useEffect(() => {
    const loops = engine.getState().loops;
    setLoopNames(loops.map(l => l.name));
  }, []);

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setIsPlaying(false);
    setCurrentLoopIndex(0);
    setTrackVolumes([70, 70, 70, 70]);
    setTrackMutes([false, false, false, false]);
    setTrackSolos([false, false, false, false]);
    setMasterVolume(70);
    setScore(0);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const state = engine.getState();
      setIsPlaying(state.isPlaying);
      setScore(state.score);
      setCurrentStep(engine.getCurrentStep());

      if (state.currentLoop) {
        setWaveforms(state.currentLoop.tracks.map(t => t.waveform));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState]);

  const handlePlay = () => {
    if (isPlaying) {
      engine.stop();
    } else {
      engine.play();
    }
  };

  const handleLoopSelect = (index: number) => {
    engine.selectLoop(index);
    setCurrentLoopIndex(index);
    setTrackVolumes([70, 70, 70, 70]);
    setTrackMutes([false, false, false, false]);
    setTrackSolos([false, false, false, false]);
  };

  const handleVolumeChange = (trackIndex: number, value: number) => {
    const newVolumes = [...trackVolumes];
    newVolumes[trackIndex] = value;
    setTrackVolumes(newVolumes);
    engine.setTrackVolume(trackIndex, value);
  };

  const handleMuteToggle = (trackIndex: number) => {
    const newMutes = [...trackMutes];
    newMutes[trackIndex] = !newMutes[trackIndex];
    setTrackMutes(newMutes);
    engine.toggleTrackMute(trackIndex);
  };

  const handleSoloToggle = (trackIndex: number) => {
    const newSolos = [...trackSolos];
    newSolos[trackIndex] = !newSolos[trackIndex];
    setTrackSolos(newSolos);
    engine.toggleTrackSolo(trackIndex);
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    engine.setMasterVolume(value);
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="text-8xl mb-6"
      >
        🎛️
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonCyan,
        textShadow: `0 0 30px ${NEON_COLORS.neonCyan}, 0 0 60px ${NEON_COLORS.neonCyan}`
      }}>
        MixMaster
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.neonGreen }}>
        混音大师
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonGreen})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始混音
      </motion.button>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg text-base"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>
      <div className="mt-8 text-center opacity-60">
        <p className="mb-2">操作说明</p>
        <p className="text-sm">调节各轨道的音量</p>
        <p className="text-sm">使用静音和独奏来创作独特的混音</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 700 }}>
      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs opacity-70">当前loop</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>
              {loopNames[currentLoopIndex] || '选择Loop'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs opacity-70">混音得分</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>{score}</div>
            </div>
            <motion.button
              onClick={handlePlay}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: isPlaying ? NEON_COLORS.neonGreen : `${NEON_COLORS.neonGreen}40`,
                border: `2px solid ${NEON_COLORS.neonGreen}`,
                boxShadow: isPlaying ? `0 0 20px ${NEON_COLORS.neonGreen}` : 'none',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? '⏸' : '▶'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center gap-2">
        {loopNames.map((name, i) => (
          <button
            key={i}
            onClick={() => handleLoopSelect(i)}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{
              background: currentLoopIndex === i ? NEON_COLORS.neonCyan : `${NEON_COLORS.neonCyan}30`,
              border: `2px solid ${NEON_COLORS.neonCyan}`,
              color: currentLoopIndex === i ? '#000' : NEON_COLORS.neonCyan,
              boxShadow: currentLoopIndex === i ? `0 0 15px ${NEON_COLORS.neonCyan}` : 'none',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="w-full glass-card rounded-xl p-4" style={{ background: '#0a0a1a' }}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold">主音量</span>
            <span className="text-sm">{masterVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: NEON_COLORS.neonCyan }}
          />
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 text-center">
            <div className="text-xs opacity-60">步进</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>
              {currentStep + 1}/32
            </div>
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: NEON_COLORS.surface }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonGreen})` }}
              animate={{ width: `${((currentStep + 1) / 32) * 100}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>

        {trackNames.map((name, trackIndex) => (
          <div key={trackIndex} className="mb-4 p-3 rounded-lg" style={{ background: `${TRACK_COLORS[trackIndex]}15` }}>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 text-center">
                <div
                  className="text-sm font-bold"
                  style={{ color: TRACK_COLORS[trackIndex] }}
                >
                  {name}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleMuteToggle(trackIndex)}
                  className="w-10 h-8 rounded text-xs font-bold"
                  style={{
                    background: trackMutes[trackIndex] ? NEON_COLORS.warning : 'transparent',
                    border: `1px solid ${NEON_COLORS.warning}`,
                    color: trackMutes[trackIndex] ? '#000' : NEON_COLORS.warning,
                  }}
                >
                  M
                </button>
                <button
                  onClick={() => handleSoloToggle(trackIndex)}
                  className="w-10 h-8 rounded text-xs font-bold"
                  style={{
                    background: trackSolos[trackIndex] ? NEON_COLORS.gold : 'transparent',
                    border: `1px solid ${NEON_COLORS.gold}`,
                    color: trackSolos[trackIndex] ? '#000' : NEON_COLORS.gold,
                  }}
                >
                  S
                </button>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs opacity-60">音量</span>
                  <span className="text-xs">{trackVolumes[trackIndex]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trackVolumes[trackIndex]}
                  onChange={(e) => handleVolumeChange(trackIndex, Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: TRACK_COLORS[trackIndex] }}
                />
              </div>
            </div>

            <div className="flex gap-1 items-end h-12">
              {waveforms[trackIndex]?.map((value, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    background: i === currentStep
                      ? TRACK_COLORS[trackIndex]
                      : `${TRACK_COLORS[trackIndex]}80`,
                    height: `${Math.max(4, value * 48)}px`,
                    boxShadow: i === currentStep ? `0 0 10px ${TRACK_COLORS[trackIndex]}` : 'none',
                  }}
                  animate={i === currentStep ? { scaleY: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="text-center text-sm opacity-70 mb-2">混音技巧</div>
        <div className="flex justify-center gap-4 text-xs opacity-60">
          <span>M = 静音</span>
          <span>S = 独奏</span>
          <span>激活所有轨道获得更高分数</span>
        </div>
      </div>

      <motion.button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg mt-4"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
        whileHover={{ scale: 1.05 }}
      >
        返回主页
      </motion.button>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #0a1a2a 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}dd;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonCyan}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
    </div>
  );
}
