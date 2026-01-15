import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS } from './constants';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    const savedUser = localStorage.getItem('calmrelax_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.isLoggedIn) {
          setUser(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Auth restoration failed", e);
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    // Simulate a professional Google Login flow
    const mockUser: User = {
      id: "google-123",
      name: "Zen Explorer",
      email: "vvkkoo4816@gmail.com", // Keeping your admin email
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

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-between py-20 px-10 text-center">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 mb-8">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-4xl font-black serif mb-3">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium max-w-xs">{t.personalized_paths}</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={handleGoogleLogin} 
            className="w-full flex items-center justify-center space-x-4 bg-white border border-stone-200 text-stone-700 px-8 py-4 rounded-full font-bold shadow-sm hover:bg-stone-50 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.77-3.77C18.54 1.25 15.52 0 12 0 7.31 0 3.25 2.69 1.18 6.6l4.41 3.42c1.04-3.12 3.97-5.38 7.41-5.38z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.85-.07-1.67-.21-2.45H12v4.64h6.44c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.64z"/>
              <path fill="#FBBC05" d="M5.59 14.58c-.24-.71-.38-1.48-.38-2.28 0-.8.14-1.57.38-2.28L1.18 6.6C.43 8.22 0 10.06 0 12s.43 3.78 1.18 5.4l4.41-3.42z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.7-2.87c-1.08.73-2.48 1.16-4.24 1.16-3.44 0-6.37-2.26-7.41-5.38l-4.41 3.42C3.25 21.31 7.31 24 12 24z"/>
            </svg>
            <span>{t.sign_in_google}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto pb-24 space-y-12">
        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
            <header>
              <h2 className="text-4xl font-black serif leading-tight">{t.welcome_back},<br/>{user.name}</h2>
              <p className="text-emerald-600 font-black text-xs uppercase tracking-widest mt-4">5 Day Streak 🔥</p>
            </header>

            <section>
              <div 
                className="aspect-[4/3] bg-emerald-500 rounded-[48px] relative overflow-hidden shadow-2xl group cursor-pointer"
                onClick={() => setActiveSession(DAILY_MEDITATION)}
              >
                <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" alt="daily" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-black/30 px-3 py-1 rounded-full backdrop-blur-md mb-4 inline-block">{t.daily_zen}</span>
                  <h3 className="text-3xl font-black text-white serif">{DAILY_MEDITATION.title}</h3>
                  <p className="text-white/70 text-sm mt-2 line-clamp-2">{DAILY_MEDITATION.description}</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h4 className="text-xl font-black serif">{t.quick_relief}</h4>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {MEDITATION_SESSIONS.filter(s => s.category === 'Quick Relief').map(session => (
                  <button 
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className="flex-shrink-0 w-40 h-40 rounded-[32px] bg-white border border-stone-100 p-5 text-left flex flex-col justify-between shadow-sm active:scale-95 transition-all"
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    <span className="font-bold text-stone-800 text-sm">{session.title}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
            <h2 className="text-3xl font-black serif">{t.soundscape_mixer}</h2>
            <SoundMixer />
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
             <h2 className="text-3xl font-black serif">{t.sleep_sanctuary}</h2>
             <div className="grid grid-cols-2 gap-4">
                {MEDITATION_SESSIONS.filter(s => s.category === 'Sleep').map(session => (
                  <div 
                    key={session.id} 
                    onClick={() => setActiveSession(session)}
                    className="aspect-square rounded-[40px] relative overflow-hidden cursor-pointer group"
                  >
                    <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform" alt={session.title} />
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h4 className="text-white font-bold leading-tight">{session.title}</h4>
                      <p className="text-white/60 text-[10px] uppercase font-black tracking-widest mt-1">{session.duration}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'breathing' && (
          <BreathingExercise lang={lang} />
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