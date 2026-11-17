import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

interface CoopKeyMap {
  p1: string;
  p2: string;
  extra?: string;
  mobile: string;
}

const KEY_MAPS: Record<string, CoopKeyMap> = {
  cooprun: {
    p1: 'W 跳跃 · A / D 移动 · S 滑铲',
    p2: '↑ 跳跃 · ← / → 移动 · ↓ 滑铲',
    extra: 'E 双人复活',
    mobile: '横屏后左右分区，P1 守左侧、P2 守右侧',
  },
  tetrisbattle: {
    p1: 'A / D 移动 · W 旋转 · S 加速',
    p2: '← / → 移动 · ↑ 旋转 · ↓ 加速',
    mobile: '横屏后将设备平放，两人各用一侧按键',
  },
  snakeduo: {
    p1: 'W A S D 控制方向',
    p2: '↑ ← ↓ → 控制方向',
    extra: '空格开始/重开 · Esc 暂停',
    mobile: '建议横屏，双方各自使用一侧方向键',
  },
  bunnyhunter: {
    p1: 'A / D 瞄准 · W 射击',
    p2: '← / → 瞄准 · ↑ 射击',
    mobile: '横屏左右分区，瞄准与射击都在同一侧',
  },
  pinballduo: {
    p1: 'Q / E 左右挡板',
    p2: 'O / P 左右挡板',
    extra: '空格开始 · Esc 暂停',
    mobile: '横屏后左手控制 Q/E，右手控制 O/P',
  },
  coopsokoban: {
    p1: 'W A S D 移动箱子',
    p2: '↑ ← ↓ → 移动箱子',
    mobile: '横屏左右分区，各自推动自己的角色',
  },
  coopmaze: {
    p1: 'W A S D 移动',
    p2: '↑ ← ↓ → 移动',
    mobile: '横屏左右分区，两人分头探路',
  },
  coopbreakout: {
    p1: 'A / D 移动挡板',
    p2: '← / → 移动挡板',
    extra: '空格开始',
    mobile: '横屏后设备平放，左右半屏各控一块挡板',
  },
  coopfruitcatch: {
    p1: 'A / D 移动篮子',
    p2: '← / → 移动篮子',
    extra: '空格开始',
    mobile: '横屏左右分区，各守一侧接水果',
  },
  coopbounce: {
    p1: 'A / D 移动平台',
    p2: '← / → 移动平台',
    mobile: '横屏后左右各控一块平台，保持球不落',
  },
  cooptetris: {
    p1: '方向键 或 W A S D',
    p2: '共用同一套按键',
    mobile: '单人玩法，移动端直接点击屏幕按钮',
  },
  coopshooting: {
    p1: '方向键 或 W A S D',
    p2: '共用同一套按键',
    mobile: '单人玩法，移动端直接点击屏幕按钮',
  },
  coopskiing: {
    p1: '方向键 或 W A S D',
    p2: '共用同一套按键',
    mobile: '单人玩法，移动端直接点击屏幕按钮',
  },
};

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
};

export default function CoopZone() {
  const navigate = useNavigate();
  const coopGames = useMemo(
    () => GAMES_LIST.filter(game => game.category === 'co-op'),
    [],
  );

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: NEON_COLORS.neonCyan,
              border: '1px solid rgba(0, 214, 255, 0.3)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回首页
          </motion.button>
          <div className="text-center">
            <h1
              className="text-3xl md:text-4xl font-black"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple}, ${NEON_COLORS.neonCyan})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              双人同屏馆
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              一台设备，两人同玩 · 共 {coopGames.length} 款
            </p>
          </div>
          <div className="w-24" />
        </div>

        <motion.section
          className="rounded-3xl p-5 md:p-7 mb-6"
          style={cardStyle}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 items-center">
            <div>
              <h2 className="text-lg font-bold mb-2" style={{ color: NEON_COLORS.gold }}>
                同一键盘，两套按键
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                P1 默认使用键盘左侧的 <b style={{ color: NEON_COLORS.neonCyan }}>W A S D</b> 区域，
                P2 使用右侧的 <b style={{ color: NEON_COLORS.neonPink }}>方向键</b> 区域。
                少数游戏使用 Q/E、O/P 等专用键，具体见下方卡片。
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className="px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: 'rgba(0, 210, 255, 0.14)', color: NEON_COLORS.neonCyan }}
                >
                  P1 · WASD
                </span>
                <span
                  className="px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: 'rgba(255, 107, 157, 0.14)', color: NEON_COLORS.neonPink }}
                >
                  P2 · 方向键
                </span>
                <span
                  className="px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: 'rgba(255, 255, 255, 0.07)', color: 'rgba(255,255,255,0.65)' }}
                >
                  空格 开始 / 重开
                </span>
                <span
                  className="px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: 'rgba(255, 255, 255, 0.07)', color: 'rgba(255,255,255,0.65)' }}
                >
                  Esc 暂停
                </span>
              </div>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)' }}
            >
              <div
                className="px-4 py-2 text-xs font-bold text-center"
                style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                移动端横屏双人布局
              </div>
              <div className="flex h-28">
                <div
                  className="flex-1 flex flex-col items-center justify-center gap-1"
                  style={{ background: 'rgba(0, 210, 255, 0.08)' }}
                >
                  <span className="text-2xl">🕹️</span>
                  <span className="text-sm font-black" style={{ color: NEON_COLORS.neonCyan }}>
                    P1 左半屏
                  </span>
                </div>
                <div
                  className="flex-1 flex flex-col items-center justify-center gap-1"
                  style={{ background: 'rgba(255, 107, 157, 0.08)' }}
                >
                  <span className="text-2xl">🕹️</span>
                  <span className="text-sm font-black" style={{ color: NEON_COLORS.neonPink }}>
                    P2 右半屏
                  </span>
                </div>
              </div>
              <div className="px-4 py-2 text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                手机请横屏并关闭方向锁定，两人各守一侧
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coopGames.map((game, index) => {
            const keys = KEY_MAPS[game.id] || {
              p1: 'W A S D',
              p2: '方向键',
              mobile: '横屏左右分区',
            };
            return (
              <motion.div
                key={game.id}
                className="rounded-2xl p-5 cursor-pointer"
                style={cardStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: 'rgba(255, 107, 157, 0.12)',
                        border: '1px solid rgba(255, 107, 157, 0.3)',
                      }}
                    >
                      {game.icon}
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {game.name}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {game.playTime} 分钟 · 双人
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    {game.difficulty === 'easy' ? '简单' : game.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex gap-2">
                    <span className="font-bold shrink-0" style={{ color: NEON_COLORS.neonCyan }}>P1</span>
                    <span style={{ color: 'rgba(255,255,255,0.65)' }}>{keys.p1}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold shrink-0" style={{ color: NEON_COLORS.neonPink }}>P2</span>
                    <span style={{ color: 'rgba(255,255,255,0.65)' }}>{keys.p2}</span>
                  </div>
                  {keys.extra && (
                    <div className="flex gap-2">
                      <span className="font-bold shrink-0" style={{ color: NEON_COLORS.gold }}>通用</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{keys.extra}</span>
                    </div>
                  )}
                </div>

                <div
                  className="text-[11px] rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)' }}
                >
                  📱 {keys.mobile}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
