import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { AngryBirdsEngine, AngryBirdsState, Bird, Block, Pig } from './engine';

const AngryBirds = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new AngryBirdsEngine());
  const [state, setState] = useState<AngryBirdsState>(() => engine.getState());
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [highScores, setHighScores] = useLocalStorage<Record<number, number>>('angryBirdsScores', {});
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: selectedLevel !== null });

  useEffect(() => {
    if (selectedLevel !== null) {
      engine.setLevel(selectedLevel);
      updateState();
    }
  }, [selectedLevel, engine, updateState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.phase !== 'aiming') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engine.startDrag(x, y);
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engine.updateDrag(x, y);
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      engine.endDrag();
      isDragging.current = false;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (state.phase !== 'aiming') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    engine.startDrag(x, y);
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    engine.updateDrag(x, y);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const handleNextLevel = () => {
    const currentScore = state.score;
    if (currentScore > (highScores[state.level] || 0)) {
      setHighScores({ ...highScores, [state.level]: currentScore });
    }
    engine.nextLevel();
  };

  const handleRestart = () => {
    engine.reset();
  };

  const handleBackToMenu = () => {
    setSelectedLevel(null);
  };

  const renderBird = (bird: Bird, index: number) => {
    const isActive = index === state.currentBirdIndex && !bird.isLaunched;
    const x = isActive ? state.slingshot.pullX : bird.x;
    const y = isActive ? state.slingshot.pullY : bird.y;

    return (
      <motion.div
        key={bird.id}
        className="absolute rounded-full"
        style={{
          left: x - bird.radius,
          top: y - bird.radius,
          width: bird.radius * 2,
          height: bird.radius * 2,
          backgroundColor: bird.color,
          boxShadow: isActive ? `0 0 20px ${bird.color}` : 'none',
          opacity: bird.isDestroyed ? 0.3 : 1,
        }}
        animate={bird.isLaunched ? {
          x: bird.vx,
          y: bird.vy,
        } : {}}
      >
        {/* Bird face */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-white" />
        <div className="absolute top-3 left-4 w-1.5 h-1.5 rounded-full bg-black" />
        <div className="absolute top-3 right-0 w-4 h-2 rounded-full bg-yellow-600" />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full" 
             style={{ backgroundColor: bird.color, filter: 'brightness(1.2)' }} />
      </motion.div>
    );
  };

  const renderBlock = (block: Block) => {
    const colors = {
      wood: { bg: '#8B4513', border: '#654321' },
      stone: { bg: '#808080', border: '#505050' },
      glass: { bg: '#87CEEB', border: '#5CACEE' }
    };
    const color = colors[block.type];

    return (
      <motion.div
        key={block.id}
        className="absolute rounded-sm"
        style={{
          left: block.x - block.width / 2,
          top: block.y - block.height / 2,
          width: block.width,
          height: block.height,
          backgroundColor: color.bg,
          border: `3px solid ${color.border}`,
          boxShadow: block.type === 'glass' ? '0 0 10px rgba(135,206,235,0.5)' : 'none',
          opacity: block.isDestroyed ? 0 : 1,
        }}
        animate={{
          x: block.vx * 2,
          y: block.vy * 2,
          rotate: block.vx * 2,
        }}
      />
    );
  };

  const renderPig = (pig: Pig) => {
    return (
      <motion.div
        key={pig.id}
        className="absolute rounded-full"
        style={{
          left: pig.x - pig.radius,
          top: pig.y - pig.radius,
          width: pig.radius * 2,
          height: pig.radius * 2,
          backgroundColor: '#90EE90',
          border: `3px solid #228B22`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          opacity: pig.isDestroyed ? 0 : 1,
        }}
        animate={{
          x: pig.vx * 2,
          y: pig.vy * 2,
        }}
      >
        {/* Pig eyes */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-white" />
        <div className="absolute top-1/3 left-1/3 w-1 h-1 rounded-full bg-black" />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-white" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-black" />
        {/* Pig nose */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-3 h-2 rounded-full bg-pink-300 border border-pink-400" />
      </motion.div>
    );
  };

  const renderSlingshot = () => {
    return (
      <div className="absolute" style={{ left: state.slingshot.x - 15, top: state.slingshot.y - 60 }}>
        {/* Back band */}
        <svg width="30" height="80" className="absolute" style={{ left: 0, top: 20 }}>
          <line x1="15" y1="0" x2={state.slingshot.pullX - state.slingshot.x + 15} 
                y2={state.slingshot.pullY - state.slingshot.y + 20} 
                stroke="#8B4513" strokeWidth="4" />
        </svg>
        {/* Slingshot fork */}
        <div className="absolute w-2 h-16 bg-brown-700 rounded" style={{ left: 4, top: 0 }} />
        <div className="absolute w-2 h-16 bg-brown-700 rounded" style={{ left: 24, top: 0 }} />
        <div className="absolute w-6 h-4 bg-brown-800 rounded" style={{ left: 12, top: 14 }} />
      </div>
    );
  };

  const renderLevelSelect = () => {
    return (
      <motion.div
        className="flex flex-col items-center justify-center gap-8 p-8 rounded-2xl"
        style={{ backgroundColor: NEON_COLORS.surface }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.primary }}>
          愤怒的小鸟
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          选择关卡开始游戏
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(level => (
            <motion.button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className="w-24 h-24 rounded-xl flex flex-col items-center justify-center"
              style={{
                backgroundColor: NEON_COLORS.background,
                border: `2px solid ${NEON_COLORS.primary}`,
                boxShadow: `0 0 15px ${NEON_COLORS.primary}40`,
              }}
              whileHover={{ scale: 1.1, boxShadow: `0 0 25px ${NEON_COLORS.primary}` }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-3xl font-bold" style={{ color: NEON_COLORS.primary }}>{level}</span>
              {highScores[level] && (
                <span className="text-sm mt-1" style={{ color: NEON_COLORS.accent }}>
                  {highScores[level]}分
                </span>
              )}
            </motion.button>
          ))}
        </div>

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
    const { width, height } = engine.getCanvasSize();
    const groundY = engine.getGroundY();

    return (
      <div className="flex flex-col items-center gap-4">
        {/* HUD */}
        <div className="flex items-center justify-between w-full max-w-[620px] px-4">
          <motion.button
            onClick={handleBackToMenu}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.surface,
              color: NEON_COLORS.text,
              border: `1px solid ${NEON_COLORS.primary}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>关卡</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.primary }}>{state.level}</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.score}</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>小鸟</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.secondary }}>
                {3 - state.currentBirdIndex}
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: i < state.attempts ? '#ff4444' : '#333',
                  boxShadow: i < state.attempts ? '0 0 8px #ff4444' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Game Canvas */}
        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden cursor-crosshair select-none"
          style={{
            width,
            height,
            background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 50%, #90EE90 50%, #228B22 100%)',
            boxShadow: `0 0 30px ${NEON_COLORS.primary}30`,
            border: `2px solid ${NEON_COLORS.primary}40`,
            touchAction: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Stars display */}
          <div className="absolute top-4 left-4 flex gap-2">
            {[1, 2, 3].map(star => (
              <span
                key={star}
                className="text-2xl"
                style={{ opacity: star <= state.stars ? 1 : 0.3 }}
              >
                ★
              </span>
            ))}
          </div>

          {/* Ground */}
          <div
            className="absolute w-full"
            style={{
              top: groundY,
              height: height - groundY,
              background: 'linear-gradient(180deg, #228B22 0%, #1B5E20 100%)',
            }}
          />

          {/* Slingshot */}
          {renderSlingshot()}

          {/* Birds */}
          {state.birds.map((bird, i) => renderBird(bird, i))}

          {/* Blocks */}
          {state.blocks.map(block => renderBlock(block))}

          {/* Pigs */}
          {state.pigs.map(pig => renderPig(pig))}

          {/* Trajectory preview */}
          {state.phase === 'aiming' && (
            <svg className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 10 }).map((_, i) => {
                const dx = state.slingshot.anchorX - state.slingshot.pullX;
                const dy = state.slingshot.anchorY - state.slingshot.pullY;
                const t = (i + 1) * 8;
                const px = state.slingshot.pullX + dx * 0.15 * t;
                const py = state.slingshot.pullY + dy * 0.15 * t + 0.5 * 0.4 * t * t;
                return (
                  <circle
                    key={i}
                    cx={px}
                    cy={py}
                    r={3}
                    fill={NEON_COLORS.accent}
                    opacity={0.5 - i * 0.04}
                  />
                );
              })}
            </svg>
          )}

          {/* Win overlay */}
          {state.phase === 'complete' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.success }}>
                关卡完成!
              </div>
              <div className="text-3xl mb-2" style={{ color: NEON_COLORS.accent }}>
                分数: {state.score}
              </div>
              <div className="text-2xl mb-6" style={{ color: NEON_COLORS.primary }}>
                {state.stars} ★★★
              </div>
              <div className="flex gap-4">
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
                  重玩
                </motion.button>
                <motion.button
                  onClick={handleNextLevel}
                  className="px-6 py-3 rounded-lg font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.success,
                    color: NEON_COLORS.text,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  下一关
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Fail overlay */}
          {state.phase === 'failed' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
                挑战失败
              </div>
              <div className="text-3xl mb-6" style={{ color: NEON_COLORS.accent }}>
                分数: {state.score}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-lg font-bold text-xl"
                style={{
                  backgroundColor: NEON_COLORS.primary,
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

        <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
          <div>拖动小鸟瞄准，松开发射</div>
          <div>消灭所有绿猪获得胜利</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {selectedLevel === null ? renderLevelSelect() : renderGame()}
    </div>
  );
};

export default AngryBirds;
