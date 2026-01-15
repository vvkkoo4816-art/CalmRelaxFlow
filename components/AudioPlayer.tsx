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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Resolution logic
  const getAbsoluteUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/+/, '');
    // Using a simpler query param to avoid double-caching issues
    return `${window.location.origin}/${cleanPath}?rel=${Date.now()}`;
  };

  const finalUrl = getAbsoluteUrl(url);

  useEffect(() => {
    const verifyAndLoad = async () => {
      setError(null);
      setIsBuffering(true);
      setIsPlaying(false);
      setProgress(0);

      try {
        // PRE-FLIGHT CHECK: Verify this is actually an audio file
        const response = await fetch(finalUrl, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');

        if (!response.ok || (contentType && contentType.includes('text/html'))) {
          console.error("Server returned HTML instead of Audio. File is likely missing.");
          setError("FILE MISSING");
          setIsBuffering(false);
          return;
        }

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = finalUrl;
          audioRef.current.load();
        }
      } catch (e) {
        setError("NETWORK ERROR");
        setIsBuffering(false);
      }
    };

    verifyAndLoad();
  }, [finalUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const togglePlay = () => {
    if (!audioRef.current || error) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsBuffering(true);
      
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          setError(null);
        })
        .catch((err: Error) => {
          console.error("Playback failed:", err.name);
          if (err.name === 'NotSupportedError') {
            setError("BAD FILE FORMAT");
          } else if (err.name === 'NotAllowedError') {
            setError("TAP TO PLAY");
          } else {
            setError("ERROR");
          }
          setIsBuffering(false);
          setIsPlaying(false);
        });
    }
  };

  return (
    <div className="fixed bottom-24 left-6 right-6 z-50 animate-in slide-in-from-bottom-10">
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
          onCanPlay={() => {
            setIsBuffering(false);
            if (error === "FILE MISSING") return;
            setError(null);
          }}
          onWaiting={() => setIsBuffering(true)}
          preload="auto"
        />
        
        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 relative overflow-hidden">
          {isBuffering && !error && (
            <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-3xl animate-spin"></div>
          )}
          <svg className={`w-8 h-8 ${isPlaying ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>

        <div className="flex-1 min-w-0 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-1">
             <h4 className="text-white font-black text-lg truncate tracking-tight serif">{title}</h4>
             {error && (
               <div className="flex items-center space-x-2">
                 <span className="text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                   {error}
                 </span>
                 <span className="bg-red-500/20 px-2 py-0.5 rounded text-[8px] text-red-200 font-mono">
                   check /public/{url}
                 </span>
               </div>
             )}
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${error ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsLooping(!isLooping)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLooping ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/20 hover:text-white/40'}`}
            title="Loop Session"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button 
            onClick={togglePlay}
            disabled={error === "FILE MISSING"}
            className="w-14 h-14 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform disabled:opacity-30"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 text-white/30 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;