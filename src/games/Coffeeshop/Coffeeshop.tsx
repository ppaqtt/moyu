import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const W = 500, H = 500;
const GRID = 10, CELL = W/GRID;
const PRIMARY = '#4ECDC4';
const SECONDARY = '#45B7D1';

interface Enemy { x:number; y:number; hp:number; maxHp:number; speed:number; pathIdx:number; reward:number; }
interface Tower { row:number; col:number; range:number; damage:number; cooldown:number; timer:number; }

const PATH = [[0,0],[1,0],[2,0],[2,1],[2,2],[2,3],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0],[5,0],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[7,9],[8,9],[9,9]];

export default function Coffeeshop() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const scoreRef = useRef(0);
  const goldRef = useRef(100);
  const livesRef = useRef(20);
  const waveRef = useRef(0);
  const spawnTimer = useRef(0);
  const [score, setScore] = useState(0);
  const [gold, setGold] = useState(100);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'lost'>('idle');

  const startGame = useCallback(() => {
    towersRef.current=[]; enemiesRef.current=[];
    scoreRef.current=0; goldRef.current=100; livesRef.current=20; waveRef.current=1; spawnTimer.current=0;
    setScore(0); setGold(100); setLives(20); setWave(1); setGameState('playing');
  }, []);

  const placeTower = useCallback((row:number, col:number) => {
    if (gameState!=='playing') return;
    if (PATH.some(p=>p[0]===row&&p[1]===col)) return;
    if (towersRef.current.some(t=>t.row===row&&t.col===col)) return;
    if (goldRef.current < 30) return;
    goldRef.current -= 30; setGold(goldRef.current);
    towersRef.current.push({row,col,range:2.5,damage:1,cooldown:30,timer:0});
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const loop = setInterval(() => {
      spawnTimer.current++;
      if (spawnTimer.current % 30 === 0 && enemiesRef.current.length < 15) {
        const hp = 3 + waveRef.current * 2;
        enemiesRef.current.push({x:PATH[0][1]*CELL+CELL/2, y:PATH[0][0]*CELL+CELL/2, hp, maxHp:hp, speed:0.8+waveRef.current*0.1, pathIdx:0, reward:10+waveRef.current*2});
      }
      for (const e of enemiesRef.current) {
        if (e.pathIdx < PATH.length-1) {
          const target = PATH[e.pathIdx+1];
          const tx = target[1]*CELL+CELL/2, ty = target[0]*CELL+CELL/2;
          const dx = tx-e.x, dy = ty-e.y, dist = Math.sqrt(dx*dx+dy*dy);
          if (dist < e.speed) { e.pathIdx++; } else { e.x += dx/dist*e.speed; e.y += dy/dist*e.speed; }
        } else {
          livesRef.current--; setLives(livesRef.current);
          e.hp = 0;
          if (livesRef.current <= 0) setGameState('lost');
        }
      }
      for (const t of towersRef.current) {
        t.timer++;
        if (t.timer >= t.cooldown) {
          const tx = t.col*CELL+CELL/2, ty = t.row*CELL+CELL/2;
          let closest: Enemy|null = null, minDist = t.range*CELL;
          for (const e of enemiesRef.current) {
            if (e.hp <= 0) continue;
            const d = Math.sqrt((e.x-tx)**2+(e.y-ty)**2);
            if (d < minDist) { minDist = d; closest = e; }
          }
          if (closest) { closest.hp -= t.damage; t.timer = 0; }
        }
      }
      for (const e of enemiesRef.current) {
        if (e.hp <= 0 && e.hp > -999) {
          scoreRef.current += e.reward; goldRef.current += e.reward/2;
          setScore(scoreRef.current); setGold(Math.floor(goldRef.current));
          e.hp = -999;
        }
      }
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > -999);
      if (spawnTimer.current % 300 === 0) { waveRef.current++; setWave(waveRef.current); }
    }, 16);
    return () => clearInterval(loop);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const draw = setInterval(() => {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
      for (let r=0;r<GRID;r++) for (let c=0;c<GRID;c++) {
        ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=1; ctx.strokeRect(c*CELL,r*CELL,CELL,CELL);
      }
      ctx.strokeStyle=PRIMARY; ctx.lineWidth=CELL*0.6; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.beginPath();
      PATH.forEach((p,i) => { i===0?ctx.moveTo(p[1]*CELL+CELL/2,p[0]*CELL+CELL/2):ctx.lineTo(p[1]*CELL+CELL/2,p[0]*CELL+CELL/2); });
      ctx.stroke();
      for (const t of towersRef.current) {
        ctx.fillStyle=SECONDARY; ctx.fillRect(t.col*CELL+8,t.row*CELL+8,CELL-16,CELL-16);
        ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('塔',t.col*CELL+CELL/2,t.row*CELL+CELL/2);
      }
      for (const e of enemiesRef.current) {
        ctx.fillStyle='#ff4444'; ctx.beginPath(); ctx.arc(e.x,e.y,8,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.fillRect(e.x-12,e.y-6,24*(e.hp/e.maxHp),3);
      }
    }, 16);
    return () => clearInterval(draw);
  }, [gameState]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>☕ 咖啡店经营</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:'#ffd700'}}>金币: {gold}</span>
        <span style={{color:'#fff'}}>生命: {lives}</span>
        <span style={{color:'#fff'}}>波次: {wave}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        onClick={e => { const rect=canvasRef.current!.getBoundingClientRect(); const c=Math.floor((e.clientX-rect.left)/CELL); const r=Math.floor((e.clientY-rect.top)/CELL); placeTower(r,c); }}
        style={{border:'2px solid '+PRIMARY,borderRadius:12,cursor:'crosshair'}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>点击空地放置防御塔(30金币)，阻止敌人到达终点</div>
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