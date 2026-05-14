import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BOARD_SIZE = 15;
const CELL_SIZE = 35;
const CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;

export default function Gobangai() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<number[][]>(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [lastMove, setLastMove] = useState<{row: number, col: number} | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [winLine, setWinLine] = useState<{r1: number, c1: number, r2: number, c2: number} | null>(null);

  function createEmptyBoard() {
    const initial: number[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      initial[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        initial[i][j] = 0;
      }
    }
    return initial;
  }

  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal \
    [1, -1],  // diagonal /
  ];

  const checkWin = useCallback((row: number, col: number, player: number, boardState: number[][]) => {
    for (const [dr, dc] of directions) {
      let count = 1;
      let r1 = row, c1 = col;
      let r2 = row, c2 = col;

      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardState[r][c] === player) {
          count++;
          r2 = r; c2 = c;
        } else break;
      }

      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardState[r][c] === player) {
          count++;
          r1 = r; c1 = c;
        } else break;
      }

      if (count >= 5) {
        return { r1, c1, r2, c2 };
      }
    }
    return null;
  }, []);

  const evaluatePosition = useCallback((row: number, col: number, player: number, boardState: number[][]) => {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;

    const countLine = (r: number, c: number, dr: number, dc: number, p: number) => {
      let count = 0;
      let openEnds = 0;
      let currentR = r + dr;
      let currentC = c + dc;
      while (currentR >= 0 && currentR < BOARD_SIZE && currentC >= 0 && currentC < BOARD_SIZE) {
        if (boardState[currentR][currentC] === p) count++;
        else if (boardState[currentR][currentC] === 0) { openEnds++; break; }
        else break;
        currentR += dr;
        currentC += dc;
      }
      let backR = r - dr;
      let backC = c - dc;
      while (backR >= 0 && backR < BOARD_SIZE && backC >= 0 && backC < BOARD_SIZE) {
        if (boardState[backR][backC] === p) count++;
        else if (boardState[backR][backC] === 0) { openEnds++; break; }
        else break;
        backR -= dr;
        backC -= dc;
      }
      return { count, openEnds };
    };

    for (const [dr, dc] of directions) {
      const { count, openEnds } = countLine(row, col, dr, dc, player);
      if (count >= 5) score += 100000;
      else if (count === 4 && openEnds === 2) score += 10000;
      else if (count === 4 && openEnds === 1) score += 1000;
      else if (count === 3 && openEnds === 2) score += 1000;
      else if (count === 3 && openEnds === 1) score += 100;
      else if (count === 2 && openEnds === 2) score += 100;
      else if (count === 2 && openEnds === 1) score += 10;
    }

    const { count: oppCount, openEnds: oppEnds } = countLine(row, col, 1, 0, opponent);
    if (oppCount >= 5) score += 50000;
    else if (oppCount === 4 && oppEnds === 2) score += 5000;
    else if (oppCount === 4 && oppEnds === 1) score += 500;

    const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
    score += Math.max(0, 14 - centerDist);

    return score;
  }, []);

  const getAIMove = useCallback((boardState: number[][]) => {
    let bestScore = -Infinity;
    let bestMove = { row: 7, col: 7 };
    const candidates: { row: number, col: number }[] = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (boardState[i][j] !== 0) continue;
        let hasNeighbor = false;
        for (let di = -2; di <= 2; di++) {
          for (let dj = -2; dj <= 2; dj++) {
            const ni = i + di, nj = j + dj;
            if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE) {
              if (boardState[ni][nj] !== 0) hasNeighbor = true;
            }
          }
        }
        if (hasNeighbor) candidates.push({ row: i, col: j });
      }
    }

    if (candidates.length === 0) {
      return { row: 7, col: 7 };
    }

    for (const move of candidates) {
      const score = evaluatePosition(move.row, move.col, 2, boardState);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }, [evaluatePosition]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || currentPlayer !== 1 || isThinking) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    if (board[row][col] !== 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    setBoard(newBoard);
    setLastMove({ row, col });

    const winResult = checkWin(row, col, 1, newBoard);
    if (winResult) {
      setGameOver(true);
      setWinner(1);
      setWinLine(winResult);
      setScore1(prev => prev + 1);
      return;
    }

    setCurrentPlayer(2);
    setIsThinking(true);

    setTimeout(() => {
      const aiMove = getAIMove(newBoard);
      const aiBoard = newBoard.map(r => [...r]);
      aiBoard[aiMove.row][aiMove.col] = 2;
      setBoard(aiBoard);
      setLastMove(aiMove);

      const aiWinResult = checkWin(aiMove.row, aiMove.col, 2, aiBoard);
      if (aiWinResult) {
        setGameOver(true);
        setWinner(2);
        setWinLine(aiWinResult);
        setScore2(prev => prev + 1);
      } else {
        setCurrentPlayer(1);
      }
      setIsThinking(false);
    }, 300);
  }, [board, currentPlayer, gameOver, checkWin, getAIMove, isThinking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(CELL_SIZE / 2, CELL_SIZE / 2 + i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE - CELL_SIZE / 2, CELL_SIZE / 2 + i * CELL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(CELL_SIZE / 2 + i * CELL_SIZE, CELL_SIZE / 2);
      ctx.lineTo(CELL_SIZE / 2 + i * CELL_SIZE, CANVAS_SIZE - CELL_SIZE / 2);
      ctx.stroke();
    }

    const starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
    ctx.fillStyle = '#000';
    for (const [r, c] of starPoints) {
      ctx.beginPath();
      ctx.arc(CELL_SIZE / 2 + c * CELL_SIZE, CELL_SIZE / 2 + r * CELL_SIZE, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] !== 0) {
          const centerX = CELL_SIZE / 2 + j * CELL_SIZE;
          const centerY = CELL_SIZE / 2 + i * CELL_SIZE;
          const radius = CELL_SIZE * 0.4;

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            centerX - radius / 3, centerY - radius / 3, 0,
            centerX, centerY, radius
          );

          if (board[i][j] === 1) {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
          } else {
            gradient.addColorStop(0, '#333');
            gradient.addColorStop(1, '#111');
          }

          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.strokeStyle = board[i][j] === 1 ? '#999' : '#666';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (lastMove) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        CELL_SIZE / 2 + lastMove.col * CELL_SIZE - CELL_SIZE / 2 + 2,
        CELL_SIZE / 2 + lastMove.row * CELL_SIZE - CELL_SIZE / 2 + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    }

    if (winLine) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(CELL_SIZE / 2 + winLine.c1 * CELL_SIZE, CELL_SIZE / 2 + winLine.r1 * CELL_SIZE);
      ctx.lineTo(CELL_SIZE / 2 + winLine.c2 * CELL_SIZE, CELL_SIZE / 2 + winLine.r2 * CELL_SIZE);
      ctx.stroke();
    }

  }, [board, lastMove, winLine]);

  const handleRestart = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(1);
    setGameOver(false);
    setWinner(null);
    setLastMove(null);
    setIsThinking(false);
    setWinLine(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" 
         style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6"
        style={{ color: '#FFD700' }}
      >
        ⚫⚪ 五子棋 / Gomoku
      </motion.h1>

      <div className="flex gap-8 mb-4">
        <div className="text-center px-6 py-3 rounded-xl" 
             style={{ 
               background: currentPlayer === 1 && !gameOver ? 'rgba(255,255,255,0.2)' : 'rgba(100,100,100,0.2)',
               border: `2px solid ${currentPlayer === 1 && !gameOver ? '#fff' : '#666'}`
             }}>
          <div style={{ color: '#fff' }}>⚫ 黑方 (玩家)</div>
          <div className="text-2xl font-bold" style={{ color: '#fff' }}>胜: {score1}</div>
        </div>

        <div className="text-center px-6 py-3 rounded-xl"
             style={{ 
               background: currentPlayer === 2 && !gameOver ? 'rgba(50,50,50,0.4)' : 'rgba(100,100,100,0.2)',
               border: `2px solid ${currentPlayer === 2 && !gameOver ? '#666' : '#666'}`
             }}>
          <div style={{ color: '#888' }}>⚪ 白方 (AI)</div>
          <div className="text-2xl font-bold" style={{ color: '#888' }}>胜: {score2}</div>
        </div>
      </div>

      <div className="mb-4 text-center px-4 py-2 rounded-lg"
           style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
        {gameOver 
          ? `🎉 游戏结束! ${winner === 1 ? '⚫ 黑方' : '⚪ 白方'}获胜!` 
          : isThinking
            ? '🤖 AI思考中...'
            : `${currentPlayer === 1 ? '⚫ 黑方' : '⚪ 白方'}的回合`}
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          boxShadow: `0 0 30px rgba(255, 215, 0, 0.3)`,
          border: '4px solid #FFD700'
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onClick={handleClick}
          style={{ 
            cursor: gameOver || currentPlayer !== 1 || isThinking ? 'not-allowed' : 'pointer', 
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </motion.div>

      <div className="flex gap-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRestart}
          className="px-6 py-3 rounded-xl font-bold text-lg"
          style={{ 
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000'
          }}
        >
          🔄 重新开始
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl font-bold text-lg"
          style={{ 
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '2px solid #FFD700'
          }}
        >
          🏠 返回首页
        </motion.button>
      </div>

      <div className="mt-6 text-center text-sm" style={{ color: '#888', maxWidth: '500px' }}>
        <p>🎮 <strong>游戏规则：</strong></p>
        <p>• 黑方先手，轮流在棋盘上放置棋子</p>
        <p>• 横、竖、斜方向连成5子获胜</p>
        <p>• 先手有禁手限制（可选）</p>
        <p>• 点击棋盘交叉点放置棋子</p>
      </div>
    </div>
  );
}
