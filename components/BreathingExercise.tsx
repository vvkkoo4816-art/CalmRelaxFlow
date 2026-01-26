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
            return 0;
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
    if (phase === 'inhale') return 'scale(1.8)';
    if (phase === 'exhale') return 'scale(0.8)';
    if (phase === 'hold1') return 'scale(1.8)';
    return 'scale(0.8)';
  };

  const getOrbColor = () => {
    if (phase === 'inhale') return 'bg-emerald-400';
    if (phase === 'exhale') return 'bg-blue-400';
    return 'bg-amber-400';
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-16 py-10">
      <div className="grid grid-cols-3 gap-3 w-full max-w-md bg-stone-50 p-2 rounded-[32px] border border-stone-100">
        {TECHNIQUES.map((tech) => (
          <button
            key={tech.id}
            onClick={() => {
              setActiveTechnique(tech);
              setIsActive(false);
            }}
            className={`px-4 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTechnique.id === tech.id
                ? 'bg-stone-900 text-white shadow-xl'
                : 'bg-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {t[tech.name]}
          </button>
        ))}
      </div>

      <div className="relative flex items-center justify-center w-80 h-80">
        {/* Breathing Rings */}
        <div className="absolute inset-0 rounded-full border border-stone-100 scale-150 opacity-10"></div>
        <div className="absolute inset-0 rounded-full border border-stone-100 scale-125 opacity-20 animate-pulse"></div>
        <div className="absolute inset-0 rounded-full border border-stone-200 scale-100 opacity-30"></div>
        
        {/* The Orb */}
        <div 
          className={`w-40 h-40 rounded-full transition-all duration-[4000ms] cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_60px_rgba(16,185,129,0.3)] ${getOrbColor()} ${isActive ? 'opacity-80' : 'opacity-10'}`}
          style={{ transform: getOrbScale() }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl"></div>
        </div>

        <div className="absolute flex flex-col items-center text-center">
          <span className="text-5xl font-black serif text-stone-900 mb-2">{isActive ? timeLeft : ''}</span>
          <span className={`text-[12px] font-black uppercase tracking-[0.4em] transition-all duration-700 ${isActive ? 'text-stone-600 opacity-100' : 'text-stone-300 opacity-0'}`}>
            {getPhaseText()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={() => setIsActive(!isActive)}
          className="bg-emerald-500 text-white px-20 py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-200 active:scale-95 transition-all"
        >
          {isActive ? 'Pause' : t.start_journey}
        </button>
      </div>
    </div>
  );
};

export default BreathingExercise;