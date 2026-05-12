import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { CatapultDefenseEngine, Enemy, Catapult, Boulder, SplashEffect, GameState } from './engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './engine';

const ENEMY_ICONS: Record<string, string> = {
  footman: '⚔️',
  knight: '🛡️',
  siege: '💂'
};

const ENEMY_COLORS: Record<string, string> = {
  footman: '#27ae60',
  knight: '#3498db',
  siege: '#e74c3c'
};

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function CatapultDefense() {
  const navigate = useNavigate();
  const [engine] = useState(() => new CatapultDefenseEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<GameState>(() => engine.getState());
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const { record, updateScore } = useGameRecord('catapult_defense');

  const handleTick = useCallback(() => {
    engine.tick();
    setState(engine.getState());
  }, [engine]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: screen === 'playing' });

  useEffect(() => {
    if (screen === 'playing' && state.isGameOver) {
      setScreen('gameover');
      updateScore(state.score);
    }
  }, [state.isGameOver, screen, state.score, updateScore]);

  const startGame = useCallback(() => {
    engine.reset();
    setState(engine.getState());
    setScreen('playing');
    engine.startWave();
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState(engine.getState());
    setScreen('playing');
    engine.startWave();
  }, [engine]);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (screen !== 'playing') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (engine.placeCatapult(x, y)) {
      setState(engine.getState());
    }
  }, [engine, screen]);

  const handleStartWave = useCallback(() => {
    if (!state.isWaveActive) {
      engine.startWave();
      setState(engine.getState());
    }
  }, [engine, state.isWaveActive]);

  // Menu Screen
  if (screen === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.primary }}>
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h1 className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
            弹射塔防
          </h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonBlue }}>Catapult Defense</p>
          <div className="text-6xl mb-8">🏹</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.cardBg }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.white }}>
              <li>点击战场放置投石机</li>
              <li>投石机会自动攻击范围内的敌人</li>
              <li>巨石造成范围伤害</li>
              <li>消灭敌人获得金币购买更多投石机</li>
            </ul>
            <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: '#8B451330' }}>
              <span className="text-3xl">🏰</span>
              <div className="text-sm mt-1" style={{ color: NEON_COLORS.gold }}>投石机价格: 150金</div>
            </div>
          </div>

          {record.bestScore > 0 && (
            <div className="mb-4 text-lg" style={{ color: NEON_COLORS.gold }}>
              最高记录: {record.bestScore}
            </div>
          )}

          <motion.button
            onClick={startGame}
            className="px-12 py-4 rounded-xl text-2xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.neonPink,
              color: NEON_COLORS.white,
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}60`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>

          <motion.button
            onClick={handleExit}
            className="mt-4 px-6 py-2 rounded-lg text-sm font-bold"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回首页
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Game Over Screen
  if (screen === 'gameover') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.primary }}>
        <motion.div
          className="text-center p-8 rounded-2xl"
          style={{ backgroundColor: NEON_COLORS.cardBg }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h2 className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
            游戏结束
          </h2>
          <div className="text-6xl mb-4">💀</div>
          
          <div className="space-y-3 mb-8">
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>
              最终得分: <span className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.score}</span>
            </div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonBlue }}>
              到达波数: {state.wave}
            </div>
            {state.score > record.bestScore && (
              <div className="text-xl animate-pulse" style={{ color: NEON_COLORS.neonGreen }}>
                新纪录!
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <motion.button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl font-bold text-lg"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再来一局
            </motion.button>
            <motion.button
              onClick={handleExit}
              className="px-8 py-3 rounded-xl font-bold text-lg"
              style={{
                backgroundColor: NEON_COLORS.darkPurple,
                color: NEON_COLORS.neonBlue,
                border: `2px solid ${NEON_COLORS.neonBlue}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              返回首页
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Playing Screen
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-[600px] px-2">
        <motion.button
          onClick={handleExit}
          className="px-3 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>波数</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.wave}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>金币</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{state.money}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>生命</div>
            <div className="text-xl font-bold" style={{ color: '#e74c3c' }}>{state.lives}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: NEON_COLORS.cardBg }}>
          <span className="text-lg">🏰</span>
          <span className="ml-2 text-sm" style={{ color: state.money >= 150 ? NEON_COLORS.gold : '#666' }}>
            150金
          </span>
        </div>
        
        {!state.isWaveActive && (
          <motion.button
            onClick={handleStartWave}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.neonGreen,
              color: NEON_COLORS.primary
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始波次
          </motion.button>
        )}
      </div>

      {/* Game Board */}
      <div
        className="relative rounded-xl overflow-hidden cursor-crosshair"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: 'linear-gradient(180deg, #87CEEB 0%, #4682B4 50%, #2F4F4F 100%)',
          boxShadow: `0 0 30px ${NEON_COLORS.neonBlue}30`,
          border: `2px solid ${NEON_COLORS.neonBlue}40`
        }}
        onClick={handleCanvasClick}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        }}
        onMouseLeave={() => setHoverPos(null)}
      >
        {/* Path */}
        <svg className="absolute inset-0 w-full h-full opacity-50">
          <path
            d={`M ${engine.getPathPoints().map(p => `${p.x},${p.y}`).join(' L ')}`}
            stroke="#8B4513"
            strokeWidth="40"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Catapult Range Indicator */}
        {hoverPos && state.money >= 150 && (
          <div
            className="absolute rounded-full border-2 border-dashed pointer-events-none"
            style={{
              left: hoverPos.x - 200,
              top: hoverPos.y - 200,
              width: 400,
              height: 400,
              borderColor: NEON_COLORS.neonPink,
              opacity: 0.3,
              backgroundColor: `${NEON_COLORS.neonPink}10`
            }}
          />
        )}

        {/* Catapults */}
        {state.catapults.map(catapult => (
          <div key={catapult.id} className="absolute" style={{
            left: catapult.x - 25,
            top: catapult.y - 25,
            width: 50,
            height: 50
          }}>
            {/* Range indicator */}
            <div
              className="absolute rounded-full"
              style={{
                left: -catapult.range + 25,
                top: -catapult.range + 25,
                width: catapult.range * 2,
                height: catapult.range * 2,
                backgroundColor: `${NEON_COLORS.neonPink}10`,
                border: `1px solid ${NEON_COLORS.neonPink}30`
              }}
            />
            
            {/* Catapult body */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-4xl"
                style={{ filter: `drop-shadow(0 0 5px ${NEON_COLORS.neonPink})` }}
                animate={catapult.isReloading ? { rotate: [0, -10, 0] } : {}}
              >
                🏰
              </motion.div>
            </div>
            
            {/* Reload bar */}
            <div className="absolute -bottom-2 left-0 right-0 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${catapult.reloadProgress * 100}%`,
                  backgroundColor: catapult.reloadProgress >= 1 ? NEON_COLORS.neonGreen : NEON_COLORS.neonPink
                }}
              />
            </div>
          </div>
        ))}

        {/* Enemies */}
        {state.enemies.map(enemy => (
          <motion.div
            key={enemy.id}
            className="absolute flex flex-col items-center"
            style={{
              left: enemy.x - 15,
              top: enemy.y - 25,
              filter: `drop-shadow(0 0 3px ${ENEMY_COLORS[enemy.type]})`
            }}
          >
            <span className="text-2xl">{ENEMY_ICONS[enemy.type]}</span>
            <div className="w-10 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                  backgroundColor: enemy.health > 50 ? '#27ae60' : enemy.health > 25 ? '#f39c12' : '#e74c3c'
                }}
              />
            </div>
          </motion.div>
        ))}

        {/* Boulders */}
        {state.boulders.map(boulder => (
          <motion.div
            key={boulder.id}
            className="absolute"
            style={{
              left: boulder.x - 12,
              top: boulder.y - 12,
              width: 24,
              height: 24,
              zIndex: 10
            }}
            animate={{
              left: boulder.x - 12,
              top: boulder.y - 12
            }}
            transition={{ duration: 0.05 }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: '#8B4513',
                boxShadow: `0 0 10px #8B4513`
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs">🪨</span>
            </div>
          </motion.div>
        ))}

        {/* Splash Effects */}
        {state.effects.map(effect => (
          <div
            key={effect.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              backgroundColor: `rgba(139, 69, 19, ${effect.alpha * 0.5})`,
              border: `2px solid rgba(139, 69, 19, ${effect.alpha})`
            }}
          />
        ))}

        {/* Wave indicator */}
        <AnimatePresence>
          {state.isWaveActive && (
            <motion.div
              className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonGreen,
                color: NEON_COLORS.primary
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              敌人入侵中 ({state.enemies.length})
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
        点击放置投石机 | 投石机会自动攻击范围内的敌人
      </div>
    </div>
  );
}
