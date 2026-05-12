import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CoopMazeEngine, Player } from './engine';
import { COOP_MAZE_CONSTANTS } from '../../utils/constants';

const { CELL_SIZE } = COOP_MAZE_CONSTANTS;

export default function CoopMaze() {
  const navigate = useNavigate();
  const engineRef = useRef<CoopMazeEngine | null>(null);
  const [state, setState] = useState(() => {
    engineRef.current = new CoopMazeEngine();
    return engineRef.current.getState();
  });
  const [message, setMessage] = useState('双人合作走迷宫!');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current || state.completed) return;

    let result = { success: false, message: '' };

    switch (e.key.toLowerCase()) {
      case 'w': result = engineRef.current.movePlayer(1, 0, -1); break;
      case 's': result = engineRef.current.movePlayer(1, 0, 1); break;
      case 'a': result = engineRef.current.movePlayer(1, -1, 0); break;
      case 'd': result = engineRef.current.movePlayer(1, 1, 0); break;
      case 'arrowup': result = engineRef.current.movePlayer(2, 0, -1); break;
      case 'arrowdown': result = engineRef.current.movePlayer(2, 0, 1); break;
      case 'arrowleft': result = engineRef.current.movePlayer(2, -1, 0); break;
      case 'arrowright': result = engineRef.current.movePlayer(2, 1, 0); break;
      default: return;
    }

    e.preventDefault();
    setMessage(result.message);
    setState({ ...engineRef.current.getState() });
  }, [state.completed]);

  useEffect(() => {
    engineRef.current?.startTimer();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current && !state.completed) {
        engineRef.current.updateTimer();
        setState({ ...engineRef.current.getState() });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state.completed]);

  const handleNextLevel = () => {
    if (engineRef.current?.nextLevel()) {
      setState({ ...engineRef.current.getState() });
      setMessage(`进入第${engineRef.current.getLevel() + 1}关`);
    }
  };

  const handleRestart = () => {
    engineRef.current?.reset();
    setState({ ...engineRef.current!.getState() });
    setMessage('重新开始');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const boardWidth = state.walls[0]?.length || 15;
  const boardHeight = state.walls.length || 11;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          双人迷宫
        </h1>
        <p className="text-gray-400">两人交换位置到达终点!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl text-center">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-2xl font-bold text-purple-400">
            {engineRef.current?.getLevel()! + 1} / {engineRef.current?.getTotalLevels()}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl text-center">
          <div className="text-sm text-gray-400">时间</div>
          <div className="text-2xl font-bold text-cyan-400">{formatTime(state.time)}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl text-center">
          <div className="text-sm text-gray-400">已到达</div>
          <div className="text-2xl font-bold text-green-400">
            {state.players.filter(p => p.reachedGoal).length} / {state.players.length}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4"
      >
        <div className={`glass-card px-6 py-2 rounded-xl text-center ${
          message.includes('通关') ? 'text-green-400' : 'text-gray-300'
        }`}>
          {message}
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="glass-card rounded-2xl p-4">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              width: boardWidth * CELL_SIZE,
              height: boardHeight * CELL_SIZE,
              background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)'
            }}
          >
            {state.walls.map((row, y) =>
              row.map((isWall, x) => {
                if (isWall) {
                  return (
                    <div
                      key={`wall-${x}-${y}`}
                      className="absolute"
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        background: 'linear-gradient(135deg, #4a4a6a, #3a3a5a)',
                        border: '1px solid rgba(108, 92, 231, 0.2)'
                      }}
                    />
                  );
                }
                return (
                  <div
                    key={`floor-${x}-${y}`}
                    className="absolute"
                    style={{
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: 'rgba(45, 45, 68, 0.3)'
                    }}
                  />
                );
              })
            )}

            {state.goals.map((goal, i) => (
              <motion.div
                key={`goal-${i}`}
                className="absolute flex items-center justify-center"
                style={{
                  left: goal.x * CELL_SIZE,
                  top: goal.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div
                  className="rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    width: CELL_SIZE - 12,
                    height: CELL_SIZE - 12,
                    background: goal.playerId === 1 ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 107, 157, 0.3)',
                    border: `2px solid ${goal.playerId === 1 ? '#00d2ff' : '#ff6b9d'}`,
                    color: goal.playerId === 1 ? '#00d2ff' : '#ff6b9d'
                  }}
                >
                  {goal.playerId}
                </div>
              </motion.div>
            ))}

            {state.players.map(player => (
              <motion.div
                key={`player-${player.id}`}
                className="absolute flex items-center justify-center"
                style={{
                  left: player.x * CELL_SIZE,
                  top: player.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE
                }}
                animate={player.reachedGoal ? { scale: [1, 1.2, 1] } : { scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="rounded-full flex items-center justify-center text-lg shadow-lg"
                  style={{
                    width: CELL_SIZE - 8,
                    height: CELL_SIZE - 8,
                    background: player.reachedGoal 
                      ? `linear-gradient(135deg, ${player.color}, #00ff00)` 
                      : `linear-gradient(135deg, ${player.color}, ${player.id === 1 ? '#0066ff' : '#ff0066'})`,
                    boxShadow: player.reachedGoal 
                      ? '0 0 20px rgba(0, 255, 0, 0.5)' 
                      : `0 0 15px ${player.color}80`
                  }}
                >
                  {player.id === 1 ? '🔵' : '🔴'}
                </div>
              </motion.div>
            ))}
          </div>

          {state.completed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-3xl font-bold text-green-400 mb-2">恭喜通关!</div>
                <div className="text-gray-300 mb-2">用时: {formatTime(state.time)}</div>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={handleNextLevel}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold hover:from-green-700 hover:to-cyan-700 transition-all"
                  >
                    下一关 →
                  </button>
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    重玩本关
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
            >
              🔄 重置
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              🏠 返回
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 max-w-2xl text-center"
      >
        <div className="glass-card px-6 py-4 rounded-xl">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">🎮 操作说明</h3>
          <p className="text-gray-300 text-sm mb-3">每个玩家需要到达自己编号对应的目标点</p>
          <div className="grid grid-cols-2 gap-4 text-gray-300 text-sm">
            <div className="text-center">
              <div className="text-cyan-400 font-bold mb-1">玩家1 (蓝色)</div>
              <kbd className="px-2 py-1 bg-gray-700 rounded">W</kbd>
              <kbd className="px-2 py-1 bg-gray-700 rounded mx-1">A</kbd>
              <kbd className="px-2 py-1 bg-gray-700 rounded mx-1">S</kbd>
              <kbd className="px-2 py-1 bg-gray-700 rounded">D</kbd>
            </div>
            <div className="text-center">
              <div className="text-pink-400 font-bold mb-1">玩家2 (红色)</div>
              <kbd className="px-2 py-1 bg-gray-700 rounded">↑</kbd>
              <kbd className="px-2 py-1 bg-gray-700 rounded mx-1">←</kbd>
              <kbd className="px-2 py-1 bg-gray-700 rounded mx-1">↓</kbd>
              <kbd className="px-2 py-1 bg-gray-700 rounded">→</kbd>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}
