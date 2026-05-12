import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { TetrisBattleEngine } from './engine';

const TETRIS_BATTLE_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 700,
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  CELL_SIZE: 30
};

const STORAGE_KEYS_TETRIS_BATTLE = {
  TETRIS_BATTLE: 'mouyu_tetris_battle'
};

type GameStatus = 'idle' | 'playing' | 'gameover';

interface TetrisBattleProps {}

export default function TetrisBattle(props: TetrisBattleProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TetrisBattleEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const p1TimerRef = useRef<number>(0);
  const p2TimerRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1PendingDirty, setP1PendingDirty] = useState(0);
  const [p2PendingDirty, setP2PendingDirty] = useState(0);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS_TETRIS_BATTLE.TETRIS_BATTLE, 0);

  const keysPressed = useRef<Set<string>>(new Set());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = engine.getBoardDimensions();
    const { p1: p1Offset, p2: p2Offset } = engine.getBoardOffset();
    const cellSize = engine.getCellSize();

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, TETRIS_BATTLE_CONSTANTS.CANVAS_WIDTH, TETRIS_BATTLE_CONSTANTS.CANVAS_HEIGHT);

    const drawBoard = (board: number[][], offsetX: number, offsetY: number, pendingDirty: number) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let r = 0; r < TETRIS_BATTLE_CONSTANTS.BOARD_HEIGHT; r++) {
        for (let c = 0; c < TETRIS_BATTLE_CONSTANTS.BOARD_WIDTH; c++) {
          const x = offsetX + c * cellSize;
          const y = offsetY + r * cellSize;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          const x = offsetX + c * cellSize;
          const y = offsetY + r * cellSize;

          if (board[r][c]) {
            const color = board[r][c] === 8 ? '#666' : engine.getPieceColor(board[r][c]);
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          }
        }
      }

      if (pendingDirty > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(offsetX, offsetY, width, height);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${pendingDirty} 惩罚行`, offsetX + width / 2, offsetY - 10);
      }
    };

    const drawCurrentPiece = (piece: { shape: number[][]; type: number } | null, position: { x: number; y: number }, offsetX: number, offsetY: number) => {
      if (!piece) return;

      const color = engine.getPieceColor(piece.type + 1);

      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const x = offsetX + (position.x + c) * cellSize;
            const y = offsetY + (position.y + r) * cellSize;

            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          }
        }
      }
    };

    const state = engine.getState();

    drawBoard(state.p1.board, p1Offset.x, p1Offset.y, state.p1.pendingDirtyLines);
    drawBoard(state.p2.board, p2Offset.x, p2Offset.y, state.p2.pendingDirtyLines);

    drawCurrentPiece(state.p1.currentPiece, state.p1.currentPosition, p1Offset.x, p1Offset.y);
    drawCurrentPiece(state.p2.currentPiece, state.p2.currentPosition, p2Offset.x, p2Offset.y);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P1', p1Offset.x + width / 2, p1Offset.y - 25);
    ctx.fillText('P2', p2Offset.x + width / 2, p2Offset.y - 25);

    setP1Score(state.p1.score);
    setP2Score(state.p2.score);
    setP1PendingDirty(state.p1.pendingDirtyLines);
    setP2PendingDirty(state.p2.pendingDirtyLines);

    if (state.winner) {
      setWinner(state.winner);
      setGameStatus('gameover');
      const totalScore = state.p1.score + state.p2.score;
      if (totalScore > highScore) {
        setHighScore(totalScore);
      }
    }
  }, [highScore, setHighScore]);

  const gameLoop = useCallback((timestamp: number) => {
    const engine = engineRef.current;
    if (!engine || gameStatus !== 'playing') return;

    if (!p1TimerRef.current) p1TimerRef.current = timestamp;
    if (!p2TimerRef.current) p2TimerRef.current = timestamp;

    const p1Delta = timestamp - p1TimerRef.current;
    const p2Delta = timestamp - p2TimerRef.current;

    const p1Speed = engine.getP1Speed();
    const p2Speed = engine.getP2Speed();

    if (p1Delta >= p1Speed) {
      engine.tick(1);
      engine.applyPendingDirtyLines(1);
      p1TimerRef.current = timestamp;
    }

    if (p2Delta >= p2Speed) {
      engine.tick(2);
      engine.applyPendingDirtyLines(2);
      p2TimerRef.current = timestamp;
    }

    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameStatus, draw]);

  const startGame = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new TetrisBattleEngine();
    } else {
      engineRef.current.reset();
    }

    p1TimerRef.current = 0;
    p2TimerRef.current = 0;
    setWinner(null);
    setGameStatus('playing');
  }, []);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new TetrisBattleEngine();
    }
    draw();
  }, [draw]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStatus, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      const engine = engineRef.current;
      if (!engine) return;

      if (keysPressed.current.has(e.code)) return;
      keysPressed.current.add(e.code);

      switch (e.code) {
        case 'KeyA':
          engine.move(1, 'left');
          break;
        case 'KeyD':
          engine.move(1, 'right');
          break;
        case 'KeyW':
          engine.rotate(1);
          break;
        case 'KeyS':
          engine.move(1, 'down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          engine.move(2, 'left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          engine.move(2, 'right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          engine.rotate(2);
          break;
        case 'ArrowDown':
          e.preventDefault();
          engine.move(2, 'down');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus]);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="glass-card rounded-3xl p-6 mb-6"
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 0 40px ${NEON_COLORS.neonPurple}30`
        }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-3xl font-black text-center mb-2" style={{
          color: NEON_COLORS.neonPink,
          textShadow: `0 0 30px ${NEON_COLORS.neonPink}80`
        }}>
          Tetris Battle
        </h1>
        <p className="text-sm text-center" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          双人俄罗斯方块对战
        </p>
      </motion.div>

      <div className="flex gap-6 items-start mb-6">
        <motion.div
          className="glass-card rounded-2xl p-4 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>P1 分数</div>
          <div className="text-2xl font-black" style={{ color: NEON_COLORS.neonBlue }}>{p1Score}</div>
          {p2PendingDirty > 0 && (
            <div className="text-xs mt-1" style={{ color: '#ff4444' }}>
              收到 {p2PendingDirty} 行惩罚!
            </div>
          )}
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-4 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>P2 分数</div>
          <div className="text-2xl font-black" style={{ color: NEON_COLORS.neonGreen }}>{p2Score}</div>
          {p1PendingDirty > 0 && (
            <div className="text-xs mt-1" style={{ color: '#ff4444' }}>
              收到 {p1PendingDirty} 行惩罚!
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <canvas
          ref={canvasRef}
          width={TETRIS_BATTLE_CONSTANTS.CANVAS_WIDTH}
          height={TETRIS_BATTLE_CONSTANTS.CANVAS_HEIGHT}
          className="rounded-2xl"
          style={{
            boxShadow: `0 0 60px ${NEON_COLORS.neonPurple}40, 0 20px 60px rgba(0, 0, 0, 0.5)`,
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}
        />
      </motion.div>

      {gameStatus === 'idle' && (
        <motion.div
          className="mt-6 flex gap-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={startGame}
            className="px-8 py-4 rounded-xl font-bold text-lg"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
              color: '#ffffff',
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}60`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${NEON_COLORS.neonPink}80` }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>
          <motion.button
            onClick={handleBack}
            className="px-6 py-4 rounded-xl font-bold"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回主页
          </motion.button>
        </motion.div>
      )}

      {gameStatus === 'playing' && (
        <motion.div
          className="mt-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="glass-card rounded-xl p-4" style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="flex gap-8 text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              <div>
                <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>P1:</span> A/D 移动 | W 旋转 | S 加速
              </div>
              <div>
                <span className="font-bold" style={{ color: NEON_COLORS.neonGreen }}>P2:</span> ←/→ 移动 | ↑ 旋转 | ↓ 加速
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {gameStatus === 'gameover' && (
        <motion.div
          className="mt-6 flex flex-col items-center gap-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div
            className="glass-card rounded-2xl p-6 text-center"
            style={{
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `2px solid ${winner === 1 ? NEON_COLORS.neonBlue : NEON_COLORS.neonGreen}`
            }}
          >
            <div
              className="text-4xl font-black mb-2"
              style={{
                color: winner === 1 ? NEON_COLORS.neonBlue : NEON_COLORS.neonGreen,
                textShadow: `0 0 30px ${winner === 1 ? NEON_COLORS.neonBlue : NEON_COLORS.neonGreen}`
              }}
            >
              {winner === 1 ? 'P1 胜利!' : 'P2 胜利!'}
            </div>
            <div className="text-lg mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              P1: {p1Score} | P2: {p2Score}
            </div>
            {p1Score + p2Score >= highScore && (
              <div className="text-sm font-bold mb-4" style={{ color: NEON_COLORS.gold }}>
                新纪录! 总分: {p1Score + p2Score}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <motion.button
              onClick={startGame}
              className="px-8 py-4 rounded-xl font-bold text-lg"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                color: '#ffffff',
                boxShadow: `0 0 30px ${NEON_COLORS.neonPink}60`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再来一局
            </motion.button>
            <motion.button
              onClick={handleBack}
              className="px-6 py-4 rounded-xl font-bold"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              返回主页
            </motion.button>
          </div>
        </motion.div>
      )}

      <motion.div
        className="mt-4 text-sm"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        最高记录: {highScore}
      </motion.div>
    </motion.div>
  );
}
