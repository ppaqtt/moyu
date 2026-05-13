import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const CANVAS_SIZE = 400;
const GRID = 4;
const CELL = 100;
const PRIMARY = '#FF6B6B';
const SECONDARY = '#4ECDC4';

export default function Lightsout() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'>('idle');
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyIdx, setEmptyIdx] = useState(GRID * GRID - 1);
  const [time, setTime] = useState(0);
  const [memoryCards, setMemoryCards] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [canFlip, setCanFlip] = useState(true);

  const initGame = useCallback(() => {
    if (0 === 0) {
      const arr = Array.from({length: GRID*GRID}, (_,i) => i);
      arr[GRID*GRID-1] = 0;
      for (let i = 0; i < 283; i++) {
        const ei = arr.indexOf(0);
        const neighbors = [];
        if (ei % GRID > 0) neighbors.push(ei-1);
        if (ei % GRID < GRID-1) neighbors.push(ei+1);
        if (ei >= GRID) neighbors.push(ei-GRID);
        if (ei < GRID*GRID-GRID) neighbors.push(ei+GRID);
        const ni = neighbors[Math.floor(Math.random()*neighbors.length)];
        [arr[ei], arr[ni]] = [arr[ni], arr[ei]];
      }
      setTiles(arr);
      setEmptyIdx(arr.indexOf(0));
    } else if (0 === 1) {
      const pairs = GRID * GRID;
      const cards: number[] = [];
      for (let i = 0; i < pairs/2; i++) { cards.push(i, i); }
      for (let i = cards.length-1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      setMemoryCards(cards);
      setFlipped([]);
      setMatched(new Set());
      setCanFlip(true);
    } else {
      const pattern = Array.from({length: GRID*GRID}, () => Math.floor(Math.random()*4));
      setTiles(pattern);
    }
    setScore(0); setMoves(0); setGameState('playing'); setTime(0);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => setTime(t => t+1), 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleClick = useCallback((idx: number) => {
    if (gameState !== 'playing') return;
    if (0 === 0) {
      const ei = tiles.indexOf(0);
      const row = Math.floor(idx/GRID), col = idx%GRID;
      const er = Math.floor(ei/GRID), ec = ei%GRID;
      if ((Math.abs(row-er)+Math.abs(col-ec)) === 1) {
        const newTiles = [...tiles];
        [newTiles[idx], newTiles[ei]] = [newTiles[ei], newTiles[idx]];
        setTiles(newTiles);
        setMoves(m => m+1);
        let won = true;
        for (let i = 0; i < GRID*GRID-1; i++) { if (newTiles[i] !== i+1) { won = false; break; } }
        if (won) { setGameState('won'); setScore(Math.max(1000 - moves*10 - time*2, 100)); }
      }
    } else if (0 === 1) {
      if (!canFlip || flipped.includes(idx) || matched.has(idx)) return;
      const newFlipped = [...flipped, idx];
      setFlipped(newFlipped);
      if (newFlipped.length === 2) {
        setCanFlip(false);
        setMoves(m => m+1);
        if (memoryCards[newFlipped[0]] === memoryCards[newFlipped[1]]) {
          const newMatched = new Set(matched);
          newMatched.add(newFlipped[0]); newMatched.add(newFlipped[1]);
          setMatched(newMatched);
          setScore(s => s+100);
          setFlipped([]); setCanFlip(true);
          if (newMatched.size === GRID*GRID) { setGameState('won'); setScore(s => s + Math.max(500-time*5, 50)); }
        } else {
          setTimeout(() => { setFlipped([]); setCanFlip(true); }, 800);
        }
      }
    } else {
      const target = (idx + 1) % (GRID*GRID);
      if (tiles[idx] === target) {
        const newTiles = [...tiles];
        newTiles[idx] = (newTiles[idx] + 1) % 4;
        setTiles(newTiles);
        setScore(s => s+10); setMoves(m => m+1);
        if (newTiles.every(t => t === 0)) { setGameState('won'); setScore(s => s + 200); }
      } else {
        setMoves(m => m+1);
      }
    }
  }, [gameState, tiles, flipped, matched, memoryCards, canFlip, moves, time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (0 === 0) {
      for (let i = 0; i < GRID*GRID; i++) {
        const r = Math.floor(i/GRID), c = i%GRID;
        const x = c*CELL+4, y = r*CELL+4;
        if (tiles[i] === 0) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(x, y, CELL-8, CELL-8);
          continue;
        }
        const grad = ctx.createLinearGradient(x, y, x+CELL-8, y+CELL-8);
        grad.addColorStop(0, PRIMARY);
        grad.addColorStop(1, SECONDARY);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, CELL-8, CELL-8, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 33px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(tiles[i]), x+(CELL-8)/2, y+(CELL-8)/2);
      }
    } else if (0 === 1) {
      for (let i = 0; i < GRID*GRID; i++) {
        const r = Math.floor(i/GRID), c = i%GRID;
        const x = c*CELL+4, y = r*CELL+4;
        const isFlipped = flipped.includes(i) || matched.has(i);
        ctx.fillStyle = isFlipped ? (matched.has(i) ? '#22c55e' : PRIMARY) : '#2a2a4a';
        ctx.beginPath();
        ctx.roundRect(x, y, CELL-8, CELL-8, 8);
        ctx.fill();
        if (isFlipped) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 33px Arial';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(memoryCards[i]+1), x+(CELL-8)/2, y+(CELL-8)/2);
        } else {
          ctx.fillStyle = '#555';
          ctx.font = 'bold 33px Arial';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('?', x+(CELL-8)/2, y+(CELL-8)/2);
        }
      }
    } else {
      for (let i = 0; i < GRID*GRID; i++) {
        const r = Math.floor(i/GRID), c = i%GRID;
        const x = c*CELL+4, y = r*CELL+4;
        const colors = [PRIMARY, SECONDARY, '#22c55e'];
        ctx.fillStyle = colors[tiles[i]];
        ctx.beginPath();
        ctx.roundRect(x, y, CELL-8, CELL-8, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 25px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(tiles[i]), x+(CELL-8)/2, y+(CELL-8)/2);
      }
    }
  }, [tiles, flipped, matched, memoryCards]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>💡 关灯游戏</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:'#fff'}}>步数: {moves}</span>
        <span style={{color:'#fff'}}>时间: {time}s</span>
      </div>
      <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
        onClick={e => { const rect = canvasRef.current!.getBoundingClientRect(); const x = e.clientX-rect.left; const y = e.clientY-rect.top; const c = Math.floor(x/CELL); const r = Math.floor(y/CELL); if (c>=0&&c<GRID&&r>=0&&r<GRID) handleClick(r*GRID+c); }}
        style={{border:'2px solid '+PRIMARY,borderRadius:12,cursor:'pointer'}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>点击数字方块移动，将数字按顺序排列</div>
      {gameState === 'won' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#22c55e',fontSize:24,marginTop:10}}>恭喜通关! 得分: {score}</motion.div>}
      <div style={{marginTop:15,display:'flex',gap:10}}>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={initGame}
          style={{padding:'10px 24px',background:PRIMARY,color:'#000',border:'none',borderRadius:8,fontSize:16,cursor:'pointer',fontWeight:'bold'}}>
          {gameState === 'idle' ? '开始游戏' : '重新开始'}
        </motion.button>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => navigate('/')}
          style={{padding:'10px 24px',background:'#333',color:'#fff',border:'none',borderRadius:8,fontSize:16,cursor:'pointer'}}>
          返回首页
        </motion.button>
      </div>
    </div>
  );
}