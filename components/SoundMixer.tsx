
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
      
      const fileName = url.split('/').pop() || url;
      // Use absolute path as the primary standard
      const fullPath = `/${fileName}`;
      
      audioRefs.current[id].src = fullPath;
      
      audioRefs.current[id].play().catch(() => {
        // Fallback for non-standard local environments
        audioRefs.current[id].src = `./${fileName}`;
        audioRefs.current[id].play().catch(e => {
          console.error(`Ambient sound resonance failure for ${id}:`, e);
          setActiveSounds(prev => ({
            ...prev,
            [id]: { ...prev[id], isPlaying: false }
          }));
        });
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {AMBIENT_SOUNDS.map(sound => {
        const state = activeSounds[sound.id] || { isPlaying: false, volume: 0.5 };
        return (
          <div 
            key={sound.id} 
            className={`p-4 md:p-6 rounded-[28px] border transition-all duration-500 flex items-center space-x-4 ${
              state.isPlaying ? 'bg-emerald-50 border-emerald-100 shadow-md' : 'bg-white border-stone-100 hover:border-stone-200 shadow-sm'
            }`}
          >
            <button 
              onClick={() => toggleSound(sound.id, sound.url)}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all active:scale-95 shrink-0 ${
                state.isPlaying ? 'bg-emerald-600 text-white' : 'bg-stone-50 text-stone-300'
              }`}
            >
              <span className={state.isPlaying ? 'animate-pulse' : ''}>{sound.icon}</span>
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="font-bold text-stone-900 text-sm tracking-tight">{sound.name}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${state.isPlaying ? 'text-emerald-600' : 'text-stone-300'}`}>
                  {state.isPlaying ? 'On' : 'Off'}
                </span>
              </div>
              <div className="relative h-1.5 w-full">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={!state.isPlaying}
                  value={state.volume}
                  onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                  className={`absolute inset-0 w-full h-1.5 rounded-full appearance-none transition-all cursor-pointer ${
                    state.isPlaying ? 'accent-emerald-600 bg-emerald-100' : 'bg-stone-100 opacity-30 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SoundMixer;
