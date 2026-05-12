import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { COOKING_MASTER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { CookingMasterEngine, INGREDIENTS, OrderItem } from './engine';

type GameStatus = 'idle' | 'playing' | 'gameover';

const BG_GRADIENT = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';

export default function CookingMaster() {
  const navigate = useNavigate();
  const [engine] = useState(() => new CookingMasterEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [currentIngredients, setCurrentIngredients] = useState<string[]>([]);
  const [isCooking, setIsCooking] = useState(false);
  const [cookProgress, setCookProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.COOKING_MASTER, 0);

  const { width, height } = engine.getCanvasSize();

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleScoreUpdate = useCallback((newScore: number) => {
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
  }, []);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();

    setScore(state.score);
    setOrders([...state.orders]);
    setTimeRemaining(state.timeRemaining);

    if (state.cooking) {
      setCurrentIngredients([...state.cooking.currentIngredients]);
      setIsCooking(state.cooking.isCooking);
      setCookProgress(state.cooking.cookProgress);
    } else {
      setCurrentIngredients([]);
      setIsCooking(false);
      setCookProgress(0);
    }

    if (state.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      if (state.score > highScore) {
        setHighScore(state.score);
      }
    }
  }, [engine, gameStatus, highScore, setHighScore]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStatus === 'playing' });

  const startGame = useCallback(() => {
    engine.start();
    setGameStatus('playing');
  }, [engine]);

  const handleIngredientClick = useCallback((ingredientId: string) => {
    if (gameStatus !== 'playing') return;
    engine.selectIngredient(ingredientId);
    const state = engine.getState();
    if (state.cooking) {
      setCurrentIngredients([...state.cooking.currentIngredients]);
    }
  }, [engine, gameStatus]);

  const handleStartCooking = useCallback(() => {
    if (gameStatus !== 'playing' || currentIngredients.length === 0) return;
    engine.startCooking();
  }, [engine, gameStatus, currentIngredients]);

  const handleServe = useCallback(() => {
    if (gameStatus !== 'playing' || !isCooking || cookProgress < 1) return;
    engine.completeCooking();
  }, [engine, gameStatus, isCooking, cookProgress]);

  const handleClearPan = useCallback(() => {
    if (gameStatus !== 'playing') return;
    engine.clearPan();
    setCurrentIngredients([]);
    setIsCooking(false);
    setCookProgress(0);
  }, [engine, gameStatus]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameStatus('idle');
    setScore(0);
    setOrders([]);
    setCurrentIngredients([]);
    setIsCooking(false);
    setCookProgress(0);
    setTimeRemaining(90);
  }, [engine]);

  const getTimeColor = () => {
    if (timeRemaining > 30) return '#39ff14';
    if (timeRemaining > 10) return '#ffd700';
    return '#ff6b6b';
  };

  const renderOrderCard = (order: OrderItem, index: number) => {
    const elapsed = Date.now() - order.startTime;
    const remaining = Math.max(0, order.timeLimit - elapsed);
    const progress = remaining / order.timeLimit;
    const timePercent = progress * 100;

    return (
      <motion.div
        key={order.id}
        className="glass-card p-3 rounded-xl"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          border: '1px solid rgba(108, 92, 231, 0.3)',
          width: '180px'
        }}
      >
        <div className="text-xs text-gray-400 mb-2">订单 {index + 1}</div>
        <div className="flex gap-2 mb-2">
          {order.ingredients.map((ing, i) => {
            const ingredient = INGREDIENTS.find(item => item.id === ing);
            return ingredient ? (
              <span key={i} className="text-2xl">{ingredient.emoji}</span>
            ) : null;
          })}
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${timePercent}%`,
              backgroundColor: progress > 0.5 ? '#39ff14' : progress > 0.25 ? '#ffd700' : '#ff6b6b'
            }}
            animate={{ width: `${timePercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          +{order.score}分
        </div>
      </motion.div>
    );
  };

  const renderIngredients = () => (
    <div className="flex flex-wrap justify-center gap-3">
      {INGREDIENTS.map((ingredient) => (
        <motion.button
          key={ingredient.id}
          onClick={() => handleIngredientClick(ingredient.id)}
          disabled={gameStatus !== 'playing' || isCooking || currentIngredients.length >= 3}
          className="w-16 h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: `${ingredient.color}30`,
            border: `2px solid ${ingredient.color}60`
          }}
          whileHover={{ scale: gameStatus === 'playing' && !isCooking && currentIngredients.length < 3 ? 1.1 : 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-3xl">{ingredient.emoji}</span>
          <span className="text-xs text-white mt-1">{ingredient.name}</span>
        </motion.button>
      ))}
    </div>
  );

  const renderPan = () => {
    const stovePos = engine.getStovePosition();
    const panRadius = engine.getPanRadius();

    return (
      <div className="relative" style={{ width, height }}>
        <div
          className="absolute rounded-full"
          style={{
            left: stovePos.x - 60,
            top: stovePos.y - 60,
            width: 120,
            height: 120,
            background: 'linear-gradient(145deg, #4a4a4a, #2d2d2d)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)'
          }}
        />

        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            left: stovePos.x - panRadius,
            top: stovePos.y - panRadius,
            width: panRadius * 2,
            height: panRadius * 2,
            background: isCooking
              ? 'linear-gradient(145deg, #3d3d3d, #1a1a1a)'
              : 'linear-gradient(145deg, #505050, #2a2a2a)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)'
          }}
        >
          {isCooking && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#ff6b6b ${cookProgress * 360}deg, transparent ${cookProgress * 360}deg)`
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <div className="relative z-10 flex flex-wrap justify-center items-center gap-1 p-2">
            {currentIngredients.map((ing, i) => {
              const ingredient = INGREDIENTS.find(item => item.id === ing);
              return ingredient ? (
                <motion.span
                  key={i}
                  className="text-xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {ingredient.emoji}
                </motion.span>
              ) : null;
            })}
          </div>

          {currentIngredients.length === 0 && !isCooking && (
            <span className="text-gray-500 text-sm">+</span>
          )}
        </div>

        <div
          className="absolute"
          style={{
            left: stovePos.x + panRadius - 5,
            top: stovePos.y - 10,
            width: 40,
            height: 20,
            background: 'linear-gradient(145deg, #3d3d3d, #1a1a1a)',
            borderRadius: '0 10px 10px 0'
          }}
        />

        {isCooking && (
          <motion.div
            className="absolute"
            style={{
              left: stovePos.x - 20,
              top: stovePos.y - 60,
              fontSize: '24px'
            }}
            animate={{ y: [0, -20], opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            🍳
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[720px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            color: '#00d2ff',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.25)',
            border: '1px solid rgba(0, 210, 255, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#ff6b9d' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{highScore}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>时间</div>
          <div className="text-xl font-bold" style={{ color: getTimeColor() }}>
            {Math.floor(timeRemaining)}s
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          width,
          height,
          background: BG_GRADIENT,
          boxShadow: '0 0 30px rgba(255, 107, 157, 0.2)',
          border: '2px solid rgba(108, 92, 231, 0.3)'
        }}
      >
        <div className="absolute top-4 left-4 right-4 flex gap-3 overflow-x-auto pb-2">
          <AnimatePresence mode="popLayout">
            {orders.map((order, index) => renderOrderCard(order, index))}
          </AnimatePresence>
          {orders.length === 0 && gameStatus === 'playing' && (
            <motion.div
              className="glass-card p-3 rounded-xl"
              style={{
                backgroundColor: 'rgba(26, 26, 46, 0.8)',
                border: '1px solid rgba(108, 92, 231, 0.3)'
              }}
            >
              <div className="text-sm text-gray-400">等待新订单...</div>
            </motion.div>
          )}
        </div>

        {renderPan()}

        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-2">选择食材 (最多3个)</div>
            {renderIngredients()}
          </div>

          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={handleStartCooking}
              disabled={gameStatus !== 'playing' || currentIngredients.length === 0 || isCooking}
              className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isCooking ? '#ffd700' : 'rgba(108, 92, 231, 0.8)',
                color: isCooking ? '#1a1a2e' : '#ffffff',
                boxShadow: '0 0 15px rgba(108, 92, 231, 0.4)'
              }}
              whileHover={{ scale: currentIngredients.length > 0 && !isCooking ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCooking ? `烹饪中 ${Math.floor(cookProgress * 100)}%` : '开始烹饪'}
            </motion.button>

            <motion.button
              onClick={handleClearPan}
              disabled={gameStatus !== 'playing' || (currentIngredients.length === 0 && !isCooking)}
              className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(255, 107, 157, 0.6)',
                color: '#ffffff',
                boxShadow: '0 0 15px rgba(255, 107, 157, 0.3)'
              }}
              whileHover={{ scale: currentIngredients.length > 0 ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
            >
              清除
            </motion.button>
          </div>
        </div>

        {gameStatus === 'idle' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🍳
            </motion.div>
            <div className="text-4xl font-bold mb-4" style={{ color: '#ff6b9d' }}>
              烹饪大师
            </div>
            <div className="text-gray-400 mb-8 text-center px-8">
              <p>按照顾客订单选择食材</p>
              <p>完成烹饪获得高分！</p>
            </div>
            <motion.button
              onClick={startGame}
              className="px-12 py-4 rounded-xl text-xl font-bold"
              style={{
                backgroundColor: '#ff6b9d',
                color: '#ffffff',
                boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始游戏
            </motion.button>
            <div className="mt-6 text-sm text-gray-500">
              点击食材添加，按开始烹饪按钮完成
            </div>
          </motion.div>
        )}

        {gameStatus === 'gameover' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              😵
            </motion.div>
            <div className="text-4xl font-bold mb-4" style={{ color: '#ff6b9d' }}>
              游戏结束
            </div>
            <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
              得分: {score}
            </div>
            {score >= highScore && score > 0 && (
              <motion.div
                className="text-xl mb-4"
                style={{ color: '#39ff14' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                🎉 新纪录! 🎉
              </motion.div>
            )}
            <div className="text-xl mb-6" style={{ color: '#00d2ff' }}>
              最高: {highScore}
            </div>
            <motion.button
              onClick={handleRestart}
              className="px-12 py-4 rounded-xl text-xl font-bold"
              style={{
                backgroundColor: '#ff6b9d',
                color: '#ffffff',
                boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再来一局
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: '#ffd700' }}>
        <div>选择食材放入锅中，按照订单完成烹饪</div>
        <div>在订单超时前完成可获得时间奖励分数</div>
      </div>
    </div>
  );
}
