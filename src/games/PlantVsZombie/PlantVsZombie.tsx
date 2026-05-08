import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GamePvZEngine, Plant, Zombie, Projectile, PlantType } from './engine';

interface PlantVsZombieProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const GRID_COLS = 9;
const GRID_ROWS = 5;
const CELL_WIDTH = 80;
const CELL_HEIGHT = 100;
const CANVAS_WIDTH = GRID_COLS * CELL_WIDTH;
const CANVAS_HEIGHT = GRID_ROWS * CELL_HEIGHT;

const PLANT_ICONS: Record<string, string> = {
  pea: '🌱',
  sunflower: '🌻',
  wallnut: '🥜',
  snowpea: '❄️'
};

const PLANT_COLORS: Record<string, string> = {
  pea: '#27ae60',
  sunflower: '#f1c40f',
  wallnut: '#8B4513',
  snowpea: '#3498db'
};

const PLANT_PRICES = {
  pea: 100,
  sunflower: 50,
  wallnut: 50,
  snowpea: 175
};

export default function PlantVsZombie({ onScoreUpdate, onGameOver, onExit }: PlantVsZombieProps) {
  const [engine] = useState(() => new GamePvZEngine());
  const [plants, setPlants] = useState<Plant[]>(() => engine.getState().plants);
  const [zombies, setZombies] = useState<Zombie[]>(() => engine.getState().zombies);
  const [projectiles, setProjectiles] = useState<Projectile[]>(() => engine.getState().projectiles);
  const [sun, setSun] = useState(() => engine.getState().sun);
  const [score, setScore] = useState(() => engine.getState().score);
  const [wave, setWave] = useState(() => engine.getState().wave);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<PlantType>('pea');
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.PVZ);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlants([...state.plants]);
    setZombies([...state.zombies]);
    setProjectiles([...state.projectiles]);
    setSun(state.sun);
    setScore(state.score);
    setWave(state.wave);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: !isGameOver });

  const handlePlantClick = useCallback((col: number, row: number) => {
    if (engine.placePlant(col, row)) {
      const state = engine.getState();
      setPlants([...state.plants]);
      setSun(state.sun);
    }
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setPlants([...state.plants]);
    setZombies([...state.zombies]);
    setProjectiles([...state.projectiles]);
    setSun(state.sun);
    setScore(state.score);
    setWave(state.wave);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const renderPlant = (plant: Plant) => {
    return (
      <motion.div
        key={plant.id}
        className="absolute flex flex-col items-center justify-center"
        style={{
          left: plant.x * CELL_WIDTH,
          top: plant.y * CELL_HEIGHT,
          width: CELL_WIDTH,
          height: CELL_HEIGHT
        }}
      >
        <div
          className="text-4xl"
          style={{
            filter: `drop-shadow(0 0 5px ${PLANT_COLORS[plant.type]})`
          }}
        >
          {PLANT_ICONS[plant.type]}
        </div>
        <div
          className="absolute bottom-2 w-16 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#333' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(plant.health / 100) * 100}%`,
              backgroundColor: plant.health > 50 ? '#27ae60' : plant.health > 25 ? '#f39c12' : '#e74c3c'
            }}
          />
        </div>
      </motion.div>
    );
  };

  const renderZombie = (zombie: Zombie) => {
    return (
      <motion.div
        key={zombie.id}
        className="absolute flex items-center"
        style={{
          left: zombie.x,
          top: zombie.y * CELL_HEIGHT,
          height: CELL_HEIGHT,
          filter: zombie.isSlow ? 'hue-rotate(180deg)' : 'none'
        }}
        animate={{ x: zombie.x }}
        transition={{ type: 'tween', ease: 'linear' }}
      >
        <div
          className="text-5xl"
          style={{
            filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))'
          }}
        >
          🧟
        </div>
        <div
          className="absolute bottom-2 w-12 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#333' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(zombie.health / (zombie.type === 'bucket' ? 400 : zombie.type === 'cone' ? 200 : 100)) * 100}%`,
              backgroundColor: zombie.health > 50 ? '#27ae60' : zombie.health > 25 ? '#f39c12' : '#e74c3c'
            }}
          />
        </div>
      </motion.div>
    );
  };

  const renderProjectile = (proj: Projectile) => {
    return (
      <motion.div
        key={`proj-${proj.x}-${proj.y}`}
        className="absolute rounded-full"
        style={{
          left: proj.x,
          top: proj.y - 8,
          width: 16,
          height: 16,
          backgroundColor: proj.isSlow ? '#3498db' : '#27ae60',
          boxShadow: `0 0 10px ${proj.isSlow ? '#3498db' : '#27ae60'}`
        }}
        animate={{ x: proj.x }}
        transition={{ type: 'tween', ease: 'linear' }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[750px] px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex items-center gap-2">
          <span className="text-3xl">☀️</span>
          <span className="text-2xl font-bold" style={{ color: '#f1c40f' }}>{sun}</span>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>波数</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{wave}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['pea', 'sunflower', 'wallnut', 'snowpea'] as PlantType[]).map((type) => (
          <motion.button
            key={type}
            onClick={() => {
              setSelectedPlant(type);
              engine.selectPlant(type);
            }}
            className="flex flex-col items-center p-2 rounded-lg transition-all"
            style={{
              backgroundColor: selectedPlant === type ? `${PLANT_COLORS[type]}60` : NEON_COLORS.darkPurple,
              border: `2px solid ${selectedPlant === type ? PLANT_COLORS[type] : 'transparent'}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{PLANT_ICONS[type]}</span>
            <span className="text-xs" style={{ color: '#f1c40f' }}>{PLANT_PRICES[type]}</span>
          </motion.button>
        ))}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #2c3e50 100%)',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div className="absolute inset-0 grid" style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_WIDTH}px)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_HEIGHT}px)`
        }}>
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            return (
              <div
                key={i}
                className="border border-white/10 cursor-pointer transition-colors hover:bg-white/10"
                onClick={() => handlePlantClick(col, row)}
              />
            );
          })}
        </div>

        {plants.map(renderPlant)}
        {zombies.map(renderZombie)}
        {projectiles.map(renderProjectile)}

        <div className="absolute top-0 left-0 bottom-0 w-8 bg-gray-800/50" />

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              🧟 僵尸吃掉了你的脑子!
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              最终得分: {score}
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              到达波数: {wave}
            </div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
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
                onClick={onExit}
                className="px-6 py-3 rounded-lg font-bold"
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
        )}
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>点击格子放置植物</div>
        <div>用植物阻止僵尸前进!</div>
      </div>
    </div>
  );
}
