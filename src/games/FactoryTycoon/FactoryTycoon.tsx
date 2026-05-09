import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFactoryEngine, formatNumber, calculateUpgradeCost, Resource, ProductionLine, Worker, Research, Achievement } from './engine';

// NEON 配色方案
const NEON_COLORS = {
  primary: '#ff6b35',
  secondary: '#f7931e',
  success: '#00d084',
  warning: '#ffaa00',
  danger: '#ff3366',
  info: '#00d4ff',
  background: '#1a1a2e',
  surface: 'rgba(30, 30, 50, 0.9)',
  surfaceHover: 'rgba(40, 40, 70, 0.95)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 107, 53, 0.3)',
  glow: 'rgba(255, 107, 53, 0.4)',
};

// 资源卡片组件
interface ResourceCardProps {
  resource: Resource;
  price: number;
  priceMultiplier: number;
  onSell: () => void;
  onSellAll: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, price, priceMultiplier, onSell, onSellAll }) => {
  const storageMult = 1; // 简化处理
  const maxAmount = resource.maxAmount * storageMult;
  const percentage = (resource.amount / maxAmount) * 100;
  const sellPrice = Math.floor(price * priceMultiplier);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: NEON_COLORS.surface,
        border: `1px solid ${NEON_COLORS.border}`,
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 存储进度条 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '4px',
        width: `${percentage}%`,
        background: percentage > 90 ? NEON_COLORS.danger : NEON_COLORS.success,
        transition: 'width 0.3s',
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '36px' }}>{resource.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: NEON_COLORS.text }}>{resource.name}</div>
          <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>
            售价: ${formatNumber(sellPrice)}/个
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: resource.color }}>
            {formatNumber(resource.amount)}
          </div>
          <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
            / {formatNumber(maxAmount)}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSell}
          disabled={resource.amount < 1}
          style={{
            flex: 1,
            padding: '8px',
            background: resource.amount >= 1 ? 'rgba(0, 208, 132, 0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${resource.amount >= 1 ? NEON_COLORS.success : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: resource.amount >= 1 ? NEON_COLORS.success : NEON_COLORS.textMuted,
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: resource.amount >= 1 ? 'pointer' : 'not-allowed',
          }}
        >
          出售 1
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSellAll}
          disabled={resource.amount < 1}
          style={{
            flex: 1,
            padding: '8px',
            background: resource.amount >= 1 ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${resource.amount >= 1 ? NEON_COLORS.primary : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: resource.amount >= 1 ? NEON_COLORS.primary : NEON_COLORS.textMuted,
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: resource.amount >= 1 ? 'pointer' : 'not-allowed',
          }}
        >
          出售全部
        </motion.button>
      </div>
    </motion.div>
  );
};

// 生产线组件
interface ProductionLineCardProps {
  line: ProductionLine;
  resources: Resource[];
  money: number;
  speedMultiplier: number;
  onUpgrade: () => void;
}

const ProductionLineCard: React.FC<ProductionLineCardProps> = ({ line, resources, money, speedMultiplier, onUpgrade }) => {
  const cost = calculateUpgradeCost(line.baseCost, line.level, line.costMultiplier);
  const canAfford = money >= cost && line.level < line.maxLevel;
  const progress = (line.currentProgress / line.productionTime) * 100;
  
  // 获取输入资源信息
  const inputInfo = line.inputResources.map(input => {
    const resource = resources.find(r => r.id === input.resourceId);
    return {
      ...input,
      hasEnough: (resource?.amount || 0) >= input.amount,
      current: resource?.amount || 0,
    };
  });
  
  const outputResource = resources.find(r => r.id === line.outputResource.resourceId);
  const canProduce = line.level > 0 && inputInfo.every(i => i.hasEnough) && 
    (outputResource ? outputResource.amount < outputResource.maxAmount : false);
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      style={{
        background: line.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${line.level > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '16px',
        opacity: line.level > 0 ? 1 : 0.7,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '40px' }}>{line.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: NEON_COLORS.text, fontSize: '16px' }}>
            {line.name}
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              color: line.level >= line.maxLevel ? NEON_COLORS.success : NEON_COLORS.warning,
            }}>
              Lv.{line.level}/{line.maxLevel}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>
            {line.description}
          </div>
        </div>
        {line.level > 0 && (
          <motion.button
            whileHover={{ scale: canAfford ? 1.05 : 1 }}
            whileTap={{ scale: canAfford ? 0.95 : 1 }}
            onClick={onUpgrade}
            disabled={!canAfford}
            style={{
              padding: '8px 16px',
              background: canAfford ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${canAfford ? NEON_COLORS.primary : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              color: canAfford ? NEON_COLORS.primary : NEON_COLORS.textMuted,
              fontWeight: 'bold',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              fontSize: '12px',
            }}
          >
            升级<br/>${formatNumber(cost)}
          </motion.button>
        )}
        {line.level === 0 && (
          <motion.button
            whileHover={{ scale: canAfford ? 1.05 : 1 }}
            whileTap={{ scale: canAfford ? 0.95 : 1 }}
            onClick={onUpgrade}
            disabled={!canAfford}
            style={{
              padding: '8px 16px',
              background: canAfford ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${canAfford ? NEON_COLORS.info : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              color: canAfford ? NEON_COLORS.info : NEON_COLORS.textMuted,
              fontWeight: 'bold',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              fontSize: '12px',
            }}
          >
            解锁<br/>${formatNumber(cost)}
          </motion.button>
        )}
      </div>
      
      {line.level > 0 && (
        <>
          {/* 输入资源 */}
          {inputInfo.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '12px',
              flexWrap: 'wrap',
            }}>
              {inputInfo.map((input, idx) => (
                <div key={idx} style={{
                  padding: '4px 8px',
                  background: input.hasEnough ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                  border: `1px solid ${input.hasEnough ? NEON_COLORS.success : NEON_COLORS.danger}`,
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: input.hasEnough ? NEON_COLORS.success : NEON_COLORS.danger,
                }}>
                  需要: {input.amount} ({formatNumber(input.current)})
                </div>
              ))}
            </div>
          )}
          
          {/* 生产进度 */}
          <div style={{
            height: '8px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <motion.div
              style={{
                height: '100%',
                background: canProduce ? NEON_COLORS.success : NEON_COLORS.warning,
                borderRadius: '4px',
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '11px',
            color: NEON_COLORS.textMuted,
          }}>
            <span>{line.isProducing ? '生产中...' : '等待资源'}</span>
            <span>产出: {line.outputResource.amount * line.level}/次</span>
          </div>
        </>
      )}
    </motion.div>
  );
};

// 工人卡片组件
interface WorkerCardProps {
  worker: Worker;
  money: number;
  onHire: () => void;
}

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, money, onHire }) => {
  const cost = calculateUpgradeCost(worker.cost, worker.count, worker.costMultiplier);
  const canAfford = money >= cost;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: worker.count > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${worker.count > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '36px' }}>{worker.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', color: NEON_COLORS.text }}>
          {worker.name}
          <span style={{ 
            marginLeft: '8px',
            padding: '2px 8px',
            background: 'rgba(255, 107, 53, 0.2)',
            borderRadius: '10px',
            fontSize: '12px',
            color: NEON_COLORS.primary,
          }}>
            x{worker.count}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted, marginTop: '2px' }}>
          {worker.description}
        </div>
        <div style={{ fontSize: '11px', color: NEON_COLORS.success, marginTop: '4px' }}>
          效率: {((Math.pow(worker.efficiency, worker.count) - 1) * 100).toFixed(0)}% 加成
        </div>
      </div>
      <motion.button
        whileHover={{ scale: canAfford ? 1.05 : 1 }}
        whileTap={{ scale: canAfford ? 0.95 : 1 }}
        onClick={onHire}
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
        雇佣<br/>${formatNumber(cost)}
      </motion.button>
    </motion.div>
  );
};

// 研究卡片组件
interface ResearchCardProps {
  research: Research;
  money: number;
  onUnlock: () => void;
}

const ResearchCard: React.FC<ResearchCardProps> = ({ research, money, onUnlock }) => {
  const canAfford = money >= research.cost && !research.unlocked;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: research.unlocked 
          ? 'rgba(0, 208, 132, 0.15)' 
          : canAfford 
            ? NEON_COLORS.surface 
            : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${research.unlocked 
          ? NEON_COLORS.success 
          : canAfford 
            ? NEON_COLORS.border 
            : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: research.unlocked ? 1 : 0.8,
      }}
    >
      <span style={{ fontSize: '32px' }}>
        {research.unlocked ? '✅' : research.icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: research.unlocked ? NEON_COLORS.success : NEON_COLORS.text,
        }}>
          {research.name}
        </div>
        <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted, marginTop: '2px' }}>
          {research.description}
        </div>
      </div>
      {!research.unlocked && (
        <motion.button
          whileHover={{ scale: canAfford ? 1.05 : 1 }}
          whileTap={{ scale: canAfford ? 0.95 : 1 }}
          onClick={onUnlock}
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
          研究<br/>${formatNumber(research.cost)}
        </motion.button>
      )}
    </motion.div>
  );
};

// 主游戏组件
const FactoryTycoon: React.FC = () => {
  const { 
    state, 
    gatherResource, 
    upgradeLine, 
    hireWorker, 
    unlockResearch, 
    sellResource,
    resetGame,
    getSpeedMultiplier,
    getPriceMultiplier,
    RESOURCE_PRICES,
  } = useFactoryEngine();
  
  const [activeTab, setActiveTab] = useState<'resources' | 'lines' | 'workers' | 'research'>('resources');
  
  const speedMultiplier = getSpeedMultiplier();
  const priceMultiplier = getPriceMultiplier();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #16213e 50%, #0f0f23 100%)`,
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: NEON_COLORS.text,
    }}>
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
            borderRadius: '16px',
            padding: '20px',
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
                资金
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                ${formatNumber(state.money)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                总收益
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.primary }}>
                ${formatNumber(state.totalMoney)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                生产速度
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.info }}>
                x{speedMultiplier.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                售价加成
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                x{priceMultiplier.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
                总生产次数
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.secondary }}>
                {formatNumber(state.totalProductions)}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '20px',
        }}>
          {/* 左侧：主要内容 */}
          <div>
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
                { id: 'resources', label: '资源', icon: '📦' },
                { id: 'lines', label: '生产线', icon: '🏭' },
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
              minHeight: '400px',
            }}>
              {activeTab === 'resources' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* 手动采集按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={gatherResource}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: 'rgba(255, 107, 53, 0.2)',
                      border: `2px solid ${NEON_COLORS.primary}`,
                      borderRadius: '12px',
                      color: NEON_COLORS.primary,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginBottom: '8px',
                    }}
                  >
                    ⛏️ 手动采集原材料
                  </motion.button>
                  
                  {state.resources.map(resource => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      price={RESOURCE_PRICES[resource.id] || 0}
                      priceMultiplier={priceMultiplier}
                      onSell={() => sellResource(resource.id, 1)}
                      onSellAll={() => sellResource(resource.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'lines' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {state.productionLines.map(line => (
                    <ProductionLineCard
                      key={line.id}
                      line={line}
                      resources={state.resources}
                      money={state.money}
                      speedMultiplier={speedMultiplier}
                      onUpgrade={() => upgradeLine(line.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：工人和研究 */}
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
                { id: 'workers', label: '工人', icon: '👷' },
                { id: 'research', label: '研究', icon: '🔬' },
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
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
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
              {activeTab === 'workers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.workers.map(worker => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      money={state.money}
                      onHire={() => hireWorker(worker.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'research' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.researches.map(research => (
                    <ResearchCard
                      key={research.id}
                      research={research}
                      money={state.money}
                      onUnlock={() => unlockResearch(research.id)}
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

export default FactoryTycoon;
