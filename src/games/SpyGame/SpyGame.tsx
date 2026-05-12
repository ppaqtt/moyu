import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { SpyGameEngine, Player } from './engine';

interface SpyGameProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function SpyGame({ onScoreUpdate, onGameOver, onExit }: SpyGameProps) {
  const [engine] = useState(() => new SpyGameEngine());
  const [state, setState] = useState(() => engine.getState());
  const [playerCount, setPlayerCount] = useState(6);
  const [description, setDescription] = useState('');
  const [showWord, setShowWord] = useState(false);
  const [myPlayerId] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS?.SPY_GAME || 'spygame_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const interval = setInterval(updateState, 100);
    return () => clearInterval(interval);
  }, [updateState]);

  useEffect(() => {
    if (state.gamePhase === '游戏结束' && state.gameResult) {
      const score = state.gameResult === 'civilians' ? 100 : 50;
      updateScore(score);
      onScoreUpdate(score);
      onGameOver(score);
    }
  }, [state.gamePhase, state.gameResult, onScoreUpdate, onGameOver, updateScore]);

  useEffect(() => {
    if (['描述阶段', '投票阶段'].includes(state.gamePhase)) {
      timerRef.current = setInterval(() => {
        engine.updateTime();
        updateState();
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.gamePhase, engine, updateState]);

  const handleStartGame = () => {
    engine.setPlayerCount(playerCount);
    engine.startGame();
    updateState();
  };

  const handleSubmitDescription = () => {
    if (description.trim()) {
      engine.submitDescription(description.trim());
      setDescription('');
      updateState();
    }
  };

  const handleVote = (playerId: number) => {
    engine.voteFor(playerId);
    updateState();
  };

  const handleSkipVote = () => {
    engine.skipVote();
    updateState();
  };

  const getCurrentPlayer = (): Player | undefined => {
    return state.players.find(p => p.id === state.currentPlayerIndex);
  };

  const getMyPlayer = (): Player | undefined => {
    return state.players.find(p => p.id === myPlayerId);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 min-h-[700px]">
      <motion.div
        className="flex items-center justify-between w-full max-w-[900px]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-sm"
          style={{
            backgroundColor: `${NEON_COLORS.darkPurple}80`,
            color: NEON_COLORS.neonBlue,
            border: `1px solid ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>回合</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
              {state.round}/{state.maxRounds}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>剩余</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>
              {state.players.filter(p => !p.isEliminated).length}人
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{record.bestScore}</div>
        </div>
      </motion.div>

      {state.gamePhase === 'setup' && (
        <motion.div
          className="flex flex-col items-center gap-8 p-8 rounded-3xl backdrop-blur-xl w-full max-w-lg"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface}95, ${NEON_COLORS.darkPurple}90)`,
            border: `2px solid ${NEON_COLORS.warning}40`,
            boxShadow: `0 0 50px ${NEON_COLORS.warning}30`
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-6xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🕵️
          </motion.div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            谁是卧底
          </h1>

          <p className="text-center" style={{ color: NEON_COLORS.textDim }}>
            秘密获得你的词语，巧妙描述它<br/>
            找出隐藏的卧底，卧底要掩饰身份！
          </p>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <span style={{ color: NEON_COLORS.text }}>玩家人数:</span>
              <div className="flex gap-2">
                {[4, 5, 6, 7, 8].map(num => (
                  <motion.button
                    key={num}
                    onClick={() => setPlayerCount(num)}
                    className="w-12 h-12 rounded-xl font-bold"
                    style={{
                      backgroundColor: playerCount === num ? NEON_COLORS.warning : `${NEON_COLORS.surface}80`,
                      color: playerCount === num ? NEON_COLORS.darkPurple : NEON_COLORS.text
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {num}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="text-sm text-center" style={{ color: NEON_COLORS.textDim }}>
              卧底人数: {Math.max(1, Math.floor(playerCount / 5))} 人
            </div>
          </div>

          <motion.button
            onClick={handleStartGame}
            className="w-full px-8 py-4 rounded-xl font-bold text-xl"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.warning}, ${NEON_COLORS.neonPink})`,
              boxShadow: `0 0 30px ${NEON_COLORS.warning}60`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>
        </motion.div>
      )}

      {state.gamePhase === 'role分配' && (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.warning }}>
            正在分配角色...
          </div>
          <motion.div
            className="text-6xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            🎭
          </motion.div>
        </motion.div>
      )}

      {state.gamePhase === '描述阶段' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
          <div 
            className="w-full p-4 rounded-2xl"
            style={{
              backgroundColor: `${NEON_COLORS.warning}20`,
              border: `2px solid ${NEON_COLORS.warning}60`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>当前发言</div>
                <div className="text-xl font-bold" style={{ color: NEON_COLORS.warning }}>
                  {getCurrentPlayer()?.name || ''}
                </div>
              </div>
              <div 
                className="text-3xl font-bold px-6 py-2 rounded-xl"
                style={{
                  backgroundColor: state.timeLeft <= 10 ? `${NEON_COLORS.danger}60` : `${NEON_COLORS.neonGreen}60`,
                  color: state.timeLeft <= 10 ? NEON_COLORS.danger : NEON_COLORS.neonGreen
                }}
              >
                ⏱️ {state.timeLeft}s
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {state.currentPlayerIndex === myPlayerId && !showWord && (
              <motion.div
                key="word"
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.button
                  onClick={() => setShowWord(true)}
                  className="px-12 py-8 rounded-3xl font-bold text-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.warning})`,
                    boxShadow: `0 0 40px ${NEON_COLORS.neonPink}60`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  👀 点击查看你的词语
                </motion.button>
              </motion.div>
            )}

            {state.currentPlayerIndex === myPlayerId && showWord && (
              <motion.div
                key="input"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div 
                  className="px-8 py-6 rounded-2xl text-4xl font-bold"
                  style={{
                    backgroundColor: `${NEON_COLORS.surface}90`,
                    border: `3px solid ${NEON_COLORS.neonCyan}`,
                    color: NEON_COLORS.neonCyan,
                    boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}40`
                  }}
                >
                  {engine.getPlayerWord(myPlayerId)}
                  {engine.isPlayerSpy(myPlayerId) && (
                    <span className="ml-4 text-2xl" style={{ color: NEON_COLORS.danger }}>🕵️ 卧底!</span>
                  )}
                </div>
                
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitDescription()}
                  placeholder="用一句话描述你的词语(不能说词本身)..."
                  className="w-full max-w-lg px-4 py-3 rounded-xl bg-opacity-30 outline-none text-center"
                  style={{
                    backgroundColor: `${NEON_COLORS.darkPurple}80`,
                    color: NEON_COLORS.white,
                    border: `2px solid ${NEON_COLORS.neonPurple}60`
                  }}
                />
                
                <motion.button
                  onClick={handleSubmitDescription}
                  disabled={!description.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-xl disabled:opacity-50"
                  style={{
                    backgroundColor: NEON_COLORS.neonGreen,
                    boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}60`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  提交描述
                </motion.button>
              </motion.div>
            )}

            {state.currentPlayerIndex !== myPlayerId && (
              <motion.div
                className="text-2xl font-bold p-6 rounded-2xl"
                style={{
                  backgroundColor: `${NEON_COLORS.surface}80`,
                  color: NEON_COLORS.textDim
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                等待 {getCurrentPlayer()?.name} 描述中...
              </motion.div>
            )}
          </AnimatePresence>

          {state.descriptions.length > 0 && (
            <div className="w-full">
              <div className="text-sm opacity-70 mb-2" style={{ color: NEON_COLORS.gold }}>
                发言记录
              </div>
              <div className="grid grid-cols-2 gap-2">
                {state.descriptions.map((desc, index) => {
                  const player = state.players.find(p => p.id === desc.playerId);
                  return (
                    <motion.div
                      key={index}
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: `${NEON_COLORS.surface}60`,
                        border: `1px solid ${NEON_COLORS.neonPurple}30`
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span style={{ color: NEON_COLORS.neonCyan }}>{player?.name}:</span>
                      <span style={{ color: NEON_COLORS.text }}> "{desc.text}"</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {state.gamePhase === '投票阶段' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
          <div 
            className="w-full p-4 rounded-2xl"
            style={{
              backgroundColor: `${NEON_COLORS.danger}20`,
              border: `2px solid ${NEON_COLORS.danger}60`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.danger }}>
                🔍 投票阶段 - 找出卧底!
              </div>
              <div 
                className="text-2xl font-bold px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: state.timeLeft <= 10 ? `${NEON_COLORS.danger}60` : `${NEON_COLORS.neonGreen}60`,
                  color: state.timeLeft <= 10 ? NEON_COLORS.danger : NEON_COLORS.neonGreen
                }}
              >
                ⏱️ {state.timeLeft}s
              </div>
            </div>
          </div>

          <div className="text-lg font-bold" style={{ color: NEON_COLORS.warning }}>
            当前投票: {getCurrentPlayer()?.name}
          </div>

          <div className="grid grid-cols-3 gap-4 w-full">
            {state.players.filter(p => !p.isEliminated).map(player => {
              const isVoting = player.id === getCurrentPlayer()?.id;
              return (
                <motion.div
                  key={player.id}
                  className="p-4 rounded-2xl flex flex-col items-center gap-2"
                  style={{
                    backgroundColor: isVoting ? `${NEON_COLORS.warning}30` : `${NEON_COLORS.surface}60`,
                    border: `2px solid ${isVoting ? NEON_COLORS.warning : NEON_COLORS.neonPurple}40`,
                    opacity: player.hasVoted ? 0.6 : 1
                  }}
                  whileHover={isVoting && !player.hasVoted ? { scale: 1.05 } : {}}
                  whileTap={isVoting && !player.hasVoted ? { scale: 0.95 } : {}}
                >
                  <div className="text-3xl">
                    {player.hasVoted ? '✅' : '👤'}
                  </div>
                  <div className="font-bold" style={{ color: NEON_COLORS.text }}>{player.name}</div>
                  {player.votes > 0 && (
                    <div className="text-sm" style={{ color: NEON_COLORS.danger }}>
                      {player.votes}票
                    </div>
                  )}
                  {isVoting && !player.hasVoted && (
                    <div className="flex gap-2 mt-2">
                      <motion.button
                        onClick={() => handleVote(player.id)}
                        className="px-4 py-2 rounded-lg font-bold text-sm"
                        style={{
                          backgroundColor: NEON_COLORS.danger,
                          color: NEON_COLORS.white
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        投票
                      </motion.button>
                      <motion.button
                        onClick={handleSkipVote}
                        className="px-4 py-2 rounded-lg font-bold text-sm"
                        style={{
                          backgroundColor: `${NEON_COLORS.textDim}40`,
                          color: NEON_COLORS.textDim
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        跳过
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {state.gamePhase === '结果' && state.eliminatedPlayer && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="p-10 rounded-3xl backdrop-blur-xl flex flex-col items-center gap-6"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}95, ${NEON_COLORS.darkPurple}90)`,
                border: `3px solid ${state.eliminatedPlayer.isSpy ? NEON_COLORS.neonGreen : NEON_COLORS.danger}`
              }}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <div className="text-6xl">
                {state.eliminatedPlayer.isSpy ? '🎉' : '😱'}
              </div>
              <h2 className="text-3xl font-bold" style={{ 
                color: state.eliminatedPlayer.isSpy ? NEON_COLORS.neonGreen : NEON_COLORS.danger 
              }}>
                {state.eliminatedPlayer.isSpy ? '卧底被淘汰!' : '好人被冤枉!'}
              </h2>
              <div className="text-xl" style={{ color: NEON_COLORS.text }}>
                {state.eliminatedPlayer.name} 被淘汰
                {!state.eliminatedPlayer.isSpy && (
                  <span> - 词语是: {state.normalWord}</span>
                )}
              </div>
              {state.eliminatedPlayer.isSpy && (
                <div className="text-lg" style={{ color: NEON_COLORS.gold }}>
                  卧底词语: {state.spyWord}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.gamePhase === '游戏结束' && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="p-10 rounded-3xl backdrop-blur-xl flex flex-col items-center gap-6"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}95, ${NEON_COLORS.darkPurple}90)`,
                border: `3px solid ${state.gameResult === 'civilians' ? NEON_COLORS.neonGreen : NEON_COLORS.danger}`,
                boxShadow: `0 0 60px ${state.gameResult === 'civilians' ? NEON_COLORS.neonGreen : NEON_COLORS.danger}40`
              }}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div
                className="text-8xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {state.gameResult === 'civilians' ? '🏆' : '🕵️'}
              </motion.div>

              <h2 className="text-4xl font-bold" style={{ 
                color: state.gameResult === 'civilians' ? NEON_COLORS.neonGreen : NEON_COLORS.danger 
              }}>
                {state.gameResult === 'civilians' ? '好人获胜!' : '卧底获胜!'}
              </h2>

              <div className="text-center">
                <p style={{ color: NEON_COLORS.textDim }}>卧底词语: {state.spyWord}</p>
                <p style={{ color: NEON_COLORS.textDim }}>好人词语: {state.normalWord}</p>
              </div>

              <div className="flex gap-4 mt-4">
                <motion.button
                  onClick={() => {
                    engine.reset();
                    updateState();
                  }}
                  className="px-8 py-4 rounded-xl font-bold text-lg"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                    boxShadow: `0 0 20px ${NEON_COLORS.neonPink}60`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>
                <motion.button
                  onClick={onExit}
                  className="px-8 py-4 rounded-xl font-bold text-lg"
                  style={{
                    backgroundColor: `${NEON_COLORS.neonBlue}40`,
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
