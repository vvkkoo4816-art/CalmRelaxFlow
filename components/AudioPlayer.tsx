
import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  url: string;
  title: string;
  onClose?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, title, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setError(null);
    setIsLoaded(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current && isLoaded) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setError("Audio unavailable. Check your connection.");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(currentProgress) ? 0 : currentProgress);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
    }
  };

  const handleError = () => {
    setError("Source not found. Please try another track.");
    setIsPlaying(false);
  };

  const handleCanPlay = () => {
    setIsLoaded(true);
    setError(null);
  };

  return (
    <div className="fixed bottom-[100px] md:bottom-8 left-4 right-4 md:left-auto md:w-96 bg-white/95 backdrop-blur-xl android-card android-shadow p-6 border border-white/20 z-[100] animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
      {/* Background Pulse Effect */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-emerald-400 rounded-full blur-[100px] pulse-bg"></div>
        </div>
      )}

      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
        onCanPlay={handleCanPlay}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600 font-extrabold mb-1">Now Playing</p>
            <h3 className="font-bold text-stone-800 truncate text-lg">{title}</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 active:scale-90 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {error ? (
          <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        ) : (
          <div className="flex items-center space-x-4 mb-5">
            <button 
              onClick={togglePlay}
              disabled={!isLoaded}
              className={`w-14 h-14 ${isLoaded ? 'bg-stone-900 shadow-xl shadow-stone-200' : 'bg-stone-200'} rounded-full flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-50`}
            >
              {!isLoaded ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <div className="flex-1">
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="0.1"
                value={progress} 
                onChange={handleSeek}
                className="w-full accent-emerald-500 h-1.5 rounded-full cursor-pointer bg-stone-100 appearance-none transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-stone-400">
            <span className="text-sm">🔈</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-stone-300 h-1 rounded-full bg-stone-100 appearance-none"
            />
          </div>
          <div className="flex space-x-4">
             <button className="text-stone-300 hover:text-emerald-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
