import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { NEON_COLORS } from '../utils/constants';
import { COLLECTIONS, getEnrichedGames } from '../utils/gameMeta';
import type { EnrichedGame } from '../utils/gameMeta';

const GAMES = getEnrichedGames();

const COLLECTION_COUNTS = COLLECTIONS.reduce<Record<string, number>>((counts, collection) => {
  counts[collection.id] = GAMES.filter(collection.match).length;
  return counts;
}, {});

const PAGE_SIZE = 60;

function difficultyLabel(difficulty: EnrichedGame['difficulty']) {
  if (difficulty === 'easy') return '简单';
  if (difficulty === 'medium') return '中等';
  return '困难';
}

export default function Collections() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(COLLECTIONS[0].id);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const collection = COLLECTIONS.find(item => item.id === selectedId) ?? COLLECTIONS[0];
  const games = GAMES.filter(collection.match);
  const visibleGames = games.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedId]);

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      <ParticleBg />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <motion.button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl font-medium"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回首页
          </motion.button>
          <div className="text-right">
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>按摸鱼场景自动归类</div>
            <div className="text-2xl font-black" style={{ color: NEON_COLORS.neonCyan }}>合集专题</div>
          </div>
        </div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-4xl md:text-6xl font-black mb-3"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            今天想怎么摸鱼？
          </h1>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
            不用在 49 个分类里翻找，按场景直接开玩。合集由游戏元数据实时生成。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {COLLECTIONS.map((item, index) => {
            const active = item.id === selectedId;
            return (
              <motion.button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="text-left rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: active
                    ? `linear-gradient(145deg, ${item.accent}35, rgba(15,15,26,0.95))`
                    : 'linear-gradient(145deg, rgba(26,26,46,0.9), rgba(15,15,26,0.95))',
                  border: `1px solid ${active ? item.accent : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: active ? `0 0 30px ${item.accent}40` : 'none',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-lg font-bold text-white">{item.title}</div>
                <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.description}</div>
                <div className="text-xs mt-3 font-bold" style={{ color: item.accent }}>
                  {COLLECTION_COUNTS[item.id]} 款
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xl font-bold" style={{ color: collection.accent }}>
              {collection.icon} {collection.title}
            </div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              共 {games.length} 款 · 当前展示 {visibleGames.length} 款
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleGames.map((game, index) => (
            <motion.div
              key={game.id}
              className="cursor-pointer rounded-2xl p-5"
              style={{
                background: 'linear-gradient(145deg, rgba(26,26,46,0.9), rgba(15,15,26,0.95))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onClick={() => navigate(`/game/${game.id}`)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 12) * 0.02 }}
              whileHover={{ y: -4, borderColor: collection.accent }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: `${collection.accent}20`, border: `1px solid ${collection.accent}50` }}
                >
                  {game.icon}
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  {difficultyLabel(game.difficulty)}
                </span>
              </div>

              <div className="text-lg font-bold text-white mb-1">{game.name}</div>
              <div className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {game.description}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[`${game.duration} 分钟`, game.players === 2 ? '双人' : '单人', game.keyboard ? '键盘' : '', ...game.tags.slice(0, 2)]
                  .filter(Boolean)
                  .map((chip, chipIndex) => (
                    <span
                      key={`${chip}-${chipIndex}`}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
                    >
                      {chip}
                    </span>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>

        {visibleGames.length < games.length && (
          <div className="flex justify-center mt-8">
            <motion.button
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              className="px-8 py-3 rounded-xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${collection.accent}, ${NEON_COLORS.neonCyan})`,
                color: '#0a0a1a',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              加载更多（剩余 {games.length - visibleGames.length} 款）
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
