import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Activity, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Upload,
  UserPlus,
  X,
  Edit
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Patient, VitalSign, LabResult, IOData, Prescription, VideoExam, DiagnosticExam } from './types';

// Initial Mock Data
const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    name: '김예린',
    room: '501',
    age: 28,
    doctor: '이영희',
    residentNumber: '830324001',
    address: '서울시 강남구 역삼동',
    chartNumber: 'C-20240329-001',
    targetVitals: 'HR: 60-100, BP: 120/80',
    gender: 'F',
    department: 'NS',
    soap: 'S: 환자 두통 호소함.\nO: BP 130/85, HR 80.\nA: 경미한 고혈압 증세.\nP: 경과 관찰 및 필요시 진통제 투여.',
    nursingRecord: '환자 오전 8시경 두통 호소하여 활력징후 체크함. 특이사항 없음.',
    memo: '특이사항 없음'
  },
  {
    id: '2',
    name: '양재원',
    room: '502',
    age: 32,
    doctor: '최민수',
    residentNumber: '941115001',
    address: '서울시 서초구 서초동',
    chartNumber: 'C-20240329-002',
    targetVitals: 'HR: 70-90, BP: 110/70',
    gender: 'M',
    department: 'TS',
    soap: '',
    nursingRecord: '',
    memo: ''
  },
];

const INITIAL_VITALS: VitalSign[] = [
  { id: 'v1', patientId: '1', timestamp: '08:00', hr: 72, bp: '120/80', rr: 18, bt: 36.5 },
  { id: 'v2', patientId: '1', timestamp: '10:00', hr: 75, bp: '125/82', rr: 20, bt: 36.7 },
  { id: 'v3', patientId: '1', timestamp: '12:00', hr: 80, bp: '130/85', rr: 19, bt: 36.8 },
];

const INITIAL_LABS: LabResult[] = [
  { id: 'l1', patientId: '1', timestamp: '09:00', testName: 'CBC', value1: 'WBC 7.5', value2: 'Hb 14.2', numValue1: 7.5, numValue2: 14.2, doctor: '이영희' },
];

const INITIAL_IO: IOData[] = [
  { id: 'i1', patientId: '1', timestamp: '08:00', input: 'Water 200cc', output: 'Urine 300cc', numInput: 200, numOutput: 300, doctor: '이영희' },
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  { id: 'p1', patientId: '1', timestamp: '08:30', name: 'Tylenol', content: '500mg PO TID', doctor: '이영희' },
];

const INITIAL_VIDEO_EXAMS: VideoExam[] = [
  { id: 've1', patientId: '1', timestamp: '11:00', examName: 'Chest X-Ray', finding: 'No active lung lesion', doctor: '이영희' },
];

const INITIAL_DIAGNOSTIC_EXAMS: DiagnosticExam[] = [
  { id: 'de1', patientId: '1', timestamp: '11:30', examName: 'EKG', result: 'Normal Sinus Rhythm', doctor: '이영희' },
];

type TabType = 'VS' | 'LAB' | 'IO' | 'PRESCRIPTION';
type PrescriptionSubTab = 'MED' | 'VIDEO' | 'DIAG';

// Persistence Keys
const STORAGE_KEYS = {
  PATIENTS: 'emr_patients',
  VITALS: 'emr_vitals',
  LABS: 'emr_labs',
  IO: 'emr_io',
  PRESCRIPTIONS: 'emr_prescriptions',
  VIDEO_EXAMS: 'emr_video_exams',
  DIAGNOSTIC_EXAMS: 'emr_diagnostic_exams',
  SELECTED_PATIENT_ID: 'emr_selected_patient_id',
};

const getStorageData = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
};

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => getStorageData(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS));
  const [selectedPatient, setSelectedPatient] = useState<Patient>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.SELECTED_PATIENT_ID);
    const initialPatients = getStorageData(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    return initialPatients.find((p: Patient) => p.id === savedId) || initialPatients[0];
  });
  const [vitals, setVitals] = useState<VitalSign[]>(() => getStorageData(STORAGE_KEYS.VITALS, INITIAL_VITALS));
  const [labs, setLabs] = useState<LabResult[]>(() => getStorageData(STORAGE_KEYS.LABS, INITIAL_LABS));
  const [io, setIO] = useState<IOData[]>(() => getStorageData(STORAGE_KEYS.IO, INITIAL_IO));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => getStorageData(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS));
  const [videoExams, setVideoExams] = useState<VideoExam[]>(() => getStorageData(STORAGE_KEYS.VIDEO_EXAMS, INITIAL_VIDEO_EXAMS));
  const [diagnosticExams, setDiagnosticExams] = useState<DiagnosticExam[]>(() => getStorageData(STORAGE_KEYS.DIAGNOSTIC_EXAMS, INITIAL_DIAGNOSTIC_EXAMS));
  
  const [activeTab, setActiveTab] = useState<TabType>('VS');
  const [prescriptionSubTab, setPrescriptionSubTab] = useState<PrescriptionSubTab>('MED');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);

  // Persistence Effects
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(vitals));
  }, [vitals]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LABS, JSON.stringify(labs));
  }, [labs]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IO, JSON.stringify(io));
  }, [io]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
  }, [prescriptions]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIDEO_EXAMS, JSON.stringify(videoExams));
  }, [videoExams]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_EXAMS, JSON.stringify(diagnosticExams));
  }, [diagnosticExams]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PATIENT_ID, selectedPatient.id);
  }, [selectedPatient.id]);

  // Filtered Data
  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.includes(searchQuery) || p.room.includes(searchQuery)
    );
  }, [patients, searchQuery]);

  const currentPatientVitals = useMemo(() => vitals.filter(v => v.patientId === selectedPatient.id), [vitals, selectedPatient.id]);
  const currentPatientLabs = useMemo(() => labs.filter(l => l.patientId === selectedPatient.id), [labs, selectedPatient.id]);
  const currentPatientIO = useMemo(() => io.filter(i => i.patientId === selectedPatient.id), [io, selectedPatient.id]);
  const currentPatientPrescriptions = useMemo(() => prescriptions.filter(p => p.patientId === selectedPatient.id), [prescriptions, selectedPatient.id]);
  const currentPatientVideoExams = useMemo(() => videoExams.filter(v => v.patientId === selectedPatient.id), [videoExams, selectedPatient.id]);
  const currentPatientDiagnosticExams = useMemo(() => diagnosticExams.filter(d => d.patientId === selectedPatient.id), [diagnosticExams, selectedPatient.id]);

  // Handlers
  const handleAddRow = (type: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const id = Math.random().toString(36).substr(2, 9);

    if (type === 'VS') {
      setVitals([...vitals, { id, patientId: selectedPatient.id, timestamp: now, hr: 0, bp: '', rr: 0, bt: 0 }]);
    } else if (type === 'LAB') {
      setLabs([...labs, { id, patientId: selectedPatient.id, timestamp: now, testName: '', value1: '', value2: '', numValue1: 0, numValue2: 0, doctor: selectedPatient.doctor }]);
    } else if (type === 'IO') {
      setIO([...io, { id, patientId: selectedPatient.id, timestamp: now, input: '', output: '', numInput: 0, numOutput: 0, doctor: selectedPatient.doctor }]);
    } else if (type === 'MED') {
      setPrescriptions([...prescriptions, { id, patientId: selectedPatient.id, timestamp: now, name: '', content: '', doctor: selectedPatient.doctor }]);
    } else if (type === 'VIDEO') {
      setVideoExams([...videoExams, { id, patientId: selectedPatient.id, timestamp: now, examName: '', finding: '', doctor: selectedPatient.doctor }]);
    } else if (type === 'DIAG') {
      setDiagnosticExams([...diagnosticExams, { id, patientId: selectedPatient.id, timestamp: now, examName: '', result: '', doctor: selectedPatient.doctor }]);
    }
  };

  const updateRecord = (type: string, id: string, field: string, value: any) => {
    if (type === 'VS') {
      setVitals(vitals.map(v => v.id === id ? { ...v, [field]: value } : v));
    } else if (type === 'LAB') {
      setLabs(labs.map(l => l.id === id ? { ...l, [field]: value } : l));
    } else if (type === 'IO') {
      setIO(io.map(i => i.id === id ? { ...i, [field]: value } : i));
    } else if (type === 'PRESCRIPTION') {
      setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, [field]: value } : p));
    } else if (type === 'VIDEO') {
      setVideoExams(videoExams.map(v => v.id === id ? { ...v, [field]: value } : v));
    } else if (type === 'DIAG') {
      setDiagnosticExams(diagnosticExams.map(d => d.id === id ? { ...d, [field]: value } : d));
    }
  };

  const deleteRecord = (type: string, id: string) => {
    if (type === 'VS') setVitals(vitals.filter(v => v.id !== id));
    else if (type === 'LAB') setLabs(labs.filter(l => l.id !== id));
    else if (type === 'IO') setIO(io.filter(i => i.id !== id));
    else if (type === 'PRESCRIPTION') setPrescriptions(prescriptions.filter(p => p.id !== id));
    else if (type === 'VIDEO') setVideoExams(videoExams.filter(v => v.id !== id));
    else if (type === 'DIAG') setDiagnosticExams(diagnosticExams.filter(d => d.id !== id));
  };

  const prescriptionChartData = useMemo(() => {
    const data: any[] = [];
    const allTimes = Array.from(new Set([
      ...currentPatientPrescriptions.map(p => p.timestamp),
      ...currentPatientVideoExams.map(v => v.timestamp),
      ...currentPatientDiagnosticExams.map(d => d.timestamp)
    ])).sort();

    allTimes.forEach(time => {
      data.push({
        timestamp: time,
        meds: currentPatientPrescriptions.filter(p => p.timestamp === time).length,
        video: currentPatientVideoExams.filter(v => v.timestamp === time).length,
        diag: currentPatientDiagnosticExams.filter(d => d.timestamp === time).length,
      });
    });
    return data;
  }, [currentPatientPrescriptions, currentPatientVideoExams, currentPatientDiagnosticExams]);

  const handlePatientUpdate = (field: keyof Patient, value: any) => {
    const updatedPatient = { ...selectedPatient, [field]: value };
    setSelectedPatient(updatedPatient);
    setPatients(patients.map(p => p.id === selectedPatient.id ? updatedPatient : p));
  };

  const handleSavePatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingPatient) {
      const updatedPatient: Patient = {
        ...editingPatient,
        name: formData.get('name') as string,
        room: formData.get('room') as string,
        age: parseInt(formData.get('age') as string),
        doctor: formData.get('doctor') as string,
        residentNumber: formData.get('residentNumber') as string,
        address: formData.get('address') as string,
        gender: formData.get('gender') as string,
        department: formData.get('department') as string,
        chartNumber: formData.get('chartNumber') as string,
      };
      setPatients(patients.map(p => p.id === editingPatient.id ? updatedPatient : p));
      if (selectedPatient.id === editingPatient.id) {
        setSelectedPatient(updatedPatient);
      }
    } else {
      const newPatient: Patient = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.get('name') as string,
        room: formData.get('room') as string,
        age: parseInt(formData.get('age') as string),
        doctor: formData.get('doctor') as string,
        residentNumber: formData.get('residentNumber') as string,
        address: formData.get('address') as string,
        gender: formData.get('gender') as string,
        department: formData.get('department') as string,
        chartNumber: (formData.get('chartNumber') as string) || `C-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000)}`,
        targetVitals: 'HR: 60-100, BP: 120/80',
      };
      setPatients([...patients, newPatient]);
    }
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingForId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoExams(videoExams.map(v => v.id === uploadingForId ? { ...v, imageUrl: reader.result as string } : v));
        setUploadingForId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePatient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('정말 이 환자 정보를 삭제하시겠습니까?')) {
      const updatedPatients = patients.filter(p => p.id !== id);
      setPatients(updatedPatients);
      if (selectedPatient.id === id && updatedPatients.length > 0) {
        setSelectedPatient(updatedPatients[0]);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f0f0] font-sans text-[#333] overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0 }}
        className={cn(
          "bg-white border-r border-gray-300 flex flex-col transition-all duration-300 relative",
          !sidebarOpen && "overflow-hidden"
        )}
      >
        <div className="p-3 bg-[#ff80ff] text-white flex items-center justify-between">
          <span className="font-bold text-sm">환자리스트</span>
          <button onClick={() => setSidebarOpen(false)} className="hover:bg-white/20 p-1 rounded">
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="p-2 border-b border-gray-200 bg-gray-50 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <button 
              onClick={() => { setEditingPatient(selectedPatient); setIsPatientModalOpen(true); }}
              className="flex items-center gap-1 text-blue-600 hover:underline font-bold"
            >
              <Edit size={14} /> 수정
            </button>
            <button 
              onClick={() => setIsPatientModalOpen(true)}
              className="flex items-center gap-1 text-blue-600 hover:underline font-bold"
            >
              <UserPlus size={14} /> 환자추가
            </button>
            <button className="ml-auto flex items-center gap-1 text-blue-600 hover:underline">
              <RefreshCw size={10} /> 새로고침
            </button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="검색..." 
              className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-1.5 text-gray-400" size={14} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {filteredPatients.map(p => (
              <li 
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={cn(
                  "p-3 cursor-pointer transition-colors hover:bg-blue-50 border-b border-gray-200",
                  selectedPatient.id === p.id ? "bg-blue-100 border-l-4 border-blue-500" : ""
                )}
              >
                <div className="font-bold text-sm">
                  {p.name} / {p.residentNumber} / {p.gender} / {p.department}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.aside>

      {/* Toggle Button when sidebar is closed */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff80ff] text-white p-1 rounded-r shadow-md z-10"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Patient Info Header */}
        <header className="bg-[#ff80ff] p-2 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="w-24"></div> {/* Spacer */}
            <h1 className="text-white text-xl font-bold text-left flex-1">환자기본정보</h1>
            <button 
              onClick={() => { setEditingPatient(selectedPatient); setIsPatientModalOpen(true); }}
              className="bg-white text-[#ff80ff] px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 flex items-center gap-1 shadow-sm mr-2"
            >
              <Edit size={14} /> 수정
            </button>
            <button 
              onClick={() => setIsPatientModalOpen(true)}
              className="bg-white text-[#ff80ff] px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 flex items-center gap-1 shadow-sm"
            >
              <UserPlus size={14} /> 환자추가
            </button>
          </div>
          <div className="grid grid-cols-7 border border-gray-400 bg-white text-center text-xs">
            <div className="bg-gray-200 py-1 border-r border-gray-400">환자번호</div>
            <div className="bg-gray-200 py-1 border-r border-gray-400">환자명</div>
            <div className="bg-gray-200 py-1 border-r border-gray-400">병실</div>
            <div className="bg-gray-200 py-1 border-r border-gray-400">나이</div>
            <div className="bg-gray-200 py-1 border-r border-gray-400">주치의</div>
            <div className="bg-gray-200 py-1 border-r border-gray-400">주민등록번호</div>
            <div className="bg-gray-200 py-1">거주지</div>
            
            <div className="py-2 border-r border-gray-400 font-medium">
              <input 
                className="w-full text-center outline-none bg-transparent" 
                value={selectedPatient.chartNumber || ''} 
                onChange={(e) => handlePatientUpdate('chartNumber', e.target.value)}
              />
            </div>
            <div className="py-2 border-r border-gray-400 font-medium">{selectedPatient.name}</div>
            <div className="py-2 border-r border-gray-400 font-medium">{selectedPatient.room}</div>
            <div className="py-2 border-r border-gray-400 font-medium">{selectedPatient.age}</div>
            <div className="py-2 border-r border-gray-400 font-medium">{selectedPatient.doctor}</div>
            <div className="py-2 border-r border-gray-400 font-medium">{selectedPatient.residentNumber}</div>
            <div className="py-2 font-medium">{selectedPatient.address}</div>
          </div>
        </header>

        {/* Middle Section: SOAP & Nursing Records */}
        <div className="p-2 grid grid-cols-12 gap-2 flex-shrink-0">
          <div className="col-span-5 border border-gray-400 flex flex-col">
            <div className="bg-gray-500 text-white text-center py-1 text-sm font-bold">SOAP</div>
            <textarea 
              className="flex-1 p-2 text-xs resize-none h-24 focus:outline-none" 
              value={selectedPatient.soap || ''} 
              onChange={(e) => handlePatientUpdate('soap', e.target.value)}
              placeholder="SOAP 기록을 입력하세요..."
            />
            <div className="bg-blue-200 h-8 border-t border-gray-400"></div>
          </div>
          <div className="col-span-4 border border-gray-400 flex flex-col">
            <div className="bg-gray-500 text-white text-center py-1 text-sm font-bold">간호기록</div>
            <textarea 
              className="flex-1 p-2 text-xs resize-none h-24 focus:outline-none" 
              value={selectedPatient.nursingRecord || ''} 
              onChange={(e) => handlePatientUpdate('nursingRecord', e.target.value)}
              placeholder="간호기록을 입력하세요..."
            />
            <div className="bg-blue-200 h-8 border-t border-gray-400"></div>
          </div>
          <div className="col-span-3 border border-gray-400 flex flex-col bg-white">
            <div className="grid grid-cols-2 text-xs h-full">
              <div className="bg-gray-200 p-2 border-r border-b border-gray-400 flex items-center justify-center font-bold">환자차트번호</div>
              <div className="p-2 border-b border-gray-400 flex items-center justify-center">
                <input 
                  className="w-full text-center outline-none bg-transparent" 
                  value={selectedPatient.chartNumber || ''} 
                  onChange={(e) => handlePatientUpdate('chartNumber', e.target.value)}
                />
              </div>
              <div className="bg-gray-200 p-2 border-r border-b border-gray-400 flex items-center justify-center font-bold">목표활력징후</div>
              <div className="p-2 border-b border-gray-400 flex items-center justify-center text-[10px]">
                <input 
                  className="w-full text-center outline-none bg-transparent" 
                  value={selectedPatient.targetVitals || ''} 
                  onChange={(e) => handlePatientUpdate('targetVitals', e.target.value)}
                />
              </div>
              <div className="bg-gray-200 p-2 border-r border-gray-400 flex items-center justify-center font-bold">메모</div>
              <div className="bg-yellow-100 p-0 flex items-center justify-center overflow-hidden">
                <textarea 
                  className="w-full h-full p-2 text-xs resize-none bg-transparent focus:outline-none" 
                  value={selectedPatient.memo || ''} 
                  onChange={(e) => handlePatientUpdate('memo', e.target.value)}
                  placeholder="메모..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex-1 p-2 flex flex-col overflow-hidden">
          <div className="flex justify-between items-end mb-0">
            <div className="flex gap-1">
              {['VS', 'LAB', 'IO', 'PRESCRIPTION'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as TabType)}
                  className={cn(
                    "px-4 py-2 rounded-t-lg border border-b-0 border-gray-400 text-sm font-bold transition-colors",
                    activeTab === tab ? "bg-white text-black" : "bg-gray-300 text-gray-600"
                  )}
                >
                  {tab === 'VS' ? 'V/S 체크' : tab === 'LAB' ? '검사수치' : tab === 'IO' ? 'I/O 체크' : '처방내역'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-gray-300 border border-gray-400 p-2 flex flex-col overflow-hidden gap-4 overflow-y-auto">
            {activeTab === 'VS' && (
              <div className="flex flex-col gap-1">
                <div className="bg-white border border-gray-400 overflow-auto relative min-h-[200px]">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="sticky top-0 bg-gray-500 text-white z-10">
                      <tr>
                        <th className="py-1 border border-gray-400">확인일시</th>
                        <th className="py-1 border border-gray-400">HR</th>
                        <th className="py-1 border border-gray-400">BP</th>
                        <th className="py-1 border border-gray-400">RR</th>
                        <th className="py-1 border border-gray-400">BT</th>
                        <th className="py-1 border border-gray-400 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPatientVitals.map(v => (
                        <tr key={v.id} className="hover:bg-gray-50 group">
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={v.timestamp} onChange={(e) => updateRecord('VS', v.id, 'timestamp', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" type="number" value={v.hr} onChange={(e) => updateRecord('VS', v.id, 'hr', parseInt(e.target.value) || 0)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={v.bp} onChange={(e) => updateRecord('VS', v.id, 'bp', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" type="number" value={v.rr} onChange={(e) => updateRecord('VS', v.id, 'rr', parseInt(e.target.value) || 0)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" type="number" step="0.1" value={v.bt} onChange={(e) => updateRecord('VS', v.id, 'bt', parseFloat(e.target.value) || 0)} /></td>
                          <td className="border border-gray-200"><button onClick={() => deleteRecord('VS', v.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={() => handleAddRow('VS')} className="bg-[#00a65a] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#008d4c] flex items-center gap-1 shadow-sm"><Plus size={14} /> 기록 추가</button>
                </div>
              </div>
            )}

            {activeTab === 'LAB' && (
              <div className="flex flex-col gap-1">
                <div className="bg-white border border-gray-400 overflow-auto relative min-h-[200px]">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="sticky top-0 bg-gray-500 text-white z-10">
                      <tr>
                        <th className="py-1 border border-gray-400">확인일시</th>
                        <th className="py-1 border border-gray-400">검사명</th>
                        <th className="py-1 border border-gray-400">수치1</th>
                        <th className="py-1 border border-gray-400">수치2</th>
                        <th className="py-1 border border-gray-400">담당의</th>
                        <th className="py-1 border border-gray-400 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPatientLabs.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50 group">
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={l.timestamp} onChange={(e) => updateRecord('LAB', l.id, 'timestamp', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={l.testName} onChange={(e) => updateRecord('LAB', l.id, 'testName', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={l.value1} onChange={(e) => updateRecord('LAB', l.id, 'value1', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={l.value2} onChange={(e) => updateRecord('LAB', l.id, 'value2', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={l.doctor} onChange={(e) => updateRecord('LAB', l.id, 'doctor', e.target.value)} /></td>
                          <td className="border border-gray-200"><button onClick={() => deleteRecord('LAB', l.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={() => handleAddRow('LAB')} className="bg-[#00a65a] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#008d4c] flex items-center gap-1 shadow-sm"><Plus size={14} /> 기록 추가</button>
                </div>
              </div>
            )}

            {activeTab === 'IO' && (
              <div className="flex flex-col gap-1">
                <div className="bg-white border border-gray-400 overflow-auto relative min-h-[200px]">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="sticky top-0 bg-gray-500 text-white z-10">
                      <tr>
                        <th className="py-1 border border-gray-400">확인일시</th>
                        <th className="py-1 border border-gray-400">Input</th>
                        <th className="py-1 border border-gray-400">Output</th>
                        <th className="py-1 border border-gray-400">담당의</th>
                        <th className="py-1 border border-gray-400 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPatientIO.map(i => (
                        <tr key={i.id} className="hover:bg-gray-50 group">
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={i.timestamp} onChange={(e) => updateRecord('IO', i.id, 'timestamp', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={i.input} onChange={(e) => updateRecord('IO', i.id, 'input', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={i.output} onChange={(e) => updateRecord('IO', i.id, 'output', e.target.value)} /></td>
                          <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={i.doctor} onChange={(e) => updateRecord('IO', i.id, 'doctor', e.target.value)} /></td>
                          <td className="border border-gray-200"><button onClick={() => deleteRecord('IO', i.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={() => handleAddRow('IO')} className="bg-[#00a65a] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#008d4c] flex items-center gap-1 shadow-sm"><Plus size={14} /> 기록 추가</button>
                </div>
              </div>
            )}

            {activeTab === 'PRESCRIPTION' && (
              <div className="flex flex-col h-full">
                {/* Sub-tabs for Prescription */}
                <div className="flex gap-1 mb-2">
                  {[
                    { id: 'MED', label: '약물처방' },
                    { id: 'VIDEO', label: '영상검사' },
                    { id: 'DIAG', label: '진단검사' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setPrescriptionSubTab(sub.id as PrescriptionSubTab)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded border transition-colors",
                        prescriptionSubTab === sub.id 
                          ? "bg-white border-gray-400 text-black" 
                          : "bg-gray-200 border-gray-300 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-auto">
                  {/* Meds Table */}
                  {prescriptionSubTab === 'MED' && (
                    <div className="flex flex-col gap-1">
                      <div className="bg-white border border-gray-400 overflow-auto relative min-h-[200px]">
                        <table className="w-full text-xs text-center border-collapse">
                          <thead className="sticky top-0 bg-gray-500 text-white z-10">
                            <tr>
                              <th className="py-1 border border-gray-400">처방일시</th>
                              <th className="py-1 border border-gray-400">처방명</th>
                              <th className="py-1 border border-gray-400">내용</th>
                              <th className="py-1 border border-gray-400">담당의</th>
                              <th className="py-1 border border-gray-400 w-8"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentPatientPrescriptions.map(p => (
                              <tr key={p.id} className="hover:bg-gray-50 group">
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={p.timestamp} onChange={(e) => updateRecord('PRESCRIPTION', p.id, 'timestamp', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={p.name} onChange={(e) => updateRecord('PRESCRIPTION', p.id, 'name', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={p.content} onChange={(e) => updateRecord('PRESCRIPTION', p.id, 'content', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={p.doctor} onChange={(e) => updateRecord('PRESCRIPTION', p.id, 'doctor', e.target.value)} /></td>
                                <td className="border border-gray-200"><button onClick={() => deleteRecord('PRESCRIPTION', p.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button onClick={() => handleAddRow('MED')} className="bg-[#00a65a] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#008d4c] flex items-center gap-1 shadow-sm"><Plus size={14} /> 기록 추가</button>
                      </div>
                    </div>
                  )}

                  {/* Video Exam Table */}
                  {prescriptionSubTab === 'VIDEO' && (
                    <div className="flex flex-col gap-1">
                      <div className="bg-white border border-gray-400 overflow-auto relative min-h-[200px]">
                        <table className="w-full text-xs text-center border-collapse">
                          <thead className="sticky top-0 bg-gray-500 text-white z-10">
                            <tr>
                              <th className="py-1 border border-gray-400">검사일시</th>
                              <th className="py-1 border border-gray-400">검사명</th>
                              <th className="py-1 border border-gray-400">소견</th>
                              <th className="py-1 border border-gray-400">이미지</th>
                              <th className="py-1 border border-gray-400">담당의</th>
                              <th className="py-1 border border-gray-400 w-8"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentPatientVideoExams.map(v => (
                              <tr key={v.id} className="hover:bg-gray-50 group">
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={v.timestamp} onChange={(e) => updateRecord('VIDEO', v.id, 'timestamp', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={v.examName} onChange={(e) => updateRecord('VIDEO', v.id, 'examName', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={v.finding} onChange={(e) => updateRecord('VIDEO', v.id, 'finding', e.target.value)} /></td>
                                <td className="border border-gray-200">
                                  <div className="flex items-center justify-center gap-1">
                                    {v.imageUrl ? (
                                      <img src={v.imageUrl} alt="Exam" className="w-6 h-6 object-cover rounded cursor-pointer" onClick={() => window.open(v.imageUrl, '_blank')} />
                                    ) : (
                                      <button 
                                        onClick={() => {
                                          setUploadingForId(v.id);
                                          fileInputRef.current?.click();
                                        }}
                                        className="text-blue-500 hover:text-blue-700"
                                      >
                                        <Upload size={12} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={v.doctor} onChange={(e) => updateRecord('VIDEO', v.id, 'doctor', e.target.value)} /></td>
                                <td className="border border-gray-200"><button onClick={() => deleteRecord('VIDEO', v.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button onClick={() => handleAddRow('VIDEO')} className="bg-[#00a65a] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#008d4c] flex items-center gap-1 shadow-sm"><Plus size={14} /> 기록 추가</button>
                      </div>
                    </div>
                  )}

                  {/* Diag Exam Table */}
                  {prescriptionSubTab === 'DIAG' && (
                    <div className="flex flex-col gap-1">
                      <div className="bg-white border border-gray-400 overflow-auto relative min-h-[200px]">
                        <table className="w-full text-xs text-center border-collapse">
                          <thead className="sticky top-0 bg-gray-500 text-white z-10">
                            <tr>
                              <th className="py-1 border border-gray-400">검사일시</th>
                              <th className="py-1 border border-gray-400">검사명</th>
                              <th className="py-1 border border-gray-400">결과</th>
                              <th className="py-1 border border-gray-400">담당의</th>
                              <th className="py-1 border border-gray-400 w-8"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentPatientDiagnosticExams.map(d => (
                              <tr key={d.id} className="hover:bg-gray-50 group">
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={d.timestamp} onChange={(e) => updateRecord('DIAG', d.id, 'timestamp', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={d.examName} onChange={(e) => updateRecord('DIAG', d.id, 'examName', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={d.result} onChange={(e) => updateRecord('DIAG', d.id, 'result', e.target.value)} /></td>
                                <td className="border border-gray-200"><input className="w-full text-center p-1 focus:bg-blue-50 outline-none" value={d.doctor} onChange={(e) => updateRecord('DIAG', d.id, 'doctor', e.target.value)} /></td>
                                <td className="border border-gray-200"><button onClick={() => deleteRecord('DIAG', d.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button onClick={() => handleAddRow('DIAG')} className="bg-[#00a65a] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#008d4c] flex items-center gap-1 shadow-sm"><Plus size={14} /> 기록 추가</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Graph & Images */}
        <div className="p-2 h-64 flex gap-2 flex-shrink-0">
          <div className="flex-1 border border-gray-400 bg-white p-2 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-blue-600" />
              <span className="text-sm font-bold">
                {activeTab === 'VS' && "Vital Signs Graph"}
                {activeTab === 'LAB' && "Lab Results Graph (WBC/Hb)"}
                {activeTab === 'IO' && "I/O Balance Graph"}
                {activeTab === 'PRESCRIPTION' && "Prescription Status"}
              </span>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'VS' ? (
                  <LineChart data={currentPatientVitals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="hr" stroke="#ff0000" name="HR" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="bt" stroke="#0000ff" name="BT" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="rr" stroke="#00ff00" name="RR" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                ) : activeTab === 'LAB' ? (
                  <LineChart data={currentPatientLabs}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="numValue1" stroke="#8884d8" name="WBC" strokeWidth={2} />
                    <Line type="monotone" dataKey="numValue2" stroke="#82ca9d" name="Hb" strokeWidth={2} />
                  </LineChart>
                ) : activeTab === 'IO' ? (
                  <BarChart data={currentPatientIO}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="numInput" fill="#3b82f6" name="Input (cc)" />
                    <Bar dataKey="numOutput" fill="#ef4444" name="Output (cc)" />
                  </BarChart>
                ) : (
                  <BarChart data={prescriptionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="meds" fill="#8884d8" name="약물" />
                    <Bar dataKey="video" fill="#82ca9d" name="영상" />
                    <Bar dataKey="diag" fill="#ffc658" name="진단" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="w-1/3 flex flex-col gap-2">
            <div className="bg-gray-200 p-1 text-[10px] font-bold text-center border border-gray-400 rounded-t">
              영상검사 이미지
            </div>
            <div className="flex-1 border border-gray-400 bg-white flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                {currentPatientVideoExams.filter(v => v.imageUrl).length > 0 ? (
                  currentPatientVideoExams.filter(v => v.imageUrl).map(v => (
                    <div key={v.id} className="bg-white border border-gray-200 p-1 rounded shadow-sm">
                      <img src={v.imageUrl} alt={v.examName} className="w-full h-32 object-contain mb-1" />
                      <div className="text-[10px] font-bold text-center truncate">{v.examName} ({v.timestamp})</div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Upload size={24} />
                    <span className="text-xs">업로드된 이미지 없음</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
              <div className="p-2 text-[10px] text-gray-500 border-t border-gray-200 bg-gray-50">
                영상 검사 표의 업로드 버튼을 사용하여 이미지를 추가하세요.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {isPatientModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden"
            >
              <div className="bg-[#ff80ff] p-3 text-white flex justify-between items-center">
                <span className="font-bold">{editingPatient ? '환자 정보 수정' : '새 환자 추가'}</span>
                <button onClick={() => { setIsPatientModalOpen(false); setEditingPatient(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSavePatient} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">이름</label>
                    <input name="name" defaultValue={editingPatient?.name} required className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">차트번호</label>
                    <input name="chartNumber" defaultValue={editingPatient?.chartNumber} placeholder="자동 생성 (입력 가능)" className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">병실</label>
                    <input name="room" defaultValue={editingPatient?.room} required className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">나이</label>
                    <input name="age" type="number" defaultValue={editingPatient?.age} required className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">성별</label>
                    <input name="gender" defaultValue={editingPatient?.gender} required className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">과</label>
                    <input name="department" defaultValue={editingPatient?.department} required className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">주치의</label>
                  <input name="doctor" defaultValue={editingPatient?.doctor} required className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">주민등록번호</label>
                  <input name="residentNumber" defaultValue={editingPatient?.residentNumber} placeholder="000000-0******" className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">거주지</label>
                  <input name="address" defaultValue={editingPatient?.address} className="w-full border border-gray-300 rounded p-1.5 text-sm" />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => { setIsPatientModalOpen(false); setEditingPatient(null); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded">취소</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-[#ff80ff] text-white rounded font-bold hover:bg-[#ff66ff]">{editingPatient ? '수정하기' : '추가하기'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
