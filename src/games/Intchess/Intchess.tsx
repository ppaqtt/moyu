import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const SIZE = 7;
const CELL = 70;
const CANVAS = SIZE * CELL;
const PRIMARY = '#C9B037';
const SECONDARY = '#8B4513';


function checkWin(board: number[][], p: number) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c <= SIZE-4; c++) { if (board[r][c]===p&&board[r][c+1]===p&&board[r][c+2]===p&&board[r][c+3]===p) return true; }
  for (let c = 0; c < SIZE; c++) for (let r = 0; r <= SIZE-4; r++) { if (board[r][c]===p&&board[r+1][c]===p&&board[r+2][c]===p&&board[r+3][c]===p) return true; }
  return false;
}


export default function Intchess() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<number[][]>(() => Array.from({length:SIZE},()=>Array(SIZE).fill(0)));
  const [current, setCurrent] = useState(1);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'|'draw'>('idle');
  const [message, setMessage] = useState('');
  const aiThinking = useRef(false);

  const aiMove = useCallback((b: number[][]) => {
    const empty: [number,number][] = [];
    for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (b[r][c]===0) empty.push([r,c]);
    if (empty.length === 0) return null;
    // Simple AI: try to win, then block, then random
    for (const [r,c] of empty) { b[r][c]=2; if (checkWin(b,2)) { b[r][c]=0; return [r,c]; } b[r][c]=0; }
    for (const [r,c] of empty) { b[r][c]=1; if (checkWin(b,1)) { b[r][c]=0; return [r,c]; } b[r][c]=0; }
    return empty[Math.floor(Math.random()*empty.length)];
  }, []);

  const handleClick = useCallback((r: number, c: number) => {
    if (gameState !== 'playing' || current !== 1 || aiThinking.current) return;
    if (board[r][c] !== 0) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 1;
    if (checkWin(newBoard, 1)) { setBoard(newBoard); setGameState('won'); setScore(s=>s+100); setMessage('你赢了!'); return; }
    if (newBoard.every(row => row.every(v=>v!==0))) { setBoard(newBoard); setGameState('draw'); setMessage('平局!'); return; }
    setCurrent(2); setBoard(newBoard);
    aiThinking.current = true;
    setTimeout(() => {
      const move = aiMove(newBoard);
      if (move) {
        newBoard[move[0]][move[1]] = 2;
        if (checkWin(newBoard, 2)) { setBoard([...newBoard.map(r=>[...r])]); setGameState('won'); setMessage('AI赢了!'); aiThinking.current=false; return; }
      }
      setBoard(newBoard.map(r=>[...r])); setCurrent(1); aiThinking.current = false;
    }, 300);
  }, [board, current, gameState, aiMove]);

  const startGame = useCallback(() => {
    setBoard(Array.from({length:SIZE},()=>Array(SIZE).fill(0)));
    setCurrent(1); setScore(0); setGameState('playing'); setMessage('');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,CANVAS,CANVAS);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,CANVAS,CANVAS);
    for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.strokeRect(c*CELL, r*CELL, CELL, CELL);
      if (board[r][c] === 1) {
        ctx.fillStyle = PRIMARY;
        ctx.beginPath(); ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, CELL*0.35, 0, Math.PI*2); ctx.fill();
      } else if (board[r][c] === 2) {
        ctx.fillStyle = SECONDARY;
        ctx.beginPath(); ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, CELL*0.35, 0, Math.PI*2); ctx.fill();
      }
    }
  }, [board]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>♚ 国际象棋</motion.h1>
      <div style={{color:'#fff',marginBottom:10}}>分数: {score} | {current===1?'你的回合':'AI思考中...'}</div>
      <canvas ref={canvasRef} width={CANVAS} height={CANVAS}
        onClick={e => { if (gameState!=='playing') return; const rect=canvasRef.current!.getBoundingClientRect(); const c=Math.floor((e.clientX-rect.left)/CELL); const r=Math.floor((e.clientY-rect.top)/CELL); if (r>=0&&r<SIZE&&c>=0&&c<SIZE) handleClick(r,c); }}
        style={{border:'2px solid '+PRIMARY,borderRadius:12,cursor:'pointer'}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>点击空格放置棋子，四子连线获胜</div>
      {message && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:gameState==='won'&&current===1?'#22c55e':'#ff4444',fontSize:24,marginTop:10}}>{message}</motion.div>}
      <div style={{marginTop:15,display:'flex',gap:10}}>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={startGame}
          style={{padding:'10px 24px',background:PRIMARY,color:'#000',border:'none',borderRadius:8,fontSize:16,cursor:'pointer',fontWeight:'bold'}}>
          {gameState==='idle'?'开始游戏':'重新开始'}
        </motion.button>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => navigate('/')}
          style={{padding:'10px 24px',background:'#333',color:'#fff',border:'none',borderRadius:8,fontSize:16,cursor:'pointer'}}>
          返回首页
        </motion.button>
      </div>
    </div>
  );
}