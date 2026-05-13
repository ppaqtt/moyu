import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const PAIRS = 8;
const COLS = 4;
const ROWS = Math.ceil(PAIRS*2/COLS);
const CARD_W = 80, CARD_H = 100;
const W = COLS*(CARD_W+10)+20, H = ROWS*(CARD_H+10)+60;
const PRIMARY = '#A855F7';
const SECONDARY = '#EC4899';
const SYMBOLS = ['♠','♥','♦','♣','★','●','▲','■','♪','♫','☀','☁'];

export default function Spades() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cards, setCards] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [canFlip, setCanFlip] = useState(true);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'>('idle');
  const [time, setTime] = useState(0);

  const initGame = useCallback(() => {
    const arr: number[] = [];
    for (let i = 0; i < PAIRS; i++) { arr.push(i, i); }
    for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    setCards(arr); setFlipped([]); setMatched(new Set()); setCanFlip(true);
    setScore(0); setMoves(0); setGameState('playing'); setTime(0);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const t = setInterval(() => setTime(t => t+1), 1000);
    return () => clearInterval(t);
  }, [gameState]);

  const handleClick = useCallback((idx: number) => {
    if (gameState !== 'playing' || !canFlip || flipped.includes(idx) || matched.has(idx)) return;
    const nf = [...flipped, idx];
    setFlipped(nf);
    if (nf.length === 2) {
      setCanFlip(false); setMoves(m => m+1);
      if (cards[nf[0]] === cards[nf[1]]) {
        const nm = new Set(matched); nm.add(nf[0]); nm.add(nf[1]);
        setMatched(nm); setScore(s => s+100);
        setFlipped([]); setCanFlip(true);
        if (nm.size === PAIRS*2) { setGameState('won'); setScore(s => s + Math.max(500-time*3, 50)); }
      } else {
        setTimeout(() => { setFlipped([]); setCanFlip(true); }, 700);
      }
    }
  }, [gameState, canFlip, flipped, matched, cards, time]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
    for (let i = 0; i < cards.length; i++) {
      const r = Math.floor(i/COLS), c = i%COLS;
      const x = 10+c*(CARD_W+10), y = 30+r*(CARD_H+10);
      const isFlipped = flipped.includes(i) || matched.has(i);
      if (isFlipped) {
        const grad = ctx.createLinearGradient(x,y,x+CARD_W,y+CARD_H);
        grad.addColorStop(0, matched.has(i)?'#22c55e':PRIMARY);
        grad.addColorStop(1, matched.has(i)?'#16a34a':SECONDARY);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#2a2a4a';
      }
      ctx.beginPath(); ctx.roundRect(x,y,CARD_W,CARD_H,8); ctx.fill();
      ctx.strokeStyle = isFlipped ? '#fff' : '#444'; ctx.lineWidth = 2; ctx.stroke();
      if (isFlipped) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(SYMBOLS[cards[i]%SYMBOLS.length], x+CARD_W/2, y+CARD_H/2);
      } else {
        ctx.fillStyle = '#555'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', x+CARD_W/2, y+CARD_H/2);
      }
    }
  }, [cards, flipped, matched]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>♠️ 黑桃皇后</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:'#fff'}}>步数: {moves}</span>
        <span style={{color:'#fff'}}>时间: {time}s</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        onClick={e => { const rect=canvasRef.current!.getBoundingClientRect(); const mx=e.clientX-rect.left, my=e.clientY-rect.top; for(let i=0;i<cards.length;i++){const r=Math.floor(i/COLS),c=i%COLS;const x=10+c*(CARD_W+10),y=30+r*(CARD_H+10);if(mx>=x&&mx<=x+CARD_W&&my>=y&&my<=y+CARD_H){handleClick(i);break;}} }}
        style={{border:'2px solid '+PRIMARY,borderRadius:12,cursor:'pointer'}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>点击翻牌，找到所有配对</div>
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