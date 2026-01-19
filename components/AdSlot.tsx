
import React, { useEffect } from 'react';

interface AdSlotProps {
  className?: string;
}

const AdSlot: React.FC<AdSlotProps> = ({ className = "" }) => {
  useEffect(() => {
    const pushAd = () => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn("AdSense push failed - this is normal if the site is not yet approved or if using an ad blocker:", e);
      }
    };

    // Small delay to ensure DOM element is ready
    const timer = setTimeout(pushAd, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`ad-container my-6 overflow-hidden min-h-[100px] flex flex-col items-center justify-center bg-stone-50/50 rounded-3xl border border-stone-100 shadow-inner group ${className}`}>
      <div className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">Spiritual Sustenance</div>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', minHeight: '90px' }}
           data-ad-client="ca-pub-8929599367151882"
           data-ad-slot="auto"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdSlot;
