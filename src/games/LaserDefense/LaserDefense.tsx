import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { LaserDefenseEngine, TurretType, LaserDefenseState, Turret, Enemy, Bullet } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 700;
const CELL_SIZE = 50;
const GRID_COLS = CANVAS_WIDTH / CELL_SIZE;
const GRID_ROWS = CANVAS_HEIGHT / CELL_SIZE;

const TOWER_ICONS: Record<TurretType, string> = {
  laser: '⚡',
  plasma: '💫',
  freezer: '❄️',
};

const TOWER_COLORS: Record<TurretType, string> = {
  laser: '#00ffff',
  plasma: '#ff00ff',
  freezer: '#00ff88',
};

const TOWER_PRICES: Record<TurretType, number> = {
  laser: 50,
  plasma: 100,
  freezer: 75,
};

const ENEMY_ICONS: Record<string, string> = {
  basic: '👾',
  fast: '👻',
  tank: '🤖',
};

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function LaserDefense() {
  const navigate = useNavigate();
  const [engine] = useState(() => new LaserDefenseEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<LaserDefenseState>(() => engine.getState());
  const [selectedTurret, setSelectedTurret] = useState<TurretType>('laser');
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const { record, updateScore } = useGameRecord('laser_defense');

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
    const existingTurret = state.turrets.find(t => t.x === gridX && t.y === gridY);
    if (existingTurret) {
      if (engine.upgradeTurret(gridX, gridY)) {
        setState(engine.getState());
      }
      return;
    }
    if (engine.placeTurret(gridX, gridY, selectedTurret)) {
      setState(engine.getState());
    }
  }, [engine, screen, selectedTurret, state.turrets]);

  const handleStartWave = useCallback(() => {
    if (!state.isWaveActive) {
      engine.startWave();
      setState(engine.getState());
    }
  }, [engine, state.isWaveActive]);

  const getPathCells = useCallback(() => {
    const pathCells: { x: number; y: number }[] = [];
    const pathPoints = engine.getPathPoints();
    const pathWidth = 40;
    
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const minX = Math.min(p1.x, p2.x) - pathWidth;
      const maxX = Math.max(p1.x, p2.x) + pathWidth;
      const minY = Math.min(p1.y, p2.y) - pathWidth;
      const maxY = Math.max(p1.y, p2.y) + pathWidth;
      
      for (let x = 0; x < GRID_COLS; x++) {
        for (let y = 0; y < GRID_ROWS; y++) {
          const cellCenterX = x * CELL_SIZE + CELL_SIZE / 2;
          const cellCenterY = y * CELL_SIZE + CELL_SIZE / 2;
          if (cellCenterX >= minX && cellCenterX <= maxX && cellCenterY >= minY && cellCenterY <= maxY) {
            if (!pathCells.some(p => p.x === x && p.y === y)) {
              pathCells.push({ x, y });
            }
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

  if (screen === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.background }}>
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h1 className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonCyan }}>
            激光防御
          </h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonPink }}>Laser Defense</p>
          <div className="text-6xl mb-8">⚡</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.text }}>
              <li>点击格子放置激光炮塔</li>
              <li>消灭敌人获得金币奖励</li>
              <li>点击已放置的炮塔可升级</li>
              <li>抵御敌人入侵保护基地</li>
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(Object.keys(TOWER_ICONS) as TurretType[]).map(type => (
                <div key={type} className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: `${TOWER_COLORS[type]}30` }}>
                  <span className="text-2xl">{TOWER_ICONS[type]}</span>
                  <span className="text-xs" style={{ color: TOWER_COLORS[type] }}>{TOWER_PRICES[type]}金</span>
                </div>
              ))}
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
              backgroundColor: NEON_COLORS.neonCyan,
              color: NEON_COLORS.background,
              boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}60`
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
              backgroundColor: NEON_COLORS.surface,
              color: NEON_COLORS.neonCyan
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

  if (screen === 'gameover') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.background }}>
        <motion.div
          className="text-center p-8 rounded-2xl"
          style={{ backgroundColor: NEON_COLORS.surface }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h2 className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
            游戏结束
          </h2>
          <div className="text-6xl mb-4">💥</div>
          
          <div className="space-y-3 mb-8">
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>
              最终得分: <span className="text-3xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.score}</span>
            </div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonPink }}>
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
                backgroundColor: NEON_COLORS.neonCyan,
                color: NEON_COLORS.background,
                boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}`
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
                backgroundColor: NEON_COLORS.surface,
                color: NEON_COLORS.neonCyan,
                border: `2px solid ${NEON_COLORS.neonCyan}`
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

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-2">
        <motion.button
          onClick={handleExit}
          className="px-3 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.surface,
            color: NEON_COLORS.neonCyan
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
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonCyan }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(Object.keys(TOWER_ICONS) as TurretType[]).map(type => (
          <motion.button
            key={type}
            onClick={() => setSelectedTurret(type)}
            className="flex flex-col items-center p-2 rounded-lg transition-all"
            style={{
              backgroundColor: selectedTurret === type ? `${TOWER_COLORS[type]}60` : NEON_COLORS.surface,
              border: `2px solid ${selectedTurret === type ? TOWER_COLORS[type] : 'transparent'}`,
              opacity: state.money < TOWER_PRICES[type] ? 0.5 : 1
            }}
            whileHover={{ scale: state.money >= TOWER_PRICES[type] ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{TOWER_ICONS[type]}</span>
            <span className="text-xs" style={{ color: TOWER_COLORS[type] }}>{TOWER_PRICES[type]}金</span>
          </motion.button>
        ))}
        
        {!state.isWaveActive && (
          <motion.button
            onClick={handleStartWave}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.neonGreen,
              color: NEON_COLORS.background
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始波次
          </motion.button>
        )}
      </div>

      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: '#0a1a2a',
          boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}30`,
          border: `2px solid ${NEON_COLORS.neonCyan}40`
        }}
      >
        <div className="absolute inset-0 grid" style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`
        }}>
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            const isPath = isPathCell(col, row);
            const hasTurret = state.turrets.some(t => t.x === col && t.y === row);
            
            return (
              <div
                key={i}
                className="border border-white/10 cursor-pointer transition-colors relative"
                style={{
                  backgroundColor: isPath ? '#1a3a4a' : hasTurret ? 'transparent' : 'rgba(0,20,40,0.5)'
                }}
                onClick={() => handleCellClick(col, row)}
                onMouseEnter={() => setHoverCell({ x: col, y: row })}
                onMouseLeave={() => setHoverCell(null)}
              >
                {hoverCell?.x === col && hoverCell?.y === row && !hasTurret && !isPath && (
                  <div
                    className="absolute inset-1 rounded opacity-50"
                    style={{ backgroundColor: TOWER_COLORS[selectedTurret] }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {state.turrets.map(turret => (
          <div
            key={turret.id}
            className="absolute flex items-center justify-center"
            style={{
              left: turret.x * CELL_SIZE,
              top: turret.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
          >
            <div 
              className="relative"
              style={{ transform: `rotate(${turret.angle}rad)` }}
            >
              <div 
                className="text-3xl" 
                style={{ filter: `drop-shadow(0 0 5px ${TOWER_COLORS[turret.type]})` }}
              >
                {TOWER_ICONS[turret.type]}
              </div>
              {turret.level > 1 && (
                <div 
                  className="absolute -top-2 -right-2 text-xs font-bold"
                  style={{ color: NEON_COLORS.gold }}
                >
                  L{turret.level}
                </div>
              )}
            </div>
          </div>
        ))}

        {state.enemies.map(enemy => (
          <motion.div
            key={enemy.id}
            className="absolute flex flex-col items-center"
            style={{
              left: enemy.x - 15,
              top: enemy.y - 20,
              filter: enemy.type === 'fast' ? 'hue-rotate(60deg)' : enemy.type === 'tank' ? 'brightness(1.2)' : 'none'
            }}
          >
            <span className="text-2xl">{ENEMY_ICONS[enemy.type]}</span>
            <div className="w-8 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                  backgroundColor: enemy.health > 50 ? '#00ff88' : enemy.health > 25 ? '#ffaa00' : '#ff4444'
                }}
              />
            </div>
          </motion.div>
        ))}

        {state.bullets.map(bullet => (
          <div
            key={bullet.id}
            className="absolute rounded-full"
            style={{
              left: bullet.x - 4,
              top: bullet.y - 4,
              width: 8,
              height: 8,
              backgroundColor: TOWER_COLORS[bullet.type],
              boxShadow: `0 0 10px ${TOWER_COLORS[bullet.type]}`
            }}
          />
        ))}

        <AnimatePresence>
          {state.isWaveActive && (
            <motion.div
              className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonGreen,
                color: NEON_COLORS.background
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
        点击格子放置炮塔 | 点击已有炮塔升级
      </div>
    </div>
  );
}
