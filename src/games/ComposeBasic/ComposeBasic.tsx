import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposeBasicEngine, COMPOSE_BASIC_CONSTANTS, INSTRUMENTS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new ComposeBasicEngine();

export default function ComposeBasic() {
  const navigate = useNavigate();
  const [composeState, setComposeState] = useState(engine.getState());
  const [currentBeat, setCurrentBeat] = useState(0);

  useEffect(() => {
    engine.initialize();
    if (!composeState.currentComposition) {
      engine.createNewComposition('我的第一首曲子');
    }
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = engine.getState();
      setComposeState({ ...state });

      if (state.isPlaying && state.currentComposition) {
        const beatDuration = 60000 / state.currentComposition.bpm;
        const currentBeatInBar = Math.floor((state.currentTime % beatDuration * state.currentComposition.timeSignature.top) / beatDuration);
        setCurrentBeat(currentBeatInBar);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handlePlay = useCallback(() => {
    engine.toggle();
    setComposeState({ ...engine.getState() });
  }, []);

  const handleNoteClick = useCallback((pitch: number) => {
    engine.previewNote(pitch);
    engine.addNote(pitch, 1, composeState.currentBar || 0, 0);
    setComposeState({ ...engine.getState() });
  }, [composeState.currentBar]);

  const handleNewComposition = useCallback(() => {
    engine.createNewComposition();
    setComposeState({ ...engine.getState() });
  }, []);

  const handleBpmChange = useCallback((bpm: number) => {
    engine.setBpm(bpm);
    setComposeState({ ...engine.getState() });
  }, []);

  const handleBarsChange = useCallback((bars: number) => {
    engine.setTotalBars(bars);
    setComposeState({ ...engine.getState() });
  }, []);

  const handleInstrumentChange = useCallback((index: number) => {
    engine.setInstrument(index);
    setComposeState({ ...engine.getState() });
  }, []);

  const handleOctaveChange = useCallback((octave: number) => {
    engine.setOctave(octave);
    setComposeState({ ...engine.getState() });
  }, []);

  const handleScaleChange = useCallback((scale: 'major' | 'minor' | 'pentatonic' | 'blues') => {
    engine.setScale(scale);
    setComposeState({ ...engine.getState() });
  }, []);

  const handleClearTrack = useCallback(() => {
    engine.clearTrack(composeState.selectedTrack);
    setComposeState({ ...engine.getState() });
  }, [composeState.selectedTrack]);

  const pianoKeys = useMemo(() => engine.getPianoKeys(), [composeState.octave, composeState.scale]);
  const currentComposition = composeState.currentComposition;

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
        .piano-key {
          transition: all 0.1s ease;
        }
        .piano-key:hover {
          filter: brightness(1.2);
        }
        .piano-key.white {
          background: linear-gradient(180deg, #fff 0%, #eee 100%);
        }
        .piano-key.black {
          background: linear-gradient(180deg, #333 0%, #111 100%);
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
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
            作曲入门
          </h1>
          <motion.button
            onClick={handleNewComposition}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: NEON_COLORS.surface,
              color: NEON_COLORS.primary,
              border: `1px solid ${NEON_COLORS.primary}50`,
            }}
            whileHover={{ scale: 1.05 }}
          >
            新建
          </motion.button>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: NEON_COLORS.text }}>
              {currentComposition?.name || '未命名作品'}
            </h2>
            <motion.button
              onClick={handlePlay}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: composeState.isPlaying
                  ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                  : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                boxShadow: `0 0 20px ${composeState.isPlaying ? NEON_COLORS.danger : NEON_COLORS.primary}60`,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {composeState.isPlaying ? '⏹' : '▶'}
            </motion.button>
          </div>

          <div className="flex gap-4 mb-3">
            <div className="flex-1">
              <label className="text-xs opacity-60 block mb-1">BPM: {currentComposition?.bpm || 120}</label>
              <input
                type="range"
                min="40"
                max="200"
                value={currentComposition?.bpm || 120}
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-full"
                style={{ background: NEON_COLORS.surface }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs opacity-60 block mb-1">小节: {currentComposition?.totalBars || 4}</label>
              <input
                type="range"
                min="1"
                max="16"
                value={currentComposition?.totalBars || 4}
                onChange={(e) => handleBarsChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-full"
                style={{ background: NEON_COLORS.surface }}
              />
            </div>
          </div>

          <div className="flex gap-2 text-sm">
            <div className="px-3 py-1 rounded-lg" style={{ background: NEON_COLORS.surface }}>
              <span className="opacity-60">拍号: </span>
              <span style={{ color: NEON_COLORS.primary }}>
                {currentComposition?.timeSignature.top}/{currentComposition?.timeSignature.bottom}
              </span>
            </div>
            <div className="px-3 py-1 rounded-lg" style={{ background: NEON_COLORS.surface }}>
              <span className="opacity-60">当前: </span>
              <span style={{ color: composeState.isPlaying ? NEON_COLORS.success : NEON_COLORS.text }}>
                小节 {Math.floor(composeState.currentBar || 0) + 1}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            音阶选择
          </h3>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {(['major', 'minor', 'pentatonic', 'blues'] as const).map((scale) => (
              <motion.button
                key={scale}
                onClick={() => handleScaleChange(scale)}
                className="py-2 rounded-lg text-sm font-bold"
                style={{
                  background: composeState.scale.join(',') === (scale === 'major' ? '0,2,4,5,7,9,11' : scale === 'minor' ? '0,2,3,5,7,8,10' : scale === 'pentatonic' ? '0,2,4,7,9' : '0,3,5,6,7,10')
                    ? NEON_COLORS.secondary
                    : NEON_COLORS.surface,
                  color: composeState.scale.join(',') === (scale === 'major' ? '0,2,4,5,7,9,11' : scale === 'minor' ? '0,2,3,5,7,8,10' : scale === 'pentatonic' ? '0,2,4,7,9' : '0,3,5,6,7,10')
                    ? NEON_COLORS.background
                    : NEON_COLORS.text,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {scale === 'major' ? '大调' : scale === 'minor' ? '小调' : scale === 'pentatonic' ? '五声' : '布鲁斯'}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-4 mb-3">
            <div className="flex-1">
              <label className="text-xs opacity-60 block mb-1">八度: {composeState.octave}</label>
              <input
                type="range"
                min="2"
                max="7"
                value={composeState.octave}
                onChange={(e) => handleOctaveChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-full"
                style={{ background: NEON_COLORS.surface }}
              />
            </div>
          </div>

          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            乐器选择
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {INSTRUMENTS.map((inst, index) => (
              <motion.button
                key={index}
                onClick={() => handleInstrumentChange(index)}
                className="py-2 rounded-lg text-xs font-bold"
                style={{
                  background: composeState.instrumentType === index ? inst.color : NEON_COLORS.surface,
                  color: composeState.instrumentType === index ? NEON_COLORS.background : NEON_COLORS.text,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {inst.name}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold" style={{ color: NEON_COLORS.primary }}>
              音轨
            </h3>
            <motion.button
              onClick={handleClearTrack}
              className="px-3 py-1 rounded text-xs"
              style={{
                background: 'transparent',
                border: `1px solid ${NEON_COLORS.danger}50`,
                color: NEON_COLORS.danger,
              }}
              whileTap={{ scale: 0.95 }}
            >
              清空当前轨
            </motion.button>
          </div>

          <div className="flex gap-2 mb-3">
            {currentComposition?.tracks.map((track, index) => (
              <motion.button
                key={index}
                onClick={() => engine.selectTrack(index)}
                className="flex-1 py-2 rounded-lg text-xs font-bold relative"
                style={{
                  background: composeState.selectedTrack === index ? INSTRUMENTS[track.instrument].color : NEON_COLORS.surface,
                  color: composeState.selectedTrack === index ? NEON_COLORS.background : NEON_COLORS.text,
                  opacity: track.muted ? 0.5 : 1,
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div>{INSTRUMENTS[track.instrument].name}</div>
                <div className="text-xs opacity-60">{track.notes.length}个音符</div>
                {track.muted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs">
                    ×
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {currentComposition?.tracks[composeState.selectedTrack] && (
            <div className="text-xs opacity-60">
              音量: {Math.round(currentComposition.tracks[composeState.selectedTrack].volume * 100)}%
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            点击琴键添加音符
          </h3>
          <div className="relative h-48 overflow-x-auto">
            <div className="flex absolute bottom-0">
              {pianoKeys.map((key, index) => (
                <motion.div
                  key={key.pitch}
                  onClick={() => handleNoteClick(key.pitch)}
                  className={`piano-key cursor-pointer ${
                    key.isBlack ? 'w-6 h-28 rounded-b-md z-10 -mx-3' : 'w-10 h-40 rounded-b-lg'
                  } ${key.isBlack ? 'black' : 'white'}`}
                  style={{
                    background: key.isBlack
                      ? `linear-gradient(180deg, #333 0%, #111 100%)`
                      : composeState.showScaleNotes && key.isInScale
                        ? `linear-gradient(180deg, ${NEON_COLORS.primary}40 0%, ${NEON_COLORS.primary}20 100%)`
                        : `linear-gradient(180deg, #fff 0%, #eee 100%)`,
                    border: composeState.showScaleNotes && key.isInScale
                      ? `1px solid ${NEON_COLORS.primary}80`
                      : '1px solid #ccc',
                  }}
                  whileTap={{ scale: 0.95, y: key.isBlack ? 5 : 10 }}
                >
                  {!key.isBlack && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs opacity-60">
                      {key.name}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            {composeState.showScaleNotes ? '• 高亮显示音阶内的音符' : '• 点击显示音阶高亮'}
          </p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
            作曲小技巧
          </h3>
          <div className="text-xs opacity-60 space-y-1">
            <p>• 从大调音阶开始，五声音阶最容易上手</p>
            <p>• 尝试使用1-3-5和弦进行</p>
            <p>• 保持节奏简洁，从4/4拍开始</p>
            <p>• 先写旋律，再添加伴奏</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
