import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { CutRopeEngine, CutRopeState, Rope, Star, Target } from './engine';

const CutRope = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new CutRopeEngine());
  const [state, setState] = useState<CutRopeState>(() => engine.getState());
  const [highScores, setHighScores] = useLocalStorage<Record<number, number>>('cutRopeScores', {});
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [cutLine, setCutLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isCutting, setIsCutting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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
      engine.retry();
      engine.retry();
      updateState();
    }
  }, [selectedLevel, engine, updateState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.phase !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCutLine({ x1: x, y1: y, x2: x, y2: y });
    setIsCutting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCutting || !cutLine) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCutLine({ ...cutLine, x2: x, y2: y });
  };

  const handleMouseUp = () => {
    if (isCutting && cutLine) {
      const dx = cutLine.x2 - cutLine.x1;
      const dy = cutLine.y2 - cutLine.y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 20) {
        engine.cut(cutLine.x1, cutLine.y1, cutLine.x2, cutLine.y2);
      }
    }
    setIsCutting(false);
    setCutLine(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (state.phase !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setCutLine({ x1: x, y1: y, x2: x, y2: y });
    setIsCutting(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isCutting || !cutLine) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setCutLine({ ...cutLine, x2: x, y2: y });
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
    engine.retry();
  };

  const handleBackToMenu = () => {
    setSelectedLevel(null);
  };

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
  };

  const renderRope = (rope: Rope) => {
    if (rope.isCut && rope.cutIndex >= 0) {
      // Draw cut rope ends
      const seg1 = rope.segments[rope.cutIndex];
      const seg2 = rope.segments[rope.cutIndex + 1];
      
      return (
        <React.Fragment key={rope.id}>
          <svg className="absolute inset-0 pointer-events-none">
            {/* First part */}
            <path
              d={`M ${rope.segments.slice(0, rope.cutIndex + 1).map(s => `${s.x},${s.y}`).join(' L ')}`}
              stroke={NEON_COLORS.warning}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
            {/* Second part */}
            <path
              d={`M ${rope.segments.slice(rope.cutIndex + 1).map(s => `${s.x},${s.y}`).join(' L ')}`}
              stroke={NEON_COLORS.warning}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              opacity={0.5}
            />
          </svg>
          {/* Cut spark effect */}
          <motion.div
            className="absolute w-4 h-4 rounded-full"
            style={{
              left: (seg1.x + seg2.x) / 2 - 8,
              top: (seg1.y + seg2.y) / 2 - 8,
              backgroundColor: NEON_COLORS.accent,
              boxShadow: `0 0 20px ${NEON_COLORS.accent}`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </React.Fragment>
      );
    }
    
    return (
      <svg key={rope.id} className="absolute inset-0 pointer-events-none">
        <path
          d={`M ${rope.segments.map(s => `${s.x},${s.y}`).join(' L ')}`}
          stroke={NEON_COLORS.warning}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${NEON_COLORS.warning})` }}
        />
      </svg>
    );
  };

  const renderCandy = () => {
    const { candy } = state;
    
    return (
      <motion.div
        className="absolute rounded-full"
        style={{
          left: candy.x - candy.radius,
          top: candy.y - candy.radius,
          width: candy.radius * 2,
          height: candy.radius * 2,
          backgroundColor: '#ff6b6b',
          border: `3px solid #ee5a5a`,
          boxShadow: candy.collected 
            ? `0 0 30px ${NEON_COLORS.success}` 
            : `0 4px 8px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Wrapper twist */}
        <div 
          className="absolute w-2 h-full"
          style={{ 
            left: candy.radius - 1,
            background: 'repeating-linear-gradient(45deg, #ff6b6b, #ff6b6b 3px, #ff8787 3px, #ff8787 6px)',
          }}
        />
        <div 
          className="absolute w-2 h-full"
          style={{ 
            right: candy.radius - 1,
            background: 'repeating-linear-gradient(-45deg, #ff6b6b, #ff6b6b 3px, #ff8787 3px, #ff8787 6px)',
          }}
        />
      </motion.div>
    );
  };

  const renderStar = (star: Star) => {
    const isCollected = star.collected;
    const recentCollect = Date.now() - star.collectedTime < 500;
    
    return (
      <motion.div
        key={star.id}
        className="absolute flex items-center justify-center"
        style={{
          left: star.x - star.radius,
          top: star.y - star.radius,
          width: star.radius * 2,
          height: star.radius * 2,
          color: '#ffd700',
          fontSize: star.radius * 2,
          textShadow: '0 0 10px #ffd700',
          opacity: isCollected && !recentCollect ? 0.3 : 1,
        }}
        animate={recentCollect ? { scale: [1, 1.5, 0], opacity: [1, 1, 0] } : {}}
      >
        ★
      </motion.div>
    );
  };

  const renderTarget = (target: Target) => {
    const isActive = target.isActive;
    
    if (target.type === 'mouth') {
      return (
        <motion.div
          key={target.id}
          className="absolute"
          style={{
            left: target.x,
            top: target.y,
            width: target.width,
            height: target.height,
            opacity: isActive ? 1 : 0,
          }}
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {/* Om Nom face */}
          <div 
            className="w-full h-full rounded-full relative"
            style={{ 
              backgroundColor: '#90EE90',
              border: `3px solid #228B22`,
              boxShadow: isActive ? `0 0 20px ${NEON_COLORS.success}40` : 'none',
            }}
          >
            {/* Eyes */}
            <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-white" />
            <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-black" />
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-white" />
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-black" />
            
            {/* Mouth */}
            <motion.div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: 30,
                height: 20,
                backgroundColor: '#ff6b6b',
                border: '2px solid #cc4444',
              }}
              animate={{ height: [20, 25, 20] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </motion.div>
      );
    }
    
    return (
      <div
        key={target.id}
        className="absolute"
        style={{
          left: target.x,
          top: target.y,
          width: target.width,
          height: target.height,
          backgroundColor: NEON_COLORS.primary,
          borderRadius: 10,
          opacity: isActive ? 0.8 : 0.3,
        }}
      />
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
        <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.warning }}>
          切割绳子
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Cut the Rope
        </p>
        
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(level => (
            <motion.button
              key={level}
              onClick={() => handleSelectLevel(level)}
              className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
              style={{
                backgroundColor: NEON_COLORS.background,
                border: `2px solid ${NEON_COLORS.warning}`,
                boxShadow: `0 0 15px ${NEON_COLORS.warning}40`,
              }}
              whileHover={{ scale: 1.1, boxShadow: `0 0 25px ${NEON_COLORS.warning}` }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl font-bold" style={{ color: NEON_COLORS.warning }}>{level}</span>
              {highScores[level] && (
                <span className="text-xs" style={{ color: NEON_COLORS.accent }}>
                  {highScores[level]}分
                </span>
              )}
            </motion.button>
          ))}
        </div>

        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>滑动屏幕切割绳子</p>
          <p>收集星星,将糖果送到嘴里</p>
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

    return (
      <div className="flex flex-col items-center gap-4">
        {/* HUD */}
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
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>关卡</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.warning }}>{state.level}</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.score}</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>剩余</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.danger }}>
                {state.attempts}
              </div>
            </div>
          </div>

          {/* Stars */}
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="text-xl"
                style={{ 
                  color: i < state.starsCollected ? '#ffd700' : '#333',
                  textShadow: i < state.starsCollected ? '0 0 10px #ffd700' : 'none',
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Game Canvas */}
        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden select-none"
          style={{
            width,
            height,
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: `0 0 30px ${NEON_COLORS.warning}30`,
            border: `2px solid ${NEON_COLORS.warning}40`,
            cursor: state.phase === 'playing' ? 'crosshair' : 'default',
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
          {/* Ropes */}
          {state.ropes.map(rope => renderRope(rope))}

          {/* Stars */}
          {state.stars.map(star => renderStar(star))}

          {/* Targets */}
          {state.targets.map(target => renderTarget(target))}

          {/* Candy */}
          {renderCandy()}

          {/* Cut line preview */}
          {cutLine && (
            <svg className="absolute inset-0 pointer-events-none">
              <line
                x1={cutLine.x1}
                y1={cutLine.y1}
                x2={cutLine.x2}
                y2={cutLine.y2}
                stroke={NEON_COLORS.accent}
                strokeWidth={3}
                strokeDasharray="5,5"
                style={{ filter: `drop-shadow(0 0 5px ${NEON_COLORS.accent})` }}
              />
            </svg>
          )}

          {/* Anchor points */}
          {state.ropes.filter(r => !r.isCut).map(rope => (
            <motion.div
              key={`anchor-${rope.id}`}
              className="absolute w-4 h-4 rounded-full"
              style={{
                left: rope.startX - 8,
                top: rope.startY - 8,
                backgroundColor: '#666',
                border: '2px solid #888',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          ))}

          {/* Success overlay */}
          {state.phase === 'success' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.success }}>
                成功!
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.accent }}>
                分数: {state.score}
              </div>
              <div className="text-xl mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className="text-3xl mx-1"
                    style={{ 
                      color: i < state.starsCollected ? '#ffd700' : '#333',
                      textShadow: i < state.starsCollected ? '0 0 10px #ffd700' : 'none',
                    }}
                  >
                    ★
                  </span>
                ))}
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

          {/* Failed overlay */}
          {state.phase === 'failed' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
                失败
              </div>
              <div className="text-xl mb-6" style={{ color: NEON_COLORS.accent }}>
                再试一次!
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-lg font-bold text-xl"
                style={{
                  backgroundColor: NEON_COLORS.warning,
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
          <div>滑动切割绳子</div>
          <div>收集所有星星,将糖果送到绿怪物嘴里</div>
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

export default CutRope;
