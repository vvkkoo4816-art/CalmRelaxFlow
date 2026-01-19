
import React, { useEffect } from 'react';

interface AdSlotProps {
  className?: string;
}

const AdSlot: React.FC<AdSlotProps> = ({ className = "" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsbygoogle error:", e);
    }
  }, []);

  return (
    <div className={`ad-container my-4 overflow-hidden min-h-[100px] flex items-center justify-center bg-stone-50 rounded-2xl border border-stone-100 ${className}`}>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%' }}
           data-ad-client="ca-pub-8929599367151882"
           data-ad-slot="auto"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdSlot;
