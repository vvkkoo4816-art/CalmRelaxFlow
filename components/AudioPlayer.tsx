
import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  onSessionComplete?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, title, onClose, onSessionComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getPossiblePaths = (baseUrl: string) => {
    if (baseUrl.startsWith('http')) return [baseUrl];
    const fileName = baseUrl.split('/').pop() || baseUrl;
    return [
      fileName,
      `/${fileName}`,
      `./${fileName}`,
      `${window.location.origin}/${fileName}`
    ].filter((v, i, a) => a.indexOf(v) === i);
  };

  const possiblePaths = getPossiblePaths(url);

  useEffect(() => {
    setError(null);
    setIsBuffering(true);
    setIsPlaying(false);
    setProgress(0);
    setAttemptIndex(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = possiblePaths[0];
      audioRef.current.load();
    }
  }, [url]);

  useEffect(() => {
    let timer: number;
    if (sleepTimer !== null && isPlaying) {
      timer = window.setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          setSleepTimer(null);
          if (onSessionComplete) onSessionComplete();
        }
      }, sleepTimer * 60 * 1000);
    }
    return () => clearTimeout(timer);
  }, [sleepTimer, isPlaying]);

  const handleAudioError = () => {
    const nextIndex = attemptIndex + 1;
    if (nextIndex < possiblePaths.length) {
      setAttemptIndex(nextIndex);
      if (audioRef.current) {
        audioRef.current.src = possiblePaths[nextIndex];
        audioRef.current.load();
        if (isPlaying) audioRef.current.play().catch(() => {});
      }
    } else {
      setError("RESONANCE BLOCKED");
      setIsBuffering(false);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || error) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsBuffering(true);
      setError(null);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch(handleAudioError);
    }
  };

  return (
    <>
      {isImmersive && (
        <div className="fixed inset-0 z-[60] bg-stone-950 flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-500">
           <div className="absolute inset-0 bg-emerald-900/10 animate-pulse duration-[10s]"></div>
           <button onClick={() => setIsImmersive(false)} className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
           <div className="relative flex flex-col items-center text-center space-y-10 w-full max-w-lg">
              <div className="w-56 h-56 md:w-72 md:h-72 rounded-[60px] bg-emerald-500 shadow-2xl flex items-center justify-center overflow-hidden">
                 <div className={`w-full h-full bg-white/10 ${isPlaying ? 'animate-[pulse_4s_infinite]' : ''}`}></div>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-black serif text-white mb-2 leading-tight">{title}</h3>
                <p className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.4em]">Inhale . Exhale . Drift</p>
              </div>
              <div className="flex space-x-3">
                 {[15, 30, 60].map(mins => (
                   <button 
                     key={mins}
                     onClick={() => setSleepTimer(sleepTimer === mins ? null : mins)}
                     className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${sleepTimer === mins ? 'bg-white text-stone-900 border-white' : 'text-white/40 border-white/10'}`}
                   >
                     {mins}m Timer
                   </button>
                 ))}
              </div>
              <div className="w-full space-y-6">
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                   <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-center items-center">
                   <button onClick={togglePlay} className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-xl active:scale-90 transition-transform">
                      {isPlaying ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-10 h-10 ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}

      <div className={`fixed bottom-24 left-6 right-6 z-50 transition-all duration-500 ${isImmersive ? 'opacity-0 pointer-events-none translate-y-10' : 'animate-in slide-in-from-bottom-5'}`}>
        <div className="bg-stone-900/95 backdrop-blur-xl rounded-[32px] p-4 shadow-2xl border border-white/10 flex items-center space-x-4">
          <audio 
            ref={audioRef} 
            onTimeUpdate={() => {
              if (audioRef.current && audioRef.current.duration) {
                const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                setProgress(p || 0);
              }
            }}
            onEnded={() => {
              if (!isLooping) {
                setIsPlaying(false);
                if (onSessionComplete) onSessionComplete();
              }
            }}
            onError={handleAudioError}
            onCanPlay={() => { setIsBuffering(false); setError(null); }}
            onWaiting={() => setIsBuffering(true)}
            preload="auto"
            crossOrigin="anonymous"
          />
          <button onClick={() => setIsImmersive(true)} className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 relative group">
            {isBuffering && !error && (
              <div className="absolute inset-0 border-3 border-white/20 border-t-white rounded-2xl animate-spin"></div>
            )}
            <svg className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1.5 px-1">
               <h4 className="text-white font-black text-[13px] md:text-[15px] truncate serif tracking-tight">
                 {error ? <span className="text-rose-400">{error}</span> : title}
               </h4>
               {sleepTimer && <span className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">{sleepTimer}m</span>}
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${error ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={togglePlay} className="w-10 h-10 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 text-white/50 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;
