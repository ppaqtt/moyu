import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { IceAgeDefenseEngine, Tower, Enemy, Projectile, Snowball, TowerType, GameState } from './engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './engine';

const TOWER_ICONS: Record<TowerType, string> = {
  igloo: '🏠',
  snowman: '⛄',
  geyser: '🌋'
};

const TOWER_COLORS: Record<TowerType, string> = {
  igloo: '#87CEEB',
  snowman: '#F0F8FF',
  geyser: '#00CED1'
};

const TOWER_NAMES: Record<TowerType, string> = {
  igloo: '冰屋塔',
  snowman: '雪人塔',
  geyser: '间歇泉'
};

const ENEMY_ICONS: Record<string, string> = {
  polarbear: '🐻‍❄️',
  penguin: '🐧',
  seal: '🦭'
};

const ENEMY_COLORS: Record<string, string> = {
  polarbear: '#4a4a4a',
  penguin: '#1a1a1a',
  seal: '#708090'
};

const GRID_SIZE = 45;
const GRID_COLS = Math.ceil(CANVAS_WIDTH / GRID_SIZE);
const GRID_ROWS = Math.ceil(CANVAS_HEIGHT / GRID_SIZE);

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function IceAgeDefense() {
  const navigate = useNavigate();
  const [engine] = useState(() => new IceAgeDefenseEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<GameState>(() => engine.getState());
  const [selectedTower, setSelectedTower] = useState<TowerType>('igloo');
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const { record, updateScore } = useGameRecord('ice_age_defense');

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

  const handleCellClick = useCallback((gridX: number, gridY: number) => {
    if (screen !== 'playing') return;
    
    const x = gridX * GRID_SIZE + GRID_SIZE / 2;
    const y = gridY * GRID_SIZE + GRID_SIZE / 2;

    if (engine.placeTower(x, y, selectedTower)) {
      setState(engine.getState());
    }
  }, [engine, screen, selectedTower]);

  const handleStartWave = useCallback(() => {
    if (!state.isWaveActive) {
      engine.startWave();
      setState(engine.getState());
    }
  }, [engine, state.isWaveActive]);

  const getPathCells = useCallback(() => {
    const pathCells: { x: number; y: number }[] = [];
    const pathPoints = engine.getPathPoints();
    
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      
      for (let x = minX; x <= maxX; x += GRID_SIZE) {
        for (let y = minY; y <= maxY; y += GRID_SIZE) {
          const gx = Math.floor(x / GRID_SIZE);
          const gy = Math.floor(y / GRID_SIZE);
          if (!pathCells.some(p => p.x === gx && p.y === gy)) {
            pathCells.push({ x: gx, y: gy });
          }
        }
      }
    }
    
    return pathCells;
  }, [engine]);

  const pathCells = getPathCells();

  const isPathCell = useCallback((gridX: number, gridY: number) => {
    return pathCells.some(p => p.x === gridX && p.y === gridY);
  }, [pathCells]);

  const TOWER_PRICES: Record<TowerType, number> = {
    igloo: 60,
    snowman: 80,
    geyser: 150
  };

  // Menu Screen
  if (screen === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.primary }}>
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#87CEEB' }}>
            冰时代塔防
          </h1>
          <p className="text-xl mb-2" style={{ color: '#F0F8FF' }}>Ice Age Defense</p>
          <div className="text-6xl mb-8">❄️</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.cardBg }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.white }}>
              <li>点击格子放置冰系防御塔</li>
              <li>消灭极地生物的入侵</li>
              <li>攻击可以冰冻敌人</li>
              <li>间歇泉造成范围冰冻伤害</li>
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#87CEEB30' }}>
                <span className="text-3xl">🏠</span>
                <span className="text-sm font-bold" style={{ color: '#87CEEB' }}>冰屋塔</span>
                <span className="text-xs opacity-70">冰冻攻击</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#F0F8FF30' }}>
                <span className="text-3xl">⛄</span>
                <span className="text-sm font-bold" style={{ color: '#F0F8FF' }}>雪人塔</span>
                <span className="text-xs opacity-70">快速攻击</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#00CED130' }}>
                <span className="text-3xl">🌋</span>
                <span className="text-sm font-bold" style={{ color: '#00CED1' }}>间歇泉</span>
                <span className="text-xs opacity-70">范围伤害</span>
              </div>
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
              backgroundColor: '#87CEEB',
              color: '#1a1a2e',
              boxShadow: `0 0 30px #87CEEB60`
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
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#87CEEB' }}>
            游戏结束
          </h2>
          <div className="text-6xl mb-4">💀</div>
          
          <div className="space-y-3 mb-8">
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>
              最终得分: <span className="text-3xl font-bold" style={{ color: '#87CEEB' }}>{state.score}</span>
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
                backgroundColor: '#87CEEB',
                color: '#1a1a2e',
                boxShadow: `0 0 20px #87CEEB`
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
            <div className="text-xl font-bold" style={{ color: '#87CEEB' }}>{state.wave}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-xl font-bold" style={{ color: '#87CEEB' }}>{state.score}</div>
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
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>温度</div>
            <div className="text-lg font-bold" style={{ color: state.temperature < 0 ? '#00CED1' : '#87CEEB' }}>
              {state.temperature}°C
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      {/* Tower Selection */}
      <div className="flex gap-2">
        {(['igloo', 'snowman', 'geyser'] as TowerType[]).map(type => (
          <motion.button
            key={type}
            onClick={() => setSelectedTower(type)}
            className="flex flex-col items-center p-2 rounded-lg transition-all"
            style={{
              backgroundColor: selectedTower === type ? `${TOWER_COLORS[type]}40` : NEON_COLORS.darkPurple,
              border: `2px solid ${selectedTower === type ? TOWER_COLORS[type] : 'transparent'}`,
              opacity: state.money < TOWER_PRICES[type] ? 0.5 : 1
            }}
            whileHover={{ scale: state.money >= TOWER_PRICES[type] ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{TOWER_ICONS[type]}</span>
            <span className="text-xs" style={{ color: TOWER_COLORS[type] }}>
              {TOWER_NAMES[type]} {TOWER_PRICES[type]}金
            </span>
          </motion.button>
        ))}
        
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
        className="relative rounded-xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: 'linear-gradient(180deg, #E0FFFF 0%, #B0E0E6 50%, #87CEEB 100%)',
          boxShadow: `0 0 30px #87CEEB30`,
          border: `2px solid #87CEEB40`
        }}
      >
        {/* Snow particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white opacity-50"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, 500],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3
              }}
            />
          ))}
        </div>

        {/* Grid */}
        <div className="absolute inset-0 grid" style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, ${GRID_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, ${GRID_SIZE}px)`
        }}>
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            const isPath = isPathCell(col, row);
            const hasTower = state.towers.some(t => {
              const tx = Math.floor(t.x / GRID_SIZE);
              const ty = Math.floor(t.y / GRID_SIZE);
              return tx === col && ty === row;
            });
            
            return (
              <div
                key={i}
                className="border border-white/20 cursor-pointer transition-colors relative"
                style={{
                  backgroundColor: isPath ? '#B0E0E6' : hasTower ? 'transparent' : 'rgba(255, 255, 255, 0.3)'
                }}
                onClick={() => handleCellClick(col, row)}
                onMouseEnter={() => setHoverCell({ x: col, y: row })}
                onMouseLeave={() => setHoverCell(null)}
              >
                {hoverCell?.x === col && hoverCell?.y === row && !hasTower && !isPath && (
                  <div
                    className="absolute inset-1 rounded opacity-50"
                    style={{ backgroundColor: TOWER_COLORS[selectedTower] }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Towers */}
        {state.towers.map(tower => (
          <div key={tower.id} className="absolute" style={{
            left: tower.x - 20,
            top: tower.y - 20,
            width: 40,
            height: 40
          }}>
            {/* Range indicator */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: -tower.range + 20,
                top: -tower.range + 20,
                width: tower.range * 2,
                height: tower.range * 2,
                backgroundColor: `${TOWER_COLORS[tower.type]}15`,
                border: `1px solid ${TOWER_COLORS[tower.type]}40`
              }}
            />
            
            <div className="relative w-full h-full flex items-center justify-center">
              <motion.div
                className="text-3xl"
                style={{ filter: `drop-shadow(0 0 5px ${TOWER_COLORS[tower.type]})` }}
                animate={tower.target ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {TOWER_ICONS[tower.type]}
              </motion.div>
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
              filter: enemy.isFrozen ? 'brightness(1.5) saturate(0.5)' : 'none',
              opacity: enemy.isFrozen ? 0.8 : 1
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
            {enemy.isFrozen && (
              <div className="absolute -top-2 text-xs">❄️</div>
            )}
          </motion.div>
        ))}

        {/* Projectiles */}
        {state.projectiles.map(proj => (
          <motion.div
            key={proj.id}
            className="absolute rounded-full"
            style={{
              left: proj.x - 4,
              top: proj.y - 4,
              width: 8,
              height: 8,
              backgroundColor: '#FFFFFF',
              boxShadow: `0 0 8px ${TOWER_COLORS[proj.type]}`
            }}
          />
        ))}

        {/* Snowballs (Geyser) */}
        {state.snowballs.map(ball => (
          <motion.div
            key={ball.id}
            className="absolute rounded-full"
            style={{
              left: ball.x - 12,
              top: ball.y - 12,
              width: 24,
              height: 24,
              backgroundColor: '#E0FFFF',
              border: `2px solid ${TOWER_COLORS.geyser}`,
              boxShadow: `0 0 15px ${TOWER_COLORS.geyser}`
            }}
          />
        ))}

        {/* Wave indicator */}
        <AnimatePresence>
          {state.isWaveActive && (
            <motion.div
              className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: '#87CEEB',
                color: '#1a1a2e'
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              敌人入侵中 ({state.enemies.length})
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enemy type legend */}
        <div className="absolute bottom-2 right-2 flex gap-2 text-xs bg-white/50 px-2 py-1 rounded" style={{ color: '#1a1a2e' }}>
          <span>🐧 企鹅</span>
          <span>🦭 海豹</span>
          <span>🐻‍❄️ 北极熊</span>
        </div>
      </div>

      <div className="text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
        点击格子放置防御塔 | 攻击可以冰冻敌人
      </div>
    </div>
  );
}
