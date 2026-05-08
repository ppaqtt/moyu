import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameCrossCodeEngine, Player, Enemy, Item } from './engine';

interface CrossCodeProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 40;
const ENEMY_SIZE = 35;

export default function CrossCode({ onScoreUpdate, onGameOver, onExit }: CrossCodeProps) {
  const [engine] = useState(() => new GameCrossCodeEngine());
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [items, setItems] = useState<Item[]>(() => engine.getState().items);
  const [score, setScore] = useState(() => engine.getState().score);
  const [level, setLevel] = useState(() => engine.getState().level);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.CROSSCODE);
  const keysPressed = useRef<Set<string>>(new Set());

  const handleTick = useCallback(() => {
    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || keysPressed.current.has('A')) {
      engine.moveLeft();
    }
    if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) {
      engine.moveRight();
    }
    if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W') || keysPressed.current.has(' ')) {
      engine.jump();
    }
    if (keysPressed.current.has('j') || keysPressed.current.has('J')) {
      engine.attack();
    }

    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setItems([...state.items]);
    setScore(state.score);
    setLevel(state.level);
    setIsLevelUp(state.isLevelUp);
    onScoreUpdate(state.score);

    if (state.isGameOver && !isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, isGameOver]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: true });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (!isStarted && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        engine.start();
        setIsStarted(true);
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
  }, [engine, isStarted]);

  const handleRestart = () => {
    engine.reset();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setItems([...state.items]);
    setScore(state.score);
    setLevel(state.level);
    setIsStarted(false);
    setIsGameOver(false);
    onScoreUpdate(0);
  };

  const renderPlayer = () => {
    const flipX = player.direction === 'left' ? -1 : 1;
    const opacity = player.invincible ? (Math.floor(Date.now() / 100) % 2 ? 0.5 : 1) : 1;

    return (
      <motion.div
        className="absolute"
        style={{
          left: player.x - PLAYER_SIZE / 2,
          top: player.y - PLAYER_SIZE,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE,
          opacity
        }}
        animate={{ scaleX: flipX }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <svg viewBox="0 0 40 50" width={PLAYER_SIZE} height={PLAYER_SIZE + 10}>
          <rect x="15" y="2" width="10" height="10" rx="2" fill="#3498db" />
          <rect x="12" y="12" width="16" height="18" rx="2" fill="#2ecc71" />
          <rect x="5" y="14" width="8" height="12" rx="2" fill="#f39c12" />
          <rect x="27" y="14" width="8" height="12" rx="2" fill="#f39c12"
                style={{ transform: player.isAttacking ? 'rotate(-45deg)' : 'none', transformOrigin: 'center' }} />
          <rect x="12" y="30" width="7" height="15" rx="2" fill="#2ecc71" />
          <rect x="21" y="30" width="7" height="15" rx="2" fill="#2ecc71" />
        </svg>

        {player.isAttacking && (
          <motion.div
            className="absolute"
            style={{
              left: player.direction === 'right' ? PLAYER_SIZE : -60,
              top: 0,
              width: 60,
              height: 30,
              background: 'linear-gradient(90deg, transparent, #ffff00, transparent)',
              opacity: 0.8
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </motion.div>
    );
  };

  const renderEnemy = (enemy: Enemy, index: number) => {
    if (enemy.type === 'slime') {
      return (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: enemy.x - ENEMY_SIZE / 2,
            top: enemy.y,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE
          }}
          animate={{ y: enemy.y + Math.sin(Date.now() / 200 + index) * 5 }}
        >
          <svg viewBox="0 0 40 40" width={ENEMY_SIZE} height={ENEMY_SIZE}>
            <ellipse cx="20" cy="25" rx="18" ry="12" fill="#9b59b6" />
            <ellipse cx="20" cy="20" rx="16" ry="14" fill="#8e44ad" />
            <circle cx="14" cy="16" r="4" fill="white" />
            <circle cx="26" cy="16" r="4" fill="white" />
            <circle cx="14" cy="16" r="2" fill="black" />
            <circle cx="26" cy="16" r="2" fill="black" />
          </svg>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                backgroundColor: '#e74c3c'
              }}
            />
          </div>
        </motion.div>
      );
    } else {
      return (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: enemy.x - ENEMY_SIZE / 2,
            top: enemy.y,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE
          }}
          animate={{ x: enemy.x + Math.sin(Date.now() / 500 + index) * 10 }}
        >
          <svg viewBox="0 0 40 40" width={ENEMY_SIZE} height={ENEMY_SIZE}>
            <ellipse cx="20" cy="20" rx="15" ry="10" fill="#e74c3c" />
            <polygon points="5,20 0,10 10,20" fill="#c0392b" />
            <polygon points="35,20 40,10 30,20" fill="#c0392b" />
            <circle cx="14" cy="18" r="3" fill="white" />
            <circle cx="26" cy="18" r="3" fill="white" />
            <circle cx="14" cy="18" r="1.5" fill="black" />
            <circle cx="26" cy="18" r="1.5" fill="black" />
          </svg>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                backgroundColor: '#e74c3c'
              }}
            />
          </div>
        </motion.div>
      );
    }
  };

  const renderItem = (item: Item, index: number) => {
    return (
      <motion.div
        key={index}
        className="absolute"
        style={{
          left: item.x - 10,
          top: item.y - 10,
          width: 20,
          height: 20
        }}
        animate={{ y: item.y + Math.sin(Date.now() / 300 + index) * 5, rotate: 360 }}
        transition={{ y: { repeat: Infinity, duration: 0.5 } }}
      >
        {item.type === 'health' ? (
          <span className="text-xl">❤️</span>
        ) : (
          <span className="text-xl">✨</span>
        )}
      </motion.div>
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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>等级</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{level}</div>
          </div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>生命</div>
            <div className="w-24 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(player.health / player.maxHealth) * 100}%`,
                  backgroundColor: '#e74c3c'
                }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>经验</div>
            <div className="w-24 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(player.exp / (player.level * 100)) * 100}%`,
                  backgroundColor: '#f39c12'
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
          </div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: `
            linear-gradient(180deg, #1a1a2e 0%, #16213e 100%),
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px)
          `,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[80px]" style={{ backgroundColor: '#27ae60' }}>
          <div className="absolute top-0 left-0 right-0 h-4" style={{ backgroundColor: '#1e8449' }} />
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute bottom-2 w-6 h-8 rounded-full" style={{
              left: 20 + i * 30,
              backgroundColor: '#2ecc71',
              opacity: 0.5 + Math.sin(i) * 0.3
            }} />
          ))}
        </div>

        {renderPlayer()}
        {enemies.map(renderEnemy)}
        {items.map(renderItem)}

        <div className="absolute top-4 left-4 text-xs p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: NEON_COLORS.gold }}>
          <div>← → 或 A D 移动</div>
          <div>↑ 或 W 或空格 跳跃</div>
          <div>J 攻击</div>
        </div>

        {!isStarted && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-4">⚔️</div>
            <div className="text-3xl font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>
              CrossCode
            </div>
            <div className="text-lg mb-4" style={{ color: NEON_COLORS.gold }}>
              复古像素风动作 RPG
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
              开始冒险
            </motion.button>
          </motion.div>
        )}

        {isLevelUp && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: '#f39c12' }}>
              ⬆️ 升级!
            </div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>
              等级 {level}
            </div>
            <motion.button
              onClick={() => engine.dismissLevelUp()}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: '#f39c12',
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px #f39c12`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              继续战斗
            </motion.button>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              💀 游戏结束
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              最终得分: {score}
            </div>
            <div className="text-xl mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              最高: {record.bestScore}
            </div>
            <motion.button
              onClick={handleRestart}
              className="px-8 py-4 rounded-xl text-xl font-bold"
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
          </motion.div>
        )}
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>消灭敌人获得经验和分数，收集掉落物品恢复生命</div>
        <div>升级提升属性，继续挑战更强大的敌人!</div>
      </div>
    </div>
  );
}
