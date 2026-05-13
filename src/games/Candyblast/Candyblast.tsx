import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const ROWS = 8, COLS = 8, CELL = 50;
const W = COLS*CELL, H = ROWS*CELL+60;
const PRIMARY = '#FF6B9D';
const SECONDARY = '#C084FC';
const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff6b9d','#a855f7'];

export default function Candyblast() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>(() => Array.from({length:ROWS},()=>Array.from({length:COLS},()=>Math.floor(Math.random()*6))));
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'>('idle');
  const [selected, setSelected] = useState<[number,number]|null>(null);

  const initGame = useCallback(() => {
    setGrid(Array.from({length:ROWS},()=>Array.from({length:COLS},()=>Math.floor(Math.random()*6))));
    setScore(0); setGameState('playing'); setSelected(null);
  }, []);

  const findMatches = useCallback((g: number[][]) => {
    const matched = new Set<string>();
    for (let r=0;r<ROWS;r++) for (let c=0;c<=COLS-3;c++) { if (g[r][c]===g[r][c+1]&&g[r][c]===g[r][c+2]&&g[r][c]>=0) { matched.add(r+','+c); matched.add(r+','+(c+1)); matched.add(r+','+(c+2)); } }
    for (let c=0;c<COLS;c++) for (let r=0;r<=ROWS-3;r++) { if (g[r][c]===g[r+1][c]&&g[r][c]===g[r+2][c]&&g[r][c]>=0) { matched.add(r+','+c); matched.add((r+1)+','+c); matched.add((r+2)+','+c); } }
    return matched;
  }, []);

  const applyGravity = useCallback((g: number[][]) => {
    const ng = g.map(r=>[...r]);
    for (let c=0;c<COLS;c++) {
      let write = ROWS-1;
      for (let r=ROWS-1;r>=0;r--) { if (ng[r][c]>=0) { ng[write][c]=ng[r][c]; if (write!==r) ng[r][c]=-1; write--; } }
      for (let r=write;r>=0;r--) ng[r][c]=Math.floor(Math.random()*6);
    }
    return ng;
  }, []);

  const processMatches = useCallback((g: number[][]) => {
    let ng = g.map(r=>[...r]);
    let totalScore = 0;
    let matches = findMatches(ng);
    let iterations = 0;
    while (matches.size > 0 && iterations < 50) {
      totalScore += matches.size * 10;
      for (const key of matches) { const [r,c] = key.split(',').map(Number); ng[r][c] = -1; }
      ng = applyGravity(ng);
      matches = findMatches(ng);
      iterations++;
    }
    return { grid: ng, score: totalScore };
  }, [findMatches, applyGravity]);

  const handleClick = useCallback((r: number, c: number) => {
    if (gameState !== 'playing') return;
    if (!selected) { setSelected([r,c]); return; }
    const [sr,sc] = selected;
    if (Math.abs(sr-r)+Math.abs(sc-c) !== 1) { setSelected([r,c]); return; }
    const ng = grid.map(row=>[...row]);
    [ng[sr][sc], ng[r][c]] = [ng[r][c], ng[sr][sc]];
    const matches = findMatches(ng);
    if (matches.size > 0) {
      const result = processMatches(ng);
      setGrid(result.grid); setScore(s => s + result.score);
    }
    setSelected(null);
  }, [gameState, selected, grid, findMatches, processMatches]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const x=c*CELL+2, y=r*CELL+32+2;
      ctx.fillStyle = COLORS[grid[r][c]];
      ctx.beginPath(); ctx.roundRect(x,y,CELL-4,CELL-4,8); ctx.fill();
      if (selected && selected[0]===r && selected[1]===c) {
        ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.stroke();
      }
    }
  }, [grid, selected]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>🍬 糖果爆破</motion.h1>
      <div style={{color:'#fff',marginBottom:10}}>分数: {score}</div>
      <canvas ref={canvasRef} width={W} height={H}
        onClick={e => { const rect=canvasRef.current!.getBoundingClientRect(); const c=Math.floor((e.clientX-rect.left)/CELL); const r=Math.floor((e.clientY-rect.top-32)/CELL); if(r>=0&&r<ROWS&&c>=0&&c<COLS) handleClick(r,c); }}
        style={{border:'2px solid '+PRIMARY,borderRadius:12,cursor:'pointer'}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>点击两个相邻方块交换，三个相同颜色连线即可消除</div>
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