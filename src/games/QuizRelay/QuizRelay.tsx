import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { QuizRelayEngine, Team, Question } from './engine';

interface QuizRelayProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const TEAM_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'];

export default function QuizRelay({ onScoreUpdate, onGameOver, onExit }: QuizRelayProps) {
  const [engine] = useState(() => new QuizRelayEngine());
  const [state, setState] = useState(() => engine.getState());
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(['队伍1', '队伍2', '队伍3', '队伍4']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS?.QUIZ_RELAY || 'quizrelay_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const interval = setInterval(updateState, 100);
    return () => clearInterval(interval);
  }, [updateState]);

  useEffect(() => {
    const leaderboard = engine.getLeaderboard();
    if (leaderboard.length > 0) {
      onScoreUpdate(leaderboard[0].score);
    }
    
    if (state.gamePhase === 'gameOver' && leaderboard.length > 0) {
      updateScore(leaderboard[0].score);
      onGameOver(leaderboard[0].score);
    }
  }, [state.gamePhase, engine, onScoreUpdate, onGameOver, updateScore]);

  const handleStartGame = () => {
    engine.setTeamCount(teamCount);
    for (let i = 0; i < teamCount; i++) {
      if (teamNames[i]) {
        engine.setTeamName(i, teamNames[i]);
      }
    }
    engine.setDifficulty(difficulty);
    engine.setTimePerQuestion(timePerQuestion);
    engine.setTotalQuestions(totalQuestions);
    engine.startGame();
    updateState();
  };

  const handleAnswer = (index: number) => {
    engine.submitAnswer(index);
    updateState();
  };

  const handleContinue = () => {
    engine.continueGame();
    updateState();
  };

  const handleReset = () => {
    engine.reset();
    updateState();
  };

  const getCurrentTeam = (): Team | undefined => {
    return state.teams[state.currentTeamIndex];
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return NEON_COLORS.neonGreen;
      case 'medium': return NEON_COLORS.gold;
      case 'hard': return NEON_COLORS.danger;
      default: return NEON_COLORS.text;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 min-h-[700px]">
      <motion.div
        className="flex items-center justify-between w-full max-w-[1000px]"
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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>题目</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
              {state.questionIndex}/{state.totalQuestions}
            </div>
          </div>
          {state.currentQuestion && (
            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>难度</div>
              <div 
                className="text-lg font-bold px-3 py-1 rounded-lg"
                style={{ 
                  backgroundColor: `${getDifficultyColor(state.currentQuestion.difficulty)}30`,
                  color: getDifficultyColor(state.currentQuestion.difficulty)
                }}
              >
                {state.currentQuestion.difficulty === 'easy' ? '简单' : 
                 state.currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{record.bestScore}</div>
        </div>
      </motion.div>

      {state.gamePhase === 'setup' && (
        <motion.div
          className="flex flex-col items-center gap-6 p-8 rounded-3xl backdrop-blur-xl w-full max-w-lg"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface}95, ${NEON_COLORS.darkPurple}90)`,
            border: `2px solid ${NEON_COLORS.neonCyan}40`,
            boxShadow: `0 0 50px ${NEON_COLORS.neonCyan}30`
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-6xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏆
          </motion.div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            接力问答
          </h1>

          <p className="text-center" style={{ color: NEON_COLORS.textDim }}>
            多队伍轮流答题，考验知识与速度！<br/>
            连续答对获得额外奖励分
          </p>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <span style={{ color: NEON_COLORS.text }}>参赛队伍:</span>
              <div className="flex gap-2">
                {[2, 3, 4].map(num => (
                  <motion.button
                    key={num}
                    onClick={() => setTeamCount(num)}
                    className="w-12 h-12 rounded-xl font-bold text-xl"
                    style={{
                      backgroundColor: teamCount === num ? NEON_COLORS.neonCyan : `${NEON_COLORS.surface}80`,
                      color: teamCount === num ? NEON_COLORS.darkPurple : NEON_COLORS.text
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {num}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {Array.from({ length: teamCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: TEAM_COLORS[i] }}
                  />
                  <input
                    type="text"
                    value={teamNames[i]}
                    onChange={(e) => {
                      const newNames = [...teamNames];
                      newNames[i] = e.target.value;
                      setTeamNames(newNames);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-opacity-30 outline-none text-sm"
                    style={{
                      backgroundColor: `${TEAM_COLORS[i]}30`,
                      color: NEON_COLORS.white,
                      border: `1px solid ${TEAM_COLORS[i]}60`
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: NEON_COLORS.text }}>难度:</span>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map(diff => (
                  <motion.button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className="px-4 py-2 rounded-lg font-bold text-sm"
                    style={{
                      backgroundColor: difficulty === diff ? getDifficultyColor(diff) : `${NEON_COLORS.surface}80`,
                      color: difficulty === diff ? NEON_COLORS.darkPurple : NEON_COLORS.text
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难'}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: NEON_COLORS.text }}>每题时间:</span>
              <div className="flex gap-2">
                {[10, 15, 20, 30].map(time => (
                  <motion.button
                    key={time}
                    onClick={() => setTimePerQuestion(time)}
                    className="px-3 py-2 rounded-lg font-bold text-sm"
                    style={{
                      backgroundColor: timePerQuestion === time ? NEON_COLORS.neonPurple : `${NEON_COLORS.surface}80`,
                      color: timePerQuestion === time ? NEON_COLORS.white : NEON_COLORS.text
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {time}s
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: NEON_COLORS.text }}>题目数量:</span>
              <div className="flex gap-2">
                {[10, 15, 20, 30].map(num => (
                  <motion.button
                    key={num}
                    onClick={() => setTotalQuestions(num)}
                    className="px-3 py-2 rounded-lg font-bold text-sm"
                    style={{
                      backgroundColor: totalQuestions === num ? NEON_COLORS.neonPink : `${NEON_COLORS.surface}80`,
                      color: totalQuestions === num ? NEON_COLORS.white : NEON_COLORS.text
                    }}
                    whileHover={{ scale: 1.05 }}
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
            className="w-full px-8 py-4 rounded-xl font-bold text-xl"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonBlue})`,
              boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}60`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始比赛
          </motion.button>
        </motion.div>
      )}

      {(state.gamePhase === 'ready' || state.gamePhase === 'question' || state.gamePhase === 'answer') && (
        <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
          <div className="flex items-center justify-between w-full">
            {state.teams.map((team, index) => (
              <motion.div
                key={team.id}
                className="flex-1 p-4 rounded-2xl mx-2 text-center"
                style={{
                  backgroundColor: `${team.color}20`,
                  border: `2px solid ${team.color}60`,
                  opacity: index === state.currentTeamIndex ? 1 : 0.7
                }}
                animate={index === state.currentTeamIndex ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1, repeat: index === state.currentTeamIndex ? Infinity : 0 }}
              >
                <div className="font-bold text-lg" style={{ color: team.color }}>{team.name}</div>
                <div className="text-3xl font-bold" style={{ color: NEON_COLORS.white }}>{team.score}</div>
                {team.currentStreak > 1 && (
                  <div className="text-sm" style={{ color: NEON_COLORS.gold }}>
                    🔥 连胜 x{team.currentStreak}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {state.currentQuestion && (
              <motion.div
                key="question"
                className="w-full p-6 rounded-2xl"
                style={{
                  backgroundColor: `${NEON_COLORS.surface}90`,
                  border: `2px solid ${NEON_COLORS.neonPurple}40`
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: `${NEON_COLORS.neonPurple}30`,
                      color: NEON_COLORS.neonPurple
                    }}
                  >
                    {state.currentQuestion.category}
                  </div>
                  <div 
                    className="text-3xl font-bold px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: state.timeLeft <= 5 ? `${NEON_COLORS.danger}60` : `${NEON_COLORS.neonGreen}60`,
                      color: state.timeLeft <= 5 ? NEON_COLORS.danger : NEON_COLORS.neonGreen,
                      animation: state.timeLeft <= 5 ? 'pulse 0.5s infinite' : 'none'
                    }}
                  >
                    ⏱️ {state.timeLeft}s
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-center mb-6" style={{ color: NEON_COLORS.white }}>
                  {state.currentQuestion.text}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {state.currentQuestion.options.map((option, index) => {
                    let bgColor = `${NEON_COLORS.surface}60`;
                    let borderColor = `${NEON_COLORS.neonPurple}30`;
                    let textColor = NEON_COLORS.text;

                    if (state.isCorrect !== null) {
                      if (index === state.currentQuestion!.correctIndex) {
                        bgColor = `${NEON_COLORS.neonGreen}40`;
                        borderColor = NEON_COLORS.neonGreen;
                        textColor = NEON_COLORS.neonGreen;
                      } else if (index === state.selectedAnswer && state.selectedAnswer !== state.currentQuestion!.correctIndex) {
                        bgColor = `${NEON_COLORS.danger}40`;
                        borderColor = NEON_COLORS.danger;
                        textColor = NEON_COLORS.danger;
                      }
                    }

                    return (
                      <motion.button
                        key={index}
                        onClick={() => state.gamePhase === 'question' && handleAnswer(index)}
                        disabled={state.gamePhase !== 'question'}
                        className="p-4 rounded-xl font-bold text-lg text-left h-16 flex items-center"
                        style={{
                          backgroundColor: bgColor,
                          border: `2px solid ${borderColor}`,
                          color: textColor,
                          cursor: state.gamePhase === 'question' ? 'pointer' : 'default'
                        }}
                        whileHover={state.gamePhase === 'question' ? { scale: 1.02 } : {}}
                        whileTap={state.gamePhase === 'question' ? { scale: 0.98 } : {}}
                      >
                        <span className="mr-3 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${NEON_COLORS.neonPurple}40` }}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {state.gamePhase === 'answer' && (
                    <motion.div
                      className="mt-6 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div 
                        className="text-3xl font-bold mb-4"
                        style={{ color: state.isCorrect ? NEON_COLORS.neonGreen : NEON_COLORS.danger }}
                      >
                        {state.isCorrect ? '✅ 回答正确!' : '❌ 回答错误'}
                      </div>
                      {!state.isCorrect && state.currentQuestion && (
                        <div style={{ color: NEON_COLORS.text }}>
                          正确答案: <span style={{ color: NEON_COLORS.neonCyan }}>{state.currentQuestion.options[state.currentQuestion.correctIndex]}</span>
                        </div>
                      )}
                      <motion.button
                        onClick={handleContinue}
                        className="mt-4 px-8 py-3 rounded-xl font-bold text-lg"
                        style={{
                          backgroundColor: NEON_COLORS.neonBlue,
                          boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}60`
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        继续 →
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full">
            <div className="text-sm opacity-70 mb-2" style={{ color: NEON_COLORS.gold }}>
              排行榜
            </div>
            <div className="flex gap-2">
              {engine.getLeaderboard().map((team, index) => (
                <motion.div
                  key={team.id}
                  className="flex-1 p-3 rounded-xl text-center"
                  style={{
                    backgroundColor: `${team.color}30`,
                    border: `1px solid ${team.color}60`
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-sm" style={{ color: NEON_COLORS.gold }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="font-bold" style={{ color: team.color }}>{team.name}</div>
                  <div className="text-xl font-bold">{team.score}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {state.gamePhase === 'gameOver' && (
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
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🏆
              </motion.div>

              <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.gold }}>
                游戏结束!
              </h2>

              <div className="flex gap-6">
                {engine.getLeaderboard().slice(0, 3).map((team, index) => (
                  <motion.div
                    key={team.id}
                    className="p-4 rounded-2xl text-center"
                    style={{
                      backgroundColor: `${team.color}30`,
                      border: `2px solid ${team.color}`
                    }}
                    animate={index === 0 ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1, repeat: index === 0 ? Infinity : 0 }}
                  >
                    <div className="text-3xl mb-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="font-bold text-lg" style={{ color: team.color }}>{team.name}</div>
                    <div className="text-3xl font-bold">{team.score}</div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4 mt-4">
                <motion.button
                  onClick={handleReset}
                  className="px-8 py-4 rounded-xl font-bold text-lg"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonBlue})`,
                    boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}60`
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
                    backgroundColor: `${NEON_COLORS.neonPurple}40`,
                    color: NEON_COLORS.neonPurple,
                    border: `2px solid ${NEON_COLORS.neonPurple}`
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
