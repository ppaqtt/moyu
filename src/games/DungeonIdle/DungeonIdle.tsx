import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDungeonEngine, formatNumber, calculateEquipmentCost, calculateSkillCost, Hero, Equipment, Skill, Achievement, DungeonFloor } from './engine';

// NEON 配色方案 - 地下城主题
const NEON_COLORS = {
  primary: '#ff3366',
  secondary: '#9d4edd',
  success: '#00ff88',
  warning: '#ffaa00',
  danger: '#ff3366',
  info: '#00d4ff',
  background: '#1a0a1a',
  surface: 'rgba(40, 20, 40, 0.9)',
  surfaceHover: 'rgba(60, 30, 60, 0.95)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 51, 102, 0.3)',
  glow: 'rgba(255, 51, 102, 0.4)',
};

// 战斗区域组件
interface BattleAreaProps {
  currentFloor: DungeonFloor;
  totalAttack: number;
  onAttack: () => void;
}

const BattleArea: React.FC<BattleAreaProps> = ({ currentFloor, totalAttack, onAttack }) => {
  const hpPercentage = (currentFloor.monsterHp / currentFloor.monsterMaxHp) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: `radial-gradient(circle at center, ${currentFloor.color}20 0%, transparent 70%)`,
        border: `3px solid ${currentFloor.color}`,
        borderRadius: '24px',
        padding: '30px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        padding: '6px 12px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '10px',
        fontSize: '14px',
        color: NEON_COLORS.warning,
        fontWeight: 'bold',
      }}>
        {currentFloor.name}
      </div>
      
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 3, -3, 0],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          fontSize: '120px',
          filter: `drop-shadow(0 0 30px ${currentFloor.color})`,
          marginBottom: '20px',
        }}
      >
        {currentFloor.monsterIcon}
      </motion.div>
      
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: currentFloor.color,
        marginBottom: '16px',
      }}>
        {currentFloor.monsterName}
      </div>
      
      {/* 怪物血条 */}
      <div style={{
        width: '100%',
        height: '24px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '8px',
        border: `2px solid ${currentFloor.color}`,
      }}>
        <motion.div
          initial={false}
          animate={{ width: `${hpPercentage}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${currentFloor.color}, ${NEON_COLORS.danger})`,
            borderRadius: '10px',
          }}
        />
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: NEON_COLORS.textMuted,
        marginBottom: '20px',
      }}>
        <span>HP: {formatNumber(currentFloor.monsterHp)} / {formatNumber(currentFloor.monsterMaxHp)}</span>
        <span>攻击力: {formatNumber(currentFloor.monsterAttack)}</span>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
      }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAttack}
          style={{
            padding: '16px 40px',
            background: `linear-gradient(135deg, ${NEON_COLORS.danger}, ${currentFloor.color})`,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 0 20px ${currentFloor.color}60`,
          }}
        >
          ⚔️ 攻击 (-{formatNumber(totalAttack)})
        </motion.button>
      </div>
      
      <div style={{
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        fontSize: '13px',
        color: NEON_COLORS.warning,
      }}>
        <span>💰 {formatNumber(currentFloor.goldReward)}</span>
        <span>⭐ {formatNumber(currentFloor.expReward)} EXP</span>
      </div>
    </motion.div>
  );
};

// 英雄卡片
interface HeroCardProps {
  hero: Hero;
  gold: number;
  onUnlock: () => void;
}

const HeroCard: React.FC<HeroCardProps> = ({ hero, gold, onUnlock }) => {
  if (!hero.unlocked) {
    const canUnlock = gold >= hero.unlockCost;
    return (
      <motion.div
        whileHover={{ scale: canUnlock ? 1.02 : 1 }}
        style={{
          background: 'rgba(40, 40, 40, 0.6)',
          border: `2px dashed ${canUnlock ? NEON_COLORS.info : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          opacity: canUnlock ? 1 : 0.6,
        }}
      >
        <div style={{ fontSize: '40px', filter: 'grayscale(100%)', marginBottom: '8px' }}>
          🔒
        </div>
        <div style={{ fontWeight: 'bold', color: NEON_COLORS.text, marginBottom: '4px' }}>
          解锁 {hero.name}
        </div>
        <motion.button
          whileHover={{ scale: canUnlock ? 1.05 : 1 }}
          whileTap={{ scale: canUnlock ? 0.95 : 1 }}
          onClick={onUnlock}
          disabled={!canUnlock}
          style={{
            padding: '8px 16px',
            background: canUnlock ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${canUnlock ? NEON_COLORS.info : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: canUnlock ? NEON_COLORS.info : NEON_COLORS.textMuted,
            fontWeight: 'bold',
            cursor: canUnlock ? 'pointer' : 'not-allowed',
            fontSize: '12px',
          }}
        >
          {formatNumber(hero.unlockCost)} 💰
        </motion.button>
      </motion.div>
    );
  }

  const expPercentage = (hero.exp / hero.maxExp) * 100;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: NEON_COLORS.surface,
        border: `2px solid ${hero.color}`,
        borderRadius: '12px',
        padding: '14px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '36px' }}>{hero.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: hero.color }}>
            {hero.name}
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              color: NEON_COLORS.warning,
            }}>
              Lv.{hero.level}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
            {hero.class === 'warrior' ? '战士' : hero.class === 'mage' ? '法师' : hero.class === 'archer' ? '弓箭手' : '牧师'}
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        marginBottom: '10px',
        fontSize: '11px',
      }}>
        <div style={{ textAlign: 'center', padding: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
          <div style={{ color: NEON_COLORS.danger }}>⚔️ {formatNumber(hero.attack)}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
          <div style={{ color: NEON_COLORS.info }}>🛡️ {formatNumber(hero.defense)}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
          <div style={{ color: NEON_COLORS.success }}>❤️ {formatNumber(hero.maxHp)}</div>
        </div>
      </div>
      
      {/* 经验条 */}
      <div style={{
        height: '6px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${expPercentage}%` }}
          style={{
            height: '100%',
            background: NEON_COLORS.warning,
            borderRadius: '3px',
          }}
        />
      </div>
      <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted, textAlign: 'center', marginTop: '4px' }}>
        EXP: {formatNumber(hero.exp)} / {formatNumber(hero.maxExp)}
      </div>
    </motion.div>
  );
};

// 装备卡片
interface EquipmentCardProps {
  equipment: Equipment;
  gold: number;
  onUpgrade: () => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, gold, onUpgrade }) => {
  const cost = calculateEquipmentCost(equipment);
  const canAfford = gold >= cost;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: equipment.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${equipment.level > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '32px' }}>{equipment.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', color: NEON_COLORS.text, fontSize: '14px' }}>
          {equipment.name}
          <span style={{ 
            marginLeft: '6px', 
            padding: '2px 6px',
            background: 'rgba(255, 107, 53, 0.3)',
            borderRadius: '8px',
            fontSize: '10px',
            color: NEON_COLORS.warning,
          }}>
            +{equipment.level}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted, marginTop: '2px' }}>
          {equipment.attackBonus > 0 && <span style={{ color: NEON_COLORS.danger }}>+{equipment.attackBonus * equipment.level} 攻击 </span>}
          {equipment.defenseBonus > 0 && <span style={{ color: NEON_COLORS.info }}>+{equipment.defenseBonus * equipment.level} 防御 </span>}
          {equipment.hpBonus > 0 && <span style={{ color: NEON_COLORS.success }}>+{equipment.hpBonus * equipment.level} 生命</span>}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: canAfford ? 1.05 : 1 }}
        whileTap={{ scale: canAfford ? 0.95 : 1 }}
        onClick={onUpgrade}
        disabled={!canAfford}
        style={{
          padding: '6px 12px',
          background: canAfford ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${canAfford ? NEON_COLORS.success : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '6px',
          color: canAfford ? NEON_COLORS.success : NEON_COLORS.textMuted,
          fontWeight: 'bold',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          fontSize: '11px',
        }}
      >
        {formatNumber(cost)} 💰
      </motion.button>
    </motion.div>
  );
};

// 技能卡片
interface SkillCardProps {
  skill: Skill;
  gold: number;
  onUpgrade: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, gold, onUpgrade }) => {
  const cost = calculateSkillCost(skill);
  const canAfford = gold >= cost && skill.level < skill.maxLevel;
  const isMaxed = skill.level >= skill.maxLevel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: skill.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${skill.level > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '28px' }}>{skill.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', color: NEON_COLORS.text, fontSize: '14px' }}>
          {skill.name}
          <span style={{ 
            marginLeft: '6px', 
            padding: '2px 6px',
            background: isMaxed ? 'rgba(0, 208, 132, 0.3)' : 'rgba(255, 107, 53, 0.3)',
            borderRadius: '8px',
            fontSize: '10px',
            color: isMaxed ? NEON_COLORS.success : NEON_COLORS.warning,
          }}>
            {skill.level}/{skill.maxLevel}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>
          {skill.description}
        </div>
        {skill.level > 0 && (
          <div style={{ fontSize: '10px', color: NEON_COLORS.success, marginTop: '2px' }}>
            当前倍率: x{Math.pow(skill.multiplier, skill.level).toFixed(2)}
          </div>
        )}
      </div>
      {!isMaxed && (
        <motion.button
          whileHover={{ scale: canAfford ? 1.05 : 1 }}
          whileTap={{ scale: canAfford ? 0.95 : 1 }}
          onClick={onUpgrade}
          disabled={!canAfford}
          style={{
            padding: '6px 12px',
            background: canAfford ? 'rgba(157, 78, 221, 0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${canAfford ? NEON_COLORS.secondary : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            color: canAfford ? NEON_COLORS.secondary : NEON_COLORS.textMuted,
            fontWeight: 'bold',
            cursor: canAfford ? 'pointer' : 'not-allowed',
            fontSize: '11px',
          }}
        >
          {formatNumber(cost)} 💰
        </motion.button>
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
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
        <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted }}>
          {achievement.description}
        </div>
      </div>
      {achievement.unlocked && (
        <span style={{ color: NEON_COLORS.success, fontSize: '11px', fontWeight: 'bold' }}>
          +{formatNumber(achievement.reward)} 💰
        </span>
      )}
    </motion.div>
  );
};

// 主游戏组件
const DungeonIdle: React.FC = () => {
  const { 
    state, 
    clickAttack, 
    unlockHero, 
    upgradeEquipment, 
    upgradeSkill,
    resetGame,
    getTotalAttack,
  } = useDungeonEngine();
  
  const [activeTab, setActiveTab] = useState<'heroes' | 'equipment' | 'skills' | 'achievements'>('heroes');
  
  const currentFloor = state.floors.find(f => f.id === state.currentFloor);
  const totalAttack = getTotalAttack();
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #2a0a2a 50%, #1a0a1a 100%)`,
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>金币</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: NEON_COLORS.warning }}>
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
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>当前层</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.danger }}>
                {state.currentFloor}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>最高层</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                {state.maxFloor}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>总击杀</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: NEON_COLORS.info }}>
                {formatNumber(state.totalKills)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>总攻击力</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: NEON_COLORS.danger }}>
                {formatNumber(totalAttack)}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '20px',
        }}>
          {/* 左侧：战斗区域 */}
          <div>
            {currentFloor && (
              <BattleArea
                currentFloor={currentFloor}
                totalAttack={totalAttack}
                onAttack={clickAttack}
              />
            )}
          </div>

          {/* 右侧：英雄和装备 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* 标签页切换 */}
            <div style={{
              display: 'flex',
              gap: '6px',
              background: NEON_COLORS.surface,
              padding: '4px',
              borderRadius: '12px',
              border: `1px solid ${NEON_COLORS.border}`,
            }}>
              {[
                { id: 'heroes', label: '英雄', icon: '⚔️' },
                { id: 'equipment', label: '装备', icon: '🛡️' },
                { id: 'skills', label: '技能', icon: '🔮' },
                { id: 'achievements', label: '成就', icon: '🏆' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? NEON_COLORS.primary : 'transparent',
                    color: activeTab === tab.id ? '#000' : NEON_COLORS.text,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    position: 'relative',
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'achievements' && unlockedAchievements > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      background: NEON_COLORS.danger,
                      color: '#fff',
                      fontSize: '8px',
                      padding: '1px 4px',
                      borderRadius: '6px',
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
              padding: '14px',
              overflow: 'auto',
              maxHeight: '450px',
            }}>
              {activeTab === 'heroes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.heroes.map(hero => (
                    <HeroCard
                      key={hero.id}
                      hero={hero}
                      gold={state.gold}
                      onUnlock={() => unlockHero(hero.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'equipment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.equipments.map(equipment => (
                    <EquipmentCard
                      key={equipment.id}
                      equipment={equipment}
                      gold={state.gold}
                      onUpgrade={() => upgradeEquipment(equipment.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'skills' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.skills.map(skill => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      gold={state.gold}
                      onUpgrade={() => upgradeSkill(skill.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    marginBottom: '6px',
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

export default DungeonIdle;
