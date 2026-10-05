import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';
import {
  usePlayerName,
  useLeaderboardVersion,
  getLeaderboard,
  getGlobalLeaderboard,
  getLeaderboardGames,
  exportLeaderboardData,
  clearLeaderboard,
  DEFAULT_PLAYER_NAME,
} from '../hooks/useLeaderboard';

const MEDALS = ['🥇', '🥈', '🥉'];

function rankBadge(rank: number, color: string) {
  if (rank < 3) return MEDALS[rank];
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
      style={{ background: `${color}25`, color: 'rgba(255,255,255,0.7)' }}
    >
      {rank + 1}
    </span>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusGame = searchParams.get('game') || '';
  const version = useLeaderboardVersion();
  const [playerName, savePlayerName] = usePlayerName();
  const [nameInput, setNameInput] = useState(playerName);
  const [tab, setTab] = useState<'global' | 'games'>(focusGame ? 'games' : 'global');
  const [expandedGame, setExpandedGame] = useState<string>(focusGame);
  const [copied, setCopied] = useState(false);

  const global = useMemo(() => getGlobalLeaderboard(), [version]);
  const gameIds = useMemo(() => getLeaderboardGames(), [version]);

  const currentName = playerName || DEFAULT_PLAYER_NAME;

  const handleSaveName = () => {
    savePlayerName(nameInput);
  };

  const handleExport = async () => {
    const json = exportLeaderboardData();
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用时退化为下载
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leaderboard.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderEntries = (gameId: string, limit?: number) => {
    const entries = getLeaderboard(gameId);
    const shown = limit ? entries.slice(0, limit) : entries;
    return (
      <ul className="space-y-2">
        {shown.map((e, i) => {
          const isMe = e.name === currentName;
          return (
            <li
              key={`${e.name}-${i}`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{
                background: isMe ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255,255,255,0.04)',
                border: isMe ? '1px solid rgba(0, 210, 255, 0.35)' : '1px solid transparent',
              }}
            >
              <div className="w-7 text-center">{rankBadge(i, NEON_COLORS.neonCyan)}</div>
              <div className="flex-1 truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {e.name}
                {isMe && <span className="ml-2 text-xs" style={{ color: NEON_COLORS.neonCyan }}>我</span>}
              </div>
              <div className="font-bold" style={{ color: NEON_COLORS.neonPink }}>
                {e.score}
              </div>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="text-sm opacity-50 py-2">暂无成绩，去玩一局吧</li>
        )}
      </ul>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 顶部导航 */}
          <div className="flex items-center justify-between mb-10">
            <motion.button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl font-medium flex items-center gap-2"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← 返回首页
            </motion.button>
            <motion.button
              onClick={handleExport}
              className="px-6 py-3 rounded-xl font-medium flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(6,182,212,0.3))',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(168,85,247,0.3)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? '✅ 已复制' : '📤 导出数据'}
            </motion.button>
          </div>

          {/* 标题 */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              className="text-5xl font-black mb-3"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🏆 排行榜
            </h1>
            <p className="opacity-70">设置你的昵称，留下每个游戏的最高分，和高手一较高下</p>
          </motion.div>

          {/* 玩家昵称 */}
          <div
            className="rounded-2xl p-5 mb-8 flex flex-wrap items-center gap-3"
            style={{
              background: 'linear-gradient(145deg, rgba(26,26,46,0.8), rgba(15,15,26,0.95))',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-2xl">👤</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>
              当前昵称：<b style={{ color: NEON_COLORS.neonCyan }}>{currentName}</b>
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="输入昵称（最多12字）"
                maxLength={12}
                className="px-4 py-2 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  width: 180,
                }}
              />
              <motion.button
                onClick={handleSaveName}
                className="px-5 py-2 rounded-xl font-semibold"
                style={{ background: NEON_COLORS.neonCyan, color: '#062b33' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                保存
              </motion.button>
            </div>
          </div>

          {/* 切换 */}
          <div className="flex justify-center gap-3 mb-8">
            {([
              { key: 'global', label: '总榜' },
              { key: 'games', label: '单游戏榜' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-6 py-2.5 rounded-2xl font-semibold"
                style={{
                  background: tab === t.key ? NEON_COLORS.neonPurple : 'rgba(255,255,255,0.08)',
                  color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.7)',
                  border: `2px solid ${tab === t.key ? NEON_COLORS.neonPurple : 'transparent'}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 总榜 */}
          {tab === 'global' && (
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'linear-gradient(145deg, rgba(26,26,46,0.8), rgba(15,15,26,0.95))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h2 className="text-xl font-bold mb-4">总排行榜（各游戏最高分之和）</h2>
              <ul className="space-y-2">
                {global.map((item, i) => {
                  const isMe = item.name === currentName;
                  return (
                    <li
                      key={item.name}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: isMe ? 'rgba(0,210,255,0.12)' : 'rgba(255,255,255,0.04)',
                        border: isMe ? '1px solid rgba(0,210,255,0.35)' : '1px solid transparent',
                      }}
                    >
                      <div className="w-8 text-center text-lg">{rankBadge(i, NEON_COLORS.neonPurple)}</div>
                      <div className="flex-1 truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {item.name}
                        {isMe && <span className="ml-2 text-xs" style={{ color: NEON_COLORS.neonCyan }}>我</span>}
                      </div>
                      <div className="text-xs opacity-60 mr-3">{item.gamesPlayed} 款游戏</div>
                      <div className="font-black" style={{ color: NEON_COLORS.neonPink }}>
                        {item.totalScore}
                      </div>
                    </li>
                  );
                })}
                {global.length === 0 && (
                  <li className="text-sm opacity-50 py-3">暂无排行数据，先去玩几局游戏吧</li>
                )}
              </ul>
            </div>
          )}

          {/* 单游戏榜 */}
          {tab === 'games' && (
            <div className="space-y-4">
              {gameIds.length === 0 && (
                <div
                  className="rounded-3xl p-10 text-center opacity-60"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  暂无任何游戏的排行数据，快去玩一局吧
                </div>
              )}
              {gameIds.map((gameId) => {
                const meta = GAMES_LIST.find((g) => g.id === gameId);
                const entries = getLeaderboard(gameId);
                const expanded = expandedGame === gameId;
                return (
                  <div
                    key={gameId}
                    className="rounded-3xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(26,26,46,0.8), rgba(15,15,26,0.95))',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      className="p-5 flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedGame(expanded ? '' : gameId)}
                    >
                      <div className="text-3xl">{meta?.icon || '🎮'}</div>
                      <div className="flex-1">
                        <div className="font-bold text-lg">{meta?.name || gameId}</div>
                        <div className="text-xs opacity-50">{entries.length} 条记录</div>
                      </div>
                      <div className="text-2xl opacity-60">{expanded ? '▲' : '▼'}</div>
                    </div>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="px-5 pb-5">
                            {renderEntries(gameId)}
                            <div className="mt-3 text-right">
                              <button
                                className="text-xs opacity-50 hover:opacity-90"
                                onClick={() => clearLeaderboard(gameId)}
                              >
                                清空该游戏排行
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
