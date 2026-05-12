import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMinerEngine, formatNumber, calculateMinerCost, calculateUpgradeCost, Ore, Miner, DrillUpgrade } from './engine';

const NEON_COLORS = {
  primary: '#795548',
  secondary: '#8D6E63',
  success: '#FFD700',
  warning: '#FF9800',
  danger: '#F44336',
  info: '#607D8B',
  background: '#1a1515',
  surface: 'rgba(50, 30, 30, 0.9)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(121, 85, 72, 0.4)',
  glow: 'rgba(121, 85, 72, 0.5)',
};

interface OreDisplayProps {
  ore: Ore;
  depth: number;
  luck: number;
}

const OreDisplay: React.FC<OreDisplayProps> = ({ ore, depth, luck }) => {
  const isAvailable = ore.depth <= depth;
  const depthBonus = 1 + depth * 0.02;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isAvailable ? 1 : 0.4, scale: isAvailable ? 1 : 0.95 }}
      style={{
        background: isAvailable ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `2px solid ${isAvailable ? ore.color : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '12px',
        textAlign: 'center',
        opacity: isAvailable ? 1 : 0.4,
        position: 'relative',
      }}
    >
      {!isAvailable && (
        <div style={{
          position: 'absolute', top: '4px', right: '8px', fontSize: '10px',
          color: NEON_COLORS.danger, fontWeight: 'bold',
        }}>
          🔒 深度 {ore.depth}
        </div>
      )}
      <div style={{ fontSize: '32px', marginBottom: '6px', color: ore.color }}>{ore.icon}</div>
      <div style={{ fontWeight: 'bold', color: ore.color, fontSize: '14px' }}>{ore.name}</div>
      <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{ore.description}</div>
      <div style={{ fontSize: '11px', color: NEON_COLORS.success, marginTop: '4px' }}>
        价值: {formatNumber(Math.floor(ore.baseValue * depthBonus))} 💰
      </div>
    </motion.div>
  );
};

interface MinerCardProps {
  miner: Miner;
  gold: number;
  onUpgrade: () => void;
}

const MinerCard: React.FC<MinerCardProps> = ({ miner, gold, onUpgrade }) => {
  const cost = calculateMinerCost(miner);
  const canAfford = gold >= cost;
  const isMaxed = miner.level >= miner.maxLevel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: miner.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${miner.level > 0 ? miner.color : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '28px' }}>{miner.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: miner.color }}>
            {miner.name}
            <span style={{ marginLeft: '6px', fontSize: '11px', color: isMaxed ? NEON_COLORS.success : NEON_COLORS.warning }}>
              Lv.{miner.level}/{miner.maxLevel}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{miner.description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
        <span style={{ color: NEON_COLORS.info }}>采矿力: {miner.miningPower * miner.level}</span>
        <span style={{ color: NEON_COLORS.warning }}>+{miner.miningPower}/级</span>
      </div>
      {!isMaxed ? (
        <motion.button
          whileHover={{ scale: canAfford ? 1.02 : 1 }}
          whileTap={{ scale: canAfford ? 0.98 : 1 }}
          onClick={onUpgrade}
          disabled={!canAfford}
          style={{
            width: '100%', padding: '6px', borderRadius: '6px', border: 'none',
            background: canAfford ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255,255,255,0.1)',
            color: canAfford ? NEON_COLORS.success : NEON_COLORS.textMuted,
            fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '12px',
          }}
        >
          {formatNumber(cost)} 💰
        </motion.button>
      ) : (
        <div style={{ textAlign: 'center', padding: '6px', background: 'rgba(255, 215, 0, 0.15)', borderRadius: '6px', color: NEON_COLORS.success, fontSize: '11px', fontWeight: 'bold' }}>
          已满级
        </div>
      )}
    </motion.div>
  );
};

interface UpgradeCardProps {
  upgrade: DrillUpgrade;
  gold: number;
  onUpgrade: () => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, gold, onUpgrade }) => {
  const cost = calculateUpgradeCost(upgrade);
  const canAfford = gold >= cost;
  const isMaxed = upgrade.level >= upgrade.maxLevel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: upgrade.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${upgrade.level > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '24px' }}>{upgrade.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: NEON_COLORS.text, fontSize: '13px' }}>
            {upgrade.name}
            <span style={{ marginLeft: '6px', fontSize: '10px', color: isMaxed ? NEON_COLORS.success : NEON_COLORS.warning }}>
              Lv.{upgrade.level}/{upgrade.maxLevel}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{upgrade.description}</div>
        </div>
      </div>
      {!isMaxed ? (
        <motion.button
          whileHover={{ scale: canAfford ? 1.02 : 1 }}
          whileTap={{ scale: canAfford ? 0.98 : 1 }}
          onClick={onUpgrade}
          disabled={!canAfford}
          style={{
            width: '100%', padding: '5px', borderRadius: '6px', border: 'none',
            background: canAfford ? 'rgba(96, 125, 139, 0.3)' : 'rgba(255,255,255,0.1)',
            color: canAfford ? NEON_COLORS.info : NEON_COLORS.textMuted,
            fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '11px',
          }}
        >
          {formatNumber(cost)} 💰
        </motion.button>
      ) : (
        <div style={{ textAlign: 'center', padding: '5px', background: 'rgba(96, 125, 139, 0.15)', borderRadius: '6px', color: NEON_COLORS.success, fontSize: '10px', fontWeight: 'bold' }}>
          已满级
        </div>
      )}
    </motion.div>
  );
};

const IdleMiner: React.FC = () => {
  const { state, mine, upgradeMiner, upgradeDrill, digDeeper, resetGame, formatNumber, getMiningPower, getLuckBonus } = useMinerEngine();
  const [activeTab, setActiveTab] = useState<'miners' | 'upgrades'>('miners');
  const [digAmount, setDigAmount] = useState(10);

  const power = getMiningPower();
  const luck = getLuckBonus();
  const currentOre = [...state.ores].reverse().find(o => o.depth <= state.currentDepth) || state.ores[0];
  const depthBonus = 1 + state.currentDepth * 0.02;

  return (
    <div style={{
      minHeight: '100vh', background: `linear-gradient(180deg, #2c1810 0%, #1a1515 50%, #0d0a0a 100%)`,
      padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: NEON_COLORS.text,
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: NEON_COLORS.surface, backdropFilter: 'blur(10px)',
            border: `1px solid ${NEON_COLORS.border}`, borderRadius: '16px', padding: '20px', marginBottom: '20px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>金币</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                {formatNumber(state.gold)} 💰
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>总金币</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                {formatNumber(state.totalGold)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>当前深度</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.danger }}>
                ⬇️ {state.currentDepth}m
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>最大深度</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.info }}>
                {state.maxDepth}m
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>采矿力</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                {formatNumber(power)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>幸运</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                x{luck.toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                background: `linear-gradient(180deg, rgba(121, 85, 72, 0.2) 0%, rgba(30, 20, 20, 0.9) 100%)`,
                border: `2px solid ${NEON_COLORS.border}`, borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '60px', marginBottom: '12px' }}>{currentOre.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: currentOre.color, marginBottom: '4px' }}>
                {currentOre.name}
              </div>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted, marginBottom: '8px' }}>
                {currentOre.description}
              </div>
              <div style={{ fontSize: '14px', color: NEON_COLORS.success, marginBottom: '16px' }}>
                单次价值: {formatNumber(Math.floor(currentOre.baseValue * power * depthBonus))} 💰
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={mine}
                style={{
                  padding: '16px 40px', borderRadius: '12px', border: 'none',
                  background: `linear-gradient(135deg, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`,
                  color: '#fff', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                  boxShadow: `0 0 20px ${NEON_COLORS.glow}`,
                }}
              >
                ⛏️ 采矿
              </motion.button>
              <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted, marginTop: '8px' }}>
                总采矿: {formatNumber(state.totalMined)} 次
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                background: NEON_COLORS.surface, border: `1px solid ${NEON_COLORS.border}`,
                borderRadius: '12px', padding: '14px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: NEON_COLORS.text, marginBottom: '10px' }}>
                ⬇️ 向下挖掘
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {[10, 50, 100].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setDigAmount(amount)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                      background: digAmount === amount ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255,255,255,0.1)',
                      color: digAmount === amount ? NEON_COLORS.danger : NEON_COLORS.textMuted,
                      fontWeight: 'bold', cursor: 'pointer', fontSize: '12px',
                    }}
                  >
                    {amount}m
                  </button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: state.gold >= digAmount * 10 ? 1.02 : 1 }}
                whileTap={{ scale: state.gold >= digAmount * 10 ? 0.98 : 1 }}
                onClick={() => digDeeper(digAmount)}
                disabled={state.gold < digAmount * 10}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                  background: state.gold >= digAmount * 10 ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255,255,255,0.1)',
                  color: state.gold >= digAmount * 10 ? NEON_COLORS.danger : NEON_COLORS.textMuted,
                  fontWeight: 'bold', cursor: state.gold >= digAmount * 10 ? 'pointer' : 'not-allowed', fontSize: '13px',
                }}
              >
                花费 {formatNumber(digAmount * 10)} 💰 向下 {digAmount}m
              </motion.button>
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex', gap: '6px', background: NEON_COLORS.surface, padding: '4px',
              borderRadius: '12px', border: `1px solid ${NEON_COLORS.border}`,
            }}>
              {[
                { id: 'miners', label: '矿工', icon: '⛏️' },
                { id: 'upgrades', label: '升级', icon: '⬆️' },
              ].map(tab => (
                <button
                  key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    background: activeTab === tab.id ? NEON_COLORS.primary : 'transparent',
                    color: activeTab === tab.id ? '#fff' : NEON_COLORS.text, fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <span>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            <div style={{
              flex: 1, background: NEON_COLORS.surface, backdropFilter: 'blur(10px)',
              border: `1px solid ${NEON_COLORS.border}`, borderRadius: '16px', padding: '14px',
              overflow: 'auto', maxHeight: '450px',
            }}>
              {activeTab === 'miners' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.miners.map(miner => (
                    <MinerCard key={miner.id} miner={miner} gold={state.gold} onUpgrade={() => upgradeMiner(miner.id)} />
                  ))}
                </div>
              )}
              {activeTab === 'upgrades' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.drillUpgrades.map(upgrade => (
                    <UpgradeCard key={upgrade.id} upgrade={upgrade} gold={state.gold} onUpgrade={() => upgradeDrill(upgrade.id)} />
                  ))}
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={resetGame}
              style={{
                padding: '12px', background: 'rgba(244, 67, 54, 0.2)',
                border: `1px solid ${NEON_COLORS.danger}`, borderRadius: '10px',
                color: NEON_COLORS.danger, fontWeight: 'bold', cursor: 'pointer',
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

export default IdleMiner;
