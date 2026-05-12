import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { CrashLabEngine, CrashLabState, CrashBall, CrashWall, CrashObstacle } from './engine';

const CrashLab = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new CrashLabEngine());
  const [state, setState] = useState<CrashLabState>(() => engine.getState());
  const [trails, setTrails] = useState<Map<number, { x: number; y: number; age: number }[]>>(new Map());
  const [highScore, setHighScore] = useLocalStorage<number>('crashLabHighScore', 0);
  const [gameMode, setGameMode] = useState<'sandbox' | 'experiment'>('sandbox');
  const canvasRef = useRef<HTMLDivElement>(null);

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
    setTrails(new Map(engine.getTrails()));
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: true });

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (y > 50) {
      engine.addBall(x, y, (Math.random() - 0.5) * 5, -2);
    }
  };

  const handleCanvasTouch = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (y > 50) {
      engine.addBall(x, y, (Math.random() - 0.5) * 3, 0);
    }
  };

  const handleClear = () => {
    engine.clearBalls();
    updateState();
  };

  const handleToggleGravity = () => {
    engine.toggleGravity();
    updateState();
  };

  const handleToggleTrails = () => {
    engine.toggleTrails();
    updateState();
  };

  const handleStartExperiment = () => {
    engine.startExperiment();
    setGameMode('experiment');
    updateState();
  };

  const handleReset = () => {
    engine.reset();
    setGameMode('sandbox');
    updateState();
  };

  const handleBackToMenu = () => {
    if (state.score > highScore) {
      setHighScore(state.score);
    }
  };

  const renderBall = (ball: CrashBall) => {
    return (
      <motion.div
        key={ball.id}
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
            0 0 15px ${ball.color}60
          `,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            left: '20%',
            top: '20%',
            width: '25%',
            height: '25%',
            backgroundColor: 'rgba(255,255,255,0.5)',
          }}
        />
      </motion.div>
    );
  };

  const renderTrails = () => {
    const result: React.ReactNode[] = [];
    
    trails.forEach((trail, ballId) => {
      trail.forEach((point, i) => {
        const ball = state.balls.find(b => b.id === ballId);
        if (!ball) return;
        const opacity = Math.max(0, 1 - point.age / 30);
        
        result.push(
          <div
            key={`trail-${ballId}-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: point.x - 3,
              top: point.y - 3,
              width: 6,
              height: 6,
              backgroundColor: ball.color,
              opacity: opacity * 0.5,
            }}
          />
        );
      });
    });
    
    return result;
  };

  const renderWall = (wall: CrashWall, index: number) => {
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
          backgroundColor: wall.movable ? NEON_COLORS.accent : '#666',
          borderRadius: wall.thickness / 2,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          boxShadow: wall.movable 
            ? `0 0 10px ${NEON_COLORS.accent}` 
            : '0 2px 4px rgba(0,0,0,0.3)',
        }}
      />
    );
  };

  const renderObstacle = (obs: CrashObstacle, index: number) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: obs.x - obs.width / 2,
      top: obs.y - obs.height / 2,
      width: obs.width,
      height: obs.height,
      backgroundColor: obs.color,
      border: `2px solid ${obs.color.replace('40', 'ff')}`,
      transform: `rotate(${obs.rotation}rad)`,
      transition: 'transform 0.1s linear',
    };

    if (obs.type === 'circle') {
      return (
        <div
          key={`obs-${index}`}
          className="absolute"
          style={{
            left: obs.x - obs.width / 2,
            top: obs.y - obs.height / 2,
            width: obs.width,
            height: obs.height,
            borderRadius: '50%',
            backgroundColor: obs.color,
            border: `3px solid ${obs.color.replace('40', 'ff')}`,
            boxShadow: `0 0 20px ${obs.color.replace('40', '60')}`,
            transform: `rotate(${obs.rotation}rad)`,
          }}
        />
      );
    } else if (obs.type === 'rect') {
      return (
        <div
          key={`obs-${index}`}
          className="absolute"
          style={{
            left: obs.x - obs.width / 2,
            top: obs.y - obs.height / 2,
            width: obs.width,
            height: obs.height,
            backgroundColor: obs.color,
            border: `3px solid ${obs.color.replace('40', 'ff')}`,
            boxShadow: `0 0 15px ${obs.color.replace('40', '60')}`,
            transform: `rotate(${obs.rotation}rad)`,
          }}
        />
      );
    } else {
      return (
        <div
          key={`obs-${index}`}
          className="absolute"
          style={{
            left: obs.x,
            top: obs.y - obs.height / 2,
            width: 0,
            height: 0,
            borderLeft: `${obs.width / 2}px solid transparent`,
            borderRight: `${obs.width / 2}px solid transparent`,
            borderBottom: `${obs.height}px solid ${obs.color.replace('40', '80')}`,
            filter: `drop-shadow(0 0 10px ${obs.color.replace('40', '60')})`,
            transform: `rotate(${obs.rotation}rad)`,
          }}
        />
      );
    }
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
          碰撞实验室
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Crash Lab
        </p>
        
        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>点击画布添加小球</p>
          <p>观察物理碰撞效果</p>
          <p>实验模式:达到目标碰撞次数</p>
        </div>

        {highScore > 0 && (
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>最高分</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>{highScore}</div>
          </div>
        )}

        <motion.button
          onClick={handleStartExperiment}
          className="px-8 py-4 rounded-xl font-bold text-xl"
          style={{
            backgroundColor: NEON_COLORS.danger,
            color: NEON_COLORS.text,
            boxShadow: `0 0 20px ${NEON_COLORS.danger}60`,
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${NEON_COLORS.danger}` }}
          whileTap={{ scale: 0.95 }}
        >
          实验模式
        </motion.button>

        <motion.button
          onClick={() => setGameMode('sandbox')}
          className="px-8 py-4 rounded-xl font-bold text-xl"
          style={{
            backgroundColor: NEON_COLORS.success,
            color: NEON_COLORS.text,
            boxShadow: `0 0 20px ${NEON_COLORS.success}60`,
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${NEON_COLORS.success}` }}
          whileTap={{ scale: 0.95 }}
        >
          沙盒模式
        </motion.button>

        <motion.button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-bold"
          style={{
            backgroundColor: NEON_COLORS.primary,
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
            onClick={() => {
              handleBackToMenu();
              navigate('/');
            }}
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
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>碰撞</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.danger }}>{state.collisions}</div>
            </div>
            {gameMode === 'experiment' && (
              <div className="text-center">
                <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>目标</div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.success }}>{state.experimentTarget}</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.score}</div>
            </div>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden select-none"
          style={{
            width: 400,
            height: 600,
            background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #2a2a4e 100%)',
            boxShadow: `0 0 30px ${NEON_COLORS.warning}30`,
            border: `2px solid ${NEON_COLORS.warning}40`,
            cursor: 'crosshair',
          }}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouch}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(255, 100, 100, 0.1) 0%, transparent 20%),
                radial-gradient(circle at 80% 70%, rgba(100, 100, 255, 0.1) 0%, transparent 20%)
              `,
            }}
          />

          {state.obstacles.map((obs, i) => renderObstacle(obs, i))}
          {state.walls.map((wall, i) => renderWall(wall, i))}
          {renderTrails()}
          {state.balls.map(ball => renderBall(ball))}

          {state.experimentPhase === 'complete' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.success }}>
                实验完成!
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.warning }}>
                碰撞次数: {state.collisions}
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
                onClick={handleReset}
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

        <div className="flex gap-2 flex-wrap justify-center">
          <motion.button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.surface,
              color: NEON_COLORS.text,
              border: `1px solid ${NEON_COLORS.warning}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            清除小球
          </motion.button>
          
          <motion.button
            onClick={handleToggleGravity}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: state.gravityEnabled ? NEON_COLORS.success : NEON_COLORS.danger,
              color: NEON_COLORS.text,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            重力: {state.gravityEnabled ? '开' : '关'}
          </motion.button>
          
          <motion.button
            onClick={handleToggleTrails}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: state.trailEnabled ? NEON_COLORS.accent : NEON_COLORS.textDim,
              color: NEON_COLORS.text,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            轨迹: {state.trailEnabled ? '开' : '关'}
          </motion.button>

          <motion.button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg font-bold text-sm"
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

        <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
          <div>点击画布添加小球 | 观察物理碰撞</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {gameMode === 'sandbox' && !state.balls.length && !state.experimentPhase ? renderMenu() : renderGame()}
      {gameMode === 'sandbox' && (state.balls.length > 0 || state.experimentPhase) ? renderGame() : null}
      {gameMode === 'experiment' ? renderGame() : null}
    </div>
  );
};

export default CrashLab;
