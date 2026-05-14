import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameSketchoutEngine, Projectile, Tank } from './engine';

interface SketchoutProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const TANK_SIZE = 40;

export default function Sketchout({ onScoreUpdate, onGameOver, onExit }: SketchoutProps) {
  const [engine] = useState(() => new GameSketchoutEngine());
  const [player, setPlayer] = useState<Tank>(() => engine.getState().player);
  const [enemy, setEnemy] = useState<Tank>(() => engine.getState().enemy);
  const [projectiles, setProjectiles] = useState<Projectile[]>(() => engine.getState().projectiles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [wind, setWind] = useState(() => engine.getState().wind);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.SKETCHOUT);
  const keysPressed = useRef<Set<string>>(new Set());

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemy({ ...state.enemy });
    setProjectiles([...state.projectiles]);
    setScore(state.score);
    setWind(state.wind);
    setWinner(state.winner);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  useEffect(() => {
    const interval = setInterval(handleTick, 16);
    return () => clearInterval(interval);
  }, [handleTick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keysPressed.current.has(e.key)) return;
      keysPressed.current.add(e.key);

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.aimLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.aimRight();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        engine.playerShoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemy({ ...state.enemy });
    setProjectiles([...state.projectiles]);
    setScore(state.score);
    setWind(state.wind);
    setWinner(null);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const handleNextRound = useCallback(() => {
    engine.nextRound();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemy({ ...state.enemy });
    setProjectiles([...state.projectiles]);
    setWinner(null);
    setIsGameOver(false);
  }, [engine]);

  const renderTank = (tank: Tank, isPlayer: boolean) => {
    const rad = (tank.angle * Math.PI) / 180;

    return (
      <div className="absolute" style={{
        left: tank.x - TANK_SIZE / 2,
        top: tank.y - TANK_SIZE,
        width: TANK_SIZE,
        height: TANK_SIZE
      }}>
        <svg
          width={TANK_SIZE}
          height={TANK_SIZE}
          style={{ transform: `rotate(${-tank.angle}deg)` }}
        >
          <rect
            x={TANK_SIZE / 4}
            y={TANK_SIZE / 4}
            width={TANK_SIZE / 2}
            height={TANK_SIZE / 2}
            fill={isPlayer ? '#27ae60' : '#e74c3c'}
            rx={5}
          />
          <rect
            x={TANK_SIZE / 2}
            y={TANK_SIZE / 2 - 5}
            width={TANK_SIZE / 2 + 10}
            height={10}
            fill={isPlayer ? '#2ecc71' : '#c0392b'}
            rx={2}
          />
        </svg>
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: '#333' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(tank.health / tank.maxHealth) * 100}%`,
              backgroundColor: tank.health > 50 ? '#27ae60' : tank.health > 25 ? '#f39c12' : '#e74c3c'
            }}
          />
        </div>
        <div
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap"
          style={{ color: isPlayer ? '#27ae60' : '#e74c3c' }}
        >
          {isPlayer ? '玩家' : '敌人'} {tank.health}%
        </div>
      </div>
    );
  };

  const renderProjectile = (proj: Projectile) => {
    return (
      <motion.div
        key={`proj-${proj.x}-${proj.y}`}
        className="absolute rounded-full"
        style={{
          left: proj.x - proj.radius,
          top: proj.y - proj.radius,
          width: proj.radius * 2,
          height: proj.radius * 2,
          backgroundColor: proj.owner === 'player' ? '#27ae60' : '#e74c3c',
          boxShadow: `0 0 15px ${proj.owner === 'player' ? '#27ae60' : '#e74c3c'}`
        }}
      />
    );
  };

  const getWindDirection = () => {
    if (wind > 0.05) return '→';
    if (wind < -0.05) return '←';
    return '・';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
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

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
          <div className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: NEON_COLORS.gold }}>风力</span>
          <span
            className="text-2xl font-bold"
            style={{
              color: Math.abs(wind) > 0.05 ? (wind > 0 ? NEON_COLORS.neonBlue : NEON_COLORS.neonPink) : NEON_COLORS.gold
            }}
          >
            {getWindDirection()} {Math.abs(wind * 100).toFixed(0)}
          </span>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <motion.button
        onClick={handleRestart}
        className="px-4 py-2 rounded-lg font-bold text-sm"
        style={{
          backgroundColor: NEON_COLORS.neonPink,
          color: NEON_COLORS.white,
          boxShadow: `0 0 10px ${NEON_COLORS.neonPink}`
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        重新开始
      </motion.button>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: 'linear-gradient(180deg, #87CEEB 0%, #98D8C8 30%, #228B22 30%, #32CD32 100%)',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div
          className="absolute top-4 text-sm font-bold px-3 py-1 rounded"
          style={{ backgroundColor: '#27ae6040', color: '#27ae60', left: 10 }}
        >
          玩家: {player.health}%
        </div>
        <div
          className="absolute top-4 text-sm font-bold px-3 py-1 rounded"
          style={{ backgroundColor: '#e74c3c40', color: '#e74c3c', right: 10 }}
        >
          敌人: {enemy.health}%
        </div>

        {renderTank(player, true)}
        {renderTank(enemy, false)}

        {projectiles.map(renderProjectile)}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{
              color: winner === 'player' ? NEON_COLORS.neonBlue : NEON_COLORS.neonPink
            }}>
              {winner === 'player' ? '🎉 胜利!' : '💥 失败!'}
            </div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>
              最终得分: {score}
            </div>
            <div className="flex gap-4">
              {winner === 'player' && (
                <motion.button
                  onClick={handleNextRound}
                  className="px-6 py-3 rounded-lg font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonBlue,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  下一轮
                </motion.button>
              )}
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一局
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                返回
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-4 mt-4">
        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => engine.aimLeft()}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ↺
          </motion.button>
          <span className="text-xs" style={{ color: NEON_COLORS.gold }}>抬高</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => engine.playerShoot()}
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.neonPink,
              color: NEON_COLORS.white,
              boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            🔫
          </motion.button>
          <span className="text-xs" style={{ color: NEON_COLORS.gold }}>发射</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => engine.aimRight()}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ↻
          </motion.button>
          <span className="text-xs" style={{ color: NEON_COLORS.gold }}>压低</span>
        </div>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 或 A D 调整角度</div>
        <div>空格或 W 发射炮弹</div>
        <div>注意风力影响弹道!</div>
      </div>
    </div>
  );
}
