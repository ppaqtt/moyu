import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const W = 480, H = 500;
const PRIMARY = '#3B82F6';
const SECONDARY = '#06B6D4';
const SEED = 9036;

interface GameObject { x:number; y:number; w:number; h:number; color:string; vx:number; vy:number; type:string; }

export default function Housebuilder() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectsRef = useRef<GameObject[]>([]);
  const playerRef = useRef({x:W/2, y:H-60, w:36, h:36});
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const frameRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'|'lost'>('idle');
  const [level, setLevel] = useState(1);
  const targetRef = useRef(45);

  const spawnObjects = useCallback(() => {
    const types = ['good','good','good','bad','bonus'];
    const colors = ['#3B82F6','#06B6D4','#22c55e','#3b82f6','#ffd700'];
    for (let i = 0; i < 9; i++) {
      objectsRef.current.push({
        x: Math.random()*(W-30)+15, y: -Math.random()*H,
        w: 24+Math.random()*16, h: 24+Math.random()*16,
        color: colors[Math.floor(Math.random()*colors.length)],
        vx: (Math.random()-0.5)*2, vy: 2.5+Math.random(),
        type: types[Math.floor(Math.random()*types.length)]
      });
    }
  }, []);

  const startGame = useCallback(() => {
    objectsRef.current = [];
    playerRef.current = {x:W/2, y:H-60, w:36, h:36};
    scoreRef.current = 0; livesRef.current = 3; frameRef.current = 0;
    targetRef.current = 45;
    setScore(0); setLives(3); setLevel(1); setGameState('playing');
    spawnObjects();
  }, [spawnObjects]);

  useEffect(() => {
    const down = (e:KeyboardEvent) => keysRef.current.add(e.key);
    const up = (e:KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down, true); window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const keys = keysRef.current;
    const loop = setInterval(() => {
      const p = playerRef.current;
      if (keys.has('ArrowLeft')||keys.has('a')) p.x = Math.max(p.w/2, p.x-5);
      if (keys.has('ArrowRight')||keys.has('d')) p.x = Math.min(W-p.w/2, p.x+5);
      if (keys.has('ArrowUp')||keys.has('w')) p.y = Math.max(p.h/2, p.y-4);
      if (keys.has('ArrowDown')||keys.has('s')) p.y = Math.min(H-p.h/2, p.y+4);
      frameRef.current++;
      if (frameRef.current % 60 === 0) spawnObjects();

      for (let i = objectsRef.current.length-1; i >= 0; i--) {
        const obj = objectsRef.current[i];
        obj.y += obj.vy; obj.x += obj.vx;
        if (obj.x < 0 || obj.x > W) obj.vx = -obj.vx;
        // Collision with player
        const dx = obj.x-p.x, dy = obj.y-p.y;
        if (Math.abs(dx)<(obj.w+p.w)/2 && Math.abs(dy)<(obj.h+p.h)/2) {
          if (obj.type === 'good') { scoreRef.current += 10; }
          else if (obj.type === 'bonus') { scoreRef.current += 25; }
          else { livesRef.current--; setLives(livesRef.current); }
          objectsRef.current.splice(i,1);
          setScore(scoreRef.current);
          if (livesRef.current <= 0) { setGameState('lost'); return; }
          continue;
        }
        if (obj.y > H+30) objectsRef.current.splice(i,1);
      }
      if (scoreRef.current >= targetRef.current) {
        setLevel(l => l+1);
        targetRef.current += 45;
        objectsRef.current = [];
        spawnObjects();
      }
    }, 16);
    return () => clearInterval(loop);
  }, [gameState, spawnObjects]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const draw = setInterval(() => {
      ctx.clearRect(0,0,W,H);
      // Background gradient
      const bg = ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0,'#0a0a1a'); bg.addColorStop(1,'#1a1a2e');
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
      // Grid lines
      ctx.strokeStyle = '#ffffff08'; ctx.lineWidth = 1;
      for (let i=0;i<W;i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
      for (let i=0;i<H;i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }
      // Objects
      for (const obj of objectsRef.current) {
        ctx.fillStyle = obj.color;
        ctx.beginPath(); ctx.roundRect(obj.x-obj.w/2, obj.y-obj.h/2, obj.w, obj.h, 6); ctx.fill();
        if (obj.type === 'bonus') {
          ctx.fillStyle = '#fff'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('★', obj.x, obj.y);
        }
      }
      // Player
      const p = playerRef.current;
      const pGrad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.w/2);
      pGrad.addColorStop(0,'#fff'); pGrad.addColorStop(0.5,PRIMARY); pGrad.addColorStop(1,SECONDARY);
      ctx.fillStyle = pGrad;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.w/2,0,Math.PI*2); ctx.fill();
      // Glow
      ctx.shadowColor = PRIMARY; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.w/2+2,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;
    }, 16);
    return () => clearInterval(draw);
  }, [gameState]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>🏘️ 房屋建造者</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:PRIMARY}}>等级: {level}</span>
        <span style={{color:'#fff'}}>生命: {'❤️'.repeat(Math.max(0,lives))}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{border:'2px solid '+PRIMARY,borderRadius:12}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>方向键/WASD移动 | 管理和经营，平衡资源发展</div>
      {gameState==='lost' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#ff4444',fontSize:24,marginTop:10}}>游戏结束! 得分: {score}</motion.div>}
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