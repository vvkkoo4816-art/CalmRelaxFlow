import React, { useState, useEffect } from 'react';
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

  const t = translations[lang] || translations['en'];

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
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calmrelax_lang', lang);
  }, [lang]);

  const handleMoodSelect = async (selectedMood: string) => {
    setMood(selectedMood);
    setIsLoadingAdvice(true);
    const advice = await getPersonalizedRecommendation(selectedMood, lang);
    setAiAdvice(advice);
    setIsLoadingAdvice(false);
  };

  const handleFindCenters = () => {
    setIsFindingCenters(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const centers = await findNearbyZenCenters(position.coords.latitude, position.coords.longitude);
        setNearbyCenters(centers);
        setIsFindingCenters(false);
      }, (error) => {
        console.error("Location error", error);
        findNearbyZenCenters(37.7749, -122.4194).then(centers => {
          setNearbyCenters(centers);
          setIsFindingCenters(false);
        });
      });
    } else {
       findNearbyZenCenters(37.7749, -122.4194).then(centers => {
         setNearbyCenters(centers);
         setIsFindingCenters(false);
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
  };

  const getMoodColor = () => {
    switch(mood) {
      case 'Happy': return 'bg-amber-50/40';
      case 'Calm': return 'bg-emerald-50/40';
      case 'Stressed': return 'bg-orange-50/40';
      case 'Sad': return 'bg-blue-50/40';
      case 'Anxious': return 'bg-purple-50/40';
      default: return 'bg-[#fdfcfb]';
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-between py-20 px-10 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-100/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-stone-100 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-50/30 rounded-full blur-[80px] animate-bounce duration-[10s]"></div>

        <div className="flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200/50 mb-8 transform transition-transform hover:rotate-12">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-5xl font-black serif mb-4 text-stone-900 tracking-tight leading-none">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium max-w-xs text-lg transition-all duration-500">
            {t.app_slogan}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          {/* Enhanced Language Selector on Login Page */}
          <div className="space-y-3">
             <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{t.select_language}</p>
             <div className="flex items-center justify-center p-1 bg-white/50 backdrop-blur-md border border-stone-100 rounded-2xl shadow-sm">
              {[
                { id: 'en', label: 'English' },
                { id: 'zh-Hans', label: '简体' },
                { id: 'zh-Hant', label: '繁體' }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id as Language)}
                  className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    lang === l.id 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            className="w-full flex items-center justify-center space-x-4 bg-white border border-stone-200 text-stone-700 px-8 py-5 rounded-full font-bold shadow-sm hover:shadow-xl hover:bg-stone-50 active:scale-[0.98] transition-all duration-500 group"
          >
            <div className="transition-transform group-hover:scale-110">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.77-3.77C18.54 1.25 15.52 0 12 0 7.31 0 3.25 2.69 1.18 6.6l4.41 3.42c1.04-3.12 3.97-5.38 7.41-5.38z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.85-.07-1.67-.21-2.45H12v4.64h6.44c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.64z"/>
                <path fill="#FBBC05" d="M5.59 14.58c-.24-.71-.38-1.48-.38-2.28 0-.8.14-1.57.38-2.28L1.18 6.6C.43 8.22 0 10.06 0 12s.43 3.78 1.18 5.4l4.41-3.42z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.7-2.87c-1.08.73-2.48 1.16-4.24 1.16-3.44 0-6.37-2.26-7.41-5.38l-4.41 3.42C3.25 21.31 7.31 24 12 24z"/>
              </svg>
            </div>
            <span className="text-lg tracking-tight font-extrabold">{t.sign_in_google}</span>
          </button>
          
          <div className="flex flex-col items-center space-y-2">
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.3em]">Zen Protocol V1.3</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className={`fixed inset-0 pointer-events-none transition-colors duration-1000 ${getMoodColor()} z-0`}></div>
      <div className="max-w-2xl mx-auto pb-24 space-y-12 relative z-10">
        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <header className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-black serif leading-tight text-stone-900">{t.welcome_back},<br/>{user.name}</h2>
                <div className="flex items-center space-x-2 mt-4">
                  <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{user.streak} {t.day_streak} 🔥</span>
                  <span className="text-stone-400 font-black text-[10px] uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full border border-stone-100">{user.minutesMeditated} {t.total_minutes}</span>
                </div>
              </div>
            </header>

            <section className="bg-white/80 backdrop-blur-md rounded-[40px] p-8 border border-white shadow-xl transition-all hover:shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-stone-800 tracking-tight">How is your spirit today?</h3>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <div className="flex justify-between items-center mb-8 px-2 overflow-x-auto no-scrollbar">
                {['Happy', 'Calm', 'Stressed', 'Sad', 'Anxious'].map((m) => (
                  <button 
                    key={m} 
                    onClick={() => handleMoodSelect(m)}
                    className={`flex flex-col items-center space-y-3 group transition-all transform shrink-0 mx-2 ${mood === m ? 'scale-110 active:scale-100' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                  >
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-3xl transition-all duration-500 ${mood === m ? 'bg-emerald-500 shadow-xl shadow-emerald-200 text-white' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}>
                      {m === 'Happy' && '😊'}
                      {m === 'Calm' && '😌'}
                      {m === 'Stressed' && '😫'}
                      {m === 'Sad' && '😔'}
                      {m === 'Anxious' && '😰'}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${mood === m ? 'text-emerald-600' : 'text-stone-300'}`}>{m}</span>
                  </button>
                ))}
              </div>

              {isLoadingAdvice && (
                <div className="flex items-center justify-center py-6 space-x-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                </div>
              )}

              {aiAdvice && !isLoadingAdvice && (
                <div className="bg-emerald-50/40 p-6 rounded-[32px] border border-emerald-100/50 animate-in fade-in zoom-in duration-500">
                  <p className="text-stone-700 italic text-sm leading-relaxed mb-3 font-medium serif">"{aiAdvice}"</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-px bg-emerald-200"></div>
                    <p className="text-emerald-600 text-[9px] font-black uppercase tracking-[0.3em]">{t.mindfulness_coach}</p>
                  </div>
                </div>
              )}
            </section>

            <section onClick={() => setActiveSession(DAILY_MEDITATION)} className="cursor-pointer group relative">
              <div className="aspect-[16/9] md:aspect-[2/1] bg-emerald-500 rounded-[48px] relative overflow-hidden shadow-2xl transition-all duration-700 group-hover:scale-[1.01] group-hover:shadow-emerald-100">
                <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[10s]" alt="daily" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md mb-4 inline-block border border-white/10">{t.daily_zen}</span>
                  <h3 className="text-4xl font-black text-white serif tracking-tight">{DAILY_MEDITATION.title}</h3>
                  <div className="flex items-center mt-4 space-x-3 text-white/60 font-bold text-xs">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     <span>{DAILY_MEDITATION.duration}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <header>
              <h2 className="text-3xl font-black serif text-stone-900 tracking-tight">{t.soundscape_mixer}</h2>
              <p className="text-stone-400 mt-2 font-medium max-w-sm">{t.mixer_desc}</p>
            </header>
            <SoundMixer />
            
            <section className="space-y-6 pt-6">
               <h3 className="text-xl font-black text-stone-800 tracking-tight">Quick Breathing Exercises</h3>
               <BreathingExercise lang={lang} />
            </section>

            <section className="space-y-6 pt-6">
              <h3 className="text-xl font-black text-stone-800 tracking-tight">{t.explore_topics}</h3>
              <div className="grid grid-cols-1 gap-4">
                {MEDITATION_SESSIONS.filter(s => s.category !== 'Sleep').map(session => (
                  <div 
                    key={session.id} 
                    onClick={() => setActiveSession(session)} 
                    className="p-5 bg-white rounded-[32px] border border-stone-100 flex items-center space-x-4 cursor-pointer hover:shadow-xl transition-all"
                  >
                    <img src={session.imageUrl} className="w-16 h-16 rounded-2xl object-cover" alt={session.title} />
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-800">{session.title}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{session.duration} • {session.category}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <header>
              <h2 className="text-3xl font-black serif text-stone-900 tracking-tight">{t.sleep_sanctuary}</h2>
              <p className="text-stone-400 mt-2 font-medium">Drift into the quiet of the night.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MEDITATION_SESSIONS.filter(s => s.category === 'Sleep').map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] rounded-[40px] relative overflow-hidden cursor-pointer group shadow-sm border border-stone-50 transition-all hover:shadow-2xl hover:-translate-y-1">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-6 right-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">{session.duration}</p>
                    <div className="text-white font-black leading-tight text-lg serif">{session.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900 tracking-tight">Explore & Discover</h2>
            
            <section className="bg-emerald-500/5 backdrop-blur-sm rounded-[48px] p-8 border border-emerald-100 shadow-xl shadow-emerald-50/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
               <div className="flex items-center space-x-4 mb-8 relative z-10">
                 <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                   <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-stone-800 tracking-tight">{t.wellness_near_you}</h3>
                   <p className="text-stone-500 text-sm font-medium">Sacred spaces waiting for your visit.</p>
                 </div>
               </div>
               
               {nearbyCenters.length > 0 ? (
                 <div className="space-y-4 relative z-10">
                   {nearbyCenters.map((center, idx) => (
                     <a key={idx} href={center.url} target="_blank" rel="noopener noreferrer" className="block p-5 bg-white rounded-[32px] border border-emerald-50 hover:shadow-xl transition-all hover:scale-[1.02] animate-in slide-in-from-left-4 fade-in">
                       <div className="flex justify-between items-start">
                         <div className="space-y-1">
                           <h4 className="font-black text-stone-800 text-lg">{center.name}</h4>
                           <p className="text-stone-400 text-xs font-medium">{center.address}</p>
                         </div>
                         <div className="bg-emerald-50 px-2 py-1 rounded-lg flex items-center space-x-1">
                            <span className="text-emerald-600 font-black text-[10px]">{center.rating}</span>
                            <svg className="w-2.5 h-2.5 text-emerald-500 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                         </div>
                       </div>
                     </a>
                   ))}
                   <button onClick={handleFindCenters} className="w-full py-4 text-emerald-600 font-black text-xs uppercase tracking-widest border-2 border-dashed border-emerald-100 rounded-3xl hover:bg-emerald-50 transition-colors">
                     Refresh Locations
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={handleFindCenters}
                   disabled={isFindingCenters}
                   className="w-full bg-stone-900 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
                 >
                   {isFindingCenters ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       <span>{t.scan_area}...</span>
                     </>
                   ) : (
                     <span>{t.scan_area}</span>
                   )}
                 </button>
               )}
            </section>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <header className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <img src={user.photoUrl} className="w-24 h-24 rounded-[32px] border-4 border-white shadow-2xl" alt="profile" />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </div>
                </div>
                <div>
                   <h2 className="text-3xl font-black serif text-stone-900 tracking-tight">{user.name}</h2>
                   <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mt-1">{user.email}</p>
                </div>
             </header>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm text-center">
                   <p className="text-3xl font-black serif text-emerald-600">{user.streak}</p>
                   <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mt-1">{t.day_streak}</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm text-center">
                   <p className="text-3xl font-black serif text-stone-900">{user.minutesMeditated}</p>
                   <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mt-1">{t.total_minutes}</p>
                </div>
             </div>

             <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-400 px-2">Settings</h3>
                <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
                   <button className="w-full px-8 py-5 flex items-center justify-between border-b border-stone-50 hover:bg-stone-50 transition-colors">
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5h12M9 3v2m1.048 9.5a18.022 18.022 0 01-3.827-2.06l-2.22 2.22m1.048-9.5V11c0 .463-.021.897-.06 1.287m0 0a17.96 17.96 0 01-1.048 4.713M9 11c0 .463-.021.897-.06 1.287m0 0a17.96 17.96 0 01-1.048 4.713M9 11c0 .463-.021.897-.06 1.287m0 0a17.96 17.96 0 01-1.048 4.713M9 11c0 .463-.021.897-.06 1.287m0 0a17.96 17.96 0 01-1.048 4.713"/></svg>
                         </div>
                         <span className="font-bold text-stone-700">{t.settings_language}</span>
                      </div>
                      <select 
                        value={lang} 
                        onChange={(e) => setLang(e.target.value as Language)}
                        className="bg-transparent font-black text-xs text-emerald-600 outline-none cursor-pointer"
                      >
                         <option value="en">English</option>
                         <option value="zh-Hans">简体中文</option>
                         <option value="zh-Hant">繁體中文</option>
                      </select>
                   </button>
                   <button onClick={handleLogout} className="w-full px-8 py-5 flex items-center space-x-4 text-red-500 hover:bg-red-50 transition-colors">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      </div>
                      <span className="font-bold">Sign Out</span>
                   </button>
                </div>
             </section>
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