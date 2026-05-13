import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NEON_COLORS } from '../utils/constants';

const UPDATE_LOGS = [
  {
    id: 1,
    date: '2026年5月13日',
    title: '大规模游戏库扩展',
    icon: '🎮',
    color: NEON_COLORS.neonPink,
    changes: [
      '新增647款游戏，覆盖49个游戏类别',
      '添加AI对抗类游戏（井字棋大师、五子棋AI、象棋AI等）',
      '添加弹珠台/台球增强类游戏（弹珠台大师、8球台球、斯诺克等）',
      '添加物理模拟类游戏（愤怒的小鸟、涂鸦跳跃、弹珠迷宫等）',
      '添加节奏对战类游戏（节奏大师、钢琴块、节拍对战等）',
      '添加创意工具类游戏（你画我猜、填色本、表情制作等）',
      '添加文字冒险类游戏（剧情选择、文字地牢、侦探推理等）',
      '添加弹幕射击类游戏（弹幕天堂、雷电增强版、几何战争等）',
      '添加放置挂机类游戏（点击赚钱、工厂大亨、恐龙进化等）',
      '添加社交休闲类游戏（真心话大冒险、谁是卧底等）',
    ]
  },
  {
    id: 2,
    date: '2026年5月12日',
    title: '游戏系统优化',
    icon: '⚡',
    color: NEON_COLORS.neonCyan,
    changes: [
      '实现通用游戏组件，所有游戏均可正常游玩',
      '添加游戏分数记录和最高分保存功能',
      '实现游戏开始、暂停、结束完整流程',
      '优化游戏加载速度和性能',
      '修复游戏分类显示问题',
      '首页显示全部49个游戏类别',
    ]
  },
  {
    id: 3,
    date: '2026年5月11日',
    title: '界面设计升级',
    icon: '🎨',
    color: NEON_COLORS.neonPurple,
    changes: [
      '更新页脚设计，添加社交链接和备案信息',
      '优化霓虹风格视觉效果',
      '添加玻璃态卡片设计',
      '实现流畅的动画过渡效果',
      '优化响应式布局，支持移动端',
    ]
  },
  {
    id: 4,
    date: '2026年5月10日',
    title: '核心功能完善',
    icon: '🔧',
    color: NEON_COLORS.neonGreen,
    changes: [
      '添加本地存储功能，保存游戏进度',
      '实现游戏搜索和分类筛选',
      '添加游戏难度标识（简单/中等/困难）',
      '优化游戏卡片展示效果',
      '添加粒子背景动画效果',
    ]
  },
  {
    id: 5,
    date: '2026年5月9日',
    title: '项目初始化',
    icon: '🚀',
    color: NEON_COLORS.neonOrange,
    changes: [
      '搭建React + TypeScript + Vite项目框架',
      '配置TailwindCSS样式系统',
      '集成Framer Motion动画库',
      '创建游戏引擎基础架构',
      '添加2048、俄罗斯方块、贪吃蛇等经典游戏',
    ]
  }
];

export default function UpdateLog() {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}
          >
            <span className="text-2xl">📝</span>
            <span className="text-sm font-medium" style={{ color: NEON_COLORS.neonCyan }}>
              更新日志
            </span>
          </div>
          <h2 className="text-4xl font-black"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            最近更新
          </h2>
          <p className="mt-4 text-lg opacity-70">记录项目的重要更新和功能改进</p>
        </motion.div>

        <div className="space-y-4">
          {UPDATE_LOGS.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="rounded-2xl overflow-hidden backdrop-blur-xl cursor-pointer"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8), rgba(15, 15, 26, 0.9))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: expandedId === log.id ? `0 0 30px ${log.color}30` : 'none'
                }}
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                whileHover={{ scale: 1.01 }}
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: `${log.color}30`,
                        border: `2px solid ${log.color}50`
                      }}
                      animate={expandedId === log.id ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {log.icon}
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                        {log.title}
                      </h3>
                      <p className="text-sm opacity-60">{log.date}</p>
                    </div>
                  </div>
                  <motion.div
                    className="text-2xl opacity-60"
                    animate={{ rotate: expandedId === log.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ▼
                  </motion.div>
                </div>

                <AnimatePresence>
                  {expandedId === log.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 pb-5 pt-2">
                        <ul className="space-y-2">
                          {log.changes.map((change, changeIndex) => (
                            <motion.li
                              key={changeIndex}
                              className="flex items-start gap-3 text-sm"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: changeIndex * 0.05 }}
                            >
                              <span
                                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                style={{ backgroundColor: log.color }}
                              />
                              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                {change}
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              共 {UPDATE_LOGS.length} 条更新记录
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
