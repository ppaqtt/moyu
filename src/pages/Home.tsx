import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  'all': { name: '全部', icon: '🎮', color: '#a855f7' },
  'puzzle': { name: '益智解谜', icon: '🧩', color: '#06b6d4' },
  'arcade': { name: '街机经典', icon: '🕹️', color: '#22c55e' },
  'co-op': { name: '双人合作', icon: '👥', color: '#ec4899' },
  'shooting': { name: '飞行射击', icon: '🚀', color: '#ef4444' },
  'strategy': { name: '策略经营', icon: '💰', color: '#f59e0b' },
  'tower': { name: '塔防游戏', icon: '🏰', color: '#8b5cf6' },
  'idle': { name: '放置挂机', icon: '💤', color: '#10b981' },
  'board': { name: '桌游棋牌', icon: '♟️', color: '#3b82f6' },
  'card': { name: '卡牌游戏', icon: '🃏', color: '#06b6d4' },
  'fighting': { name: '格斗对战', icon: '👊', color: '#f97316' },
  'io': { name: 'IO竞技', icon: '🌐', color: '#84cc16' },
  'rhythm': { name: '音乐节奏', icon: '🎵', color: '#ec4899' },
  'music': { name: '音乐创作', icon: '🎹', color: '#6366f1' },
  'reaction': { name: '反应训练', icon: '🎯', color: '#f59e0b' },
  'math': { name: '数学挑战', icon: '➕', color: '#06b6d4' },
  'creative': { name: '创意工具', icon: '🎨', color: '#ec4899' },
  'match3': { name: '消除游戏', icon: '💎', color: '#a855f7' },
  'physics': { name: '物理模拟', icon: '⚙️', color: '#22c55e' },
  '养成': { name: '养成游戏', icon: '🐾', color: '#f472b6' },
  'sports': { name: '运动竞技', icon: '🏃', color: '#3b82f6' },
  'survival': { name: '生存冒险', icon: '🏆', color: '#f97316' },
  'parkour': { name: '跑酷闯关', icon: '🏃', color: '#06b6d4' },
  'word': { name: '文字词汇', icon: '🔤', color: '#8b5cf6' },
  'adventure': { name: '文字冒险', icon: '📖', color: '#f59e0b' },
  'ai': { name: 'AI对抗', icon: '🧠', color: '#06b6d4' },
  'coding': { name: '编程学习', icon: '💻', color: '#22c55e' },
  'maze': { name: '迷宫逃脱', icon: '🗺️', color: '#f97316' },
  'visual': { name: '视觉错觉', icon: '👁️', color: '#ec4899' },
  'retro': { name: '怀旧经典', icon: '🕹️', color: '#f59e0b' },
  'language': { name: '语言学习', icon: '🌍', color: '#3b82f6' },
  'holiday': { name: '节日主题', icon: '🎉', color: '#ef4444' },
  'simulation': { name: '模拟经营', icon: '🏭', color: '#84cc16' },
  'multiplayer': { name: '多人对战', icon: '🎮', color: '#a855f7' },
  'escape': { name: '密室逃脱', icon: '🚪', color: '#f97316' },
  'story': { name: '互动剧情', icon: '📖', color: '#ec4899' },
  'party': { name: '派对游戏', icon: '🎪', color: '#f59e0b' },
  'pixel': { name: '像素风格', icon: '👾', color: '#22c55e' },
  'aibattle': { name: 'AI合作对战', icon: '🤖', color: '#06b6d4' },
  'tech': { name: '科技未来', icon: '🔬', color: '#6366f1' },
  'life': { name: '生活实用', icon: '📋', color: '#10b981' },
  'social': { name: '社交休闲', icon: '👥', color: '#ec4899' },
  'education': { name: '教育科普', icon: '🧪', color: '#3b82f6' },
  'career': { name: '职业体验', icon: '👨‍🍳', color: '#f97316' },
  'animal': { name: '动物题材', icon: '🐕', color: '#f472b6' },
  'cooking': { name: '美食料理', icon: '🍔', color: '#ef4444' },
  'driving': { name: '交通驾驶', icon: '🚗', color: '#22c55e' },
  'craft': { name: '手工制作', icon: '🎨', color: '#ec4899' },
  'puzzle2': { name: '解谜游戏', icon: '🧩', color: '#a855f7' },
};

const getAllCategories = () => {
  const categoryCounts: Record<string, number> = {};
  GAMES_LIST.forEach(game => {
    categoryCounts[game.category] = (categoryCounts[game.category] || 0) + 1;
  });
  
  return [{ id: 'all', ...CATEGORY_INFO['all'], count: GAMES_LIST.length }]
    .concat(
      Object.entries(categoryCounts)
        .map(([id, count]) => ({
          id,
          ...(CATEGORY_INFO[id] || { name: id, icon: '🎮', color: '#a855f7' }),
          count
        }))
        .sort((a, b) => b.count - a.count)
    );
};

export default function Home() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categories = getAllCategories();

  const filteredGames = selectedCategory === 'all'
    ? GAMES_LIST
    : GAMES_LIST.filter(game => game.category === selectedCategory);

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
            {GAMES_LIST.length}款精品游戏
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
        {categories.map((cat, index) => (
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
              {cat.count}
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
                    {game.description || `${game.category}类游戏`}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {game.difficulty && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {game.difficulty === 'easy' ? '简单' : game.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                    )}
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
