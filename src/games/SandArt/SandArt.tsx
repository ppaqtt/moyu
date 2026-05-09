import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { SandArtEngine, SAND_COLORS, BACKGROUNDS } from './engine';

interface SandArtProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function SandArt({ onScoreUpdate, onGameOver, onExit }: SandArtProps) {
  const [engine] = useState(() => new SandArtEngine());
  const [state, setState] = useState(() => engine.getState());
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS.SAND_ART || 'sandart_highscore');

  useEffect(() => {
    engine.setCanvasSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [engine]);

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  const animate = useCallback(() => {
    engine.update();
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        engine.draw(ctx);
      }
    }
    
    updateState();
    animationRef.current = requestAnimationFrame(animate);
  }, [engine, updateState]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  useEffect(() => {
    setIsPlaying(true);
  }, []);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (point) {
      engine.startPouring(point.x, point.y);
      updateState();
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (point) {
      engine.updatePourPosition(point.x, point.y);
    }
  };

  const handleMouseUp = () => {
    engine.stopPouring();
    updateState();
  };

  const handleColorChange = (color: string) => {
    engine.setColor(color);
    updateState();
  };

  const handlePourRateChange = (rate: number) => {
    engine.setPourRate(rate);
    updateState();
  };

  const handleParticleSizeChange = (size: number) => {
    engine.setParticleSize(size);
    updateState();
  };

  const handleGravityChange = (gravity: number) => {
    engine.setGravity(gravity);
    updateState();
  };

  const handleWindChange = (wind: number) => {
    engine.setWind(wind);
    updateState();
  };

  const handleBgChange = (bg: string) => {
    engine.setBackground(bg);
    updateState();
  };

  const handleClear = () => {
    engine.clear();
    updateState();
  };

  const handleReset = () => {
    engine.reset();
    updateState();
  };

  const handleSave = () => {
    const dataUrl = engine.saveArt();
    const link = document.createElement('a');
    link.download = `sandart_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    const score = state.totalParticles;
    onScoreUpdate(score);
    updateScore(score);
  };

  const settledCount = engine.getSettledCount();
  const activeCount = state.totalParticles - settledCount;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-sm"
          style={{
            backgroundColor: `${NEON_COLORS.darkPurple}80`,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`,
            border: `1px solid ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>总沙粒</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.totalParticles}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>已沉淀</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{settledCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>流动中</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{activeCount}</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>作品数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.gamesPlayed || 0}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl backdrop-blur-sm"
        style={{
          backgroundColor: `${NEON_COLORS.surface}80`,
          border: `1px solid ${NEON_COLORS.neonBlue}30`
        }}
      >
        <span className="text-sm mr-2" style={{ color: NEON_COLORS.textDim }}>沙色:</span>
        {SAND_COLORS.map((sand) => (
          <motion.button
            key={sand.name}
            onClick={() => handleColorChange(sand.color)}
            className="w-10 h-10 rounded-lg border-2 flex items-center justify-center"
            style={{
              background: sand.color === 'rainbow' 
                ? 'linear-gradient(45deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)'
                : sand.color,
              borderColor: state.selectedColor === sand.color ? NEON_COLORS.white : 'transparent',
              boxShadow: state.selectedColor === sand.color ? `0 0 10px ${sand.color === 'rainbow' ? '#FFD700' : sand.color}` : 'none'
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            title={sand.name}
          >
            {state.selectedColor === sand.color && (
              <span className="text-xs font-bold drop-shadow-md">✓</span>
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl backdrop-blur-sm"
        style={{
          backgroundColor: `${NEON_COLORS.surface}60`,
          border: `1px solid ${NEON_COLORS.neonPurple}30`
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>流速:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={state.pourRate}
            onChange={(e) => handlePourRateChange(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-6" style={{ color: NEON_COLORS.neonCyan }}>{state.pourRate}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>大小:</span>
          <input
            type="range"
            min="1"
            max="8"
            value={state.particleSize}
            onChange={(e) => handleParticleSizeChange(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-6" style={{ color: NEON_COLORS.neonCyan }}>{state.particleSize}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>重力:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={state.gravity * 10}
            onChange={(e) => handleGravityChange(Number(e.target.value) / 10)}
            className="w-24"
          />
          <span className="text-sm w-8" style={{ color: NEON_COLORS.neonCyan }}>{state.gravity.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>风力:</span>
          <input
            type="range"
            min="-10"
            max="10"
            value={state.wind}
            onChange={(e) => handleWindChange(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-6" style={{ color: NEON_COLORS.neonCyan }}>{state.wind}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>背景:</span>
          <select
            value={engine.getBackgroundColor()}
            onChange={(e) => handleBgChange(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: `${NEON_COLORS.darkPurple}60`,
              color: NEON_COLORS.white,
              border: `1px solid ${NEON_COLORS.neonBlue}40`
            }}
          >
            {BACKGROUNDS.map(bg => (
              <option key={bg.color} value={bg.color}>{bg.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `3px solid ${NEON_COLORS.neonPink}50`,
          cursor: state.isPouring ? 'crosshair' : 'default'
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
        
        {state.isPouring && (
          <motion.div
            className="absolute w-4 h-4 rounded-full pointer-events-none"
            style={{
              backgroundColor: state.selectedColor === 'rainbow' ? '#FFD700' : state.selectedColor,
              boxShadow: `0 0 10px ${state.selectedColor === 'rainbow' ? '#FFD700' : state.selectedColor}`,
              left: '50%',
              top: '20px'
            }}
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={handleClear}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.warning}40`,
            color: NEON_COLORS.warning,
            border: `2px solid ${NEON_COLORS.warning}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🧹 清空画布
        </motion.button>
        <motion.button
          onClick={handleReset}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.danger}40`,
            color: NEON_COLORS.danger,
            border: `2px solid ${NEON_COLORS.danger}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 重置所有
        </motion.button>
        <motion.button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          style={{
            backgroundColor: NEON_COLORS.neonGreen,
            color: NEON_COLORS.white,
            boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💾 保存作品
        </motion.button>
      </div>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        按住鼠标/手指在画布上挥洒沙粒，创造独特的沙画艺术
      </div>
    </div>
  );
}
