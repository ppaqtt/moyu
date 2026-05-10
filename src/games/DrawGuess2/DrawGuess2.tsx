import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { DrawGuess2Engine, COLORS, BRUSH_SIZES, Stroke, WORD_CATEGORIES } from './engine';

interface DrawGuess2Props {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function DrawGuess2({ onScoreUpdate, onGameOver, onExit }: DrawGuess2Props) {
  const [engine] = useState(() => new DrawGuess2Engine());
  const [state, setState] = useState(() => engine.getState());
  const [guessInput, setGuessInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('animals');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS?.DRAW_GUESS_2 || 'drawguess2_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const interval = setInterval(updateState, 100);
    return () => clearInterval(interval);
  }, [updateState]);

  useEffect(() => {
    onScoreUpdate(state.score);
    if (state.gamePhase === 'waiting' && state.round === state.maxRounds && state.score > 0) {
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [state.score, state.gamePhase, state.round, state.maxRounds, onScoreUpdate, onGameOver, updateScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const stroke of state.strokes) {
      drawStroke(ctx, stroke);
    }

    if (state.currentStroke) {
      drawStroke(ctx, state.currentStroke);
    }
  }, [state.strokes, state.currentStroke]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 1) return;
    
    ctx.globalAlpha = stroke.opacity || 1;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (stroke.tool === 'spray') {
      for (const point of stroke.points) {
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, stroke.width / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (point) {
      engine.startDrawing(point.x, point.y);
      updateState();
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (point) {
      engine.continueDrawing(point.x, point.y);
      updateState();
    }
  };

  const handleMouseUp = () => {
    engine.endDrawing();
    updateState();
  };

  const handleStartGame = () => {
    engine.setCategory(selectedCategory);
    engine.startGame();
    updateState();
  };

  const handleNextRound = () => {
    engine.nextRound();
    updateState();
  };

  const handleGuess = () => {
    if (guessInput.trim()) {
      const correct = engine.makeGuess(guessInput.trim());
      if (correct) {
        setGuessInput('');
      }
      updateState();
    }
  };

  const handleSave = () => {
    const dataUrl = engine.saveDrawing();
    const link = document.createElement('a');
    link.download = `drawguess2_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="flex items-center justify-between w-full max-w-[850px] px-4"
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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>时间</div>
            <div 
              className="text-2xl font-bold"
              style={{ color: state.timeLeft <= 10 ? NEON_COLORS.danger : NEON_COLORS.neonGreen }}
            >
              {state.timeLeft}s
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </motion.div>

      {state.gamePhase === 'waiting' && (
        <motion.div
          className="flex flex-col items-center gap-6 p-8 rounded-2xl backdrop-blur-md"
          style={{
            backgroundColor: `${NEON_COLORS.surface}90`,
            border: `2px solid ${NEON_COLORS.neonPurple}40`,
            boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}20`
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            你画我猜 2
          </h2>
          <p className="text-center" style={{ color: NEON_COLORS.textDim }}>
            选择类别绘画，让其他玩家猜出答案！<br/>
            每轮90秒，共5轮，支持多种绘画工具
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(WORD_CATEGORIES).map(([key, cat]) => (
              <motion.button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className="px-4 py-2 rounded-lg font-bold text-sm"
                style={{
                  backgroundColor: selectedCategory === key ? NEON_COLORS.neonPurple : `${NEON_COLORS.surface}80`,
                  color: selectedCategory === key ? NEON_COLORS.white : NEON_COLORS.text
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>

          <motion.button
            onClick={handleStartGame}
            className="px-8 py-3 rounded-xl font-bold text-lg"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
              color: NEON_COLORS.white,
              boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>
        </motion.div>
      )}

      {state.gamePhase !== 'waiting' && (
        <>
          <div className="flex items-center gap-4">
            <motion.div 
              className="px-6 py-2 rounded-xl font-bold text-lg backdrop-blur-sm"
              style={{
                backgroundColor: `${NEON_COLORS.darkPurple}80`,
                color: NEON_COLORS.neonCyan,
                border: `2px solid ${NEON_COLORS.neonCyan}60`
              }}
            >
              题目: {state.currentWord}
            </motion.div>
            <motion.button
              onClick={() => { engine.toggleHint(); updateState(); }}
              className="px-4 py-2 rounded-lg font-bold text-sm"
              style={{
                backgroundColor: state.showHint ? NEON_COLORS.gold : `${NEON_COLORS.neonPurple}40`,
                color: state.showHint ? NEON_COLORS.darkPurple : NEON_COLORS.neonPurple,
                border: `1px solid ${NEON_COLORS.neonPurple}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              提示: {state.showHint ? engine.getCurrentHint() : '点击查看'}
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl backdrop-blur-sm"
            style={{
              backgroundColor: `${NEON_COLORS.surface}80`,
              border: `1px solid ${NEON_COLORS.neonBlue}30`
            }}
          >
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>工具:</span>
              {(['brush', 'eraser', 'spray'] as const).map(tool => (
                <motion.button
                  key={tool}
                  onClick={() => { engine.setTool(tool); updateState(); }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    backgroundColor: state.currentTool === tool ? NEON_COLORS.neonBlue : `${NEON_COLORS.darkPurple}60`,
                    color: NEON_COLORS.white
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tool === 'brush' ? '✏️' : tool === 'eraser' ? '🧹' : '💨'}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>粗细:</span>
              {BRUSH_SIZES.map(size => (
                <motion.button
                  key={size}
                  onClick={() => { engine.setWidth(size); updateState(); }}
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: Math.min(size + 12, 24),
                    height: Math.min(size + 12, 24),
                    backgroundColor: state.currentWidth === size ? NEON_COLORS.neonCyan : `${NEON_COLORS.darkPurple}60`,
                    border: `2px solid ${NEON_COLORS.neonCyan}`
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm mr-2" style={{ color: NEON_COLORS.textDim }}>颜色:</span>
              {COLORS.slice(0, 12).map(color => (
                <motion.button
                  key={color}
                  onClick={() => { engine.setColor(color); updateState(); }}
                  className="w-8 h-8 rounded-lg border-2"
                  style={{
                    backgroundColor: color,
                    borderColor: state.currentColor === color ? NEON_COLORS.white : 'transparent'
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <motion.button
                onClick={() => { engine.undo(); updateState(); }}
                className="px-3 py-2 rounded-lg font-bold text-sm"
                style={{
                  backgroundColor: `${NEON_COLORS.warning}40`,
                  color: NEON_COLORS.warning
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ↩️ 撤销
              </motion.button>
              <motion.button
                onClick={() => { engine.clear(); updateState(); }}
                className="px-3 py-2 rounded-lg font-bold text-sm"
                style={{
                  backgroundColor: `${NEON_COLORS.danger}40`,
                  color: NEON_COLORS.danger
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🗑️ 清空
              </motion.button>
              <motion.button
                onClick={handleSave}
                className="px-3 py-2 rounded-lg font-bold text-sm"
                style={{
                  backgroundColor: `${NEON_COLORS.neonGreen}40`,
                  color: NEON_COLORS.neonGreen
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💾 保存
              </motion.button>
            </div>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30`,
              border: `3px solid ${NEON_COLORS.neonPurple}50`
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="cursor-crosshair"
              style={{ backgroundColor: '#ffffff' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            />
          </div>

          <div className="flex items-center gap-2 w-full max-w-[800px]">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="输入你的猜测..."
              className="flex-1 px-4 py-3 rounded-xl bg-opacity-20 backdrop-blur-sm outline-none"
              style={{
                backgroundColor: `${NEON_COLORS.darkPurple}60`,
                color: NEON_COLORS.white,
                border: `2px solid ${NEON_COLORS.neonBlue}40`
              }}
            />
            <motion.button
              onClick={handleGuess}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonBlue,
                color: NEON_COLORS.white,
                boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}60`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              猜测
            </motion.button>
          </div>

          {state.guesses.length > 0 && (
            <div className="flex flex-wrap gap-2 w-full max-w-[800px]">
              <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>猜测记录:</span>
              {state.guesses.map((guess, index) => (
                <motion.span
                  key={index}
                  className="px-2 py-1 rounded text-sm"
                  style={{
                    backgroundColor: `${NEON_COLORS.neonPurple}30`,
                    color: NEON_COLORS.neonPurple
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {guess}
                </motion.span>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {state.gamePhase === 'result' && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="p-8 rounded-2xl backdrop-blur-xl flex flex-col items-center gap-6"
              style={{
                backgroundColor: `${NEON_COLORS.surface}95`,
                border: `2px solid ${state.correctGuess ? NEON_COLORS.neonGreen : NEON_COLORS.neonPink}`,
                boxShadow: `0 0 40px ${state.correctGuess ? NEON_COLORS.neonGreen : NEON_COLORS.neonPink}40`
              }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <div className="text-5xl">{state.correctGuess ? '🎉' : '⏰'}</div>
              <h2 
                className="text-3xl font-bold"
                style={{ color: state.correctGuess ? NEON_COLORS.neonGreen : NEON_COLORS.neonPink }}
              >
                {state.correctGuess ? '猜对了!' : '时间到!'}
              </h2>
              <div className="text-xl" style={{ color: NEON_COLORS.text }}>
                答案是: <span style={{ color: NEON_COLORS.neonCyan, fontWeight: 'bold' }}>{state.currentWord}</span>
              </div>
              <div className="text-lg" style={{ color: NEON_COLORS.gold }}>
                当前得分: {state.score}
              </div>
              <div className="flex gap-4">
                {state.round < state.maxRounds ? (
                  <motion.button
                    onClick={handleNextRound}
                    className="px-8 py-3 rounded-xl font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonBlue,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    下一轮
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={onExit}
                    className="px-8 py-3 rounded-xl font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonGreen,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    完成
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
