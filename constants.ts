import { MeditationSession, Course } from './types';

/**
 * Local file mapping for the Zen music collection.
 * Using absolute root paths to ensure the browser finds the files in your project folder.
 */
const AUDIO_50_XUN = '/50.随缘-lyg-寒山僧踪-埙.mp3';
const AUDIO_51_BODHI_HEART = '/51.闲踏清凉月-梦 菩提心.mp3';
const AUDIO_52_BODHI_MIRROR = '/52.悦亲-菩提明镜.mp3';
const AUDIO_58_GUAN_YIN = '/58.悦亲-观世音.mp3';
const AUDIO_59_BODHI_TREE = '/59.悦亲-菩提树下.mp3';
const AUDIO_64_XIAO = '/64.陈伟勋-寒山僧踪 (箫) .mp3';
const AUDIO_66_ZEN_CHIME = '/66.楊李榮-寒山钟声.mp3';
const AUDIO_67_GUZHENG = '/67.木子兮-云水禅心 (古筝版).mp3';
const AUDIO_71_PURE_BUDDHA = '/71.无畏-南无阿弥陀佛.mp3';

export const DAILY_MEDITATION: MeditationSession = {
  id: 'daily-1',
  title: 'Cold Mountain Chimes',
  duration: '15 min',
  category: 'Daily',
  imageUrl: 'https://images.unsplash.com/photo-1545191711-2300b99bc0e4?auto=format&fit=crop&q=80&w=800',
  audioUrl: AUDIO_50_XUN,
  description: 'Deep resonance from the Xun instrument, reflecting the ancient spirit of Han Shan.'
};

export const COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Zen Heritage',
    description: 'Explore the traditional sounds of Buddhist mindfulness.',
    steps: 10,
    completedSteps: 3,
    imageUrl: 'https://images.unsplash.com/photo-1528319725582-ddc0b60ea2d1?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Beginner'
  },
  {
    id: 'c2',
    title: 'The Path of Wisdom',
    description: 'Advanced meditation using traditional flutes and chimes.',
    steps: 7,
    completedSteps: 0,
    imageUrl: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Intermediate'
  }
];

export const SLEEP_STORIES: MeditationSession[] = [
  {
    id: 's1',
    title: 'Night at the Bodhi Tree',
    duration: '45 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_59_BODHI_TREE,
    description: 'Gently drifting off under the shade of ancient wisdom.'
  },
  {
    id: 's2',
    title: 'Starry Temple Night',
    duration: '30 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_66_ZEN_CHIME,
    description: 'Floating through a celestial sea of peace with rhythmic temple chimes.'
  }
];

export const QUICK_RELIEF: MeditationSession[] = [
  {
    id: 'q1',
    title: 'Guan Yin Compassion',
    duration: '5 min',
    category: 'Quick Relief',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_58_GUAN_YIN,
    description: 'Finding quick solace in the echoes of compassion.'
  },
  {
    id: 'q2',
    title: 'Zen Flow',
    duration: '10 min',
    category: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_67_GUZHENG,
    description: 'A dedicated Guzheng soundscape for cognitive clarity.'
  }
];

export const MEDITATION_SESSIONS: MeditationSession[] = [
  DAILY_MEDITATION,
  ...SLEEP_STORIES,
  ...QUICK_RELIEF,
  {
    id: 'z1',
    title: 'Eternal Bodhi Heart',
    duration: '20 min',
    category: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_51_BODHI_HEART,
    description: 'Deep meditation focused on the cultivation of a pure heart.'
  },
  {
    id: 'r1',
    title: 'Pure Land Chant',
    duration: '60 min',
    category: 'Sleep',
    imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1f539cf?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_71_PURE_BUDDHA,
    description: 'Continuous soothing chants for a restful transition into sleep.'
  },
  {
    id: 'x1',
    title: 'Xiao Bamboo Flute',
    duration: '12 min',
    category: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_64_XIAO,
    description: 'The sharp and clear tones of the bamboo flute to sharpen your mind.'
  },
  {
    id: 'm1',
    title: 'Bodhi Mirror Reflection',
    duration: '18 min',
    category: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1528319725582-ddc0b60ea2d1?auto=format&fit=crop&q=80&w=800',
    audioUrl: AUDIO_52_BODHI_MIRROR,
    description: 'Clarity and self-reflection with traditional melodies.'
  }
];

export const AMBIENT_SOUNDS = [
  { id: 'han_shan', name: 'Han Shan Chimes', icon: '🔔', url: AUDIO_66_ZEN_CHIME },
  { id: 'bodhi', name: 'Bodhi Breeze', icon: '🎋', url: AUDIO_59_BODHI_TREE },
  { id: 'guzheng', name: 'Guzheng Stream', icon: '🎸', url: AUDIO_67_GUZHENG },
  { id: 'pure_land', name: 'Pure Land Chants', icon: '📿', url: AUDIO_71_PURE_BUDDHA }
];