import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WhiteNoiseEngine, WHITE_NOISE_CONSTANTS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new WhiteNoiseEngine();

export default function WhiteNoise() {
  const navigate = useNavigate();
  const [noiseState, setNoiseState] = useState(engine.getState());
  const [timerDisplay, setTimerDisplay] = useState('00:00');

  useEffect(() => {
    engine.initialize();
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNoiseState({ ...engine.getState() });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const minutes = Math.floor(noiseState.timeRemaining / 60);
    const seconds = noiseState.timeRemaining % 60;
    setTimerDisplay(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }, [noiseState.timeRemaining]);

  const handleToggleMaster = useCallback(() => {
    engine.toggleMaster();
    setNoiseState({ ...engine.getState() });
  }, []);

  const handleToggleLayer = useCallback((layerId: number) => {
    engine.toggleLayer(layerId);
    setNoiseState({ ...engine.getState() });
  }, []);

  const handleLayerVolume = useCallback((layerId: number, volume: number) => {
    engine.setLayerVolume(layerId, volume);
    setNoiseState({ ...engine.getState() });
  }, []);

  const handleMasterVolume = useCallback((volume: number) => {
    engine.setMasterVolume(volume);
    setNoiseState({ ...engine.getState() });
  }, []);

  const handlePreset = useCallback((presetName: string) => {
    engine.applyPreset(presetName);
    if (!noiseState.isPlaying) {
      engine.toggleMaster();
    }
    setNoiseState({ ...engine.getState() });
  }, [noiseState.isPlaying]);

  const handleTimer = useCallback(() => {
    engine.startTimer();
    setNoiseState({ ...engine.getState() });
  }, []);

  const handleTimerMinutes = useCallback((minutes: number) => {
    engine.setTimerMinutes(minutes);
    setNoiseState({ ...engine.getState() });
  }, []);

  const activeLayers = noiseState.layers.filter(l => l.isPlaying);
  const presets = engine.getPresetList();

  const renderVisualizer = () => (
    <motion.div
      className="flex items-end justify-center gap-1 h-24 mb-6"
      animate={noiseState.isPlaying && activeLayers.length > 0 ? {
        opacity: [0.7, 1, 0.7],
      } : {}}
      transition={{ duration: 2, repeat: noiseState.isPlaying ? Infinity : 0 }}
    >
      {Array.from({ length: 32 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full"
          style={{
            background: activeLayers.length > 0 ? activeLayers[0].color : NEON_COLORS.primary,
            height: noiseState.isPlaying && activeLayers.length > 0
              ? `${Math.max(10, Math.random() * 80 + 10)}%`
              : '10%',
          }}
          animate={noiseState.isPlaying && activeLayers.length > 0 ? {
            height: [ `${Math.random() * 60 + 20}%`, `${Math.random() * 80 + 10}%`, `${Math.random() * 50 + 30}%` ],
          } : { height: '10%' }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: noiseState.isPlaying ? Infinity : 0,
            delay: i * 0.02,
          }}
        />
      ))}
    </motion.div>
  );

  return (
    <div
      className="flex flex-col items-center p-4 min-h-screen overflow-y-auto"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #0a0a1a 100%)` }}
    >
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}cc;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.secondary}30;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${NEON_COLORS.primary};
          cursor: pointer;
          box-shadow: 0 0 8px ${NEON_COLORS.primary};
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
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
            白噪音放松
          </h1>
          <motion.button
            onClick={() => engine.toggleVisualizer()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{
              background: noiseState.showVisualizer ? `${NEON_COLORS.secondary}40` : NEON_COLORS.surface,
              color: noiseState.showVisualizer ? NEON_COLORS.secondary : NEON_COLORS.textDim,
            }}
            whileTap={{ scale: 0.9 }}
          >
            📊
          </motion.button>
        </div>

        <div
          className="rounded-3xl p-6 mb-6"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface} 0%, #16213e 100%)`,
            boxShadow: `0 0 40px ${activeLayers.length > 0 ? activeLayers[0].color : NEON_COLORS.primary}40`,
          }}
        >
          <AnimatePresence mode="wait">
            {noiseState.showVisualizer && renderVisualizer()}
          </AnimatePresence>

          <motion.div
            className="text-center mb-6"
            animate={noiseState.isPlaying ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 4, repeat: noiseState.isPlaying ? Infinity : 0 }}
          >
            <motion.div
              className="text-6xl mb-3"
              animate={noiseState.isPlaying && activeLayers.length > 0 ? {
                rotate: [0, 5, -5, 0],
              } : {}}
              transition={{ duration: 3, repeat: noiseState.isPlaying ? Infinity : 0 }}
            >
              {activeLayers.length > 0 ? activeLayers[0].icon : '🎧'}
            </motion.div>
            <h2 className="text-xl font-bold mb-1" style={{
              color: activeLayers.length > 0 ? activeLayers[0].color : NEON_COLORS.text
            }}>
              {activeLayers.length > 0
                ? activeLayers.map(l => l.name).join(' + ')
                : '选择声音放松'}
            </h2>
            <p className="text-sm opacity-60">
              {noiseState.isPlaying
                ? `${activeLayers.length} 个声音正在播放`
                : '点击播放按钮开始'}
            </p>
          </motion.div>

          <div className="flex justify-center mb-6">
            <motion.button
              onClick={handleToggleMaster}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: noiseState.isPlaying
                  ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                  : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                boxShadow: `0 0 30px ${noiseState.isPlaying ? NEON_COLORS.danger : NEON_COLORS.primary}60`,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {noiseState.isPlaying ? '⏸' : '▶'}
            </motion.button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-60">🔈</span>
              <span className="text-sm" style={{ color: NEON_COLORS.primary }}>
                {Math.round(noiseState.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={noiseState.masterVolume}
              onChange={(e) => handleMasterVolume(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              }}
            />
          </div>

          {noiseState.timerActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-4 mb-4 text-center"
            >
              <div className="text-sm opacity-60 mb-1">定时关闭</div>
              <div className="text-3xl font-bold" style={{ color: NEON_COLORS.gold }}>
                {timerDisplay}
              </div>
              <motion.button
                onClick={handleTimer}
                className="mt-2 px-4 py-1 rounded-lg text-sm"
                style={{
                  background: NEON_COLORS.danger,
                  color: NEON_COLORS.text,
                }}
                whileTap={{ scale: 0.95 }}
              >
                取消定时
              </motion.button>
            </motion.div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            快速预设
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <motion.button
                key={preset.name}
                onClick={() => handlePreset(preset.name)}
                className="py-3 rounded-xl text-center"
                style={{
                  background: noiseState.selectedPreset === preset.name
                    ? `${NEON_COLORS.secondary}40`
                    : NEON_COLORS.surface,
                  border: `1px solid ${noiseState.selectedPreset === preset.name ? NEON_COLORS.secondary : 'transparent'}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-2xl mb-1">{preset.icon}</div>
                <div className="text-xs">{preset.name}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            声音混合
          </h3>
          <div className="space-y-3">
            {noiseState.layers.map((layer) => (
              <motion.div
                key={layer.id}
                className="p-3 rounded-xl"
                style={{
                  background: layer.isPlaying ? `${layer.color}20` : NEON_COLORS.surface,
                  border: `1px solid ${layer.isPlaying ? layer.color : 'transparent'}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleToggleLayer(layer.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{
                        background: layer.isPlaying ? layer.color : NEON_COLORS.surface,
                        boxShadow: layer.isPlaying ? `0 0 15px ${layer.color}80` : 'none',
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {layer.icon}
                    </motion.button>
                    <span className="font-bold" style={{ color: layer.isPlaying ? layer.color : NEON_COLORS.text }}>
                      {layer.name}
                    </span>
                  </div>
                  <span className="text-sm opacity-60">{Math.round(layer.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={layer.volume}
                  onChange={(e) => handleLayerVolume(layer.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full"
                  style={{
                    background: layer.isPlaying
                      ? `linear-gradient(90deg, ${layer.color}, ${layer.color}80)`
                      : NEON_COLORS.surface,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {!noiseState.timerActive && (
          <div className="glass-card rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
              定时关闭
            </h3>
            <div className="flex flex-wrap gap-2">
              {WHITE_NOISE_CONSTANTS.TIMER_PRESETS.map((minutes) => (
                <motion.button
                  key={minutes}
                  onClick={() => {
                    handleTimerMinutes(minutes);
                    handleTimer();
                  }}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: NEON_COLORS.surface,
                    border: `1px solid ${NEON_COLORS.secondary}40`,
                    color: NEON_COLORS.text,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {minutes < 60 ? `${minutes}分钟` : `${minutes / 60}小时`}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
            放松小贴士
          </h3>
          <div className="text-xs opacity-60 space-y-1">
            <p>• 建议同时使用2-3种声音效果最佳</p>
            <p>• 睡前使用30-60分钟定时器</p>
            <p>• 工作学习时选择"专注"预设</p>
            <p>• 根据心情混合不同声音</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
