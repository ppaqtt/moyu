import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BRAIN_TEST_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { BrainTestEngine } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = BRAIN_TEST_CONSTANTS;

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function BrainTest() {
  const navigate = useNavigate();
  const [engine] = useState(() => new BrainTestEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [currentQuestion, setCurrentQuestion] = useState(() => engine.getCurrentQuestion());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [progress, setProgress] = useState({ current: 1, total: 10 });
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.BRAIN_TEST, 0);
  const [showExplanation, setShowExplanation] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleScoreUpdate = useCallback((newScore: number) => {
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);
  }, [drawBackground]);

  const internalGameOver = useCallback(() => {
    engine.stopTimer();
    const state = engine.getState();
    setGameStatus('gameover');
    setScore(state.score);
    
    if (state.score > highScore) {
      setHighScore(state.score);
    }
  }, [engine, highScore, setHighScore]);

  const startGame = useCallback(() => {
    engine.start();
    engine.startTimer((remaining) => {
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        internalGameOver();
      }
    });
    
    const state = engine.getState();
    setGameStatus('playing');
    setScore(state.score);
    setCurrentQuestion(engine.getCurrentQuestion());
    setProgress(engine.getProgress());
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
  }, [engine, internalGameOver]);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || gameStatus !== 'playing') return;

    const correct = engine.selectAnswer(answerIndex);
    const state = engine.getState();
    
    setSelectedAnswer(answerIndex);
    setIsCorrect(correct);
    setScore(state.score);
    setShowExplanation(true);

    setTimeout(() => {
      const hasNext = engine.nextQuestion();
      if (hasNext) {
        setCurrentQuestion(engine.getCurrentQuestion());
        setProgress(engine.getProgress());
        setSelectedAnswer(null);
        setIsCorrect(null);
        setShowExplanation(false);
      } else {
        internalGameOver();
      }
    }, 2000);
  }, [engine, gameStatus, selectedAnswer, internalGameOver]);

  const handleRestart = useCallback(() => {
    engine.reset();
    startGame();
  }, [engine, startGame]);

  const handleExitBtn = useCallback(() => {
    engine.stopTimer();
    engine.reset();
    navigate('/');
  }, [engine, navigate]);

  const getOptionStyle = (index: number) => {
    const baseStyle = {
      width: '100%',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '2px solid',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
      fontWeight: 500,
      textAlign: 'left' as const,
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
    };

    if (selectedAnswer === null) {
      return {
        ...baseStyle,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        color: NEON_COLORS.white,
      };
    }

    if (index === currentQuestion?.correctAnswer) {
      return {
        ...baseStyle,
        borderColor: '#39ff14',
        background: 'rgba(57, 255, 20, 0.2)',
        color: '#39ff14',
        boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
      };
    }

    if (selectedAnswer === index && index !== currentQuestion?.correctAnswer) {
      return {
        ...baseStyle,
        borderColor: '#ff4757',
        background: 'rgba(255, 71, 87, 0.2)',
        color: '#ff4757',
        boxShadow: '0 0 20px rgba(255, 71, 87, 0.3)',
      };
    }

    return {
      ...baseStyle,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.5)',
      cursor: 'default',
    };
  };

  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-2xl"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      <div className="relative z-10 w-full max-w-[500px] px-4">
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={handleExitBtn}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>
              得分
            </div>
            <div className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
              {score}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>
              最高分
            </div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {highScore}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {gameStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-2xl p-8 text-center"
              style={{
                background: 'rgba(26, 26, 46, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <motion.div
                className="text-6xl mb-6"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                🧠
              </motion.div>
              
              <h2 
                className="text-3xl font-bold mb-4"
                style={{ color: NEON_COLORS.neonPink }}
              >
                脑力测试
              </h2>
              
              <p 
                className="text-lg mb-6 opacity-80"
                style={{ color: NEON_COLORS.gold }}
              >
                测试你的脑筋急转弯能力！
              </p>

              <div 
                className="flex flex-col gap-3 text-sm opacity-70 mb-8"
                style={{ color: NEON_COLORS.white }}
              >
                <div>📝 共 {BRAIN_TEST_CONSTANTS.QUESTION_COUNT} 道题目</div>
                <div>⏱️ 时间限制 {BRAIN_TEST_CONSTANTS.TIME_LIMIT} 秒</div>
                <div>⭐ 答对 +10分 + 时间奖励</div>
              </div>

              <motion.button
                onClick={startGame}
                className="px-8 py-4 rounded-xl font-bold text-lg"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`,
                }}
                whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${NEON_COLORS.neonPink}` }}
                whileTap={{ scale: 0.95 }}
              >
                开始挑战
              </motion.button>
            </motion.div>
          )}

          {gameStatus === 'playing' && currentQuestion && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="glass-card rounded-2xl p-6"
              style={{
                background: 'rgba(26, 26, 46, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div 
                  className="text-sm px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: NEON_COLORS.gold,
                  }}
                >
                  {progress.current} / {progress.total}
                </div>

                <motion.div
                  className="flex items-center gap-2"
                  animate={{
                    scale: timeRemaining <= 10 ? [1, 1.1, 1] : 1,
                    color: timeRemaining <= 10 ? '#ff4757' : NEON_COLORS.neonBlue,
                  }}
                  transition={{ duration: 0.5, repeat: timeRemaining <= 10 ? Infinity : 0 }}
                >
                  <span className="text-xl">⏱️</span>
                  <span className="text-2xl font-bold">{timeRemaining}</span>
                </motion.div>
              </div>

              <div 
                className="mb-6 p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <p 
                  className="text-lg font-medium leading-relaxed"
                  style={{ color: NEON_COLORS.white }}
                >
                  {currentQuestion.question}
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-4">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                    className="relative"
                    style={getOptionStyle(index)}
                    whileHover={selectedAnswer === null ? { scale: 1.02, x: 5 } : {}}
                    whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                  >
                    <span 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg mr-3 font-bold text-sm"
                      style={{
                        background: selectedAnswer === index
                          ? (isCorrect ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 71, 87, 0.3)')
                          : 'rgba(255, 255, 255, 0.1)',
                        color: selectedAnswer === index
                          ? (isCorrect ? '#39ff14' : '#ff4757')
                          : NEON_COLORS.neonBlue,
                      }}
                    >
                      {getOptionLetter(index)}
                    </span>
                    {option}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {showExplanation && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: isCorrect 
                        ? 'rgba(57, 255, 20, 0.1)' 
                        : 'rgba(255, 71, 87, 0.1)',
                      border: `1px solid ${isCorrect ? '#39ff14' : '#ff4757'}30`,
                    }}
                  >
                    <div 
                      className="text-sm font-medium mb-1"
                      style={{ color: isCorrect ? '#39ff14' : '#ff4757' }}
                    >
                      {isCorrect ? '✅ 回答正确!' : '❌ 回答错误'}
                    </div>
                    <p 
                      className="text-sm opacity-80"
                      style={{ color: NEON_COLORS.white }}
                    >
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {gameStatus === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card rounded-2xl p-8 text-center"
              style={{
                background: 'rgba(26, 26, 46, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <motion.div
                className="text-6xl mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                {score >= 80 ? '🏆' : score >= 50 ? '🎉' : '💪'}
              </motion.div>

              <h2 
                className="text-3xl font-bold mb-2"
                style={{ color: NEON_COLORS.neonPink }}
              >
                {score >= 80 ? '太厉害了!' : score >= 50 ? '不错哦!' : '继续加油!'}
              </h2>

              <p 
                className="text-lg opacity-70 mb-6"
                style={{ color: NEON_COLORS.gold }}
              >
                游戏结束
              </p>

              <div 
                className="text-5xl font-bold mb-6"
                style={{ 
                  color: NEON_COLORS.neonPink,
                  textShadow: `0 0 30px ${NEON_COLORS.neonPink}50`,
                }}
              >
                {score}
                <span className="text-xl opacity-60">分</span>
              </div>

              {score > highScore - score === false && score === highScore && (
                <motion.div
                  className="text-lg font-bold mb-4"
                  style={{ color: NEON_COLORS.gold }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🎯 最高分记录!
                </motion.div>
              )}

              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={handleRestart}
                  className="px-8 py-4 rounded-xl font-bold text-lg"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`,
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${NEON_COLORS.neonPink}` }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>

                <motion.button
                  onClick={handleExitBtn}
                  className="px-8 py-4 rounded-xl font-bold text-lg"
                  style={{
                    background: 'transparent',
                    color: NEON_COLORS.neonBlue,
                    border: `2px solid ${NEON_COLORS.neonBlue}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回首页
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
