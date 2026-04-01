export interface Patient {
  id: string;
  name: string;
  room: string;
  age: number;
  doctor: string;
  residentNumber: string;
  address: string;
  chartNumber: string;
  targetVitals: string;
  gender: string;
  department: string;
  soap?: string;
  nursingRecord?: string;
  memo?: string;
}

export interface VitalSign {
  id: string;
  patientId: string;
  timestamp: string;
  hr: number;
  bp: string;
  rr: number;
  bt: number;
}

export interface LabResult {
  id: string;
  patientId: string;
  timestamp: string;
  testName: string;
  value1: string;
  value2: string;
  numValue1: number;
  numValue2: number;
  doctor: string;
}

export interface IOData {
  id: string;
  patientId: string;
  timestamp: string;
  input: string;
  output: string;
  numInput: number;
  numOutput: number;
  doctor: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  timestamp: string;
  name: string;
  content: string;
  doctor: string;
}

export interface VideoExam {
  id: string;
  patientId: string;
  timestamp: string;
  examName: string;
  finding: string;
  doctor: string;
  imageUrl?: string;
}

export interface DiagnosticExam {
  id: string;
  patientId: string;
  timestamp: string;
  examName: string;
  result: string;
  doctor: string;
}
