import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '🎮', color: '#a855f7' },
  { id: 'puzzle', name: '经典益智', icon: '🧩', color: '#06b6d4' },
  { id: 'arcade', name: '休闲竞技', icon: '🏃', color: '#22c55e' },
  { id: 'retro', name: '怀旧联机', icon: '🔥', color: '#f97316' },
  { id: 'premium', name: '高分神作', icon: '⭐', color: '#eab308' },
  { id: 'classic', name: '经典休闲', icon: '✨', color: '#ec4899' }
];

const GAME_CATEGORIES: Record<string, string[]> = {
  puzzle: ['2048', 'tetris', 'snake', 'minesweeper', 'bejeweled', 'sudoku'],
  arcade: ['subway', 'templerun', 'stickmanhook'],
  retro: ['fireice', 'goldminer', 'pvz'],
  premium: ['sketchup', 'hexgl', 'onevone', 'crosscode'],
  classic: ['bounce', 'fusion2048', 'flappybird', 'pacman']
};

export default function Home() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredGames = selectedCategory === 'all'
    ? GAMES_LIST
    : GAMES_LIST.filter(game => GAME_CATEGORIES[selectedCategory]?.includes(game.id));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <ParticleBg />

      <motion.div
        className="text-center mb-10 relative z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-2xl">🎮</span>
          <span className="text-sm font-medium" style={{ color: NEON_COLORS.neonCyan }}>
            17款精品游戏
          </span>
        </motion.div>

        <motion.h1
          className="text-6xl md:text-8xl font-black mb-4 tracking-tight"
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontWeight: 900,
            background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(255, 107, 157, 0.4))'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          摸鱼小游戏
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl"
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '0.2em'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          工作累了? 来放松一下 ✨
        </motion.p>
      </motion.div>

      <motion.div
        className="flex flex-wrap justify-center gap-3 mb-10 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {CATEGORIES.map((cat, index) => (
          <motion.button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className="px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all duration-300"
            style={{
              backgroundColor: selectedCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.08)',
              color: selectedCategory === cat.id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              border: `2px solid ${selectedCategory === cat.id ? cat.color : 'transparent'}`,
              boxShadow: selectedCategory === cat.id ? `0 0 25px ${cat.color}50` : 'none',
              backdropFilter: 'blur(10px)'
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <span className="text-lg">{cat.icon}</span>
            <span>{cat.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              backgroundColor: selectedCategory === cat.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
            }}>
              {cat.id === 'all' ? GAMES_LIST.length : GAME_CATEGORIES[cat.id]?.length || 0}
            </span>
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl relative z-10 px-4">
        {filteredGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
          >
            <motion.div
              className="cursor-pointer group relative"
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <div
                className="relative rounded-3xl p-5 overflow-hidden backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e', '#f97316', '#eab308'][index % 6]}15, transparent 60%)`
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                      style={{
                        background: `linear-gradient(135deg, ${['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e', '#f97316', '#eab308'][index % 6]}30`, border: `1px solid ${['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e', '#f97316', '#eab308'][index % 6]}50`
                      }}
                    >
                      {game.icon}
                    </div>
                    <motion.div
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e', '#f97316', '#eab308'][index % 6]}, ${['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e', '#f97316', '#eab308'][index % 6]}80)`,
                        color: '#ffffff'
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      开始
                    </motion.div>
                  </div>

                  <h3
                    className="text-xl font-bold mb-2"
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      background: `linear-gradient(135deg, #ffffff, #a0a0a0)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {game.name}
                  </h3>

                  <p
                    className="text-sm mb-4 leading-relaxed"
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    {game.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {game.controls.slice(0, 2).map((control, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {control}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e', '#f97316', '#eab308'][index % 6]}, ${['#a855f7', '#22c55e', '#f97316', '#eab308', '#ff6b9d', '#00d2ff'][index % 6]})`,
                  zIndex: -1,
                  filter: 'blur(20px)',
                  opacity: 0.4
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.footer
        className="mt-16 text-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>© 2024</span>
          <span style={{ color: NEON_COLORS.neonPink }}>•</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>摸鱼小游戏</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>适合工作间隙放松</span>
        </div>
      </motion.footer>
    </div>
  );
}
