
import { MeditationSession, Course } from './types';

// Updated to a high-quality, reliable mindfulness meditation track
const STABLE_AUDIO = 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3';

export const DAILY_MEDITATION: MeditationSession = {
  id: 'daily-1',
  title: 'Morning Serenity',
  duration: '12 min',
  category: 'Daily',
  imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=800',
  audioUrl: STABLE_AUDIO,
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
    audioUrl: STABLE_AUDIO,
    description: 'Rhythmic rail sounds and misty mountain ambience for deep rest.'
  },
  {
    id: 's2',
    title: 'Ocean Whispers',
    duration: '35 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1472120435166-d11000520e80?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO,
    description: 'High-fidelity waves washing over a peaceful shoreline.'
  },
  {
    id: 's3',
    title: 'Starlit Valley',
    duration: '20 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO,
    description: 'Ethereal pads and soft chimes representing the night sky.'
  },
  {
    id: 's4',
    title: 'Moonlight Forest',
    duration: '60 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO,
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
    audioUrl: STABLE_AUDIO,
    description: 'A steady, minimalist pulse to guide your inhalations and exhalations.'
  },
  {
    id: 'q2',
    title: 'Panic Reset',
    duration: '5 min',
    category: 'Anxiety',
    imageUrl: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO,
    description: 'Reassuring, low-noise drones designed to ground you in the present.'
  }
];

export const EXPLORE_SESSIONS: MeditationSession[] = [
  {
    id: 'e1',
    title: 'Gratitude Garden',
    duration: '15 min',
    category: 'Gratitude',
    imageUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO
  },
  {
    id: 'e2',
    title: 'Deep Forgiveness',
    duration: '20 min',
    category: 'Anxiety',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO
  },
  {
    id: 'e3',
    title: 'Nature Walk',
    duration: '30 min',
    category: 'Daily',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO
  },
  {
    id: 'e4',
    title: 'Release Tension',
    duration: '10 min',
    category: 'Quick Relief',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO
  }
];

export const ZEN_MUSIC: MeditationSession[] = [
  {
    id: 'm1',
    title: 'Zen Piano Flow',
    duration: '25 min',
    category: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO
  },
  {
    id: 'm2',
    title: 'Celestial Harps',
    duration: '15 min',
    category: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b867ad?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO
  },
  {
    id: 'm3',
    title: 'Ethereal Forest',
    duration: '30 min',
    category: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    audioUrl: STABLE_AUDIO
  }
];

export const MEDITATION_SESSIONS: MeditationSession[] = [
  ...QUICK_RELIEF,
  ...SLEEP_STORIES,
  ...ZEN_MUSIC,
  ...EXPLORE_SESSIONS,
  DAILY_MEDITATION
];

export const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Soft Rain', icon: '🌧️', url: STABLE_AUDIO },
  { id: 'forest', name: 'Deep Woods', icon: '🌲', url: STABLE_AUDIO },
  { id: 'fire', name: 'Warm Fire', icon: '🔥', url: STABLE_AUDIO },
  { id: 'wind', name: 'Soft Wind', icon: '🌬️', url: STABLE_AUDIO },
];
