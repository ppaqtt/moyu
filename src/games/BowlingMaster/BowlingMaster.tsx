import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { BowlingMasterEngine, BowlingMasterState, Pin, Ball } from './engine';

const BowlingMaster = () => {
  const navigate = useNavigate();
  const [engine] = useState(() => new BowlingMasterEngine());
  const [state, setState] = useState<BowlingMasterState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('bowlingMasterHighScore', 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [power, setPower] = useState(15);
  const [angle, setAngle] = useState(0);
  const [spin, setSpin] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const chargeStartTime = useRef(0);

  const updateState = useCallback(() => {
    setState({ ...engine.getState() });
  }, [engine]);

  const handleTick = useCallback(() => {
    engine.tick();
    updateState();
  }, [engine, updateState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStarted });

  useEffect(() => {
    if (state.phase === 'scoring') {
      const timer = setTimeout(() => {
        engine.nextThrow();
        updateState();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, engine, updateState]);

  const handleStart = () => {
    setGameStarted(true);
  };

  const handleThrow = () => {
    if (state.phase !== 'aiming') return;
    engine.throw(power, angle, spin);
    setIsCharging(false);
  };

  const handleRestart = () => {
    engine.reset();
    setPower(15);
    setAngle(0);
    setSpin(0);
    setIsCharging(false);
  };

  const handleExit = () => {
    navigate('/');
  };

  const handlePowerChange = (delta: number) => {
    if (state.phase !== 'aiming') return;
    setPower(prev => Math.max(8, Math.min(25, prev + delta)));
  };

  const handleAngleChange = (delta: number) => {
    if (state.phase !== 'aiming') return;
    setAngle(prev => Math.max(-5, Math.min(5, prev + delta)));
  };

  const handleSpinChange = (delta: number) => {
    if (state.phase !== 'aiming') return;
    setSpin(prev => Math.max(-3, Math.min(3, prev + delta)));
  };

  const renderPin = (pin: Pin) => {
    const isFallen = !pin.isStanding;
    
    return (
      <motion.div
        key={pin.id}
        className="absolute rounded-full"
        style={{
          left: pin.x - pin.radius,
          top: pin.y - pin.radius,
          width: pin.radius * 2,
          height: pin.radius * 2,
          backgroundColor: '#ffffff',
          border: '2px solid #cccccc',
          boxShadow: isFallen ? '0 2px 4px rgba(0,0,0,0.3)' : '0 0 10px rgba(255,255,255,0.5)',
          opacity: isFallen && pin.fallenFrames > 30 ? 0.3 : 1,
        }}
        animate={{
          rotate: pin.rotation,
          x: isFallen ? pin.vx * 2 : 0,
          y: isFallen ? pin.vy * 2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Pin stripe */}
        <div 
          className="absolute w-full h-1 rounded-full"
          style={{ 
            top: '30%', 
            backgroundColor: '#ff0000',
          }}
        />
      </motion.div>
    );
  };

  const renderBall = () => {
    const { ball, phase } = state;
    
    return (
      <motion.div
        className="absolute rounded-full"
        style={{
          left: ball.x - ball.radius,
          top: ball.y - ball.radius,
          width: ball.radius * 2,
          height: ball.radius * 2,
          background: 'radial-gradient(circle at 30% 30%, #4a90d9, #1a5490)',
          border: '3px solid #0d3a6e',
          boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(0,0,0,0.3)',
        }}
        animate={{
          rotate: ball.rotation,
        }}
      >
        {/* Finger holes */}
        {phase !== 'rolling' && (
          <>
            <div 
              className="absolute rounded-full bg-gray-800"
              style={{ 
                width: 5, 
                height: 5, 
                top: '25%', 
                left: '30%',
              }}
            />
            <div 
              className="absolute rounded-full bg-gray-800"
              style={{ 
                width: 5, 
                height: 5, 
                top: '25%', 
                right: '30%',
              }}
            />
            <div 
              className="absolute rounded-full bg-gray-800"
              style={{ 
                width: 5, 
                height: 5, 
                bottom: '30%', 
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </>
        )}
      </motion.div>
    );
  };

  const renderLane = () => {
    const laneY = engine.getLaneY();
    const { width } = engine.getCanvasSize();
    
    return (
      <svg className="absolute inset-0" width={width} height={state.laneY + 100}>
        {/* Lane */}
        <rect
          x={50}
          y={0}
          width={width - 100}
          height={laneY + 50}
          fill="#d4a76a"
          stroke="#8b6914"
          strokeWidth={2}
        />
        
        {/* Lane boards */}
        {Array.from({ length: 18 }).map((_, i) => (
          <line
            key={i}
            x1={50 + i * 22}
            y1={0}
            x2={50 + i * 22}
            y2={laneY + 50}
            stroke="#c49a5a"
            strokeWidth={1}
          />
        ))}
        
        {/* Arrows */}
        {[200, 250, 300, 350, 400].map((y, i) => (
          <g key={i}>
            <polygon
              points={`225,${y} 240,${y - 15} 255,${y}`}
              fill="#8b4513"
              opacity={i === 2 ? 1 : 0.6}
            />
            <polygon
              points={`245,${y} 260,${y - 15} 275,${y}`}
              fill="#8b4513"
              opacity={i === 1 || i === 2 || i === 3 ? 0.6 : 0}
            />
          </g>
        ))}
        
        {/* Gutters */}
        <rect x={30} y={0} width={20} height={laneY + 50} fill="#333" />
        <rect x={width - 50} y={0} width={20} height={laneY + 50} fill="#333" />
        
        {/* Foul line */}
        <line
          x1={50}
          y1={laneY}
          x2={width - 50}
          y2={laneY}
          stroke="#ff0000"
          strokeWidth={3}
        />
        
        {/* Approach dots */}
        {[125, 175, 225, 275, 325, 375, 425, 475].map((y, i) => (
          <circle
            key={i}
            cx={width / 2}
            cy={laneY + 30 + (i % 2) * 20}
            r={3}
            fill="#ffffff"
            opacity={0.5}
          />
        ))}
      </svg>
    );
  };

  const renderPinDeck = () => {
    const { width } = engine.getCanvasSize();
    
    return (
      <svg className="absolute" style={{ left: 0, top: 0, width, height: 150 }}>
        {/* Pin deck area */}
        <rect
          x={50}
          y={0}
          width={width - 100}
          height={120}
          fill="#2a5298"
          rx={10}
        />
        
        {/* Head pin marker */}
        <circle
          cx={width / 2}
          cy={20}
          r={5}
          fill="#ffffff"
          opacity={0.8}
        />
      </svg>
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
        <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.primary }}>
          保龄球大师
        </h2>
        <p className="text-lg opacity-70" style={{ color: NEON_COLORS.text }}>
          Bowling Master
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
            backgroundColor: NEON_COLORS.primary,
            color: NEON_COLORS.text,
            boxShadow: `0 0 20px ${NEON_COLORS.primary}`,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          开始游戏
        </motion.button>

        <div className="text-center opacity-70 text-sm" style={{ color: NEON_COLORS.text }}>
          <p>调整力量、角度和旋转</p>
          <p>投出完美的球!</p>
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
      <div className="flex items-center justify-between w-full max-w-[520px] px-4">
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

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>回合</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.primary }}>{state.frame}/10</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>投球</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.secondary }}>
              {state.throwNumber === 1 ? '第一' : state.throwNumber === 2 ? '第二' : '奖励'}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.text }}>分数</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.score}</div>
        </div>
      </div>

      {/* Score display */}
      <div className="flex gap-1">
        {state.currentScores.map((s, i) => (
          <div
            key={i}
            className="w-8 h-10 rounded flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.primary}40`,
              color: s >= 10 ? NEON_COLORS.success : NEON_COLORS.accent,
            }}
          >
            {s}
          </div>
        ))}
        {Array.from({ length: Math.max(0, 10 - state.currentScores.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-8 h-10 rounded flex items-center justify-center text-sm"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.primary}40`,
              opacity: 0.3,
            }}
          >
            -
          </div>
        ))}
      </div>

      {/* Game Canvas */}
      <div
        className="relative rounded-xl overflow-hidden select-none"
        style={{
          width,
          height,
          backgroundColor: '#1a1a2e',
          boxShadow: `0 0 30px ${NEON_COLORS.primary}30`,
          border: `2px solid ${NEON_COLORS.primary}40`,
        }}
      >
        {/* Pin deck */}
        {renderPinDeck()}

        {/* Lane */}
        {renderLane()}

        {/* Pins */}
        {state.pins.map(pin => renderPin(pin))}

        {/* Ball */}
        {renderBall()}

        {/* Power indicator */}
        {state.phase === 'aiming' && (
          <div 
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-4 rounded-full overflow-hidden"
            style={{ backgroundColor: NEON_COLORS.surface }}
          >
            <motion.div
              className="h-full"
              style={{
                width: `${((power - 8) / 17) * 100}%`,
                backgroundColor: power > 20 ? NEON_COLORS.danger : power > 15 ? NEON_COLORS.warning : NEON_COLORS.success,
              }}
              animate={{ width: `${((power - 8) / 17) * 100}%` }}
            />
          </div>
        )}

        {/* Angle indicator */}
        {state.phase === 'aiming' && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span style={{ color: NEON_COLORS.text, fontSize: 12 }}>角度:</span>
            <span style={{ color: NEON_COLORS.primary, fontWeight: 'bold' }}>
              {angle > 0 ? '+' : ''}{angle.toFixed(1)}
            </span>
          </div>
        )}

        {/* Game over overlay */}
        {state.phase === 'gameover' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.success }}>
              游戏结束!
            </div>
            <div className="text-3xl mb-2" style={{ color: NEON_COLORS.accent }}>
              最终分数: {state.score}
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
                backgroundColor: NEON_COLORS.primary,
                color: NEON_COLORS.text,
                boxShadow: `0 0 20px ${NEON_COLORS.primary}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再玩一次
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      {state.phase === 'aiming' && (
        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="flex items-center gap-8">
            {/* Power control */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm" style={{ color: NEON_COLORS.text }}>力量</span>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => handlePowerChange(-1)}
                  className="w-10 h-10 rounded-lg font-bold text-xl"
                  style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.primary }}
                  whileTap={{ scale: 0.9 }}
                >
                  -
                </motion.button>
                <div className="w-16 h-10 rounded-lg flex items-center justify-center font-bold" 
                     style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.accent }}>
                  {power}
                </div>
                <motion.button
                  onClick={() => handlePowerChange(1)}
                  className="w-10 h-10 rounded-lg font-bold text-xl"
                  style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.primary }}
                  whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* Angle control */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm" style={{ color: NEON_COLORS.text }}>角度</span>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleAngleChange(-0.5)}
                  className="w-10 h-10 rounded-lg font-bold text-xl"
                  style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.secondary }}
                  whileTap={{ scale: 0.9 }}
                >
                  ◀
                </motion.button>
                <div className="w-16 h-10 rounded-lg flex items-center justify-center font-bold" 
                     style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.accent }}>
                  {angle > 0 ? '+' : ''}{angle.toFixed(1)}
                </div>
                <motion.button
                  onClick={() => handleAngleChange(0.5)}
                  className="w-10 h-10 rounded-lg font-bold text-xl"
                  style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.secondary }}
                  whileTap={{ scale: 0.9 }}
                >
                  ▶
                </motion.button>
              </div>
            </div>

            {/* Spin control */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm" style={{ color: NEON_COLORS.text }}>旋转</span>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleSpinChange(-0.5)}
                  className="w-10 h-10 rounded-lg font-bold text-xl"
                  style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.warning }}
                  whileTap={{ scale: 0.9 }}
                >
                  ◀
                </motion.button>
                <div className="w-16 h-10 rounded-lg flex items-center justify-center font-bold" 
                     style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.accent }}>
                  {spin > 0 ? '+' : ''}{spin.toFixed(1)}
                </div>
                <motion.button
                  onClick={() => handleSpinChange(0.5)}
                  className="w-10 h-10 rounded-lg font-bold text-xl"
                  style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.warning }}
                  whileTap={{ scale: 0.9 }}
                >
                  ▶
                </motion.button>
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleThrow}
            className="px-16 py-4 rounded-xl text-2xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.success,
              color: NEON_COLORS.text,
              boxShadow: `0 0 20px ${NEON_COLORS.success}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            投球!
          </motion.button>
        </div>
      )}

      {state.phase !== 'aiming' && state.phase !== 'gameover' && (
        <div className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>
          等待球停下...
        </div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.text }}>
        <div>调整力量、角度和旋转来投出完美的球</div>
        <div>全中可获得奖励球!</div>
      </div>
    </div>
  );
};

export default BowlingMaster;
