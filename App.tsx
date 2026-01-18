import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language, JournalEntry } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES, COURSES } from './constants';
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
    }, 800); 
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsAiLoading(true);
    try {
      const tip = await getPersonalizedRecommendation(mood, lang);
      setAiTip(tip);
    } catch (e) {
      setAiTip("Focus on your breath. This moment is all that matters.");
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
          <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-10 text-center ad-interstitial-in">
             <div className="w-10 h-10 border-4 border-stone-100 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
             <p className="text-stone-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Entering Silence...</p>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in duration-1000">
            <header className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-6 rounded-[40px] border border-stone-100">
              <div>
                <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-1">{t.welcome_back}</p>
                <h2 className="text-3xl font-black serif text-stone-900 leading-tight">{user.name}</h2>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-100" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * progressPercent) / 100} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000" />
                 </svg>
                 <span className="absolute text-[10px] font-black">{Math.round(progressPercent)}%</span>
              </div>
            </header>

            {/* Mood Check-In */}
            <section className="bg-white rounded-[48px] p-8 border border-stone-100 shadow-xl shadow-stone-200/40">
               <h3 className="font-black serif text-xl mb-8 text-center">How does your heart feel today?</h3>
               <div className="flex justify-between items-center mb-10 px-4">
                  {['Happy', 'Calm', 'Stressed', 'Sad', 'Tired'].map(mood => (
                    <button key={mood} onClick={() => handleMoodSelect(mood)} className={`flex flex-col items-center space-y-3 group transition-all duration-500 ${selectedMood === mood ? 'scale-125' : 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0'}`}>
                       <span className="text-4xl transform group-hover:rotate-12 transition-transform">
                         {mood === 'Happy' ? '😊' : mood === 'Calm' ? '🧘' : mood === 'Stressed' ? '😰' : mood === 'Sad' ? '😔' : '😴'}
                       </span>
                       <span className={`text-[8px] font-black uppercase tracking-widest ${selectedMood === mood ? 'text-emerald-600' : 'text-stone-400'}`}>{mood}</span>
                    </button>
                  ))}
               </div>
               {(selectedMood || isAiLoading) && (
                 <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 animate-in slide-in-from-top-6 duration-700">
                    {isAiLoading ? (
                      <div className="flex items-center justify-center space-x-3 text-emerald-600">
                        <div className="w-5 h-5 border-2 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-black uppercase tracking-widest italic">Personalizing your path...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <svg className="absolute -top-4 -left-4 w-8 h-8 text-emerald-200/50" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21M14.017 21H21.017M14.017 21C14.017 22.1046 13.1216 23 12.017 23H10.017C8.91243 23 8.01705 22.1046 8.01705 21M8.01705 21H12.017M8.01705 21V18C8.01705 16.8954 7.12162 16 6.01705 16H3.01705C1.91248 16 1.01705 16.8954 1.01705 18V21M1.01705 21H8.01705"/></svg>
                        <p className="text-stone-700 text-base italic font-medium leading-relaxed text-center px-4">"{aiTip}"</p>
                      </div>
                    )}
                 </div>
               )}
            </section>

            <section className="bg-stone-950 rounded-[56px] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/20">
               <div className="relative z-10">
                 <div className="flex items-center space-x-2 mb-6">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                    <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em]">Current Wisdom</p>
                 </div>
                 <h3 className="text-3xl font-black serif mb-10 italic leading-snug">"{zenQuote}"</h3>
                 <div className="flex flex-wrap gap-4">
                   <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-950 px-8 py-5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all active:scale-95">Daily Practice</button>
                   <button onClick={() => handleViewChange('library')} className="bg-stone-800 text-stone-300 px-8 py-5 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-stone-700 transition-colors">Explore All</button>
                 </div>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
               </div>
            </section>

            {/* Gratitude Mini-Feature */}
            <div className="bg-amber-50/50 rounded-[48px] p-10 border border-amber-100/50 text-center">
               <h4 className="font-black serif text-xl mb-2">Gratitude Seed</h4>
               <p className="text-stone-500 text-xs mb-8">What lightened your heart today?</p>
               {gratitudeSaved ? (
                 <div className="bg-emerald-500 text-white p-5 rounded-3xl animate-in zoom-in">
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Reflection Saved</span>
                 </div>
               ) : (
                 <div className="relative">
                   <input 
                     value={gratitudeInput}
                     onChange={(e) => setGratitudeInput(e.target.value)}
                     className="w-full bg-white px-8 py-5 rounded-full text-stone-700 text-sm focus:outline-none focus:ring-4 focus:ring-amber-200/30 transition-all border border-amber-100 shadow-sm"
                     placeholder="Write it down..."
                   />
                   <button onClick={saveGratitude} className="absolute right-2 top-2 bottom-2 bg-stone-900 text-white px-6 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-stone-800 transition-colors">Plant</button>
                 </div>
               )}
            </div>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-4xl font-black serif text-stone-900">{t.nav_library}</h2>
               <p className="text-stone-400 text-sm mt-2">Curated sounds for your specific needs.</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] bg-stone-100 rounded-[48px] relative overflow-hidden cursor-pointer group shadow-xl border border-stone-200/20 hover:-translate-y-2 transition-all duration-500">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[12s] grayscale-[0.2] group-hover:grayscale-0" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 backdrop-blur-md text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3 border border-emerald-500/30">{session.category}</span>
                    <h4 className="text-white font-black text-2xl serif leading-tight mb-1">{session.title}</h4>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{session.duration}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-8">
               <h3 className="text-2xl font-black serif text-stone-900 mb-8">Ambient Mixer</h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-4xl font-black serif text-stone-900">{t.sleep_title}</h2>
               <p className="text-stone-400 text-sm mt-2">{t.sleep_subtitle}</p>
             </header>
             <div className="grid grid-cols-1 gap-8">
                {SLEEP_STORIES.map(story => (
                  <div key={story.id} onClick={() => setActiveSession(story)} className="bg-white rounded-[48px] p-8 border border-stone-100 shadow-xl flex flex-col md:flex-row items-center md:space-x-10 cursor-pointer group hover:bg-stone-50 transition-all duration-500">
                     <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] overflow-hidden shrink-0 shadow-lg mb-6 md:mb-0">
                        <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[8s]" alt={story.title} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.3em] mb-2 block">{story.duration}</span>
                        <h4 className="text-2xl font-black serif text-stone-900 mb-2">{story.title}</h4>
                        <p className="text-stone-500 text-sm leading-relaxed max-w-md">{story.description}</p>
                     </div>
                     <div className="mt-6 md:mt-0 text-stone-200 group-hover:text-emerald-500 transition-colors">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <h2 className="text-4xl font-black serif text-stone-900">{t.journal_title}</h2>
            <div className="bg-white rounded-[56px] p-10 border border-stone-100 shadow-2xl">
               <textarea 
                  value={newJournalText} 
                  onChange={(e) => setNewJournalText(e.target.value)} 
                  placeholder={t.journal_placeholder} 
                  className="w-full h-48 bg-stone-50 rounded-[32px] p-8 text-stone-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none mb-6 border-none text-lg" 
               />
               <button onClick={saveJournal} className="w-full bg-stone-900 text-white py-6 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-stone-800 transition-colors">{editingJournalId ? t.journal_update : t.journal_save}</button>
            </div>
            <div className="space-y-8">
              {journals.map(entry => (
                <div key={entry.id} className="bg-white p-10 rounded-[48px] border border-stone-100 shadow-lg relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{entry.date}</span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase mt-1">Mood: {entry.mood}</span>
                      </div>
                      <button onClick={() => { setEditingJournalId(entry.id); setNewJournalText(entry.text); }} className="text-[10px] font-black uppercase text-emerald-600 px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors">{t.journal_edit}</button>
                   </div>
                   <p className="text-stone-700 leading-relaxed font-medium serif text-xl italic">"{entry.text}"</p>
                </div>
              ))}
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