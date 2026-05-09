import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpaceEngine, formatNumber, calculateBuildingCost, canAfford, Resource, Building, Technology, Planet, Achievement } from './engine';

// NEON 配色方案 - 太空主题
const NEON_COLORS = {
  primary: '#00d4ff',
  secondary: '#ff00ff',
  success: '#00ff88',
  warning: '#ffaa00',
  danger: '#ff3366',
  info: '#9d4edd',
  background: '#0a0a1a',
  surface: 'rgba(20, 20, 40, 0.9)',
  surfaceHover: 'rgba(30, 30, 60, 0.95)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(0, 212, 255, 0.3)',
  glow: 'rgba(0, 212, 255, 0.4)',
};

// 资源卡片
interface ResourceCardProps {
  resource: Resource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const percentage = (resource.amount / resource.maxAmount) * 100;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      style={{
        background: NEON_COLORS.surface,
        border: `1px solid ${NEON_COLORS.border}`,
        borderRadius: '12px',
        padding: '12px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        width: `${percentage}%`,
        background: percentage > 90 ? NEON_COLORS.danger : resource.color,
        transition: 'width 0.3s',
      }} />
      <div style={{ fontSize: '28px', marginBottom: '4px' }}>{resource.icon}</div>
      <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>{resource.name}</div>
      <div style={{ 
        fontSize: '16px', 
        fontWeight: 'bold', 
        color: resource.color,
        textShadow: `0 0 10px ${resource.color}40`,
      }}>
        {formatNumber(resource.amount)}
      </div>
      <div style={{ fontSize: '9px', color: NEON_COLORS.textMuted }}>
        / {formatNumber(resource.maxAmount)}
      </div>
    </motion.div>
  );
};

// 建筑卡片
interface BuildingCardProps {
  building: Building;
  resources: Resource[];
  onUpgrade: () => void;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building, resources, onUpgrade }) => {
  const costs = calculateBuildingCost(building);
  const affordable = canAfford(resources, costs);
  const isMaxed = building.level >= building.maxLevel;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: building.level > 0 ? NEON_COLORS.surface : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${building.level > 0 ? NEON_COLORS.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '14px',
        opacity: building.level > 0 ? 1 : 0.8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '36px' }}>{building.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: NEON_COLORS.text }}>
            {building.name}
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              color: isMaxed ? NEON_COLORS.success : NEON_COLORS.warning,
            }}>
              Lv.{building.level}/{building.maxLevel}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
            {building.description}
          </div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '10px',
        flexWrap: 'wrap',
      }}>
        {building.production.map((prod, idx) => (
          <span key={idx} style={{
            padding: '3px 8px',
            background: 'rgba(0, 255, 136, 0.15)',
            borderRadius: '6px',
            fontSize: '10px',
            color: NEON_COLORS.success,
          }}>
            +{formatNumber(prod.amount * building.level)}/s
          </span>
        ))}
      </div>
      
      {!isMaxed ? (
        <div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
            升级成本:
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            marginBottom: '8px',
            flexWrap: 'wrap',
          }}>
            {costs.map((cost, idx) => {
              const resource = resources.find(r => r.id === cost.resourceId);
              const hasEnough = resource && resource.amount >= cost.amount;
              return (
                <span key={idx} style={{
                  padding: '2px 6px',
                  background: hasEnough ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: hasEnough ? NEON_COLORS.success : NEON_COLORS.danger,
                }}>
                  {resource?.icon} {formatNumber(cost.amount)}
                </span>
              );
            })}
          </div>
          <motion.button
            whileHover={{ scale: affordable ? 1.02 : 1 }}
            whileTap={{ scale: affordable ? 0.98 : 1 }}
            onClick={onUpgrade}
            disabled={!affordable}
            style={{
              width: '100%',
              padding: '8px',
              background: affordable ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${affordable ? NEON_COLORS.primary : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              color: affordable ? NEON_COLORS.primary : NEON_COLORS.textMuted,
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: affordable ? 'pointer' : 'not-allowed',
            }}
          >
            升级
          </motion.button>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(0, 208, 132, 0.15)',
          borderRadius: '8px',
          color: NEON_COLORS.success,
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          已满级
        </div>
      )}
    </motion.div>
  );
};

// 科技卡片
interface TechnologyCardProps {
  tech: Technology;
  resources: Resource[];
  onResearch: () => void;
}

const TechnologyCard: React.FC<TechnologyCardProps> = ({ tech, resources, onResearch }) => {
  const affordable = canAfford(resources, tech.cost);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: tech.unlocked 
          ? 'rgba(0, 208, 132, 0.15)' 
          : affordable 
            ? NEON_COLORS.surface 
            : 'rgba(40, 40, 40, 0.6)',
        border: `1px solid ${tech.unlocked 
          ? NEON_COLORS.success 
          : affordable 
            ? NEON_COLORS.border 
            : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: tech.unlocked ? 1 : 0.8,
      }}
    >
      <span style={{ fontSize: '32px' }}>
        {tech.unlocked ? '✅' : tech.icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: tech.unlocked ? NEON_COLORS.success : NEON_COLORS.text,
        }}>
          {tech.name}
        </div>
        <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
          {tech.description}
        </div>
        {!tech.unlocked && (
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            marginTop: '6px',
            flexWrap: 'wrap',
          }}>
            {tech.cost.map((cost, idx) => {
              const resource = resources.find(r => r.id === cost.resourceId);
              const hasEnough = resource && resource.amount >= cost.amount;
              return (
                <span key={idx} style={{
                  padding: '2px 6px',
                  background: hasEnough ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: hasEnough ? NEON_COLORS.success : NEON_COLORS.danger,
                }}>
                  {resource?.icon} {formatNumber(cost.amount)}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {!tech.unlocked && (
        <motion.button
          whileHover={{ scale: affordable ? 1.05 : 1 }}
          whileTap={{ scale: affordable ? 0.95 : 1 }}
          onClick={onResearch}
          disabled={!affordable}
          style={{
            padding: '8px 14px',
            background: affordable ? 'rgba(157, 78, 221, 0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${affordable ? NEON_COLORS.info : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            color: affordable ? NEON_COLORS.info : NEON_COLORS.textMuted,
            fontWeight: 'bold',
            cursor: affordable ? 'pointer' : 'not-allowed',
            fontSize: '12px',
          }}
        >
          研究
        </motion.button>
      )}
    </motion.div>
  );
};

// 星球卡片
interface PlanetCardProps {
  planet: Planet;
  resources: Resource[];
  onColonize: () => void;
}

const PlanetCard: React.FC<PlanetCardProps> = ({ planet, resources, onColonize }) => {
  const affordable = canAfford(resources, planet.requirement);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: planet.colonized 
          ? 'rgba(0, 208, 132, 0.15)' 
          : affordable 
            ? NEON_COLORS.surface 
            : 'rgba(40, 40, 40, 0.6)',
        border: `2px solid ${planet.colonized 
          ? NEON_COLORS.success 
          : affordable 
            ? planet.color 
            : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '14px',
        opacity: planet.colonized ? 1 : 0.8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <motion.div
          animate={planet.colonized ? { rotate: 360 } : {}}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            fontSize: '40px',
            filter: `drop-shadow(0 0 10px ${planet.color})`,
          }}
        >
          {planet.icon}
        </motion.div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: planet.colonized ? NEON_COLORS.success : planet.color,
          }}>
            {planet.name}
            {planet.colonized && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                background: NEON_COLORS.success,
                color: '#000',
                borderRadius: '10px',
                fontSize: '10px',
              }}>
                已殖民
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: NEON_COLORS.textMuted }}>
            {planet.description}
          </div>
          {planet.distance > 0 && (
            <div style={{ fontSize: '10px', color: NEON_COLORS.info, marginTop: '2px' }}>
              距离: {planet.distance} 光年
            </div>
          )}
        </div>
      </div>
      
      {planet.colonized ? (
        <div style={{
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <span style={{ color: NEON_COLORS.warning, fontSize: '12px' }}>
            资源产出 x{planet.resourceMultiplier}
          </span>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '10px', color: NEON_COLORS.textMuted, marginBottom: '4px' }}>
            殖民需求:
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            marginBottom: '8px',
            flexWrap: 'wrap',
          }}>
            {planet.requirement.map((req, idx) => {
              const resource = resources.find(r => r.id === req.resourceId);
              const hasEnough = resource && resource.amount >= req.amount;
              return (
                <span key={idx} style={{
                  padding: '2px 6px',
                  background: hasEnough ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: hasEnough ? NEON_COLORS.success : NEON_COLORS.danger,
                }}>
                  {resource?.icon} {formatNumber(req.amount)}
                </span>
              );
            })}
          </div>
          <motion.button
            whileHover={{ scale: affordable ? 1.02 : 1 }}
            whileTap={{ scale: affordable ? 0.98 : 1 }}
            onClick={onColonize}
            disabled={!affordable}
            style={{
              width: '100%',
              padding: '8px',
              background: affordable ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${affordable ? NEON_COLORS.primary : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              color: affordable ? NEON_COLORS.primary : NEON_COLORS.textMuted,
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: affordable ? 'pointer' : 'not-allowed',
            }}
          >
            🚀 殖民
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

// 主游戏组件
const SpaceIdle: React.FC = () => {
  const { 
    state, 
    handleClick, 
    upgradeBuilding, 
    researchTechnology, 
    colonizePlanet,
    resetGame,
  } = useSpaceEngine();
  
  const [activeTab, setActiveTab] = useState<'buildings' | 'tech' | 'planets'>('buildings');
  
  // 已殖民星球数量
  const colonizedCount = state.planets.filter(p => p.colonized).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a1a3e 50%, #0f0f2f 100%)`,
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: NEON_COLORS.text,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* 顶部资源栏 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: NEON_COLORS.surface,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${NEON_COLORS.border}`,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: `0 0 30px ${NEON_COLORS.glow}`,
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '10px',
          }}>
            {state.resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px',
        }}>
          {/* 左侧：点击区和统计 */}
          <div>
            {/* 点击区域 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: `radial-gradient(circle at center, rgba(0, 212, 255, 0.15) 0%, transparent 70%)`,
                border: `2px solid ${NEON_COLORS.border}`,
                borderRadius: '20px',
                height: '250px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '16px',
              }}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 30px ${NEON_COLORS.primary}40`,
                    `0 0 60px ${NEON_COLORS.primary}60`,
                    `0 0 30px ${NEON_COLORS.primary}40`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${NEON_COLORS.primary}20 0%, transparent 70%)`,
                }}
              />
              
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{
                  fontSize: '100px',
                  filter: `drop-shadow(0 0 30px ${NEON_COLORS.primary})`,
                  zIndex: 1,
                }}
              >
                🌍
              </motion.div>
              
              <div style={{
                marginTop: '16px',
                fontSize: '14px',
                color: NEON_COLORS.textMuted,
                zIndex: 1,
                textAlign: 'center',
              }}>
                点击收集能量<br/>
                <span style={{ fontSize: '12px', color: NEON_COLORS.primary }}>
                  +{formatNumber(state.clickValue)} ⚡
                </span>
              </div>
            </motion.div>

            {/* 统计信息 */}
            <div style={{
              background: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.border}`,
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>总点击数</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.primary }}>
                  {formatNumber(state.totalClicks)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: NEON_COLORS.textMuted }}>已殖民星球</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: NEON_COLORS.success }}>
                  {colonizedCount} / {state.planets.length}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：主要内容 */}
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
                { id: 'buildings', label: '建筑', icon: '🏗️' },
                { id: 'tech', label: '科技', icon: '🔬' },
                { id: 'planets', label: '星球', icon: '🪐' },
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
              padding: '16px',
              minHeight: '400px',
              maxHeight: '500px',
              overflow: 'auto',
            }}>
              {activeTab === 'buildings' && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px',
                }}>
                  {state.buildings.map(building => (
                    <BuildingCard
                      key={building.id}
                      building={building}
                      resources={state.resources}
                      onUpgrade={() => upgradeBuilding(building.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'tech' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.technologies.map(tech => (
                    <TechnologyCard
                      key={tech.id}
                      tech={tech}
                      resources={state.resources}
                      onResearch={() => researchTechnology(tech.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'planets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {state.planets.map(planet => (
                    <PlanetCard
                      key={planet.id}
                      planet={planet}
                      resources={state.resources}
                      onColonize={() => colonizePlanet(planet.id)}
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
                marginTop: '16px',
                width: '100%',
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

export default SpaceIdle;
