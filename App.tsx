import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS } from './constants';
import { translations } from './translations';
import { getPersonalizedRecommendation } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [zenQuote, setZenQuote] = useState<string | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

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

  const fetchZenQuote = async () => {
    setIsLoadingQuote(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a single, powerful one-sentence zen or mindfulness quote in ${lang === 'zh-Hans' ? 'Simplified Chinese' : lang === 'zh-Hant' ? 'Traditional Chinese' : 'English'}. No attribution needed.`,
      });
      setZenQuote(response.text || "The journey of a thousand miles begins with a single step.");
    } catch (err) {
      setZenQuote("Peace comes from within. Do not seek it without.");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('calmrelax_lang', newLang);
  };

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

  const LanguageSelector = () => (
    <div className="grid grid-cols-3 bg-stone-100 p-1.5 rounded-2xl w-full max-w-[340px] gap-1.5">
      {[
        { id: 'en', label: 'English' },
        { id: 'zh-Hans', label: '简体' },
        { id: 'zh-Hant', label: '繁體' }
      ].map((l) => (
        <button
          key={l.id}
          onClick={() => handleLanguageChange(l.id as Language)}
          className={`py-3 flex-1 text-center flex justify-center items-center text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all whitespace-nowrap overflow-hidden ${
            lang === l.id 
              ? 'bg-white text-stone-900 shadow-sm scale-[1.02]' 
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-between py-12 px-10 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-100/40 rounded-full blur-[120px]"></div>
        
        <div className="w-full flex justify-center items-center relative z-10">
           <LanguageSelector />
        </div>

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
              <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">{t.welcome_back}</p>
              <h2 className="text-4xl font-black serif leading-tight text-stone-900">{user.name}</h2>
            </header>

            <section className="bg-white/90 backdrop-blur-md rounded-[48px] p-8 border border-white shadow-xl">
              <h3 className="text-xl font-black text-stone-800 tracking-tight mb-6">How is your spirit?</h3>
              <div className="flex justify-between items-center mb-8">
                {['Happy', 'Calm', 'Stressed', 'Sad', 'Anxious'].map((m) => (
                  <button key={m} onClick={() => handleMoodSelect(m)} className={`flex flex-col items-center space-y-2 transition-all ${mood === m ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}>
                    <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-3xl transition-colors ${mood === m ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-stone-50 text-stone-400'}`}>
                      {m === 'Happy' && '😊'} {m === 'Calm' && '😌'} {m === 'Stressed' && '😫'} {m === 'Sad' && '😔'} {m === 'Anxious' && '😰'}
                    </div>
                  </button>
                ))}
              </div>
              {isLoadingAdvice ? (
                <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : aiAdvice && (
                <div className="bg-emerald-50/40 p-6 rounded-[32px] border border-emerald-100/50 animate-in fade-in slide-in-from-top-4">
                  <p className="text-stone-700 italic text-sm font-medium serif leading-relaxed">"{aiAdvice}"</p>
                </div>
              )}
            </section>

            <section onClick={() => setActiveSession(DAILY_MEDITATION)} className="cursor-pointer group relative">
              <div className="aspect-[1.5/1] md:aspect-[2/1] bg-emerald-500 rounded-[56px] relative overflow-hidden shadow-2xl transition-all hover:scale-[1.01]">
                <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[20s]" alt="daily" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.4em] bg-black/40 backdrop-blur-md px-5 py-2 rounded-full mb-4 inline-block">{t.daily_zen}</span>
                  <h3 className="text-4xl font-black text-white serif mb-2">{DAILY_MEDITATION.title}</h3>
                  <p className="text-white/70 text-sm font-medium line-clamp-2 max-w-sm">A resonant path through tranquility. Let the birds guide your breath.</p>
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
            
            <div className="grid grid-cols-2 gap-6">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-square bg-white rounded-[40px] relative overflow-hidden cursor-pointer group shadow-sm border border-stone-100 hover:shadow-2xl transition-all">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[10s]" alt={session.title} />
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
          <div className="space-y-10 animate-in fade-in duration-700 py-10">
             <div className="aspect-[4/5] bg-stone-900 rounded-[56px] relative overflow-hidden shadow-2xl p-12 flex flex-col justify-end text-white">
               <div className="absolute top-12 left-12 w-20 h-20 bg-stone-800 rounded-[32px] flex items-center justify-center">
                 <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
               </div>
               <h2 className="text-5xl font-black serif mb-4 leading-tight">Sleep Sanctuary</h2>
               <p className="text-stone-400 text-lg font-medium mb-12 leading-relaxed">Low-frequency drift sessions and curated night-scapes for deep, undisturbed rest.</p>
               <button onClick={() => setActiveSession(MEDITATION_SESSIONS[1])} className="w-full bg-white text-stone-900 py-6 rounded-[32px] font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-xl">Start Night Journey</button>
             </div>
          </div>
        )}
        
        {view === 'explore' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900">Explore & Discover</h2>
            
            <section className="bg-white rounded-[48px] p-8 border border-stone-100 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-[5s]">
                <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-stone-800 mb-4 serif">Daily Wisdom</h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed max-w-sm">A unique spark of clarity from the cosmic collective, just for you.</p>
              
              {zenQuote ? (
                <div className="bg-stone-50 p-8 rounded-[40px] mb-8 animate-in fade-in slide-in-from-top-4 border border-stone-100">
                  <p className="text-stone-900 font-bold serif italic text-xl leading-relaxed">"{zenQuote}"</p>
                </div>
              ) : null}
              
              <button 
                onClick={fetchZenQuote}
                disabled={isLoadingQuote}
                className="w-full bg-stone-900 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isLoadingQuote && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{zenQuote ? 'New Wisdom' : 'Reveal Wisdom'}</span>
              </button>
            </section>

            <BreathingExercise lang={lang} />
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <div className="text-center">
               <div className="relative inline-block">
                 <img src={user.photoUrl} className="w-28 h-28 rounded-[40px] border-4 border-white shadow-2xl mx-auto" alt="profile" />
                 <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black border-4 border-[#fdfcfb]">PRO</div>
               </div>
               <h2 className="text-3xl font-black serif text-stone-900 mt-6">{user.name}</h2>
               <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mt-1">{user.email}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[40px] border border-stone-100 shadow-sm text-center">
                  <p className="text-2xl font-black serif text-stone-900">{user.streak}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Day Streak</p>
                </div>
                <div className="bg-white p-6 rounded-[40px] border border-stone-100 shadow-sm text-center">
                  <p className="text-2xl font-black serif text-stone-900">{user.minutesMeditated}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Minutes</p>
                </div>
             </div>

             <section className="bg-emerald-50 rounded-[48px] p-8 border border-emerald-100">
                <h3 className="text-xl font-black text-emerald-900 mb-6 serif">Inner Journey</h3>
                <div className="space-y-4">
                   {[
                     { label: 'Inner Peace Initiate', active: true, desc: 'Started your journey' },
                     { label: 'Mindful Master', active: false, desc: 'Reach 1000 minutes' },
                     { label: 'Zen Architect', active: false, desc: 'Maintain 30 day streak' }
                   ].map((m, i) => (
                     <div key={i} className="flex items-center space-x-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.active ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-stone-300'}`}>
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                       </div>
                       <div>
                         <p className={`font-black text-sm ${m.active ? 'text-emerald-900' : 'text-stone-400'}`}>{m.label}</p>
                         <p className="text-[10px] text-stone-500 font-medium">{m.desc}</p>
                       </div>
                     </div>
                   ))}
                </div>
             </section>
             
             <div className="max-w-xs mx-auto space-y-4">
                <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4">{t.settings_language}</p>
                  <LanguageSelector />
                </div>
                
                <button onClick={handleLogout} className="w-full bg-red-50 text-red-500 px-8 py-5 rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-100 transition-colors">
                  Sign Out of Sanctuary
                </button>
             </div>
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