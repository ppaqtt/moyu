import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, Trophy, Difficulty, Play, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChineseChessAIEngine, Difficulty as ChineseChessDifficulty } from './engine';
import { CHINESE_CHESS_AI_CONSTANTS } from '@/utils/constants';

interface ChineseChessAIProps {
  onBackToMenu: () => void;
}

export const ChineseChessAI: React.FC<ChineseChessAIProps> = ({ onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ChineseChessAIEngine | null>(null);
  const [difficulty, setDifficulty] = useState<ChineseChessDifficulty>('medium');
  const [gameState, setGameState] = useState(engineRef.current?.getState());
  const [aiThinking, setAiThinking] = useState(false);
  const animationRef = useRef<number>();

  const { CELL_SIZE, GRID_COLS, GRID_ROWS } = CHINESE_CHESS_AI_CONSTANTS;

  useEffect(() => {
    engineRef.current = new ChineseChessAIEngine(difficulty);
    setGameState(engineRef.current.getState());
    render();
  }, []);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engineRef.current.render(ctx);
  };

  useEffect(() => {
    render();
  }, [gameState]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !gameState || gameState.isGameOver || aiThinking) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (!engineRef.current.isValidPosition(row, col)) return;

    const state = engineRef.current.getState();
    if (state.selectedPiece) {
      // 尝试移动
      const moved = engineRef.current.makeMove(
        state.selectedPiece.position.row,
        state.selectedPiece.position.col,
        row,
        col
      );
      if (!moved) {
        // 移动失败，重新选择
        engineRef.current.selectPiece(row, col);
      }
    } else {
      // 选择棋子
      engineRef.current.selectPiece(row, col);
    }

    setGameState(engineRef.current.getState());

    // 检查是否轮到AI
    const newState = engineRef.current.getState();
    if (!newState.isGameOver && newState.currentPlayer === 'black') {
      makeAIMove();
    }
  };

  const makeAIMove = async () => {
    if (!engineRef.current) return;

    setAiThinking(true);
    await engineRef.current.makeAIMove();
    setGameState(engineRef.current.getState());
    setAiThinking(false);
  };

  const handleReset = () => {
    if (!engineRef.current) return;
    engineRef.current.reset(difficulty);
    setGameState(engineRef.current.getState());
    setAiThinking(false);
  };

  const handleDifficultyChange = (value: ChineseChessDifficulty) => {
    setDifficulty(value);
    if (engineRef.current) {
      engineRef.current.setDifficulty(value);
      engineRef.current.reset(value);
      setGameState(engineRef.current.getState());
    }
  };

  const getResultText = () => {
    if (!gameState?.isGameOver) return '';
    if (gameState.winner === 'red') {
      return '🎉 你赢了！';
    } else if (gameState.winner === 'black') {
      return '😢 你输了！';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="secondary"
            onClick={onBackToMenu}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            返回菜单
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-amber-900 mb-2">中国象棋 AI</h1>
          </div>

          <div className="flex items-center gap-2">
            <Difficulty className="w-5 h-5 text-amber-700" />
            <Select value={difficulty} onValueChange={handleDifficultyChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">简单</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="hard">困难</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Game Board */}
        <Card className="shadow-2xl bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={GRID_COLS * CELL_SIZE}
                height={GRID_ROWS * CELL_SIZE}
                onClick={handleCanvasClick}
                className="cursor-pointer rounded-lg shadow-lg"
                style={{ background: '#f5deb3' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Game Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-600">当前回合</p>
                  <p className="text-lg font-bold text-amber-900">
                    {gameState?.currentPlayer === 'red' ? '红方（你）' : '黑方（AI）'}
                  </p>
                </div>
              </div>
              {!aiThinking && gameState?.currentPlayer === 'black' && (
                <p className="text-sm text-amber-600 mt-2">AI 正在思考...</p>
              )}
              {gameState?.isGameOver && (
                <p className="text-lg font-bold text-green-600 mt-2">{getResultText()}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-600">游戏状态</p>
                  <p className="text-lg font-bold text-amber-900">
                    {gameState?.isGameOver ? '游戏结束' : '进行中'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-amber-500 rounded" />
                <div>
                  <p className="text-sm text-gray-600">你的棋子</p>
                  <p className="text-lg font-bold text-amber-900">红方</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleReset}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            <RotateCcw className="w-5 h-5" />
            重新开始
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-6 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="font-bold text-amber-900 mb-2">游戏规则</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 点击棋子选中，然后点击目标位置移动</li>
              <li>• 将/帅只能在九宫格内移动</li>
              <li>• 马走日，象走田</li>
              <li>• 炮翻山吃子</li>
              <li>• 吃掉对方将帅即可获胜</li>
            </ul>
          </CardContent>
        </Card>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameState?.isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <Card className="bg-white p-8 text-center max-w-md mx-4">
                <CardContent className="p-0">
                  <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-amber-900 mb-2">
                    {getResultText()}
                  </h2>
                  <p className="text-gray-600 mb-6">精彩的对局！</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleReset} className="bg-amber-600 hover:bg-amber-700">
                      再来一局
                    </Button>
                    <Button variant="secondary" onClick={onBackToMenu}>
                      返回菜单
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
