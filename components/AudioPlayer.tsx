import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, title, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getPossiblePaths = (baseUrl: string) => {
    if (baseUrl.startsWith('http')) return [baseUrl];
    const fileName = baseUrl.split('/').pop() || baseUrl;
    return [`/${fileName}`, `./${fileName}`, `/public/${fileName}`, baseUrl].filter((v, i, a) => a.indexOf(v) === i);
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

  const handleAudioError = () => {
    const nextIndex = attemptIndex + 1;
    if (nextIndex < possiblePaths.length) {
      setAttemptIndex(nextIndex);
      if (audioRef.current) {
        audioRef.current.src = possiblePaths[nextIndex];
        audioRef.current.load();
      }
    } else {
      setError("FILE NOT FOUND");
      setIsBuffering(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || error === "FILE NOT FOUND") return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsBuffering(true);
      setError(null);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }).catch(() => {
          handleAudioError();
          setIsBuffering(false);
          setIsPlaying(false);
        });
      }
    }
  };

  return (
    <>
      {/* Immersive Focus View */}
      {isImmersive && (
        <div className="fixed inset-0 z-[60] bg-stone-950 flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-700">
           <div className="absolute inset-0 bg-emerald-900/10 animate-pulse duration-[10s]"></div>
           <button onClick={() => setIsImmersive(false)} className="absolute top-12 right-10 text-white/40 hover:text-white transition-colors">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
           
           <div className="relative flex flex-col items-center text-center space-y-12 w-full max-w-lg">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-[80px] bg-emerald-500 shadow-2xl shadow-emerald-500/20 flex items-center justify-center overflow-hidden">
                 <div className={`w-full h-full bg-white/10 ${isPlaying ? 'animate-[pulse_4s_infinite]' : ''}`}></div>
              </div>
              <div>
                <h3 className="text-4xl font-black serif text-white mb-2 leading-tight">{title}</h3>
                <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em]">Inhale . Exhale . Drift</p>
              </div>
              
              <div className="w-full space-y-6">
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden relative">
                   <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.8)]" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-center items-center space-x-12">
                   <button onClick={togglePlay} className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-2xl active:scale-90 transition-transform">
                      {isPlaying ? (
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-12 h-12 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Mini Player Bar */}
      <div className={`fixed bottom-24 left-6 right-6 z-50 transition-all duration-700 ${isImmersive ? 'opacity-0 pointer-events-none translate-y-20' : 'animate-in slide-in-from-bottom-10'}`}>
        <div className="bg-stone-900/98 backdrop-blur-3xl rounded-[40px] p-6 shadow-2xl border border-white/10 flex flex-col md:flex-row items-center md:space-x-6 space-y-4 md:space-y-0">
          <audio 
            ref={audioRef} 
            onTimeUpdate={() => {
              if (audioRef.current && audioRef.current.duration) {
                const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                setProgress(p || 0);
              }
            }}
            onEnded={() => !isLooping && setIsPlaying(false)}
            onError={handleAudioError}
            onCanPlay={() => { setIsBuffering(false); setError(null); }}
            onWaiting={() => setIsBuffering(true)}
            preload="auto"
          />
          
          <button onClick={() => setIsImmersive(true)} className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            </div>
            {isBuffering && !error && (
              <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-3xl animate-spin"></div>
            )}
            <svg className={`w-8 h-8 ${isPlaying ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-1">
               <h4 className="text-white font-black text-lg truncate tracking-tight serif">{title}</h4>
               {error && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</span>}
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${error ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="w-14 h-14 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={onClose} className="w-10 h-10 bg-white/5 text-white/30 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;