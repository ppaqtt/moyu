import { useState, useEffect, useCallback, useRef } from 'react';
import { IdiomChainProEngine, ChainItem, Idiom } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES = [
  { key: 'easy' as Difficulty, label: '简单', subtitle: '45秒/回合', color: '#22c55e' },
  { key: 'medium' as Difficulty, label: '中等', subtitle: '30秒/回合', color: '#3b82f6' },
  { key: 'hard' as Difficulty, label: '困难', subtitle: '20秒/回合', color: '#f59e0b' },
];

export default function IdiomChainPro() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [engine, setEngine] = useState(() => new IdiomChainProEngine('medium'));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [currentChar, setCurrentChar] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [suggestions, setSuggestions] = useState<Idiom[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintIdiom, setHintIdiom] = useState<Idiom | null>(null);
  const [winner, setWinner] = useState<'user' | 'computer' | null>(null);
  const [reason, setReason] = useState('');
  const chainEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setChain(state.chain);
    setCurrentChar(state.currentChar);
    setScore(state.score);
    setCombo(state.combo);
    setTimeLeft(state.timeLeft);
    setIsUserTurn(state.isUserTurn);
    
    if (state.gameOver) {
      setWinner(state.winner);
      setReason(state.reason);
      setPhase('gameover');
    }
  }, [engine]);

  const startGame = (selectedDifficulty: Difficulty) => {
    const newEngine = new IdiomChainProEngine(selectedDifficulty);
    setEngine(newEngine);
    setDifficulty(selectedDifficulty);
    
    const state = newEngine.getState();
    setChain(state.chain);
    setCurrentChar(state.currentChar);
    setScore(0);
    setCombo(0);
    setTimeLeft(newEngine.getState().timeLeft);
    setInput('');
    setMessage('');
    setWinner(null);
    setReason('');
    setPhase('playing');
  };

  // Timer update
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (phase === 'playing') {
      intervalId = window.setInterval(() => {
        const state = engine.getState();
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 0.1);
          if (newTime <= 0 && isUserTurn) {
            setMessage('时间到！');
            setWinner('computer');
            setReason('时间耗尽！');
            setPhase('gameover');
          }
          return newTime;
        });
        if (engine.getState().gameOver) {
          loadState();
        }
      }, 100);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [phase, engine, isUserTurn, loadState]);

  // Auto-scroll to end of chain
  useEffect(() => {
    if (chainEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chain]);

  // Focus input on user turn
  useEffect(() => {
    if (isUserTurn && phase === 'playing') {
      inputRef.current?.focus();
    }
  }, [isUserTurn, phase]);

  // Computer turn
  useEffect(() => {
    if (phase === 'playing' && !isUserTurn && !engine.getState().gameOver) {
      const timer = setTimeout(() => {
        const computerIdiom = engine.computerTurn();
        if (computerIdiom) {
          loadState();
          setMessage(`电脑接龙: ${computerIdiom.text}`);
        } else {
          loadState();
        }
      }, engine.getComputerDelayTime());
      
      return () => clearTimeout(timer);
    }
  }, [isUserTurn, phase, engine, loadState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    if (value.length >= 1) {
      setSuggestions(engine.getSuggestions(value));
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || !isUserTurn || engine.getState().gameOver) return;
    
    const result = engine.userInput(input.trim());
    
    if (result.success) {
      setInput('');
      setSuggestions([]);
      setMessage(result.message);
      loadState();
    } else {
      setMessage(result.message);
      // Shake animation could be added here
    }
  };

  const handleHint = () => {
    const hint = engine.getHint();
    if (hint) {
      setHintIdiom(hint);
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
      // 提示会扣一点分数
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const selectSuggestion = (idiom: Idiom) => {
    setInput(idiom.text);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const getDifficultyColor = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-blue-400';
      case 'hard': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Menu Screen
  if (phase === 'menu') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            成语接龙 Pro
          </h1>
          <p className="text-gray-400 mb-8 text-xl">增强版 · 更丰富的成语库</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-orange-400 mb-4">游戏特色</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>• 更丰富的成语库（70+ 成语）</li>
              <li>• 智能计分系统（难度加分+时间奖励</li>
              <li>• 更智能的电脑对手</li>
              <li>• 成语难度分级（简单/中等/困难）</li>
              <li>• 实时提示功能（扣少许分数）</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="flex gap-4 mb-8 justify-center flex-wrap">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(d.key)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  difficulty === d.key
                    ? 'text-white ring-2 ring-white'
                    : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
                }`}
                style={{
                  background: difficulty === d.key
                    ? `linear-gradient(135deg, ${d.color}, ${d.color}88)`
                    : undefined,
                  boxShadow: difficulty === d.key
                    ? `0 0 20px ${d.color}50`
                    : undefined
                }}
              >
                <div className="text-lg">{d.label}</div>
                <div className="text-xs opacity-75">{d.subtitle}</div>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(difficulty)}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.primary}50`
            }}
          >
            开始游戏
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Game Over Screen
  if (phase === 'gameover') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">
            {winner === 'user' ? '🏆' : '😢'}
          </div>
          <h1 className={`text-5xl font-bold mb-4 ${
            winner === 'user'
              ? 'bg-gradient-to-r from-green-400 to-cyan-500'
              : 'bg-gradient-to-r from-red-400 to-orange-500'
          } bg-clip-text text-transparent`}>
            {winner === 'user' ? '恭喜你赢了！' : '游戏结束'}
          </h1>
          <p className="text-xl text-gray-300 mb-6">{reason}</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">最终得分</div>
                <div className="text-3xl font-bold text-yellow-400">{score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">最高连击</div>
                <div className="text-3xl font-bold text-cyan-400">{combo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">你的次数</div>
                <div className="text-3xl font-bold text-green-400">
                  {chain.filter(c => c.player === 'user').length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">总成语数</div>
                <div className="text-3xl font-bold text-purple-400">{chain.length}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(difficulty)}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`
              }}
            >
              再玩一次
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('menu')}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}, #2a2a4e)`,
                border: `2px solid ${NEON_COLORS.primary}`
              }}
            >
              返回菜单
            </motion.button>
          </div>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Game Screen
  return (
    <div 
      className="min-h-screen p-4 flex flex-col"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-4 flex-wrap gap-2"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
          成语接龙 Pro
        </h1>
        <div className="flex gap-3 flex-wrap">
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">得分</span>
            <span className="text-yellow-400 font-bold ml-2 text-xl">{score}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">连击</span>
            <span className="text-cyan-400 font-bold ml-2 text-xl">x{combo}</span>
          </div>
        </div>
      </motion.div>

      {/* Current Character Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-4"
      >
        <div className="glass-card rounded-2xl p-6 inline-block">
          <div className="text-gray-400 text-sm mb-2">请用以下字开头</div>
          <div
            className="text-6xl font-bold"
            style={{
              color: NEON_COLORS.primary,
              textShadow: `0 0 20px ${NEON_COLORS.primary}80`
            }}
          >
            {currentChar}
          </div>
        </div>
      </motion.div>

      {/* Turn Indicator & Timer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center gap-4 mb-4 flex-wrap"
      >
        <div className={`glass-card px-6 py-3 rounded-xl ${isUserTurn ? 'border-2 border-green-500' : ''}`}>
          <span className="text-gray-400 text-sm">当前回合</span>
          <span className={`font-bold ml-2 ${isUserTurn ? 'text-green-400' : 'text-gray-500'}`}>
            {isUserTurn ? '你的回合' : '电脑思考中...'}
          </span>
        </div>
        <div className={`glass-card px-6 py-3 rounded-xl ${timeLeft <= 10 ? 'border-2 border-red-500' : ''}`}>
          <span className="text-gray-400 text-sm">剩余时间</span>
          <span className={`font-bold ml-2 text-xl ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>
            {timeLeft.toFixed(1)}s
          </span>
        </div>
      </motion.div>

      {/* Chain Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 glass-card rounded-xl p-4 mb-4 overflow-y-auto"
        style={{ maxHeight: '280px' }}
      >
        <h3 className="text-sm font-bold text-gray-400 mb-3">接龙记录</h3>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {chain.map((item, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`px-3 py-2 rounded-lg ${
                  item.player === 'user'
                    ? 'bg-cyan-500/30 border border-cyan-500'
                    : 'bg-pink-500/30 border border-pink-500'
                }`}
              >
                <span className="font-bold text-white">{item.idiom.text}</span>
                <span className={`text-xs ml-1 ${getDifficultyColor(item.idiom.difficulty)}`}>
                  [{item.idiom.difficulty === 'easy' ? '简' : item.idiom.difficulty === 'medium' ? '中' : '难'}]
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  {item.player === 'user' ? '(你)' : '(电脑)'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chainEndRef} />
        </div>
      </motion.div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4"
      >
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center mb-3 ${
              message.includes('成功') ? 'text-green-400' : 'text-red-400'}`}
          >
            {message}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={!isUserTurn || engine.getState().gameOver}
              placeholder={isUserTurn ? `输入以"${currentChar}"开头的成语...` : '等待电脑...'}
              className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              maxLength={15}
            />
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-xl border border-gray-600 overflow-hidden z-10 max-h-[200px] overflow-y-auto">
                {suggestions.map((idiom) => (
                  <button
                    key={idiom.id}
                    type="button"
                    onClick={() => selectSuggestion(idiom)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-white"
                  >
                    <span className="font-bold">{idiom.text}</span>
                    <span className={`text-xs ml-2 ${getDifficultyColor(idiom.difficulty)}`}>
                      [{idiom.difficulty === 'easy' ? '简' : idiom.difficulty === 'medium' ? '中' : '难'}]
                    </span>
                    <span className="text-gray-400 text-sm ml-2">{idiom.meaning}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!isUserTurn || !input.trim() || engine.getState().gameOver}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-600 transition-all"
          >
            提交
          </button>
          
          <button
            type="button"
            onClick={handleHint}
            disabled={!isUserTurn || engine.getState().gameOver}
            className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            💡 提示 (-5分)
          </button>
        </form>

        {/* Hint Display */}
        <AnimatePresence>
          {showHint && hintIdiom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg"
            >
              <div className="text-yellow-400 font-bold">提示: {hintIdiom.text}</div>
              <div className="text-gray-400 text-sm">{hintIdiom.meaning}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mt-4 justify-center"
      >
        <button
          onClick={() => startGame(difficulty)}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重新开始
        </button>
        <button
          onClick={() => setPhase('menu')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
        >
          🏠 返回菜单
        </button>
      </motion.div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}