import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const W = 480, H = 600;
const PADDLE_W = 80, PADDLE_H = 12;
const BALL_R = 6;
const BRICK_ROWS = 4, BRICK_COLS = 5;
const BRICK_W = (W - 20) / BRICK_COLS, BRICK_H = 20;
const PRIMARY = '#FFD93D';
const SECONDARY = '#FF6B6B';

interface Brick { x:number; y:number; alive:boolean; color:string; }
interface Ball { x:number; y:number; dx:number; dy:number; }

export default function Pvz() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paddleRef = useRef(W/2 - PADDLE_W/2);
  const ballRef = useRef<Ball>({x:W/2, y:H-40, dx:2.9, dy:-2.9});
  const bricksRef = useRef<Brick[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const gameStateRef = useRef<'idle'|'playing'|'won'|'lost'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'|'lost'>('idle');

  const initBricks = useCallback(() => {
    const colors = ['#FFD93D','#FF6B6B','#22c55e','#3b82f6','#a855f7','#ec4899'];
    const bricks: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++) for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({ x: 10+c*BRICK_W, y: 50+r*BRICK_H, alive: true, color: colors[r%colors.length] });
    }
    bricksRef.current = bricks;
  }, []);

  const startGame = useCallback(() => {
    initBricks();
    paddleRef.current = W/2 - PADDLE_W/2;
    ballRef.current = {x:W/2, y:H-40, dx:2.9, dy:-2.9};
    scoreRef.current = 0; livesRef.current = 3;
    gameStateRef.current = 'playing';
    setScore(0); setLives(3); setGameState('playing');
  }, [initBricks]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paddleRef.current = Math.max(0, paddleRef.current - 30);
      if (e.key === 'ArrowRight') paddleRef.current = Math.min(W-PADDLE_W, paddleRef.current + 30);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      paddleRef.current = Math.max(0, Math.min(W-PADDLE_W, e.clientX - rect.left - PADDLE_W/2));
    };
    canvas.addEventListener('mousemove', handleMouse);
    return () => canvas.removeEventListener('mousemove', handleMouse);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const anim = setInterval(() => {
      const ball = ballRef.current;
      const paddle = paddleRef.current;
      ball.x += ball.dx; ball.y += ball.dy;
      if (ball.x <= BALL_R || ball.x >= W-BALL_R) ball.dx = -ball.dx;
      if (ball.y <= BALL_R) ball.dy = -ball.dy;
      if (ball.y >= H - PADDLE_H - BALL_R && ball.x >= paddle && ball.x <= paddle+PADDLE_W && ball.dy > 0) {
        ball.dy = -ball.dy;
        ball.dx += (ball.x - (paddle+PADDLE_W/2)) * 0.05;
      }
      if (ball.y > H + 20) {
        livesRef.current--;
        setLives(livesRef.current);
        if (livesRef.current <= 0) { gameStateRef.current = 'lost'; setGameState('lost'); return; }
        ball.x = W/2; ball.y = H-40; ball.dx = 2.9; ball.dy = -2.9;
      }
      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        if (ball.x+BALL_R > brick.x && ball.x-BALL_R < brick.x+BRICK_W-4 && ball.y+BALL_R > brick.y && ball.y-BALL_R < brick.y+BRICK_H) {
          brick.alive = false; ball.dy = -ball.dy;
          scoreRef.current += 10; setScore(scoreRef.current);
          break;
        }
      }
      if (bricksRef.current.every(b => !b.alive)) { gameStateRef.current = 'won'; setGameState('won'); }
    }, 16);
    return () => clearInterval(anim);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = setInterval(() => {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);
      for (const b of bricksRef.current) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.roundRect(b.x, b.y, BRICK_W-4, BRICK_H, 4); ctx.fill();
      }
      const ball = ballRef.current;
      const grad = ctx.createRadialGradient(ball.x,ball.y,0,ball.x,ball.y,BALL_R);
      grad.addColorStop(0,'#fff'); grad.addColorStop(1,PRIMARY);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2); ctx.fill();
      const p = paddleRef.current;
      const pGrad = ctx.createLinearGradient(p,0,p+PADDLE_W,0);
      pGrad.addColorStop(0,PRIMARY); pGrad.addColorStop(1,SECONDARY);
      ctx.fillStyle = pGrad;
      ctx.beginPath(); ctx.roundRect(p, H-PADDLE_H, PADDLE_W, PADDLE_H, 6); ctx.fill();
    }, 16);
    return () => clearInterval(draw);
  }, []);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>🌻 植物大战僵尸</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:'#fff'}}>生命: {'❤️'.repeat(lives)}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{border:'2px solid '+PRIMARY,borderRadius:12}} />
      <div style={{marginTop:10,color:'#888',fontSize:14}}>鼠标或方向键控制挡板，反弹球击碎所有砖块</div>
      {gameState === 'won' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#22c55e',fontSize:24,marginTop:10}}>恭喜通关! 得分: {score}</motion.div>}
      {gameState === 'lost' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#ff4444',fontSize:24,marginTop:10}}>游戏结束! 得分: {score}</motion.div>}
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