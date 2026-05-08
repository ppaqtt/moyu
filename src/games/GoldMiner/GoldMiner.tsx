import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameGoldMinerEngine, Collectible } from './engine';

interface GoldMinerProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;

const ITEM_COLORS = {
  gold_small: '#ffd700',
  gold_large: '#ffa500',
  diamond: '#00ffff',
  rock: '#808080'
};

const ITEM_EMOJIS = {
  gold_small: '🪙',
  gold_large: '💰',
  diamond: '💎',
  rock: '🪨'
};

export default function GoldMiner({ onScoreUpdate, onGameOver, onExit }: GoldMinerProps) {
  const [engine] = useState(() => new GameGoldMinerEngine());
  const [claw, setClaw] = useState(() => engine.getState().claw);
  const [collectibles, setCollectibles] = useState<Collectible[]>(() => engine.getState().collectibles);
  const [money, setMoney] = useState(() => engine.getState().money);
  const [targetMoney, setTargetMoney] = useState(() => engine.getState().targetMoney);
  const [timeLeft, setTimeLeft] = useState(() => engine.getState().timeLeft);
  const [isGameOver, setIsGameOver] = useState(false);
  const [round, setRound] = useState(() => engine.getState().round);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GOLD_MINER);
  const keysPressed = useRef<Set<string>>(new Set());

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setClaw({ ...state.claw });
    setCollectibles([...state.collectibles]);
    setMoney(state.money);
    setTimeLeft(state.timeLeft);

    if (state.money >= state.targetMoney && state.timeLeft > 0) {
      setRound(state.round);
      setTargetMoney(state.targetMoney);
    }

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.money);
      onGameOver(state.money);
    }
  }, [engine, onGameOver, updateScore]);

  useEffect(() => {
    const interval = setInterval(handleTick, 16);
    return () => clearInterval(interval);
  }, [handleTick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keysPressed.current.has(e.key)) return;
      keysPressed.current.add(e.key);

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.rotateLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.rotateRight();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engine.extend();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        engine.retract();
      } else if (e.key === ' ') {
        e.preventDefault();
        engine.extend();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setClaw({ ...state.claw });
    setCollectibles([...state.collectibles]);
    setMoney(state.money);
    setTargetMoney(state.targetMoney);
    setTimeLeft(state.timeLeft);
    setRound(state.round);
    setIsGameOver(false);
    onScoreUpdate(state.money);
  }, [engine, onScoreUpdate]);

  const renderItem = (item: Collectible) => {
    const isGrabbed = item.grabbed && claw.grabbedItem === item;

    return (
      <motion.div
        key={`item-${item.x}-${item.y}`}
        className="absolute flex items-center justify-center text-3xl"
        animate={isGrabbed ? { scale: 1.1 } : { scale: 1 }}
        style={{
          left: item.x - item.width / 2,
          top: item.y - item.height / 2,
          width: item.width,
          height: item.height,
          filter: `drop-shadow(0 0 10px ${ITEM_COLORS[item.type]})`,
          opacity: isGrabbed ? 1 : 0.9
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            backgroundColor: ITEM_COLORS[item.type],
            boxShadow: `0 0 15px ${ITEM_COLORS[item.type]}`,
            transform: item.type === 'rock' ? 'none' : 'rotate(45deg)'
          }}
        />
        <span className="absolute text-2xl">{ITEM_EMOJIS[item.type]}</span>
      </motion.div>
    );
  };

  const clawEndX = claw.x + Math.cos((claw.angle * Math.PI) / 180) * claw.length;
  const clawEndY = claw.y + Math.sin((claw.angle * Math.PI) / 180) * claw.length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
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
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>当前金钱</div>
          <div className="text-3xl font-bold" style={{ color: '#ffd700' }}>${money}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高记录</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>${record.bestScore}</div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>关卡</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{round}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>目标</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>${targetMoney}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>剩余时间</div>
          <div className="text-xl font-bold" style={{ color: timeLeft <= 10 ? '#e74c3c' : NEON_COLORS.neonBlue }}>
            {timeLeft}s
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
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: `linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #8B4513 30%, #654321 100%)`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1/4"
          style={{
            background: 'linear-gradient(180deg, #2c3e50 0%, #1a1a2e 100%)'
          }}
        />

        <div
          className="absolute"
          style={{
            left: claw.x - 30,
            top: 0,
            width: 60,
            height: 40,
            backgroundColor: '#555',
            borderRadius: '0 0 10px 10px'
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full"
            style={{
              backgroundColor: '#ff2e63',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 10px #ff2e63'
            }}
          />
        </div>

        <svg
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT
          }}
        >
          <line
            x1={claw.x}
            y1={claw.y}
            x2={clawEndX}
            y2={clawEndY}
            stroke={claw.grabbedItem ? '#ffd700' : '#666'}
            strokeWidth={3}
          />

          {claw.grabbedItem && (
            <>
              <line
                x1={clawEndX - 10}
                y1={clawEndY}
                x2={clawEndX}
                y2={clawEndY + 10}
                stroke="#ffd700"
                strokeWidth={2}
              />
              <line
                x1={clawEndX + 10}
                y1={clawEndY}
                x2={clawEndX}
                y2={clawEndY + 10}
                stroke="#ffd700"
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {collectibles.map(renderItem)}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              {money >= targetMoney ? '🎉 恭喜过关!' : '⏰ 时间到!'}
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              获得金钱: ${money}
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              到达关卡: {round}
            </div>
            <div className="flex gap-4">
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
                再玩一次
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
                返回首页
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-4 mt-4">
        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => engine.rotateLeft()}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
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
          <span className="text-xs" style={{ color: NEON_COLORS.gold }}>左转</span>
        </div>

        <div className="flex flex-col gap-2">
          <motion.button
            onClick={() => engine.extend()}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.neonPink,
              color: NEON_COLORS.white,
              boxShadow: `0 0 15px ${NEON_COLORS.neonPink}`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ⬇️
          </motion.button>
          <span className="text-xs text-center" style={{ color: NEON_COLORS.gold }}>伸出<br/>收回</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => engine.rotateRight()}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
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
          <span className="text-xs" style={{ color: NEON_COLORS.gold }}>右转</span>
        </div>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 或 A D 旋转爪</div>
        <div>↓ 或 S 伸出爪 | ↑ 或 W 收回爪</div>
      </div>
    </div>
  );
}
