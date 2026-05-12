import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtGalleryEngine, Artwork, RARITY_COLORS } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new ArtGalleryEngine();

export default function ArtGallery() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [money, setMoney] = useState(10000);
  const [reputation, setReputation] = useState(30);
  const [day, setDay] = useState(1);
  const [marketArt, setMarketArt] = useState<Artwork[]>([]);
  const [displayedArt, setDisplayedArt] = useState<Artwork[]>([]);
  const [ownedArt, setOwnedArt] = useState<Artwork[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'market' | 'gallery' | 'owned'>('market');
  const [notification, setNotification] = useState<string | null>(null);

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setMoney(10000);
    setReputation(30);
    setDay(1);
    setTotalVisitors(0);
    setTotalLikes(0);
    loadState();
  }, []);

  const loadState = () => {
    const state = engine.getState();
    setMarketArt(engine.getMarketArtworks());
    setDisplayedArt(engine.getDisplayedArtworks());
    setOwnedArt(engine.getPurchasedArtworks());
    setCustomers([...state.customers]);
    setMoney(state.money);
    setReputation(state.reputation);
    setDay(state.day);
    setTotalVisitors(state.totalVisitors);
    setTotalLikes(state.totalLikes);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(loadState, 100);
    return () => clearInterval(interval);
  }, [gameState]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleBuyArt = (artwork: Artwork) => {
    if (money < artwork.purchasePrice) {
      showNotification('资金不足!');
      return;
    }
    if (engine.buyArtwork(artwork.id)) {
      showNotification(`成功购买: ${artwork.title}`);
      loadState();
    }
  };

  const handleDisplayArt = (artworkId: number) => {
    if (engine.displayArtwork(artworkId)) {
      showNotification('艺术品已展出!');
      loadState();
    } else {
      showNotification('展位已满!');
    }
  };

  const handleRemoveDisplay = (artworkId: number) => {
    engine.removeFromDisplay(artworkId);
    loadState();
  };

  const handleSimulateDay = () => {
    engine.simulateDay();
    loadState();
    showNotification('新的一天开始了!');
  };

  const handleAppraise = (artworkId: number) => {
    const result = engine.appraiseArtwork(artworkId);
    showNotification(`估值: $${result.newValue} - ${result.rating}`);
    loadState();
  };

  const handleSellToCollector = (artworkId: number, customerId: number) => {
    if (engine.sellToCollector(artworkId, customerId)) {
      showNotification('艺术品售出!');
      loadState();
    }
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🖼️
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonPurple,
        textShadow: `0 0 30px ${NEON_COLORS.neonPurple}, 0 0 60px ${NEON_COLORS.neonPurple}`
      }}>
        ArtGallery
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.gold }}>
        画廊经营
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonPurple}, ${NEON_COLORS.gold})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始经营
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
        <p className="text-sm">在艺术市场购买艺术品</p>
        <p className="text-sm">展示作品吸引访客,提升声望</p>
      </div>
    </motion.div>
  );

  const renderArtworkCard = (artwork: Artwork, showPrice: boolean = true, isOwned: boolean = false) => (
    <motion.div
      key={artwork.id}
      className="p-4 rounded-xl"
      style={{
        background: NEON_COLORS.surface,
        border: `2px solid ${RARITY_COLORS[artwork.rarity]}40`,
      }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-4xl">{artwork.emoji}</div>
        <div
          className="px-2 py-1 rounded text-xs font-bold"
          style={{
            background: RARITY_COLORS[artwork.rarity],
            color: '#fff',
          }}
        >
          {artwork.rarity === 'legendary' ? '传说' :
           artwork.rarity === 'epic' ? '史诗' :
           artwork.rarity === 'rare' ? '稀有' : '普通'}
        </div>
      </div>
      <div className="font-bold mb-1">{artwork.title}</div>
      <div className="text-sm opacity-60 mb-2">{artwork.artist}</div>
      <div className="text-xs opacity-60 mb-2">
        {artwork.type} · {artwork.style}
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm">价值:</span>
        <span className="font-bold" style={{ color: NEON_COLORS.gold }}>
          ${artwork.value.toLocaleString()}
        </span>
      </div>
      {showPrice && artwork.purchasePrice > 0 && (
        <div className="text-sm mb-2">
          售价: <span style={{ color: NEON_COLORS.gold }}>${artwork.purchasePrice}</span>
        </div>
      )}
      {isOwned && (
        <div className="text-xs opacity-60 mb-2">
          访客: {artwork.visitors} | 点赞: {artwork.liked ? '♥' : '-'}
        </div>
      )}
      <div className="flex gap-2">
        {showPrice && (
          <motion.button
            onClick={() => handleBuyArt(artwork)}
            disabled={money < artwork.purchasePrice}
            className="flex-1 py-2 rounded text-sm font-bold"
            style={{
              background: money >= artwork.purchasePrice ? NEON_COLORS.neonPurple : NEON_COLORS.surface,
              color: money >= artwork.purchasePrice ? '#fff' : NEON_COLORS.textDim,
              opacity: money >= artwork.purchasePrice ? 1 : 0.5,
            }}
            whileHover={money >= artwork.purchasePrice ? { scale: 1.02 } : {}}
          >
            购买
          </motion.button>
        )}
        {!showPrice && isOwned && !artwork.displayed && (
          <>
            <motion.button
              onClick={() => handleDisplayArt(artwork.id)}
              disabled={displayedArt.length >= 5}
              className="flex-1 py-2 rounded text-sm font-bold"
              style={{
                background: displayedArt.length >= 5 ? NEON_COLORS.surface : NEON_COLORS.neonGreen,
                color: displayedArt.length >= 5 ? NEON_COLORS.textDim : '#000',
                opacity: displayedArt.length >= 5 ? 0.5 : 1,
              }}
              whileHover={displayedArt.length < 5 ? { scale: 1.02 } : {}}
            >
              展出
            </motion.button>
            <motion.button
              onClick={() => handleAppraise(artwork.id)}
              className="flex-1 py-2 rounded text-sm font-bold"
              style={{
                background: NEON_COLORS.gold,
                color: '#000',
              }}
              whileHover={{ scale: 1.02 }}
            >
              估值 $100
            </motion.button>
          </>
        )}
        {artwork.displayed && (
          <motion.button
            onClick={() => handleRemoveDisplay(artwork.id)}
            className="flex-1 py-2 rounded text-sm font-bold"
            style={{
              background: NEON_COLORS.danger,
              color: '#fff',
            }}
            whileHover={{ scale: 1.02 }}
          >
            下架
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 700 }}>
      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed top-20 z-50 px-6 py-3 rounded-xl font-bold"
            style={{
              background: NEON_COLORS.neonPurple,
              color: '#fff',
              boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}`,
            }}
            initial={{ scale: 0, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs opacity-70">资金</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>${money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">声望</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{reputation}%</div>
            </div>
            <div>
              <div className="text-xs opacity-70">第 {day} 天</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.primary }}>展厅: {displayedArt.length}/5</div>
            </div>
          </div>
          <motion.button
            onClick={handleSimulateDay}
            className="px-6 py-3 rounded-xl font-bold"
            style={{
              background: NEON_COLORS.neonPurple,
              border: `2px solid ${NEON_COLORS.neonPurple}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⏭️ 模拟一天
          </motion.button>
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <span>👁️ 总访客: {totalVisitors}</span>
          <span style={{ color: NEON_COLORS.danger }}>♥ 总点赞: {totalLikes}</span>
        </div>
      </div>

      <div className="w-full glass-card rounded-xl overflow-hidden">
        <div className="flex border-b" style={{ borderColor: `${NEON_COLORS.neonPurple}30` }}>
          {[
            { key: 'market', label: '🎨 艺术市场' },
            { key: 'gallery', label: '🏛️ 画廊展厅' },
            { key: 'owned', label: '📦 收藏库' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className="flex-1 py-3 text-sm font-bold"
              style={{
                background: selectedTab === tab.key ? `${NEON_COLORS.neonPurple}20` : 'transparent',
                color: selectedTab === tab.key ? NEON_COLORS.neonPurple : NEON_COLORS.textDim,
                borderBottom: selectedTab === tab.key ? `2px solid ${NEON_COLORS.neonPurple}` : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {selectedTab === 'market' && (
            <div className="grid grid-cols-2 gap-4">
              {marketArt.map(art => renderArtworkCard(art, true, false))}
            </div>
          )}

          {selectedTab === 'gallery' && (
            <div>
              {displayedArt.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  <div className="text-4xl mb-4">🏛️</div>
                  <p>画廊空空如也</p>
                  <p className="text-sm">去收藏库展出艺术品吧</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {displayedArt.map(art => renderArtworkCard(art, false, true))}
                </div>
              )}

              {customers.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-bold mb-3">👤 潜在买家</div>
                  {customers.map(customer => (
                    <div
                      key={customer.id}
                      className="p-3 rounded-lg mb-2"
                      style={{ background: `${NEON_COLORS.gold}20` }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{customer.name}</div>
                          <div className="text-xs opacity-60">
                            预算: ${Math.floor(customer.budget).toLocaleString()} | 偏好: {customer.preference}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {customer.interestedArt.map(art => (
                          <motion.button
                            key={art.id}
                            onClick={() => handleSellToCollector(art.id, customer.id)}
                            className="px-3 py-1 rounded text-sm"
                            style={{
                              background: NEON_COLORS.gold,
                              color: '#000',
                            }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {art.emoji} ${Math.floor(art.value * (1 + reputation / 100)).toLocaleString()}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'owned' && (
            <div>
              {ownedArt.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  <div className="text-4xl mb-4">📦</div>
                  <p>还没有收藏品</p>
                  <p className="text-sm">去艺术市场购买吧</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {ownedArt.map(art => renderArtworkCard(art, false, true))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="text-center text-sm opacity-60">
          <p>提示: 高稀有度艺术品更受欢迎</p>
          <p>提升声望可卖出更高价格</p>
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
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a0a2a 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}dd;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonPurple}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
    </div>
  );
}
