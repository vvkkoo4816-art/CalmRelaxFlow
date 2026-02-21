
export type Language = 'en' | 'zh-Hans' | 'zh-Hant';
export type UserRole = 'admin' | 'user';

export interface ActivityRecord {
  email: string;
  timestamp: string;
  location: string;
  device: string;
  type: 'Entrance' | 'Reflection';
  content?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  isLoggedIn: boolean;
  streak: number;
  minutesMeditated: number;
  role: UserRole;
  isPremium: boolean;
}

export interface MeditationSession {
  id: string;
  title: string;
  duration: string;
  category: 'Focus' | 'Sleep' | 'Anxiety' | 'Gratitude' | 'Quick Relief' | 'Daily';
  imageUrl: string;
  audioUrl: string;
  description?: string;
  isLocked?: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  steps: number;
  completedSteps: number;
  imageUrl: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export type AppView = 'today' | 'library' | 'breathing' | 'sleep' | 'explore' | 'profile' | 'admin' | 'journal' | 'calm' | 'premium' | 'progress';
