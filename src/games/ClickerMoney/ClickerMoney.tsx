import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickerEngine, formatNumber, calculateUpgradeCost, Upgrade, Achievement } from './engine';

// NEON 配色方案
const NEON_COLORS = {
  primary: '#00f5ff',
  secondary: '#ff00ff',
  success: '#00ff88',
  warning: '#ffaa00',
  danger: '#ff3366',
  background: '#0a0a1a',
  surface: 'rgba(20, 20, 40, 0.8)',
  surfaceHover: 'rgba(30, 30, 60, 0.9)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(0, 245, 255, 0.3)',
  glow: 'rgba(0, 245, 255, 0.5)',
};

// 浮动文字组件
interface FloatingTextProps {
  x: number;
  y: number;
  value: string;
  color?: string;
}

const FloatingText: React.FC<FloatingTextProps> = ({ x, y, value, color = NEON_COLORS.success }) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -50, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        color,
        fontSize: '20px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        textShadow: `0 0 10px ${color}`,
        zIndex: 1000,
      }}
    >
      +{value}
    </motion.div>
  );
};

// 升级项组件
interface UpgradeItemProps {
  upgrade: Upgrade;
  money: number;
  onBuy: () => void;
}

const UpgradeItem: React.FC<UpgradeItemProps> = ({ upgrade, money, onBuy }) => {
  const cost = calculateUpgradeCost(upgrade);
  const canAfford = money >= cost;

  return (
    <motion.button
      whileHover={{ scale: canAfford ? 1.02 : 1 }}
      whileTap={{ scale: canAfford ? 0.98 : 1 }}
      onClick={onBuy}
      disabled={!canAfford}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: canAfford ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.8)',
        border: `1px solid ${canAfford ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        cursor: canAfford ? 'pointer' : 'not-allowed',
        opacity: canAfford ? 1 : 0.6,
        transition: 'all 0.2s',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: '32px' }}>{upgrade.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: canAfford ? NEON_COLORS.text : NEON_COLORS.textMuted,
          fontSize: '14px',
        }}>
          {upgrade.name}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: NEON_COLORS.textMuted,
          marginTop: '2px',
        }}>
          {upgrade.description}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: canAfford ? NEON_COLORS.success : NEON_COLORS.danger,
          marginTop: '4px',
          fontWeight: 'bold',
        }}>
          价格: ${formatNumber(cost)}
        </div>
      </div>
      <div style={{
        background: canAfford ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: canAfford ? NEON_COLORS.success : NEON_COLORS.textMuted,
        minWidth: '40px',
        textAlign: 'center',
      }}>
        {upgrade.owned}
      </div>
    </motion.button>
  );
};

// 成就项组件
interface AchievementItemProps {
  achievement: Achievement;
}

const AchievementItem: React.FC<AchievementItemProps> = ({ achievement }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: achievement.unlocked 
          ? 'rgba(0, 255, 136, 0.15)' 
          : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${achievement.unlocked ? NEON_COLORS.success : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '10px',
        opacity: achievement.unlocked ? 1 : 0.5,
      }}
    >
      <span style={{ fontSize: '20px' }}>
        {achievement.unlocked ? '🏆' : '🔒'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: achievement.unlocked ? NEON_COLORS.success : NEON_COLORS.textMuted,
          fontSize: '13px',
        }}>
          {achievement.name}
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: NEON_COLORS.textMuted,
        }}>
          {achievement.description}
        </div>
      </div>
      {achievement.unlocked && (
        <span style={{ 
          color: NEON_COLORS.success, 
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          +${formatNumber(achievement.reward)}
        </span>
      )}
    </motion.div>
  );
};

// 主游戏组件
const ClickerMoney: React.FC = () => {
  const { state, handleClick, buyUpgrade, resetGame } = useClickerEngine();
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number; x: number; y: number; value: string }>>([]);
  const [activeTab, setActiveTab] = useState<'upgrades' | 'achievements'>('upgrades');

  // 处理点击
  const onClickArea = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + rect.left;
    const y = e.clientY - rect.top + rect.top;
    
    const newText = {
      id: Date.now() + Math.random(),
      x,
      y,
      value: formatNumber(state.clickValue),
    };
    
    setFloatingTexts(prev => [...prev, newText]);
    handleClick();
    
    // 移除浮动文字
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
    }, 800);
  }, [handleClick, state.clickValue]);

  // 解锁的成就数量
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a0a2e 50%, #0a0a1a 100%)`,
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: NEON_COLORS.text,
      overflow: 'hidden',
    }}>
      {/* 浮动文字 */}
      <AnimatePresence>
        {floatingTexts.map(text => (
          <FloatingText
            key={text.id}
            x={text.x}
            y={text.y}
            value={text.value}
          />
        ))}
      </AnimatePresence>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '24px',
        height: 'calc(100vh - 40px)',
      }}>
        {/* 左侧：点击区域 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* 统计面板 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: NEON_COLORS.surface,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${NEON_COLORS.border}`,
              borderRadius: '20px',
              padding: '24px',
              boxShadow: `0 0 30px ${NEON_COLORS.glow}`,
            }}
          >
            <div style={{
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              <div style={{
                fontSize: '14px',
                color: NEON_COLORS.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '8px',
              }}>
                当前金钱
              </div>
              <motion.div
                key={state.money}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: NEON_COLORS.primary,
                  textShadow: `0 0 20px ${NEON_COLORS.primary}`,
                }}
              >
                ${formatNumber(state.money)}
              </motion.div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginTop: '20px',
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>每秒收入</div>
                <div style={{ fontSize: '18px', color: NEON_COLORS.success, fontWeight: 'bold' }}>
                  ${formatNumber(state.autoIncome)}/s
                </div>
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>点击价值</div>
                <div style={{ fontSize: '18px', color: NEON_COLORS.warning, fontWeight: 'bold' }}>
                  ${formatNumber(state.clickValue)}
                </div>
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>总点击数</div>
                <div style={{ fontSize: '18px', color: NEON_COLORS.secondary, fontWeight: 'bold' }}>
                  {formatNumber(state.totalClicks)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 点击区域 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClickArea}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: 1,
              background: `radial-gradient(circle at center, rgba(0, 245, 255, 0.1) 0%, transparent 70%)`,
              border: `2px solid ${NEON_COLORS.border}`,
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '300px',
            }}
          >
            {/* 发光效果 */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 20px ${NEON_COLORS.primary}40`,
                  `0 0 60px ${NEON_COLORS.primary}60`,
                  `0 0 20px ${NEON_COLORS.primary}40`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${NEON_COLORS.primary}30 0%, transparent 70%)`,
              }}
            />
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                fontSize: '120px',
                filter: `drop-shadow(0 0 30px ${NEON_COLORS.primary})`,
                zIndex: 1,
              }}
            >
              💰
            </motion.div>
            
            <div style={{
              marginTop: '20px',
              fontSize: '18px',
              color: NEON_COLORS.textMuted,
              zIndex: 1,
            }}>
              点击赚钱！
            </div>
          </motion.div>
        </div>

        {/* 右侧：升级和成就 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
        }}>
          {/* 标签页切换 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: NEON_COLORS.surface,
            padding: '4px',
            borderRadius: '12px',
            border: `1px solid ${NEON_COLORS.border}`,
          }}>
            <button
              onClick={() => setActiveTab('upgrades')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'upgrades' ? NEON_COLORS.primary : 'transparent',
                color: activeTab === 'upgrades' ? '#000' : NEON_COLORS.text,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              升级
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'achievements' ? NEON_COLORS.success : 'transparent',
                color: activeTab === 'achievements' ? '#000' : NEON_COLORS.text,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              成就
              {unlockedAchievements > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: NEON_COLORS.danger,
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}>
                  {unlockedAchievements}
                </span>
              )}
            </button>
          </div>

          {/* 内容区域 */}
          <div style={{
            flex: 1,
            background: NEON_COLORS.surface,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${NEON_COLORS.border}`,
            borderRadius: '16px',
            padding: '16px',
            overflow: 'auto',
          }}>
            {activeTab === 'upgrades' ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                {state.upgrades.map(upgrade => (
                  <UpgradeItem
                    key={upgrade.id}
                    upgrade={upgrade}
                    money={state.money}
                    onBuy={() => buyUpgrade(upgrade.id)}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '10px',
                  marginBottom: '8px',
                }}>
                  <span style={{ color: NEON_COLORS.textMuted }}>已解锁: </span>
                  <span style={{ color: NEON_COLORS.success, fontWeight: 'bold' }}>
                    {unlockedAchievements}
                  </span>
                  <span style={{ color: NEON_COLORS.textMuted }}> / {state.achievements.length}</span>
                </div>
                {state.achievements.map(achievement => (
                  <AchievementItem
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 重置按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetGame}
            style={{
              padding: '12px',
              background: 'rgba(255, 51, 102, 0.2)',
              border: `1px solid ${NEON_COLORS.danger}`,
              borderRadius: '10px',
              color: NEON_COLORS.danger,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            重置游戏
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ClickerMoney;
