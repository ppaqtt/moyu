import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRacingEngine, formatNumber, calculateUpgradeCost, Car, Upgrade, Track } from './engine';

const NEON_COLORS = {
  primary: '#ff3366',
  secondary: '#ff6b35',
  success: '#00ff88',
  warning: '#ffaa00',
  danger: '#ff3366',
  info: '#00d4ff',
  background: '#1a0a0a',
  surface: 'rgba(40, 20, 20, 0.9)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 51, 102, 0.3)',
  glow: 'rgba(255, 51, 102, 0.4)',
};

interface CarCardProps {
  car: Car;
  gold: number;
  onUnlock: () => void;
}

const CarCard: React.FC<CarCardProps> = ({ car, gold, onUnlock }) => {
  const canAfford = gold >= car.baseCost;

  return (
    <motion.div
      whileHover={{ scale: canAfford || car.unlocked ? 1.02 : 1 }}
      style={{
        background: car.unlocked ? `${car.color}20` : NEON_COLORS.surface,
        border: `2px solid ${car.unlocked ? car.color : canAfford ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '16px',
        padding: '14px',
        textAlign: 'center',
        opacity: car.unlocked ? 1 : 0.7,
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '8px', filter: car.unlocked ? `drop-shadow(0 0 10px ${car.color})` : 'grayscale(50%)' }}>
        {car.icon}
      </div>
      <div style={{ fontWeight: 'bold', color: car.unlocked ? car.color : NEON_COLORS.text, fontSize: '14px' }}>
        {car.name}
        {car.unlocked && <span style={{ marginLeft: '6px', fontSize: '10px', color: NEON_COLORS.success }}>已拥有</span>}
      </div>
      <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted, marginBottom: '6px' }}>{car.description}</div>
      <div style={{ fontSize: '11px', color: NEON_COLORS.info, marginBottom: '8px' }}>速度: {car.baseSpeed}</div>
      {!car.unlocked && (
        <motion.button
          whileHover={{ scale: canAfford ? 1.05 : 1 }}
          whileTap={{ scale: canAfford ? 0.95 : 1 }}
          onClick={onUnlock}
          disabled={!canAfford}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
            background: canAfford ? 'rgba(255, 51, 102, 0.3)' : 'rgba(255,255,255,0.1)',
            color: canAfford ? NEON_COLORS.primary : NEON_COLORS.textMuted,
            fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '12px',
          }}
        >
          {formatNumber(car.baseCost)} 💰
        </motion.button>
      )}
    </motion.div>
  );
};

interface UpgradeCardProps {
  upgrade: Upgrade;
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
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
            width: '100%', padding: '6px', borderRadius: '6px', border: 'none',
            background: canAfford ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255,255,255,0.1)',
            color: canAfford ? NEON_COLORS.secondary : NEON_COLORS.textMuted,
            fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '11px',
          }}
        >
          {formatNumber(cost)} 💰
        </motion.button>
      ) : (
        <div style={{ textAlign: 'center', padding: '6px', background: 'rgba(255, 107, 53, 0.15)', borderRadius: '6px', color: NEON_COLORS.success, fontSize: '10px', fontWeight: 'bold' }}>
          已满级
        </div>
      )}
    </motion.div>
  );
};

interface TrackCardProps {
  track: Track;
  gold: number;
  onUnlock: () => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, gold, onUnlock }) => {
  const canAfford = gold >= track.unlockCost;

  return (
    <motion.div
      whileHover={{ scale: canAfford || track.unlocked ? 1.02 : 1 }}
      style={{
        background: track.unlocked ? `${track.color}20` : NEON_COLORS.surface,
        border: `1px solid ${track.unlocked ? track.color : canAfford ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px', padding: '10px',
        opacity: track.unlocked ? 1 : 0.7,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '28px' }}>{track.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: track.unlocked ? track.color : NEON_COLORS.text, fontSize: '13px' }}>
            {track.name}
            {track.unlocked && <span style={{ marginLeft: '6px', fontSize: '10px', color: NEON_COLORS.success }}>已解锁</span>}
          </div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>{track.description}</div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.warning, marginTop: '2px' }}>
            奖励 x{track.rewardMultiplier}
          </div>
        </div>
        {!track.unlocked && (
          <motion.button
            whileHover={{ scale: canAfford ? 1.05 : 1 }}
            whileTap={{ scale: canAfford ? 0.95 : 1 }}
            onClick={onUnlock}
            disabled={!canAfford}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              background: canAfford ? `${track.color}40` : 'rgba(255,255,255,0.1)',
              color: canAfford ? track.color : NEON_COLORS.textMuted,
              fontWeight: 'bold', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '11px',
            }}
          >
            {formatNumber(track.unlockCost)} 💰
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const IdleRacing: React.FC = () => {
  const { state, startRace, unlockCar, upgradePart, unlockTrack, resetGame, formatNumber, getSpeed } = useRacingEngine();
  const [activeTab, setActiveTab] = useState<'cars' | 'upgrades' | 'tracks'>('upgrades');
  const [isRacing, setIsRacing] = useState(false);
  const [raceResult, setRaceResult] = useState<{ track: string; reward: number } | null>(null);

  const speed = getSpeed();
  const unlockedCars = state.cars.filter(c => c.unlocked);
  const unlockedTracks = state.tracks.filter(t => t.unlocked);

  const handleRace = () => {
    setIsRacing(true);
    setTimeout(() => {
      const track = unlockedTracks[Math.floor(Math.random() * unlockedTracks.length)] || state.tracks[0];
      const reward = Math.floor(speed * 10 * track.rewardMultiplier);
      setRaceResult({ track: track.name, reward });
      startRace();
      setIsRacing(false);
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh', background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #2a1010 50%, #1a0a0a 100%)`,
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
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
                {formatNumber(state.gold)} 💰
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>总金币</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.primary }}>
                {formatNumber(state.totalGold)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>速度</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.danger }}>
                {formatNumber(speed)} km/h
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>比赛次数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                {state.totalRaces}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>最高速度</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.info }}>
                {state.bestSpeed}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                background: `radial-gradient(circle at center, rgba(255, 51, 102, 0.15) 0%, transparent 70%)`,
                border: `2px solid ${NEON_COLORS.border}`, borderRadius: '20px', padding: '30px', textAlign: 'center',
              }}
            >
              <motion.div
                animate={isRacing ? { x: [0, 50, -50, 50, 0], y: [0, -20, 20, -20, 0] } : {}}
                transition={{ duration: 0.5, repeat: isRacing ? Infinity : 0 }}
                style={{ fontSize: '100px', marginBottom: '16px', filter: `drop-shadow(0 0 30px ${NEON_COLORS.primary})` }}
              >
                🏁
              </motion.div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.primary, marginBottom: '8px' }}>
                极速竞速
              </div>
              <div style={{ fontSize: '14px', color: NEON_COLORS.textMuted, marginBottom: '16px' }}>
                当前速度: {speed} km/h | 预计奖励: {formatNumber(Math.floor(speed * 10 * 1.5))} 💰
              </div>
              <motion.button
                whileHover={{ scale: isRacing ? 1 : 1.05 }}
                whileTap={{ scale: isRacing ? 1 : 0.95 }}
                onClick={handleRace}
                disabled={isRacing}
                style={{
                  padding: '16px 50px', borderRadius: '12px', border: 'none',
                  background: isRacing ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                  color: '#fff', fontSize: '20px', fontWeight: 'bold', cursor: isRacing ? 'not-allowed' : 'pointer',
                  boxShadow: isRacing ? 'none' : `0 0 30px ${NEON_COLORS.glow}`,
                }}
              >
                {isRacing ? '🏎️ 比赛中...' : '🏎️ 开始比赛'}
              </motion.button>
              {raceResult && !isRacing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: '16px', padding: '12px', background: 'rgba(0, 255, 136, 0.2)', borderRadius: '10px' }}
                >
                  <div style={{ fontSize: '14px', color: NEON_COLORS.success }}>
                    完成 {raceResult.track}! 获得 {formatNumber(raceResult.reward)} 💰
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex', gap: '6px', background: NEON_COLORS.surface, padding: '4px',
              borderRadius: '12px', border: `1px solid ${NEON_COLORS.border}`,
            }}>
              {[
                { id: 'upgrades', label: '升级', icon: '⬆️' },
                { id: 'cars', label: '赛车', icon: '🏎️' },
                { id: 'tracks', label: '赛道', icon: '🏁' },
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
              overflow: 'auto', maxHeight: '400px',
            }}>
              {activeTab === 'upgrades' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.upgrades.map(upgrade => (
                    <UpgradeCard key={upgrade.id} upgrade={upgrade} gold={state.gold} onUpgrade={() => upgradePart(upgrade.id)} />
                  ))}
                </div>
              )}
              {activeTab === 'cars' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {state.cars.map(car => (
                    <CarCard key={car.id} car={car} gold={state.gold} onUnlock={() => unlockCar(car.id)} />
                  ))}
                </div>
              )}
              {activeTab === 'tracks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.tracks.map(track => (
                    <TrackCard key={track.id} track={track} gold={state.gold} onUnlock={() => unlockTrack(track.id)} />
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

export default IdleRacing;
