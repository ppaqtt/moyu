import { useState, useEffect, useRef } from 'react';
import { TextDungeonEngine, GameState, Direction, Player, Room } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'title' | 'playing' | 'gameover' | 'victory';

export default function TextDungeon() {
  const [engine] = useState(() => new TextDungeonEngine());
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [phase, setPhase] = useState<GamePhase>('title');
  const [message, setMessage] = useState('');
  const [combatResult, setCombatResult] = useState<{
    playerDamage: number;
    enemyDamage: number;
    enemyDefeated: boolean;
    playerDefeated: boolean;
  } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    engine.setStateChangeCallback((state) => {
      setGameState(state);
      if (state.isGameOver) setPhase('gameover');
      if (state.hasWon) setPhase('victory');
    });
  }, [engine]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [gameState.combatLog]);

  const handleStart = () => {
    engine.restart();
    setPhase('playing');
    setMessage('欢迎来到文字地牢！祝你好运，冒险者！');
    setCombatResult(null);
  };

  const handleMove = (direction: Direction) => {
    const result = engine.move(direction);
    setMessage(result);
    setCombatResult(null);
  };

  const handleAttack = () => {
    const result = engine.attack();
    setCombatResult(result);
    if (result.playerDefeated) {
      setPhase('gameover');
    }
  };

  const handleFlee = () => {
    const success = engine.flee();
    if (success) {
      setMessage('你成功逃跑了！');
    } else {
      setMessage('逃跑失败！你受到了反击！');
    }
    if (gameState.player.hp <= 0) {
      setPhase('gameover');
    }
    setCombatResult(null);
  };

  const handleUsePotion = () => {
    const result = engine.usePotion();
    setMessage(result);
    setCombatResult(null);
  };

  const getHealthColor = (current: number, max: number): string => {
    const ratio = current / max;
    if (ratio > 0.6) return '#00ff00';
    if (ratio > 0.3) return '#ffff00';
    return '#ff4444';
  };

  const renderPlayerStatus = (player: Player) => (
    <div className="grid grid-cols-4 gap-2 mb-3">
      <div className="text-center">
        <div className="text-xs text-gray-400">等级</div>
        <div className="text-yellow-400 font-bold">{player.level}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">攻击</div>
        <div className="text-red-400 font-bold">{player.attack}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">防御</div>
        <div className="text-blue-400 font-bold">{player.defense}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">金币</div>
        <div className="text-yellow-500 font-bold">{player.gold}</div>
      </div>
    </div>
  );

  const renderHealthBar = () => {
    const player = gameState.player;
    const hpPercent = (player.hp / player.maxHp) * 100;
    const expPercent = (player.exp / player.expToLevel) * 100;

    return (
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">❤️ HP</span>
            <span className="text-gray-400">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${hpPercent}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: getHealthColor(player.hp, player.maxHp) }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-purple-400">⭐ EXP</span>
            <span className="text-gray-400">{player.exp}/{player.expToLevel}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${expPercent}%` }}
              className="h-full bg-purple-500 rounded-full"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-center text-sm">
          <span className="text-green-400">🧪 {gameState.player.potions}</span>
          <span className="text-yellow-400">🔑 {gameState.player.keys}</span>
          <span className="text-gray-400">📍 第{gameState.floor}层</span>
        </div>
      </div>
    );
  };

  if (phase === 'title') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #0a1628 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <div className="text-7xl mb-6">⚔️</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            文字地牢
          </h1>
          <p className="text-gray-300 mb-8 text-lg">Text Dungeon</p>

          <div className="glass-card rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-bold text-orange-400 mb-3">🎮 游戏介绍</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• 探索地牢的每一层，击败强大的敌人</li>
              <li>• 收集装备和药水，提升战斗能力</li>
              <li>• 共5层地牢，最终Boss等待着你</li>
              <li>• 合理使用药水，策略性战斗</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              boxShadow: '0 0 30px rgba(249, 115, 22, 0.5)'
            }}
          >
            开始冒险
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(249, 115, 22, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'gameover') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #2d0000 0%, #1a0000 100%)' }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">💀</div>
          <h1 className="text-4xl font-bold mb-4 text-red-500">
            游戏结束
          </h1>
          <p className="text-gray-400 mb-4">
            你在地牢 {gameState.floor} 层倒下了...
          </p>
          <div className="glass-card rounded-xl p-4 mb-8">
            <p className="text-gray-300">最终等级: <span className="text-yellow-400">{gameState.player.level}</span></p>
            <p className="text-gray-300">获得金币: <span className="text-yellow-500">{gameState.player.gold}</span></p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-8 py-3 text-lg font-bold rounded-xl text-white"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}
          >
            再来一次
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'victory') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #1a3a0a 0%, #0a2a0a 100%)' }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-4xl font-bold mb-4 text-yellow-400">
            恭喜通关！
          </h1>
          <p className="text-green-400 mb-4">
            你成功击败了所有敌人，成为了传说中的英雄！
          </p>
          <div className="glass-card rounded-xl p-4 mb-8">
            <p className="text-gray-300">最终等级: <span className="text-yellow-400">{gameState.player.level}</span></p>
            <p className="text-gray-300">获得金币: <span className="text-yellow-500">{gameState.player.gold}</span></p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-8 py-3 text-lg font-bold rounded-xl text-white"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)'
            }}
          >
            再玩一次
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(34, 197, 94, 0.3);
          }
        `}</style>
      </div>
    );
  }

  const currentRoom = engine.getCurrentRoom();

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="container mx-auto px-4 py-4 max-w-2xl flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            文字地牢
          </h1>
          <button
            onClick={handleStart}
            className="px-3 py-1 bg-red-600/50 rounded-lg text-white text-sm hover:bg-red-600/70 transition-colors"
          >
            重新开始
          </button>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          {renderHealthBar()}
        </div>

        <div className="glass-card rounded-xl p-4 mb-4 flex-1">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-orange-400">
              📍 {currentRoom?.name || '未知房间'}
            </h2>
            {gameState.isInCombat && (
              <span className="px-2 py-1 bg-red-600/50 rounded text-xs text-red-300">
                ⚔️ 战斗中
              </span>
            )}
          </div>

          <div className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">
            {currentRoom?.description}
          </div>

          {gameState.isInCombat && gameState.currentEnemy && (
            <div className="bg-red-900/30 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-red-400 font-bold">{gameState.currentEnemy.name}</span>
                <span className="text-gray-400 text-sm">
                  {gameState.currentEnemy.hp}/{gameState.currentEnemy.maxHp} HP
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(gameState.currentEnemy.hp / gameState.currentEnemy.maxHp) * 100}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-2">{gameState.currentEnemy.description}</p>
            </div>
          )}

          {!gameState.isInCombat && currentRoom && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMove('north')}
                disabled={!currentRoom.exits.north}
                className={`p-2 rounded-lg text-center ${
                  currentRoom.exits.north
                    ? 'bg-blue-600/50 hover:bg-blue-600/70 text-white'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                ⬆️ 北
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMove('south')}
                disabled={!currentRoom.exits.south}
                className={`p-2 rounded-lg text-center ${
                  currentRoom.exits.south
                    ? 'bg-blue-600/50 hover:bg-blue-600/70 text-white'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                ⬇️ 南
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMove('east')}
                disabled={!currentRoom.exits.east}
                className={`p-2 rounded-lg text-center ${
                  currentRoom.exits.east
                    ? 'bg-blue-600/50 hover:bg-blue-600/70 text-white'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                ➡️ 东
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMove('west')}
                disabled={!currentRoom.exits.west}
                className={`p-2 rounded-lg text-center ${
                  currentRoom.exits.west
                    ? 'bg-blue-600/50 hover:bg-blue-600/70 text-white'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                ⬅️ 西
              </motion.button>
            </div>
          )}

          {gameState.isInCombat && (
            <div className="flex gap-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAttack}
                className="flex-1 p-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold"
              >
                ⚔️ 攻击
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFlee}
                className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold"
              >
                🏃 逃跑
              </motion.button>
            </div>
          )}

          {!gameState.isInCombat && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUsePotion}
              disabled={gameState.player.potions <= 0}
              className={`w-full p-3 rounded-lg font-bold mb-3 ${
                gameState.player.potions > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              🧪 使用药水 ({gameState.player.potions})
            </motion.button>
          )}

          {combatResult && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-gray-800/50 rounded-lg p-3 mb-3 text-sm"
              >
                {combatResult.enemyDefeated ? (
                  <p className="text-green-400">
                    ✨ 你造成了 <span className="text-red-400">{combatResult.playerDamage}</span> 点伤害！
                    <br />
                    🎉 敌人被击败了！
                  </p>
                ) : combatResult.playerDefeated ? (
                  <p className="text-red-400">
                    💀 你造成了 <span className="text-green-400">{combatResult.playerDamage}</span> 点伤害！
                    <br />
                    你受到了 <span className="text-red-400">{combatResult.enemyDamage}</span> 点伤害...倒下了！
                  </p>
                ) : (
                  <p className="text-yellow-400">
                    ⚔️ 你造成了 <span className="text-green-400">{combatResult.playerDamage}</span> 点伤害！
                    <br />
                    🐉 敌人反击！造成了 <span className="text-red-400">{combatResult.enemyDamage}</span> 点伤害！
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {message && (
            <div className="text-center text-gray-400 text-sm mb-3">
              {message}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-3">
          <h3 className="text-sm font-bold text-gray-400 mb-2">战斗日志</h3>
          <div
            ref={logRef}
            className="h-32 overflow-y-auto text-xs text-gray-400 space-y-1"
          >
            {gameState.combatLog.slice(-15).map((log, index) => (
              <div key={index} className="border-l-2 border-gray-600 pl-2">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(249, 115, 22, 0.2);
        }
      `}</style>
    </div>
  );
}
