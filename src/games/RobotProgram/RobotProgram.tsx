import { useState, useEffect, useCallback, useRef } from 'react';
import { RobotProgramEngine, Command, Position, Direction } from './engine';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CELL_SIZE = 60;

const COMMAND_INFO: Record<Command['type'], { icon: string; label: string; color: string }> = {
  forward: { icon: '⬆️', label: '前进', color: 'bg-blue-500' },
  turnLeft: { icon: '↩️', label: '左转', color: 'bg-purple-500' },
  turnRight: { icon: '↪️', label: '右转', color: 'bg-purple-600' },
  pickUp: { icon: '✋', label: '拾取', color: 'bg-green-500' },
  drop: { icon: '🖐️', label: '放下', color: 'bg-orange-500' }
};

const DIRECTION_ICONS: Record<Direction, string> = {
  up: '🔼',
  right: '▶️',
  down: '🔽',
  left: '◀️'
};

export default function RobotProgram() {
  const [engine] = useState(() => new RobotProgramEngine());
  const [gameState, setGameState] = useState({
    level: engine.getLevel(),
    robotPos: engine.getRobotPosition(),
    robotDir: engine.getRobotDirection(),
    commands: engine.getCommands(),
    collectedItems: engine.getCollectedItems(),
    currentCmdIndex: -1,
    isRunning: false,
    completed: false
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const draggedIndex = useRef<number | null>(null);

  const updateState = useCallback(() => {
    setGameState({
      level: engine.getLevel(),
      robotPos: engine.getRobotPosition(),
      robotDir: engine.getRobotDirection(),
      commands: engine.getCommands(),
      collectedItems: engine.getCollectedItems(),
      currentCmdIndex: engine.getCurrentCommandIndex(),
      isRunning: engine.isRunningProgram(),
      completed: engine.isCompleted()
    });
  }, [engine]);

  const handleAddCommand = (type: Command['type']) => {
    if (gameState.isRunning) return;
    engine.addCommand(type);
    updateState();
  };

  const handleRemoveCommand = (index: number) => {
    if (gameState.isRunning) return;
    engine.removeCommand(index);
    updateState();
  };

  const handleClearCommands = () => {
    if (gameState.isRunning) return;
    engine.clearCommands();
    updateState();
  };

  const handleReset = () => {
    engine.reset();
    updateState();
    setMessage('已重置');
  };

  const handleRun = async () => {
    if (gameState.isRunning || gameState.commands.length === 0) return;
    
    setMessage('执行中...');
    const success = await engine.executeCommands();
    updateState();
    
    if (success) {
      setMessage('🎉 恭喜通关！');
    } else {
      setMessage('执行失败，请检查路径');
    }
  };

  const handleLevelChange = (levelIndex: number) => {
    engine.loadLevel(levelIndex);
    updateState();
    setMessage('');
  };

  const handlePrevLevel = () => {
    const current = engine.getCurrentLevelIndex();
    if (current > 0) {
      handleLevelChange(current - 1);
    }
  };

  const handleNextLevel = () => {
    const current = engine.getCurrentLevelIndex();
    if (current < engine.getTotalLevels() - 1) {
      handleLevelChange(current + 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex.current !== null && draggedIndex.current !== toIndex) {
      engine.moveCommand(draggedIndex.current, toIndex);
      updateState();
    }
    draggedIndex.current = null;
  };

  const renderGrid = () => {
    const { level, robotPos, collectedItems } = gameState;
    const cells = [];

    for (let y = 0; y < level.gridSize.height; y++) {
      for (let x = 0; x < level.gridSize.width; x++) {
        const isObstacle = level.obstacles.some(o => o.x === x && o.y === y);
        const isGoal = level.goal.x === x && level.goal.y === y;
        const isItem = level.items.some(item => 
          item.x === x && item.y === y &&
          !collectedItems.some(ci => ci.x === x && ci.y === y)
        );
        const isRobot = robotPos.x === x && robotPos.y === y;

        let cellContent = null;
        let cellBg = 'bg-gray-700/30';

        if (isObstacle) {
          cellBg = 'bg-red-900/60';
          cellContent = '🧱';
        } else if (isGoal) {
          cellBg = 'bg-green-900/40';
          cellContent = '🎯';
        } else if (isItem) {
          cellContent = '💎';
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`absolute border border-gray-600/30 flex items-center justify-center text-2xl ${cellBg}`}
            style={{
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
          >
            {cellContent}
          </div>
        );
      }
    }

    return cells;
  };

  const renderRobot = () => {
    const { robotPos, robotDir } = gameState;
    return (
      <motion.div
        className="absolute flex items-center justify-center text-3xl z-10"
        style={{
          left: robotPos.x * CELL_SIZE,
          top: robotPos.y * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE
        }}
        animate={{
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="relative">
          <span>🤖</span>
          <span className="absolute -top-1 -right-1 text-sm">{DIRECTION_ICONS[robotDir]}</span>
        </div>
      </motion.div>
    );
  };

  const { level, commands, currentCmdIndex, isRunning, completed } = gameState;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            🤖 机器人编程
          </h1>
          <p className="text-gray-400">拖拽命令方块，编写程序控制机器人！</p>
        </motion.div>

        {/* Level Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center items-center gap-4 mb-4"
        >
          <button
            onClick={handlePrevLevel}
            disabled={engine.getCurrentLevelIndex() === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            ← 上一关
          </button>
          <div className="glass-card px-6 py-2 rounded-xl">
            <span className="text-purple-400 font-bold">
              第 {engine.getCurrentLevelIndex() + 1} 关 / {engine.getTotalLevels()}
            </span>
            <span className="text-gray-400 ml-2">- {level.name}</span>
          </div>
          <button
            onClick={handleNextLevel}
            disabled={engine.getCurrentLevelIndex() === engine.getTotalLevels() - 1}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            下一关 →
          </button>
        </motion.div>

        {/* Lesson */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4 mb-6 text-center"
        >
          <p className="text-blue-300">📚 {level.lesson}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game Grid */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🎮 游戏区域</h2>
              <div 
                className="relative mx-auto rounded-xl overflow-hidden"
                style={{
                  width: level.gridSize.width * CELL_SIZE,
                  height: level.gridSize.height * CELL_SIZE,
                  background: 'linear-gradient(135deg, #1e1e3f, #2d2d5a)'
                }}
              >
                {renderGrid()}
                {renderRobot()}
              </div>
              
              {/* Controls */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={handleReset}
                  disabled={isRunning}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  🔄 重置
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning || commands.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  {isRunning ? '⏳ 执行中...' : '▶️ 运行程序'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  🏠 返回
                </button>
              </div>

              {message && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`mt-4 text-center font-bold text-lg ${
                    completed ? 'text-green-400' : 
                    message.includes('失败') ? 'text-red-400' : 'text-blue-400'
                  }`}
                >
                  {message}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Programming Area */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Command Palette */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📦 命令库</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(COMMAND_INFO) as Command['type'][]).map((type) => {
                  const info = COMMAND_INFO[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleAddCommand(type)}
                      disabled={isRunning}
                      className={`${info.color} hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg flex flex-col items-center gap-2`}
                    >
                      <span className="text-2xl">{info.icon}</span>
                      <span>{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Program Queue */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">📝 程序队列</h2>
                <button
                  onClick={handleClearCommands}
                  disabled={isRunning || commands.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  清空
                </button>
              </div>
              
              <div className="space-y-2 min-h-[100px]">
                {commands.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-600 rounded-xl">
                    从命令库添加命令到这里
                  </div>
                ) : (
                  commands.map((cmd, index) => {
                    const info = COMMAND_INFO[cmd.type];
                    const isActive = index === currentCmdIndex;
                    return (
                      <motion.div
                        key={cmd.id}
                        draggable={!isRunning}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-move transition-all ${
                          isActive ? 'bg-yellow-500/30 border-2 border-yellow-400' :
                          'bg-gray-700/50 hover:bg-gray-600/50'
                        }`}
                        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 font-mono w-8">{index + 1}.</span>
                          <span className={`${info.color} px-3 py-1 rounded-lg text-white font-bold flex items-center gap-2`}>
                            <span>{info.icon}</span>
                            <span>{info.label}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveCommand(index)}
                          disabled={isRunning}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✕
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Programming Tips */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-3">💡 编程提示</h2>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• 点击命令库中的按钮添加命令到程序队列</li>
                <li>• 拖拽命令可以调整执行顺序</li>
                <li>• 点击 ✕ 可以删除不需要的命令</li>
                <li>• 准备好后点击"运行程序"按钮执行</li>
                <li>• 观察机器人的移动，调整程序直到完成目标</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

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
