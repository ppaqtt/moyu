import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SHOP_MASTER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { ShopMasterEngine, PRODUCTS, Customer, Product } from './engine';

type GameStatus = 'idle' | 'playing' | 'gameover';

const BG_GRADIENT = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';

export default function ShopMaster() {
  const navigate = useNavigate();
  const [engine] = useState(() => new ShopMasterEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [shelves, setShelves] = useState<(string | null)[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [customerSatisfaction, setCustomerSatisfaction] = useState(100);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.SHOP_MASTER, 0);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    setCoins(state.coins);
    setShelves([...state.shelves]);
    setCustomers([...state.customers]);
    setTimeRemaining(state.timeRemaining);
    setCustomerSatisfaction(state.customerSatisfaction);

    if (state.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      if (state.score > highScore) {
        setHighScore(state.score);
      }
    }
  }, [engine, gameStatus, highScore, setHighScore]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStatus === 'playing' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameStatus !== 'playing') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawShop = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(0, 0, width, 40);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('🏪 商店大师', 20, 28);

      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(50, 70, width - 100, 20);
      ctx.fillRect(50, 150, width - 100, 20);
      ctx.fillRect(50, 230, width - 100, 20);

      const shelfWidth = 70;
      const shelfHeight = 50;
      const shelfStartX = 80;
      const shelfStartY = 60;
      const shelfGap = 10;

      for (let i = 0; i < 8; i++) {
        const shelfX = shelfStartX + (i % 4) * (shelfWidth + shelfGap);
        const shelfY = shelfStartY + Math.floor(i / 4) * (shelfHeight + shelfGap + 60);

        const isSelected = selectedShelf === i;

        ctx.fillStyle = isSelected ? '#6c5ce7' : '#3d3d5c';
        ctx.fillRect(shelfX, shelfY, shelfWidth, shelfHeight);

        ctx.strokeStyle = isSelected ? '#a855f7' : '#6c5ce7';
        ctx.lineWidth = 2;
        ctx.strokeRect(shelfX, shelfY, shelfWidth, shelfHeight);

        const productId = shelves[i];
        if (productId) {
          const product = PRODUCTS.find(p => p.id === productId);
          if (product) {
            ctx.font = '30px Arial';
            ctx.fillText(product.emoji, shelfX + 20, shelfY + 38);
          }
        } else {
          ctx.fillStyle = '#666';
          ctx.font = '20px Arial';
          ctx.fillText('+', shelfX + 28, shelfY + 35);
        }
      }

      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 320, width, height - 320);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`💰 金币: ${coins}`, 20, 350);
      ctx.fillText(`⭐ 分数: ${score}`, 20, 380);
      ctx.fillText(`😊 满意度: ${customerSatisfaction}%`, 20, 410);

      ctx.fillStyle = timeRemaining <= 10 ? '#ff6b6b' : '#39ff14';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`⏱️ ${Math.floor(timeRemaining)}秒`, width - 100, 350);

      customers.forEach(customer => {
        const customerX = customer.x;
        const customerY = customer.y;

        if (customer.leaving || customer.satisfied) {
          ctx.globalAlpha = Math.max(0, (customerX - (-100)) / 100);
        }

        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.arc(customerX, customerY - 30, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(customerX - 8, customerY - 35, 4, 0, Math.PI * 2);
        ctx.arc(customerX + 8, customerY - 35, 4, 0, Math.PI * 2);
        ctx.fill();

        if (customer.satisfied) {
          ctx.beginPath();
          ctx.arc(customerX, customerY - 22, 8, 0, Math.PI);
          ctx.stroke();
        } else if (customer.patience < customer.maxPatience * 0.3) {
          ctx.beginPath();
          ctx.arc(customerX, customerY - 22, 8, Math.PI, 0);
          ctx.stroke();
        }

        ctx.fillStyle = '#6c5ce7';
        ctx.fillRect(customerX - 25, customerY - 5, 50, 50);

        const patienceRatio = customer.patience / customer.maxPatience;
        ctx.fillStyle = patienceRatio > 0.5 ? '#39ff14' : patienceRatio > 0.25 ? '#ffd700' : '#ff6b6b';
        ctx.fillRect(customerX - 25, customerY + 50, 50 * patienceRatio, 5);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(customerX - 25, customerY + 50, 50, 5);

        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('想要:', customerX, customerY - 65);

        const wantEmojis = customer.wants.map(w => w.emoji).join(' ');
        ctx.font = '16px Arial';
        ctx.fillText(wantEmojis, customerX, customerY - 80);

        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      });
    };

    drawShop();
  }, [gameStatus, shelves, customers, coins, score, timeRemaining, customerSatisfaction, selectedShelf, width, height]);

  const startGame = useCallback(() => {
    engine.start();
    setGameStatus('playing');
  }, [engine]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const result = engine.handleClick(x, y);

    if (result?.type === 'shelf') {
      if (selectedProduct !== null && result.index !== undefined) {
        engine.selectProductForShelf(selectedProduct, result.index);
        setSelectedProduct(null);
        setSelectedShelf(null);
      } else {
        setSelectedShelf(result.index);
      }
    }
  }, [engine, gameStatus, selectedProduct]);

  const handleProductClick = useCallback((product: Product) => {
    if (gameStatus !== 'playing') return;

    if (selectedProduct === product.id) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(product.id);
    }
  }, [gameStatus, selectedProduct]);

  const handleShelfClick = useCallback((shelfIndex: number) => {
    if (gameStatus !== 'playing') return;

    if (selectedProduct !== null) {
      engine.selectProductForShelf(selectedProduct, shelfIndex);
      setSelectedProduct(null);
      setSelectedShelf(null);
    } else {
      engine.removeFromShelf(shelfIndex);
    }
  }, [engine, gameStatus, selectedProduct]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameStatus('idle');
    setScore(0);
    setCoins(0);
    setShelves([]);
    setCustomers([]);
    setTimeRemaining(90);
    setCustomerSatisfaction(100);
    setSelectedProduct(null);
    setSelectedShelf(null);
  }, [engine]);

  const getSatisfactionColor = () => {
    if (customerSatisfaction > 60) return '#39ff14';
    if (customerSatisfaction > 30) return '#ffd700';
    return '#ff6b6b';
  };

  const renderProducts = () => (
    <div className="flex flex-wrap justify-center gap-2">
      {PRODUCTS.map((product) => (
        <motion.button
          key={product.id}
          onClick={() => handleProductClick(product)}
          disabled={gameStatus !== 'playing'}
          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: selectedProduct === product.id ? `${product.color}60` : `${product.color}30`,
            border: `2px solid ${selectedProduct === product.id ? '#a855f7' : product.color + '60'}`
          }}
          whileHover={{ scale: gameStatus === 'playing' ? 1.1 : 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-2xl">{product.emoji}</span>
          <span className="text-xs text-white">{product.price}💰</span>
        </motion.button>
      ))}
    </div>
  );

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
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>金币</div>
          <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>{coins} 💰</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{highScore}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>满意度</div>
          <div className="text-xl font-bold" style={{ color: getSatisfactionColor() }}>
            {customerSatisfaction}%
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>时间</div>
          <div className="text-xl font-bold" style={{ color: timeRemaining <= 10 ? '#ff6b6b' : '#39ff14' }}>
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
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleCanvasClick}
          className="cursor-pointer"
          style={{ display: gameStatus === 'playing' ? 'block' : 'none' }}
        />

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
              🏪
            </motion.div>
            <div className="text-4xl font-bold mb-4" style={{ color: '#ff6b9d' }}>
              商店大师
            </div>
            <div className="text-gray-400 mb-8 text-center px-8">
              <p>在货架上摆放商品</p>
              <p>满足顾客需求赚取金币！</p>
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
              点击商品选择，再点击货架摆放
            </div>
          </motion.div>
        )}

        {gameStatus === 'playing' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                <span>选择商品</span>
                {selectedProduct && (
                  <motion.span
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: 'rgba(168, 85, 247, 0.3)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    已选择: {PRODUCTS.find(p => p.id === selectedProduct)?.emoji}
                  </motion.span>
                )}
              </div>
              {renderProducts()}
            </div>
            <div className="text-xs text-gray-500 text-center">
              点击货架放置商品，再次点击已放置的商品可以移除
            </div>
          </div>
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
            <div className="text-2xl mb-2" style={{ color: '#ffd700' }}>
              得分: {score}
            </div>
            <div className="text-xl mb-2" style={{ color: '#00d2ff' }}>
              金币: {coins}
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
        <div>在货架上摆放商品，满足顾客需求</div>
        <div>注意顾客的耐心值，超时会导致满意度下降</div>
      </div>
    </div>
  );
}
