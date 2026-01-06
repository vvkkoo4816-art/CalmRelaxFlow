
export type Language = 'en' | 'zh-Hans' | 'zh-Hant';
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  isLoggedIn: boolean;
  streak: number;
  minutesMeditated: number;
  role: UserRole;
}

export interface MeditationSession {
  id: string;
  title: string;
  duration: string;
  category: 'Focus' | 'Sleep' | 'Anxiety' | 'Gratitude' | 'Quick Relief' | 'Daily';
  imageUrl: string;
  audioUrl: string;
  description?: string;
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

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
}

export interface ZenCenter {
  name: string;
  address: string;
  rating: number;
  url: string;
}

export type AppView = 'today' | 'library' | 'breathing' | 'sleep' | 'explore' | 'profile' | 'admin';
