import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SuperMarketEngine, Product, Customer } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new SuperMarketEngine();

export default function SuperMarket() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [money, setMoney] = useState(5000);
  const [reputation, setReputation] = useState(50);
  const [day, setDay] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dailySales, setDailySales] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'products' | 'customers'>('products');

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setMoney(5000);
    setReputation(50);
    setDay(1);
    setIsOpen(false);
    setDailySales(0);
    loadState();
  }, []);

  const loadState = () => {
    const state = engine.getState();
    setProducts([...state.products]);
    setCustomers([...state.customers]);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const state = engine.getState();
      setMoney(state.money);
      setReputation(state.reputation);
      setDay(state.day);
      setProducts([...state.products]);
      setCustomers([...state.customers]);
      setIsOpen(state.isOpen);
      setDailySales(state.dailyProfit);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const customerInterval = setInterval(() => {
      engine.spawnCustomer();
    }, 2000);

    const updateInterval = setInterval(() => {
      engine.updateCustomers(100);
    }, 100);

    return () => {
      clearInterval(customerInterval);
      clearInterval(updateInterval);
    };
  }, [isOpen, gameState]);

  const handleOpenStore = () => {
    engine.openStore();
    setIsOpen(true);
  };

  const handleCloseStore = () => {
    engine.closeStore();
    setIsOpen(false);
    loadState();
  };

  const handleCheckout = (customerId: number) => {
    engine.checkoutCustomer(customerId);
    loadState();
  };

  const handleRestock = (productId: number) => {
    engine.restockProduct(productId);
    loadState();
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🏪
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonCyan,
        textShadow: `0 0 30px ${NEON_COLORS.neonCyan}, 0 0 60px ${NEON_COLORS.neonCyan}`
      }}>
        SuperMarket
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.gold }}>
        超市大亨
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.gold})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始营业
      </motion.button>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg text-base"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>
      <div className="mt-8 text-center opacity-60">
        <p className="mb-2">操作说明</p>
        <p className="text-sm">开店迎客,为顾客结账</p>
        <p className="text-sm">补货并管理库存</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 700 }}>
      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs opacity-70">资金</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>${money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">声望</div>
              <div className="text-2xl font-bold" style={{ color: reputation > 70 ? NEON_COLORS.success : reputation > 40 ? NEON_COLORS.gold : NEON_COLORS.danger }}>
                {reputation}%
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70">第 {day} 天</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.primary }}>{isOpen ? '营业中' : '休息'}</div>
            </div>
            {isOpen && (
              <div>
                <div className="text-xs opacity-70">今日营收</div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>${dailySales}</div>
              </div>
            )}
          </div>
          <motion.button
            onClick={isOpen ? handleCloseStore : handleOpenStore}
            className="px-6 py-3 rounded-xl font-bold"
            style={{
              background: isOpen ? NEON_COLORS.danger : NEON_COLORS.neonGreen,
              border: `2px solid ${isOpen ? NEON_COLORS.danger : NEON_COLORS.neonGreen}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? '🚪 打烊' : '🏃 开门营业'}
          </motion.button>
        </div>
      </div>

      {isOpen && customers.length > 0 && (
        <div className="w-full glass-card rounded-xl p-4" style={{ background: '#1a2a1a' }}>
          <div className="text-sm font-bold mb-3 flex items-center gap-2">
            <span>🛒</span> 购物中的顾客 ({customers.length})
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <AnimatePresence>
              {customers.map(customer => (
                <motion.div
                  key={customer.id}
                  className="flex-shrink-0 p-3 rounded-lg"
                  style={{
                    background: NEON_COLORS.surface,
                    border: `2px solid ${NEON_COLORS.neonGreen}60`,
                    minWidth: 160,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{customer.name}</span>
                    <span className="text-xs" style={{ color: NEON_COLORS.danger }}>
                      ⏱ {Math.round(customer.patience)}s
                    </span>
                  </div>
                  <div className="text-xs opacity-60 mb-2">
                    购物车: {customer.cart.map(p => p.emoji).join(' ')}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      小计: <span style={{ color: NEON_COLORS.gold }}>
                        ${customer.cart.reduce((sum, p) => sum + p.price, 0)}
                      </span>
                    </span>
                    <motion.button
                      onClick={() => handleCheckout(customer.id)}
                      className="px-3 py-1 rounded text-xs font-bold"
                      style={{
                        background: NEON_COLORS.neonGreen,
                        color: '#000',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      结账
                    </motion.button>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden mt-2" style={{ background: NEON_COLORS.surface }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: customer.patience > 30 ? NEON_COLORS.neonGreen :
                                    customer.patience > 15 ? NEON_COLORS.gold : NEON_COLORS.danger,
                        width: `${(customer.patience / customer.maxPatience) * 100}%`
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="w-full glass-card rounded-xl overflow-hidden">
        <div className="flex border-b" style={{ borderColor: `${NEON_COLORS.neonCyan}30` }}>
          <button
            onClick={() => setSelectedTab('products')}
            className="flex-1 py-3 text-sm font-bold"
            style={{
              background: selectedTab === 'products' ? `${NEON_COLORS.neonCyan}20` : 'transparent',
              color: selectedTab === 'products' ? NEON_COLORS.neonCyan : NEON_COLORS.textDim,
              borderBottom: selectedTab === 'products' ? `2px solid ${NEON_COLORS.neonCyan}` : 'none',
            }}
          >
            📦 商品管理
          </button>
          <button
            onClick={() => setSelectedTab('customers')}
            className="flex-1 py-3 text-sm font-bold"
            style={{
              background: selectedTab === 'customers' ? `${NEON_COLORS.neonCyan}20` : 'transparent',
              color: selectedTab === 'customers' ? NEON_COLORS.neonCyan : NEON_COLORS.textDim,
              borderBottom: selectedTab === 'customers' ? `2px solid ${NEON_COLORS.neonCyan}` : 'none',
            }}
          >
            🛒 顾客 ({customers.length})
          </button>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {selectedTab === 'products' ? (
            <div className="grid grid-cols-2 gap-2">
              {products.map(product => {
                const isLowStock = product.stock < product.maxStock * 0.3;
                const canRestock = money >= product.cost * 10;

                return (
                  <motion.div
                    key={product.id}
                    className="p-3 rounded-lg"
                    style={{
                      background: isLowStock ? `${NEON_COLORS.danger}20` : NEON_COLORS.surface,
                      border: `1px solid ${isLowStock ? NEON_COLORS.danger : 'transparent'}40`,
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{product.emoji}</span>
                        <div>
                          <div className="font-bold text-sm">{product.name}</div>
                          <div className="text-xs opacity-60">{product.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: NEON_COLORS.gold }}>${product.price}</div>
                        <div className="text-xs opacity-60">成本 ${product.cost}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-2">
                        <div className="text-xs opacity-60 mb-1">库存: {product.stock}/{product.maxStock}</div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: NEON_COLORS.background }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              background: isLowStock ? NEON_COLORS.danger :
                                         product.stock < product.maxStock * 0.6 ? NEON_COLORS.gold : NEON_COLORS.neonGreen,
                              width: `${(product.stock / product.maxStock) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleRestock(product.id)}
                        disabled={!canRestock}
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{
                          background: canRestock ? NEON_COLORS.neonCyan : NEON_COLORS.surface,
                          color: canRestock ? '#000' : NEON_COLORS.textDim,
                          opacity: canRestock ? 1 : 0.5,
                        }}
                        whileHover={canRestock ? { scale: 1.05 } : {}}
                      >
                        补货 ${product.cost * 10}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              {customers.length === 0 ? (
                <>
                  <div className="text-4xl mb-4">🛒</div>
                  <p className="opacity-60">
                    {isOpen ? '等待顾客上门...' : '请先开门营业'}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  {customers.map(customer => (
                    <div
                      key={customer.id}
                      className="p-3 rounded-lg flex items-center justify-between"
                      style={{ background: NEON_COLORS.surface }}
                    >
                      <div>
                        <div className="font-bold">{customer.name}</div>
                        <div className="text-xs opacity-60">
                          {customer.cart.map(p => p.emoji).join(' ')}
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleCheckout(customer.id)}
                        className="px-4 py-2 rounded font-bold"
                        style={{ background: NEON_COLORS.neonGreen, color: '#000' }}
                        whileHover={{ scale: 1.05 }}
                      >
                        结账 ${customer.cart.reduce((s, p) => s + p.price, 0)}
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="text-center text-sm opacity-60">
          <p>提示: 保持货架充足可提高声望</p>
          <p>注意顾客耐心值,及时结账</p>
        </div>
      </div>

      <motion.button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg mt-4"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
        whileHover={{ scale: 1.05 }}
      >
        返回主页
      </motion.button>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #0a1a2a 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}dd;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonCyan}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
    </div>
  );
}
