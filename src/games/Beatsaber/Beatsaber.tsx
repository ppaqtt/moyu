import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const W = 400, H = 500;
const LANES = 4, LANE_W = W/LANES;
const PRIMARY = '#00D2FF';
const SECONDARY = '#FF00FF';
const KEYS = ['D','F','J','K'];

interface Note { lane:number; y:number; speed:number; hit:boolean; missed:boolean; }

export default function Beatsaber() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notesRef = useRef<Note[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const frameRef = useRef(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'ended'>('idle');
  const [feedback, setFeedback] = useState('');
  const keysRef = useRef<Set<string>>(new Set());

  const startGame = useCallback(() => {
    notesRef.current=[]; scoreRef.current=0; comboRef.current=0; maxComboRef.current=0; frameRef.current=0;
    setScore(0); setCombo(0); setMaxCombo(0); setGameState('playing');
  }, []);

  useEffect(() => {
    const down = (e:KeyboardEvent) => { keysRef.current.add(e.key.toUpperCase()); handleHit(e.key.toUpperCase()); };
    const up = (e:KeyboardEvent) => keysRef.current.delete(e.key.toUpperCase());
    window.addEventListener('keydown',down); window.addEventListener('keyup',up);
    return () => { window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); };
  }, [gameState]);

  const handleHit = useCallback((key: string) => {
    if (gameState !== 'playing') return;
    const laneIdx = KEYS.indexOf(key);
    if (laneIdx === -1) return;
    const hitY = H - 80;
    let best: Note|null = null, bestDist = 40;
    for (const n of notesRef.current) {
      if (n.lane !== laneIdx || n.hit || n.missed) continue;
      const dist = Math.abs(n.y - hitY);
      if (dist < bestDist) { bestDist = dist; best = n; }
    }
    if (best) {
      best.hit = true;
      if (bestDist < 15) { scoreRef.current += 100; comboRef.current++; setFeedback('Perfect!'); }
      else if (bestDist < 25) { scoreRef.current += 75; comboRef.current++; setFeedback('Great!'); }
      else { scoreRef.current += 50; comboRef.current++; setFeedback('Good'); }
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      setScore(scoreRef.current); setCombo(comboRef.current); setMaxCombo(maxComboRef.current);
      setTimeout(() => setFeedback(''), 300);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const loop = setInterval(() => {
      frameRef.current++;
      if (frameRef.current % 20 === 0) {
        notesRef.current.push({lane: Math.floor(Math.random()*LANES), y: -20, speed: 3+Math.random()*2, hit:false, missed:false});
      }
      for (const n of notesRef.current) {
        if (!n.hit && !n.missed) {
          n.y += n.speed;
          if (n.y > H - 60) { n.missed = true; comboRef.current = 0; setCombo(0); }
        }
      }
      notesRef.current = notesRef.current.filter(n => !n.hit && n.y < H+20);
      if (frameRef.current > 1800) setGameState('ended');
    }, 16);
    return () => clearInterval(loop);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const draw = setInterval(() => {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
      for (let i=0;i<LANES;i++) {
        ctx.fillStyle = i%2===0?'#111122':'#0d0d1a';
        ctx.fillRect(i*LANE_W,0,LANE_W,H);
        ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(i*LANE_W,0); ctx.lineTo(i*LANE_W,H); ctx.stroke();
      }
      ctx.fillStyle='#ffffff22'; ctx.fillRect(0,H-80,W,4);
      for (const n of notesRef.current) {
        if (n.missed) continue;
        const grad = ctx.createLinearGradient(n.lane*LANE_W+10,n.y,n.lane*LANE_W+LANE_W-10,n.y);
        grad.addColorStop(0,PRIMARY); grad.addColorStop(1,SECONDARY);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(n.lane*LANE_W+10,n.y-15,LANE_W-20,30,8); ctx.fill();
      }
      for (let i=0;i<LANES;i++) {
        const pressed = keysRef.current.has(KEYS[i]);
        ctx.fillStyle = pressed ? PRIMARY : '#333';
        ctx.beginPath(); ctx.roundRect(i*LANE_W+10,H-50,LANE_W-20,30,8); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='bold 16px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(KEYS[i],i*LANE_W+LANE_W/2,H-35);
      }
    }, 16);
    return () => clearInterval(draw);
  }, [gameState]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>⚔️ 节拍光剑</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:PRIMARY}}>连击: {combo}</span>
        <span style={{color:'#ffd700'}}>最高连击: {maxCombo}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{border:'2px solid '+PRIMARY,borderRadius:12}} />
      {feedback && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:PRIMARY,fontSize:20,marginTop:5}}>{feedback}</motion.div>}
      <div style={{marginTop:10,color:'#888',fontSize:14}}>按 D F J K 键在音符到达判定线时击打</div>
      {gameState==='ended' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#22c55e',fontSize:24,marginTop:10}}>演奏结束! 得分: {score}</motion.div>}
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