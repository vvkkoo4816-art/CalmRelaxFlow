
import { MeditationSession, Course } from './types';

export const STATIC_QUOTES = [
  "Quiet the mind, and the soul will speak.",
  "Breathe. It's just a bad day, not a bad life.",
  "The goal of meditation is not to get rid of thoughts, but to realize that they are not you.",
  "Peace comes from within. Do not seek it without.",
  "The present moment is the only time over which we have dominion.",
  "Wherever you are, be there totally.",
  "Smile, breathe and go slowly.",
  "Mindfulness isn't difficult, we just need to remember to do it.",
  "Your calm is your strength.",
  "The soul usually knows what to do to heal itself. The challenge is to silence the mind."
];

const IMG_NATURE = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800';
const IMG_PIANO = 'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&q=80&w=800';
const IMG_SLEEP = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800';
const IMG_ZEN = 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800';
const IMG_FOREST = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800';
const IMG_OCEAN = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800';
const IMG_STARS = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800';

export const DAILY_MEDITATION: MeditationSession = {
  id: 'daily-1',
  title: 'Morning Clarity',
  duration: 'Infinite',
  category: 'Daily',
  imageUrl: IMG_NATURE, 
  audioUrl: 'morning.mp3',
  description: 'Wake your soul with the resonance of morning bells and nature\'s first breath.'
};

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: 's1',
    title: 'Eternal Peace Piano',
    duration: 'Healing',
    category: 'Anxiety',
    imageUrl: IMG_PIANO,
    audioUrl: 'healing.mp3',
    description: 'Surrender to the soft, rhythmic waves of a grand piano.'
  },
  {
    id: 's2',
    title: 'Deep Theta Drift',
    duration: 'Sleep',
    category: 'Sleep',
    imageUrl: IMG_SLEEP,
    audioUrl: 'sleep.mp3',
  },
  {
    id: 's3',
    title: 'Zen Flute Journey',
    duration: 'Focus',
    category: 'Focus',
    imageUrl: IMG_ZEN,
    audioUrl: 'zen.mp3',
    isLocked: false 
  },
  {
    id: 's4',
    title: 'Sunset Forest',
    duration: 'Relax',
    category: 'Quick Relief',
    imageUrl: IMG_FOREST,
    audioUrl: 'morning.mp3',
  },
  {
    id: 's5',
    title: 'Ocean Serenity',
    duration: 'Calm',
    category: 'Gratitude',
    imageUrl: IMG_OCEAN,
    audioUrl: 'rain.mp3',
  }
];

export const SLEEP_STORIES: MeditationSession[] = [
  {
    id: 'st1',
    title: 'The Silent Nebula',
    duration: '25 min',
    category: 'Sleep',
    imageUrl: IMG_STARS,
    audioUrl: 'sleep.mp3',
    description: 'A journey through the quietest corners of the galaxy.'
  },
  {
    id: 'st2',
    title: 'Midnight in Kyoto',
    duration: '30 min',
    category: 'Sleep',
    imageUrl: IMG_ZEN,
    audioUrl: 'zen.mp3',
    description: 'Walking through rain-soaked temples in ancient Kyoto.'
  }
];

export const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Soft Rain', icon: '🌧️', url: 'rain.mp3' },
  { id: 'zen', name: 'Zen Flute', icon: '🧘', url: 'zen.mp3' },
  { id: 'healing', name: 'Deep Calm', icon: '🕊️', url: 'healing.mp3' },
  { id: 'birds', name: 'Forest Birds', icon: '🐦', url: 'morning.mp3' },
  { id: 'alpha', name: 'Alpha Focus', icon: '🧠', url: 'zen.mp3' }, // Placeholder paths
  { id: 'theta', name: 'Theta Sleep', icon: '✨', url: 'sleep.mp3' }
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
  },
  {
    id: 'c2',
    title: 'Sleep Science',
    description: 'Master the art of falling asleep quickly and deeply.',
    steps: 7,
    completedSteps: 0,
    imageUrl: IMG_SLEEP,
    difficulty: 'Intermediate'
  }
];
