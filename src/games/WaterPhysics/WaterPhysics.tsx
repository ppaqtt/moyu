import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { WaterPhysicsEngine, WaterPhysicsState, WaterParticle } from './engine';

const WaterPhysics = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new WaterPhysicsEngine());
  const [state, setState] = useState<WaterPhysicsState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('waterPhysicsHighScore', 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPouring, setIsPouring] = useState(false);
  const [pourX, setPourX] = useState(200);
  const canvasRef = useRef<HTMLDivElement>(null);

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStarted });

  useEffect(() => {
    if (isPouring) {
      engine.startPouring();
    } else {
      engine.stopPouring();
    }
  }, [isPouring]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    setPourX(x);
    engine.setPourPosition(x);
  };

  const handleMouseDown = () => {
    setIsPouring(true);
  };

  const handleMouseUp = () => {
    setIsPouring(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    setPourX(x);
    engine.setPourPosition(x);
    setIsPouring(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    setPourX(x);
    engine.setPourPosition(x);
  };

  const handleTouchEnd = () => {
    setIsPouring(false);
  };

  const handleToggleDrain = () => {
    engine.toggleDrain();
  };

  const handleStart = () => {
    engine.reset();
    setGameStarted(true);
  };

  const handleRestart = () => {
    engine.reset();
    updateState();
  };

  const handleBackToMenu = () => {
    setGameStarted(false);
    if (state.score > highScore) {
      setHighScore(state.score);
    }
  };

  const renderParticles = () => {
    return state.particles.map((particle, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute rounded-full"
        style={{
          left: particle.x - 3,
          top: particle.y - 3,
          width: 6,
          height: 6,
          backgroundColor: 'rgba(0, 150, 255, 0.8)',
          boxShadow: '0 0 8px rgba(0, 150, 255, 0.5)',
        }}
      />
    ));
  };

  const renderSurface = () => {
    const { surface } = state;
    const containerLeft = (400 - state.containerWidth) / 2;
    
    const pathPoints = surface.points.map((y, i) => {
      const x = containerLeft + (i / surface.points.length) * state.containerWidth;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 150, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(0, 100, 200, 0.8)" />
          </linearGradient>
        </defs>
        <path
          d={pathPoints + ` L ${containerLeft + state.containerWidth} ${state.containerHeight + 150} L ${containerLeft} ${state.containerHeight + 150} Z`}
          fill="url(#waterGradient)"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(0, 150, 255, 0.5))',
          }}
        />
      </svg>
    );
  };

  const renderContainer = () => {
    const containerLeft = (400 - state.containerWidth) / 2;
    const containerTop = 400 - state.containerHeight - 50;
    
    return (
      <div
        className="absolute"
        style={{
          left: containerLeft,
          top: containerTop,
          width: state.containerWidth,
          height: state.containerHeight,
          border: '4px solid #4a90d9',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          boxShadow: 'inset 0 0 30px rgba(0, 100, 200, 0.3), 0 0 20px rgba(0, 150, 255, 0.3)',
        }}
      />
    );
  };

  const renderDrain = () => {
    const containerLeft = (400 - state.containerWidth) / 2;
    const drainX = containerLeft + 50;
    const drainY = 400 + state.containerHeight - 30;
    
    return (
      <div
        className="absolute cursor-pointer"
        style={{
          left: drainX - 20,
          top: drainY,
          width: 40,
          height: 30,
          backgroundColor: '#4a90d9',
          borderRadius: '0 0 20px 20px',
          boxShadow: state.drainOpen 
            ? '0 0 20px rgba(0, 255, 0, 0.8)' 
            : '0 0 10px rgba(0, 150, 255, 0.5)',
        }}
        onClick={handleToggleDrain}
      >
        <div
          className="absolute inset-x-2 top-2 rounded-full"
          style={{
            height: 4,
            backgroundColor: state.drainOpen ? '#00ff00' : '#ff6600',
            boxShadow: `0 0 10px ${state.drainOpen ? '#00ff00' : '#ff6600'}`,
          }}
        />
      </div>
    );
  };

  const renderPourStream = () => {
    if (!isPouring) return null;
    
    return (
      <div className="absolute pointer-events-none">
        <motion.div
          className="w-4 h-32 rounded-full"
          style={{
            backgroundColor: 'rgba(0, 150, 255, 0.6)',
            boxShadow: '0 0 20px rgba(0, 150, 255, 0.8)',
            left: pourX - 8,
            filter: 'blur(2px)',
          }}
          animate={{ height: [120, 140, 120] }}
          transition={{ repeat: Infinity, duration: 0.3 }}
        />
        <motion.div
          className="absolute w-6 h-6 rounded-full"
          style={{
            backgroundColor: 'rgba(100, 180, 255, 0.8)',
            boxShadow: '0 0 15px rgba(0, 150, 255, 0.6)',
            left: pourX - 12,
            top: 128,
          }}
          animate={{ top: [128, 140, 128] }}
          transition={{ repeat: Infinity, duration: 0.2 }}
        />
      </div>
    );
  };

  const renderFaucet = () => {
    return (
      <div className="absolute" style={{ left: pourX - 30, top: 0 }}>
        <div
          className="w-16 h-8 rounded-t-lg"
          style={{
            backgroundColor: '#666',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        />
        <div
          className="w-8 h-16 mx-auto rounded-b-lg"
          style={{
            backgroundColor: '#555',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        />
        <div
          className="w-12 h-4 mx-auto rounded-full"
          style={{
            backgroundColor: isPouring ? '#00aaff' : '#666',
            marginTop: -4,
            boxShadow: isPouring ? '0 0 20px rgba(0, 170, 255, 0.8)' : 'none',
          }}
        />
      </div>
    );
  };

  const renderProgressBar = () => {
    const progress = Math.min(1, state.collected / state.target);
    const containerLeft = (400 - state.containerWidth) / 2;
    
    return (
      <div className="absolute" style={{ left: containerLeft + 100, bottom: 15, width: 100 }}>
        <div className="text-xs text-center mb-1" style={{ color: NEON_COLORS.text }}>
          {state.collected}/{state.target}
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: NEON_COLORS.success,
              boxShadow: `0 0 10px ${NEON_COLORS.success}`,
              width: `${progress * 100}%`,
            }}
          />
        </div>
      </div>
    );
  };

  const renderMenu = () => {
    return (
      <motion.div
        className="flex flex-col items-center justify-center gap-8 p-8 rounded-2xl"
        style={{ backgroundColor: NEON_COLORS.surface }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.warning }}>
          水物理
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Water Physics
        </p>
        
        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>点击/拖动倒水</p>
          <p>点击底部开关排水</p>
          <p>收集水滴得分!</p>
        </div>

        {highScore > 0 && (
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>最高分</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>{highScore}</div>
          </div>
        )}

        <motion.button
          onClick={handleStart}
          className="px-8 py-4 rounded-xl font-bold text-xl"
          style={{
            backgroundColor: NEON_COLORS.neonCyan,
            color: NEON_COLORS.text,
            boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}60`,
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}` }}
          whileTap={{ scale: 0.95 }}
        >
          开始游戏
        </motion.button>

        <motion.button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-bold"
          style={{
            backgroundColor: NEON_COLORS.danger,
            color: NEON_COLORS.text,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主菜单
        </motion.button>
      </motion.div>
    );
  };

  const renderGame = () => {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full max-w-[420px] px-4">
          <motion.button
            onClick={handleBackToMenu}
            className="px-3 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.surface,
              color: NEON_COLORS.text,
              border: `1px solid ${NEON_COLORS.neonCyan}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.score}</div>
            </div>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden select-none"
          style={{
            width: 400,
            height: 600,
            background: 'linear-gradient(180deg, #0a1628 0%, #1a2a48 50%, #2a3a58 100%)',
            boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}30`,
            border: `2px solid ${NEON_COLORS.neonCyan}40`,
            touchAction: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(100, 150, 255, 0.1) 0%, transparent 50%)',
            }}
          />

          {renderFaucet()}
          {renderPourStream()}
          {renderContainer()}
          {renderSurface()}
          {renderParticles()}
          {renderDrain()}
          {renderProgressBar()}
        </div>

        <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
          <div>点击上方倒水 | 点击开关排水</div>
        </div>

        <motion.button
          onClick={handleRestart}
          className="px-6 py-3 rounded-lg font-bold"
          style={{
            backgroundColor: NEON_COLORS.warning,
            color: NEON_COLORS.text,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重置
        </motion.button>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {!gameStarted ? renderMenu() : renderGame()}
    </div>
  );
};

export default WaterPhysics;
