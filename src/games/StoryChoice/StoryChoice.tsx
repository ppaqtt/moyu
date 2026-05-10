import { useState, useEffect, useCallback } from 'react';
import { StoryChoiceEngine, GameState, PlayerStats, STORY_DATA } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'title' | 'playing' | 'ending';

export default function StoryChoice() {
  const [engine] = useState(() => new StoryChoiceEngine());
  const [phase, setPhase] = useState<GamePhase>('title');
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [currentNode, setCurrentNode] = useState(STORY_DATA.start);
  const [showStats, setShowStats] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  useEffect(() => {
    engine.setStateChangeCallback((state) => {
      setGameState(state);
      setCurrentNode(STORY_DATA[state.currentNodeId] || STORY_DATA.start);
      if (state.isGameOver) {
        setPhase('ending');
      }
    });
  }, [engine]);

  const handleStart = () => {
    engine.restart();
    setPhase('playing');
    setCurrentNode(STORY_DATA.start);
  };

  const handleChoice = useCallback((choiceId: string) => {
    if (!engine.canMakeChoice(choiceId)) {
      const missing = engine.getMissingStats(choiceId);
      alert(`条件不足: ${missing.join(', ')}`);
      return;
    }
    setSelectedChoice(choiceId);
    setTimeout(() => {
      engine.makeChoice(choiceId);
      setSelectedChoice(null);
    }, 300);
  }, [engine]);

  const handleRestart = () => {
    engine.restart();
    setPhase('title');
  };

  const getStatColor = (value: number): string => {
    if (value >= 80) return '#00ff00';
    if (value >= 50) return '#ffff00';
    return '#ff6666';
  };

  const getStatIcon = (stat: keyof PlayerStats): string => {
    const icons: Record<keyof PlayerStats, string> = {
      hp: '❤️',
      mp: '💙',
      str: '💪',
      wis: '🧠',
      cha: '✨',
      luck: '🍀'
    };
    return icons[stat];
  };

  if (phase === 'title') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <div className="text-7xl mb-6">📖</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            剧情选择
          </h1>
          <p className="text-gray-300 mb-8 text-lg">Story Choice</p>

          <div className="glass-card rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-bold text-purple-400 mb-3">🎮 游戏介绍</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• 每一次选择都会影响你的命运</li>
              <li>• 不同的属性值会解锁不同的选项</li>
              <li>• 游戏共有多个结局等待探索</li>
              <li>• 你的选择将塑造独特的故事</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)'
            }}
          >
            开始冒险
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

  if (phase === 'ending') {
    const endingData = STORY_DATA[gameState.ending || 'start'];
    const isGoodEnding = gameState.ending?.includes('wizard') || 
                         gameState.ending?.includes('hero') ||
                         gameState.ending?.includes('wealthy');

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{
             background: gameState.ending?.includes('ordinary') || gameState.ending?.includes('doubt')
               ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
               : 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)'
           }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <div className="text-8xl mb-6">{isGoodEnding ? '🏆' : '📜'}</div>
          <h1 className="text-3xl font-bold mb-4 text-white">
            {endingData?.title || '游戏结束'}
          </h1>

          <div className="glass-card rounded-2xl p-6 mb-8 text-left max-h-64 overflow-y-auto">
            <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
              {endingData?.content}
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-6">
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">选择次数</span>
              <span className="text-purple-400 font-bold ml-2">{gameState.choicesMade}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
              }}
            >
              再玩一次
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRestart}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white bg-gray-700 hover:bg-gray-600"
            >
              返回标题
            </motion.button>
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

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="container mx-auto px-4 py-6 max-w-4xl flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            剧情选择
          </h1>
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-purple-600/50 rounded-xl text-white text-sm hover:bg-purple-600/70 transition-colors"
          >
            {showStats ? '隐藏属性' : '查看属性'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center mb-4">
              <span className="px-4 py-1 bg-purple-600/30 rounded-full text-purple-300 text-sm">
                {currentNode.title}
              </span>
            </div>

            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-4"
              >
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-sm font-bold text-purple-400 mb-3">角色属性</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(gameState.stats) as (keyof PlayerStats)[]).map((stat) => (
                      <div key={stat} className="text-center">
                        <div className="text-xl mb-1">{getStatIcon(stat)}</div>
                        <div className="text-xs text-gray-400 capitalize">{stat}</div>
                        <div className="text-lg font-bold" style={{ color: getStatColor(gameState.stats[stat]) }}>
                          {gameState.stats[stat]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="glass-card rounded-2xl p-6 mb-6 flex-1">
              <div className="text-xl leading-relaxed text-gray-200 whitespace-pre-wrap mb-6">
                {currentNode.content}
              </div>

              {currentNode.choices.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-purple-400 mb-3">请选择：</h3>
                  {currentNode.choices.map((choice, index) => {
                    const canChoose = engine.canMakeChoice(choice.id);
                    const missing = engine.getMissingStats(choice.id);
                    const isSelected = selectedChoice === choice.id;

                    return (
                      <motion.button
                        key={choice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={canChoose ? { scale: 1.02 } : {}}
                        whileTap={canChoose ? { scale: 0.98 } : {}}
                        onClick={() => handleChoice(choice.id)}
                        disabled={!canChoose}
                        className={`w-full text-left p-4 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : canChoose
                            ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 border border-purple-500/30'
                            : 'bg-gray-900/50 text-gray-500 border border-gray-700/30 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-purple-400 font-bold">{index + 1}.</span>
                          <span className="flex-1">{choice.text}</span>
                          {!canChoose && missing.length > 0 && (
                            <span className="text-xs text-red-400">
                              {missing[0]}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={handleRestart}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm transition-colors"
          >
            重新开始
          </button>
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
