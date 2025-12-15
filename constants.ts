import { CallOutcome, User } from './types';

export const APP_NAME = "Byron AI";

export const MOCK_USERS: User[] = [
  { id: '99', name: 'מנהל מערכת', email: 'noam1234', password: '102030', role: 'admin' }, 
];

export const OUTCOME_OPTIONS = [
  { value: CallOutcome.NO_CREDIT, label: 'אין אשראי', color: 'bg-orange-500' },
  { value: CallOutcome.NO_MONEY, label: 'אין כסף', color: 'bg-red-500' },
  { value: CallOutcome.HANGUP, label: 'ניתוק מיידי', color: 'bg-gray-500' },
  { value: CallOutcome.CLOSED, label: 'נסגר (מכירה)', color: 'bg-purple-600' },
];

export const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/2795cvysas3uqjk47w3tlkvo28kdbv6m";