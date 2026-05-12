export type DepartmentType = 'reception' | 'general' | 'surgery' | 'icu' | 'pharmacy';
export type PatientStatus = 'waiting' | 'examining' | 'treating' | 'leaving' | 'cured' | 'dead';
export type DiseaseType = 'cold' | 'flu' | 'fracture' | 'headache' | 'stomachache' | 'injury';

export interface Patient {
  id: number;
  name: string;
  age: number;
  disease: DiseaseType;
  severity: number;
  status: PatientStatus;
  patience: number;
  maxPatience: number;
  treatmentProgress: number;
  treatmentRequired: number;
  cost: number;
  arrivedAt: number;
}

export interface Department {
  type: DepartmentType;
  x: number;
  y: number;
  width: number;
  height: number;
  doctors: number;
  patient: Patient | null;
  efficiency: number;
}

export interface HospitalState {
  money: number;
  reputation: number;
  patientsCured: number;
  patientsDead: number;
  departments: Department[];
  waitingRoom: Patient[];
  day: number;
  gameOver: boolean;
}

export const DISEASE_CONFIG: Record<DiseaseType, { 
  name: string; 
  emoji: string;
  treatmentTime: number;
  cost: number;
  reward: number;
  severity: number;
  department: DepartmentType;
  color: string 
}> = {
  cold: {
    name: '感冒',
    emoji: '🤧',
    treatmentTime: 2000,
    cost: 50,
    reward: 100,
    severity: 1,
    department: 'general',
    color: '#3498db'
  },
  flu: {
    name: '流感',
    emoji: '🦠',
    treatmentTime: 4000,
    cost: 100,
    reward: 200,
    severity: 2,
    department: 'general',
    color: '#e74c3c'
  },
  fracture: {
    name: '骨折',
    emoji: '🦴',
    treatmentTime: 6000,
    cost: 200,
    reward: 400,
    severity: 3,
    department: 'surgery',
    color: '#9b59b6'
  },
  headache: {
    name: '头痛',
    emoji: '🤕',
    treatmentTime: 1500,
    cost: 30,
    reward: 80,
    severity: 1,
    department: 'general',
    color: '#f39c12'
  },
  stomachache: {
    name: '腹痛',
    emoji: '🤢',
    treatmentTime: 3000,
    cost: 80,
    reward: 180,
    severity: 2,
    department: 'general',
    color: '#1abc9c'
  },
  injury: {
    name: '外伤',
    emoji: '🩹',
    treatmentTime: 5000,
    cost: 150,
    reward: 350,
    severity: 3,
    department: 'surgery',
    color: '#e67e22'
  }
};

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const INITIAL_MONEY = 2000;
const INITIAL_REPUTATION = 50;
const MAX_REPUTATION = 100;

const PATIENT_NAMES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '小明', '小红', '小华', '小丽', '阿强', '阿珍', '阿美', '阿伟'
];

export class HospitalManageEngine {
  private money: number;
  private reputation: number;
  private patientsCured: number;
  private patientsDead: number;
  private departments: Department[];
  private waitingRoom: Patient[];
  private day: number;
  private gameOver: boolean;
  private lastUpdate: number;
  private patientIdCounter: number;
  private patientSpawnTimer: number;
  private patientSpawnInterval: number;

  constructor() {
    this.money = INITIAL_MONEY;
    this.reputation = INITIAL_REPUTATION;
    this.patientsCured = 0;
    this.patientsDead = 0;
    this.departments = [];
    this.waitingRoom = [];
    this.day = 1;
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.patientIdCounter = 0;
    this.patientSpawnTimer = 0;
    this.patientSpawnInterval = 4000;
    this.init();
  }

  private init(): void {
    this.departments = [
      { type: 'reception', x: 20, y: 20, width: 150, height: 80, doctors: 1, patient: null, efficiency: 1 },
      { type: 'general', x: 200, y: 20, width: 150, height: 80, doctors: 2, patient: null, efficiency: 1 },
      { type: 'surgery', x: 380, y: 20, width: 150, height: 80, doctors: 1, patient: null, efficiency: 1.5 },
      { type: 'icu', x: 560, y: 20, width: 120, height: 80, doctors: 1, patient: null, efficiency: 2 },
      { type: 'pharmacy', x: 560, y: 120, width: 120, height: 60, doctors: 1, patient: null, efficiency: 1 }
    ];
  }

  getState(): HospitalState {
    return {
      money: this.money,
      reputation: this.reputation,
      patientsCured: this.patientsCured,
      patientsDead: this.patientsDead,
      departments: [...this.departments],
      waitingRoom: [...this.waitingRoom],
      day: this.day,
      gameOver: this.gameOver
    };
  }

  getDiseaseConfig(disease: DiseaseType) {
    return DISEASE_CONFIG[disease];
  }

  assignPatient(patientId: number, departmentType: DepartmentType): boolean {
    const patient = this.waitingRoom.find(p => p.id === patientId);
    if (!patient) return false;

    const disease = DISEASE_CONFIG[patient.disease];
    if (disease.department !== departmentType && departmentType !== 'general') return false;

    const department = this.departments.find(d => d.type === departmentType);
    if (!department || department.patient !== null) return false;

    if (this.money < disease.cost) return false;

    this.money -= disease.cost;
    patient.status = 'examining';
    department.patient = patient;
    this.waitingRoom = this.waitingRoom.filter(p => p.id !== patientId);

    return true;
  }

  dischargePatient(departmentType: DepartmentType): boolean {
    const department = this.departments.find(d => d.type === departmentType);
    if (!department || !department.patient) return false;

    const patient = department.patient;
    const disease = DISEASE_CONFIG[patient.disease];

    this.money += disease.reward;
    this.patientsCured++;
    this.reputation = Math.min(MAX_REPUTATION, this.reputation + 5);

    department.patient = null;

    return true;
  }

  upgradeDepartment(departmentType: DepartmentType): boolean {
    const department = this.departments.find(d => d.type === departmentType);
    if (!department) return false;

    const cost = 500;
    if (this.money < cost) return false;

    this.money -= cost;
    department.efficiency += 0.2;

    return true;
  }

  private spawnPatient(): void {
    const diseases: DiseaseType[] = ['cold', 'flu', 'fracture', 'headache', 'stomachache', 'injury'];
    const weights = [0.3, 0.2, 0.15, 0.15, 0.1, 0.1];
    
    let random = Math.random();
    let selectedDisease: DiseaseType = 'cold';
    for (let i = 0; i < diseases.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedDisease = diseases[i];
        break;
      }
    }

    const disease = DISEASE_CONFIG[selectedDisease];
    const patient: Patient = {
      id: this.patientIdCounter++,
      name: PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)],
      age: Math.floor(Math.random() * 60) + 10,
      disease: selectedDisease,
      severity: disease.severity,
      status: 'waiting',
      patience: 15000 - disease.severity * 3000,
      maxPatience: 15000 - disease.severity * 3000,
      treatmentProgress: 0,
      treatmentRequired: disease.treatmentTime,
      cost: disease.cost,
      arrivedAt: Date.now()
    };

    this.waitingRoom.push(patient);
  }

  tick(): void {
    if (this.gameOver) return;

    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    this.patientSpawnTimer += deltaTime;
    if (this.patientSpawnTimer >= this.patientSpawnInterval && this.waitingRoom.length < 6) {
      this.spawnPatient();
      this.patientSpawnTimer = 0;
      this.patientSpawnInterval = Math.max(2000, this.patientSpawnInterval - 20);
    }

    for (const department of this.departments) {
      if (department.patient) {
        department.patient.treatmentProgress += deltaTime * department.efficiency;

        if (department.patient.treatmentProgress >= department.patient.treatmentRequired) {
          department.patient.status = 'leaving';
        }
      }
    }

    for (const patient of this.waitingRoom) {
      patient.patience -= deltaTime;
      if (patient.patience <= 0) {
        this.waitingRoom = this.waitingRoom.filter(p => p.id !== patient.id);
        this.patientsDead++;
        this.reputation = Math.max(0, this.reputation - 10);
      }
    }

    this.reputation = Math.max(0, Math.min(MAX_REPUTATION, this.reputation));

    if (this.reputation <= 0 || this.money < -500) {
      this.gameOver = true;
    }
  }

  nextDay(): void {
    this.day++;
    this.patientSpawnInterval = Math.max(2000, this.patientSpawnInterval - 100);
  }

  reset(): void {
    this.money = INITIAL_MONEY;
    this.reputation = INITIAL_REPUTATION;
    this.patientsCured = 0;
    this.patientsDead = 0;
    this.waitingRoom = [];
    this.day = 1;
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.patientSpawnTimer = 0;
    this.patientSpawnInterval = 4000;
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
