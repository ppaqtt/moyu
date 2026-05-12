import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { MagicTowerEngine, Enemy, MagicBolt, MagicType, GameState } from './engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MANA_MAX } from './engine';

const TOWER_ICONS: Record<MagicType, string> = {
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡'
};

const TOWER_COLORS: Record<MagicType, string> = {
  fire: '#e74c3c',
  ice: '#3498db',
  lightning: '#f1c40f'
};

const TOWER_NAMES: Record<MagicType, string> = {
  fire: '火焰塔',
  ice: '冰霜塔',
  lightning: '雷电塔'
};

const ENEMY_ICONS: Record<string, string> = {
  imp: '👹',
  wraith: '👻',
  golem: '🗿'
};

const GRID_SIZE = 50;

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function MagicTower() {
  const navigate = useNavigate();
  const [engine] = useState(() => new MagicTowerEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<GameState>(() => engine.getState());
  const [selectedTower, setSelectedTower] = useState<MagicType>('fire');
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const { record, updateScore } = useGameRecord('magic_tower');

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

  const GRID_COLS = Math.ceil(CANVAS_WIDTH / GRID_SIZE);
  const GRID_ROWS = Math.ceil(CANVAS_HEIGHT / GRID_SIZE);

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
            魔法塔防
          </h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonBlue }}>Magic Tower Defense</p>
          <div className="text-6xl mb-8">🔮</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.cardBg }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.white }}>
              <li>点击格子放置魔法塔</li>
              <li>使用法力值释放魔法攻击敌人</li>
              <li>法力值会自动回复</li>
              <li>不同魔法有不同效果</li>
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#e74c3c30' }}>
                <span className="text-3xl">🔥</span>
                <span className="text-sm font-bold" style={{ color: '#e74c3c' }}>火焰塔</span>
                <span className="text-xs opacity-70">高伤害</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#3498db30' }}>
                <span className="text-3xl">❄️</span>
                <span className="text-sm font-bold" style={{ color: '#3498db' }}>冰霜塔</span>
                <span className="text-xs opacity-70">减速敌人</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#f1c40f30' }}>
                <span className="text-3xl">⚡</span>
                <span className="text-sm font-bold" style={{ color: '#f1c40f' }}>雷电塔</span>
                <span className="text-xs opacity-70">连锁攻击</span>
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
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>生命</div>
            <div className="text-xl font-bold" style={{ color: '#e74c3c' }}>{state.lives}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      {/* Mana Bar */}
      <div className="w-full max-w-[600px] px-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
            <motion.div
              className="h-full rounded-full transition-all"
              style={{ backgroundColor: '#00d2ff' }}
              animate={{ width: `${(state.mana / MANA_MAX) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold" style={{ color: NEON_COLORS.neonBlue }}>
            {Math.floor(state.mana)}/{MANA_MAX}
          </span>
        </div>
      </div>

      {/* Tower Selection */}
      <div className="flex gap-2">
        {(['fire', 'ice', 'lightning'] as MagicType[]).map(type => (
          <motion.button
            key={type}
            onClick={() => setSelectedTower(type)}
            className="flex flex-col items-center p-2 rounded-lg transition-all"
            style={{
              backgroundColor: selectedTower === type ? `${TOWER_COLORS[type]}40` : NEON_COLORS.darkPurple,
              border: `2px solid ${selectedTower === type ? TOWER_COLORS[type] : 'transparent'}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{TOWER_ICONS[type]}</span>
            <span className="text-xs" style={{ color: TOWER_COLORS[type] }}>{TOWER_NAMES[type]}</span>
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
          background: 'linear-gradient(180deg, #1a0a2e 0%, #16213e 50%, #0f0f23 100%)',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30`,
          border: `2px solid ${NEON_COLORS.neonPurple}40`
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
            const hasTower = state.towers.some(t => {
              const tx = Math.floor(t.x / GRID_SIZE);
              const ty = Math.floor(t.y / GRID_SIZE);
              return tx === col && ty === row;
            });
            
            return (
              <div
                key={i}
                className="border border-white/10 cursor-pointer transition-colors relative"
                style={{
                  backgroundColor: isPath ? '#2d1f4e' : 'rgba(0,0,0,0.3)'
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
                style={{ filter: `drop-shadow(0 0 8px ${TOWER_COLORS[tower.type]})` }}
                animate={tower.isReady ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
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
              filter: enemy.isSlowed ? 'brightness(1.5) hue-rotate(180deg)' : 
                     enemy.isShocked ? `drop-shadow(0 0 5px #f1c40f)` : 'none'
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

        {/* Magic Bolts */}
        {state.bolts.map(bolt => (
          <React.Fragment key={bolt.id}>
            {/* Trail */}
            {bolt.trail.map((point, idx) => (
              <div
                key={`trail-${idx}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: point.x - 3,
                  top: point.y - 3,
                  width: 6,
                  height: 6,
                  backgroundColor: TOWER_COLORS[bolt.type],
                  opacity: idx / bolt.trail.length * 0.5
                }}
              />
            ))}
            {/* Bolt */}
            <motion.div
              className="absolute"
              style={{
                left: bolt.x - 8,
                top: bolt.y - 8,
                width: 16,
                height: 16,
                zIndex: 10
              }}
            >
              <span className="text-xl" style={{ filter: `drop-shadow(0 0 5px ${TOWER_COLORS[bolt.type]})` }}>
                {TOWER_ICONS[bolt.type]}
              </span>
            </motion.div>
          </React.Fragment>
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
        点击格子放置魔法塔 | 法力值会自动恢复
      </div>
    </div>
  );
}
