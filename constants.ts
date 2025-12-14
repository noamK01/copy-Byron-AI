import { CallOutcome, User } from './types';

export const APP_NAME = "Byron AI";

export const MOCK_USERS: User[] = [
  { id: '1', name: 'ישראל ישראלי', email: 'israel@byron.ai', password: '123', role: 'agent' },
  { id: '2', name: 'דנה כהן', email: 'dana@byron.ai', password: '123', role: 'agent' },
  { id: '3', name: 'נועם לוי', email: 'noam@byron.ai', password: '123', role: 'agent' },
  { id: '99', name: 'מנהל מערכת', email: 'admin@byron.ai', password: 'admin', role: 'admin' }, // Admin User
];

export const OUTCOME_OPTIONS = [
  { value: CallOutcome.NO_CREDIT, label: 'אין אשראי', color: 'bg-orange-500' },
  { value: CallOutcome.NO_MONEY, label: 'אין כסף', color: 'bg-red-500' },
  { value: CallOutcome.HANGUP, label: 'ניתוק מיידי', color: 'bg-gray-500' },
  { value: CallOutcome.CLOSED, label: 'נסגר (מכירה)', color: 'bg-purple-600' }, // Changed to Purple to match screenshot
];