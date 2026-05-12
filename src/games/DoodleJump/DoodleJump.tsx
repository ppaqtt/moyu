import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { DoodleJumpEngine, DoodleJumpState, Platform, PowerUp } from './engine';

const DoodleJump = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new DoodleJumpEngine());
  const [state, setState] = useState<DoodleJumpState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('doodleJumpHighScore', 0);
  const [gameStarted, setGameStarted] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStarted && !state.isGameOver });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || state.isGameOver) return;
      
      keysPressed.current.add(e.key);
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.moveLeft();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.moveRight();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
          e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.stopHorizontal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, gameStarted, state.isGameOver]);

  const handleStart = () => {
    setGameStarted(true);
  };

  const handleRestart = () => {
    engine.reset();
    setGameStarted(false);
  };

  const handleExit = () => {
    navigate('/');
  };

  const handleTouch = (direction: 'left' | 'right') => {
    if (!gameStarted || state.isGameOver) return;
    if (direction === 'left') {
      engine.moveLeft();
    } else {
      engine.moveRight();
    }
  };

  const handleTouchEnd = () => {
    engine.stopHorizontal();
  };

  const renderPlatform = (platform: Platform, cameraY: number) => {
    const screenY = platform.y + cameraY;
    
    const colors = {
      normal: { bg: '#00ff00', border: '#00aa00' },
      moving: { bg: '#ffff00', border: '#aaaa00' },
      fragile: { bg: '#ff6666', border: '#aa4444' },
      bouncy: { bg: '#ff00ff', border: '#aa00aa' }
    };
    const color = colors[platform.type];

    return (
      <motion.div
        key={platform.id}
        className="absolute rounded-md"
        style={{
          left: platform.x,
          top: screenY,
          width: platform.width,
          height: platform.height,
          backgroundColor: color.bg,
          border: `2px solid ${color.border}`,
          boxShadow: platform.type === 'bouncy' ? `0 0 10px ${color.bg}` : 'none',
          opacity: platform.isDestroyed ? 0 : 1,
        }}
        animate={platform.type === 'moving' ? {
          x: [0, (platform.maxX || 100) - (platform.minX || 0)],
        } : {}}
      />
    );
  };

  const renderPowerUp = (powerUp: PowerUp, cameraY: number) => {
    if (!powerUp.isActive) return null;
    
    const screenY = powerUp.y + cameraY;
    const icons = {
      spring: '🔼',
      rocket: '🚀',
      propeller: '🎯',
      shield: '🛡️'
    };
    const colors = {
      spring: '#ff6600',
      rocket: '#ff0000',
      propeller: '#ffff00',
      shield: '#00ffff'
    };

    return (
      <motion.div
        key={powerUp.id}
        className="absolute flex items-center justify-center text-2xl rounded-full"
        style={{
          left: powerUp.x,
          top: screenY,
          width: powerUp.width,
          height: powerUp.height,
          backgroundColor: colors[powerUp.type],
          boxShadow: `0 0 15px ${colors[powerUp.type]}`,
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        {icons[powerUp.type]}
      </motion.div>
    );
  };

  const renderPlayer = () => {
    const { player, isPoweredUp, powerUpType } = state;
    
    let accessory = null;
    if (isPoweredUp) {
      const accessories = {
        spring: '🔼',
        rocket: '🚀',
        propeller: '🪁',
        shield: '🛡️'
      };
      accessory = accessories[powerUpType as keyof typeof accessories];
    }

    return (
      <motion.div
        className="absolute"
        style={{
          left: player.x,
          top: player.y,
          width: player.width,
          height: player.height,
        }}
        animate={{
          scaleX: player.direction === 'left' ? -1 : 1,
        }}
      >
        {/* Body */}
        <div 
          className="absolute rounded-xl"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#44aa44',
            border: '3px solid #228822',
            boxShadow: isPoweredUp ? `0 0 20px ${powerUpType === 'rocket' ? '#ff0000' : powerUpType === 'propeller' ? '#ffff00' : '#00ffff'}` : 'none',
          }}
        >
          {/* Eyes */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white" />
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white" />
          <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-black" />
          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-black" />
          
          {/* Smile */}
          <div 
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 border-b-4 border-black rounded-full"
            style={{ borderRadius: '0 0 50% 50%' }}
          />
        </div>
        
        {/* Accessory */}
        {accessory && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">
            {accessory}
          </div>
        )}
        
        {/* Shield glow */}
        {isPoweredUp && powerUpType === 'shield' && (
          <div 
            className="absolute rounded-full"
            style={{
              top: -5,
              left: -5,
              right: -5,
              bottom: -5,
              border: '3px solid #00ffff',
              boxShadow: '0 0 15px #00ffff',
            }}
          />
        )}
      </motion.div>
    );
  };

  const { width, height } = engine.getCanvasSize();

  // Start menu
  if (!gameStarted) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center gap-8 p-8 rounded-2xl"
        style={{ backgroundColor: NEON_COLORS.surface }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.success }}>
          涂鸦跳跃
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Doodle Jump
        </p>
        
        <div className="text-center">
          <div className="text-2xl mb-2" style={{ color: NEON_COLORS.accent }}>
            最高分: {highScore}
          </div>
        </div>

        <motion.button
          onClick={handleStart}
          className="px-12 py-4 rounded-xl text-2xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.success,
            color: NEON_COLORS.text,
            boxShadow: `0 0 20px ${NEON_COLORS.success}`,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          开始游戏
        </motion.button>

        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>使用方向键或A/D键左右移动</p>
          <p>踩在平台上跳跃</p>
          <p>收集道具获得特殊能力</p>
        </div>

        <motion.button
          onClick={handleExit}
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
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-[320px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-3 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.surface,
            color: NEON_COLORS.text,
            border: `1px solid ${NEON_COLORS.primary}`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          退出
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>{highScore}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div
        className="relative rounded-xl overflow-hidden select-none"
        style={{
          width,
          height,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: `0 0 30px ${NEON_COLORS.success}30`,
          border: `2px solid ${NEON_COLORS.success}40`,
        }}
      >
        {/* Stars background */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                backgroundColor: '#ffffff',
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
        </div>

        {/* Platforms */}
        {state.platforms.map(p => renderPlatform(p, state.cameraY))}

        {/* Power-ups */}
        {state.powerUps.map(p => renderPowerUp(p, state.cameraY))}

        {/* Player */}
        {renderPlayer()}

        {/* Game Over overlay */}
        {state.isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
              游戏结束
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.accent }}>
              分数: {state.score}
            </div>
            {state.score > highScore && (
              <div className="text-xl mb-4" style={{ color: NEON_COLORS.success }}>
                新纪录!
              </div>
            )}
            <motion.button
              onClick={() => {
                if (state.score > highScore) {
                  setHighScore(state.score);
                }
                handleRestart();
              }}
              className="px-8 py-4 rounded-lg font-bold text-xl"
              style={{
                backgroundColor: NEON_COLORS.success,
                color: NEON_COLORS.text,
                boxShadow: `0 0 20px ${NEON_COLORS.success}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再玩一次
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Touch controls */}
      <div className="flex gap-8 mt-4">
        <motion.button
          onTouchStart={() => handleTouch('left')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleTouch('left')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.surface,
            border: `2px solid ${NEON_COLORS.primary}`,
            color: NEON_COLORS.primary,
          }}
          whileTap={{ scale: 0.9 }}
        >
          ◀
        </motion.button>
        <motion.button
          onTouchStart={() => handleTouch('right')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleTouch('right')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.surface,
            border: `2px solid ${NEON_COLORS.primary}`,
            color: NEON_COLORS.primary,
          }}
          whileTap={{ scale: 0.9 }}
        >
          ▶
        </motion.button>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
        <div>方向键或A/D键移动 | 触碰按钮左右移动</div>
        <div>跳跃越高分数越多</div>
      </div>
    </div>
  );
};

export default DoodleJump;
