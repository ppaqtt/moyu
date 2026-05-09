import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { HAPPY_FARM_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { HappyFarmEngine, CropType, Cell, CROP_CONFIG } from './engine';

const GRID_COLS = 8;
const GRID_ROWS = 7;
const CELL_SIZE = 60;

const CROP_ICONS: Record<CropType, string> = {
  wheat: '🌾',
  carrot: '🥕',
  tomato: '🍅',
  corn: '🌽'
};

const STAGE_TEXT: Record<string, string> = {
  empty: '',
  seed: '🌱',
  sprout: '🌿',
  mature: '✨'
};

export default function HappyFarm() {
  const navigate = useNavigate();
  const [engine] = useState(() => new HappyFarmEngine());
  const [grid, setGrid] = useState<Cell[][]>(() => engine.getState().grid);
  const [gold, setGold] = useState(() => engine.getState().gold);
  const [seeds, setSeeds] = useState(() => engine.getState().seeds);
  const [harvestCount, setHarvestCount] = useState(() => engine.getState().harvestCount);
  const [selectedCrop, setSelectedCrop] = useState<CropType>('wheat');
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.HAPPY_FARM, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const handleScoreUpdate = useCallback((newScore: number) => {
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;

        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? '#2d5a3d' : '#245232';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = '#1a3d24';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        const cell = grid[row]?.[col];
        if (cell && cell.crop) {
          const cropConfig = CROP_CONFIG[cell.crop];
          const centerX = x + CELL_SIZE / 2;
          const centerY = y + CELL_SIZE / 2;

          ctx.font = '28px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cropConfig.icon, centerX, centerY - 5);

          if (cell.stage === 'seed' || cell.stage === 'sprout') {
            const progress = cell.isWatered ? 1 : 0;
            const barWidth = 40;
            const barHeight = 6;
            const barX = centerX - barWidth / 2;
            const barY = centerY + 18;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const growTime = cropConfig.growTime * (cell.isWatered ? 0.5 : 1);
            const elapsed = Date.now() - cell.plantedAt;
            const progressRatio = Math.min(elapsed / growTime, 1);

            const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * progressRatio, barY);
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(1, '#22c55e');
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, barY, barWidth * progressRatio, barHeight);
          }

          if (cell.stage === 'mature') {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('✓', centerX + 18, centerY - 18);
          }

          if (cell.isWatered && cell.stage !== 'mature') {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#60a5fa';
            ctx.fillText('💧', centerX - 18, centerY - 18);
          }
        }
      }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, 50);
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 ${gold}`, 20, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`收获: ${harvestCount}`, 150, 32);

    ctx.fillStyle = '#a3e635';
    ctx.textAlign = 'right';
    ctx.fillText(`最高分: ${highScore}`, canvas.width - 20, 32);
  }, [grid, gold, harvestCount, highScore]);

  const gameLoop = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setGrid([...state.grid.map(row => [...row])]);
    setGold(state.gold);
    setSeeds({ ...state.seeds });
    setHarvestCount(state.harvestCount);

    if (state.gold > highScore) {
      setHighScore(state.gold);
    }

    draw();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [engine, highScore, setHighScore, draw]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;

    const cell = grid[row]?.[col];
    if (!cell) return;

    if (cell.stage === 'mature') {
      engine.harvest(col, row);
    } else if (cell.stage === 'empty') {
      engine.plant(col, row);
    } else {
      engine.water(col, row);
    }
  }, [engine, grid]);

  const handleCropSelect = useCallback((type: CropType) => {
    setSelectedCrop(type);
    engine.selectCrop(type);
  }, [engine]);

  const handleBuySeeds = useCallback((type: CropType) => {
    engine.buySeeds(type, 1);
    const state = engine.getState();
    setGold(state.gold);
    setSeeds({ ...state.seeds });
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setGrid([...state.grid.map(row => [...row])]);
    setGold(state.gold);
    setSeeds({ ...state.seeds });
    setHarvestCount(state.harvestCount);
  }, [engine]);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 min-h-screen">
      <div className="text-center">
        <motion.h1
          className="text-4xl font-bold mb-2"
          style={{ color: NEON_COLORS.neonGreen }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          🌾 开心农场 🌾
        </motion.h1>
        <p className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>
          点击空格子种植，点击成熟作物收获，点击浇水加速生长
        </p>
      </div>

      <div className="flex items-center justify-between w-full max-w-[800px] gap-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm glass-card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>

        <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-lg">
          <span className="text-2xl">💰</span>
          <span className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>
            {gold}
          </span>
        </div>

        <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-lg">
          <span className="text-2xl">🌾</span>
          <span className="text-lg font-bold" style={{ color: NEON_COLORS.neonGreen }}>
            收获: {harvestCount}
          </span>
        </div>

        <div className="glass-card px-4 py-2 rounded-lg">
          <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
            {highScore}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {(['wheat', 'carrot', 'tomato', 'corn'] as CropType[]).map((type) => {
          const config = CROP_CONFIG[type];
          const isSelected = selectedCrop === type;
          const seedCount = seeds[type] || 0;

          return (
            <motion.button
              key={type}
              onClick={() => handleCropSelect(type)}
              className="flex flex-col items-center p-3 rounded-xl transition-all glass-card"
              style={{
                border: isSelected ? `2px solid ${config.color}` : '2px solid transparent',
                boxShadow: isSelected ? `0 0 15px ${config.color}50` : 'none'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-3xl">{config.icon}</span>
              <span className="text-xs font-bold" style={{ color: config.color }}>
                {config.name}
              </span>
              <span className="text-xs opacity-70">种子: {seedCount}</span>
              <span className="text-xs" style={{ color: NEON_COLORS.gold }}>
                {config.seedPrice}💰
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {(['wheat', 'carrot', 'tomato', 'corn'] as CropType[]).map((type) => {
          const config = CROP_CONFIG[type];
          const canBuy = gold >= config.seedPrice;

          return (
            <motion.button
              key={`buy-${type}`}
              onClick={() => handleBuySeeds(type)}
              className="px-3 py-1 rounded-lg text-sm font-bold glass-card"
              style={{
                opacity: canBuy ? 1 : 0.5,
                color: canBuy ? config.color : '#666'
              }}
              whileHover={canBuy ? { scale: 1.05 } : {}}
              whileTap={canBuy ? { scale: 0.95 } : {}}
              disabled={!canBuy}
            >
              +1 {config.icon}
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <canvas
          ref={canvasRef}
          width={GRID_COLS * CELL_SIZE}
          height={GRID_ROWS * CELL_SIZE}
          onClick={handleCanvasClick}
          className="rounded-2xl cursor-pointer"
          style={{
            boxShadow: `0 0 30px ${NEON_COLORS.neonGreen}30`,
            border: `2px solid ${NEON_COLORS.neonGreen}40`
          }}
        />
      </motion.div>

      <div className="flex gap-4 text-center">
        <div className="glass-card px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span>🌱</span>
            <span className="text-sm">种子期</span>
          </div>
        </div>
        <div className="glass-card px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span>🌿</span>
            <span className="text-sm">生长期</span>
          </div>
        </div>
        <div className="glass-card px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span className="text-sm">成熟</span>
          </div>
        </div>
        <div className="glass-card px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span>💧</span>
            <span className="text-sm">浇水加速</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <motion.button
          onClick={handleRestart}
          className="px-6 py-3 rounded-xl font-bold glass-card"
          style={{ color: NEON_COLORS.neonPink }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 重新开始
        </motion.button>
      </div>
    </div>
  );
}
