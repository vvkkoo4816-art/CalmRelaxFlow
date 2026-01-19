
import React, { useEffect, useState } from 'react';

interface AdSlotProps {
  className?: string;
}

const AdSlot: React.FC<AdSlotProps> = ({ className = "" }) => {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const pushAd = () => {
      try {
        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || [];
        if (adsbygoogle.push) {
          adsbygoogle.push({});
        }
      } catch (e) {
        console.warn("AdSense blocked:", e);
        setIsBlocked(true);
      }
    };

    const timer = setTimeout(pushAd, 500);
    
    // Check if the script even loaded
    const script = document.querySelector('script[src*="adsbygoogle"]');
    if (!script) {
      setIsBlocked(true);
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`ad-container my-6 overflow-hidden min-h-[100px] flex flex-col items-center justify-center bg-stone-50/50 rounded-3xl border border-stone-100 shadow-inner group transition-all duration-700 ${className}`}>
      {isBlocked ? (
        <div className="p-4 text-center animate-in fade-in duration-1000">
           <div className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-2">Internal Peace</div>
           <p className="text-[10px] text-stone-400 serif italic">"Breathe deeply. The light within is the only ad you need."</p>
           <p className="text-[8px] text-stone-300 mt-2 uppercase tracking-widest">(AdSense Syncing...)</p>
        </div>
      ) : (
        <>
          <div className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">Spiritual Sustenance</div>
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%', minHeight: '90px' }}
               data-ad-client="ca-pub-8929599367151882"
               data-ad-slot="auto"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </>
      )}
    </div>
  );
};

export default AdSlot;
