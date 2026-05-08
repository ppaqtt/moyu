import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <ParticleBg />

      <motion.div
        className="text-center mb-12 relative z-10"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl relative z-10">
        {GAMES_LIST.map((game, index) => (
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
