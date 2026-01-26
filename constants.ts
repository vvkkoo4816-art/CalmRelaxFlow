
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

export const PUBLIC_AUDIO_FILES = [
  'cloud.mp3', 'cloud2.mp3', 'cloud3.mp3', 'cmusic.mp3', 'cmusic2.mp3', 
  'forest2.mp3', 'healing.mp3', 'hill.mp3', 'light.mp3', 'morning.mp3',
  'rain.mp3', 'sleep.mp3', 'water.mp3', 'zen.mp3'
];

const IMG_NATURE = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800';
const IMG_PIANO = 'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&q=80&w=800';
const IMG_SLEEP = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800';
const IMG_ZEN = 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800';
const IMG_FOREST = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800';
const IMG_OCEAN = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800';
const IMG_CLOUDS = 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&q=80&w=800';
const IMG_MOUNTAIN = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800';
const IMG_CRYSTAL = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800';
const IMG_AURA = 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800';
const IMG_STARS = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800';
const IMG_KYOTO = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800';

export const DAILY_MEDITATION: MeditationSession = {
  id: 'daily-1',
  title: 'Morning Clarity',
  duration: '10 min',
  category: 'Daily',
  imageUrl: IMG_NATURE, 
  audioUrl: 'morning.mp3',
  description: 'Wake your soul with the resonance of nature\'s first breath.'
};

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: 's1',
    title: 'Eternal Peace',
    duration: '15 min',
    category: 'Anxiety',
    imageUrl: IMG_PIANO,
    audioUrl: 'healing.mp3',
    description: 'Surrender to the soft, rhythmic waves of healing frequencies.'
  },
  {
    id: 's2',
    title: 'Deep Theta Drift',
    duration: '20 min',
    category: 'Sleep',
    imageUrl: IMG_SLEEP,
    audioUrl: 'sleep.mp3',
  },
  {
    id: 's3',
    title: 'Zen Flute Journey',
    duration: '12 min',
    category: 'Focus',
    imageUrl: IMG_ZEN,
    audioUrl: 'zen.mp3',
  },
  {
    id: 's4',
    title: 'Sunset Forest',
    duration: '18 min',
    category: 'Quick Relief',
    imageUrl: IMG_FOREST,
    audioUrl: 'forest2.mp3',
  },
  {
    id: 's5',
    title: 'Ocean Serenity',
    duration: '15 min',
    category: 'Gratitude',
    imageUrl: IMG_OCEAN,
    audioUrl: 'water.mp3',
  }
];

export const SLEEP_STORIES: MeditationSession[] = [
  {
    id: 'st1',
    title: 'The Silent Nebula',
    duration: '25 min',
    category: 'Sleep',
    imageUrl: IMG_STARS,
    audioUrl: 'cmusic2.mp3',
    description: 'A journey through the celestial void.'
  },
  {
    id: 'st2',
    title: 'Midnight in Kyoto',
    duration: '30 min',
    category: 'Sleep',
    imageUrl: IMG_KYOTO,
    audioUrl: 'morning.mp3',
    description: 'Whispers from the ancient temples.'
  },
  {
    id: 'st3',
    title: 'Forest Whisper',
    duration: '45 min',
    category: 'Sleep',
    imageUrl: IMG_FOREST,
    audioUrl: 'rain.mp3',
    description: 'The breathing of the deep woods.'
  },
  {
    id: 'st4',
    title: 'Celestial Symphony',
    duration: '40 min',
    category: 'Sleep',
    imageUrl: IMG_CLOUDS,
    audioUrl: 'cloud.mp3',
    description: 'Orchestrated peace from above.'
  },
  {
    id: 'st5',
    title: 'Lunar Melodies',
    duration: '35 min',
    category: 'Sleep',
    imageUrl: IMG_MOUNTAIN,
    audioUrl: 'sleep.mp3',
    description: 'Soft rhythms under the moonlight.'
  }
];

export const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rainfall', icon: '🌧️', url: 'rain.mp3' },
  { id: 'zen', name: 'Zendo', icon: '🧘', url: 'zen.mp3' },
  { id: 'healing', name: 'Healing', icon: '🕊️', url: 'healing.mp3' },
  { id: 'birds', name: 'Morning', icon: '🐦', url: 'morning.mp3' },
  { id: 'wind', name: 'Hilltop', icon: '🏔️', url: 'hill.mp3' },
  { id: 'ethereal', name: 'Glow', icon: '✨', url: 'light.mp3' },
  { id: 'waves', name: 'Water', icon: '🌊', url: 'water.mp3' },
  { id: 'clouds', name: 'Drift', icon: '☁️', url: 'cloud2.mp3' }
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
