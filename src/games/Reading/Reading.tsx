import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const PRIMARY = '#F59E0B';
const SECONDARY = '#D97706';
const WORDS = ['apple','banana','cherry','dragon','eagle','flower','guitar','hammer','island','jungle','kitten','lemon','mirror','noodle','orange','piano','queen','river','sunset','tiger','umbrella','violin','window','yellow','zebra','bridge','castle','diamond','forest','garden'];

export default function Reading() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(6);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'|'lost'>('idle');
  const [totalWords, setTotalWords] = useState(0);

  const startGame = useCallback(() => {
    const w = WORDS[Math.floor(Math.random()*WORDS.length)].toUpperCase();
    setWord(w); setGuessed(new Set()); setLives(6); setGameState('playing');
  }, []);

  const nextWord = useCallback(() => {
    const w = WORDS[Math.floor(Math.random()*WORDS.length)].toUpperCase();
    setWord(w); setGuessed(new Set()); setLives(6); setGameState('playing');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      const letter = e.key.toUpperCase();
      if (letter.length !== 1 || letter < 'A' || letter > 'Z') return;
      const ng = new Set(guessed);
      ng.add(letter);
      setGuessed(ng);
      if (!word.includes(letter)) { setLives(l => l-1); }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [gameState, guessed, word]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const allGuessed = word.split('').every(l => guessed.has(l));
    if (allGuessed) { setScore(s => s+50+lives*10); setTotalWords(t => t+1); setGameState('won'); }
    if (lives <= 0) { setGameState('lost'); }
  }, [guessed, word, lives, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W=400,H=300;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = lives<=2?'#ff4444':PRIMARY; ctx.lineWidth=3;
    // Hangman
    ctx.beginPath(); ctx.moveTo(60,250); ctx.lineTo(160,250); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(110,250); ctx.lineTo(110,50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(110,50); ctx.lineTo(200,50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(200,50); ctx.lineTo(200,80); ctx.stroke();
    if (lives<6) { ctx.beginPath(); ctx.arc(200,100,20,0,Math.PI*2); ctx.stroke(); }
    if (lives<5) { ctx.beginPath(); ctx.moveTo(200,120); ctx.lineTo(200,180); ctx.stroke(); }
    if (lives<4) { ctx.beginPath(); ctx.moveTo(200,140); ctx.lineTo(170,160); ctx.stroke(); }
    if (lives<3) { ctx.beginPath(); ctx.moveTo(200,140); ctx.lineTo(230,160); ctx.stroke(); }
    if (lives<2) { ctx.beginPath(); ctx.moveTo(200,180); ctx.lineTo(170,220); ctx.stroke(); }
    if (lives<1) { ctx.beginPath(); ctx.moveTo(200,180); ctx.lineTo(230,220); ctx.stroke(); }
    // Word
    ctx.fillStyle='#fff'; ctx.font='bold 28px monospace'; ctx.textAlign='center';
    const display = word.split('').map(l => guessed.has(l)?l:'_').join(' ');
    ctx.fillText(display, W/2, 270);
  }, [word, guessed, lives]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>📖 阅读理解</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:10}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:'#fff'}}>完成: {totalWords}词</span>
        <span style={{color:lives<=2?'#ff4444':'#fff'}}>生命: {lives}</span>
      </div>
      <canvas ref={canvasRef} width={400} height={300} style={{border:'2px solid '+PRIMARY,borderRadius:12}} />
      <div style={{display:'flex',flexWrap:'wrap',gap:4,maxWidth:400,marginTop:15,justifyContent:'center'}}>
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
          <span key={l} style={{width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4,
            background:guessed.has(l)?(word.includes(l)?'#22c55e':'#ff4444'):'#2a2a4a',color:'#fff',fontSize:14,cursor:'pointer'}}>
            {l}
          </span>
        ))}
      </div>
      <div style={{marginTop:10,color:'#888',fontSize:14}}>按键盘字母猜测单词</div>
      {gameState==='won' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#22c55e',fontSize:24,marginTop:10}}>猜对了!</motion.div>}
      {gameState==='lost' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#ff4444',fontSize:24,marginTop:10}}>答案是: {word}</motion.div>}
      <div style={{marginTop:15,display:'flex',gap:10}}>
        {(gameState==='won'||gameState==='lost') && <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={nextWord}
          style={{padding:'10px 24px',background:'#22c55e',color:'#000',border:'none',borderRadius:8,fontSize:16,cursor:'pointer',fontWeight:'bold'}}>下一个</motion.button>}
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