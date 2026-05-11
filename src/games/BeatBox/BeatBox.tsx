import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BeatBoxEngine, BEATBOX_CONSTANTS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new BeatBoxEngine();

export default function BeatBox() {
  const navigate = useNavigate();
  const [beatBoxState, setBeatBoxState] = useState(engine.getState());

  useEffect(() => {
    engine.initialize();
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBeatBoxState({ ...engine.getState() });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = useCallback(() => {
    engine.toggle();
    setBeatBoxState({ ...engine.getState() });
  }, []);

  const handlePadToggle = useCallback((padIndex: number, stepIndex: number) => {
    engine.togglePad(padIndex, stepIndex);
    setBeatBoxState({ ...engine.getState() });
  }, []);

  const handlePadPlay = useCallback((padIndex: number) => {
    engine.playPad(padIndex);
    setBeatBoxState({ ...engine.getState() });
  }, []);

  const handleBpmChange = useCallback((bpm: number) => {
    engine.setBpm(bpm);
    setBeatBoxState({ ...engine.getState() });
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    engine.setMasterVolume(volume);
    setBeatBoxState({ ...engine.getState() });
  }, []);

  const handleLoadPreset = useCallback((presetName: string) => {
    engine.loadPreset(presetName as any);
    setBeatBoxState({ ...engine.getState() });
  }, []);

  const handleClearAll = useCallback(() => {
    engine.clearAll();
    setBeatBoxState({ ...engine.getState() });
  }, []);

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
        className="w-full max-w-4xl"
      >
        <div className="flex items-center justify-between mb-4">
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
            节拍盒子
          </h1>
          <div className="w-10" />
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={handleTogglePlay}
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: beatBoxState.isPlaying
                    ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                    : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                  boxShadow: `0 0 30px ${beatBoxState.isPlaying ? NEON_COLORS.danger : NEON_COLORS.primary}60`,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {beatBoxState.isPlaying ? '⏹' : '▶'}
              </motion.button>
              <div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.text }}>
                  {beatBoxState.bpm}
                </div>
                <div className="text-xs opacity-60">BPM</div>
              </div>
            </div>
            <div className="flex gap-2">
              {engine.getPresets().map((preset) => (
                <motion.button
                  key={preset}
                  onClick={() => handleLoadPreset(preset)}
                  className="px-3 py-2 rounded-lg text-xs font-bold"
                  style={{
                    background: NEON_COLORS.surface,
                    color: NEON_COLORS.text,
                    border: `1px solid ${NEON_COLORS.primary}50`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {preset}
                </motion.button>
              ))}
              <motion.button
                onClick={handleClearAll}
                className="px-3 py-2 rounded-lg text-xs font-bold"
                style={{
                  background: 'transparent',
                  color: NEON_COLORS.danger,
                  border: `1px solid ${NEON_COLORS.danger}50`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                清空
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-60">速度</span>
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>{beatBoxState.bpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="200"
                value={beatBoxState.bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                }}
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-60">音量</span>
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>{Math.round(beatBoxState.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={beatBoxState.masterVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4 overflow-x-auto">
          <div className="flex flex-col gap-2">
            {beatBoxState.pads.map((pad, padIndex) => (
              <div key={padIndex} className="flex items-center gap-2">
                <motion.button
                  onClick={() => handlePadPlay(padIndex)}
                  className={`w-20 h-12 rounded-lg flex flex-col items-center justify-center text-white font-bold text-xs ${pad.isPlaying ? 'scale-95' : ''}`}
                  style={{
                    background: pad.color,
                    boxShadow: pad.isPlaying ? `0 0 20px ${pad.color}` : 'none',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-lg">{pad.key}</span>
                  <span>{pad.name}</span>
                </motion.button>
                <div className="flex gap-1">
                  {beatBoxState.pattern[padIndex].map((active, stepIndex) => (
                    <motion.button
                      key={stepIndex}
                      onClick={() => handlePadToggle(padIndex, stepIndex)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stepIndex % 2 === 0 ? '' : 'opacity-80'}`}
                      style={{
                        background: active
                          ? pad.color
                          : beatBoxState.isPlaying && beatBoxState.currentStep === stepIndex
                          ? `${pad.color}40`
                          : NEON_COLORS.surface,
                        border: beatBoxState.isPlaying && beatBoxState.currentStep === stepIndex
                          ? `2px solid ${NEON_COLORS.success}`
                          : `1px solid ${NEON_COLORS.surface}`,
                        boxShadow: active ? `0 0 10px ${pad.color}` : 'none',
                      }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-20" />
              <div className="flex gap-1">
                {beatBoxState.pattern[0]?.map((_, stepIndex) => (
                  <div
                    key={stepIndex}
                    className={`w-10 text-center text-xs opacity-40`}
                  >
                    {stepIndex + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            敲击板
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {beatBoxState.pads.map((pad, padIndex) => (
              <motion.button
                key={padIndex}
                onClick={() => handlePadPlay(padIndex)}
                className={`h-20 rounded-xl flex flex-col items-center justify-center text-white font-bold ${pad.isPlaying ? 'scale-95' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${pad.color}, ${pad.color}aa)`,
                  boxShadow: pad.isPlaying ? `0 0 30px ${pad.color}` : `0 4px 6px ${pad.color}40`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">{pad.key}</span>
                <span className="text-xs">{pad.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
            使用说明
          </h3>
          <div className="text-xs opacity-60 space-y-1">
            <p>• 点击鼓机网格来设置节奏</p>
            <p>• 使用键盘快捷键（Q/W/E/R/A/S/D/F）直接敲击打击板</p>
            <p>• 选择预设快速开始</p>
            <p>• 点击左侧的打击板预览音色</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
