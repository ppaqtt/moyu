import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BeatEditorEngine, BEAT_EDITOR_CONSTANTS, DRUM_SOUNDS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new BeatEditorEngine();

export default function BeatEditor() {
  const navigate = useNavigate();
  const [editorState, setEditorState] = useState(engine.getState());

  useEffect(() => {
    engine.initialize();
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setEditorState({ ...engine.getState() });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = useCallback(() => {
    engine.toggle();
    setEditorState({ ...engine.getState() });
  }, []);

  const handleBeatClick = useCallback((trackIndex: number, beatIndex: number) => {
    engine.toggleBeat(trackIndex, beatIndex);
    setEditorState({ ...engine.getState() });
  }, []);

  const handleBpmChange = useCallback((bpm: number) => {
    engine.setBpm(bpm);
    setEditorState({ ...engine.getState() });
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    engine.setMasterVolume(volume);
    setEditorState({ ...engine.getState() });
  }, []);

  const handleToggleMute = useCallback((trackIndex: number) => {
    engine.toggleTrackMute(trackIndex);
    setEditorState({ ...engine.getState() });
  }, []);

  const handleLoadPreset = useCallback((presetName: string) => {
    engine.loadPreset(presetName as any);
    setEditorState({ ...engine.getState() });
  }, []);

  const handleClearAll = useCallback(() => {
    engine.clearAll();
    setEditorState({ ...engine.getState() });
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
            节奏编辑器
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
                  background: editorState.isPlaying
                    ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                    : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                  boxShadow: `0 0 30px ${editorState.isPlaying ? NEON_COLORS.danger : NEON_COLORS.primary}60`,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {editorState.isPlaying ? '⏹' : '▶'}
              </motion.button>
              <div>
                <div className="text-3xl font-bold" style={{ color: NEON_COLORS.text }}>
                  {editorState.bpm}
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

          <div className="flex gap-6">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-60">速度</span>
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>
                  {editorState.bpm} BPM
                </span>
              </div>
              <input
                type="range"
                min={BEAT_EDITOR_CONSTANTS.MIN_BPM}
                max={BEAT_EDITOR_CONSTANTS.MAX_BPM}
                value={editorState.bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-60">主音量</span>
                <span className="text-xs" style={{ color: NEON_COLORS.primary }}>
                  {Math.round(editorState.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={editorState.masterVolume}
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
            {editorState.tracks.map((track, trackIndex) => (
              <div key={trackIndex} className="flex items-center gap-2">
                <div className="w-20 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleToggleMute(trackIndex)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{
                        background: track.muted ? NEON_COLORS.danger : NEON_COLORS.surface,
                        color: track.muted ? '#fff' : NEON_COLORS.text,
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {track.muted ? '🔇' : '🔊'}
                    </motion.button>
                    <span
                      className="text-xs font-bold truncate"
                      style={{ color: track.color, opacity: track.muted ? 0.5 : 1 }}
                    >
                      {track.name}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex gap-1">
                  {track.beats.map((beat, beatIndex) => {
                    const isCurrentBeat = editorState.isPlaying && editorState.currentBeat === beatIndex;
                    const isMeasureStart = beatIndex % 8 === 0;
                    
                    return (
                      <motion.button
                        key={beatIndex}
                        onClick={() => handleBeatClick(trackIndex, beatIndex)}
                        className={`flex-1 h-10 rounded-sm flex-shrink-0 ${isMeasureStart ? 'ml-2 first:ml-0' : ''}`}
                        style={{
                          background: beat.active
                            ? track.color
                            : isCurrentBeat
                            ? `${NEON_COLORS.primary}40`
                            : NEON_COLORS.surface,
                          border: `1px solid ${
                            beat.active ? track.color : isCurrentBeat ? NEON_COLORS.primary : NEON_COLORS.surface
                          }`,
                          boxShadow: beat.active ? `0 0 10px ${track.color}` : 'none',
                        }}
                        animate={isCurrentBeat && beat.active ? { scale: [1, 1.1, 1] } : {}}
                        whileTap={{ scale: 0.9 }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex mt-2 pl-22 gap-1 text-xs opacity-40">
            {Array.from({ length: 32 }, (_, i) => (
              <div key={i} className="flex-1 flex-shrink-0 text-center">
                {i % 8 === 0 ? `${Math.floor(i / 8) + 1}` : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
            使用说明
          </h3>
          <div className="text-xs opacity-60 space-y-1">
            <p>• 点击格子来添加/移除鼓声</p>
            <p>• 选择预设快速开始</p>
            <p>• 点击🔇静音单个音轨</p>
            <p>• 调节BPM和主音量控制播放</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
