import React, { useState, useRef, useEffect } from 'react';
import { AMBIENT_SOUNDS } from '../constants';

interface SoundState {
  id: string;
  isPlaying: boolean;
  volume: number;
}

const SoundMixer: React.FC = () => {
  const [activeSounds, setActiveSounds] = useState<Record<string, SoundState>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const toggleSound = (id: string, url: string) => {
    const isCurrentlyPlaying = activeSounds[id]?.isPlaying;
    
    if (isCurrentlyPlaying) {
      if (audioRefs.current[id]) audioRefs.current[id].pause();
      setActiveSounds(prev => ({
        ...prev,
        [id]: { ...prev[id], isPlaying: false }
      }));
    } else {
      if (!audioRefs.current[id]) {
        audioRefs.current[id] = new Audio();
        audioRefs.current[id].loop = true;
      }
      
      const currentVolume = activeSounds[id]?.volume ?? 0.5;
      audioRefs.current[id].volume = currentVolume;
      
      // Clean up the URL to point to the root / of public
      const fileName = url.split('/').pop() || url;
      const fullPath = `/${fileName}`;
      
      audioRefs.current[id].src = fullPath;
      
      audioRefs.current[id].play().catch(() => {
        // Fallback to explicit /public prefix just in case
        audioRefs.current[id].src = `/public/${fileName}`;
        audioRefs.current[id].play().catch(e => console.error("Ambient sound failed at all root paths:", e));
      });
      
      setActiveSounds(prev => ({
        ...prev,
        [id]: { id, isPlaying: true, volume: currentVolume }
      }));
    }
  };

  const handleVolumeChange = (id: string, volume: number) => {
    if (audioRefs.current[id]) {
      audioRefs.current[id].volume = volume;
    }
    setActiveSounds(prev => ({
      ...prev,
      [id]: { ...prev[id], volume }
    }));
  };

  useEffect(() => {
    return () => {
      // Fix: Iterating via Object.keys to ensure TypeScript correctly identifies audioRefs.current[key] as HTMLAudioElement
      // This resolves errors where Object.values might return an 'unknown' type.
      Object.keys(audioRefs.current).forEach(key => {
        const audio = audioRefs.current[key];
        if (audio) {
          audio.pause();
          audio.src = "";
          audio.load();
        }
      });
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {AMBIENT_SOUNDS.map(sound => {
        const state = activeSounds[sound.id] || { isPlaying: false, volume: 0.5 };
        return (
          <div 
            key={sound.id} 
            className={`p-6 rounded-[32px] border transition-all flex items-center space-x-5 ${
              state.isPlaying ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-100/50' : 'bg-white border-stone-100'
            }`}
          >
            <button 
              onClick={() => toggleSound(sound.id, sound.url)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all active:scale-90 ${
                state.isPlaying ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-stone-50 text-stone-400'
              }`}
            >
              {sound.icon}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-800">{sound.name}</span>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  {state.isPlaying ? 'Active' : 'Muted'}
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={!state.isPlaying}
                value={state.volume}
                onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                className={`w-full h-1.5 rounded-full appearance-none transition-all ${
                  state.isPlaying ? 'accent-emerald-500 bg-emerald-100' : 'bg-stone-100 opacity-50'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SoundMixer;