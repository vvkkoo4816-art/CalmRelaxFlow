import { MeditationSession, Course } from './types';

/**
 * The "Soulful 4" - Curated for 10MB Limit
 * These 4 tracks cover every spiritual need while staying lightweight.
 */
const AUDIO_MORNING = '/morning.mp3'; // Morning / Uplifting
const AUDIO_HEALING = '/healing.mp3'; // Emotional / Piano
const AUDIO_SLEEP = '/sleep.mp3';     // Deep / Theta Waves
const AUDIO_ZEN = '/zen.mp3';         // Focus / Flute

// Meaningful Imagery
const IMG_NATURE = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800';
const IMG_PIANO = 'https://images.unsplash.com/photo-1520529682703-909565f12a1f?auto=format&fit=crop&q=80&w=800';
const IMG_SLEEP = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800';
const IMG_ZEN = 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800';

export const DAILY_MEDITATION: MeditationSession = {
  id: 'daily-1',
  title: 'Morning Clarity',
  duration: 'Infinite',
  category: 'Daily',
  imageUrl: IMG_NATURE, 
  audioUrl: AUDIO_MORNING,
  description: 'Wake your soul with the resonance of morning bells and nature\'s first breath.'
};

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: 's1',
    title: 'Eternal Peace Piano',
    duration: 'Healing',
    category: 'Anxiety',
    imageUrl: IMG_PIANO,
    audioUrl: AUDIO_HEALING,
  },
  {
    id: 's2',
    title: 'Deep Theta Drift',
    duration: 'Sleep',
    category: 'Sleep',
    imageUrl: IMG_SLEEP,
    audioUrl: AUDIO_SLEEP,
  },
  {
    id: 's3',
    title: 'Zen Flute Journey',
    duration: 'Focus',
    category: 'Focus',
    imageUrl: IMG_ZEN,
    audioUrl: AUDIO_ZEN,
  },
  {
    id: 's4',
    title: 'Mountain Birdsong',
    duration: 'Morning',
    category: 'Daily',
    imageUrl: IMG_NATURE,
    audioUrl: AUDIO_MORNING,
  }
];

export const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Soft Rain', icon: '🌧️', url: '/rain.mp3' },
  { id: 'zen', name: 'Zen Flute', icon: '🧘', url: AUDIO_ZEN }
];

export const COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Soulful Mastery',
    description: 'A 4-part journey through the core pillars of mindfulness.',
    steps: 4,
    completedSteps: 1,
    imageUrl: IMG_ZEN,
    difficulty: 'Beginner'
  }
];