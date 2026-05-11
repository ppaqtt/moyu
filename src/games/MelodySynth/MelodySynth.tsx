import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MelodySynthEngine, MELODY_SYNTH_CONSTANTS, NOTE_NAMES, SCALES, WAVE_TYPES } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new MelodySynthEngine();

export default function MelodySynth() {
  const navigate = useNavigate();
  const [synthState, setSynthState] = useState(engine.getState());

  useEffect(() => {
    engine.initialize();
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSynthState({ ...engine.getState() });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = useCallback(() => {
    engine.toggle();
    setSynthState({ ...engine.getState() });
  }, []);

  const handleNoteChange = useCallback((step: number, pitch: number | null) => {
    engine.setNote(step, pitch);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleNotePreview = useCallback((step: number) => {
    engine.previewNote(step);
  }, []);

  const handleKeyChange = useCallback((key: number) => {
    engine.setKey(key);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleScaleTypeChange = useCallback((scaleType: any) => {
    engine.setScaleType(scaleType);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleOctaveChange = useCallback((octave: number) => {
    engine.setOctave(octave);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleBpmChange = useCallback((bpm: number) => {
    engine.setBpm(bpm);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    engine.setMasterVolume(volume);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleWaveTypeChange = useCallback((waveType: OscillatorType) => {
    engine.setWaveType(waveType);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleLoadPreset = useCallback((presetName: string) => {
    engine.loadPreset(presetName as any);
    setSynthState({ ...engine.getState() });
  }, []);

  const handleClearAll = useCallback(() => {
    engine.clearAll();
    setSynthState({ ...engine.getState() });
  }, []);

  const scaleNotes = useMemo(() => {
    const scale = SCALES[synthState.scaleType];
    return scale.map((_, index) => index);
  }, [synthState.scaleType]);

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
        className="w-full max-w-5xl"
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
            旋律合成器
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
                  background: synthState.isPlaying
                    ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                    : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                  boxShadow: `0 0 30px ${synthState.isPlaying ? NEON_COLORS.danger : NEON_COLORS.primary}60`,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {synthState.isPlaying ? '⏹' : '▶'}
              </motion.button>
              <div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.text }}>
                  {NOTE_NAMES[synthState.key]} 调
                </div>
                <div className="text-xs opacity-60">{synthState.bpm} BPM</div>
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

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs opacity-60 block mb-1">调号</label>
              <div className="flex flex-wrap gap-1">
                {NOTE_NAMES.map((note, i) => (
                  <motion.button
                    key={note}
                    onClick={() => handleKeyChange(i)}
                    className="w-7 h-7 rounded flex items-center justify-center text-xs"
                    style={{
                      background: synthState.key === i ? NEON_COLORS.primary : NEON_COLORS.surface,
                      color: synthState.key === i ? NEON_COLORS.background : NEON_COLORS.text,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {note}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">音阶</label>
              <div className="grid grid-cols-2 gap-1">
                {(Object.keys(SCALES) as Array<keyof typeof SCALES>).map((scale) => (
                  <motion.button
                    key={scale}
                    onClick={() => handleScaleTypeChange(scale)}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      background: synthState.scaleType === scale ? NEON_COLORS.secondary : NEON_COLORS.surface,
                      color: synthState.scaleType === scale ? NEON_COLORS.background : NEON_COLORS.text,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {scale === 'major' ? '大调' : scale === 'minor' ? '小调' : scale === 'pentatonic' ? '五声' : '布鲁斯'}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">波型</label>
              <div className="grid grid-cols-2 gap-1">
                {WAVE_TYPES.map((wave) => (
                  <motion.button
                    key={wave.type}
                    onClick={() => handleWaveTypeChange(wave.type)}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      background: synthState.waveType === wave.type ? NEON_COLORS.success : NEON_COLORS.surface,
                      color: synthState.waveType === wave.type ? NEON_COLORS.background : NEON_COLORS.text,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {wave.name}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">八度: {synthState.octave}</label>
              <div className="flex gap-1">
                {[3, 4, 5, 6, 7].map((octave) => (
                  <motion.button
                    key={octave}
                    onClick={() => handleOctaveChange(octave)}
                    className="flex-1 h-8 rounded flex items-center justify-center text-xs"
                    style={{
                      background: synthState.octave === octave ? NEON_COLORS.primary : NEON_COLORS.surface,
                      color: synthState.octave === octave ? NEON_COLORS.background : NEON_COLORS.text,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {octave}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-60">速度</span>
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>{synthState.bpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="240"
                value={synthState.bpm}
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
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>{Math.round(synthState.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={synthState.masterVolume}
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
          <div className="flex flex-col gap-1">
            {[...scaleNotes].reverse().map((pitch) => (
              <div key={pitch} className="flex items-center gap-1">
                <div className="w-12 text-right pr-2 text-xs opacity-60">
                  {engine.getNoteName(pitch)}
                </div>
                <div className="flex gap-1">
                  {synthState.notes.map((note, step) => (
                    <motion.button
                      key={step}
                      onClick={() => handleNoteChange(step, note.pitch === pitch ? null : pitch)}
                      onMouseDown={() => {
                        if (note.pitch === pitch) {
                          handleNotePreview(step);
                        }
                      }}
                      className={`w-8 h-8 rounded flex items-center justify-center ${step % 4 === 0 ? 'ml-1' : ''}`}
                      style={{
                        background: note.pitch === pitch
                          ? NEON_COLORS.primary
                          : synthState.isPlaying && synthState.currentStep === step
                          ? `${NEON_COLORS.primary}40`
                          : NEON_COLORS.surface,
                        border: synthState.isPlaying && synthState.currentStep === step
                          ? `2px solid ${NEON_COLORS.success}`
                          : `1px solid ${NEON_COLORS.surface}`,
                        boxShadow: note.pitch === pitch
                          ? `0 0 10px ${NEON_COLORS.primary}`
                          : 'none',
                      }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1 mt-2">
              <div className="w-12" />
              <div className="flex gap-1">
                {synthState.notes.map((_, step) => (
                  <div
                    key={step}
                    className={`w-8 text-center text-xs opacity-40 ${step % 4 === 0 ? 'ml-1' : ''}`}
                  >
                    {step + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
            使用说明
          </h3>
          <div className="text-xs opacity-60 space-y-1">
            <p>• 点击音序器网格来放置音符</p>
            <p>• 选择预设可以快速加载经典旋律</p>
            <p>• 尝试不同的波型和音阶来改变音色</p>
            <p>• 调整八度来获得更高或更低的音高</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
