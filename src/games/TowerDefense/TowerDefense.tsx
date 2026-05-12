import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { TowerDefenseEngine, Tower, Enemy, Projectile, TowerType, GameState } from './engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS } from './engine';

const TOWER_ICONS: Record<TowerType, string> = {
  arrow: '🏹',
  cannon: '💣',
  ice: '❄️'
};

const TOWER_COLORS: Record<TowerType, string> = {
  arrow: '#27ae60',
  cannon: '#e74c3c',
  ice: '#3498db'
};

const TOWER_PRICES: Record<TowerType, number> = {
  arrow: 50,
  cannon: 100,
  ice: 75
};

const ENEMY_ICONS: Record<string, string> = {
  basic: '👹',
  fast: '👻',
  tank: '👾'
};

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function TowerDefense() {
  const navigate = useNavigate();
  const [engine] = useState(() => new TowerDefenseEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<GameState>(() => engine.getState());
  const [selectedTower, setSelectedTower] = useState<TowerType>('arrow');
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const { record, updateScore } = useGameRecord('tower_defense');

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
    
    const existingTower = state.towers.find(t => t.x === gridX && t.y === gridY);
    if (existingTower) {
      // 点击已放置的塔 - 可以出售
      engine.sellTower(gridX, gridY);
      setState(engine.getState());
      return;
    }

    if (engine.placeTower(gridX, gridY, selectedTower)) {
      setState(engine.getState());
    }
  }, [engine, screen, selectedTower, state.towers]);

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
          const gridX = Math.floor(x / GRID_SIZE);
          const gridY = Math.floor(y / GRID_SIZE);
          if (!pathCells.some(p => p.x === gridX && p.y === gridY)) {
            pathCells.push({ x: gridX, y: gridY });
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
            经典塔防
          </h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonBlue }}>Classic Tower Defense</p>
          <div className="text-6xl mb-8">🏰</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.cardBg }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.white }}>
              <li>点击格子放置防御塔</li>
              <li>消灭敌人获得金币</li>
              <li>合理规划塔位抵御敌人入侵</li>
              <li>点击已有塔可出售(返还60%金币)</li>
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(['arrow', 'cannon', 'ice'] as TowerType[]).map(type => (
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

      {/* Tower Selection */}
      <div className="flex gap-2">
        {(['arrow', 'cannon', 'ice'] as TowerType[]).map(type => (
          <motion.button
            key={type}
            onClick={() => setSelectedTower(type)}
            className="flex flex-col items-center p-2 rounded-lg transition-all"
            style={{
              backgroundColor: selectedTower === type ? `${TOWER_COLORS[type]}60` : NEON_COLORS.darkPurple,
              border: `2px solid ${selectedTower === type ? TOWER_COLORS[type] : 'transparent'}`,
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
          backgroundColor: '#1a2a1a',
          boxShadow: `0 0 30px ${NEON_COLORS.neonGreen}30`,
          border: `2px solid ${NEON_COLORS.neonGreen}40`
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0 grid" style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, ${GRID_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, ${GRID_SIZE}px)`
        }}>
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            const isPath = isPathCell(col, row);
            const hasTower = state.towers.some(t => t.x === col && t.y === row);
            
            return (
              <div
                key={i}
                className="border border-white/10 cursor-pointer transition-colors relative"
                style={{
                  backgroundColor: isPath ? '#3d5c3d' : hasTower ? 'transparent' : 'rgba(0,0,0,0.3)'
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
          <div
            key={tower.id}
            className="absolute flex items-center justify-center"
            style={{
              left: tower.x * GRID_SIZE,
              top: tower.y * GRID_SIZE,
              width: GRID_SIZE,
              height: GRID_SIZE
            }}
          >
            <div className="text-3xl" style={{ filter: `drop-shadow(0 0 5px ${TOWER_COLORS[tower.type]})` }}>
              {TOWER_ICONS[tower.type]}
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
              top: enemy.y - 20,
              filter: enemy.type === 'fast' ? 'hue-rotate(60deg)' : enemy.type === 'tank' ? 'brightness(1.2)' : 'none'
            }}
            animate={{ x: enemy.x, y: enemy.y }}
          >
            <span className="text-2xl">{ENEMY_ICONS[enemy.type]}</span>
            <div className="w-8 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
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

        {/* Projectiles */}
        {state.projectiles.map(proj => (
          <div
            key={proj.id}
            className="absolute rounded-full"
            style={{
              left: proj.x - 4,
              top: proj.y - 4,
              width: 8,
              height: 8,
              backgroundColor: proj.type === 'arrow' ? '#27ae60' : proj.type === 'cannon' ? '#e74c3c' : '#3498db',
              boxShadow: `0 0 10px ${proj.type === 'arrow' ? '#27ae60' : proj.type === 'cannon' ? '#e74c3c' : '#3498db'}`
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
        点击格子放置防御塔 | 点击已有塔出售
      </div>
    </div>
  );
}
