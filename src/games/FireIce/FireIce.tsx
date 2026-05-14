import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameFireIceEngine, Character } from './engine';

interface FireIceProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const TILE_SIZE = 50;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 8;

export default function FireIce({ onScoreUpdate, onGameOver, onExit }: FireIceProps) {
  const [engine] = useState(() => new GameFireIceEngine());
  const [fire, setFire] = useState(() => engine.getState().fire);
  const [ice, setIce] = useState(() => engine.getState().ice);
  const [level, setLevel] = useState(() => engine.getState().level);
  const [levelNumber, setLevelNumber] = useState(() => engine.getState().levelNumber);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isComplete, setIsComplete] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.FIRE_ICE);

  const updateState = useCallback(() => {
    const state = engine.getState();
    setFire({ ...state.fire });
    setIce({ ...state.ice });
    setLevel({ ...state.level });
    setLevelNumber(state.levelNumber);
    setScore(state.score);
    setIsComplete(state.isComplete);
    onScoreUpdate(state.score);

    if (state.isComplete) {
      updateScore(state.score);
    }
  }, [engine, onScoreUpdate, updateScore]);

  const handleFireMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    engine.moveFire(direction);
    updateState();
    const state = engine.getState();
    if (state.isGameOver) {
      onGameOver(state.score);
    }
  }, [engine, updateState, onGameOver]);

  const handleIceMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    engine.moveIce(direction);
    updateState();
    const state = engine.getState();
    if (state.isGameOver) {
      onGameOver(state.score);
    }
  }, [engine, updateState, onGameOver]);

  const handleRestart = useCallback(() => {
    engine.restartLevel();
    updateState();
  }, [engine, updateState]);

  const handleReset = useCallback(() => {
    engine.reset();
    updateState();
  }, [engine, updateState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          handleFireMove('up');
          break;
        case 's':
          handleFireMove('down');
          break;
        case 'a':
          handleFireMove('left');
          break;
        case 'd':
          handleFireMove('right');
          break;
        case 'arrowup':
          handleIceMove('up');
          break;
        case 'arrowdown':
          handleIceMove('down');
          break;
        case 'arrowleft':
          handleIceMove('left');
          break;
        case 'arrowright':
          handleIceMove('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleFireMove, handleIceMove]);

  const renderTile = (x: number, y: number) => {
    const isWall = level.walls.some(w => w.x === x && w.y === y);
    const door = level.doors.find(d => d.x === x && d.y === y);
    const collectible = level.collectibles.find(c => c.x === x && c.y === y);
    const isExit = level.exit.x === x && level.exit.y === y;

    if (isWall) {
      return (
        <div
          key={`tile-${x}-${y}`}
          className="absolute"
          style={{
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            backgroundColor: '#4a5568',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }}
        />
      );
    }

    if (door) {
      return (
        <div
          key={`tile-${x}-${y}`}
          className="absolute flex items-center justify-center"
          style={{
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            backgroundColor: door.isOpen ? 'transparent' : 
              door.color === 'fire' ? '#e74c3c' : 
              door.color === 'ice' ? '#3498db' : '#9b59b6',
            border: door.isOpen ? 'none' : `3px solid ${door.color === 'fire' ? '#ff6b6b' : door.color === 'ice' ? '#74b9ff' : '#a29bfe'}`,
            boxShadow: door.isOpen ? 'none' : `0 0 15px ${door.color === 'fire' ? '#e74c3c' : door.color === 'ice' ? '#3498db' : '#9b59b6'}`
          }}
        >
          {!door.isOpen && door.color === 'fire' && '🔥'}
          {!door.isOpen && door.color === 'ice' && '❄️'}
        </div>
      );
    }

    if (collectible && !collectible.collected) {
      return (
        <motion.div
          key={`tile-${x}-${y}`}
          className="absolute flex items-center justify-center text-3xl"
          style={{
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {collectible.type === 'fire' && '🔥'}
          {collectible.type === 'ice' && '❄️'}
          {collectible.type === 'both' && '✨'}
        </motion.div>
      );
    }

    if (isExit) {
      return (
        <div
          key={`tile-${x}-${y}`}
          className="absolute flex items-center justify-center text-2xl"
          style={{
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            backgroundColor: '#2ecc71',
            borderRadius: '50%',
            boxShadow: '0 0 20px #2ecc71'
          }}
        >
          🚪
        </div>
      );
    }

    return (
      <div
        key={`tile-${x}-${y}`}
        className="absolute"
        style={{
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: '#1a1a2e'
        }}
      />
    );
  };

  const renderCharacter = (character: Character, emoji: string, color: string) => {
    if (character.isDead) {
      return (
        <motion.div
          key={character.type}
          className="absolute flex items-center justify-center text-3xl"
          style={{
            left: character.x * TILE_SIZE,
            top: character.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            opacity: 0.5
          }}
          animate={{ rotate: 360 }}
        >
          💀
        </motion.div>
      );
    }

    return (
      <motion.div
        key={character.type}
        className="absolute flex items-center justify-center text-3xl"
        style={{
          left: character.x * TILE_SIZE,
          top: character.y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          zIndex: 10
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}`
          }}
        >
          {emoji}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[550px] px-4">
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
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>关卡</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{levelNumber + 1}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-2">
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
          重玩关卡
        </motion.button>

        <motion.button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            border: `1px solid ${NEON_COLORS.neonBlue}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重新开始
        </motion.button>
      </div>

      <div className="flex gap-8">
        <div className="text-center">
          <div className="text-sm mb-1" style={{ color: NEON_COLORS.gold }}>🔥 火人</div>
          <div className="text-xs" style={{ color: '#e74c3c' }}>W A S D</div>
        </div>
        <div className="text-center">
          <div className="text-sm mb-1" style={{ color: NEON_COLORS.gold }}>❄️ 冰人</div>
          <div className="text-xs" style={{ color: '#3498db' }}>方向键</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: GRID_WIDTH * TILE_SIZE,
          height: GRID_HEIGHT * TILE_SIZE,
          backgroundColor: NEON_COLORS.primary,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        {Array.from({ length: GRID_WIDTH }).map((_, x) =>
          Array.from({ length: GRID_HEIGHT }).map((_, y) => renderTile(x, y))
        )}
        {renderCharacter(fire, '🔥', '#e74c3c')}
        {renderCharacter(ice, '❄️', '#3498db')}
      </div>

      <div className="flex gap-4 mt-2">
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs" style={{ color: NEON_COLORS.gold }}>火人</div>
            <div className="flex gap-1">
              {['W', 'A', 'S', 'D'].map((key, i) => (
                <motion.button
                  key={key}
                  onClick={() => handleFireMove(['up', 'left', 'down', 'right'][i] as 'up')}
                  className="w-10 h-10 rounded font-bold text-sm flex items-center justify-center"
                  style={{ backgroundColor: '#e74c3c40', color: '#e74c3c' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {key}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs" style={{ color: NEON_COLORS.gold }}>冰人</div>
            <div className="flex gap-1">
              {['↑', '←', '↓', '→'].map((key, i) => (
                <motion.button
                  key={key}
                  onClick={() => handleIceMove(['up', 'left', 'down', 'right'][i] as 'up')}
                  className="w-10 h-10 rounded font-bold text-sm flex items-center justify-center"
                  style={{ backgroundColor: '#3498db40', color: '#3498db' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {key}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.gold, opacity: 0.7 }}>
        <div>收集对应宝石开启对应门</div>
        <div>火人需要收集🔥 冰人需要收集❄️</div>
        <div>两人同时到达出口即可过关!</div>
      </div>

      {engine.getState().isGameOver && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center p-8 rounded-2xl"
            style={{ backgroundColor: NEON_COLORS.darkPurple }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ 
              color: isComplete ? NEON_COLORS.neonBlue : NEON_COLORS.neonPink 
            }}>
              {isComplete ? '🎉 全部通关!' : '💥 失败了'}
            </div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>
              最终得分: {score}
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={handleReset}
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
                  backgroundColor: 'transparent',
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
        </motion.div>
      )}
    </div>
  );
}
