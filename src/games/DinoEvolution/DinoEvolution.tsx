import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDinoEngine, formatNumber, calculateStageCost, calculateEvolutionCost, DinoStage, Evolution, Era, Achievement } from './engine';

// NEON 配色方案 - 丛林/史前主题
const NEON_COLORS = {
  primary: '#00ff88',
  secondary: '#ff6b35',
  success: '#00d084',
  warning: '#ffaa00',
  danger: '#ff3366',
  info: '#00d4ff',
  background: '#0d1f0d',
  surface: 'rgba(20, 40, 20, 0.9)',
  surfaceHover: 'rgba(30, 60, 30, 0.95)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(0, 255, 136, 0.3)',
  glow: 'rgba(0, 255, 136, 0.4)',
};

// 浮动DNA组件
interface FloatingDNAProps {
  x: number;
  y: number;
  value: string;
}

const FloatingDNA: React.FC<FloatingDNAProps> = ({ x, y, value }) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.3 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        color: NEON_COLORS.primary,
        fontSize: '22px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        textShadow: `0 0 15px ${NEON_COLORS.primary}`,
        zIndex: 1000,
      }}
    >
      +{value} 🧬
    </motion.div>
  );
};

// 恐龙阶段卡片
interface StageCardProps {
  stage: DinoStage;
  dna: number;
  onBuy: () => void;
  onUnlock: () => void;
}

const StageCard: React.FC<StageCardProps> = ({ stage, dna, onBuy, onUnlock }) => {
  if (!stage.unlocked) {
    const canUnlock = dna >= stage.unlockCost;
    return (
      <motion.div
        whileHover={{ scale: canUnlock ? 1.02 : 1 }}
        style={{
          background: 'rgba(40, 40, 40, 0.6)',
          border: `2px dashed ${canUnlock ? NEON_COLORS.info : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          opacity: canUnlock ? 1 : 0.6,
        }}
      >
        <div style={{ fontSize: '48px', filter: 'grayscale(100%)', marginBottom: '8px' }}>
          🔒
        </div>
        <div style={{ fontWeight: 'bold', color: NEON_COLORS.text, marginBottom: '4px' }}>
          解锁 {stage.name}
        </div>
        <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '12px' }}>
          {stage.description}
        </div>
        <motion.button
          whileHover={{ scale: canUnlock ? 1.05 : 1 }}
          whileTap={{ scale: canUnlock ? 0.95 : 1 }}
          onClick={onUnlock}
          disabled={!canUnlock}
          style={{
            padding: '10px 20px',
            background: canUnlock ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${canUnlock ? NEON_COLORS.info : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '10px',
            color: canUnlock ? NEON_COLORS.info : NEON_COLORS.textMuted,
            fontWeight: 'bold',
            cursor: canUnlock ? 'pointer' : 'not-allowed',
          }}
        >
          解锁 {formatNumber(stage.unlockCost)} 🧬
        </motion.button>
      </motion.div>
    );
  }

  const cost = calculateStageCost(stage);
  const canAfford = dna >= cost;
  const isMaxed = stage.count >= stage.maxCount;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: NEON_COLORS.surface,
        border: `2px solid ${isMaxed ? NEON_COLORS.success : NEON_COLORS.border}`,
        borderRadius: '16px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 进度条背景 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '4px',
        width: `${(stage.count / stage.maxCount) * 100}%`,
        background: stage.color,
        transition: 'width 0.3s',
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: '48px',
            filter: `drop-shadow(0 0 10px ${stage.color})`,
          }}
        >
          {stage.icon}
        </motion.div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: stage.color, fontSize: '16px' }}>
            {stage.name}
          </div>
          <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
            {stage.description}
          </div>
          <div style={{ fontSize: '12px', color: NEON_COLORS.success, marginTop: '4px' }}>
            +{formatNumber(stage.dnaPerSecond)} DNA/秒
          </div>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '8px 14px',
          borderRadius: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.text }}>
            {stage.count}
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>
            / {stage.maxCount}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: canAfford && !isMaxed ? 1.02 : 1 }}
        whileTap={{ scale: canAfford && !isMaxed ? 0.98 : 1 }}
        onClick={onBuy}
        disabled={!canAfford || isMaxed}
        style={{
          width: '100%',
          padding: '12px',
          background: isMaxed 
            ? 'rgba(0, 208, 132, 0.2)' 
            : canAfford 
              ? 'rgba(0, 255, 136, 0.2)' 
              : 'rgba(255,255,255,0.1)',
          border: `1px solid ${isMaxed 
            ? NEON_COLORS.success 
            : canAfford 
              ? NEON_COLORS.primary 
              : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '10px',
          color: isMaxed 
            ? NEON_COLORS.success 
            : canAfford 
              ? NEON_COLORS.primary 
              : NEON_COLORS.textMuted,
          fontWeight: 'bold',
          cursor: canAfford && !isMaxed ? 'pointer' : 'not-allowed',
        }}
      >
        {isMaxed ? '已达上限' : `购买 (${formatNumber(cost)} 🧬)`}
      </motion.button>
    </motion.div>
  );
};

// 进化卡片
interface EvolutionCardProps {
  evolution: Evolution;
  dna: number;
  onBuy: () => void;
}

const EvolutionCard: React.FC<EvolutionCardProps> = ({ evolution, dna, onBuy }) => {
  const cost = calculateEvolutionCost(evolution);
  const canAfford = dna >= cost && evolution.owned < evolution.maxOwned;
  const isMaxed = evolution.owned >= evolution.maxOwned;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: isMaxed 
          ? 'rgba(0, 208, 132, 0.15)' 
          : evolution.owned > 0 
            ? NEON_COLORS.surface 
            : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${isMaxed 
          ? NEON_COLORS.success 
          : evolution.owned > 0 
            ? NEON_COLORS.border 
            : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: isMaxed ? 1 : evolution.owned > 0 ? 1 : 0.8,
      }}
    >
      <span style={{ fontSize: '32px' }}>{evolution.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: isMaxed ? NEON_COLORS.success : NEON_COLORS.text,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {evolution.name}
          <span style={{
            padding: '2px 8px',
            background: isMaxed ? 'rgba(0, 208, 132, 0.3)' : 'rgba(255, 107, 53, 0.3)',
            borderRadius: '10px',
            fontSize: '11px',
          }}>
            {evolution.owned}/{evolution.maxOwned}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted, marginTop: '2px' }}>
          {evolution.description}
        </div>
        <div style={{ fontSize: '11px', color: NEON_COLORS.warning, marginTop: '4px' }}>
          当前倍率: x{Math.pow(evolution.multiplier, evolution.owned).toFixed(2)}
        </div>
      </div>
      {!isMaxed && (
        <motion.button
          whileHover={{ scale: canAfford ? 1.05 : 1 }}
          whileTap={{ scale: canAfford ? 0.95 : 1 }}
          onClick={onBuy}
          disabled={!canAfford}
          style={{
            padding: '8px 14px',
            background: canAfford ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${canAfford ? NEON_COLORS.info : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: canAfford ? NEON_COLORS.info : NEON_COLORS.textMuted,
            fontWeight: 'bold',
            cursor: canAfford ? 'pointer' : 'not-allowed',
            fontSize: '12px',
          }}
        >
          {formatNumber(cost)} 🧬
        </motion.button>
      )}
    </motion.div>
  );
};

// 时代卡片
interface EraCardProps {
  era: Era;
  isActive: boolean;
}

const EraCard: React.FC<EraCardProps> = ({ era, isActive }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: era.unlocked 
          ? isActive 
            ? 'rgba(0, 255, 136, 0.2)' 
            : 'rgba(0, 208, 132, 0.1)' 
          : 'rgba(40, 40, 40, 0.6)',
        border: `2px solid ${era.unlocked 
          ? isActive 
            ? NEON_COLORS.primary 
            : NEON_COLORS.success 
          : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: era.unlocked ? 1 : 0.5,
      }}
    >
      <span style={{ fontSize: '36px' }}>
        {era.unlocked ? era.icon : '🔒'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: era.unlocked ? NEON_COLORS.success : NEON_COLORS.textMuted,
        }}>
          {era.name}
          {isActive && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              background: NEON_COLORS.primary,
              color: '#000',
              borderRadius: '10px',
              fontSize: '10px',
            }}>
              当前
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
          {era.description}
        </div>
        {era.unlocked && (
          <div style={{ fontSize: '12px', color: NEON_COLORS.warning, marginTop: '4px' }}>
            DNA产出 x{era.dnaMultiplier}
          </div>
        )}
      </div>
      {!era.unlocked && (
        <div style={{
          fontSize: '11px',
          color: NEON_COLORS.textMuted,
          textAlign: 'right',
        }}>
          需要<br/>{formatNumber(era.requirement)} DNA
        </div>
      )}
    </motion.div>
  );
};

// 成就卡片
interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: achievement.unlocked 
          ? 'rgba(0, 208, 132, 0.15)' 
          : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${achievement.unlocked ? NEON_COLORS.success : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        opacity: achievement.unlocked ? 1 : 0.5,
      }}
    >
      <span style={{ fontSize: '24px' }}>
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
        <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
          {achievement.description}
        </div>
      </div>
      {achievement.unlocked && (
        <span style={{ color: NEON_COLORS.success, fontSize: '12px', fontWeight: 'bold' }}>
          +{formatNumber(achievement.reward)} 🧬
        </span>
      )}
    </motion.div>
  );
};

// 主游戏组件
const DinoEvolution: React.FC = () => {
  const { 
    state, 
    handleClick, 
    buyStage, 
    unlockStage, 
    buyEvolution,
    resetGame,
    getDnaPerSecond,
    getDnaMultiplier,
  } = useDinoEngine();
  
  const [floatingDNAs, setFloatingDNAs] = useState<Array<{ id: number; x: number; y: number; value: string }>>([]);
  const [activeTab, setActiveTab] = useState<'stages' | 'evolution' | 'eras' | 'achievements'>('stages');
  
  const dnaPerSecond = getDnaPerSecond();
  const dnaMultiplier = getDnaMultiplier();
  
  // 获取当前时代
  const currentEra = [...state.eras].reverse().find(e => e.unlocked) || state.eras[0];
  
  // 处理点击
  const onClickDino = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    const clickValue = state.clickValue * (state.evolutions.find(ev => ev.id === 'genetics')?.owned || 0 > 0 
      ? Math.pow(2, state.evolutions.find(ev => ev.id === 'genetics')?.owned || 0) 
      : 1);
    
    const newDNA = {
      id: Date.now() + Math.random(),
      x,
      y,
      value: formatNumber(clickValue),
    };
    
    setFloatingDNAs(prev => [...prev, newDNA]);
    handleClick();
    
    setTimeout(() => {
      setFloatingDNAs(prev => prev.filter(d => d.id !== newDNA.id));
    }, 1000);
  }, [handleClick, state.clickValue, state.evolutions]);

  // 解锁的成就数量
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a3a1a 50%, #0d1f0d 100%)`,
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: NEON_COLORS.text,
      overflow: 'hidden',
    }}>
      {/* 浮动DNA */}
      <AnimatePresence>
        {floatingDNAs.map(dna => (
          <FloatingDNA
            key={dna.id}
            x={dna.x}
            y={dna.y}
            value={dna.value}
          />
        ))}
      </AnimatePresence>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* 顶部统计栏 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: NEON_COLORS.surface,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${NEON_COLORS.border}`,
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: `0 0 30px ${NEON_COLORS.glow}`,
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                DNA
              </div>
              <motion.div
                key={state.dna}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: NEON_COLORS.primary,
                  textShadow: `0 0 20px ${NEON_COLORS.primary}`,
                }}
              >
                {formatNumber(state.dna)} 🧬
              </motion.div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                DNA/秒
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                +{formatNumber(dnaPerSecond)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                总DNA
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.secondary }}>
                {formatNumber(state.totalDna)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                倍率
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                x{dnaMultiplier.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                当前时代
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.info }}>
                {currentEra.icon} {currentEra.name}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '20px',
        }}>
          {/* 左侧：恐龙点击区 */}
          <div>
            {/* 点击区域 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onClickDino}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: `radial-gradient(circle at center, rgba(0, 255, 136, 0.1) 0%, transparent 70%)`,
                border: `3px solid ${NEON_COLORS.border}`,
                borderRadius: '24px',
                height: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '20px',
              }}
            >
              {/* 发光效果 */}
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 30px ${NEON_COLORS.primary}40`,
                    `0 0 80px ${NEON_COLORS.primary}60`,
                    `0 0 30px ${NEON_COLORS.primary}40`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${NEON_COLORS.primary}20 0%, transparent 70%)`,
                }}
              />
              
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  fontSize: '150px',
                  filter: `drop-shadow(0 0 40px ${NEON_COLORS.primary})`,
                  zIndex: 1,
                }}
              >
                🦖
              </motion.div>
              
              <div style={{
                marginTop: '20px',
                fontSize: '18px',
                color: NEON_COLORS.textMuted,
                zIndex: 1,
              }}>
                点击获取 DNA！
              </div>
            </motion.div>

            {/* 标签页切换 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              background: NEON_COLORS.surface,
              padding: '4px',
              borderRadius: '12px',
              border: `1px solid ${NEON_COLORS.border}`,
            }}>
              {[
                { id: 'stages', label: '恐龙', icon: '🦕' },
                { id: 'evolution', label: '进化', icon: '🧬' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? NEON_COLORS.primary : 'transparent',
                    color: activeTab === tab.id ? '#000' : NEON_COLORS.text,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 内容区域 */}
            <div style={{
              background: NEON_COLORS.surface,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${NEON_COLORS.border}`,
              borderRadius: '16px',
              padding: '20px',
              maxHeight: '400px',
              overflow: 'auto',
            }}>
              {activeTab === 'stages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {state.stages.map(stage => (
                    <StageCard
                      key={stage.id}
                      stage={stage}
                      dna={state.dna}
                      onBuy={() => buyStage(stage.id)}
                      onUnlock={() => unlockStage(stage.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'evolution' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.evolutions.map(evolution => (
                    <EvolutionCard
                      key={evolution.id}
                      evolution={evolution}
                      dna={state.dna}
                      onBuy={() => buyEvolution(evolution.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：时代和成就 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
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
              {[
                { id: 'eras', label: '时代', icon: '🌍' },
                { id: 'achievements', label: '成就', icon: '🏆' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? NEON_COLORS.info : 'transparent',
                    color: activeTab === tab.id ? '#000' : NEON_COLORS.text,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    position: 'relative',
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'achievements' && unlockedAchievements > 0 && (
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
              ))}
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
              maxHeight: '500px',
            }}>
              {activeTab === 'eras' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.eras.map((era, index) => (
                    <EraCard
                      key={era.id}
                      era={era}
                      isActive={era.id === currentEra.id}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <AchievementCard
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
              }}
            >
              重置游戏
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DinoEvolution;
