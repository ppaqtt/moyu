import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { MarbleMazeEngine, MarbleMazeState, Hole, Wall } from './engine';

const MarbleMaze = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new MarbleMazeEngine());
  const [state, setState] = useState<MarbleMazeState>(() => engine.getState());
  const [highScores, setHighScores] = useLocalStorage<Record<number, number>>('marbleMazeScores', {});
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: isStarted });

  useEffect(() => {
    if (selectedLevel !== null) {
      setIsStarted(true);
    }
  }, [selectedLevel]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = (touch.clientX - centerX) / (rect.width / 2);
    const dy = (touch.clientY - centerY) / (rect.height / 2);
    
    engine.setTilt(dx, dy);
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    engine.setTilt(0, 0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);
    
    engine.setTilt(dx, dy);
  };

  const handleMouseUp = () => {
    touchStartRef.current = null;
    engine.setTilt(0, 0);
  };

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
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
    setIsStarted(false);
  };

  const renderHole = (hole: Hole) => {
    return (
      <div
        key={`hole-${hole.x}-${hole.y}`}
        className="absolute rounded-full"
        style={{
          left: hole.x - hole.radius,
          top: hole.y - hole.radius,
          width: hole.radius * 2,
          height: hole.radius * 2,
          backgroundColor: '#000',
          boxShadow: hole.collected 
            ? 'none' 
            : `inset 0 0 20px ${NEON_COLORS.danger}, 0 0 10px ${NEON_COLORS.danger}40`,
        }}
      />
    );
  };

  const renderWall = (wall: Wall, index: number) => {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return (
      <div
        key={`wall-${index}`}
        className="absolute"
        style={{
          left: wall.x1,
          top: wall.y1 - wall.thickness / 2,
          width: length,
          height: wall.thickness,
          backgroundColor: '#8B4513',
          borderRadius: 4,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      />
    );
  };

  const renderBall = () => {
    const { ball } = state;
    
    return (
      <motion.div
        className="absolute rounded-full"
        style={{
          left: ball.x - ball.radius,
          top: ball.y - ball.radius,
          width: ball.radius * 2,
          height: ball.radius * 2,
          backgroundColor: ball.color,
          boxShadow: `
            inset -3px -3px 6px rgba(0,0,0,0.3),
            inset 3px 3px 6px rgba(255,255,255,0.3),
            0 0 15px ${ball.color}80
          `,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            left: '15%',
            top: '15%',
            width: '30%',
            height: '30%',
            backgroundColor: 'rgba(255,255,255,0.6)',
          }}
        />
      </motion.div>
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
          弹珠迷宫
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Marble Maze
        </p>
        
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(level => (
            <motion.button
              key={level}
              onClick={() => handleSelectLevel(level)}
              className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
              style={{
                backgroundColor: NEON_COLORS.background,
                border: `2px solid ${NEON_COLORS.accent}`,
                boxShadow: `0 0 15px ${NEON_COLORS.accent}40`,
              }}
              whileHover={{ scale: 1.1, boxShadow: `0 0 25px ${NEON_COLORS.accent}` }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{level}</span>
              {highScores[level] && (
                <span className="text-xs" style={{ color: NEON_COLORS.success }}>
                  {highScores[level]}分
                </span>
              )}
            </motion.button>
          ))}
        </div>

        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>倾斜/拖动控制弹珠滚动</p>
          <p>将弹珠送到红色目标洞中</p>
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
        <div className="flex items-center justify-between w-full max-w-[420px] px-4">
          <motion.button
            onClick={handleBackToMenu}
            className="px-3 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.surface,
              color: NEON_COLORS.text,
              border: `1px solid ${NEON_COLORS.accent}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>关卡</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.level}</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.warning }}>{state.score}</div>
            </div>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden select-none"
          style={{
            width,
            height,
            background: 'linear-gradient(135deg, #d4a574 0%, #c4956a 50%, #b4855a 100%)',
            boxShadow: `0 0 30px ${NEON_COLORS.warning}30`,
            border: `3px solid #8B4513`,
            cursor: 'grab',
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
          {state.walls.map((wall, i) => renderWall(wall, i))}
          {state.holes.map(hole => renderHole(hole))}
          {renderBall()}

          {state.phase === 'win' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.success }}>
                成功!
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.warning }}>
                分数: {state.score}
              </div>
              <div className="flex gap-4 mt-4">
                <motion.button
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-lg font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.accent,
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
        </div>

        <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
          <div>拖动/倾斜控制弹珠</div>
          <div>将弹珠送到红色目标洞</div>
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

export default MarbleMaze;
