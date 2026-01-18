import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language, JournalEntry } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES } from './constants';
import { translations } from './translations';
import { getPersonalizedRecommendation } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [zenQuote, setZenQuote] = useState<string>(STATIC_QUOTES[0]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [newJournalText, setNewJournalText] = useState('');
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auth States
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [pendingLoginProvider, setPendingLoginProvider] = useState<'google' | 'facebook' | null>(null);

  // Ad / Transition States
  const [isShowingInterstitial, setIsShowingInterstitial] = useState(false);

  const t = useMemo(() => translations[lang] || translations['en'], [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('calmrelax_active_user');
    const savedLang = localStorage.getItem('calmrelax_lang');
    const savedJournals = localStorage.getItem('calmrelax_journals');
    if (savedLang) setLang(savedLang as Language);
    if (savedJournals) setJournals(JSON.parse(savedJournals));
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.isLoggedIn) {
        setUser(parsed);
        setIsLoggedIn(true);
        setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
      }
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('calmrelax_lang', newLang);
  };

  const handleViewChange = (newView: AppView) => {
    if (newView === view) return;
    setIsShowingInterstitial(true);
    setTimeout(() => {
      setIsShowingInterstitial(false);
      setView(newView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450); 
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsAiLoading(true);
    try {
      const tip = await getPersonalizedRecommendation(mood, lang);
      setAiTip(tip);
    } catch (e) {
      setAiTip("Inhale the future, exhale the past. This moment is your sanctuary.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const startLoginFlow = (provider: 'google' | 'facebook') => {
    setPendingLoginProvider(provider);
    setIsConsentModalOpen(true);
  };

  const finalizeLogin = () => {
    const mockUser: User = {
      id: `${pendingLoginProvider}-123`,
      name: "Zen Seeker",
      email: "vvkkoo4816@gmail.com",
      photoUrl: `https://ui-avatars.com/api/?name=Zen+Seeker&background=10b981&color=fff`,
      isLoggedIn: true,
      streak: 12,
      minutesMeditated: 2450,
      role: 'admin',
      isPremium: true
    };
    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
    setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
    setIsConsentModalOpen(false);
  };

  const saveJournal = () => {
    if (!newJournalText.trim()) return;
    let updatedJournals: JournalEntry[];
    if (editingJournalId) {
      updatedJournals = journals.map(j => 
        j.id === editingJournalId 
          ? { ...j, text: newJournalText, date: `${new Date().toLocaleDateString()} (Edited)` } 
          : j
      );
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        text: newJournalText,
        mood: selectedMood || 'Neutral'
      };
      updatedJournals = [newEntry, ...journals];
    }
    setJournals(updatedJournals);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updatedJournals));
    setNewJournalText('');
    setEditingJournalId(null);
  };

  const saveGratitude = () => {
    if (!gratitudeInput.trim()) return;
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      text: `Grateful for: ${gratitudeInput}`,
      mood: 'Grateful'
    };
    const updatedJournals = [newEntry, ...journals];
    setJournals(updatedJournals);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updatedJournals));
    setGratitudeInput('');
    setGratitudeSaved(true);
    setTimeout(() => setGratitudeSaved(false), 3000);
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
        <div className="absolute top-12 flex space-x-2 bg-stone-100 p-1.5 rounded-full border border-stone-200 shadow-sm z-50">
          <button onClick={() => changeLanguage('en')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'en' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>EN</button>
          <button onClick={() => changeLanguage('zh-Hans')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'zh-Hans' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>简体</button>
          <button onClick={() => changeLanguage('zh-Hant')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'zh-Hant' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>繁體</button>
        </div>
        
        <div className="flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-500/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-4xl font-black serif mb-2 text-stone-900 tracking-tight">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium mb-12 max-w-xs leading-relaxed">{t.app_slogan}</p>
          <button onClick={() => startLoginFlow('google')} className="w-full max-w-sm bg-white border border-stone-200 text-stone-700 px-8 py-4 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-3 active:scale-95">
             <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="google" />
             <span>{t.sign_in_google}</span>
          </button>
        </div>

        {isConsentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-300">
               <h3 className="text-xl font-black serif text-stone-900 mb-2">{t.auth_permission_title}</h3>
               <p className="text-stone-500 text-sm mb-8 leading-relaxed">{t.auth_permission_desc}</p>
               <div className="flex flex-col space-y-3">
                 <button onClick={finalizeLogin} className="w-full bg-stone-900 text-white py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors">{t.auth_allow}</button>
                 <button onClick={() => setIsConsentModalOpen(false)} className="w-full text-stone-400 py-2 rounded-full font-black text-xs uppercase tracking-widest">{t.auth_deny}</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const dailyMinutesGoal = 30;
  const progressPercent = Math.min((user.minutesMeditated % 60 / dailyMinutesGoal) * 100, 100);

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto pb-32 space-y-12">
        
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center ad-interstitial-in">
             <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
             <p className="text-stone-400 font-black text-[11px] uppercase tracking-[0.4em] animate-pulse">Aligning your spirit...</p>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in duration-1000">
            <header className="flex justify-between items-center bg-white p-7 rounded-[48px] border border-stone-100 shadow-sm">
              <div className="min-w-0">
                <p className="text-emerald-600 font-black text-[9px] uppercase tracking-[0.5em] mb-1.5">{t.welcome_back}</p>
                <h2 className="text-3xl font-black serif text-stone-900 leading-tight truncate">{user.name}</h2>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                 <svg className="w-full h-full transform -rotate-90">
                    <defs>
                      <linearGradient id="gradient-progress" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-stone-50" />
                    <circle cx="32" cy="32" r="28" stroke="url(#gradient-progress)" strokeWidth="5" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                 </svg>
                 <span className="absolute text-[10px] font-black text-emerald-700">{Math.round(progressPercent)}%</span>
              </div>
            </header>

            {/* Mood Check-In */}
            <section className="bg-white rounded-[56px] p-10 border border-stone-100 shadow-xl shadow-stone-200/30 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-100 via-emerald-400 to-emerald-100"></div>
               <h3 className="font-black serif text-xl mb-10 text-center text-stone-800">How is your soul today?</h3>
               <div className="flex justify-between items-center mb-10 px-2">
                  {[
                    { label: 'Happy', emoji: '😊' },
                    { label: 'Calm', emoji: '🧘' },
                    { label: 'Stressed', emoji: '😰' },
                    { label: 'Sad', emoji: '😔' },
                    { label: 'Tired', emoji: '😴' }
                  ].map(mood => (
                    <button 
                      key={mood.label} 
                      onClick={() => handleMoodSelect(mood.label)} 
                      className={`flex flex-col items-center space-y-3 group transition-all duration-700 ${selectedMood === mood.label ? 'scale-125' : 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0'}`}
                    >
                       <div className={`text-4xl transform group-hover:rotate-12 transition-transform drop-shadow-lg filter saturate-150 ${selectedMood === mood.label ? 'animate-bounce' : ''}`}>
                         {mood.emoji}
                       </div>
                       <span className={`text-[8px] font-black uppercase tracking-widest ${selectedMood === mood.label ? 'text-emerald-600' : 'text-stone-400'}`}>{mood.label}</span>
                    </button>
                  ))}
               </div>
               {(selectedMood || isAiLoading) && (
                 <div className="bg-emerald-50/40 p-10 rounded-[40px] border border-emerald-100/50 animate-in slide-in-from-top-10 duration-1000 relative">
                    {isAiLoading ? (
                      <div className="flex items-center justify-center space-x-3 text-emerald-600 py-4">
                        <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Consulting the universe...</span>
                      </div>
                    ) : (
                      <div className="relative text-center">
                        <p className="text-stone-800 text-base italic font-medium leading-relaxed serif px-4">"{aiTip}"</p>
                        <div className="mt-4 flex justify-center space-x-1">
                          <span className="w-1 h-1 bg-emerald-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-emerald-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-emerald-300 rounded-full"></span>
                        </div>
                      </div>
                    )}
                 </div>
               )}
            </section>

            <section className="bg-stone-950 rounded-[64px] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/40 group zen-card-glow">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[2s]"></div>
               <div className="relative z-10">
                 <div className="flex items-center space-x-3 mb-8">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.9)]"></span>
                    <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">Morning Illumination</p>
                 </div>
                 <h3 className="text-3xl font-light serif mb-12 italic leading-snug tracking-tight text-white/95">"{zenQuote}"</h3>
                 <div className="flex flex-wrap gap-4">
                   <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-950 px-10 py-5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-emerald-50 transition-all active:scale-95">Begin Journey</button>
                   <button onClick={() => handleViewChange('library')} className="bg-stone-800/60 backdrop-blur-xl text-stone-300 px-10 py-5 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-stone-700 transition-colors border border-white/5">Discover More</button>
                 </div>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-[0.06]">
                  <svg className="w-80 h-80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
               </div>
            </section>

            {/* Gratitude Mini-Feature */}
            <div className="bg-amber-50/60 rounded-[56px] p-10 border border-amber-200/30 text-center shadow-inner relative overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-amber-400/20"></div>
               <h4 className="font-black serif text-xl mb-2 text-stone-800">Gratitude Seed</h4>
               <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-black mb-10 opacity-60">Plant a thought of light</p>
               {gratitudeSaved ? (
                 <div className="bg-emerald-600 text-white p-8 rounded-[40px] animate-in zoom-in duration-700 shadow-xl shadow-emerald-600/30 flex flex-col items-center">
                    <svg className="w-8 h-8 mb-3 animate-[bounce_1.5s_infinite]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    <span className="font-black text-[11px] uppercase tracking-[0.4em]">Seed preserved in spirit</span>
                 </div>
               ) : (
                 <div className="relative group">
                   <input 
                     value={gratitudeInput}
                     onChange={(e) => setGratitudeInput(e.target.value)}
                     className="w-full bg-white px-10 py-7 rounded-full text-stone-700 text-sm focus:outline-none focus:ring-8 focus:ring-amber-200/10 transition-all border border-stone-100 shadow-md placeholder:text-stone-300 font-medium"
                     placeholder="A moment of quiet grace..."
                   />
                   <button 
                     onClick={saveGratitude} 
                     className="absolute right-2.5 top-2.5 bottom-2.5 bg-stone-900 text-white px-10 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
                   >
                     Plant
                   </button>
                 </div>
               )}
            </div>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-4xl font-black serif text-stone-900">{t.nav_library}</h2>
               <p className="text-stone-400 text-sm mt-3 leading-relaxed">Symphonies of silence and curated sonic landscapes.</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] bg-stone-100 rounded-[56px] relative overflow-hidden cursor-pointer group shadow-2xl border border-stone-100 hover:-translate-y-3 transition-all duration-700">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[15s] grayscale-[0.3] group-hover:grayscale-0" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-900/30 to-transparent"></div>
                  <div className="absolute bottom-10 left-10 right-10">
                    <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-xl text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] mb-4 border border-white/10">{session.category}</span>
                    <h4 className="text-white font-black text-2xl serif leading-tight mb-2">{session.title}</h4>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest flex items-center">
                      <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                      {session.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-10">
               <h3 className="text-2xl font-black serif text-stone-900 mb-10 px-3 flex items-center">
                 <span className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-emerald-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14"/></svg>
                 </span>
                 Ambient Composer
               </h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-4xl font-black serif text-stone-900">{t.sleep_title}</h2>
               <p className="text-stone-400 text-sm mt-3">{t.sleep_subtitle}</p>
             </header>
             <div className="grid grid-cols-1 gap-10">
                {SLEEP_STORIES.map(story => (
                  <div key={story.id} onClick={() => setActiveSession(story)} className="bg-white rounded-[56px] p-10 border border-stone-100 shadow-xl flex flex-col md:flex-row items-center md:space-x-12 cursor-pointer group hover:bg-stone-50 transition-all duration-700">
                     <div className="w-36 h-36 md:w-44 md:h-44 rounded-[40px] overflow-hidden shrink-0 shadow-2xl mb-8 md:mb-0 border-4 border-white">
                        <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={story.title} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.5em] mb-3 block">{story.duration}</span>
                        <h4 className="text-2xl font-black serif text-stone-900 mb-3">{story.title}</h4>
                        <p className="text-stone-500 text-sm leading-relaxed max-w-md italic opacity-80">{story.description}</p>
                     </div>
                     <div className="mt-8 md:mt-0 text-stone-100 group-hover:text-emerald-500 transition-all scale-100 group-hover:scale-110">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <h2 className="text-4xl font-black serif text-stone-900">{t.journal_title}</h2>
            <div className="bg-white rounded-[64px] p-12 border border-stone-100 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-bl-[100%] border-l border-b border-emerald-500/10"></div>
               <textarea 
                  value={newJournalText} 
                  onChange={(e) => setNewJournalText(e.target.value)} 
                  placeholder={t.journal_placeholder} 
                  className="w-full h-56 bg-stone-50 rounded-[40px] p-10 text-stone-800 font-medium focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all resize-none mb-8 border-none text-xl serif leading-relaxed" 
               />
               <button onClick={saveJournal} className="w-full bg-stone-950 text-white py-7 rounded-full font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl hover:bg-stone-800 transition-all active:scale-95">{editingJournalId ? t.journal_update : t.journal_save}</button>
            </div>
            <div className="space-y-10">
              {journals.map(entry => (
                <div key={entry.id} className="bg-white p-12 rounded-[56px] border border-stone-100 shadow-lg relative overflow-hidden group hover:shadow-2xl transition-all">
                   <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/10 group-hover:bg-emerald-500 transition-all duration-500"></div>
                   <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">{entry.date}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase mt-2 px-3 py-1 bg-emerald-50 rounded-lg inline-block w-fit">Heart State: {entry.mood}</span>
                      </div>
                      <button onClick={() => { setEditingJournalId(entry.id); setNewJournalText(entry.text); }} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-6 py-3 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors">{t.journal_edit}</button>
                   </div>
                   <p className="text-stone-800 leading-relaxed font-medium serif text-2xl italic opacity-95">"{entry.text}"</p>
                </div>
              ))}
              {journals.length === 0 && (
                <div className="text-center py-20 opacity-20">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <p className="text-stone-400 font-black uppercase tracking-[0.6em] text-[11px]">{t.journal_empty}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <h2 className="text-4xl font-black serif text-stone-900">{t.nav_breathing}</h2>
            <BreathingExercise lang={lang} />
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;