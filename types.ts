export enum CallOutcome {
  NO_CREDIT = 'אין לי אשראי',
  NO_MONEY = 'אין לי כסף',
  HANGUP = 'ניתוק מיידי',
  CLOSED = 'נסגר'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In real app, never store plain text
  role: 'admin' | 'agent'; // Added role
}

export interface CallLog {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: number;
  outcome: CallOutcome;
}

export interface ExportData {
  date: string;
  agentName: string;
  totalCalls: number;
  notClosedCount: number;
  closedCount: number;
  mostCommonRefusal: string;
  lowPerformanceAgents: string[]; // List of agents < 30%
}