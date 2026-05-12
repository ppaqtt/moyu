import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SynthPlayEngine, KEY_LABELS, KEY_COLORS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new SynthPlayEngine();

export default function SynthPlay() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [currentPreset, setCurrentPreset] = useState(0);
  const [volume, setVolume] = useState(50);
  const [octave, setOctave] = useState(4);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState(0);
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const pressedKeysRef = useRef<Set<number>>(new Set());

  const presets = engine.getPresets();
  const keyCount = engine.getKeyCount();

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setCurrentPreset(0);
    setVolume(50);
    setOctave(4);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordedNotes(0);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    
    const keyMap: Record<string, number> = {
      'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6,
      'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12, 'o': 13,
    };
    
    const keyIndex = keyMap[e.key.toLowerCase()];
    if (keyIndex !== undefined && !pressedKeysRef.current.has(keyIndex)) {
      pressedKeysRef.current.add(keyIndex);
      setActiveKeys(prev => new Set([...prev, keyIndex]));
      engine.pressKey(keyIndex);
    }
  }, [gameState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const keyMap: Record<string, number> = {
      'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6,
      'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12, 'o': 13,
    };
    
    const keyIndex = keyMap[e.key.toLowerCase()];
    if (keyIndex !== undefined) {
      pressedKeysRef.current.delete(keyIndex);
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyIndex);
        return newSet;
      });
      engine.releaseKey(keyIndex);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = engine.getState();
      setRecordedNotes(state.recordedNotes.length);
      setIsRecording(state.isRecording);
      setIsPlaying(state.isPlaying);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePresetChange = (index: number) => {
    setCurrentPreset(index);
    engine.setPreset(index);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    engine.setVolume(value / 100);
  };

  const handleOctaveChange = (delta: number) => {
    const newOctave = Math.max(2, Math.min(7, octave + delta));
    setOctave(newOctave);
    engine.setOctave(newOctave);
  };

  const handleRecordToggle = () => {
    engine.toggleRecording();
  };

  const handlePlayRecording = () => {
    if (isPlaying) {
      engine.stopPlayback();
    } else {
      engine.playRecording();
    }
  };

  const handleClearRecording = () => {
    engine.clearRecording();
    setRecordedNotes(0);
  };

  const handleMouseDown = (keyIndex: number) => {
    if (gameState !== 'playing') return;
    pressedKeysRef.current.add(keyIndex);
    setActiveKeys(prev => new Set([...prev, keyIndex]));
    engine.pressKey(keyIndex);
  };

  const handleMouseUp = (keyIndex: number) => {
    pressedKeysRef.current.delete(keyIndex);
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyIndex);
      return newSet;
    });
    engine.releaseKey(keyIndex);
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🎹
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonPurple,
        textShadow: `0 0 30px ${NEON_COLORS.neonPurple}, 0 0 60px ${NEON_COLORS.neonPurple}`
      }}>
        SynthPlay
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.neonCyan }}>
        电子琴模拟
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonPurple}, ${NEON_COLORS.neonCyan})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始演奏
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
        <p className="text-sm">键盘: A W S E D F T G Y H U J K O</p>
        <p className="text-sm">或直接点击琴键演奏</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 700 }}>
      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs opacity-70">音色</div>
            <div className="text-lg font-bold" style={{ color: presets[currentPreset].color }}>
              {presets[currentPreset].name}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs opacity-70">八度</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOctaveChange(-1)}
                  className="w-8 h-8 rounded bg-surface flex items-center justify-center"
                  style={{ border: `1px solid ${NEON_COLORS.primary}40` }}
                >
                  -
                </button>
                <span className="text-xl font-bold w-8 text-center">{octave}</span>
                <button
                  onClick={() => handleOctaveChange(1)}
                  className="w-8 h-8 rounded bg-surface flex items-center justify-center"
                  style={{ border: `1px solid ${NEON_COLORS.primary}40` }}
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-70">音量</div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24"
                style={{ accentColor: presets[currentPreset].color }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center gap-2 mb-2">
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => handlePresetChange(i)}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{
              background: currentPreset === i ? preset.color : `${preset.color}30`,
              border: `2px solid ${preset.color}`,
              color: currentPreset === i ? '#fff' : preset.color,
              boxShadow: currentPreset === i ? `0 0 15px ${preset.color}` : 'none',
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div
        className="rounded-xl p-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)`,
          boxShadow: `0 0 40px ${presets[currentPreset].color}40`,
        }}
      >
        <div className="flex justify-center">
          {Array.from({ length: keyCount }).map((_, i) => {
            const isBlackKey = i === 1 || i === 3 || i === 6 || i === 8 || i === 10 || i === 13;
            const isActive = activeKeys.has(i);

            return (
              <motion.div
                key={i}
                className={`relative ${isBlackKey ? 'z-10' : 'z-0'}`}
                style={{ marginLeft: isBlackKey ? -25 : 0 }}
              >
                <motion.button
                  className={`rounded-b-lg flex items-end justify-center pb-2 font-bold ${isBlackKey ? 'w-12 h-32' : 'w-14 h-48'}`}
                  style={{
                    background: isActive
                      ? presets[currentPreset].color
                      : isBlackKey
                        ? '#1a1a2e'
                        : '#ffffff',
                    border: isActive
                      ? `2px solid ${presets[currentPreset].color}`
                      : isBlackKey
                        ? '2px solid #333'
                        : '2px solid #ddd',
                    boxShadow: isActive
                      ? `0 0 30px ${presets[currentPreset].color}, 0 0 60px ${presets[currentPreset].color}`
                      : isBlackKey
                        ? '0 4px 8px rgba(0,0,0,0.5)'
                        : '0 4px 8px rgba(0,0,0,0.2)',
                    color: isActive ? '#fff' : isBlackKey ? '#fff' : '#333',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseDown={() => handleMouseDown(i)}
                  onMouseUp={() => handleMouseUp(i)}
                  onMouseLeave={() => {
                    if (activeKeys.has(i)) handleMouseUp(i);
                  }}
                >
                  <span className="text-xs opacity-60">{KEY_LABELS[i]}</span>
                </motion.button>

                {isActive && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-2 rounded-full"
                    style={{ background: presets[currentPreset].color }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleRecordToggle}
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: isRecording ? '#ff0044' : `${NEON_COLORS.danger}40`,
                border: `2px solid ${isRecording ? '#ff0044' : NEON_COLORS.danger}`,
                boxShadow: isRecording ? '0 0 20px #ff0044' : 'none',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording ? '⬛' : '⏺'}
            </motion.button>
            <div>
              <div className="text-xs opacity-70">录制</div>
              <div className="text-lg font-bold" style={{ color: isRecording ? '#ff0044' : NEON_COLORS.text }}>
                {isRecording ? '录制中' : '未录制'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-center mr-4">
              <div className="text-xs opacity-70">录制的音符</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>{recordedNotes}</div>
            </div>

            <motion.button
              onClick={handlePlayRecording}
              disabled={recordedNotes === 0}
              className="px-6 py-3 rounded-lg font-bold"
              style={{
                background: recordedNotes === 0 ? NEON_COLORS.surface : NEON_COLORS.success,
                border: `2px solid ${NEON_COLORS.success}`,
                color: '#fff',
                opacity: recordedNotes === 0 ? 0.5 : 1,
              }}
              whileHover={recordedNotes > 0 ? { scale: 1.05 } : {}}
              whileTap={recordedNotes > 0 ? { scale: 0.95 } : {}}
            >
              {isPlaying ? '⏹ 停止' : '▶ 播放'}
            </motion.button>

            <motion.button
              onClick={handleClearRecording}
              disabled={recordedNotes === 0}
              className="px-6 py-3 rounded-lg font-bold"
              style={{
                background: 'transparent',
                border: `2px solid ${NEON_COLORS.danger}`,
                color: NEON_COLORS.danger,
                opacity: recordedNotes === 0 ? 0.5 : 1,
              }}
              whileHover={recordedNotes > 0 ? { scale: 1.05 } : {}}
              whileTap={recordedNotes > 0 ? { scale: 0.95 } : {}}
            >
              🗑 清空
            </motion.button>
          </div>
        </div>
      </div>

      <div className="w-full text-center opacity-60 text-sm">
        <p>键盘快捷键: A W S E D F T G Y H U J K O</p>
        <p>录音模式下演奏会自动录制你的弹奏</p>
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
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #0a0a2e 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}dd;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonPurple}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
    </div>
  );
}
