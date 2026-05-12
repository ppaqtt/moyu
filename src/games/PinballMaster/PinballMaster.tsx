import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { PinballMasterEngine, PinballMasterState, Ball, Bumper, Flipper, Target, Spinner } from './engine';

const PinballMaster = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new PinballMasterEngine());
  const [state, setState] = useState<PinballMasterState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('pinballMasterHighScore', 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStarted });

  useEffect(() => {
    if (leftPressed) {
      engine.pressLeftFlipper();
    } else {
      engine.releaseLeftFlipper();
    }
  }, [leftPressed, engine]);

  useEffect(() => {
    if (rightPressed) {
      engine.pressRightFlipper();
    } else {
      engine.releaseRightFlipper();
    }
  }, [rightPressed, engine]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;

      if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z') {
        setLeftPressed(true);
      }
      if (e.key === 'ArrowRight' || e.key === '/' || e.key === '.') {
        setRightPressed(true);
      }
      if (e.key === ' ' || e.key === 'x' || e.key === 'X') {
        engine.nudge();
      }
      if (e.key === 'Enter' || e.key === 'l' || e.key === 'L') {
        engine.launchBall();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z') {
        setLeftPressed(false);
      }
      if (e.key === 'ArrowRight' || e.key === '/' || e.key === '.') {
        setRightPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, gameStarted]);

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

  const handleLaunch = () => {
    engine.launchBall();
  };

  const renderBall = (ball: Ball) => {
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
          boxShadow: `0 0 15px ${ball.color}, inset -2px -2px 4px rgba(0,0,0,0.3)`,
          border: '2px solid rgba(255,255,255,0.5)',
        }}
      />
    );
  };

  const renderBumper = (bumper: Bumper) => {
    const isFlashing = bumper.flashTimer > 0;
    const colors = {
      pop: { bg: '#ff0066', glow: '#ff0066' },
      round: { bg: '#00ff66', glow: '#00ff66' },
      slingshot: { bg: '#ff6600', glow: '#ff6600' },
      kickback: { bg: '#6600ff', glow: '#6600ff' },
    };
    const color = colors[bumper.type];

    return (
      <motion.div
        key={bumper.id}
        className="absolute rounded-full flex items-center justify-center"
        style={{
          left: bumper.x - bumper.radius,
          top: bumper.y - bumper.radius,
          width: bumper.radius * 2,
          height: bumper.radius * 2,
          backgroundColor: isFlashing ? '#ffffff' : color.bg,
          boxShadow: isFlashing
            ? `0 0 40px ${color.glow}, 0 0 80px ${color.glow}`
            : `0 0 15px ${color.glow}60`,
          border: `3px solid ${isFlashing ? color.glow : '#ffffff'}`,
        }}
        animate={isFlashing ? { scale: 1.4 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500 }}
      >
        <div className="text-white font-bold text-xs">{bumper.points}</div>
      </motion.div>
    );
  };

  const renderFlipper = (flipper: Flipper) => {
    const angle = (flipper.angle * 180) / Math.PI;
    const length = flipper.length;

    return (
      <div
        key={flipper.isLeft ? 'left' : 'right'}
        className="absolute"
        style={{
          left: flipper.x,
          top: flipper.y,
          width: length,
          height: 18,
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg)`,
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'linear-gradient(180deg, #ff4444 0%, #cc0000 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute rounded-full bg-red-500"
          style={{
            left: 0,
            top: '50%',
            width: 22,
            height: 22,
            transform: 'translateY(-50%)',
          }}
        />
      </div>
    );
  };

  const renderTarget = (target: Target) => {
    return (
      <motion.div
        key={target.id}
        className="absolute rounded-sm flex items-center justify-center"
        style={{
          left: target.x,
          top: target.y,
          width: target.width,
          height: target.height,
          backgroundColor: target.isHit ? '#333' : '#ffff00',
          boxShadow: target.isHit ? 'none' : '0 0 10px #ffff00',
          opacity: target.isHit ? 0.3 : 1,
          border: `2px solid ${target.isHit ? '#555' : '#ffcc00'}`,
        }}
        animate={target.isHit ? { y: 15 } : { y: 0 }}
        transition={{ duration: 0.2 }}
      />
    );
  };

  const renderSpinner = (spinner: Spinner) => {
    return (
      <div
        key={spinner.id}
        className="absolute"
        style={{
          left: spinner.x - spinner.width / 2,
          top: spinner.y - spinner.height / 2,
          width: spinner.width,
          height: spinner.height,
          backgroundColor: spinner.isSpinning ? '#00ff00' : '#666',
          transform: `rotate(${spinner.rotation}deg)`,
          transition: spinner.isSpinning ? 'none' : 'background-color 0.3s',
          boxShadow: spinner.isSpinning ? '0 0 10px #00ff00' : 'none',
        }}
      />
    );
  };

  const renderPlayfield = () => {
    const { width, height } = engine.getCanvasSize();

    return (
      <svg className="absolute inset-0" width={width} height={height}>
        <defs>
          <linearGradient id="tableGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a0a2e" />
            <stop offset="100%" stopColor="#0a0a1a" />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#tableGrad)" />
        <path
          d={`M 20 100 L 20 600 Q 20 620 40 620 L 360 620 Q 380 620 380 600 L 380 100
              Q 380 20 320 20 L 220 20 L 220 60 L 180 60 L 180 20 Q 100 20 80 20
              Q 20 20 20 100`}
          fill="none"
          stroke={NEON_COLORS.primary}
          strokeWidth={4}
        />
        <line x1={60} y1={350} x2={60} y2={400} stroke={NEON_COLORS.secondary} strokeWidth={2} opacity={0.5} />
        <line x1={340} y1={350} x2={340} y2={400} stroke={NEON_COLORS.secondary} strokeWidth={2} opacity={0.5} />
        <rect x={30} y={30} width={340} height={50} fill={NEON_COLORS.surface} rx={10} opacity={0.8} />
        <rect x={360} y={280} width={25} height={320} fill={NEON_COLORS.surface} rx={5} />
        <rect x={365} y={290} width={15} height={300} fill="#0a0a1a" rx={3} />
        <text x={200} y={75} fill={NEON_COLORS.accent} fontSize="14" textAnchor="middle" fontWeight="bold">
          PINBALL MASTER
        </text>
      </svg>
    );
  };

  const { width, height } = engine.getCanvasSize();

  if (!gameStarted) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center gap-6 p-8 rounded-2xl"
        style={{ backgroundColor: NEON_COLORS.surface }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
          弹珠台大师
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Pinball Master
        </p>

        <div className="text-center">
          <div className="text-2xl mb-2" style={{ color: NEON_COLORS.accent }}>
            最高分: {highScore.toLocaleString()}
          </div>
        </div>

        <motion.button
          onClick={handleStart}
          className="px-12 py-4 rounded-xl text-2xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.neonPink,
            color: NEON_COLORS.text,
            boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          开始游戏
        </motion.button>

        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>控制说明:</p>
          <p>← / Z: 左挡板</p>
          <p>→ / ./: 右挡板</p>
          <p>空格/X: 轻推</p>
          <p>回车/L: 发射球</p>
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
      <div className="flex items-center justify-between w-full max-w-[420px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-3 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.surface,
            color: NEON_COLORS.text,
            border: `1px solid ${NEON_COLORS.neonPink}`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          退出
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.score.toLocaleString()}</div>
        </div>

        <div className="flex items-center gap-2">
          {[...Array(state.maxBalls - state.totalBallsLost)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                boxShadow: `0 0 8px ${NEON_COLORS.neonPink}`,
              }}
            />
          ))}
          {state.totalBallsLost >= state.maxBalls && (
            <span style={{ color: NEON_COLORS.danger }}>球没了</span>
          )}
        </div>
      </div>

      {state.combo > 1 && (
        <motion.div
          className="text-2xl font-bold"
          style={{ color: NEON_COLORS.neonGreen }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          COMBO x{state.combo}
        </motion.div>
      )}

      {state.message && (
        <motion.div
          className="text-3xl font-bold absolute z-10"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: NEON_COLORS.accent,
            textShadow: `0 0 20px ${NEON_COLORS.accent}`
          }}
          animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.8 }}
        >
          {state.message}
        </motion.div>
      )}

      <div
        ref={gameRef}
        className="relative rounded-xl overflow-hidden select-none"
        style={{
          width,
          height,
          backgroundColor: '#0a0a1a',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`,
        }}
      >
        {renderPlayfield()}

        {state.bumpers.map(bumper => renderBumper(bumper))}

        {state.targets.map(target => renderTarget(target))}

        {state.spinners.map(spinner => renderSpinner(spinner))}

        {state.flippers.map(flipper => renderFlipper(flipper))}

        {state.balls.map(ball => renderBall(ball))}

        <motion.button
          onClick={handleLaunch}
          className="absolute rounded-full"
          style={{
            right: 12,
            top: 280,
            width: 55,
            height: 55,
            backgroundColor: NEON_COLORS.neonGreen,
            boxShadow: `0 0 15px ${NEON_COLORS.neonGreen}`,
          }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="text-white font-bold text-xs">发射</div>
        </motion.button>

        {state.tilt > 10 && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold"
            style={{ color: NEON_COLORS.danger }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
          >
            TILT!
          </motion.div>
        )}

        {state.isTilted && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-red-500 opacity-50"
          >
            TILTED - 挡板锁定
          </div>
        )}
      </div>

      <div className="flex gap-8 mt-4">
        <motion.button
          onTouchStart={() => setLeftPressed(true)}
          onTouchEnd={() => setLeftPressed(false)}
          onMouseDown={() => setLeftPressed(true)}
          onMouseUp={() => setLeftPressed(false)}
          onMouseLeave={() => setLeftPressed(false)}
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
          style={{
            backgroundColor: leftPressed ? NEON_COLORS.danger : NEON_COLORS.surface,
            border: `3px solid ${NEON_COLORS.danger}`,
            color: NEON_COLORS.text,
            boxShadow: leftPressed ? `0 0 20px ${NEON_COLORS.danger}` : 'none',
          }}
          whileTap={{ scale: 0.9 }}
        >
          ◀
        </motion.button>

        <motion.button
          onClick={handleLaunch}
          className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.neonGreen,
            color: NEON_COLORS.text,
          }}
          whileTap={{ scale: 0.9 }}
        >
          发射
        </motion.button>

        <motion.button
          onTouchStart={() => setRightPressed(true)}
          onTouchEnd={() => setRightPressed(false)}
          onMouseDown={() => setRightPressed(true)}
          onMouseUp={() => setRightPressed(false)}
          onMouseLeave={() => setRightPressed(false)}
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
          style={{
            backgroundColor: rightPressed ? NEON_COLORS.danger : NEON_COLORS.surface,
            border: `3px solid ${NEON_COLORS.danger}`,
            color: NEON_COLORS.text,
            boxShadow: rightPressed ? `0 0 20px ${NEON_COLORS.danger}` : 'none',
          }}
          whileTap={{ scale: 0.9 }}
        >
          ▶
        </motion.button>
      </div>

      {state.isGameOver && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
            游戏结束
          </div>
          <div className="text-3xl mb-2" style={{ color: NEON_COLORS.accent }}>
            最终分数: {state.score.toLocaleString()}
          </div>
          {state.score > highScore && (
            <div className="text-xl mb-4" style={{ color: NEON_COLORS.neonGreen }}>
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
              backgroundColor: NEON_COLORS.neonPink,
              color: NEON_COLORS.text,
              boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            再玩一次
          </motion.button>
        </motion.div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
        <div>控制挡板击打球获得高分!</div>
        <div>击中弹柱和目标获得连击加成</div>
      </div>
    </div>
  );
};

export default PinballMaster;
