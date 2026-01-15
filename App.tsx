import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language, ZenCenter } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS } from './constants';
import { translations } from './translations';
import { getPersonalizedRecommendation, findNearbyZenCenters } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [nearbyCenters, setNearbyCenters] = useState<ZenCenter[]>([]);
  const [isFindingCenters, setIsFindingCenters] = useState(false);

  const t = useMemo(() => translations[lang] || translations['en'], [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('calmrelax_active_user');
    const savedLang = localStorage.getItem('calmrelax_lang');
    if (savedLang) setLang(savedLang as Language);
    
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.isLoggedIn) {
          setUser(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Auth restoration failed", e);
        localStorage.removeItem('calmrelax_active_user');
      }
    }
  }, []);

  const handleMoodSelect = async (selectedMood: string) => {
    setMood(selectedMood);
    setIsLoadingAdvice(true);
    try {
      const advice = await getPersonalizedRecommendation(selectedMood, lang);
      setAiAdvice(advice);
    } catch (err) {
      setAiAdvice("Peace is found in the stillness between thoughts.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleFindCenters = () => {
    setIsFindingCenters(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const centers = await findNearbyZenCenters(position.coords.latitude, position.coords.longitude);
        setNearbyCenters(centers);
        setIsFindingCenters(false);
      }, () => {
        findNearbyZenCenters(37.7749, -122.4194).then(centers => {
          setNearbyCenters(centers);
          setIsFindingCenters(false);
        });
      });
    }
  };

  const handleGoogleLogin = () => {
    const mockUser: User = {
      id: "google-123",
      name: "Zen Explorer",
      email: "vvkkoo4816@gmail.com",
      photoUrl: "https://ui-avatars.com/api/?name=Zen+Explorer&background=10b981&color=fff",
      isLoggedIn: true,
      streak: 5,
      minutesMeditated: 420,
      role: 'admin'
    };
    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('calmrelax_active_user');
    setView('today');
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-between py-20 px-10 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-100/40 rounded-full blur-[120px]"></div>
        <div className="flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200/50 mb-8">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-5xl font-black serif mb-4 text-stone-900 tracking-tight">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium max-w-xs text-lg">{t.app_slogan}</p>
        </div>
        <button onClick={handleGoogleLogin} className="w-full max-w-sm flex items-center justify-center space-x-4 bg-white border border-stone-200 text-stone-700 px-8 py-5 rounded-full font-bold shadow-sm hover:shadow-xl transition-all active:scale-[0.98] relative z-10">
          <span className="text-lg font-extrabold">{t.sign_in_google}</span>
        </button>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto pb-24 space-y-12 relative z-10">
        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <header>
              <h2 className="text-4xl font-black serif leading-tight text-stone-900">{t.welcome_back},<br/>{user.name}</h2>
              <div className="flex items-center space-x-2 mt-4">
                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{user.streak} {t.day_streak} 🔥</span>
              </div>
            </header>

            <section className="bg-white/90 backdrop-blur-md rounded-[48px] p-8 border border-white shadow-xl">
              <h3 className="text-xl font-black text-stone-800 tracking-tight mb-6">Spirit Check-in</h3>
              <div className="flex justify-between items-center mb-8">
                {['Happy', 'Calm', 'Stressed', 'Sad', 'Anxious'].map((m) => (
                  <button key={m} onClick={() => handleMoodSelect(m)} className={`flex flex-col items-center space-y-2 transition-all ${mood === m ? 'scale-110' : 'opacity-40'}`}>
                    <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-2xl ${mood === m ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-stone-50 text-stone-400'}`}>
                      {m === 'Happy' && '😊'} {m === 'Calm' && '😌'} {m === 'Stressed' && '😫'} {m === 'Sad' && '😔'} {m === 'Anxious' && '😰'}
                    </div>
                  </button>
                ))}
              </div>
              {aiAdvice && <div className="bg-emerald-50/40 p-6 rounded-[32px] border border-emerald-100/50">
                <p className="text-stone-700 italic text-sm font-medium serif">"{aiAdvice}"</p>
              </div>}
            </section>

            <section onClick={() => setActiveSession(DAILY_MEDITATION)} className="cursor-pointer group relative">
              <div className="aspect-[2/1] bg-emerald-500 rounded-[56px] relative overflow-hidden shadow-2xl transition-all hover:scale-[1.01]">
                <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="daily" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] bg-black/40 px-4 py-1.5 rounded-full mb-4 inline-block">{t.daily_zen}</span>
                  <h3 className="text-3xl font-black text-white serif">{DAILY_MEDITATION.title}</h3>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <header>
              <h2 className="text-3xl font-black serif text-stone-900 tracking-tight">The Core Collection</h2>
              <p className="text-stone-400 mt-2 font-medium">Distinct soul-scapes, curated for deep focus.</p>
            </header>
            
            <div className="grid grid-cols-2 gap-4">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-square bg-white rounded-[40px] relative overflow-hidden cursor-pointer group shadow-sm border border-stone-100 hover:shadow-2xl transition-all">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">{session.category}</p>
                    <h4 className="text-white font-black text-sm serif leading-tight">{session.title}</h4>
                  </div>
                </div>
              ))}
            </div>

            <section className="pt-6">
               <h3 className="text-xl font-black text-stone-800 mb-6">Atmospheric Mixer</h3>
               <SoundMixer />
            </section>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-10 animate-in fade-in duration-700 text-center py-20">
             <div className="w-24 h-24 bg-stone-900 rounded-[32px] mx-auto flex items-center justify-center text-white mb-8 shadow-2xl">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
             </div>
             <h2 className="text-3xl font-black serif text-stone-900">Sleep Sanctuary</h2>
             <p className="text-stone-400 max-w-xs mx-auto mb-10">Low-frequency drift sessions for deep, undisturbed rest.</p>
             <button onClick={() => setActiveSession(MEDITATION_SESSIONS[1])} className="bg-stone-900 text-white px-10 py-5 rounded-[32px] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Start Night Session</button>
          </div>
        )}
        
        {view === 'explore' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900">Discover</h2>
            <BreathingExercise lang={lang} />
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-10 animate-in fade-in duration-700 text-center">
             <img src={user.photoUrl} className="w-24 h-24 rounded-[32px] border-4 border-white shadow-2xl mx-auto" alt="profile" />
             <h2 className="text-3xl font-black serif text-stone-900">{user.name}</h2>
             <button onClick={handleLogout} className="bg-red-50 text-red-500 px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest">Sign Out</button>
          </div>
        )}
      </div>

      {activeSession && (
        <AudioPlayer 
          url={activeSession.audioUrl} 
          title={activeSession.title} 
          onClose={() => setActiveSession(null)} 
        />
      )}
    </Layout>
  );
};

export default App;