import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import GameGrid from '../components/GameGrid';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';
import { CATEGORY_INFO } from '../data/categories';
import { COLLECTIONS, getCollectionGames } from '../data/collections';
import { getDailyGame, getHighScore, usePlayerData } from '../lib/playerData';
import { getGameSearchText } from '../data/gameGuides';

type Scope = 'all' | 'favorites' | 'recent';

const getAllCategories = () => {
  const categoryCounts: Record<string, number> = {};
  GAMES_LIST.forEach(game => {
    categoryCounts[game.category] = (categoryCounts[game.category] || 0) + 1;
  });

  return [{ id: 'all', ...CATEGORY_INFO.all, count: GAMES_LIST.length }].concat(
    Object.entries(categoryCounts)
      .map(([id, count]) => ({
        id,
        ...(CATEGORY_INFO[id] || { name: id, icon: '🎮', color: '#a855f7' }),
        count,
      }))
      .sort((a, b) => b.count - a.count),
  );
};

export default function Home() {
  const navigate = useNavigate();
  const { favorites, recent, toggleFavorite, daily } = usePlayerData();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(getAllCategories, []);
  const dailyGame = useMemo(() => getDailyGame(), []);
  const dailyHighScore = Math.max(daily?.bestScore ?? 0, getHighScore(dailyGame.id));

  const activeCollectionData = COLLECTIONS.find(item => item.id === activeCollection) ?? null;

  const games = useMemo(() => {
    let list = GAMES_LIST;

    if (activeCollectionData) {
      list = getCollectionGames(activeCollectionData);
    } else if (selectedCategory !== 'all') {
      list = list.filter(game => game.category === selectedCategory);
    }

    if (scope === 'favorites') {
      list = list.filter(game => favorites.includes(game.id));
    } else if (scope === 'recent') {
      const order = new Map(recent.map((item, index) => [item.id, index]));
      list = list
        .filter(game => order.has(game.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }

    const keyword = search.trim().toLowerCase();
    if (keyword) {
      list = list.filter(game => getGameSearchText(game).includes(keyword));
    }

    return list;
  }, [activeCollectionData, selectedCategory, scope, favorites, recent, search]);

  const scrollToResults = () => {
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const openGame = (gameId: string) => navigate(`/game/${gameId}`);

  const playRandom = () => {
    const pool = games.length > 0 ? games : GAMES_LIST;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/game/${pick.id}`);
  };

  const selectCollection = (collectionId: string) => {
    setActiveCollection(collectionId);
    setSelectedCategory('all');
    setScope('all');
    setSearch('');
    scrollToResults();
  };

  const resetCollection = () => {
    setActiveCollection(null);
    scrollToResults();
  };

  const selectCategory = (categoryId: string) => {
    setActiveCollection(null);
    setSelectedCategory(categoryId);
    scrollToResults();
  };

  const scopeLabel = activeCollectionData
    ? activeCollectionData.title
    : selectedCategory === 'all'
      ? '全部游戏'
      : categories.find(item => item.id === selectedCategory)?.name ?? '全部游戏';

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden">
      <ParticleBg />

      <motion.div
        className="absolute top-6 right-6 z-20 flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => navigate('/multiplayer')}
          className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(6, 182, 212, 0.25))',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            backdropFilter: 'blur(10px)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          🛰️ 联机对战
        </motion.button>
        <motion.button
          onClick={() => navigate('/updates')}
          className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(6, 182, 212, 0.3))',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          📝 更新日志
        </motion.button>
      </motion.div>

      <motion.div
        className="text-center mt-10 mb-8 relative z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-2xl">🎮</span>
          <span className="text-sm font-medium" style={{ color: NEON_COLORS.neonCyan }}>
            {GAMES_LIST.length} 款精品游戏
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
            filter: 'drop-shadow(0 0 40px rgba(255, 107, 157, 0.4))',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          摸鱼小游戏
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl"
          style={{ color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.2em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          工作累了? 来放松一下 ✨
        </motion.p>
      </motion.div>

      {/* 随机摸鱼 + 每日一局 */}
      <motion.div
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <motion.button
          onClick={playRandom}
          className="text-left rounded-3xl p-6 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.18), rgba(168, 85, 247, 0.16))',
            border: '1px solid rgba(255, 107, 157, 0.35)',
            backdropFilter: 'blur(16px)',
          }}
          whileHover={{ scale: 1.015, boxShadow: '0 0 32px rgba(255, 107, 157, 0.25)' }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest mb-2" style={{ color: NEON_COLORS.neonPink }}>
                RANDOM
              </div>
              <div className="text-2xl font-black mb-1">随机摸鱼</div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                选择困难？从当前 {games.length} 款里随机开一局
              </div>
            </div>
            <div className="text-5xl group-hover:rotate-12 transition-transform duration-300">🎲</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => navigate(`/game/${dailyGame.id}`)}
          className="text-left rounded-3xl p-6 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(34, 197, 94, 0.14))',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            backdropFilter: 'blur(16px)',
          }}
          whileHover={{ scale: 1.015, boxShadow: '0 0 32px rgba(6, 182, 212, 0.25)' }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-widest mb-2" style={{ color: NEON_COLORS.neonCyan }}>
                DAILY · {new Date().toLocaleDateString('zh-CN')}
              </div>
              <div className="text-2xl font-black mb-1">每日一局</div>
              <div className="text-sm flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                <span className="text-xl">{dailyGame.icon}</span>
                <span>{dailyGame.name}</span>
                {daily ? (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34, 197, 94, 0.18)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' }}
                  >
                    已打卡
                  </span>
                ) : (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'rgba(255,255,255,0.55)' }}
                  >
                    待挑战
                  </span>
                )}
              </div>
              <div className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                今日最高分 {dailyHighScore}
              </div>
            </div>
            <div className="text-5xl group-hover:-translate-y-1 transition-transform duration-300">📅</div>
          </div>
        </motion.button>
      </motion.div>

      {/* 搜索与快捷筛选 */}
      <motion.div
        className="w-full max-w-6xl relative z-10 mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
              🔍
            </span>
            <input
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                if (event.target.value) setScope('all');
              }}
              placeholder="搜索游戏名、分类或玩法，例如：双人 / 推箱子 / 音乐"
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl outline-none text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                backdropFilter: 'blur(12px)',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="清空搜索"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {([
              { id: 'all', label: '全部', count: GAMES_LIST.length },
              { id: 'favorites', label: '★ 收藏', count: favorites.length },
              { id: 'recent', label: '🕘 最近', count: recent.length },
            ] as const).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setScope(item.id);
                  setActiveCollection(null);
                  scrollToResults();
                }}
                className="px-4 py-3.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: scope === item.id ? 'rgba(168, 85, 247, 0.28)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${scope === item.id ? 'rgba(168, 85, 247, 0.6)' : 'rgba(255, 255, 255, 0.12)'}`,
                  color: scope === item.id ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                }}
              >
                {item.label} <span className="opacity-60">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 人工策展合集 */}
      <motion.section
        className="w-full max-w-6xl relative z-10 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <div className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>人工策展</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              从 {categories.length - 1} 个分类里挑出的 8 种摸鱼姿势
            </div>
          </div>
          {activeCollectionData && (
            <button
              type="button"
              onClick={resetCollection}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}
            >
              清除合集 ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COLLECTIONS.map((collection, index) => {
            const isActive = collection.id === activeCollection;
            const count = getCollectionGames(collection).length;
            return (
              <motion.button
                key={collection.id}
                type="button"
                onClick={() => selectCollection(collection.id)}
                className="text-left rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${collection.color}38, ${collection.color}14)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isActive ? collection.color : 'rgba(255, 255, 255, 0.1)'}`,
                  boxShadow: isActive ? `0 0 24px ${collection.color}30` : 'none',
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{collection.icon}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{count} 款</span>
                </div>
                <div className="text-sm font-bold mb-1" style={{ color: '#ffffff' }}>{collection.title}</div>
                <div className="text-xs leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {collection.subtitle}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* 分类筛选 */}
      <motion.div
        className="flex flex-wrap justify-center gap-2.5 mb-8 relative z-10 max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {categories.map((cat, index) => {
          const isActive = !activeCollectionData && selectedCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className="px-4 py-2 rounded-2xl font-semibold text-xs flex items-center gap-1.5 transition-all duration-300"
              style={{
                backgroundColor: isActive ? cat.color : 'rgba(255, 255, 255, 0.06)',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                border: `1px solid ${isActive ? cat.color : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isActive ? `0 0 18px ${cat.color}50` : 'none',
                backdropFilter: 'blur(10px)',
              }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 16) * 0.02 }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }}
              >
                {cat.count}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* 结果区 */}
      <div ref={resultsRef} className="w-full max-w-7xl relative z-10 px-1 scroll-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {scopeLabel}
            {search.trim() && <> · 搜索「{search.trim()}」</>}
            <span className="ml-2 font-bold" style={{ color: NEON_COLORS.neonCyan }}>{games.length}</span> 款
          </div>
          {scope === 'recent' && recent.length > 0 && (
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>最近玩过的游戏会自动出现在这里</div>
          )}
        </div>

        <GameGrid
          games={games}
          favorites={favorites}
          onOpen={openGame}
          onToggleFavorite={toggleFavorite}
          emptyTitle={
            scope === 'favorites'
              ? '还没有收藏任何游戏'
              : scope === 'recent'
                ? '还没有最近玩过的游戏'
                : '没有找到匹配的游戏'
          }
          emptyHint={
            scope === 'favorites'
              ? '点击游戏卡片右上角的 ☆ 就能收藏'
              : scope === 'recent'
                ? '随便点开一局，它会自动记录在这里'
                : '换个关键词，或切换分类再试试'
          }
        />
      </div>

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
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="footer-content">
            <motion.div
              className="footer-logo text-3xl font-black mb-4"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(255, 107, 157, 0.3)',
              }}
            >
              摸鱼小游戏
            </motion.div>

            <p className="footer-desc text-lg mb-6" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              工作累了？来放松一下 ✨ 精选 {GAMES_LIST.length} 款小游戏，让你在工作间隙轻松摸鱼放松身心
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
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 157, 0.3), rgba(6, 182, 212, 0.3))';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 157, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                }}
                onMouseLeave={e => {
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
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.3))';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                }}
                onMouseLeave={e => {
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
