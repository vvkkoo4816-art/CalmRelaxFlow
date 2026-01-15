import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, title, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Encode the URL to handle Chinese characters and spaces correctly
  // We also ensure it starts with a leading slash to point to the public root
  const encodedUrl = encodeURI(url.startsWith('/') ? url : `/${url}`);

  useEffect(() => {
    setError(null);
    setIsBuffering(true);
    if (audioRef.current) {
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(err => {
            console.error("Playback failed:", err);
            // Auto-play is often blocked by browsers until user interaction
            setIsPlaying(false);
            setIsBuffering(false);
          });
      }
    }
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => setError("Playback blocked. Click again."));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleAudioError = () => {
    setError(`File not found: "${url}". Please ensure it is in the "public" folder.`);
    setIsBuffering(false);
  };

  return (
    <div className="fixed bottom-24 left-6 right-6 z-50 animate-in slide-in-from-bottom-10">
      <div className="bg-stone-900/95 backdrop-blur-2xl rounded-[40px] p-6 shadow-2xl border border-white/10 flex flex-col md:flex-row items-center md:space-x-6 space-y-4 md:space-y-0">
        <audio 
          ref={audioRef} 
          src={encodedUrl} 
          onTimeUpdate={onTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={handleAudioError}
          onCanPlay={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          preload="auto"
        />
        
        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 relative">
          {isBuffering && (
            <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-3xl animate-spin"></div>
          )}
          <svg className={`w-8 h-8 ${isPlaying ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex justify-between items-end mb-1">
             <h4 className="text-white font-bold text-lg truncate">{title}</h4>
             {error && <span className="text-red-400 text-[10px] font-black uppercase animate-pulse">Error</span>}
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${error ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {error && <p className="text-red-300 text-[10px] mt-2 font-medium leading-tight">{error}</p>}
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={togglePlay}
            disabled={!!error}
            className="w-12 h-12 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 text-white/40 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;