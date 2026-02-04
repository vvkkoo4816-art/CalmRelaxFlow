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
        console.warn("Inline AdSense push failed:", e);
        setIsBlocked(true);
      }
    };

    // Check if script exists and push with a small delay for DOM readiness
    const adTimeout = window.setTimeout(pushAd, 1000);
    
    // Check if the adsbygoogle script is blocked by the browser
    const script = document.querySelector('script[src*="adsbygoogle"]');
    if (!script) {
      setIsBlocked(true);
    }

    return () => clearTimeout(adTimeout);
  }, []);

  return (
    <div className={`ad-container my-4 overflow-hidden min-h-[60px] flex flex-col items-center justify-center bg-stone-50/50 rounded-2xl border border-stone-100/50 shadow-sm group transition-all duration-700 ${className}`}>
      {isBlocked ? (
        <div className="p-2 text-center animate-in fade-in duration-1000">
           <div className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-0.5 opacity-60">Internal Sanctuary</div>
           <p className="text-[8px] text-stone-400 serif italic leading-none">"Peace begins within."</p>
        </div>
      ) : (
        <>
          <div className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-300 mb-1 opacity-40 group-hover:opacity-100 transition-opacity">Spiritual Sustenance</div>
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%', minHeight: '60px', minWidth: '250px' }}
               data-ad-client="ca-pub-8929599367151882"
               data-ad-slot="8929599367"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </>
      )}
    </div>
  );
};

export default AdSlot;