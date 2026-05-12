import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpaceEngine, formatNumber, calculateSpaceshipCost, calculateStationCost, Star, Spaceship, Station } from './engine';

const NEON_COLORS = {
  primary: '#00d4ff',
  secondary: '#9d4edd',
  success: '#00ff88',
  warning: '#ffaa00',
  danger: '#ff3366',
  info: '#7b68ee',
  background: '#0a0a1a',
  surface: 'rgba(20, 20, 40, 0.9)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(0, 212, 255, 0.3)',
  glow: 'rgba(0, 212, 255, 0.4)',
};

interface StarCardProps {
  star: Star;
  energy: number;
  onCollect: () => void;
}

const StarCard: React.FC<StarCardProps> = ({ star, energy, onCollect }) => {
  const canAfford = energy >= star.cost;

  return (
    <motion.div
      whileHover={{ scale: canAfford ? 1.03 : 1 }}
      style={{
        background: NEON_COLORS.surface,
        border: `2px solid ${star.color}60`,
        borderRadius: '16px',
        padding: '16px',
        textAlign: 'center',
        opacity: canAfford ? 1 : 0.6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at center, ${star.color}15 0%, transparent 70%)`,
      }} />
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ fontSize: '48px', marginBottom: '8px', position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 15px ${star.color})` }}
      >
        {star.icon}
      </motion.div>
      <div style={{ fontWeight: 'bold', color: star.color, fontSize: '15px', position: 'relative', zIndex: 1 }}>{star.name}</div>
      <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted, marginBottom: '8px', position: 'relative', zIndex: 1 }}>{star.description}</div>
      <div style={{ fontSize: '11px', color: NEON_COLORS.warning, marginBottom: '8px', position: 'relative', zIndex: 1 }}>
        产能: +{formatNumber(star.energyOutput)}/s
      </div>
      <motion.button
        whileHover={{ scale: canAfford ? 1.05 : 1 }}
        whileTap={{ scale: canAfford ? 0.95 : 1 }}
        onClick={onCollect}
        disabled={!canAfford}
        style={{
          width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
          background: canAfford ? `${star.color}40` : 'rgba(255,255,255,0.1)',
          color: canAfford ? star.color : NEON_COLORS.textMuted,
          fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '12px', position: 'relative', zIndex: 1,
        }}
      >
        {formatNumber(star.cost)} ⚡
      </motion.button>
    </motion.div>
  );
};

interface ShipCardProps {
  ship: Spaceship;
  energy: number;
  onUpgrade: () => void;
}

const ShipCard: React.FC<ShipCardProps> = ({ ship, energy, onUpgrade }) => {
  const cost = calculateSpaceshipCost(ship);
  const canAfford = energy >= cost;
  const isMaxed = ship.level >= ship.maxLevel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: ship.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${ship.level > 0 ? ship.color : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '28px' }}>{ship.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: ship.color }}>
            {ship.name}
            <span style={{ marginLeft: '6px', fontSize: '11px', color: isMaxed ? NEON_COLORS.success : NEON_COLORS.warning }}>
              Lv.{ship.level}/{ship.maxLevel}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{ship.description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px' }}>
        <span style={{ color: NEON_COLORS.info }}>速度: x{ship.speed}</span>
        <span style={{ color: NEON_COLORS.secondary }}>货量: {ship.cargoCapacity}</span>
      </div>
      {!isMaxed ? (
        <motion.button
          whileHover={{ scale: canAfford ? 1.02 : 1 }}
          whileTap={{ scale: canAfford ? 0.98 : 1 }}
          onClick={onUpgrade}
          disabled={!canAfford}
          style={{
            width: '100%', padding: '6px', borderRadius: '6px', border: 'none',
            background: canAfford ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255,255,255,0.1)',
            color: canAfford ? NEON_COLORS.primary : NEON_COLORS.textMuted,
            fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '11px',
          }}
        >
          {formatNumber(cost)} ⚡
        </motion.button>
      ) : (
        <div style={{ textAlign: 'center', padding: '6px', background: 'rgba(0, 212, 255, 0.15)', borderRadius: '6px', color: NEON_COLORS.success, fontSize: '10px', fontWeight: 'bold' }}>
          已满级
        </div>
      )}
    </motion.div>
  );
};

interface StationCardProps {
  station: Station;
  energy: number;
  onUpgrade: () => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, energy, onUpgrade }) => {
  const cost = calculateStationCost(station);
  const canAfford = energy >= cost;
  const isMaxed = station.level >= station.maxLevel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: station.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${station.level > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '24px' }}>{station.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: NEON_COLORS.text, fontSize: '13px' }}>
            {station.name}
            <span style={{ marginLeft: '6px', fontSize: '10px', color: isMaxed ? NEON_COLORS.success : NEON_COLORS.warning }}>
              Lv.{station.level}/{station.maxLevel}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{station.description}</div>
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
            background: canAfford ? 'rgba(155, 78, 221, 0.3)' : 'rgba(255,255,255,0.1)',
            color: canAfford ? NEON_COLORS.secondary : NEON_COLORS.textMuted,
            fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '11px',
          }}
        >
          {formatNumber(cost)} ⚡
        </motion.button>
      ) : (
        <div style={{ textAlign: 'center', padding: '5px', background: 'rgba(155, 78, 221, 0.15)', borderRadius: '6px', color: NEON_COLORS.success, fontSize: '10px', fontWeight: 'bold' }}>
          已满级
        </div>
      )}
    </motion.div>
  );
};

const IdleSpace: React.FC = () => {
  const { state, collectStar, upgradeSpaceship, upgradeStation, resetGame, formatNumber, getEnergyRate, getEnergyCapacity } = useSpaceEngine();
  const [activeTab, setActiveTab] = useState<'stars' | 'ships' | 'stations'>('stars');

  const energyRate = getEnergyRate();
  const capacity = getEnergyCapacity();
  const energyPercent = (state.energy / capacity) * 100;

  return (
    <div style={{
      minHeight: '100vh', background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a1a3e 50%, #0f0f2f 100%)`,
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
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>能量</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: NEON_COLORS.primary }}>
                {formatNumber(state.energy)} ⚡
              </div>
              <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>/ {formatNumber(capacity)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>产出速度</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                +{formatNumber(energyRate)}/s
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>已收集恒星</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                {state.totalExplored}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>最远距离</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.info }}>
                {formatNumber(state.maxDistance)} 光年
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>拥有恒星</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                {state.stars.length}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                background: `radial-gradient(circle at center, rgba(0, 212, 255, 0.15) 0%, transparent 70%)`,
                border: `2px solid ${NEON_COLORS.border}`, borderRadius: '20px', padding: '30px', textAlign: 'center',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: '120px', marginBottom: '16px', filter: `drop-shadow(0 0 40px ${NEON_COLORS.primary})` }}
              >
                🌌
              </motion.div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.primary, marginBottom: '8px' }}>
                星际能源帝国
              </div>
              <div style={{ fontSize: '14px', color: NEON_COLORS.textMuted }}>
                收集恒星，建造星际舰队
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex', gap: '6px', background: NEON_COLORS.surface, padding: '4px',
              borderRadius: '12px', border: `1px solid ${NEON_COLORS.border}`,
            }}>
              {[
                { id: 'stars', label: '恒星', icon: '🌟' },
                { id: 'ships', label: '舰船', icon: '🚀' },
                { id: 'stations', label: '空间站', icon: '🛸' },
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
              {activeTab === 'stars' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {state.stars.map(star => (
                    <StarCard key={star.id} star={star} energy={state.energy} onCollect={() => collectStar(star.id)} />
                  ))}
                </div>
              )}
              {activeTab === 'ships' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.spaceships.map(ship => (
                    <ShipCard key={ship.id} ship={ship} energy={state.energy} onUpgrade={() => upgradeSpaceship(ship.id)} />
                  ))}
                </div>
              )}
              {activeTab === 'stations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.stations.map(station => (
                    <StationCard key={station.id} station={station} energy={state.energy} onUpgrade={() => upgradeStation(station.id)} />
                  ))}
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={resetGame}
              style={{
                padding: '12px', background: 'rgba(255, 51, 102, 0.2)',
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

export default IdleSpace;
