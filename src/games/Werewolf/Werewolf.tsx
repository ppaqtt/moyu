import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { WerewolfEngine, WerewolfState, Player, Role } from './engine';

const ROLE_COLORS: Record<Role, string> = {
  werewolf: '#e74c3c',
  villager: '#3498db',
  seer: '#9b59b6',
  witch: '#e91e63',
  hunter: '#ff9800',
  guard: '#4caf50',
  elder: '#607d8b',
};

const ROLE_ICONS: Record<Role, string> = {
  werewolf: '🐺',
  villager: '👨‍🌾',
  seer: '👁️',
  witch: '🧪',
  hunter: '🏹',
  guard: '🛡️',
  elder: '👴',
};

const ROLE_NAMES: Record<Role, string> = {
  werewolf: '狼人',
  villager: '村民',
  seer: '预言家',
  witch: '女巫',
  hunter: '猎人',
  guard: '守卫',
  elder: '长老',
};

export default function Werewolf() {
  const navigate = useNavigate();
  const [engine] = useState(() => new WerewolfEngine());
  const [gameState, setGameState] = useState<WerewolfState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('werewolf_highscore', 0);
  const [showRole, setShowRole] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const animationRef = useRef<number>();

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const updateState = useCallback(() => {
    setGameState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const gameLoop = () => {
      updateState();
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateState]);

  useEffect(() => {
    if (gameState.phase === 'gameOver') {
      const wins = gameState.winner === 'villagers' ? 1 : 0;
      if (wins > highScore) {
        setHighScore(wins);
      }
    }
  }, [gameState.phase, gameState.winner, highScore, setHighScore]);

  const handleStartGame = useCallback(() => {
    engine.startGame();
    updateState();
    setGameStarted(true);
    setShowRole(true);
    setTimeout(() => setShowRole(false), 3000);
  }, [engine, updateState]);

  const handleRestart = useCallback(() => {
    engine.reset();
    updateState();
    setGameStarted(false);
    setShowRole(false);
  }, [engine, updateState]);

  const handleGuardSelect = useCallback((targetId: number) => {
    engine.selectGuardTarget(targetId);
    updateState();
  }, [engine, updateState]);

  const handleWerewolfSelect = useCallback((targetId: number) => {
    engine.selectWerewolfTarget(targetId);
    updateState();
  }, [engine, updateState]);

  const handleSeerSelect = useCallback((targetId: number) => {
    engine.selectSeerTarget(targetId);
    updateState();
  }, [engine, updateState]);

  const handleWitchPoison = useCallback((targetId: number) => {
    engine.witchUsePoison(targetId);
    updateState();
  }, [engine, updateState]);

  const handleWitchAntidote = useCallback((targetId: number) => {
    engine.witchUseAntidote(targetId);
    updateState();
  }, [engine, updateState]);

  const handleWitchSkip = useCallback(() => {
    engine.witchSkipAction();
    updateState();
  }, [engine, updateState]);

  const handleVote = useCallback((targetId: number) => {
    engine.vote(targetId);
    updateState();
  }, [engine, updateState]);

  const handleHunterShoot = useCallback((targetId: number) => {
    engine.hunterShoot(targetId);
    updateState();
  }, [engine, updateState]);

  const handleSkipHunterShot = useCallback(() => {
    engine.skipHunterShot();
    updateState();
  }, [engine, updateState]);

  const handleStartDiscussion = useCallback(() => {
    engine.startDiscussion();
    updateState();
  }, [engine, updateState]);

  const handleSkipNight = useCallback(() => {
    engine.skipNightAction();
    updateState();
  }, [engine, updateState]);

  const playerRole = engine.getPlayerRole(0);
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const playerAlive = gameState.players[0]?.isAlive;

  return (
    <div 
      className="min-h-screen flex flex-col items-center gap-4 py-6 px-4"
      style={{
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a1a2e 100%)',
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[900px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm glass-card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>第{gameState.dayNumber}天</div>
          <div className="text-lg font-bold" style={{ 
            color: gameState.phase === 'night' ? '#9b59b6' : 
                   gameState.phase === 'voting' ? '#e74c3c' : 
                   NEON_COLORS.neonGreen 
          }}>
            {gameState.phase === 'night' && '🌙 夜晚'}
            {gameState.phase === 'day' && '☀️ 白天'}
            {gameState.phase === 'discussion' && '💬 讨论中'}
            {gameState.phase === 'voting' && '🗳️ 投票中'}
            {gameState.phase === 'gameOver' && '🏁 游戏结束'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>存活</div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
            {alivePlayers.length}人
          </div>
        </div>
      </div>

      <motion.div 
        className="text-center text-lg font-medium px-6 py-3 rounded-xl glass-card"
        style={{ color: NEON_COLORS.gold, minWidth: '300px' }}
        key={gameState.message}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {gameState.message}
      </motion.div>

      {!gameStarted ? (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
            🐺 狼人杀 🐺
          </h2>
          <p className="text-gray-400">经典多人推理游戏</p>
          <motion.button
            onClick={handleStartGame}
            className="px-8 py-4 rounded-xl font-bold text-xl glass-card"
            style={{
              background: 'rgba(231, 76, 60, 0.3)',
              boxShadow: '0 0 20px rgba(231, 76, 60, 0.3)',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(231, 76, 60, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 max-w-[800px]">
            {gameState.players.map((player) => (
              <motion.div
                key={player.id}
                className="glass-card rounded-xl p-3 text-center"
                style={{ 
                  opacity: player.isAlive ? 1 : 0.4,
                  border: `2px solid ${ROLE_COLORS[player.role]}`,
                }}
                whileHover={{ scale: 1.05 }}
                animate={player.isAlive ? {
                  boxShadow: `0 0 10px ${ROLE_COLORS[player.role]}50`,
                } : {}}
              >
                <div className="text-2xl mb-1">
                  {player.isAlive ? ROLE_ICONS[player.role] : '💀'}
                </div>
                <div className="font-bold text-sm" style={{ color: ROLE_COLORS[player.role] }}>
                  {player.name}
                </div>
                {player.id === 0 && (
                  <div className="text-xs opacity-70">你的身份</div>
                )}
                {!player.isAlive && (
                  <div className="text-xs mt-1" style={{ color: '#e74c3c' }}>
                    {ROLE_NAMES[player.role]}
                  </div>
                )}
                {player.isAlive && player.voteCount > 0 && gameState.phase === 'voting' && (
                  <div className="text-xs mt-1 font-bold" style={{ color: NEON_COLORS.gold }}>
                    {player.voteCount}票
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            {gameState.phase === 'night' && playerAlive && (
              <>
                {gameState.currentNightAction === 'guard' && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm opacity-70">选择要保护的目标:</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {alivePlayers.filter(p => p.id !== 0).map((player) => (
                        <motion.button
                          key={player.id}
                          onClick={() => handleGuardSelect(player.id)}
                          className="px-4 py-2 rounded-lg font-bold glass-card"
                          style={{ background: `${ROLE_COLORS[player.role]}40` }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {player.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {gameState.currentNightAction === 'werewolf' && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm opacity-70">选择要击杀的目标:</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {alivePlayers.filter(p => !gameState.werewolves.includes(p.id)).map((player) => (
                        <motion.button
                          key={player.id}
                          onClick={() => handleWerewolfSelect(player.id)}
                          className="px-4 py-2 rounded-lg font-bold glass-card"
                          style={{ background: `${ROLE_COLORS[player.role]}40` }}
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(231, 76, 60, 0.4)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {player.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {gameState.currentNightAction === 'seer' && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm opacity-70">选择要查验的目标:</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {alivePlayers.filter(p => p.id !== 0).map((player) => (
                        <motion.button
                          key={player.id}
                          onClick={() => handleSeerSelect(player.id)}
                          className="px-4 py-2 rounded-lg font-bold glass-card"
                          style={{ background: `${ROLE_COLORS[player.role]}40` }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {player.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {gameState.currentNightAction === 'witch' && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm opacity-70">女巫请选择:</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {alivePlayers.filter(p => p.id !== 0).map((player) => (
                        <div key={player.id} className="flex gap-1">
                          <motion.button
                            onClick={() => handleWitchPoison(player.id)}
                            className="px-3 py-2 rounded-lg font-bold text-sm"
                            style={{ background: 'rgba(231, 76, 60, 0.3)' }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="毒药"
                          >
                            ☠️ {player.name}
                          </motion.button>
                        </div>
                      ))}
                      <motion.button
                        onClick={() => alivePlayers.forEach(p => {
                          if (p.id !== 0) handleWitchAntidote(p.id);
                        })}
                        className="px-3 py-2 rounded-lg font-bold text-sm"
                        style={{ background: 'rgba(76, 175, 80, 0.3)' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="解药"
                      >
                        💊 解药
                      </motion.button>
                      <motion.button
                        onClick={handleWitchSkip}
                        className="px-3 py-2 rounded-lg font-bold text-sm"
                        style={{ background: 'rgba(100, 100, 100, 0.3)' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        跳过
                      </motion.button>
                    </div>
                  </div>
                )}

                {gameState.currentNightAction !== 'none' && playerRole !== 'werewolf' && 
                 playerRole !== 'seer' && playerRole !== 'witch' && playerRole !== 'guard' && (
                  <motion.button
                    onClick={handleSkipNight}
                    className="px-4 py-2 rounded-lg font-bold glass-card"
                    style={{ background: 'rgba(100, 100, 100, 0.3)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    跳过等待
                  </motion.button>
                )}
              </>
            )}

            {gameState.phase === 'day' && playerAlive && !gameState.hunterShot && (
              <motion.button
                onClick={handleStartDiscussion}
                className="px-6 py-3 rounded-xl font-bold text-lg glass-card"
                style={{
                  background: 'rgba(57, 255, 20, 0.3)',
                  boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ☀️ 开始讨论
              </motion.button>
            )}

            {gameState.phase === 'voting' && playerAlive && !gameState.players[0].hasVoted && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm opacity-70">投票放逐:</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {alivePlayers.filter(p => p.id !== 0).map((player) => (
                    <motion.button
                      key={player.id}
                      onClick={() => handleVote(player.id)}
                      className="px-4 py-2 rounded-lg font-bold glass-card"
                      style={{ background: `${ROLE_COLORS[player.role]}40` }}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(231, 76, 60, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {player.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {gameState.hunterShot && playerAlive && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm opacity-70">猎人请选择要带走的人:</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {alivePlayers.filter(p => p.id !== 0).map((player) => (
                    <motion.button
                      key={player.id}
                      onClick={() => handleHunterShoot(player.id)}
                      className="px-4 py-2 rounded-lg font-bold glass-card"
                      style={{ background: 'rgba(255, 152, 0, 0.4)' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🏹 {player.name}
                    </motion.button>
                  ))}
                  <motion.button
                    onClick={handleSkipHunterShot}
                    className="px-4 py-2 rounded-lg font-bold glass-card"
                    style={{ background: 'rgba(100, 100, 100, 0.3)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    跳过
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {gameState.lastNightEvents.length > 0 && gameState.phase !== 'night' && (
            <div className="glass-card rounded-xl p-4 max-w-[600px]">
              <h3 className="font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>
                🌙 昨夜事件
              </h3>
              <ul className="text-sm space-y-1">
                {gameState.lastNightEvents.map((event, idx) => (
                  <li key={idx} style={{ color: event.includes('狼人') ? '#e74c3c' : 
                                                    event.includes('预言家') ? '#9b59b6' :
                                                    event.includes('守卫') ? '#4caf50' :
                                                    event.includes('女巫') ? '#e91e63' : 
                                                    NEON_COLORS.gold }}>
                    {event}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showRole && playerRole && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/80" />
            <motion.div
              className="relative glass-card rounded-2xl p-8 text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              style={{ borderColor: ROLE_COLORS[playerRole] }}
            >
              <div className="text-6xl mb-4">{ROLE_ICONS[playerRole]}</div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: ROLE_COLORS[playerRole] }}>
                你的身份
              </h2>
              <div className="text-2xl font-bold">{ROLE_NAMES[playerRole]}</div>
              {playerRole === 'werewolf' && (
                <p className="text-sm mt-4 opacity-70">
                  狼人阵营 | 每晚可以击杀一名玩家
                </p>
              )}
              {playerRole === 'villager' && (
                <p className="text-sm mt-4 opacity-70">
                  好人阵营 | 白天通过投票放逐狼人
                </p>
              )}
              {playerRole === 'seer' && (
                <p className="text-sm mt-4 opacity-70">
                  好人阵营 | 每晚可以查验一名玩家的身份
                </p>
              )}
              {playerRole === 'witch' && (
                <p className="text-sm mt-4 opacity-70">
                  好人阵营 | 有一瓶毒药和一瓶解药
                </p>
              )}
              {playerRole === 'hunter' && (
                <p className="text-sm mt-4 opacity-70">
                  好人阵营 | 死亡时可以带走一名玩家
                </p>
              )}
              {playerRole === 'guard' && (
                <p className="text-sm mt-4 opacity-70">
                  好人阵营 | 每晚可以保护一名玩家免受狼人袭击
                </p>
              )}
            </motion.div>
          </motion.div>
        )}

        {gameState.phase === 'gameOver' && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
              className="relative glass-card rounded-2xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold mb-4" style={{ 
                color: gameState.winner === 'villagers' ? NEON_COLORS.neonGreen : '#e74c3c' 
              }}>
                {gameState.winner === 'villagers' ? '🎉 好人胜利!' : '🐺 狼人胜利!'}
              </h2>
              
              <div className="space-y-2 mb-6">
                <div className="text-sm opacity-70 mb-4">最终存活</div>
                {gameState.players.filter(p => p.isAlive).map((player) => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span style={{ color: ROLE_COLORS[player.role] }}>
                      {ROLE_ICONS[player.role]} {player.name}
                    </span>
                    <span style={{ color: NEON_COLORS.gold }}>
                      {ROLE_NAMES[player.role]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <motion.button
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(231, 76, 60, 0.3)',
                    color: NEON_COLORS.neonPink,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 再来一局
                </motion.button>
                <motion.button
                  onClick={handleExit}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(0, 210, 255, 0.3)',
                    color: NEON_COLORS.neonBlue,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏠 返回首页
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
