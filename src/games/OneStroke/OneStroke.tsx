import { useState, useEffect, useCallback, useRef } from 'react';
import { OneStrokeEngine } from './engine';
import { ONESTROKE_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function OneStroke() {
  const [engine] = useState(() => new OneStrokeEngine());
  const [gameState, setGameState] = useState({
    nodes: engine.getNodes(),
    edges: engine.getEdges(),
    currentNode: engine.getCurrentNode(),
    moves: engine.getMoves(),
    totalEdges: engine.getTotalEdges(),
    visitedEdges: engine.getVisitedEdges(),
    level: engine.getLevel(),
    levelName: engine.getLevelName(),
    completed: engine.isCompleted()
  });
  const [message, setMessage] = useState('点击一个节点开始');
  const [score, setScore] = useLocalStorage(STORAGE_KEYS.ONESTROKE, { highScore: 0 });
  const [currentScore, setCurrentScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const updateDisplay = useCallback(() => {
    setGameState({
      nodes: engine.getNodes(),
      edges: engine.getEdges(),
      currentNode: engine.getCurrentNode(),
      moves: engine.getMoves(),
      totalEdges: engine.getTotalEdges(),
      visitedEdges: engine.getVisitedEdges(),
      level: engine.getLevel(),
      levelName: engine.getLevelName(),
      completed: engine.isCompleted()
    });

    // 更新分数
    const scoreValue = (engine.getVisitedEdges() * 100) + 
                       (engine.isCompleted() ? 500 : 0) - 
                       (engine.getMoves() - engine.getVisitedEdges() - 1) * 10;
    setCurrentScore(Math.max(0, scoreValue));
  }, [engine]);

  useEffect(() => {
    updateDisplay();
  }, [updateDisplay]);

  // 绘制边
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { GRID_SIZE } = ONESTROKE_CONSTANTS;
    const padding = 50;
    const drawSize = GRID_SIZE - padding * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制边
    gameState.edges.forEach((edge, index) => {
      const fromNode = gameState.nodes[edge.from];
      const toNode = gameState.nodes[edge.to];

      const x1 = padding + fromNode.x * drawSize;
      const y1 = padding + fromNode.y * drawSize;
      const x2 = padding + toNode.x * drawSize;
      const y2 = padding + toNode.y * drawSize;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (edge.drawn) {
        // 已绘制的边
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
      } else {
        // 未绘制的边
        ctx.strokeStyle = 'rgba(108, 92, 231, 0.3)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }, [gameState]);

  const handleNodeClick = (nodeId: number) => {
    const result = engine.selectNode(nodeId);
    setMessage(result.message);
    updateDisplay();

    if (result.completed && currentScore > score.highScore) {
      setScore({ highScore: currentScore });
    }
  };

  const handleUndo = () => {
    const result = engine.undo();
    setMessage(result.message);
    updateDisplay();
  };

  const handleRestart = () => {
    engine.reset();
    updateDisplay();
    setMessage('点击一个节点开始');
  };

  const handleNextLevel = () => {
    if (engine.nextLevel()) {
      updateDisplay();
      setMessage(`进入第${engine.getLevel()}关: ${engine.getLevelName()}`);
    } else {
      setMessage('恭喜通关所有关卡！');
    }
  };

  const handlePrevLevel = () => {
    if (engine.previousLevel()) {
      updateDisplay();
      setMessage(`返回第${engine.getLevel()}关: ${engine.getLevelName()}`);
    }
  };

  const handleLevelSelect = (level: number) => {
    engine.goToLevel(level);
    updateDisplay();
    setMessage(`选择第${level}关: ${engine.getLevelName()}`);
  };

  const { GRID_SIZE } = ONESTROKE_CONSTANTS;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          一笔画 One Stroke
        </h1>
        <p className="text-gray-400">一笔画完所有线条，不重复不间断！</p>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-2xl font-bold text-purple-400">
            {gameState.level} / {engine.getTotalLevels()}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">进度</div>
          <div className="text-2xl font-bold text-cyan-400">
            {gameState.visitedEdges} / {gameState.totalEdges}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">分数</div>
          <div className="text-2xl font-bold text-yellow-400">{currentScore}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡名</div>
          <div className="text-xl font-bold text-green-400">{gameState.levelName}</div>
        </div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <div className={`glass-card px-6 py-2 rounded-xl text-center ${
          message.includes('恭喜') || message.includes('通关') ? 'text-green-400' :
          message.includes('不相连') || message.includes('已画过') ? 'text-red-400' :
          'text-gray-300'
        }`}>
          {message}
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4 w-full max-w-lg"
      >
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>完成进度</span>
            <span>{Math.round((gameState.visitedEdges / gameState.totalEdges) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${(gameState.visitedEdges / gameState.totalEdges) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Game Area */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="glass-card rounded-2xl p-4">
          <div className="relative">
            {/* Canvas for edges */}
            <canvas
              ref={canvasRef}
              width={GRID_SIZE}
              height={GRID_SIZE}
              className="absolute inset-0"
              style={{ pointerEvents: 'none' }}
            />

            {/* Nodes */}
            <div
              className="relative rounded-xl"
              style={{
                width: GRID_SIZE,
                height: GRID_SIZE
              }}
            >
              {gameState.nodes.map((node) => {
                const isCurrentNode = gameState.currentNode === node.id;
                const isVisited = node.visited;
                const padding = 50;
                const drawSize = GRID_SIZE - padding * 2;

                return (
                  <motion.button
                    key={node.id}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNodeClick(node.id)}
                    disabled={gameState.completed}
                    className={`
                      absolute w-12 h-12 rounded-full flex items-center justify-center
                      font-bold text-xl shadow-lg transition-all
                      ${isCurrentNode
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white ring-4 ring-yellow-400'
                        : isVisited
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                          : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/50'
                      }
                    `}
                    style={{
                      left: padding + node.x * drawSize - 24,
                      top: padding + node.y * drawSize - 24,
                      boxShadow: isCurrentNode
                        ? '0 0 20px rgba(251, 191, 36, 0.6)'
                        : isVisited
                          ? '0 0 15px rgba(34, 197, 94, 0.4)'
                          : '0 4px 15px rgba(108, 92, 231, 0.4)'
                    }}
                  >
                    {node.id + 1}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Level Complete Overlay */}
          {gameState.completed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-3xl font-bold text-green-400 mb-2">恭喜过关！</div>
                <div className="text-xl text-yellow-400 mb-2">得分: {currentScore}</div>
                {currentScore > score.highScore && (
                  <div className="text-lg text-green-400 mb-4">🏆 新纪录！</div>
                )}
                <div className="flex gap-3 justify-center mt-4">
                  {engine.getLevel() < engine.getTotalLevels() && (
                    <button
                      onClick={handleNextLevel}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold hover:from-green-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      下一关 →
                    </button>
                  )}
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    重玩本关
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Level Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <div className="glass-card px-4 py-3 rounded-xl">
            <div className="text-sm text-gray-400 mb-2 text-center">选择关卡</div>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: engine.getTotalLevels() }, (_, i) => i + 1).map(level => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    gameState.level === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center mt-4 px-2"
        >
          <div className="flex gap-3">
            <button
              onClick={handlePrevLevel}
              disabled={gameState.level <= 1}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              ← 上一关
            </button>
            <button
              onClick={handleNextLevel}
              disabled={gameState.level >= engine.getTotalLevels()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              下一关 →
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUndo}
              disabled={gameState.moves <= 1}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              ↩️ 撤销
            </button>
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
              🏠 返回主页
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 max-w-2xl text-center"
      >
        <div className="glass-card px-6 py-4 rounded-xl">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">🎯 游戏技巧</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 点击节点开始，一笔画完所有线条</li>
            <li>• 每次只能连接相邻（有边相连）的节点</li>
            <li>• 不能重复画同一条边</li>
            <li>• 黄色节点是当前位置，绿色是已访问节点</li>
            <li>• 点击数字按钮可以切换关卡</li>
          </ul>
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
