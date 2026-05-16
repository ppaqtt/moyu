import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { Game1v1Engine, Player, Bullet } from './engine';

interface OneVOneProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 40;

export default function OneVOne({ onScoreUpdate, onGameOver, onExit }: OneVOneProps) {
  const [engine] = useState(() => new Game1v1Engine());
  const [state, setState] = useState(() => engine.getState());
  const [isStarted, setIsStarted] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.ONEVONE);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const gameLoop = () => {
      if (isStarted && !state.roundWinner) {
        if (keysPressed.current.has('a') || keysPressed.current.has('A')) {
          engine.player1MoveLeft();
        }
        if (keysPressed.current.has('d') || keysPressed.current.has('D')) {
          engine.player1MoveRight();
        }
        if (keysPressed.current.has('w') || keysPressed.current.has('W')) {
          engine.player1Jump();
        }
        if (keysPressed.current.has('q') || keysPressed.current.has('Q')) {
          engine.player1AimUp();
        }
        if (keysPressed.current.has('e') || keysPressed.current.has('E')) {
          engine.player1AimDown();
        }
        if (keysPressed.current.has('f') || keysPressed.current.has('F')) {
          engine.player1Shoot();
        }

        if (keysPressed.current.has('ArrowLeft')) {
          engine.player2MoveLeft();
        }
        if (keysPressed.current.has('ArrowRight')) {
          engine.player2MoveRight();
        }
        if (keysPressed.current.has('ArrowUp')) {
          engine.player2Jump();
        }
        if (keysPressed.current.has('u') || keysPressed.current.has('U')) {
          engine.player2AimUp();
        }
        if (keysPressed.current.has('o') || keysPressed.current.has('O')) {
          engine.player2AimDown();
        }
        if (keysPressed.current.has(' ') || keysPressed.current.has('Spacebar') || keysPressed.current.has('Space')) {
          engine.player2Shoot();
        }

        engine.tick();
        const newState = engine.getState();
        setState(newState);
        onScoreUpdate(newState.scores.player1);

        if (newState.roundWinner) {
          updateScore(newState.scores.player1);
        }
      }
      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [engine, isStarted, state.roundWinner, onScoreUpdate, updateScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      keysPressed.current.add(e.key.toLowerCase());
      if (!isStarted && !state.roundWinner && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space')) {
        e.preventDefault();
        engine.start();
        setIsStarted(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [engine, isStarted, state.roundWinner]);

  const handleRestart = () => {
    engine.reset();
    setState(engine.getState());
    setIsStarted(false);
    onScoreUpdate(0);
  };

  const handleNextRound = () => {
    engine.nextRound();
    setState(engine.getState());
  };

  const renderPlayer = (player: Player, isPlayer1: boolean) => {
    const color = isPlayer1 ? '#3498db' : '#e74c3c';
    const aimRad = (player.angle * Math.PI) / 180;
    const aimLength = 50;

    return (
      <div className="absolute" style={{
        left: player.x - PLAYER_SIZE / 2,
        top: player.y - PLAYER_SIZE
      }}>
        <svg width={PLAYER_SIZE} height={PLAYER_SIZE + 20} viewBox="0 0 40 60">
          <circle cx="20" cy="12" r="10" fill={color} />
          <rect x="10" y="22" width="20" height="25" rx="3" fill={color} />
          <rect x="5" y="24" width="8" height="15" rx="2" fill={color} />
          <rect x="27" y="24" width="8" height="15" rx="2" fill={color} />
          <rect x="10" y="47" width="8" height="13" rx="2" fill={color} />
          <rect x="22" y="47" width="8" height="13" rx="2" fill={color} />
        </svg>

        <svg
          width={aimLength + 10}
          height={40}
          style={{
            position: 'absolute',
            left: PLAYER_SIZE / 2,
            top: 5,
            transformOrigin: '0 20px',
            transform: `rotate(${player.angle}deg)`
          }}
        >
          <line x1="0" y1="20" x2={aimLength} y2="20" stroke={color} strokeWidth="4" />
          <polygon points={`${aimLength},15 ${aimLength + 10},20 ${aimLength},25`} fill={color} />
        </svg>

        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap" style={{ color }}>
          {isPlayer1 ? 'P1' : 'P2'}
        </div>

        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${player.health}%`,
              backgroundColor: player.health > 50 ? '#27ae60' : player.health > 25 ? '#f39c12' : '#e74c3c'
            }}
          />
        </div>
      </div>
    );
  };

  const renderBullet = (bullet: Bullet) => {
    const color = bullet.owner === 'player1' ? '#3498db' : '#e74c3c';
    return (
      <motion.div
        key={`${bullet.x}-${bullet.y}`}
        className="absolute rounded-full"
        style={{
          left: bullet.x - 4,
          top: bullet.y - 4,
          width: 8,
          height: 8,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[820px] px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>玩家1</div>
            <div className="text-2xl font-bold" style={{ color: '#3498db' }}>
              {state.scores.player1}
            </div>
          </div>

          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>VS</div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>玩家2</div>
            <div className="text-2xl font-bold" style={{ color: '#e74c3c' }}>
              {state.scores.player2}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[60px]" style={{ backgroundColor: '#1a1a2e' }}>
          <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: '#27ae60' }} />
        </div>

        {renderPlayer(state.player1, true)}
        {renderPlayer(state.player2, false)}
        {state.bullets.map(renderBullet)}

        <div className="absolute bottom-2 left-2 text-xs p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#3498db' }}>
          <div>P1: WASD移动 Q/E瞄准 F射击</div>
        </div>
        <div className="absolute bottom-2 right-2 text-xs p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#e74c3c' }}>
          <div>P2: 方向键移动 U/O瞄准 空格射击</div>
        </div>

        {!isStarted && !state.roundWinner && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-4">🎯</div>
            <div className="text-3xl font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>
              1v1 对战
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.gold }}>
              双人同屏对战射击游戏
            </div>
            <motion.button
              onClick={() => {
                engine.start();
                setIsStarted(true);
              }}
              className="px-8 py-4 rounded-xl text-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始对战
            </motion.button>
          </motion.div>
        )}

        {state.roundWinner && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{
              color: state.roundWinner === 'player1' ? '#3498db' : '#e74c3c'
            }}>
              {state.roundWinner === 'player1' ? '🏆 玩家1胜利!' : '🏆 玩家2胜利!'}
            </div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>
              {state.scores.player1} - {state.scores.player2}
            </div>
            <div className="flex gap-4">
              {state.roundWinner === 'player1' && (
                <motion.button
                  onClick={handleNextRound}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    backgroundColor: '#3498db',
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 20px #3498db`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  下一局
                </motion.button>
              )}
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                重新开始
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>两个玩家在同一键盘上对战!</div>
        <div>控制你的角色瞄准射击，先把对方血量打到0获胜</div>
      </div>
    </div>
  );
}
