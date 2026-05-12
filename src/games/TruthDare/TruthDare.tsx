import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { TruthDareEngine } from './engine';

interface TruthDareProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function TruthDare({ onScoreUpdate, onGameOver, onExit }: TruthDareProps) {
  const [engine] = useState(() => new TruthDareEngine());
  const [state, setState] = useState(() => engine.getState());
  const [playerName, setPlayerName] = useState('');
  const [maxRounds, setMaxRounds] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS?.TRUTH_DARE || 'truthdare_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const interval = setInterval(updateState, 100);
    return () => clearInterval(interval);
  }, [updateState]);

  useEffect(() => {
    onScoreUpdate(state.score);
    if (state.gamePhase === 'result' && state.score > 0) {
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [state.score, state.gamePhase, onScoreUpdate, onGameOver, updateScore]);

  useEffect(() => {
    if (state.gamePhase === 'playing' && state.currentChoice) {
      engine.setTimeLeft(30);
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
  }, [state.round, state.gamePhase, state.currentChoice, engine, updateState]);

  const handleStartGame = () => {
    if (playerName.trim()) {
      engine.setPlayerName(playerName);
      engine.setMaxRounds(maxRounds);
      engine.startGame();
      updateState();
    }
  };

  const handleTruth = () => {
    engine.chooseTruth();
    updateState();
  };

  const handleDare = () => {
    engine.chooseDare();
    updateState();
  };

  const handleComplete = () => {
    engine.completeChallenge();
    updateState();
  };

  const handleSkip = () => {
    engine.skipChallenge();
    updateState();
  };

  const handleRestart = () => {
    engine.reset();
    updateState();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 min-h-[600px]">
      <motion.div
        className="flex items-center justify-between w-full max-w-[700px]"
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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>勇气值</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.score}</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{record.bestScore}</div>
        </div>
      </motion.div>

      {state.gamePhase === 'setup' && (
        <motion.div
          className="flex flex-col items-center gap-8 p-8 rounded-3xl backdrop-blur-xl w-full max-w-md"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface}95, ${NEON_COLORS.darkPurple}90)`,
            border: `2px solid ${NEON_COLORS.neonPink}40`,
            boxShadow: `0 0 50px ${NEON_COLORS.neonPink}30`
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-6xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎭
          </motion.div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            真心话大冒险
          </h1>

          <p className="text-center" style={{ color: NEON_COLORS.textDim }}>
            选择真心话勇敢回答问题<br/>
            或接受大冒险挑战你的勇气！
          </p>

          <div className="flex flex-col gap-4 w-full">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入你的名字..."
              className="w-full px-4 py-3 rounded-xl bg-opacity-30 backdrop-blur-sm outline-none text-center text-lg"
              style={{
                backgroundColor: `${NEON_COLORS.neonPurple}30`,
                color: NEON_COLORS.white,
                border: `2px solid ${NEON_COLORS.neonPurple}60`
              }}
            />

            <div className="flex items-center justify-between">
              <span style={{ color: NEON_COLORS.text }}>挑战轮数:</span>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(num => (
                  <motion.button
                    key={num}
                    onClick={() => setMaxRounds(num)}
                    className="px-4 py-2 rounded-lg font-bold"
                    style={{
                      backgroundColor: maxRounds === num ? NEON_COLORS.neonCyan : `${NEON_COLORS.surface}80`,
                      color: maxRounds === num ? NEON_COLORS.darkPurple : NEON_COLORS.text
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {num}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleStartGame}
            disabled={!playerName.trim()}
            className="w-full px-8 py-4 rounded-xl font-bold text-xl disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}60`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始挑战
          </motion.button>
        </motion.div>
      )}

      {state.gamePhase === 'playing' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!state.currentChoice && (
              <motion.div
                key="choice"
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>
                  🎯 做出你的选择
                </div>

                <div className="flex gap-6">
                  <motion.button
                    onClick={handleTruth}
                    className="w-48 h-48 rounded-3xl flex flex-col items-center justify-center gap-4 font-bold text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${NEON_COLORS.neonBlue}40, ${NEON_COLORS.neonCyan}60)`,
                      border: `3px solid ${NEON_COLORS.neonBlue}`,
                      boxShadow: `0 0 30px ${NEON_COLORS.neonBlue}40`
                    }}
                    whileHover={{ scale: 1.1, boxShadow: `0 0 50px ${NEON_COLORS.neonBlue}60` }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-5xl">💬</span>
                    <span style={{ color: NEON_COLORS.neonBlue }}>真心话</span>
                  </motion.button>

                  <motion.button
                    onClick={handleDare}
                    className="w-48 h-48 rounded-3xl flex flex-col items-center justify-center gap-4 font-bold text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}40, ${NEON_COLORS.warning}60)`,
                      border: `3px solid ${NEON_COLORS.neonPink}`,
                      boxShadow: `0 0 30px ${NEON_COLORS.neonPink}40`
                    }}
                    whileHover={{ scale: 1.1, boxShadow: `0 0 50px ${NEON_COLORS.neonPink}60` }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-5xl">🎯</span>
                    <span style={{ color: NEON_COLORS.neonPink }}>大冒险</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {state.currentChoice && (
              <motion.div
                key="challenge"
                className="flex flex-col items-center gap-6 w-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.div
                  className="px-8 py-4 rounded-2xl"
                  style={{
                    backgroundColor: state.currentChoice === 'truth' ? 
                      `${NEON_COLORS.neonBlue}30` : `${NEON_COLORS.neonPink}30`,
                    border: `2px solid ${state.currentChoice === 'truth' ? 
                      NEON_COLORS.neonBlue : NEON_COLORS.neonPink}`
                  }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-4xl mr-4">
                    {state.currentChoice === 'truth' ? '💬' : '🎯'}
                  </span>
                  <span className="text-2xl font-bold" style={{ 
                    color: state.currentChoice === 'truth' ? 
                      NEON_COLORS.neonBlue : NEON_COLORS.neonPink 
                  }}>
                    {state.currentChoice === 'truth' ? '真心话' : '大冒险'}
                  </span>
                </motion.div>

                <motion.div
                  className="p-8 rounded-3xl w-full"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.surface}95, ${NEON_COLORS.darkPurple}90)`,
                    border: `3px solid ${state.currentChoice === 'truth' ? 
                      NEON_COLORS.neonCyan : NEON_COLORS.warning}60`,
                    boxShadow: `0 0 40px ${state.currentChoice === 'truth' ? 
                      NEON_COLORS.neonCyan : NEON_COLORS.warning}30`
                  }}
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                >
                  <p className="text-2xl font-bold text-center leading-relaxed" style={{ color: NEON_COLORS.white }}>
                    {state.currentChoice === 'truth' ? state.currentQuestion : state.currentDare}
                  </p>
                </motion.div>

                <div 
                  className="text-4xl font-bold px-8 py-4 rounded-xl"
                  style={{
                    backgroundColor: state.timeLeft <= 10 ? 
                      `${NEON_COLORS.danger}40` : `${NEON_COLORS.neonGreen}40`,
                    color: state.timeLeft <= 10 ? 
                      NEON_COLORS.danger : NEON_COLORS.neonGreen,
                    border: `2px solid ${state.timeLeft <= 10 ? 
                      NEON_COLORS.danger : NEON_COLORS.neonGreen}`
                  }}
                >
                  ⏱️ {state.timeLeft}s
                </div>

                <div className="flex gap-4">
                  <motion.button
                    onClick={handleComplete}
                    className="px-8 py-4 rounded-xl font-bold text-xl"
                    style={{
                      backgroundColor: NEON_COLORS.neonGreen,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}60`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✅ 完成挑战
                  </motion.button>
                  <motion.button
                    onClick={handleSkip}
                    className="px-8 py-4 rounded-xl font-bold text-xl"
                    style={{
                      backgroundColor: `${NEON_COLORS.warning}40`,
                      color: NEON_COLORS.warning,
                      border: `2px solid ${NEON_COLORS.warning}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ⏭️ 跳过
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {state.completedChallenges.length > 0 && (
            <div className="w-full">
              <div className="text-sm opacity-70 mb-2" style={{ color: NEON_COLORS.gold }}>
                已完成挑战 ({state.completedChallenges.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {state.completedChallenges.slice(-5).map((challenge, index) => (
                  <motion.span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: `${NEON_COLORS.neonPurple}30`,
                      color: NEON_COLORS.neonPurple
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    ✓ {challenge.substring(0, 15)}...
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {state.gamePhase === 'result' && (
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
                border: `3px solid ${NEON_COLORS.gold}`,
                boxShadow: `0 0 60px ${NEON_COLORS.gold}40`
              }}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div
                className="text-8xl"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎉
              </motion.div>

              <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.gold }}>
                挑战完成！
              </h2>

              <div className="text-center">
                <p className="text-xl mb-2" style={{ color: NEON_COLORS.textDim }}>
                  {state.playerName} 的最终成绩
                </p>
                <div className="text-6xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>
                  {state.score}
                </div>
                <p style={{ color: NEON_COLORS.gold }}>勇气值</p>
              </div>

              <div className="flex gap-4 mt-4">
                <motion.button
                  onClick={handleRestart}
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
