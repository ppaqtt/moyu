import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const BOARD_SIZE = 8;
const CELL_SIZE = 60;
const CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;

export default function Checkers() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<(0 | 1 | 2 | 3 | 4 | 5)[][]>(() => createInitialBoard());
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [validMoves, setValidMoves] = useState<{row: number, col: number}[]>([]);
  const [mustCapture, setMustCapture] = useState<boolean>(false);
  const [score1, setScore1] = useState(12);
  const [score2, setScore2] = useState(12);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [isFirstMove, setIsFirstMove] = useState(true);

  function createInitialBoard() {
    const initial: (0 | 1 | 2 | 3 | 4 | 5)[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      initial[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        if ((i + j) % 2 === 1) {
          if (i < 3) {
            initial[i][j] = 2;
          } else if (i > 4) {
            initial[i][j] = 1;
          } else {
            initial[i][j] = 0;
          }
        } else {
          initial[i][j] = 0;
        }
      }
    }
    return initial;
  }

  const isPlayerPiece = (piece: number, player: number) => {
    return player === 1 ? piece === 1 || piece === 3 : piece === 2 || piece === 4;
  };

  const isKing = (piece: number) => piece === 3 || piece === 4;

  const getValidMovesForPiece = useCallback((row: number, col: number, boardState: (0 | 1 | 2 | 3 | 4 | 5)[][]) => {
    const piece = boardState[row][col];
    const moves: {row: number, col: number, capture?: {row: number, col: number}}[] = [];
    const player = piece === 1 || piece === 3 ? 1 : 2;
    const isKingPiece = isKing(piece);
    
    const directions = [];
    if (player === 1 || isKingPiece) {
      directions.push([-1, -1], [-1, 1]);
    }
    if (player === 2 || isKingPiece) {
      directions.push([1, -1], [1, 1]);
    }

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (boardState[newRow][newCol] === 0) {
          moves.push({row: newRow, col: newCol});
        }
      }
    }

    for (const [dr, dc] of directions) {
      const captureRow = row + dr;
      const captureCol = col + dc;
      const landRow = row + dr * 2;
      const landCol = col + dc * 2;
      
      if (landRow >= 0 && landRow < BOARD_SIZE && landCol >= 0 && landCol < BOARD_SIZE) {
        const targetPiece = boardState[captureRow][captureCol];
        if (targetPiece !== 0 && !isPlayerPiece(targetPiece, player) && boardState[landRow][landCol] === 0) {
          moves.push({row: landRow, col: landCol, capture: {row: captureRow, col: captureCol}});
        }
      }
    }

    return moves;
  }, []);

  const hasCaptureMoves = useCallback((player: number, boardState: (0 | 1 | 2 | 3 | 4 | 5)[][]) => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (isPlayerPiece(boardState[i][j], player)) {
          const moves = getValidMovesForPiece(i, j, boardState);
          if (moves.some(m => m.capture)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [getValidMovesForPiece]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return;
    
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
    
    const piece = board[row][col];
    
    if (selectedCell) {
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        let newBoard = board.map(r => [...r]);
        const pieceToMove = newBoard[selectedCell.row][selectedCell.col];
        newBoard[selectedCell.row][selectedCell.col] = 0;
        newBoard[row][col] = pieceToMove;
        
        if (move.capture) {
          newBoard[move.capture.row][move.capture.col] = 0;
        }
        
        let promoted = false;
        if (pieceToMove === 1 && row === 0) {
          newBoard[row][col] = 3;
          promoted = true;
        } else if (pieceToMove === 2 && row === BOARD_SIZE - 1) {
          newBoard[row][col] = 4;
          promoted = true;
        }
        
        const nextPlayer = currentPlayer === 1 ? 2 : 1;
        
        if (move.capture && !promoted) {
          const furtherCaptures = getValidMovesForPiece(row, col, newBoard).filter(m => m.capture);
          if (furtherCaptures.length > 0) {
            setBoard(newBoard);
            setSelectedCell({row, col});
            setValidMoves(furtherCaptures);
            setMustCapture(true);
            updateScores(newBoard);
            return;
          }
        }
        
        setBoard(newBoard);
        setSelectedCell(null);
        setValidMoves([]);
        setMustCapture(false);
        setCurrentPlayer(nextPlayer);
        setIsFirstMove(false);
        updateScores(newBoard);
        
        const winner = checkWinner(newBoard);
        if (winner) {
          setGameOver(true);
          setWinner(winner);
        }
        
        return;
      }
    }
    
    if (isPlayerPiece(piece, currentPlayer)) {
      const mustCaptureNow = hasCaptureMoves(currentPlayer, board);
      const moves = getValidMovesForPiece(row, col, board);
      const availableMoves = mustCaptureNow ? moves.filter(m => m.capture) : moves;
      
      if (mustCaptureNow && availableMoves.length === 0) {
        return;
      }
      
      setSelectedCell({row, col});
      setValidMoves(availableMoves);
      setMustCapture(mustCaptureNow);
    } else {
      setSelectedCell(null);
      setValidMoves([]);
    }
  }, [board, selectedCell, validMoves, currentPlayer, gameOver, getValidMovesForPiece, hasCaptureMoves]);

  const updateScores = (boardState: (0 | 1 | 2 | 3 | 4 | 5)[][]) => {
    let p1 = 0, p2 = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (boardState[i][j] === 1 || boardState[i][j] === 3) p1++;
        if (boardState[i][j] === 2 || boardState[i][j] === 4) p2++;
      }
    }
    setScore1(p1);
    setScore2(p2);
  };

  const checkWinner = (boardState: (0 | 1 | 2 | 3 | 4 | 5)[][]) => {
    let p1Pieces = 0, p2Pieces = 0;
    let p1Moves = 0, p2Moves = 0;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const piece = boardState[i][j];
        if (piece === 1 || piece === 3) {
          p1Pieces++;
          p1Moves += getValidMovesForPiece(i, j, boardState).length;
        } else if (piece === 2 || piece === 4) {
          p2Pieces++;
          p2Moves += getValidMovesForPiece(i, j, boardState).length;
        }
      }
    }
    
    if (p1Pieces === 0 || p1Moves === 0) return 2;
    if (p2Pieces === 0 || p2Moves === 0) return 1;
    return null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const x = j * CELL_SIZE;
        const y = i * CELL_SIZE;
        
        ctx.fillStyle = (i + j) % 2 === 0 ? '#f0d9b5' : '#b58863';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        
        const piece = board[i][j];
        if (piece !== 0) {
          const centerX = x + CELL_SIZE / 2;
          const centerY = y + CELL_SIZE / 2;
          const radius = CELL_SIZE * 0.4;
          
          const isPlayer1 = piece === 1 || piece === 3;
          const isKing = piece === 3 || piece === 4;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(centerX - radius/3, centerY - radius/3, 0, centerX, centerY, radius);
          gradient.addColorStop(0, isPlayer1 ? '#ff6b6b' : '#4a90e2');
          gradient.addColorStop(1, isPlayer1 ? '#c92a2a' : '#1863b8');
          ctx.fillStyle = gradient;
          ctx.fill();
          
          ctx.strokeStyle = isPlayer1 ? '#8b0000' : '#1e3a5f';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          if (isKing) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♔', centerX, centerY);
          }
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = isPlayer1 ? '#ffcccc' : '#cce5ff';
          ctx.fill();
          
          if (isKing) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♔', centerX, centerY);
          }
        }
        
        if (selectedCell && selectedCell.row === i && selectedCell.col === j) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }
        
        if (validMoves.some(m => m.row === i && m.col === j)) {
          ctx.fillStyle = validMoves.find(m => m.row === i && m.col === j)?.capture 
            ? 'rgba(255, 100, 100, 0.5)' 
            : 'rgba(100, 255, 100, 0.5)';
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          
          if (validMoves.find(m => m.row === i && m.col === j)?.capture) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          }
        }
      }
    }
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
  }, [board, selectedCell, validMoves]);

  const handleRestart = () => {
    setBoard(createInitialBoard());
    setSelectedCell(null);
    setValidMoves([]);
    setCurrentPlayer(1);
    setMustCapture(false);
    setScore1(12);
    setScore2(12);
    setGameOver(false);
    setWinner(null);
    setIsFirstMove(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" 
         style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6"
        style={{ color: '#00FFFF' }}
      >
        🏁 国际跳棋
      </motion.h1>
      
      <div className="flex gap-8 mb-4">
        <div className="text-center px-6 py-3 rounded-xl" 
             style={{ 
               background: currentPlayer === 1 && !gameOver ? 'rgba(255,107,107,0.3)' : 'rgba(100,100,100,0.2)',
               border: `2px solid ${currentPlayer === 1 && !gameOver ? '#ff6b6b' : '#666'}`
             }}>
          <div style={{ color: '#ff6b6b' }}>红方 (玩家)</div>
          <div className="text-2xl font-bold" style={{ color: '#ff6b6b' }}>{score1}</div>
        </div>
        
        <div className="text-center px-6 py-3 rounded-xl"
             style={{ 
               background: currentPlayer === 2 && !gameOver ? 'rgba(74,144,226,0.3)' : 'rgba(100,100,100,0.2)',
               border: `2px solid ${currentPlayer === 2 && !gameOver ? '#4a90e2' : '#666'}`
             }}>
          <div style={{ color: '#4a90e2' }}>蓝方 (AI)</div>
          <div className="text-2xl font-bold" style={{ color: '#4a90e2' }}>{score2}</div>
        </div>
      </div>
      
      <div className="mb-4 text-center px-4 py-2 rounded-lg"
           style={{ 
             background: 'rgba(0,0,0,0.3)',
             color: mustCapture ? '#ff6b6b' : '#fff'
           }}>
        {gameOver 
          ? `游戏结束! ${winner === 1 ? '红方' : '蓝方'}获胜!` 
          : mustCapture 
            ? '必须吃子!' 
            : `${currentPlayer === 1 ? '红方' : '蓝方'}的回合${isFirstMove ? ' - 点击棋子开始' : ''}`}
      </div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          boxShadow: `0 0 30px ${currentPlayer === 1 ? 'rgba(255,107,107,0.5)' : 'rgba(74,144,226,0.5)'}`,
          border: `4px solid ${currentPlayer === 1 ? '#ff6b6b' : '#4a90e2'}`
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onClick={handleClick}
          style={{ 
            cursor: 'pointer', 
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
            background: 'linear-gradient(135deg, #00FFFF, #00FF00)',
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
            border: '2px solid #00FFFF'
          }}
        >
          🏠 返回首页
        </motion.button>
      </div>
      
      <div className="mt-6 text-center text-sm" style={{ color: '#888', maxWidth: '500px' }}>
        <p>🎮 <strong>游戏规则：</strong></p>
        <p>• 轮流移动，点击自己的棋子再点击目标位置</p>
        <p>• 普通棋子只能向前斜走，抵达对方底线可升变为王棋</p>
        <p>• 王棋可以向前后斜走</p>
        <p>• 有机会吃子时必须吃子（强制吃子）</p>
        <p>• 吃子后若还能继续吃，必须继续吃（连续吃子）</p>
      </div>
    </div>
  );
}
