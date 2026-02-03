
import React, { useEffect, useState } from 'react';
import { STATIC_QUOTES } from '../constants';
import { Language, AppView } from '../types';
import { translations } from '../translations';
import AdSlot from './AdSlot';

interface ZenAdInterstitialProps {
  isVisible: boolean;
  onComplete: () => void;
  lang: Language;
  pendingView: AppView | null;
}

const ZenAdInterstitial: React.FC<ZenAdInterstitialProps> = ({ isVisible, onComplete, lang }) => {
  const [quote, setQuote] = useState(STATIC_QUOTES[0]);
  const [progress, setProgress] = useState(0);
  const [canResume, setCanResume] = useState(false);
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    if (isVisible) {
      setQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
      setProgress(0);
      setCanResume(false);
      
      const startTime = Date.now();
      const duration = 2500; // Reduced to 2.5 seconds for a swifter transition

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          setCanResume(true);
        }
      }, 16);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-lg space-y-10 flex flex-col items-center py-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping duration-[4s]"></div>
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-400">
            Sanctuary Transition
          </p>
        </div>

        <div className="w-full bg-stone-50 rounded-[48px] border-2 border-stone-100 p-10 shadow-2xl min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden transition-all text-center group">
            <p className="text-stone-600 serif italic text-xl leading-relaxed px-4 mb-10">
               "{quote}"
            </p>
            
            {/* Inline advertisement display during transition */}
            <div className="w-full max-w-xs scale-110">
               <AdSlot className="w-full" />
            </div>
            
            <div className="absolute top-4 right-8 text-[8px] font-black text-stone-200 uppercase tracking-widest">Architectural Pause</div>
        </div>

        <div className="text-center space-y-8 w-full">
          <div className="flex flex-col items-center space-y-8">
            {!canResume ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-64 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-[16ms] ease-linear" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest animate-pulse">
                  Syncing Mindful Frequencies...
                </p>
              </div>
            ) : (
              <button 
                onClick={onComplete}
                className="bg-stone-900 text-white px-16 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl animate-in zoom-in duration-300 hover:bg-emerald-600 transition-all active:scale-95"
              >
                Enter Sanctuary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZenAdInterstitial;
