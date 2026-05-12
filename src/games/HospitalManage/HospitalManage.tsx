import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { HospitalManageEngine, DepartmentType, Department, Patient, DiseaseType, DISEASE_CONFIG } from './engine';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

const DEPARTMENT_NAMES: Record<DepartmentType, { name: string; emoji: string; desc: string }> = {
  reception: { name: '挂号处', emoji: '📋', desc: '接待患者' },
  general: { name: '内科', emoji: '🩺', desc: '普通诊治' },
  surgery: { name: '外科', emoji: '🔪', desc: '手术治疗' },
  icu: { name: 'ICU', emoji: '💓', desc: '重症监护' },
  pharmacy: { name: '药房', emoji: '💊', desc: '取药处' }
};

const DISEASE_TYPES: DiseaseType[] = ['cold', 'flu', 'fracture', 'headache', 'stomachache', 'injury'];

export default function HospitalManage() {
  const navigate = useNavigate();
  const [engine] = useState(() => new HospitalManageEngine());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [money, setMoney] = useState(2000);
  const [reputation, setReputation] = useState(50);
  const [patientsCured, setPatientsCured] = useState(0);
  const [patientsDead, setPatientsDead] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [waitingRoom, setWaitingRoom] = useState<Patient[]>([]);
  const [day, setDay] = useState(1);
  const [highScore, setHighScore] = useLocalStorage<number>('hospitalmanage_highscore', 0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setMoney(state.money);
    setReputation(state.reputation);
    setPatientsCured(state.patientsCured);
    setPatientsDead(state.patientsDead);
    setDepartments([...state.departments]);
    setWaitingRoom([...state.waitingRoom]);
    setDay(state.day);

    if (state.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      if (state.patientsCured > highScore) {
        setHighScore(state.patientsCured);
      }
    }
  }, [engine, gameStatus, highScore, setHighScore]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStatus === 'playing' });

  const startGame = useCallback(() => {
    engine.reset();
    setGameStatus('playing');
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameStatus !== 'playing') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#e0e0e0';
      for (let y = 0; y < 10; y++) {
        ctx.fillRect(0, y * 60, CANVAS_WIDTH, 2);
      }
      for (let x = 0; x < 12; x++) {
        ctx.fillRect(x * 70, 0, 2, CANVAS_HEIGHT);
      }

      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 50);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏥 医院经营 🏥', CANVAS_WIDTH / 2, 33);

      departments.forEach(dept => {
        const info = DEPARTMENT_NAMES[dept.type];
        
        ctx.fillStyle = dept.patient ? '#ffe0e0' : '#e0f0e0';
        ctx.fillRect(dept.x, dept.y, dept.width, dept.height);
        
        ctx.strokeStyle = selectedPatient ? '#ffd700' : '#aaa';
        ctx.lineWidth = selectedPatient ? 3 : 2;
        ctx.strokeRect(dept.x, dept.y, dept.width, dept.height);

        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(info.emoji, dept.x + dept.width / 2, dept.y + 25);
        ctx.font = '12px Arial';
        ctx.fillText(info.name, dept.x + dept.width / 2, dept.y + 45);

        if (dept.type === 'reception') {
          ctx.font = '10px Arial';
          ctx.fillStyle = '#666';
          ctx.fillText('收治患者', dept.x + dept.width / 2, dept.y + 60);
        }

        if (dept.patient) {
          const disease = DISEASE_CONFIG[dept.patient.disease];
          const progress = dept.patient.treatmentProgress / dept.patient.treatmentRequired;

          ctx.fillStyle = '#fff';
          ctx.font = '20px Arial';
          ctx.fillText(disease.emoji, dept.x + dept.width / 2, dept.y + 55);

          ctx.fillStyle = '#333';
          ctx.font = '10px Arial';
          ctx.fillText(`${dept.patient.name}`, dept.x + dept.width / 2, dept.y + 70);

          ctx.fillStyle = '#ddd';
          ctx.fillRect(dept.x + 10, dept.y + 75, dept.width - 20, 6);
          ctx.fillStyle = progress >= 1 ? '#4ade80' : '#ffa500';
          ctx.fillRect(dept.x + 10, dept.y + 75, (dept.width - 20) * progress, 6);
        }
      });

      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(20, 120, 160, 300);
      ctx.strokeStyle = '#cc5555';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 120, 160, 300);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('候诊区', 100, 140);

      if (waitingRoom.length === 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('暂无患者', 100, 220);
      } else {
        waitingRoom.forEach((patient, i) => {
          const y = 155 + i * 48;
          const disease = DISEASE_CONFIG[patient.disease];
          const patienceRatio = patient.patience / patient.maxPatience;

          ctx.fillStyle = selectedPatient?.id === patient.id ? '#ffd700' : 
            patienceRatio > 0.5 ? '#fff' : patienceRatio > 0.25 ? '#ffe0e0' : '#ffcccc';
          ctx.fillRect(25, y, 150, 42);

          ctx.strokeStyle = selectedPatient?.id === patient.id ? '#ff8800' :
            patienceRatio > 0.5 ? '#aaa' : patienceRatio > 0.25 ? '#ff8800' : '#ff4444';
          ctx.lineWidth = selectedPatient?.id === patient.id ? 2 : 1;
          ctx.strokeRect(25, y, 150, 42);

          ctx.font = '18px Arial';
          ctx.fillText(disease.emoji, 40, y + 22);

          ctx.fillStyle = '#333';
          ctx.font = '11px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(`${patient.name}`, 55, y + 16);
          ctx.fillStyle = '#666';
          ctx.font = '9px Arial';
          ctx.fillText(`${disease.name}`, 55, y + 28);
          ctx.fillText(`费用: ${disease.cost}💰`, 55, y + 38);

          ctx.fillStyle = patienceRatio > 0.5 ? '#4ade80' : patienceRatio > 0.25 ? '#ffa500' : '#ff4444';
          ctx.fillRect(25, y + 40, 150 * patienceRatio, 3);

          ctx.textAlign = 'center';
        });
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, CANVAS_HEIGHT - 45, CANVAS_WIDTH, 45);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`💰 ${money}`, 20, CANVAS_HEIGHT - 20);

      ctx.fillStyle = reputation > 50 ? '#4ade80' : reputation > 25 ? '#ffa500' : '#ff4444';
      ctx.fillText(`⭐ ${reputation}%`, 150, CANVAS_HEIGHT - 20);

      ctx.fillStyle = '#4ade80';
      ctx.fillText(`💉 治愈: ${patientsCured}`, 280, CANVAS_HEIGHT - 20);

      ctx.fillStyle = '#ff4444';
      ctx.fillText(`💀 死亡: ${patientsDead}`, 420, CANVAS_HEIGHT - 20);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText(`📅 第${day}天`, CANVAS_WIDTH - 80, CANVAS_HEIGHT - 20);
      ctx.fillText(`🏆 ${highScore}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    };

    draw();
  }, [gameStatus, departments, waitingRoom, money, reputation, patientsCured, patientsDead, day, highScore, selectedPatient]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < waitingRoom.length; i++) {
      const patientY = 155 + i * 48;
      if (x >= 25 && x <= 175 && y >= patientY && y <= patientY + 42) {
        setSelectedPatient(waitingRoom[i]);
        return;
      }
    }

    for (const dept of departments) {
      if (x >= dept.x && x <= dept.x + dept.width && y >= dept.y && y <= dept.y + dept.height) {
        if (dept.type === 'reception' && selectedPatient) {
          engine.assignPatient(selectedPatient.id, 'general');
          setSelectedPatient(null);
        } else if (dept.patient) {
          const progress = dept.patient.treatmentProgress / dept.patient.treatmentRequired;
          if (progress >= 1) {
            engine.dischargePatient(dept.type);
          }
        }
        return;
      }
    }
  }, [engine, gameStatus, departments, waitingRoom, selectedPatient]);

  const handleNextDay = useCallback(() => {
    engine.nextDay();
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameStatus('idle');
  }, [engine]);

  const handleUpgrade = useCallback((type: DepartmentType) => {
    engine.upgradeDepartment(type);
  }, [engine]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <motion.h1
        className="text-3xl font-bold"
        style={{ color: NEON_COLORS.neonPink }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        🏥 医院经营 🏥
      </motion.h1>

      <div className="flex items-center justify-between w-full max-w-[720px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm glass-card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>资金</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{money} 💰</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonPink }}>声望</div>
          <div className="text-xl font-bold" style={{ color: reputation > 50 ? NEON_COLORS.neonGreen : reputation > 25 ? NEON_COLORS.gold : NEON_COLORS.danger }}>
            {reputation}%
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonGreen }}>治愈</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{patientsCured}人</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonPurple }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{highScore}</div>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="rounded-2xl cursor-pointer"
          style={{
            boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
            border: `2px solid ${NEON_COLORS.neonPink}40`
          }}
        />

        <AnimatePresence>
          {gameStatus === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(240, 248, 255, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🏥
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                医院经营
              </div>
              <div className="text-gray-500 mb-8 text-center px-8">
                <p>经营你的医院</p>
                <p>收治患者，治愈疾病，拯救生命！</p>
              </div>
              <motion.button
                onClick={startGame}
                className="px-12 py-4 rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: '#fff',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开门营业
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(240, 248, 255, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                💔
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
                医院倒闭
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.neonGreen }}>
                治愈患者: {patientsCured} 人
              </div>
              <div className="text-lg mb-2" style={{ color: NEON_COLORS.danger }}>
                死亡患者: {patientsDead} 人
              </div>
              {patientsCured >= highScore && patientsCured > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: NEON_COLORS.neonGreen }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}
              <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonPurple }}>
                最高记录: {highScore} 人
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-12 py-4 rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: '#fff',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                重开医院
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {gameStatus === 'playing' && (
        <div className="w-full max-w-[720px] glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm" style={{ color: NEON_COLORS.gold }}>
              {selectedPatient ? `已选择: ${selectedPatient.name}` : '点击患者选择，再点击挂号处收治'}
            </div>
            <motion.button
              onClick={handleNextDay}
              className="px-4 py-2 rounded-lg font-bold text-sm"
              style={{ backgroundColor: `${NEON_COLORS.neonCyan}30`, color: NEON_COLORS.neonCyan }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📅 下一天
            </motion.button>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-3">
            {DISEASE_TYPES.slice(0, 5).map(disease => {
              const config = DISEASE_CONFIG[disease];
              return (
                <div
                  key={disease}
                  className="flex flex-col items-center p-2 rounded-lg"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <span className="text-xl">{config.emoji}</span>
                  <span className="text-xs font-bold">{config.name}</span>
                  <span className="text-xs" style={{ color: NEON_COLORS.gold }}>{config.cost}💰</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 text-xs opacity-70">
            <div className="flex items-center gap-1">
              <span>🩺</span><span>内科: 感冒/流感/头痛</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔪</span><span>外科: 骨折/外伤</span>
            </div>
            <div className="flex items-center gap-1">
              <span>💓</span><span>ICU: 重症</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>点击患者选择，再点击挂号处收治到内科</div>
        <div>等待治疗完成后点击治愈，注意患者耐心值！</div>
      </div>
    </div>
  );
}
