import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '🎮' },
  { id: 'puzzle', name: '经典益智', icon: '🧩' },
  { id: 'arcade', name: '休闲竞技', icon: '🏃' },
  { id: 'retro', name: '怀旧联机', icon: '🔥' },
  { id: 'premium', name: '高分神作', icon: '⭐' },
  { id: 'classic', name: '经典休闲', icon: '✨' }
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <ParticleBg />

      <motion.div
        className="text-center mb-8 relative z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{
            fontFamily: "'ZCOOL XiaoWei', serif",
            background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonBlue})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 30px rgba(255, 46, 99, 0.5))'
          }}
          animate={{
            textShadow: [
              `0 0 10px ${NEON_COLORS.neonPink}, 0 0 20px ${NEON_COLORS.neonPink}`,
              `0 0 20px ${NEON_COLORS.neonBlue}, 0 0 40px ${NEON_COLORS.neonBlue}`,
              `0 0 10px ${NEON_COLORS.neonPink}, 0 0 20px ${NEON_COLORS.neonPink}`
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          摸鱼小游戏
        </motion.h1>

        <motion.p
          className="text-xl opacity-80"
          style={{ color: NEON_COLORS.gold }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.5 }}
        >
          工作累了? 来放松一下!
        </motion.p>
      </motion.div>

      <motion.div
        className="flex flex-wrap justify-center gap-3 mb-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className="px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-all"
            style={{
              backgroundColor: selectedCategory === cat.id ? NEON_COLORS.neonPink : NEON_COLORS.darkPurple,
              color: selectedCategory === cat.id ? NEON_COLORS.white : NEON_COLORS.gold,
              border: `2px solid ${selectedCategory === cat.id ? NEON_COLORS.neonPink : 'transparent'}`,
              boxShadow: selectedCategory === cat.id ? `0 0 15px ${NEON_COLORS.neonPink}60` : 'none'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            <span className="text-xs opacity-70">
              ({cat.id === 'all' ? GAMES_LIST.length : GAME_CATEGORIES[cat.id]?.length || 0})
            </span>
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl relative z-10">
        {filteredGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <motion.div
              className="cursor-pointer group relative"
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <div
                className="relative rounded-2xl p-6 overflow-hidden"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}30`,
                  border: `2px solid ${NEON_COLORS.neonPink}40`
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at center, ${NEON_COLORS.neonPink}20, transparent 70%)`
                  }}
                />

                <div className="relative z-10">
                  <div className="text-5xl mb-4 text-center">{game.icon}</div>

                  <h3
                    className="text-2xl font-bold text-center mb-2"
                    style={{
                      fontFamily: "'ZCOOL XiaoWei', serif",
                      color: NEON_COLORS.gold
                    }}
                  >
                    {game.name}
                  </h3>

                  <p
                    className="text-sm text-center mb-4 opacity-70"
                    style={{ color: NEON_COLORS.gold }}
                  >
                    {game.description}
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {game.controls.slice(0, 2).map((control, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${NEON_COLORS.neonBlue}30`,
                          color: NEON_COLORS.neonBlue
                        }}
                      >
                        {control}
                      </span>
                    ))}
                  </div>

                  <motion.div
                    className="mt-4 text-center"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <span
                      className="text-sm font-bold px-4 py-2 rounded-full inline-block"
                      style={{
                        backgroundColor: NEON_COLORS.neonPink,
                        color: NEON_COLORS.white,
                        boxShadow: `0 0 15px ${NEON_COLORS.neonPink}`
                      }}
                    >
                      开始游戏
                    </span>
                  </motion.div>
                </div>
              </div>

              <motion.div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(45deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonBlue})`,
                  zIndex: -1,
                  filter: 'blur(15px)'
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.footer
        className="mt-12 text-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm opacity-50" style={{ color: NEON_COLORS.gold }}>
          © 2024 摸鱼小游戏 · 适合工作间隙放松
        </p>
      </motion.footer>
    </div>
  );
}
