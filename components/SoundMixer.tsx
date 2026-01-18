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
      const fullPath = `/${fileName}`;
      
      audioRefs.current[id].src = fullPath;
      
      audioRefs.current[id].play().catch(() => {
        audioRefs.current[id].src = `./${fileName}`;
        audioRefs.current[id].play().catch(e => console.error("Ambient sound failed:", e));
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {AMBIENT_SOUNDS.map(sound => {
        const state = activeSounds[sound.id] || { isPlaying: false, volume: 0.5 };
        return (
          <div 
            key={sound.id} 
            className={`p-8 rounded-[40px] border transition-all duration-700 flex items-center space-x-6 ${
              state.isPlaying ? 'bg-emerald-50/50 border-emerald-200 shadow-xl shadow-emerald-500/5 translate-y-[-4px]' : 'bg-white border-stone-100 hover:border-stone-200 shadow-sm'
            }`}
          >
            <button 
              onClick={() => toggleSound(sound.id, sound.url)}
              className={`w-18 h-18 rounded-[24px] flex items-center justify-center text-4xl shadow-2xl transition-all active:scale-90 ${
                state.isPlaying ? 'bg-emerald-600 text-white shadow-emerald-600/30' : 'bg-stone-50 text-stone-300'
              }`}
            >
              <span className={state.isPlaying ? 'animate-pulse' : ''}>{sound.icon}</span>
            </button>
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-black text-stone-900 text-lg tracking-tight">{sound.name}</span>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${state.isPlaying ? 'text-emerald-600' : 'text-stone-300'}`}>
                  {state.isPlaying ? 'Resonating' : 'Silent'}
                </span>
              </div>
              <div className="relative h-2 w-full">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={!state.isPlaying}
                  value={state.volume}
                  onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                  className={`absolute inset-0 w-full h-2 rounded-full appearance-none transition-all cursor-pointer ${
                    state.isPlaying ? 'accent-emerald-600 bg-emerald-100/50' : 'bg-stone-100 opacity-40 cursor-not-allowed'
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