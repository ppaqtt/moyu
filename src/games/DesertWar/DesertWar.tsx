import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { DesertWarEngine, Tower, Enemy, Projectile, TowerType, GameState } from './engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './engine';

const TOWER_ICONS: Record<TowerType, string> = {
  camel: '🐪',
  sniper: '🎯',
  sandstorm: '🌀'
};

const TOWER_COLORS: Record<TowerType, string> = {
  camel: '#d4a574',
  sniper: '#8b4513',
  sandstorm: '#daa520'
};

const TOWER_NAMES: Record<TowerType, string> = {
  camel: '骆驼塔',
  sniper: '狙击塔',
  sandstorm: '沙暴塔'
};

const ENEMY_ICONS: Record<string, string> = {
  worm: '🐛',
  scorpion: '🦂',
  spider: '🕷'
};

const ENEMY_COLORS: Record<string, string> = {
  worm: '#8b4513',
  scorpion: '#daa520',
  spider: '#4a4a4a'
};

const GRID_SIZE = 45;
const GRID_COLS = Math.ceil(CANVAS_WIDTH / GRID_SIZE);
const GRID_ROWS = Math.ceil(CANVAS_HEIGHT / GRID_SIZE);

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function DesertWar() {
  const navigate = useNavigate();
  const [engine] = useState(() => new DesertWarEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<GameState>(() => engine.getState());
  const [selectedTower, setSelectedTower] = useState<TowerType>('camel');
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const { record, updateScore } = useGameRecord('desert_war');

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
    camel: 50,
    sniper: 120,
    sandstorm: 80
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
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#daa520' }}>
            沙漠战争
          </h1>
          <p className="text-xl mb-2" style={{ color: '#d4a574' }}>Desert War</p>
          <div className="text-6xl mb-8">🏜️</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.cardBg }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.white }}>
              <li>点击格子放置防御塔</li>
              <li>消灭沙漠中的怪物入侵</li>
              <li>沙虫会钻地躲避攻击</li>
              <li>沙暴塔可以攻击钻地的敌人</li>
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#d4a57430' }}>
                <span className="text-3xl">🐪</span>
                <span className="text-sm font-bold" style={{ color: '#d4a574' }}>骆驼塔</span>
                <span className="text-xs opacity-70">快速攻击</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#8b451330' }}>
                <span className="text-3xl">🎯</span>
                <span className="text-sm font-bold" style={{ color: '#8b4513' }}>狙击塔</span>
                <span className="text-xs opacity-70">高伤害</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: '#daa52030' }}>
                <span className="text-3xl">🌀</span>
                <span className="text-sm font-bold" style={{ color: '#daa520' }}>沙暴塔</span>
                <span className="text-xs opacity-70">穿透攻击</span>
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
              backgroundColor: '#daa520',
              color: '#1a1a2e',
              boxShadow: `0 0 30px #daa52060`
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
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#daa520' }}>
            游戏结束
          </h2>
          <div className="text-6xl mb-4">💀</div>
          
          <div className="space-y-3 mb-8">
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>
              最终得分: <span className="text-3xl font-bold" style={{ color: '#daa520' }}>{state.score}</span>
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
                backgroundColor: '#daa520',
                color: '#1a1a2e',
                boxShadow: `0 0 20px #daa520`
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
            <div className="text-xl font-bold" style={{ color: '#daa520' }}>{state.wave}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-xl font-bold" style={{ color: '#daa520' }}>{state.score}</div>
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
        {(['camel', 'sniper', 'sandstorm'] as TowerType[]).map(type => (
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
          background: 'linear-gradient(135deg, #c2b280 0%, #d4a574 50%, #8b7355 100%)',
          boxShadow: `0 0 30px #daa52030`,
          border: `2px solid #daa52040`
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
                className="border border-black/10 cursor-pointer transition-colors relative"
                style={{
                  backgroundColor: isPath ? '#8b7355' : hasTower ? 'transparent' : 'rgba(139, 115, 85, 0.5)'
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
                animate={tower.charge > tower.maxCharge * 0.8 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, repeat: Infinity }}
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
              filter: enemy.isBurrowed ? 'grayscale(1) opacity(0.5)' : 'none',
              opacity: enemy.isBurrowed ? 0.5 : 1
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

        {/* Projectiles */}
        {state.projectiles.map(proj => (
          <motion.div
            key={proj.id}
            className="absolute rounded-full"
            style={{
              left: proj.x - 5,
              top: proj.y - 5,
              width: 10,
              height: 10,
              backgroundColor: TOWER_COLORS[proj.type],
              boxShadow: `0 0 10px ${TOWER_COLORS[proj.type]}`
            }}
          />
        ))}

        {/* Wave indicator */}
        <AnimatePresence>
          {state.isWaveActive && (
            <motion.div
              className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: '#daa520',
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
        <div className="absolute bottom-2 right-2 flex gap-2 text-xs" style={{ color: '#1a1a2e' }}>
          <span>🐛 沙虫(钻地)</span>
          <span>🦂 蝎子</span>
          <span>🕷 蜘蛛</span>
        </div>
      </div>

      <div className="text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
        点击格子放置防御塔 | 沙暴塔可以攻击钻地的敌人
      </div>
    </div>
  );
}
