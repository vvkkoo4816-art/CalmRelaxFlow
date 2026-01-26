
import React, { useEffect, useState } from 'react';
import { STATIC_QUOTES } from '../constants';
import { Language, AppView } from '../types';
import { translations } from '../translations';

interface ZenAdInterstitialProps {
  isVisible: boolean;
  onComplete: () => void;
  lang: Language;
  pendingView: AppView | null;
}

const ZenAdInterstitial: React.FC<ZenAdInterstitialProps> = ({ isVisible, onComplete, lang, pendingView }) => {
  const [quote, setQuote] = useState(STATIC_QUOTES[0]);
  const [progress, setProgress] = useState(0);
  const [canResume, setCanResume] = useState(false);
  const [adStatus, setAdStatus] = useState<'loading' | 'filled' | 'blocked'>('loading');
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    if (isVisible) {
      // Pick a new random quote for each transition
      setQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
      setProgress(0);
      setCanResume(false);
      setAdStatus('loading');
      
      const startTime = Date.now();
      const duration = 2000; // 2 seconds mindfulness pause

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          setCanResume(true);
        }
      }, 16);

      // Trigger AdSense request
      const timer = setTimeout(() => {
        try {
          // Check if AdSense script is even loaded
          if (!(window as any).adsbygoogle) {
            setAdStatus('blocked');
            return;
          }
          
          (window as any).adsbygoogle = (window as any).adsbygoogle || [];
          (window as any).adsbygoogle.push({});
          setAdStatus('filled');
        } catch (e) {
          console.warn("AdSense push failed:", e);
          setAdStatus('blocked');
        }
      }, 100);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isVisible, pendingView]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-lg space-y-6 flex flex-col items-center">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">
            {adStatus === 'blocked' ? 'Moment of Reflection' : 'Inner Peace Sponsored By'}
          </p>
        </div>

        {/* AdSense Interstitial Frame */}
        <div className="w-full bg-stone-50 rounded-[40px] border-2 border-stone-100 p-4 shadow-xl min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden transition-all">
          {adStatus === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-50 z-10">
               <div className="w-8 h-8 border-2 border-stone-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          )}
          
          {adStatus === 'blocked' ? (
            <div className="text-center p-8 space-y-4 animate-in fade-in duration-700">
               <div className="text-4xl">✨</div>
               <p className="text-stone-400 serif italic text-sm">"In the midst of movement and chaos, keep stillness inside of you."</p>
            </div>
          ) : (
            <ins 
              key={pendingView || 'default'} // Force re-render of ad unit on view change
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '300px' }}
              data-ad-client="ca-pub-8929599367151882"
              data-ad-slot="8929599367"
              data-ad-format="rectangle"
              data-full-width-responsive="true"
            ></ins>
          )}
          
          <div className="absolute top-4 right-6 text-[8px] font-black text-stone-200 uppercase tracking-widest">Mindfulness Partner</div>
        </div>

        <div className="text-center space-y-6 w-full">
          <h2 className="text-xl font-black serif text-stone-800 leading-relaxed italic px-8">
            "{quote}"
          </h2>
          
          <div className="flex flex-col items-center space-y-6">
            {!canResume ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-48 h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-[16ms] ease-linear" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest animate-pulse">
                  Centering your energy...
                </p>
              </div>
            ) : (
              <button 
                onClick={onComplete}
                className="bg-stone-900 text-white px-12 py-4 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl animate-in zoom-in duration-300 hover:bg-emerald-600 transition-all active:scale-95"
              >
                Resume Sanctuary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZenAdInterstitial;
