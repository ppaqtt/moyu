import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const PRIMARY = '#3B82F6';
const SECONDARY = '#60A5FA';

function genQuestion(diff: number): {q:string, a:number} {
  const ops = ['+','-','*'];
  const op = ops[Math.floor(Math.random()*Math.min(diff+1,3))];
  let a,b,ans;
  if (op==='+') { a=Math.floor(Math.random()*(10*diff))+1; b=Math.floor(Math.random()*(10*diff))+1; ans=a+b; }
  else if (op==='-') { a=Math.floor(Math.random()*(10*diff))+1; b=Math.floor(Math.random()*a)+1; ans=a-b; }
  else { a=Math.floor(Math.random()*(5*diff))+2; b=Math.floor(Math.random()*(5*diff))+2; ans=a*b; }
  return {q: a+' '+op+' '+b+' = ?', a: ans};
}

export default function Logicmath() {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState({q:'',a:0});
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<'idle'|'playing'|'ended'>('idle');
  const [time, setTime] = useState(60);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState('');
  const diffRef = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const newQuestion = useCallback(() => {
    setQuestion(genQuestion(diffRef.current));
    setInput('');
  }, []);

  const startGame = useCallback(() => {
    setScore(0); setCorrect(0); setWrong(0); setTime(60); diffRef.current=1;
    setGameState('playing'); newQuestion();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [newQuestion]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const t = setInterval(() => {
      setTime(t => { if (t<=1) { setGameState('ended'); return 0; } return t-1; });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState]);

  const handleSubmit = useCallback(() => {
    if (gameState !== 'playing') return;
    const ans = parseInt(input);
    if (ans === question.a) {
      const pts = 10 + diffRef.current * 5;
      setScore(s => s+pts); setCorrect(c => c+1);
      setFeedback('正确! +'+pts);
      if (correct % 5 === 4) diffRef.current = Math.min(diffRef.current+1, 10);
    } else {
      setWrong(w => w+1); setFeedback('错误! 答案是 '+question.a);
    }
    setTimeout(() => setFeedback(''), 800);
    newQuestion();
  }, [gameState, input, question, correct, newQuestion]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key==='Enter') handleSubmit(); };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [handleSubmit]);

  return (
    <div style={{background:'#0a0a1a',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',padding:20}}>
      <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{color:PRIMARY,fontSize:28,marginBottom:10}}>🧩 逻辑数学</motion.h1>
      <div style={{display:'flex',gap:20,marginBottom:20}}>
        <span style={{color:'#fff'}}>分数: {score}</span>
        <span style={{color:time<=10?'#ff4444':'#fff'}}>时间: {time}s</span>
        <span style={{color:'#22c55e'}}>正确: {correct}</span>
        <span style={{color:'#ff4444'}}>错误: {wrong}</span>
      </div>
      {gameState==='playing' && (
        <motion.div initial={{scale:0.8}} animate={{scale:1}} style={{background:'#1a1a2e',padding:40,borderRadius:16,border:'2px solid '+PRIMARY,textAlign:'center'}}>
          <div style={{color:'#fff',fontSize:36,marginBottom:20}}>{question.q}</div>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
            style={{fontSize:24,padding:'8px 16px',background:'#0a0a1a',color:'#fff',border:'2px solid '+PRIMARY,borderRadius:8,textAlign:'center',width:150,outline:'none'}} />
          <div style={{marginTop:15}}>
            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={handleSubmit}
              style={{padding:'8px 24px',background:PRIMARY,color:'#000',border:'none',borderRadius:8,fontSize:16,cursor:'pointer',fontWeight:'bold'}}>
              提交
            </motion.button>
          </div>
        </motion.div>
      )}
      {feedback && <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{color:feedback.includes('正确')?'#22c55e':'#ff4444',fontSize:20,marginTop:15}}>{feedback}</motion.div>}
      {gameState==='ended' && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'#ffd700',fontSize:24,marginTop:20}}>时间到! 得分: {score} | 正确: {correct} | 错误: {wrong}</motion.div>}
      <div style={{marginTop:20,display:'flex',gap:10}}>
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