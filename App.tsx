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

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [pendingLoginProvider, setPendingLoginProvider] = useState<'google' | 'facebook' | null>(null);
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
    }, 350); 
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsAiLoading(true);
    try {
      const tip = await getPersonalizedRecommendation(mood, lang);
      setAiTip(tip);
    } catch (e) {
      setAiTip("You are the sky. Everything else is just the weather. Breathe into the space within.");
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
      <div className="max-w-2xl mx-auto pb-32 space-y-12 px-2">
        
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white/98 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center ad-interstitial-in">
             <div className="w-14 h-14 border-4 border-emerald-50 border-t-emerald-500 rounded-full animate-spin mb-8"></div>
             <p className="text-emerald-600 font-black text-[12px] uppercase tracking-[0.5em] animate-pulse">Deepening your presence...</p>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <header className="flex justify-between items-center bg-white p-8 rounded-[48px] border border-stone-100 shadow-sm shadow-stone-200/20">
              <div className="min-w-0">
                <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.5em] mb-2">{t.welcome_back}</p>
                <h2 className="text-3xl font-black serif text-stone-900 leading-tight truncate">{user.name}</h2>
              </div>
              <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="36" cy="36" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-stone-50" />
                    <circle cx="36" cy="36" r="32" stroke="#10b981" strokeWidth="6" fill="transparent" strokeDasharray={201} strokeDashoffset={201 - (201 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                 </svg>
                 <span className="absolute text-[11px] font-black text-stone-700">{Math.round(progressPercent)}%</span>
              </div>
            </header>

            <section className="bg-white rounded-[64px] p-10 border border-stone-100 shadow-2xl shadow-stone-200/40 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-50 via-emerald-400 to-emerald-50"></div>
               <h3 className="font-black serif text-xl mb-10 text-center text-stone-800">How is your heart feeling?</h3>
               <div className="flex justify-between items-center mb-12 px-2">
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
                      className={`flex flex-col items-center space-y-4 group transition-all duration-700 ${selectedMood === mood.label ? 'scale-125' : 'opacity-25 hover:opacity-100 grayscale hover:grayscale-0'}`}
                    >
                       <div className={`text-4xl transform group-hover:rotate-6 transition-transform filter drop-shadow-md ${selectedMood === mood.label ? 'animate-bounce' : ''}`}>
                         {mood.emoji}
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-widest ${selectedMood === mood.label ? 'text-emerald-600' : 'text-stone-400'}`}>{mood.label}</span>
                    </button>
                  ))}
               </div>
               {(selectedMood || isAiLoading) && (
                 <div className="bg-emerald-50/50 p-10 rounded-[48px] border border-emerald-100/40 animate-in slide-in-from-top-8 duration-1000 text-center">
                    {isAiLoading ? (
                      <div className="flex items-center justify-center space-x-3 text-emerald-600 py-4">
                        <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] italic opacity-70">Creating Sanctuary...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <p className="text-stone-800 text-lg italic font-medium leading-relaxed serif px-4">"{aiTip}"</p>
                        <div className="mt-6 flex justify-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse delay-200"></span>
                        </div>
                      </div>
                    )}
                 </div>
               )}
            </section>

            <section className="bg-stone-950 rounded-[72px] p-14 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/40 group zen-card-glow">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[3s]"></div>
               <div className="relative z-10">
                 <div className="flex items-center space-x-4 mb-10">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(52,211,153,1)]"></span>
                    <p className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.6em]">Daily Illumination</p>
                 </div>
                 <h3 className="text-4xl font-light serif mb-14 italic leading-tight tracking-tight text-white/95">"{zenQuote}"</h3>
                 <div className="flex flex-wrap gap-5">
                   <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-950 px-12 py-6 rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-emerald-50 transition-all active:scale-95">Begin Session</button>
                   <button onClick={() => handleViewChange('library')} className="bg-stone-800/50 backdrop-blur-2xl text-stone-200 px-12 py-6 rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-stone-700 transition-all border border-white/10">Browse Library</button>
                 </div>
               </div>
               <div className="absolute top-0 right-0 p-12 opacity-[0.08]">
                  <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
               </div>
            </section>

            <div className="bg-amber-50/70 rounded-[64px] p-12 border border-amber-200/30 text-center shadow-inner relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-3 h-full bg-amber-400/20 group-hover:bg-amber-400/40 transition-colors"></div>
               <h4 className="font-black serif text-2xl mb-3 text-stone-800 tracking-tight">Gratitude Seed</h4>
               <p className="text-stone-500 text-[11px] uppercase tracking-[0.5em] font-black mb-10 opacity-60">Preserve a moment of light</p>
               {gratitudeSaved ? (
                 <div className="bg-emerald-600 text-white p-10 rounded-[48px] animate-in zoom-in duration-700 shadow-2xl shadow-emerald-600/30 flex flex-col items-center">
                    <svg className="w-10 h-10 mb-4 animate-[bounce_1.5s_infinite]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    <span className="font-black text-[12px] uppercase tracking-[0.5em]">Thought rooted in sanctuary</span>
                 </div>
               ) : (
                 <div className="relative group/input">
                   <input 
                     value={gratitudeInput}
                     onChange={(e) => setGratitudeInput(e.target.value)}
                     className="w-full bg-white px-12 py-8 rounded-full text-stone-800 text-base focus:outline-none focus:ring-8 focus:ring-amber-200/20 transition-all border border-stone-100 shadow-lg placeholder:text-stone-300 font-medium"
                     placeholder="A fragment of joy today..."
                   />
                   <button 
                     onClick={saveGratitude} 
                     className="absolute right-3 top-3 bottom-3 bg-stone-900 text-white px-12 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-2xl active:scale-95"
                   >
                     Plant
                   </button>
                 </div>
               )}
            </div>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-14 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-5xl font-black serif text-stone-900 tracking-tight">{t.nav_library}</h2>
               <p className="text-stone-400 text-lg mt-4 font-medium leading-relaxed max-w-lg">Resonant landscapes crafted to restore your inner balance.</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] bg-stone-100 rounded-[64px] relative overflow-hidden cursor-pointer group shadow-2xl border border-stone-100 hover:-translate-y-4 transition-all duration-700">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[20s] grayscale-[0.4] group-hover:grayscale-0" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-900/40 to-transparent"></div>
                  <div className="absolute bottom-12 left-12 right-12">
                    <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-2xl text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] mb-5 border border-white/10">{session.category}</span>
                    <h4 className="text-white font-black text-3xl serif leading-tight mb-3">{session.title}</h4>
                    <p className="text-white/70 text-[11px] font-black uppercase tracking-widest flex items-center">
                      <svg className="w-4 h-4 mr-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                      {session.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-12">
               <h3 className="text-3xl font-black serif text-stone-900 mb-12 px-4 flex items-center">
                 <span className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center text-white mr-5 shadow-2xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14"/></svg>
                 </span>
                 Ambient Composer
               </h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-14 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-5xl font-black serif text-stone-900 tracking-tight">{t.sleep_title}</h2>
               <p className="text-stone-400 text-lg mt-4 font-medium">{t.sleep_subtitle}</p>
             </header>
             <div className="grid grid-cols-1 gap-12">
                {SLEEP_STORIES.map(story => (
                  <div key={story.id} onClick={() => setActiveSession(story)} className="bg-white rounded-[64px] p-12 border border-stone-100 shadow-2xl flex flex-col md:flex-row items-center md:space-x-14 cursor-pointer group hover:bg-stone-50 transition-all duration-700">
                     <div className="w-40 h-40 md:w-52 md:h-52 rounded-[48px] overflow-hidden shrink-0 shadow-2xl mb-10 md:mb-0 border-8 border-white ring-1 ring-stone-100">
                        <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[12s]" alt={story.title} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.6em] mb-4 block">{story.duration}</span>
                        <h4 className="text-3xl font-black serif text-stone-900 mb-4">{story.title}</h4>
                        <p className="text-stone-500 text-base leading-relaxed max-w-md italic opacity-90 serif">"{story.description}"</p>
                     </div>
                     <div className="mt-10 md:mt-0 text-stone-100 group-hover:text-emerald-500 transition-all scale-100 group-hover:scale-110 drop-shadow-xl">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-14 animate-in fade-in duration-1000">
            <h2 className="text-5xl font-black serif text-stone-900 tracking-tight">{t.journal_title}</h2>
            <div className="bg-white rounded-[72px] p-14 border border-stone-100 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-bl-[100%] border-l border-b border-emerald-500/10"></div>
               <textarea 
                  value={newJournalText} 
                  onChange={(e) => setNewJournalText(e.target.value)} 
                  placeholder={t.journal_placeholder} 
                  className="w-full h-64 bg-stone-50 rounded-[48px] p-12 text-stone-900 font-medium focus:outline-none focus:ring-12 focus:ring-emerald-500/5 transition-all resize-none mb-10 border-none text-2xl serif leading-relaxed placeholder:text-stone-300" 
               />
               <button onClick={saveJournal} className="w-full bg-stone-950 text-white py-8 rounded-full font-black uppercase tracking-[0.4em] text-[13px] shadow-2xl hover:bg-stone-800 transition-all active:scale-95">{editingJournalId ? t.journal_update : t.journal_save}</button>
            </div>
            <div className="space-y-12">
              {journals.map(entry => (
                <div key={entry.id} className="bg-white p-14 rounded-[64px] border border-stone-100 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all">
                   <div className="absolute top-0 left-0 w-2.5 h-full bg-emerald-500/10 group-hover:bg-emerald-500 transition-all duration-700"></div>
                   <div className="flex justify-between items-start mb-10">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">{entry.date}</span>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase mt-3 px-4 py-1.5 bg-emerald-50 rounded-xl inline-block w-fit">Heart State: {entry.mood}</span>
                      </div>
                      <button onClick={() => { setEditingJournalId(entry.id); setNewJournalText(entry.text); }} className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 px-8 py-4 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-all">Edit Journey</button>
                   </div>
                   <p className="text-stone-900 leading-relaxed font-medium serif text-2xl italic opacity-95">"{entry.text}"</p>
                </div>
              ))}
              {journals.length === 0 && (
                <div className="text-center py-24 opacity-30">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <p className="text-stone-400 font-black uppercase tracking-[0.8em] text-[12px]">{t.journal_empty}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-14 animate-in fade-in duration-1000">
            <h2 className="text-5xl font-black serif text-stone-900 tracking-tight">{t.nav_breathing}</h2>
            <BreathingExercise lang={lang} />
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;