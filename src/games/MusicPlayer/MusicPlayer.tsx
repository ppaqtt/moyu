import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicPlayerEngine, Track, MUSIC_PLAYER_CONSTANTS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new MusicPlayerEngine();

export default function MusicPlayer() {
  const navigate = useNavigate();
  const [playerState, setPlayerState] = useState(engine.getState());
  const [volume, setVolume] = useState(0.7);

  const categories = useMemo(() => engine.getCategories(), []);

  useEffect(() => {
    engine.initialize();
    return () => {
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerState({ ...engine.getState() });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = useCallback(() => {
    engine.toggle();
    setPlayerState({ ...engine.getState() });
  }, []);

  const handleNext = useCallback(() => {
    engine.next();
    setPlayerState({ ...engine.getState() });
  }, []);

  const handlePrevious = useCallback(() => {
    engine.previous();
    setPlayerState({ ...engine.getState() });
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol);
    engine.setVolume(vol);
    setPlayerState({ ...engine.getState() });
  }, []);

  const handleTrackSelect = useCallback((index: number) => {
    engine.selectTrack(index);
    setPlayerState({ ...engine.getState() });
  }, []);

  const handleCategorySelect = useCallback((category: string | null) => {
    engine.filterByCategory(category);
    setPlayerState({ ...engine.getState() });
  }, []);

  const currentTrack = playerState.trackList[playerState.currentTrackIndex];
  const filteredTracks = playerState.selectedCategory
    ? playerState.trackList.filter(t => t.category === playerState.selectedCategory)
    : playerState.trackList;

  const Visualizer = () => (
    <div className="flex items-end justify-center gap-1 h-24 mb-6">
      {playerState.visualizerData.map((value, index) => (
        <motion.div
          key={index}
          className="w-2 rounded-full"
          style={{
            background: currentTrack?.color || NEON_COLORS.primary,
            height: `${Math.max(8, value * 100)}%`,
          }}
          animate={playerState.isPlaying ? {
            height: [`${Math.max(8, value * 80)}%`, `${Math.max(8, value * 100)}%`, `${Math.max(8, value * 85)}%`],
          } : { height: 8 }}
          transition={{
            duration: 0.2,
            repeat: playerState.isPlaying ? Infinity : 0,
          }}
        />
      ))}
    </div>
  );

  const renderTrackList = () => (
    <div
      className="rounded-2xl p-4 overflow-hidden"
      style={{
        background: `${NEON_COLORS.surface}ee`,
        maxHeight: 280,
      }}
    >
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <motion.button
          onClick={() => handleCategorySelect(null)}
          className="px-4 py-2 rounded-full text-sm whitespace-nowrap"
          style={{
            background: !playerState.selectedCategory ? NEON_COLORS.primary : NEON_COLORS.surface,
            color: !playerState.selectedCategory ? NEON_COLORS.background : NEON_COLORS.text,
          }}
          whileHover={{ scale: 1.05 }}
        >
          全部
        </motion.button>
        {categories.map(cat => (
          <motion.button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            className="px-4 py-2 rounded-full text-sm whitespace-nowrap"
            style={{
              background: playerState.selectedCategory === cat ? NEON_COLORS.secondary : NEON_COLORS.surface,
              color: playerState.selectedCategory === cat ? NEON_COLORS.background : NEON_COLORS.text,
            }}
            whileHover={{ scale: 1.05 }}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="overflow-y-auto space-y-2" style={{ maxHeight: 200 }}>
        {filteredTracks.map((track, index) => {
          const actualIndex = playerState.trackList.indexOf(track);
          const isActive = actualIndex === playerState.currentTrackIndex;

          return (
            <motion.div
              key={track.id}
              onClick={() => handleTrackSelect(actualIndex)}
              className="p-3 rounded-xl cursor-pointer flex items-center gap-3"
              style={{
                background: isActive ? `${track.color}30` : 'transparent',
                border: `1px solid ${isActive ? track.color : 'transparent'}`,
              }}
              whileHover={{ x: 4, backgroundColor: `${track.color}20` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ background: `${track.color}40` }}
              >
                {isActive && playerState.isPlaying ? '🎵' : '♪'}
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: isActive ? track.color : NEON_COLORS.text }}>
                  {track.name}
                </div>
                <div className="text-xs opacity-60">{track.category} · {track.mood}</div>
              </div>
              <div className="text-sm opacity-60">{track.bpm} BPM</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

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
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: ${NEON_COLORS.surface};
        }
        ::-webkit-scrollbar-thumb {
          background: ${NEON_COLORS.secondary}60;
          border-radius: 2px;
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
            音乐播放器
          </h1>
          <div className="w-10" />
        </div>

        <div
          className="rounded-3xl p-6 mb-6"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface} 0%, #16213e 100%)`,
            boxShadow: currentTrack ? `0 0 60px ${currentTrack.color}40` : `0 0 40px ${NEON_COLORS.primary}40`,
          }}
        >
          <motion.div
            className="w-48 h-48 mx-auto rounded-2xl mb-6 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${currentTrack?.color || NEON_COLORS.primary}30, ${NEON_COLORS.surface})` }}
            animate={playerState.isPlaying ? { rotate: 360 } : {}}
            transition={playerState.isPlaying ? { duration: 10, repeat: Infinity, ease: 'linear' } : {}}
          >
            <motion.div
              className="text-8xl"
              animate={playerState.isPlaying ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: playerState.isPlaying ? Infinity : 0 }}
            >
              {playerState.isPlaying ? '🎵' : '♪'}
            </motion.div>
          </motion.div>

          <Visualizer />

          <div className="text-center mb-4">
            <motion.h2
              className="text-2xl font-bold mb-1"
              style={{ color: currentTrack?.color || NEON_COLORS.text }}
              animate={playerState.isPlaying ? { opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 2, repeat: playerState.isPlaying ? Infinity : 0 }}
            >
              {currentTrack?.name || '选择一首歌曲'}
            </motion.h2>
            <p className="opacity-60">{currentTrack?.artist || '休息一下吧'}</p>
            <div className="flex justify-center gap-4 mt-2 text-sm">
              <span style={{ color: currentTrack?.color || NEON_COLORS.text }}>
                {currentTrack?.category}
              </span>
              <span className="opacity-40">|</span>
              <span className="opacity-60">{currentTrack?.mood}</span>
              <span className="opacity-40">|</span>
              <span className="opacity-60">{currentTrack?.bpm} BPM</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <motion.button
              onClick={handlePrevious}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: NEON_COLORS.surface, color: NEON_COLORS.text }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ⏮
            </motion.button>

            <motion.button
              onClick={handlePlayPause}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: `linear-gradient(135deg, ${currentTrack?.color || NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                boxShadow: `0 0 30px ${currentTrack?.color || NEON_COLORS.primary}60`,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {playerState.isPlaying ? '⏸' : '▶'}
            </motion.button>

            <motion.button
              onClick={handleNext}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: NEON_COLORS.surface, color: NEON_COLORS.text }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ⏭
            </motion.button>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => engine.toggleShuffle()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{
                background: playerState.isShuffled ? `${NEON_COLORS.secondary}40` : 'transparent',
                color: playerState.isShuffled ? NEON_COLORS.secondary : NEON_COLORS.textDim,
              }}
              whileTap={{ scale: 0.9 }}
            >
              🔀
            </motion.button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs opacity-60">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${currentTrack?.color || NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                }}
              />
              <span className="text-xs opacity-60">🔊</span>
            </div>

            <motion.button
              onClick={() => engine.toggleMute()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{
                background: playerState.isMuted ? `${NEON_COLORS.danger}40` : 'transparent',
                color: playerState.isMuted ? NEON_COLORS.danger : NEON_COLORS.textDim,
              }}
              whileTap={{ scale: 0.9 }}
            >
              {playerState.isMuted ? '🔇' : '🔊'}
            </motion.button>

            <motion.button
              onClick={() => engine.toggleLoop()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{
                background: playerState.isLooping ? `${NEON_COLORS.success}40` : 'transparent',
                color: playerState.isLooping ? NEON_COLORS.success : NEON_COLORS.textDim,
              }}
              whileTap={{ scale: 0.9 }}
            >
              🔁
            </motion.button>
          </div>
        </div>

        {renderTrackList()}

        <div className="glass-card rounded-xl p-4 mt-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
            播放列表 ({playerState.trackList.length} 首)
          </h3>
          <div className="flex flex-wrap gap-2">
            {playerState.trackList.map((track) => (
              <motion.div
                key={track.id}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: `${track.color}30`,
                  color: track.color,
                  border: `1px solid ${track.color}60`,
                }}
                whileHover={{ scale: 1.05 }}
              >
                {track.name}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
