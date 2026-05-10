import { useState, useEffect } from 'react';
import { DetectiveTextEngine, GameState, Clue, Suspect } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'title' | 'investigating' | 'interrogating' | 'accusing' | 'result';
type TabType = 'clues' | 'suspects' | 'accuse';

export default function DetectiveText() {
  const [engine] = useState(() => new DetectiveTextEngine());
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [phase, setPhase] = useState<GamePhase>('title');
  const [activeTab, setActiveTab] = useState<TabType>('clues');
  const [message, setMessage] = useState('');
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [showHint, setShowHint] = useState('');

  useEffect(() => {
    engine.setStateChangeCallback((state) => {
      setGameState(state);
    });
  }, [engine]);

  const handleStart = () => {
    engine.restart();
    setPhase('investigating');
    setMessage('调查开始！点击"调查现场"来寻找线索。');
    setActiveTab('clues');
  };

  const handleInvestigate = () => {
    const result = engine.investigate();
    setMessage(result.message);
    if (result.clue) {
      setSelectedClue(result.clue);
    }
  };

  const handleInterrogate = (suspect: Suspect) => {
    const result = engine.interrogate(suspect.id);
    setSelectedSuspect(suspect);
    setMessage(`正在询问 ${suspect.name}...`);
  };

  const handleAccuse = (suspect: Suspect) => {
    const result = engine.accuse(suspect.id);
    setMessage(result.message);
    if (result.correct) {
      setPhase('result');
    } else {
      setTimeout(() => setPhase('result'), 2000);
    }
  };

  const handleHint = () => {
    const result = engine.useHint();
    setShowHint(result.hint);
    setTimeout(() => setShowHint(''), 8000);
  };

  const handleNextCase = () => {
    const hasNext = engine.nextCase();
    if (hasNext) {
      setPhase('investigating');
      setMessage('新案件已加载！');
    } else {
      setPhase('title');
    }
  };

  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'crucial': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffff00';
      case 'low': return '#888888';
      default: return '#ffffff';
    }
  };

  const renderClue = (clue: Clue, isFound: boolean) => {
    if (!isFound) {
      return (
        <div key={clue.id} className="p-3 bg-gray-800/50 rounded-lg opacity-50">
          <div className="text-gray-500">??? - 未发现</div>
        </div>
      );
    }

    return (
      <motion.div
        key={clue.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-lg cursor-pointer transition-all ${
          selectedClue?.id === clue.id
            ? 'bg-blue-900/50 border border-blue-500'
            : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
        }`}
        onClick={() => setSelectedClue(clue)}
      >
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">{clue.name}</span>
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: getImportanceColor(clue.importance) + '33',
              color: getImportanceColor(clue.importance)
            }}
          >
            {clue.importance === 'crucial' ? '关键' :
             clue.importance === 'high' ? '重要' :
             clue.importance === 'medium' ? '一般' : '次要'}
          </span>
        </div>
      </motion.div>
    );
  };

  if (phase === 'title') {
    const caseData = engine.getCurrentCase();
    const ending = engine.getEndingMessage();

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1b2d 50%, #1a0a2e 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <div className="text-7xl mb-6">🔍</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-300 via-purple-400 to-gray-300 bg-clip-text text-transparent">
            悬疑推理
          </h1>
          <p className="text-gray-400 mb-8 text-lg">Detective Mystery</p>

          {caseData && (
            <div className="glass-card rounded-2xl p-6 mb-6 text-left">
              <h3 className="text-lg font-bold text-purple-400 mb-2">{caseData.title}</h3>
              <p className="text-gray-300 text-sm mb-3">{caseData.description}</p>
              <div className="text-xs text-gray-500">
                难度: <span className={
                  caseData.difficulty === 'easy' ? 'text-green-400' :
                  caseData.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
                }>
                  {caseData.difficulty === 'easy' ? '简单' : caseData.difficulty === 'medium' ? '中等' : '困难'}
                </span>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-bold text-purple-400 mb-3">🎮 游戏说明</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• 调查现场，寻找线索</li>
              <li>• 询问嫌疑人，获取信息</li>
              <li>• 分析证据，找出真凶</li>
              <li>• 谨慎指控，避免冤枉好人</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)'
            }}
          >
            开始调查
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(139, 92, 246, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'result') {
    const ending = engine.getEndingMessage();

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{
             background: gameState.accusationResult
               ? 'linear-gradient(135deg, #0a2a0a 0%, #1a3a1a 100%)'
               : 'linear-gradient(135deg, #2a0a0a 0%, #3a1a1a 100%)'
           }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <div className="text-8xl mb-6">
            {gameState.accusationResult ? '🎉' : '😔'}
          </div>
          <h1 className="text-4xl font-bold mb-4 text-white">
            {ending.title}
          </h1>
          <p className="text-gray-300 mb-4">{ending.message}</p>

          {gameState.accusationResult && engine.getCurrentCase()?.solution && (
            <div className="glass-card rounded-2xl p-6 mb-6 text-left max-h-64 overflow-y-auto">
              <h3 className="text-lg font-bold text-green-400 mb-2">案件真相</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {engine.getCurrentCase()?.solution}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center mb-6">
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">得分</span>
              <span className="text-yellow-400 font-bold ml-2">{ending.score}</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">线索</span>
              <span className="text-blue-400 font-bold ml-2">{gameState.foundClues.length}</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">提示</span>
              <span className="text-purple-400 font-bold ml-2">{gameState.hintsUsed}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-6 py-3 text-lg font-bold rounded-xl text-white"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
              }}
            >
              重玩本关
            </motion.button>
            {engine.nextCase() && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextCase}
                className="px-6 py-3 text-lg font-bold rounded-xl text-white bg-green-600 hover:bg-green-700"
              >
                下一关
              </motion.button>
            )}
          </div>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(139, 92, 246, 0.3);
          }
        `}</style>
      </div>
    );
  }

  const caseData = engine.getCurrentCase();
  if (!caseData) return null;

  const foundClues = engine.getFoundClues();
  const suspects = engine.getSuspects();

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1b2d 50%, #1a0a2e 100%)' }}>
      <div className="container mx-auto px-4 py-4 max-w-2xl flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-300 via-purple-400 to-gray-300 bg-clip-text text-transparent">
              悬疑推理
            </h1>
            <p className="text-xs text-gray-400">{caseData.title}</p>
          </div>
          <button
            onClick={handleStart}
            className="px-3 py-1 bg-red-600/50 rounded-lg text-white text-sm hover:bg-red-600/70 transition-colors"
          >
            重新开始
          </button>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">调查进度</span>
            <span className="text-purple-400 font-bold">{gameState.progress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${gameState.progress}%` }}
              className="h-full bg-purple-500 rounded-full"
            />
          </div>
          <div className="flex gap-4 justify-center mt-2 text-xs">
            <span className="text-gray-400">🔍 {foundClues.length}/{caseData.clues.length}</span>
            <span className="text-gray-400">💬 {gameState.interrogatedSuspects.length}/{suspects.length}</span>
            <span className="text-yellow-400">⭐ {gameState.score}</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-4 flex-1 overflow-hidden">
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === 'clues' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('clues')}
            >
              🔍 线索 ({foundClues.length}/{caseData.clues.length})
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === 'suspects' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('suspects')}
            >
              👥 嫌疑人 ({gameState.interrogatedSuspects.length}/{suspects.length})
            </button>
          </div>

          <div className="overflow-y-auto flex-1 max-h-80">
            <AnimatePresence mode="wait">
              {activeTab === 'clues' && (
                <motion.div
                  key="clues"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {caseData.clues.map(clue => renderClue(clue, foundClues.some(c => c.id === clue.id)))}
                </motion.div>
              )}

              {activeTab === 'suspects' && (
                <motion.div
                  key="suspects"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {suspects.map(suspect => (
                    <div
                      key={suspect.id}
                      className={`p-3 rounded-lg ${
                        selectedSuspect?.id === suspect.id
                          ? 'bg-purple-900/50 border border-purple-500'
                          : 'bg-gray-800/50 border border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium">{suspect.name}</span>
                        <span className="text-xs text-gray-400">{suspect.role}</span>
                      </div>
                      {gameState.interrogatedSuspects.includes(suspect.id) && (
                        <p className="text-xs text-gray-400 italic">"{suspect.dialogue}"</p>
                      )}
                      <button
                        onClick={() => handleInterrogate(suspect)}
                        className="mt-2 px-3 py-1 bg-blue-600/50 hover:bg-blue-600/70 rounded text-xs text-white"
                      >
                        询问
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {selectedClue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 mb-4"
          >
            <h3 className="text-lg font-bold text-purple-400 mb-2">{selectedClue.name}</h3>
            <p className="text-gray-300 text-sm">{selectedClue.description}</p>
          </motion.div>
        )}

        {selectedSuspect && gameState.interrogatedSuspects.includes(selectedSuspect.id) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 mb-4"
          >
            <h3 className="text-lg font-bold text-purple-400 mb-2">{selectedSuspect.name}</h3>
            <p className="text-gray-300 text-sm mb-2">身份: {selectedSuspect.role}</p>
            <p className="text-gray-300 text-sm mb-2">证词: "{selectedSuspect.dialogue}"</p>
            {selectedSuspect.evidence.length > 0 && (
              <div className="mt-2">
                <span className="text-gray-400 text-sm">发现证据: </span>
                <span className="text-yellow-400 text-sm">{selectedSuspect.evidence.join(', ')}</span>
              </div>
            )}
            <button
              onClick={() => handleAccuse(selectedSuspect)}
              disabled={gameState.accusationMade}
              className={`mt-3 px-4 py-2 rounded-lg font-bold text-sm ${
                gameState.accusationMade
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              ⚖️ 指控 {selectedSuspect.name}
            </button>
          </motion.div>
        )}

        {message && (
          <div className="text-center text-gray-400 text-sm mb-3 p-2 bg-gray-800/50 rounded-lg">
            {message}
          </div>
        )}

        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 mb-3 text-yellow-300 text-sm"
          >
            💡 提示: {showHint}
          </motion.div>
        )}

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInvestigate}
            disabled={gameState.isSolved || engine.getAvailableClues().length === 0}
            className={`flex-1 p-3 rounded-xl font-bold ${
              gameState.isSolved || engine.getAvailableClues().length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            🔍 调查现场
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleHint}
            disabled={gameState.isSolved}
            className={`px-6 py-3 rounded-xl font-bold ${
              gameState.isSolved
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            💡 提示
          </motion.button>
        </div>
      </div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
      `}</style>
    </div>
  );
}
