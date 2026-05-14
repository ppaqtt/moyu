import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const SIZE = 12;
const CELL = Math.floor(400/SIZE);
const W = SIZE*CELL, H = SIZE*CELL;
const PRIMARY = '#22C55E';
const SECONDARY = '#16A34A';

function generateMaze(s: number): number[][] {
  const maze = Array.from({length:s},()=>Array(s).fill(1));
  function carve(r:number,c:number) {
    maze[r][c]=0;
    const dirs=[[0,2],[0,-2],[2,0],[-2,0]].sort(()=>Math.random()-0.5);
    for (const [dr,dc] of dirs) {
      const nr=r+dr,nc=c+dc;
      if (nr>0&&nr<s&&nc>0&&nc<s&&maze[nr][nc]===1) { maze[r+dr/2][c+dc/2]=0; carve(nr,nc); }
    }
  }
  carve(1,1);
  maze[1][1]=0; maze[s-2][s-2]=0;
  return maze;
}

export default function Prisonbreak() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<number[][]>(() => generateMaze(SIZE));
  const [player, setPlayer] = useState<[number,number]>([1,1]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'>('idle');
  const [time, setTime] = useState(0);

  const initGame = useCallback(() => {
    setMaze(generateMaze(SIZE)); setPlayer([1,1]);
    setScore(0); setMoves(0); setGameState('playing'); setTime(0);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const t = setInterval(() => setTime(t => t+1), 1000);
    return () => clearInterval(t);
  }, [gameState]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      const [r,c] = player;
      let nr=r,nc=c;
      if (e.key==='ArrowUp'||e.key==='w') nr--;
      if (e.key==='ArrowDown'||e.key==='s') nr++;
      if (e.key==='ArrowLeft'||e.key==='a') nc--;
      if (e.key==='ArrowRight'||e.key==='d') nc++;
      if (nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&maze[nr][nc]===0) {
        setPlayer([nr,nc]); setMoves(m=>m+1);
        if (nr===SIZE-2&&nc===SIZE-2) { setGameState('won'); setScore(Math.max(1000-moves*5-time*2,100)); }
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [gameState, player, maze, moves, time]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
      ctx.fillStyle = maze[r][c]===1 ? '#2a2a4a' : '#0a0a1a';
      ctx.fillRect(c*CELL,r*CELL,CELL,CELL);
    }
    ctx.fillStyle = '#22c55e'; ctx.fillRect((SIZE-2)*CELL,(SIZE-2)*CELL,CELL,CELL);
    ctx.fillStyle = PRIMARY;
    ctx.beginPath(); ctx.arc(player[1]*CELL+CELL/2,player[0]*CELL+CELL/2,CELL*0.35,0,Math.PI*2); ctx.fill();
  }, [maze, player]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>🔒 越狱</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>步数: {moves}</span>
        <span style={{color:'#fff'}}>时间: {time}s</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{border:'2px solid '+PRIMARY,borderRadius:12}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>方向键/WASD移动，到达绿色终点</div>
      {gameState==='won' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#22c55e',fontSize:24,marginTop:10}}>恭喜通关! 得分: {score}</motion.div>}
      <div style={{marginTop:15,display:'flex',gap:10}}>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={initGame}
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