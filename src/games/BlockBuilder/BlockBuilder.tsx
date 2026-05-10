import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { BlockBuilderEngine, BlockBuilderState, Block3D } from './engine';

const BlockBuilder = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new BlockBuilderEngine());
  const [state, setState] = useState<BlockBuilderState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('blockBuilderHighScore', 0);
  const [gameStarted, setGameStarted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStarted });

  useKeyboard({
    onLeft: () => engine.moveBlock('left'),
    onRight: () => engine.moveBlock('right'),
    onUp: () => engine.moveBlock('forward'),
    onDown: () => engine.moveBlock('back'),
    onSpace: () => engine.drop(),
  });

  useEffect(() => {
    if (gameStarted) {
      updateState();
    }
  }, [gameStarted, updateState]);

  const handleDrop = () => {
    if (state.phase === 'building') {
      engine.drop();
    }
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

  const project3D = (block: Block3D) => {
    const angleRad = (state.cameraAngle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    
    const centerX = block.x + block.width / 2;
    const centerZ = block.z + block.depth / 2;
    
    const projX = centerX + sin * block.depth * 0.3;
    const projZ = centerZ * cos;
    
    const scale = 1 - (block.y / 1000) + 0.5;
    const screenX = state.cameraAngle > 0 
      ? projX + sin * 30
      : CANVAS_WIDTH - projX + sin * 30;
    
    return {
      x: screenX - block.width / 2 * scale,
      y: block.y - block.height / 2,
      width: block.width * scale,
      height: block.height,
      depth: block.depth * scale,
      scale
    };
  };

  const renderBlock = (block: Block3D, index: number) => {
    const proj = project3D(block);
    const baseColor = block.color;
    const isTop = index === state.blocks.length - 1;
    
    const darken = (color: string, amount: number) => {
      const hex = color.replace('#', '');
      const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount);
      const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amount);
      const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amount);
      return `rgb(${r}, ${g}, ${b})`;
    };
    
    return (
      <div key={`block-${index}`}>
        <motion.div
          className="absolute"
          style={{
            left: proj.x,
            top: proj.y - proj.depth * 0.3,
            width: proj.width,
            height: proj.height,
            backgroundColor: darken(baseColor, 30),
            borderRadius: 4,
            transform: `perspective(500px) rotateX(-10deg)`,
            boxShadow: `0 ${proj.depth * 0.3}px ${proj.depth * 0.5}px rgba(0,0,0,0.3)`,
            zIndex: index,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
        <div
          className="absolute"
          style={{
            left: proj.x,
            top: proj.y,
            width: proj.width,
            height: proj.depth,
            backgroundColor: baseColor,
            borderRadius: 4,
            transform: `perspective(500px) rotateX(60deg)`,
            transformOrigin: 'top center',
            boxShadow: `inset 0 -5px 10px rgba(0,0,0,0.2)`,
            zIndex: index - 1,
          }}
        />
        {isTop && (
          <div
            className="absolute"
            style={{
              left: proj.x + proj.width * 0.2,
              top: proj.y - proj.depth * 0.3 + proj.height * 0.2,
              width: proj.width * 0.2,
              height: proj.height * 0.2,
              backgroundColor: 'rgba(255,255,255,0.4)',
              borderRadius: 2,
            }}
          />
        )}
      </div>
    );
  };

  const renderCurrentBlock = () => {
    if (!state.currentBlock) return null;
    const proj = project3D(state.currentBlock);
    
    return (
      <motion.div
        className="absolute"
        style={{
          left: proj.x,
          top: proj.y - proj.depth * 0.3,
          width: proj.width,
          height: proj.height,
          backgroundColor: state.currentBlock.color,
          borderRadius: 4,
          transform: `perspective(500px) rotateX(-10deg)`,
          boxShadow: `0 0 20px ${state.currentBlock.color}80`,
          zIndex: 100,
        }}
        animate={{ 
          y: [0, -5, 0],
        }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        <div
          className="absolute"
          style={{
            left: '10%',
            top: '10%',
            width: '20%',
            height: '20%',
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 2,
          }}
        />
      </motion.div>
    );
  };

  const renderShadow = () => {
    if (!state.currentBlock) return null;
    const topBlock = state.blocks.length > 0 
      ? state.blocks[state.blocks.length - 1] 
      : null;
    
    if (!topBlock) return null;
    
    const proj = project3D(state.currentBlock);
    const topProj = project3D(topBlock);
    
    return (
      <div
        className="absolute"
        style={{
          left: topProj.x + topProj.width * 0.1,
          top: topProj.y - topProj.depth * 0.3 + topProj.height,
          width: topProj.width * 0.8,
          height: topProj.depth * 0.8,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 4,
          transform: `perspective(500px) rotateX(60deg)`,
          transformOrigin: 'top center',
        }}
      />
    );
  };

  const renderGround = () => {
    return (
      <div
        className="absolute"
        style={{
          left: 50,
          top: 500,
          width: 300,
          height: 100,
          backgroundColor: '#2d3436',
          borderRadius: 8,
          transform: `perspective(500px) rotateX(60deg)`,
          transformOrigin: 'top center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      />
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
          积木搭建
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Block Builder 3D
        </p>
        
        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>使用方向键移动积木</p>
          <p>空格键放下积木</p>
          <p>尽可能堆得更高!</p>
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
            backgroundColor: NEON_COLORS.success,
            color: NEON_COLORS.text,
            boxShadow: `0 0 20px ${NEON_COLORS.success}60`,
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${NEON_COLORS.success}` }}
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
              border: `1px solid ${NEON_COLORS.warning}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>层数</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.level - 1}</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.warning }}>{state.score}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>下一个:</div>
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: state.nextColor }}
            />
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden select-none"
          style={{
            width: 400,
            height: 600,
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: `0 0 30px ${NEON_COLORS.warning}30`,
            border: `2px solid ${NEON_COLORS.warning}40`,
            overflow: 'hidden',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 100%, rgba(100,100,100,0.2) 0%, transparent 50%)',
            }}
          />

          {renderGround()}
          
          {[...state.blocks].reverse().map((block, i) => 
            renderBlock(block, state.blocks.length - 1 - i)
          )}
          
          {renderShadow()}
          {renderCurrentBlock()}

          {state.phase === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
                游戏结束
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.warning }}>
                层数: {state.level - 1}
              </div>
              <div className="text-2xl mb-6" style={{ color: NEON_COLORS.accent }}>
                分数: {state.score}
              </div>
              {state.score > highScore && (
                <div className="text-xl mb-4" style={{ color: NEON_COLORS.gold }}>
                  新纪录!
                </div>
              )}
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-lg font-bold text-xl"
                style={{
                  backgroundColor: NEON_COLORS.success,
                  color: NEON_COLORS.text,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再试一次
              </motion.button>
            </motion.div>
          )}
        </div>

        <div className="flex gap-4">
          <motion.button
            onClick={handleDrop}
            className="px-6 py-3 rounded-lg font-bold text-lg"
            style={{
              backgroundColor: NEON_COLORS.success,
              color: NEON_COLORS.text,
              opacity: state.phase === 'building' ? 1 : 0.5,
            }}
            whileHover={{ scale: state.phase === 'building' ? 1.05 : 1 }}
            whileTap={{ scale: state.phase === 'building' ? 0.95 : 1 }}
            disabled={state.phase !== 'building'}
          >
            放下 (空格)
          </motion.button>
        </div>

        <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
          <div>方向键移动 | 空格放下</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {!gameStarted ? renderMenu() : renderGame()}
    </div>
  );
};

export default BlockBuilder;
