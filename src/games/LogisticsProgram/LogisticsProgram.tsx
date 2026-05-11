import { useState, useEffect, useCallback } from 'react';
import { LogisticsProgramEngine, Position, Package } from './engine';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CELL_SIZE = 50;

export default function LogisticsProgram() {
  const [engine] = useState(() => new LogisticsProgramEngine());
  const [gameState, setGameState] = useState({
    level: engine.getLevel(),
    packages: engine.getPackages(),
    currentPackageIndex: engine.getCurrentPackageIndex(),
    path: engine.getPath(),
    movesUsed: engine.getMovesUsed(),
    isSimulating: engine.isSimulatingPath(),
    completed: engine.isCompleted()
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const updateState = useCallback(() => {
    setGameState({
      level: engine.getLevel(),
      packages: engine.getPackages(),
      currentPackageIndex: engine.getCurrentPackageIndex(),
      path: engine.getPath(),
      movesUsed: engine.getMovesUsed(),
      isSimulating: engine.isSimulatingPath(),
      completed: engine.isCompleted()
    });
  }, [engine]);

  const handleCellClick = (x: number, y: number) => {
    if (gameState.isSimulating) return;
    const success = engine.addToPath({ x, y });
    updateState();
    if (!success && gameState.path.length === 0) {
      setMessage('请从包裹起点开始规划路径');
    }
  };

  const handleUndo = () => {
    if (gameState.isSimulating) return;
    engine.undoPath();
    updateState();
  };

  const handleClear = () => {
    if (gameState.isSimulating) return;
    engine.clearPath();
    updateState();
  };

  const handleReset = () => {
    engine.reset();
    updateState();
    setMessage('');
  };

  const handleConfirm = async () => {
    if (gameState.isSimulating) return;
    setMessage('配送中...');
    const success = await engine.simulatePath();
    updateState();
    
    if (success) {
      if (engine.isCompleted()) {
        setMessage('🎉 恭喜！所有包裹配送完成！');
      } else {
        setMessage('包裹配送成功！继续配送下一个包裹');
      }
    } else {
      setMessage('路径无效！请确保路径到达终点');
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

  const handleSelectPackage = (index: number) => {
    engine.selectPackage(index);
    updateState();
  };

  const renderGrid = () => {
    const { level, packages, currentPackageIndex, path } = gameState;
    const cells = [];

    for (let y = 0; y < level.gridSize.height; y++) {
      for (let x = 0; x < level.gridSize.width; x++) {
        const isObstacle = level.obstacles.some(o => o.x === x && o.y === y);
        const isWarehouse = level.warehouses.some(w => w.x === x && w.y === y);
        const pathIndex = path.findIndex(p => p.x === x && p.y === y);
        const isInPath = pathIndex !== -1;

        let pkgInfo: Package | undefined;
        let isStart = false;
        let isEnd = false;

        packages.forEach((pkg, idx) => {
          if (pkg.start.x === x && pkg.start.y === y) {
            pkgInfo = pkg;
            isStart = true;
          }
          if (pkg.end.x === x && pkg.end.y === y) {
            pkgInfo = pkg;
            isEnd = true;
          }
        });

        let cellContent = null;
        let cellBg = 'bg-gray-700/30';
        let borderStyle = 'border-gray-600/30';

        if (isObstacle) {
          cellBg = 'bg-red-900/60';
          cellContent = '🚧';
        } else if (isWarehouse) {
          cellBg = 'bg-purple-900/40';
          cellContent = '🏭';
        } else if (isInPath) {
          const currentPkg = packages[currentPackageIndex];
          cellBg = 'bg-opacity-30';
          borderStyle = 'border-opacity-60';
        }

        cells.push(
          <motion.div
            key={`${x}-${y}`}
            className={`absolute border flex items-center justify-center text-xl cursor-pointer transition-all hover:brightness-110 ${cellBg}`}
            style={{
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderColor: isInPath ? packages[currentPackageIndex].color : undefined,
              backgroundColor: isInPath ? `${packages[currentPackageIndex].color}33` : undefined,
              borderWidth: isInPath ? 2 : 1,
              borderStyle: 'solid'
            }}
            onClick={() => handleCellClick(x, y)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isInPath && (
              <span className="text-2xl" style={{ color: packages[currentPackageIndex].color }}>
                {pathIndex + 1}
              </span>
            )}
            {cellContent}
          </motion.div>
        );
      }
    }

    return cells;
  };

  const renderPackages = () => {
    const { level, packages, currentPackageIndex } = gameState;
    const elements = [];

    packages.forEach((pkg, idx) => {
      const isCurrent = idx === currentPackageIndex;
      
      elements.push(
        <motion.div
          key={`start-${pkg.id}`}
          className="absolute flex items-center justify-center z-10 pointer-events-none"
          style={{
            left: pkg.start.x * CELL_SIZE,
            top: pkg.start.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE
          }}
          animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div
            className="relative"
            style={{
              width: CELL_SIZE - 10,
              height: CELL_SIZE - 10,
              backgroundColor: pkg.color,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isCurrent ? `0 0 15px ${pkg.color}` : 'none',
              opacity: pkg.delivered ? 0.4 : 1
            }}
          >
            <span className="text-2xl">{pkg.delivered ? '✅' : '📦'}</span>
          </div>
        </motion.div>
      );

      elements.push(
        <div
          key={`end-${pkg.id}`}
          className="absolute flex items-center justify-center z-10 pointer-events-none"
          style={{
            left: pkg.end.x * CELL_SIZE,
            top: pkg.end.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE
          }}
        >
          <div
            className="relative"
            style={{
              width: CELL_SIZE - 10,
              height: CELL_SIZE - 10,
              backgroundColor: `${pkg.color}44`,
              border: `3px dashed ${pkg.color}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pkg.delivered ? 0.4 : 1
            }}
          >
            <span className="text-2xl">🏠</span>
          </div>
        </div>
      );
    });

    return elements;
  };

  const renderPathLines = () => {
    const { path, packages, currentPackageIndex } = gameState;
    if (path.length < 2) return null;

    const lines = [];
    const currentPkg = packages[currentPackageIndex];

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      const fromX = from.x * CELL_SIZE + CELL_SIZE / 2;
      const fromY = from.y * CELL_SIZE + CELL_SIZE / 2;
      const toX = to.x * CELL_SIZE + CELL_SIZE / 2;
      const toY = to.y * CELL_SIZE + CELL_SIZE / 2;

      const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
      const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));

      lines.push(
        <div
          key={`line-${i}`}
          className="absolute z-5 pointer-events-none"
          style={{
            left: fromX,
            top: fromY - 3,
            width: length,
            height: 6,
            backgroundColor: currentPkg.color,
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg)`,
            borderRadius: 3,
            opacity: 0.7
          }}
        />
      );
    }

    return lines;
  };

  const { level, packages, currentPackageIndex, movesUsed, isSimulating, completed } = gameState;
  const currentPkg = packages[currentPackageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
            🚚 物流编程
          </h1>
          <p className="text-gray-400">规划最优路线，完成包裹配送！
</p>
        </motion.div>

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
            <span className="text-green-400 font-bold">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4 mb-6 text-center"
        >
          <p className="text-green-300">📚 {level.lesson}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🗺️ 配送地图</h2>
              <div
                className="relative mx-auto rounded-xl overflow-hidden"
                style={{
                  width: level.gridSize.width * CELL_SIZE,
                  height: level.gridSize.height * CELL_SIZE,
                  background: 'linear-gradient(135deg, #1e293b, #334155)'
                }}
              >
                {renderGrid()}
                {renderPathLines()}
                {renderPackages()}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={handleUndo}
                  disabled={isSimulating || gameState.path.length === 0}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  ↩️ 撤销
                </button>
                <button
                  onClick={handleClear}
                  disabled={isSimulating || gameState.path.length === 0}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  🗑️ 清除
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSimulating || gameState.path.length < 2}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  {isSimulating ? '⏳ 配送中...' : '✅ 确认配送'}
                </button>
              </div>

              {message && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`mt-4 text-center font-bold text-lg ${
                    completed ? 'text-green-400' : 
                    message.includes('无效') ? 'text-red-400' : 'text-blue-400'
                  }`}
                >
                  {message}
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📦 包裹列表</h2>
              <div className="space-y-3">
                {packages.map((pkg, idx) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(idx)}
                    disabled={pkg.delivered}
                    className={`w-full p-3 rounded-xl transition-all ${
                      idx === currentPackageIndex
                        ? 'ring-2 ring-white'
                        : ''
                    } ${
                      pkg.delivered
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:brightness-110'
                    }`}
                    style={{
                      backgroundColor: `${pkg.color}33`,
                      borderLeft: `4px solid ${pkg.color}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{pkg.name}</span>
                      <span className="text-sm text-gray-300">
                        {pkg.delivered ? '✅ 已配送' : '待配送'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 配送信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">已用步数</span>
                  <span className="text-white font-bold">{movesUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">最大步数</span>
                  <span className="text-white font-bold">{level.maxMoves}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">当前路径</span>
                  <span className="text-white font-bold">{gameState.path.length > 0 ? gameState.path.length - 1 : 0} 步</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-3">💡 游戏提示</h2>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• 点击包裹起点开始规划路径</li>
                <li>• 依次点击相邻格子规划路线</li>
                <li>• 点击包裹卡片切换当前配送包裹</li>
                <li>• 到达终点后点击"确认配送"</li>
                <li>• 有仓库的关卡必须经过仓库</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                🔄 重置
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                🏠 返回
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
}
