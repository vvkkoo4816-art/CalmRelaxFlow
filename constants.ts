import { MeditationSession, Course } from './types';

// High-quality, reliable mindfulness meditation tracks from Pixabay
const STABLE_AUDIO_ZEN = 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3';
const STABLE_AUDIO_SLEEP = 'https://cdn.pixabay.com/audio/2022/05/17/audio_189679f228.mp3';
const STABLE_AUDIO_FOCUS = 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a14781.mp3';
const STABLE_AUDIO_RAIN = 'https://cdn.pixabay.com/audio/2021/09/06/audio_017f8a77f3.mp3';

export const DAILY_MEDITATION: MeditationSession = {
  id: 'daily-1',
  title: 'Morning Serenity',
  duration: '12 min',
  category: 'Daily',
  imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=800',
  audioUrl: STABLE_AUDIO_ZEN,
  description: 'Soft morning birds and gentle acoustic melodies to start your day with clarity.'
};

export const COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Beginner Basics',
    description: 'Learn the fundamentals of mindfulness in 10 days.',
    steps: 10,
    completedSteps: 3,
    imageUrl: 'https://images.unsplash.com/photo-1528319725582-ddc0b60ea2d1?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Beginner'
  },
  {
    id: 'c2',
    title: 'Mastering Focus',
    description: 'Advanced techniques for deep work and attention.',
    steps: 7,
    completedSteps: 0,
    imageUrl: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Intermediate'
  }
];

export const SLEEP_STORIES: MeditationSession[] = [
  {
    id: 's1',
    title: 'The Midnight Train',
    duration: '45 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1474487056217-76fe4f83b14f?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO_SLEEP,
    description: 'Rhythmic rail sounds and misty mountain ambience for deep rest.'
  },
  {
    id: 's2',
    title: 'Ocean Whispers',
    duration: '35 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1472120435166-d11000520e80?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO_SLEEP,
    description: 'High-fidelity waves washing over a peaceful shoreline.'
  },
  {
    id: 's3',
    title: 'Starlit Valley',
    duration: '20 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO_SLEEP,
    description: 'Ethereal pads and soft chimes representing the night sky.'
  },
  {
    id: 's4',
    title: 'Moonlight Forest',
    duration: '60 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO_SLEEP,
    description: 'Subtle crickets and wind rustling through ancient pines.'
  }
];

export const QUICK_RELIEF: MeditationSession[] = [
  {
    id: 'q1',
    title: 'Calm Breathing',
    duration: '3 min',
    category: 'Quick Relief',
    imageUrl: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO_ZEN,
    description: 'A steady, minimalist pulse to guide your inhalations and exhalations.'
  },
  // Fix: Completed the missing q2 object and added required audioUrl
  {
    id: 'q2',
    title: 'Panic Reset',
    duration: '5 min',
    category: 'Anxiety',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO_ZEN,
    description: 'Quick grounding techniques to calm the nervous system.'
  }
];

// Fix: Export MEDITATION_SESSIONS which is imported in App.tsx
export const MEDITATION_SESSIONS: MeditationSession[] = [
  DAILY_MEDITATION,
  ...SLEEP_STORIES,
  ...QUICK_RELIEF
];

// Fix: Export AMBIENT_SOUNDS which is imported in SoundMixer.tsx
export const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rainfall', icon: '🌧️', url: STABLE_AUDIO_RAIN },
  { id: 'forest', name: 'Deep Forest', icon: '🌲', url: STABLE_AUDIO_ZEN },
  { id: 'waves', name: 'Ocean Waves', icon: '🌊', url: STABLE_AUDIO_SLEEP },
  { id: 'white-noise', name: 'White Noise', icon: '💨', url: STABLE_AUDIO_FOCUS }
];
