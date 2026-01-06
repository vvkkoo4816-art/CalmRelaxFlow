
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface Technique {
  id: string;
  name: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
}

const TECHNIQUES: Technique[] = [
  { id: 'box', name: 'breathe_box', inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  { id: 'relax', name: 'breathe_relax', inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  { id: 'focus', name: 'breathe_focus', inhale: 4, hold1: 0, exhale: 6, hold2: 0 },
];

const BreathingExercise: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang] || translations['en'];
  const [activeTechnique, setActiveTechnique] = useState<Technique>(TECHNIQUES[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [timeLeft, setTimeLeft] = useState(activeTechnique.inhale);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Switch phases
            setPhase((currentPhase) => {
              if (currentPhase === 'inhale') {
                if (activeTechnique.hold1 > 0) {
                  setTimeLeft(activeTechnique.hold1);
                  return 'hold1';
                }
                setTimeLeft(activeTechnique.exhale);
                return 'exhale';
              } else if (currentPhase === 'hold1') {
                setTimeLeft(activeTechnique.exhale);
                return 'exhale';
              } else if (currentPhase === 'exhale') {
                if (activeTechnique.hold2 > 0) {
                  setTimeLeft(activeTechnique.hold2);
                  return 'hold2';
                }
                setTimeLeft(activeTechnique.inhale);
                return 'inhale';
              } else {
                setTimeLeft(activeTechnique.inhale);
                return 'inhale';
              }
            });
            return 0; // Temporary before switch
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setPhase('inhale');
      setTimeLeft(activeTechnique.inhale);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isActive, activeTechnique]);

  const getPhaseText = () => {
    if (phase === 'inhale') return t.breathe_inhale;
    if (phase === 'exhale') return t.breathe_exhale;
    return t.breathe_hold;
  };

  const getOrbScale = () => {
    if (!isActive) return 'scale(1)';
    if (phase === 'inhale') return 'scale(1.5)';
    if (phase === 'exhale') return 'scale(0.8)';
    if (phase === 'hold1') return 'scale(1.5)';
    return 'scale(0.8)';
  };

  const getOrbColor = () => {
    if (phase === 'inhale') return 'bg-emerald-400';
    if (phase === 'exhale') return 'bg-blue-400';
    return 'bg-amber-400';
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-10 animate-in fade-in zoom-in duration-700">
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {TECHNIQUES.map((tech) => (
          <button
            key={tech.id}
            onClick={() => {
              setActiveTechnique(tech);
              setIsActive(false);
            }}
            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTechnique.id === tech.id
                ? 'bg-stone-900 text-white shadow-xl'
                : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
            }`}
          >
            {t[tech.name]}
          </button>
        ))}
      </div>

      <div className="relative flex items-center justify-center w-80 h-80">
        {/* Animated Background Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-stone-50 scale-110"></div>
        
        {/* The Zen Orb */}
        <div 
          className={`w-40 h-40 rounded-full transition-all duration-[4000ms] ease-in-out shadow-2xl ${getOrbColor()} ${isActive ? 'opacity-80' : 'opacity-20'}`}
          style={{ transform: getOrbScale() }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
        </div>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center text-center">
          <span className="text-4xl font-black serif text-stone-900 mb-2">{isActive ? timeLeft : ''}</span>
          <span className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-stone-500 opacity-100' : 'text-stone-300 opacity-0'}`}>
            {getPhaseText()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-12 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl ${
            isActive ? 'bg-stone-100 text-stone-500' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
          }`}
        >
          {isActive ? 'Pause' : 'Start Session'}
        </button>
        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
          {isActive ? 'Follow the orb' : 'Take a moment for yourself'}
        </p>
      </div>
    </div>
  );
};

export default BreathingExercise;
