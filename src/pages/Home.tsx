import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';
import { getDailyGame, formatDailyDate } from '../utils/dailyGame';

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
  '3d': { name: '3D视觉', icon: '🎡', color: '#3b82f6' },
};

const PLAYER_OPTIONS = [
  { id: 'all', label: '不限', icon: '👥' },
  { id: '1', label: '单人', icon: '🙋' },
  { id: '2', label: '双人', icon: '👫' },
  { id: 'multi', label: '多人', icon: '👨‍👩‍👧' },
] as const;

const TIME_OPTIONS = [
  { id: 0, label: '不限' },
  { id: 5, label: '5 分钟' },
  { id: 15, label: '15 分钟' },
  { id: 30, label: '30 分钟' },
] as const;

const CONTROL_ICON: Record<string, string> = {
  keyboard: '⌨️',
  mouse: '🖱️',
  touch: '📱',
  gamepad: '🎮',
};

function playerLabel(players: number | 'multi') {
  if (players === 1) return '单人';
  if (players === 2) return '双人';
  return '多人';
}

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
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const [selectedPlayers, setSelectedPlayers] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(60);
  const categories = getAllCategories();
  const dailyGame = useMemo(() => getDailyGame(GAMES_LIST), []);

  const filteredGames = useMemo(() => {
    return GAMES_LIST.filter(game => {
      if (selectedCategory !== 'all' && game.category !== selectedCategory) return false;
      if (selectedTime !== 0 && game.playTime !== selectedTime) return false;
      if (selectedPlayers !== 'all' && String(game.players) !== selectedPlayers) return false;
      return true;
    });
  }, [selectedCategory, selectedTime, selectedPlayers]);

  useEffect(() => {
    setVisibleCount(60);
  }, [selectedCategory, selectedTime, selectedPlayers]);

  const visibleGames = filteredGames.slice(0, visibleCount);
  const dailyCategory = CATEGORY_INFO[dailyGame.category] || {
    name: dailyGame.category,
    icon: '🎮',
    color: '#a855f7',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 md:pt-6 relative overflow-hidden">
      <ParticleBg />

      <motion.div
        className="absolute top-6 right-6 z-20 flex flex-wrap justify-end gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => navigate('/coop')}
          className="px-4 py-2.5 rounded-xl font-medium text-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.25), rgba(168, 85, 247, 0.25))',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 107, 157, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 107, 157, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          👥 双人同屏
        </motion.button>
        <motion.button
          onClick={() => navigate('/settings')}
          className="px-4 py-2.5 rounded-xl font-medium text-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(6, 182, 212, 0.25))',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          ⚙️ 设置
        </motion.button>
        <motion.button
          onClick={() => navigate('/updates')}
          className="px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(6, 182, 212, 0.3))',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          📝 更新日志
        </motion.button>
      </motion.div>

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
        className="w-full max-w-5xl relative z-10 mb-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div
          className="relative overflow-hidden rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 cursor-pointer"
          style={{
            background: `linear-gradient(120deg, ${dailyCategory.color}26, rgba(26, 26, 46, 0.92) 45%, rgba(15, 15, 26, 0.96))`,
            border: `1px solid ${dailyCategory.color}55`,
            boxShadow: `0 12px 40px ${dailyCategory.color}22, inset 0 1px 0 rgba(255,255,255,0.08)`
          }}
          onClick={() => navigate(`/game/${dailyGame.id}`)}
        >
          <div
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${dailyCategory.color}, transparent 70%)` }}
          />
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shrink-0"
            style={{
              background: `${dailyCategory.color}22`,
              border: `1px solid ${dailyCategory.color}55`
            }}
          >
            {dailyGame.icon}
          </div>
          <div className="flex-1 relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className="text-xs font-black px-2.5 py-1 rounded-lg"
                style={{ background: dailyCategory.color, color: '#0b0b14' }}
              >
                每日一游
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {formatDailyDate()} · 每天 0 点刷新
              </span>
            </div>
            <h3 className="text-2xl font-black mb-1" style={{ color: '#fff' }}>
              {dailyGame.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span>{dailyCategory.icon} {dailyCategory.name}</span>
              <span>·</span>
              <span>⏱ {dailyGame.playTime} 分钟</span>
              <span>·</span>
              <span>👥 {playerLabel(dailyGame.players)}</span>
              <span>·</span>
              <span>{dailyGame.difficulty === 'easy' ? '简单' : dailyGame.difficulty === 'medium' ? '中等' : '困难'}</span>
            </div>
          </div>
          <motion.button
            className="relative z-10 px-6 py-3 rounded-2xl font-black text-sm shrink-0"
            style={{
              background: `linear-gradient(135deg, ${dailyCategory.color}, ${NEON_COLORS.neonPurple})`,
              color: '#fff',
              boxShadow: `0 0 24px ${dailyCategory.color}55`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/game/${dailyGame.id}`);
            }}
          >
            开始今日游戏 →
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="w-full max-w-5xl relative z-10 mb-6 rounded-2xl px-4 py-3 flex flex-col gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)'
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold w-10" style={{ color: 'rgba(255,255,255,0.45)' }}>时长</span>
          {TIME_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedTime(option.id)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: selectedTime === option.id ? NEON_COLORS.neonCyan : 'rgba(255,255,255,0.06)',
                color: selectedTime === option.id ? '#0b0b14' : 'rgba(255,255,255,0.65)',
                border: `1px solid ${selectedTime === option.id ? NEON_COLORS.neonCyan : 'rgba(255,255,255,0.1)'}`
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold w-10" style={{ color: 'rgba(255,255,255,0.45)' }}>人数</span>
          {PLAYER_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedPlayers(option.id)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: selectedPlayers === option.id ? NEON_COLORS.neonPink : 'rgba(255,255,255,0.06)',
                color: selectedPlayers === option.id ? '#0b0b14' : 'rgba(255,255,255,0.65)',
                border: `1px solid ${selectedPlayers === option.id ? NEON_COLORS.neonPink : 'rgba(255,255,255,0.1)'}`
              }}
            >
              {option.icon} {option.label}
            </button>
          ))}
          <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            找到 {filteredGames.length} 款
          </span>
        </div>
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
        {visibleGames.map((game, index) => (
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
                    {CATEGORY_INFO[game.category]?.name || game.category} 类游戏
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
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{
                        backgroundColor: 'rgba(0, 210, 255, 0.08)',
                        color: 'rgba(0, 210, 255, 0.85)',
                        border: '1px solid rgba(0, 210, 255, 0.18)'
                      }}
                    >
                      ⏱ {game.playTime} 分钟
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{
                        backgroundColor: 'rgba(255, 107, 157, 0.08)',
                        color: 'rgba(255, 107, 157, 0.85)',
                        border: '1px solid rgba(255, 107, 157, 0.18)'
                      }}
                    >
                      👥 {playerLabel(game.players)}
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      title={game.controls.map(c => ({ keyboard: '键盘', mouse: '鼠标', touch: '触屏', gamepad: '手柄' }[c] || c)).join(' / ')}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {game.controls.map(c => CONTROL_ICON[c] || '').join('')}
                    </span>
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

      {visibleCount < filteredGames.length && (
        <motion.button
          onClick={() => setVisibleCount(count => count + 60)}
          className="relative z-10 mt-8 px-8 py-3 rounded-2xl font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(6, 182, 212, 0.25))',
            color: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            backdropFilter: 'blur(10px)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          加载更多（还剩 {filteredGames.length - visibleCount} 款）
        </motion.button>
      )}

      <motion.footer
        className="mt-16 text-center relative z-10 w-full px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div
          className="max-w-4xl mx-auto rounded-3xl p-8 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8), rgba(15, 15, 26, 0.9))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="footer-content">
            <motion.div
              className="footer-logo text-3xl font-black mb-4"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(255, 107, 157, 0.3)'
              }}
            >
              摸鱼小游戏
            </motion.div>

            <p className="footer-desc text-lg mb-6" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              工作累了？来放松一下 ✨ 精选{GAMES_LIST.length}款小游戏，让你在工作间隙轻松摸鱼放松身心
            </p>

            <div className="social-links flex justify-center gap-4 mb-8">
              <a
                href="https://github.com/ppaqtt"
                className="social-icon w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300"
                title="GitHub"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 157, 0.3), rgba(6, 182, 212, 0.3))';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 157, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                }}
              >
                🐙
              </a>
              <a
                href="mailto:ppkjgzs@qq.com"
                className="social-icon w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300"
                title="邮箱"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.3))';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                }}
              >
                📧
              </a>
            </div>

            <div className="footer-bottom pt-6 border-t border-white/10">
              <div className="footer-links flex flex-wrap justify-center items-center gap-3 text-sm mb-3" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                <span>
                  由
                  <a
                    href="https://ppkjgzs.top"
                    className="footer-link mx-1 hover:opacity-100 transition-opacity"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: NEON_COLORS.neonCyan }}
                  >
                    平平的小破站
                  </a>
                  制作
                </span>
                <span className="divider" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
                <span>
                  使用
                  <span className="tech mx-1" style={{ color: NEON_COLORS.neonPink }}>React</span>
                  ,
                  <span className="tech mx-1" style={{ color: NEON_COLORS.neonPink }}>TypeScript</span>
                  和
                  <span className="tech mx-1" style={{ color: NEON_COLORS.neonCyan }}>Vite</span>
                  构建
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                © 2025 摸鱼小游戏 版权所有
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icp-record hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  浙ICP备2025194709号-2
                </a>
                <a
                  href="https://beian.mps.gov.cn/#/query/webSearch?code=13020202000680"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icp-record hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  冀公网安备13020202000680号
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
