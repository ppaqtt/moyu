import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BeatMetronomeEngine, BEAT_METRONOME_CONSTANTS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new BeatMetronomeEngine();

export default function BeatMetronome() {
  const navigate = useNavigate();
  const [metronomeState, setMetronomeState] = useState(engine.getState());
  const [beatFlash, setBeatFlash] = useState(false);

  useEffect(() => {
    engine.initialize();
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = engine.getState();
      setMetronomeState({ ...state });

      if (state.isPlaying) {
        const currentBeat = state.currentBeat;
        setTimeout(() => {
          setBeatFlash(true);
          setTimeout(() => setBeatFlash(false), 100);
        }, 0);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = useCallback(() => {
    engine.toggle();
    setMetronomeState({ ...engine.getState() });
  }, []);

  const handleBpmChange = useCallback((newBpm: number) => {
    engine.setBpm(newBpm);
    setMetronomeState({ ...engine.getState() });
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    engine.setVolume(vol);
    setMetronomeState({ ...engine.getState() });
  }, []);

  const handleBeatsChange = useCallback((beats: number) => {
    engine.setBeatsPerMeasure(beats);
    setMetronomeState({ ...engine.getState() });
  }, []);

  const handleTapTempo = useCallback(() => {
    engine.tapTempo();
    setMetronomeState({ ...engine.getState() });
  }, []);

  const handlePatternChange = useCallback((pattern: 'straight' | 'swing' | 'half' | 'dotted') => {
    engine.setPattern(pattern);
    setMetronomeState({ ...engine.getState() });
  }, []);

  const handleSoundTypeChange = useCallback((type: 'click' | 'wood' | 'digital' | 'rim') => {
    engine.setSoundType(type);
    setMetronomeState({ ...engine.getState() });
  }, []);

  const currentBeat = engine.getCurrentBeatInMeasure();
  const beatIndicators = Array.from({ length: metronomeState.beatsPerMeasure }, (_, i) => i);

  return (
    <div
      className="flex flex-col items-center p-4 min-h-screen"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #0f0f23 100%)` }}
    >
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}cc;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.secondary}30;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${NEON_COLORS.primary};
          cursor: pointer;
          box-shadow: 0 0 10px ${NEON_COLORS.primary};
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: NEON_COLORS.surface }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ←
          </motion.button>
          <h1 className="text-2xl font-bold" style={{ color: NEON_COLORS.primary }}>
            节奏节拍器
          </h1>
          <div className="w-10" />
        </div>

        <div
          className="rounded-3xl p-8 mb-6"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface} 0%, #16213e 100%)`,
            boxShadow: `0 0 40px ${beatFlash ? NEON_COLORS.success : NEON_COLORS.primary}40`,
          }}
        >
          <div className="flex justify-center gap-3 mb-8">
            {beatIndicators.map((beat, index) => {
              const isActive = metronomeState.isPlaying && (currentBeat === index + 1);
              const isFirstBeat = index === 0;

              return (
                <motion.div
                  key={index}
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{
                    background: isActive
                      ? isFirstBeat
                        ? NEON_COLORS.danger
                        : NEON_COLORS.primary
                      : NEON_COLORS.surface,
                    color: isActive ? NEON_COLORS.background : NEON_COLORS.textDim,
                    boxShadow: isActive ? `0 0 30px ${isFirstBeat ? NEON_COLORS.danger : NEON_COLORS.primary}` : 'none',
                  }}
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.15 }}
                >
                  {index + 1}
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mb-6">
            <motion.div
              className="text-8xl font-bold mb-2"
              style={{
                color: metronomeState.isPlaying ? NEON_COLORS.success : NEON_COLORS.primary,
                textShadow: `0 0 30px ${metronomeState.isPlaying ? NEON_COLORS.success : NEON_COLORS.primary}`,
              }}
              animate={metronomeState.isPlaying ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 60 / metronomeState.bpm, repeat: metronomeState.isPlaying ? Infinity : 0 }}
            >
              {metronomeState.bpm}
            </motion.div>
            <div className="text-xl" style={{ color: NEON_COLORS.textDim }}>
              BPM
            </div>
            <div className="text-lg mt-2" style={{ color: NEON_COLORS.secondary }}>
              {engine.getTimeSignatureDisplay()}
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <motion.button
              onClick={handleToggle}
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{
                background: metronomeState.isPlaying
                  ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                  : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                boxShadow: `0 0 40px ${metronomeState.isPlaying ? NEON_COLORS.danger : NEON_COLORS.primary}60`,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {metronomeState.isPlaying ? '⏹' : '▶'}
            </motion.button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-60">速度</span>
              <span className="text-sm" style={{ color: NEON_COLORS.primary }}>
                {metronomeState.bpm} BPM
              </span>
            </div>
            <input
              type="range"
              min={BEAT_METRONOME_CONSTANTS.MIN_BPM}
              max={BEAT_METRONOME_CONSTANTS.MAX_BPM}
              value={metronomeState.bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              }}
            />
            <div className="flex justify-between text-xs opacity-40 mt-1">
              <span>慢</span>
              <span>快</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {engine.getPresetBpm().map((bpm) => (
              <motion.button
                key={bpm}
                onClick={() => handleBpmChange(bpm)}
                className="px-2 py-1 rounded-lg text-sm"
                style={{
                  background: metronomeState.bpm === bpm ? NEON_COLORS.primary : NEON_COLORS.surface,
                  color: metronomeState.bpm === bpm ? NEON_COLORS.background : NEON_COLORS.text,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {bpm}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            拍数设置
          </h3>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6, 7].map((beats) => (
              <motion.button
                key={beats}
                onClick={() => handleBeatsChange(beats)}
                className="flex-1 py-2 rounded-lg text-sm font-bold"
                style={{
                  background: metronomeState.beatsPerMeasure === beats ? NEON_COLORS.secondary : NEON_COLORS.surface,
                  color: metronomeState.beatsPerMeasure === beats ? NEON_COLORS.background : NEON_COLORS.text,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {beats}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            节奏模式
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'straight' as const, label: '平稳', icon: '▬' },
              { key: 'swing' as const, label: '摇摆', icon: '～' },
              { key: 'half' as const, label: '半分', icon: '◐' },
              { key: 'dotted' as const, label: '附点', icon: '●○' },
            ].map(({ key, label, icon }) => (
              <motion.button
                key={key}
                onClick={() => handlePatternChange(key)}
                className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{
                  background: metronomeState.pattern === key ? NEON_COLORS.primary : NEON_COLORS.surface,
                  color: metronomeState.pattern === key ? NEON_COLORS.background : NEON_COLORS.text,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            音效类型
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'click' as const, label: '咔哒' },
              { key: 'wood' as const, label: '木鱼' },
              { key: 'digital' as const, label: '电子' },
              { key: 'rim' as const, label: '边击' },
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => handleSoundTypeChange(key)}
                className="py-2 rounded-lg text-xs font-bold"
                style={{
                  background: metronomeState.soundType === key ? NEON_COLORS.secondary : NEON_COLORS.surface,
                  color: metronomeState.soundType === key ? NEON_COLORS.background : NEON_COLORS.text,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            音量
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-lg opacity-60">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={metronomeState.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              }}
            />
            <span className="text-lg opacity-60">🔊</span>
          </div>
        </div>

        <motion.button
          onClick={handleTapTempo}
          className="w-full py-4 rounded-xl text-lg font-bold mb-4"
          style={{
            background: NEON_COLORS.surface,
            border: `2px solid ${NEON_COLORS.gold}`,
            color: NEON_COLORS.gold,
          }}
          whileHover={{ scale: 1.02, borderColor: NEON_COLORS.primary }}
          whileTap={{ scale: 0.98 }}
        >
          🎯 Tap Tempo (点击测速)
        </motion.button>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
            节拍器使用技巧
          </h3>
          <div className="text-xs opacity-60 space-y-1">
            <p>• 从60-80 BPM开始练习基础节奏</p>
            <p>• 熟练后逐渐提升到100-120 BPM</p>
            <p>• 使用Tap Tempo可以测量任意歌曲的BPM</p>
            <p>• 摇摆节奏适合爵士和布鲁斯音乐</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
