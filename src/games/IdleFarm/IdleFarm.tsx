import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFarmEngine, formatNumber, calculateBuildingCost, Crop, FarmBuilding, Animal, Achievement } from './engine';

const NEON_COLORS = {
  primary: '#4CAF50',
  secondary: '#8BC34A',
  success: '#00E676',
  warning: '#FFC107',
  danger: '#FF5722',
  info: '#03A9F4',
  background: '#1a2f1a',
  surface: 'rgba(30, 60, 30, 0.9)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(76, 175, 80, 0.3)',
  glow: 'rgba(76, 175, 80, 0.4)',
};

interface CropCardProps {
  crop: Crop;
  onHarvest: () => void;
  speedMult: number;
  prodMult: number;
}

const CropCard: React.FC<CropCardProps> = ({ crop, onHarvest, speedMult, prodMult }) => {
  const [cooldown, setCooldown] = useState(0);
  const growTime = crop.baseTime / speedMult;
  const production = Math.floor(crop.baseProduction * prodMult);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleClick = () => {
    if (cooldown <= 0) {
      onHarvest();
      setCooldown(Math.floor(growTime));
    }
  };

  const progress = cooldown > 0 ? ((growTime - cooldown) / growTime) * 100 : 100;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: NEON_COLORS.surface,
        border: `1px solid ${crop.color}40`,
        borderRadius: '12px',
        padding: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: '3px', width: `${progress}%`,
        background: crop.color, transition: 'width 0.3s',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '36px' }}>{crop.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: crop.color }}>{crop.name}</div>
          <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>{crop.description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
        <span style={{ color: NEON_COLORS.textMuted }}>生长: {Math.floor(growTime)}s</span>
        <span style={{ color: NEON_COLORS.success }}>+{production} 💰</span>
      </div>
      <motion.button
        whileHover={{ scale: cooldown <= 0 ? 1.02 : 1 }}
        whileTap={{ scale: cooldown <= 0 ? 0.95 : 1 }}
        onClick={handleClick}
        disabled={cooldown > 0}
        style={{
          width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
          background: cooldown <= 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.1)',
          color: cooldown <= 0 ? NEON_COLORS.success : NEON_COLORS.textMuted,
          fontWeight: 'bold', cursor: cooldown <= 0 ? 'pointer' : 'not-allowed', fontSize: '13px',
        }}
      >
        {cooldown > 0 ? `🌱 生长中 (${cooldown}s)` : '🌾 收获'}
      </motion.button>
    </motion.div>
  );
};

interface BuildingCardProps {
  building: FarmBuilding;
  gold: number;
  onUpgrade: () => void;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building, gold, onUpgrade }) => {
  const cost = calculateBuildingCost(building);
  const canAfford = gold >= cost;
  const isMaxed = building.level >= building.maxLevel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: building.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${building.level > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '28px' }}>{building.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: NEON_COLORS.text }}>
            {building.name}
            <span style={{ marginLeft: '6px', fontSize: '11px', color: isMaxed ? NEON_COLORS.success : NEON_COLORS.warning }}>
              Lv.{building.level}/{building.maxLevel}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{building.description}</div>
        </div>
      </div>
      {!isMaxed ? (
        <motion.button
          whileHover={{ scale: canAfford ? 1.02 : 1 }}
          whileTap={{ scale: canAfford ? 0.98 : 1 }}
          onClick={onUpgrade}
          disabled={!canAfford}
          style={{
            width: '100%', padding: '6px', borderRadius: '6px', border: 'none',
            background: canAfford ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255,255,255,0.1)',
            color: canAfford ? NEON_COLORS.success : NEON_COLORS.textMuted,
            fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '12px',
          }}
        >
          {formatNumber(cost)} 💰
        </motion.button>
      ) : (
        <div style={{ textAlign: 'center', padding: '6px', background: 'rgba(0, 230, 118, 0.15)', borderRadius: '6px', color: NEON_COLORS.success, fontSize: '11px', fontWeight: 'bold' }}>
          已满级
        </div>
      )}
    </motion.div>
  );
};

interface AnimalCardProps {
  animal: Animal;
  gold: number;
  onUnlock: () => void;
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal, gold, onUnlock }) => {
  const canAfford = gold >= animal.cost;

  return (
    <motion.div
      whileHover={{ scale: canAfford ? 1.02 : 1 }}
      style={{
        background: animal.unlocked ? 'rgba(0, 230, 118, 0.15)' : NEON_COLORS.surface,
        border: `1px solid ${animal.unlocked ? NEON_COLORS.success : canAfford ? animal.color : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '12px', opacity: animal.unlocked ? 1 : 0.8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '32px' }}>{animal.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: animal.unlocked ? NEON_COLORS.success : NEON_COLORS.text }}>
            {animal.name}
            {animal.unlocked && <span style={{ marginLeft: '6px', fontSize: '10px', color: NEON_COLORS.success }}>已解锁</span>}
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{animal.description}</div>
          {!animal.unlocked && (
            <div style={{ fontSize: '10px', color: NEON_COLORS.warning, marginTop: '2px' }}>
              +{animal.production}/次
            </div>
          )}
        </div>
        {!animal.unlocked && (
          <motion.button
            whileHover={{ scale: canAfford ? 1.05 : 1 }}
            whileTap={{ scale: canAfford ? 0.95 : 1 }}
            onClick={onUnlock}
            disabled={!canAfford}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              background: canAfford ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255,255,255,0.1)',
              color: canAfford ? NEON_COLORS.warning : NEON_COLORS.textMuted,
              fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '11px',
            }}
          >
            {formatNumber(animal.cost)} 💰
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const IdleFarm: React.FC = () => {
  const { state, harvestCrop, upgradeBuilding, unlockAnimal, resetGame, formatNumber, getSpeedMultiplier, getProductionMultiplier } = useFarmEngine();
  const [activeTab, setActiveTab] = useState<'crops' | 'buildings' | 'animals'>('crops');
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;

  const speedMult = getSpeedMultiplier();
  const prodMult = getProductionMultiplier();
  const barn = state.farmBuildings.find(b => b.id === 'barn');
  const capacity = 1000 + (barn?.level || 0) * barn?.effect.find(e => e.type === 'capacity')?.value!;

  return (
    <div style={{
      minHeight: '100vh', background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #2d4a2d 50%, #1a3a1a 100%)`,
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>金币</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                {formatNumber(state.gold)} 💰
              </div>
              <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>/ {formatNumber(capacity)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>总金币</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.primary }}>
                {formatNumber(state.totalGold)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>收获次数</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                {formatNumber(state.totalHarvests)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>生长加速</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.info }}>
                x{speedMult.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>产量加成</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                x{prodMult.toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                background: `radial-gradient(circle at center, rgba(76, 175, 80, 0.15) 0%, transparent 70%)`,
                border: `2px solid ${NEON_COLORS.border}`, borderRadius: '20px', padding: '30px', textAlign: 'center',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: '100px', marginBottom: '16px', filter: `drop-shadow(0 0 30px ${NEON_COLORS.primary})` }}
              >
                🌻
              </motion.div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.primary, marginBottom: '8px' }}>
                快乐农场
              </div>
              <div style={{ fontSize: '14px', color: NEON_COLORS.textMuted }}>
                点击收获作物赚取金币
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex', gap: '6px', background: NEON_COLORS.surface, padding: '4px',
              borderRadius: '12px', border: `1px solid ${NEON_COLORS.border}`,
            }}>
              {[
                { id: 'crops', label: '作物', icon: '🌾' },
                { id: 'buildings', label: '建筑', icon: '🏠' },
                { id: 'animals', label: '动物', icon: '🐄' },
              ].map(tab => (
                <button
                  key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    background: activeTab === tab.id ? NEON_COLORS.primary : 'transparent',
                    color: activeTab === tab.id ? '#000' : NEON_COLORS.text, fontWeight: 'bold',
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
              overflow: 'auto', maxHeight: '400px',
            }}>
              {activeTab === 'crops' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {state.crops.map(crop => (
                    <CropCard key={crop.id} crop={crop} onHarvest={() => harvestCrop(crop.id)} speedMult={speedMult} prodMult={prodMult} />
                  ))}
                </div>
              )}
              {activeTab === 'buildings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.farmBuildings.map(building => (
                    <BuildingCard key={building.id} building={building} gold={state.gold} onUpgrade={() => upgradeBuilding(building.id)} />
                  ))}
                </div>
              )}
              {activeTab === 'animals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.animals.map(animal => (
                    <AnimalCard key={animal.id} animal={animal} gold={state.gold} onUnlock={() => unlockAnimal(animal.id)} />
                  ))}
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={resetGame}
              style={{
                padding: '12px', background: 'rgba(255, 87, 34, 0.2)',
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

export default IdleFarm;
