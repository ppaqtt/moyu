import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChordProgressionEngine, CHORD_PROGRESSION_CONSTANTS, NOTE_NAMES, CHORD_TYPES } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new ChordProgressionEngine();

export default function ChordProgression() {
  const navigate = useNavigate();
  const [progressionState, setProgressionState] = useState(engine.getState());

  useEffect(() => {
    engine.initialize();
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressionState({ ...engine.getState() });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = useCallback(() => {
    engine.toggle();
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleChordChange = useCallback((index: number, chord: any) => {
    engine.setChord(index, chord);
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleChordPreview = useCallback((index: number) => {
    engine.previewChord(progressionState.chords[index]);
  }, [progressionState.chords]);

  const handleKeyChange = useCallback((key: number) => {
    engine.setKey(key);
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleScaleTypeChange = useCallback((scaleType: 'major' | 'minor') => {
    engine.setScaleType(scaleType);
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleBpmChange = useCallback((bpm: number) => {
    engine.setBpm(bpm);
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    engine.setMasterVolume(volume);
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleArpeggiateToggle = useCallback(() => {
    engine.setArpeggiate(!progressionState.arpeggiate);
    setProgressionState({ ...engine.getState() });
  }, [progressionState.arpeggiate]);

  const handleAddChord = useCallback(() => {
    engine.addChord();
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleRemoveChord = useCallback((index: number) => {
    engine.removeChord(index);
    setProgressionState({ ...engine.getState() });
  }, []);

  const handleLoadPreset = useCallback((presetName: string) => {
    engine.loadProgression(presetName as any);
    setProgressionState({ ...engine.getState() });
  }, []);

  const degreeNames = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

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
        className="w-full max-w-3xl"
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
            和弦进行器
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
                  background: progressionState.isPlaying
                    ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                    : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                  boxShadow: `0 0 30px ${progressionState.isPlaying ? NEON_COLORS.danger : NEON_COLORS.primary}60`,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {progressionState.isPlaying ? '⏹' : '▶'}
              </motion.button>
              <div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.text }}>
                  {NOTE_NAMES[progressionState.key]} {progressionState.scaleType === 'major' ? '大调' : '小调'}
                </div>
                <div className="text-xs opacity-60">{progressionState.bpm} BPM</div>
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs opacity-60 block mb-1">调号</label>
              <div className="flex flex-wrap gap-1">
                {NOTE_NAMES.map((note, i) => (
                  <motion.button
                    key={note}
                    onClick={() => handleKeyChange(i)}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      background: progressionState.key === i ? NEON_COLORS.primary : NEON_COLORS.surface,
                      color: progressionState.key === i ? NEON_COLORS.background : NEON_COLORS.text,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {note}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">调式</label>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleScaleTypeChange('major')}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: progressionState.scaleType === 'major' ? NEON_COLORS.secondary : NEON_COLORS.surface,
                    color: progressionState.scaleType === 'major' ? NEON_COLORS.background : NEON_COLORS.text,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  大调
                </motion.button>
                <motion.button
                  onClick={() => handleScaleTypeChange('minor')}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: progressionState.scaleType === 'minor' ? NEON_COLORS.secondary : NEON_COLORS.surface,
                    color: progressionState.scaleType === 'minor' ? NEON_COLORS.background : NEON_COLORS.text,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  小调
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-60">速度</span>
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>{progressionState.bpm} BPM</span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                value={progressionState.bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-60">音量</span>
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>{Math.round(progressionState.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={progressionState.masterVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <motion.button
              onClick={handleArpeggiateToggle}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: progressionState.arpeggiate ? NEON_COLORS.primary : NEON_COLORS.surface,
                color: progressionState.arpeggiate ? NEON_COLORS.background : NEON_COLORS.text,
                border: `1px solid ${NEON_COLORS.primary}50`,
              }}
              whileTap={{ scale: 0.95 }}
            >
              🔊 琶音模式
            </motion.button>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: NEON_COLORS.primary }}>和弦序列</h3>
            <motion.button
              onClick={handleAddChord}
              className="px-3 py-1 rounded text-xs"
              style={{
                background: NEON_COLORS.surface,
                color: NEON_COLORS.primary,
                border: `1px solid ${NEON_COLORS.primary}50`,
              }}
              whileTap={{ scale: 0.95 }}
            >
              + 添加和弦
            </motion.button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {progressionState.chords.map((chord, index) => (
              <motion.div
                key={index}
                className="glass-card rounded-lg p-3"
                style={{
                  borderColor: progressionState.isPlaying && progressionState.currentChordIndex === index 
                    ? NEON_COLORS.success 
                    : 'transparent',
                  boxShadow: progressionState.isPlaying && progressionState.currentChordIndex === index 
                    ? `0 0 20px ${NEON_COLORS.success}60` 
                    : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs opacity-60">{degreeNames[chord.root % 7]}</span>
                  <div className="flex gap-1">
                    <motion.button
                      onClick={() => handleChordPreview(index)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: NEON_COLORS.surface }}
                      whileTap={{ scale: 0.9 }}
                    >
                      🔊
                    </motion.button>
                    {progressionState.chords.length > 1 && (
                      <motion.button
                        onClick={() => handleRemoveChord(index)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ background: 'transparent', color: NEON_COLORS.danger }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ×
                      </motion.button>
                    )}
                  </div>
                </div>
                <div className="text-lg font-bold mb-2" style={{ color: NEON_COLORS.text }}>
                  {engine.getChordName(chord)}
                </div>
                <select
                  value={chord.type}
                  onChange={(e) => handleChordChange(index, { type: e.target.value as any })}
                  className="w-full px-2 py-1 rounded text-xs mb-1"
                  style={{ background: NEON_COLORS.surface, color: NEON_COLORS.text, border: 'none' }}
                >
                  {Object.entries(CHORD_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
                <select
                  value={chord.root}
                  onChange={(e) => handleChordChange(index, { root: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 rounded text-xs"
                  style={{ background: NEON_COLORS.surface, color: NEON_COLORS.text, border: 'none' }}
                >
                  {[0, 2, 4, 5, 7, 9, 11].map((root) => (
                    <option key={root} value={root}>{degreeNames[root % 7]}</option>
                  ))}
                </select>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
            使用说明
          </h3>
          <div className="text-xs opacity-60 space-y-1">
            <p>• 选择调号和调式开始创作</p>
            <p>• 点击预设快速使用经典和弦进行</p>
            <p>• 点击🔊按钮预览单个和弦</p>
            <p>• 使用下拉菜单修改和弦类型和根音</p>
            <p>• 启用琶音模式获得更优美的音效</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
