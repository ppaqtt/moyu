import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BOARD_SIZE = 8;
const CELL_SIZE = 60;
const CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;

export default function Reversi() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<number[][]>(() => createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [validMoves, setValidMoves] = useState<{row: number, col: number}[]>([]);
  const [score1, setScore1] = useState(2);
  const [score2, setScore2] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | 0 | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  function createInitialBoard() {
    const initial: number[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      initial[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        initial[i][j] = 0;
      }
    }
    initial[3][3] = 2;
    initial[3][4] = 1;
    initial[4][3] = 1;
    initial[4][4] = 2;
    return initial;
  }

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0], [1, 1]
  ];

  const getFlips = useCallback((row: number, col: number, player: number, boardState: number[][]) => {
    if (boardState[row][col] !== 0) return [];
    
    const opponent = player === 1 ? 2 : 1;
    const allFlips: {row: number, col: number}[] = [];
    
    for (const [dr, dc] of directions) {
      const flips: {row: number, col: number}[] = [];
      let r = row + dr;
      let c = col + dc;
      
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (boardState[r][c] === opponent) {
          flips.push({row: r, col: c});
        } else if (boardState[r][c] === player) {
          allFlips.push(...flips);
          break;
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    }
    
    return allFlips;
  }, []);

  const getAllValidMoves = useCallback((player: number, boardState: number[][]) => {
    const moves: {row: number, col: number}[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (getFlips(i, j, player, boardState).length > 0) {
          moves.push({row: i, col: j});
        }
      }
    }
    return moves;
  }, [getFlips]);

  const updateScores = useCallback((boardState: number[][]) => {
    let p1 = 0, p2 = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (boardState[i][j] === 1) p1++;
        if (boardState[i][j] === 2) p2++;
      }
    }
    setScore1(p1);
    setScore2(p2);
  }, []);

  const makeMove = useCallback((row: number, col: number, player: number, boardState: number[][]) => {
    const flips = getFlips(row, col, player, boardState);
    if (flips.length === 0) return null;
    
    const newBoard = boardState.map(r => [...r]);
    newBoard[row][col] = player;
    for (const flip of flips) {
      newBoard[flip.row][flip.col] = player;
    }
    
    return newBoard;
  }, [getFlips]);

  const minimax = useCallback((boardState: number[][], depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    const currentPlayer = isMaximizing ? 2 : 1;
    const moves = getAllValidMoves(currentPlayer, boardState);
    
    if (depth === 0 || moves.length === 0) {
      let score = 0;
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (boardState[i][j] === 1) score--;
          else if (boardState[i][j] === 2) score++;
        }
      }
      const corners = [[0,0], [0,7], [7,0], [7,7]];
      for (const [r, c] of corners) {
        if (boardState[r][c] === 1) score -= 10;
        else if (boardState[r][c] === 2) score += 10;
      }
      return score;
    }
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = makeMove(move.row, move.col, 2, boardState);
        if (newBoard) {
          const evalScore = minimax(newBoard, depth - 1, alpha, beta, false);
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = makeMove(move.row, move.col, 1, boardState);
        if (newBoard) {
          const evalScore = minimax(newBoard, depth - 1, alpha, beta, true);
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  }, [getAllValidMoves, makeMove]);

  const getAIMove = useCallback((boardState: number[][]) => {
    const moves = getAllValidMoves(2, boardState);
    if (moves.length === 0) return null;
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const newBoard = makeMove(move.row, move.col, 2, boardState);
      if (newBoard) {
        const score = minimax(newBoard, 4, -Infinity, Infinity, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
    
    return bestMove;
  }, [getAllValidMoves, makeMove, minimax]);

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
    
    const flips = getFlips(row, col, 1, board);
    if (flips.length === 0) return;
    
    const newBoard = makeMove(row, col, 1, board);
    if (!newBoard) return;
    
    setBoard(newBoard);
    updateScores(newBoard);
    
    const aiMoves = getAllValidMoves(2, newBoard);
    if (aiMoves.length === 0) {
      const playerMoves = getAllValidMoves(1, newBoard);
      if (playerMoves.length === 0) {
        setGameOver(true);
        const finalP1 = newBoard.flat().filter(c => c === 1).length;
        const finalP2 = newBoard.flat().filter(c => c === 2).length;
        if (finalP1 > finalP2) setWinner(1);
        else if (finalP2 > finalP1) setWinner(2);
        else setWinner(0);
      }
      setCurrentPlayer(1);
      setValidMoves(playerMoves);
    } else {
      setCurrentPlayer(2);
      setIsThinking(true);
      setTimeout(() => {
        const aiMove = getAIMove(newBoard);
        if (aiMove) {
          const aiBoard = makeMove(aiMove.row, aiMove.col, 2, newBoard);
          if (aiBoard) {
            setBoard(aiBoard);
            updateScores(aiBoard);
            
            const nextPlayerMoves = getAllValidMoves(1, aiBoard);
            if (nextPlayerMoves.length === 0) {
              const aiMovesAgain = getAllValidMoves(2, aiBoard);
              if (aiMovesAgain.length === 0) {
                setGameOver(true);
                const finalP1 = aiBoard.flat().filter(c => c === 1).length;
                const finalP2 = aiBoard.flat().filter(c => c === 2).length;
                if (finalP1 > finalP2) setWinner(1);
                else if (finalP2 > finalP1) setWinner(2);
                else setWinner(0);
              } else {
                setCurrentPlayer(2);
                setValidMoves([]);
              }
            } else {
              setCurrentPlayer(1);
              setValidMoves(nextPlayerMoves);
            }
          }
        }
        setIsThinking(false);
      }, 800);
      setValidMoves([]);
    }
  }, [board, currentPlayer, gameOver, getFlips, getAIMove, getAllValidMoves, isThinking, makeMove, updateScores]);

  useEffect(() => {
    const moves = getAllValidMoves(currentPlayer, board);
    setValidMoves(moves);
  }, [board, currentPlayer, getAllValidMoves]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const x = j * CELL_SIZE;
        const y = i * CELL_SIZE;
        
        ctx.fillStyle = '#2d5a3d';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        
        ctx.strokeStyle = '#1a472a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        
        if ((i === 3 || i === 4) && (j === 3 || j === 4)) {
          ctx.fillStyle = '#1a472a';
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        
        const piece = board[i][j];
        if (piece !== 0) {
          const centerX = x + CELL_SIZE / 2;
          const centerY = y + CELL_SIZE / 2;
          const radius = CELL_SIZE * 0.4;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            centerX - radius / 3, centerY - radius / 3, 0,
            centerX, centerY, radius
          );
          
          if (piece === 1) {
            gradient.addColorStop(0, '#4a4a4a');
            gradient.addColorStop(1, '#1a1a1a');
          } else {
            gradient.addColorStop(0, '#f0f0f0');
            gradient.addColorStop(1, '#c0c0c0');
          }
          
          ctx.fillStyle = gradient;
          ctx.fill();
          
          ctx.strokeStyle = piece === 1 ? '#000' : '#888';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        if (validMoves.some(m => m.row === i && m.col === j)) {
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
          
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
  }, [board, validMoves]);

  const handleRestart = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer(1);
    setValidMoves([]);
    setScore1(2);
    setScore2(2);
    setGameOver(false);
    setWinner(null);
    setIsThinking(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" 
         style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6"
        style={{ color: '#00FF00' }}
      >
        ⚫⚪ 黑白棋 / Reversi
      </motion.h1>
      
      <div className="flex gap-8 mb-4">
        <div className="text-center px-6 py-3 rounded-xl" 
             style={{ 
               background: currentPlayer === 1 && !gameOver ? 'rgba(100,100,100,0.4)' : 'rgba(100,100,100,0.2)',
               border: `2px solid ${currentPlayer === 1 && !gameOver ? '#888' : '#666'}`
             }}>
          <div style={{ color: '#888' }}>⚫ 黑方 (玩家)</div>
          <div className="text-2xl font-bold" style={{ color: '#fff' }}>{score1}</div>
        </div>
        
        <div className="text-center px-6 py-3 rounded-xl"
             style={{ 
               background: currentPlayer === 2 && !gameOver ? 'rgba(200,200,200,0.4)' : 'rgba(200,200,200,0.2)',
               border: `2px solid ${currentPlayer === 2 && !gameOver ? '#fff' : '#666'}`
             }}>
          <div style={{ color: '#fff' }}>⚪ 白方 (AI)</div>
          <div className="text-2xl font-bold" style={{ color: '#fff' }}>{score2}</div>
        </div>
      </div>
      
      <div className="mb-4 text-center px-4 py-2 rounded-lg"
           style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
        {gameOver 
          ? `游戏结束! ${winner === 1 ? '黑方' : winner === 2 ? '白方' : '平局'}获胜!` 
          : isThinking
            ? '🤖 AI思考中...'
            : validMoves.length === 0
              ? `${currentPlayer === 1 ? '黑方' : '白方'}无法落子，跳过回合`
              : `${currentPlayer === 1 ? '⚫ 黑方' : '⚪ 白方'}的回合`}
      </div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          boxShadow: `0 0 30px rgba(0, 255, 0, 0.3)`,
          border: '4px solid #00FF00'
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
            background: 'linear-gradient(135deg, #00FF00, #00FFFF)',
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
            border: '2px solid #00FF00'
          }}
        >
          🏠 返回首页
        </motion.button>
      </div>
      
      <div className="mt-6 text-center text-sm" style={{ color: '#888', maxWidth: '500px' }}>
        <p>🎮 <strong>游戏规则：</strong></p>
        <p>• 轮流在空白位置放置棋子</p>
        <p>• 落子必须夹住对方的棋子（至少一个方向）</p>
        <p>• 被夹住的棋子会翻转为你方的颜色</p>
        <p>• 无法落子时跳过回合</p>
        <p>• 棋盘填满或双方都无法落子时游戏结束</p>
        <p>• 棋子多者获胜</p>
      </div>
    </div>
  );
}
