import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import { NEON_COLORS } from '../utils/constants';

const UPDATE_LOGS = [
  {
    id: 1,
    date: '2026年5月13日（深夜）',
    title: '全部游戏独立化完成 - 541款游戏全部可游玩',
    icon: '🎮',
    color: NEON_COLORS.neonGreen,
    changes: [
      '为338个缺失游戏创建独立游戏组件，每个游戏有独特玩法',
      '根据游戏类别生成不同类型游戏（射击、益智、迷宫、数学等40+类）',
      '更新Game.tsx动态导入映射，覆盖全部541款游戏',
      '移除PlaceholderGame占位系统，所有游戏使用真实组件',
      '构建成功：1195个模块转换，545个独立chunk',
      '每款游戏都有完整的游戏循环（开始→游玩→结束）和分数系统',
    ]
  },
  {
    id: 2,
    date: '2026年5月13日（下午）',
    title: '游戏独立性全面升级',
    icon: '🎯',
    color: NEON_COLORS.neonCyan,
    changes: [
      '修复所有游戏拥有独立的游戏体验和逻辑',
      '实现完整的动态导入系统，支持230+个游戏按需加载',
      '修复游戏ID空格问题，确保所有游戏正确匹配',
      '优化代码分割，每个游戏生成独立chunk提升加载性能',
      '保持构建成功，所有547款游戏可正常游玩',
    ]
  },
  {
    id: 3,
    date: '2026年5月13日',
    title: '游戏体验优化与问题修复',
    icon: '✨',
    color: NEON_COLORS.neonCyan,
    changes: [
      '修复所有游戏拥有独立的游戏体验和逻辑',
      '将2048游戏修改为3x3网格，更易上手',
      '修复控制台重复key警告（删除重复的游戏push语句）',
      '优化游戏加载系统，实现动态导入',
      '修复factorytycoon重复ID问题',
      '确保所有547款游戏可正常游玩',
    ]
  },
  {
    id: 4,
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
    id: 5,
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
    id: 6,
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
    id: 7,
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
    id: 8,
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

export default function UpdateLogPage() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBg />
      
      <div className="relative z-10 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 头部导航 */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl font-medium flex items-center gap-2"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← 返回首页
            </motion.button>
          </motion.div>

          {/* 标题区域 */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
            <h1 className="text-5xl font-black mb-4"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(255, 107, 157, 0.4))'
              }}
            >
              更新记录
            </h1>
            <p className="text-xl opacity-70">记录摸鱼小游戏库的重要更新和功能改进</p>
          </motion.div>

          {/* 更新日志列表 */}
          <div className="space-y-6">
            {UPDATE_LOGS.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <motion.div
                  className="rounded-3xl overflow-hidden backdrop-blur-xl cursor-pointer"
                  style={{
                    background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8), rgba(15, 15, 26, 0.95))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: expandedId === log.id 
                      ? `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${log.color}30` 
                      : '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="p-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5 flex-1">
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{
                          background: `${log.color}30`,
                          border: `2px solid ${log.color}50`,
                          boxShadow: expandedId === log.id ? `0 0 20px ${log.color}40` : 'none'
                        }}
                        animate={expandedId === log.id ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {log.icon}
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                            {log.title}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-sm" style={{ 
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.6)' 
                          }}>
                            {log.date}
                          </span>
                        </div>
                        <p className="opacity-60">点击查看详细更新内容</p>
                      </div>
                    </div>
                    <motion.div
                      className="text-3xl opacity-60 flex-shrink-0 mt-2"
                      animate={{ rotate: expandedId === log.id ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
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
                        transition={{ duration: 0.4 }}
                      >
                        <div className="px-6 pb-6 pt-2">
                          <div className="border-t border-white/10 pt-5">
                            <ul className="space-y-3">
                              {log.changes.map((change, changeIndex) => (
                                <motion.li
                                  key={changeIndex}
                                  className="flex items-start gap-4 text-base"
                                  initial={{ opacity: 0, x: -15 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: changeIndex * 0.06 }}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                                    style={{ 
                                      backgroundColor: log.color,
                                      boxShadow: `0 0 10px ${log.color}60`
                                    }}
                                  />
                                  <span style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                                    {change}
                                  </span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* 底部统计 */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8), rgba(15, 15, 26, 0.95))',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <span className="text-2xl">📊</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                共 <span style={{ color: NEON_COLORS.neonCyan, fontWeight: 'bold', fontSize: '1.3em' }}>{UPDATE_LOGS.length}</span> 条重要更新记录
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
