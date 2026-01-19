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
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
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
    }, 500); 
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsAiLoading(true);
    try {
      const tip = await getPersonalizedRecommendation(mood, lang);
      setAiTip(tip);
    } catch (e) {
      setAiTip(translations[lang]?.mood_fallback || "Breathe deeply. You are safe in this moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const finalizeLogin = () => {
    const mockUser: User = {
      id: `social-auth-${Date.now()}`,
      name: "Zen Seeker",
      email: "vvkkoo4816@gmail.com",
      photoUrl: `https://ui-avatars.com/api/?name=Zen+Seeker&background=10b981&color=fff`,
      isLoggedIn: true,
      streak: 35,
      minutesMeditated: 5820,
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

  const deleteJournal = (id: string) => {
    const updated = journals.filter(j => j.id !== id);
    setJournals(updated);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updated));
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-12 flex space-x-2 bg-stone-200/40 backdrop-blur-xl p-1.5 rounded-full border border-stone-300/30 z-50">
          {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
            <button key={l} onClick={() => changeLanguage(l)} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-white text-stone-900 shadow-xl' : 'text-stone-500 hover:text-stone-800'}`}>
              {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简体' : '繁體'}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-32 duration-1000">
          <div className="w-36 h-36 bg-emerald-500 rounded-[48px] flex items-center justify-center text-white mb-12 shadow-[0_40px_100px_rgba(16,185,129,0.5)] animate-bounce duration-[10s]">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-7xl font-black serif mb-6 text-stone-900 tracking-tighter">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium mb-24 max-w-sm leading-relaxed mx-auto text-2xl italic serif opacity-80">{t.app_slogan}</p>
          
          <div className="w-full max-w-xs flex flex-col space-y-6">
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-white border border-stone-200 text-stone-800 px-10 py-6 rounded-full font-black shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center space-x-5 active:scale-95 group">
               <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-8 h-8 group-hover:scale-110 transition-transform" alt="google" />
               <span className="text-lg tracking-tight uppercase">{t.sign_in_google}</span>
            </button>
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-[#1877F2] text-white px-10 py-6 rounded-full font-black shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center space-x-5 active:scale-95 group border-b-8 border-blue-900">
               <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               <span className="text-lg tracking-tight uppercase">{t.sign_in_facebook}</span>
            </button>
          </div>
        </div>

        {isConsentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-stone-950/95 backdrop-blur-3xl">
            <div className="bg-white w-full max-w-sm rounded-[80px] p-16 shadow-2xl animate-in zoom-in duration-700">
               <h3 className="text-5xl font-black serif text-stone-900 mb-6">{t.auth_permission_title}</h3>
               <p className="text-stone-500 text-xl mb-16 leading-relaxed serif italic">{t.auth_permission_desc}</p>
               <div className="flex flex-col space-y-6">
                 <button onClick={finalizeLogin} className="w-full bg-emerald-600 text-white py-7 rounded-full font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-700 transition-all">{t.auth_allow}</button>
                 <button onClick={() => setIsConsentModalOpen(false)} className="w-full text-stone-400 py-4 rounded-full font-black text-sm uppercase tracking-[0.4em]">{t.auth_deny}</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const progressPercent = Math.min((user.minutesMeditated % 60 / 30) * 100, 100);
  const zenLevel = Math.floor(user.minutesMeditated / 120) + 1;

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <div className="max-w-3xl mx-auto pb-64 space-y-28 px-4">
        
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center ad-interstitial-in">
             <div className="w-32 h-32 border-[16px] border-emerald-50 border-t-emerald-500 rounded-full animate-spin mb-16 shadow-2xl shadow-emerald-500/50"></div>
             <p className="text-emerald-800 font-black text-[22px] uppercase tracking-[1.2em] animate-pulse italic">Purifying Focus...</p>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-24 animate-in fade-in duration-1000">
            <header className="flex justify-between items-center bg-white p-14 rounded-[88px] border border-stone-100 shadow-2xl shadow-stone-200/30">
              <div className="min-w-0">
                <div className="flex items-center space-x-6 mb-4">
                   <span className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[12px] font-black uppercase tracking-[0.2em] shadow-sm">Zen Master • Lv {zenLevel}</span>
                   <p className="text-stone-400 font-black text-[13px] uppercase tracking-[0.8em]">{t.welcome_back}</p>
                </div>
                <h2 className="text-7xl font-black serif text-stone-900 leading-tight truncate tracking-tighter">{user.name}</h2>
              </div>
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                 <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl">
                    <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-stone-50" />
                    <circle cx="72" cy="72" r="64" stroke="#10b981" strokeWidth="16" fill="transparent" strokeDasharray={402} strokeDashoffset={402 - (402 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-2xl font-black text-stone-800 leading-none">{Math.round(progressPercent)}%</span>
                 </div>
              </div>
            </header>

            <section className="bg-stone-950 rounded-[120px] p-28 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/95 group zen-card-glow transition-all duration-1000">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[12s]"></div>
               <div className="relative z-10">
                 <div className="flex items-center space-x-12 mb-28">
                    <span className="w-12 h-12 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_80px_rgba(52,211,153,1)]"></span>
                    <p className="text-emerald-400 font-black text-[20px] uppercase tracking-[1.6em]">{t.tradition_title}</p>
                 </div>
                 <h3 className="text-8xl font-light serif mb-40 italic leading-[1.1] tracking-tighter text-white/98 max-w-3xl">"{zenQuote}"</h3>
                 <div className="flex flex-wrap gap-16">
                   <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-950 px-32 py-16 rounded-full font-black uppercase tracking-[1em] text-[20px] shadow-2xl hover:bg-emerald-50 transition-all active:scale-95">Enter Silence</button>
                   <button onClick={() => handleViewChange('library')} className="bg-stone-800/95 backdrop-blur-3xl text-stone-200 px-32 py-16 rounded-full font-black uppercase tracking-[1em] text-[20px] hover:bg-stone-700 transition-all border border-white/10">The Sanctum</button>
                 </div>
               </div>
            </section>

            <section className="bg-white rounded-[112px] p-28 border border-stone-100 shadow-2xl shadow-stone-200/60 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-emerald-50 via-emerald-500 to-emerald-50 opacity-90"></div>
               <h3 className="font-black serif text-6xl mb-24 text-center text-stone-900 tracking-tighter">Tune your inner Vibration</h3>
               <div className="flex justify-between items-center mb-32 px-12">
                  {[
                    { label: 'High', emoji: '✨' },
                    { label: 'Calm', emoji: '🧘' },
                    { label: 'Cloud', emoji: '☁️' },
                    { label: 'Vast', emoji: '🌌' },
                    { label: 'Quiet', emoji: '🌑' }
                  ].map(mood => (
                    <button 
                      key={mood.label} 
                      onClick={() => handleMoodSelect(mood.label)} 
                      className={`flex flex-col items-center space-y-12 transition-all duration-1000 ${selectedMood === mood.label ? 'scale-125' : 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0'}`}
                    >
                       <div className={`text-9xl transform hover:rotate-12 transition-transform filter drop-shadow-4xl ${selectedMood === mood.label ? 'animate-bounce' : ''}`}>
                         {mood.emoji}
                       </div>
                    </button>
                  ))}
               </div>
               {(selectedMood || isAiLoading) && (
                 <div className="bg-emerald-50/95 p-28 rounded-[112px] border border-emerald-100/90 animate-in slide-in-from-top-24 duration-1000 text-center relative overflow-hidden">
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-12 text-emerald-600 py-24">
                        <div className="w-24 h-24 border-[12px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <span className="text-[26px] font-black uppercase tracking-[1.4em] italic opacity-80">Syncing Resonance...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <p className="text-stone-900 text-5xl italic font-medium leading-[1.3] serif px-16">"{aiTip}"</p>
                      </div>
                    )}
                 </div>
               )}
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-36 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-[10rem] font-black serif text-stone-900 tracking-tighter leading-none mb-12">The Vault</h2>
               <p className="text-stone-400 text-5xl font-medium leading-relaxed max-w-4xl italic opacity-95 serif">Architectural soundscapes engineered for total cognitive surrender.</p>
             </header>

             {/* Guided Courses - RESTORED FEATURE */}
             <section className="space-y-16">
               <h3 className="text-6xl font-black serif text-stone-900 tracking-tighter">Guided Journeys</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {COURSES.map(course => (
                    <div key={course.id} className="bg-white rounded-[88px] p-12 border border-stone-100 shadow-2xl flex items-center space-x-8 group hover:bg-stone-50 transition-all cursor-pointer">
                      <div className="w-48 h-48 rounded-[64px] overflow-hidden shrink-0 shadow-xl">
                        <img src={course.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[20s]" alt={course.title} />
                      </div>
                      <div className="flex-1">
                        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-2 block">{course.difficulty}</span>
                        <h4 className="text-4xl font-black serif text-stone-900 leading-tight">{course.title}</h4>
                        <div className="mt-4 w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: `${(course.completedSteps / course.steps) * 100}%` }}></div>
                        </div>
                        <p className="text-stone-400 text-xs mt-2 font-black uppercase tracking-widest">{course.completedSteps}/{course.steps} Steps</p>
                      </div>
                    </div>
                  ))}
               </div>
             </section>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-32">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] bg-stone-100 rounded-[120px] relative overflow-hidden cursor-pointer group shadow-2xl border border-stone-100 hover:-translate-y-16 transition-all duration-1000">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[80s] grayscale-[0.9] group-hover:grayscale-0" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/100 via-stone-900/60 to-transparent"></div>
                  <div className="absolute bottom-32 left-32 right-32 text-white">
                    <span className="inline-block px-16 py-8 bg-white/20 backdrop-blur-3xl rounded-[44px] text-[18px] font-black uppercase tracking-[1.4em] mb-16 border border-white/10">{session.category}</span>
                    <h4 className="text-9xl font-black serif leading-tight mb-14 tracking-tighter">{session.title}</h4>
                    <span className="text-[24px] font-black uppercase tracking-[1.2em]">{session.duration}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-36 border-t border-stone-100">
               <h3 className="text-7xl font-black serif text-stone-900 mb-28 flex items-center">
                 Ambient Alchemist
               </h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-[10rem] font-black serif text-stone-900 tracking-tighter leading-none mb-12">{t.sleep_title}</h2>
               <p className="text-stone-400 text-4xl mt-14 font-medium leading-relaxed serif italic opacity-95">{t.sleep_subtitle}</p>
             </header>
             <div className="grid grid-cols-1 gap-24">
                {SLEEP_STORIES.map(story => (
                  <div key={story.id} onClick={() => setActiveSession(story)} className="bg-white rounded-[100px] p-20 border border-stone-100 shadow-2xl flex flex-col md:flex-row items-center md:space-x-32 cursor-pointer group hover:bg-stone-50 transition-all duration-1000">
                     <div className="w-80 h-80 rounded-[88px] overflow-hidden shrink-0 shadow-2xl mb-24 md:mb-0">
                        <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[30s]" alt={story.title} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[18px] font-black uppercase text-emerald-600 tracking-[1.4em] mb-12 block">{story.duration}</span>
                        <h4 className="text-7xl font-black serif text-stone-900 mb-12 tracking-tighter">{story.title}</h4>
                        <p className="text-stone-500 text-4xl leading-relaxed max-w-2xl italic opacity-95 serif">"{story.description}"</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-28 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-9xl font-black serif text-stone-900 tracking-tighter mb-12">{t.journal_title}</h2>
             </header>
             <div className="bg-white rounded-[96px] p-24 border border-stone-100 shadow-2xl">
                <textarea 
                   value={newJournalText}
                   onChange={(e) => setNewJournalText(e.target.value)}
                   className="w-full h-96 p-16 text-3xl serif bg-stone-50 rounded-[72px] focus:outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all resize-none italic"
                   placeholder={t.journal_placeholder}
                />
                <div className="mt-12 flex flex-col space-y-6">
                  <button onClick={saveJournal} className="w-full bg-stone-900 text-white py-10 rounded-full font-black text-lg uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all">
                    {editingJournalId ? t.journal_update : t.journal_save}
                  </button>
                  {editingJournalId && (
                    <button onClick={() => { setEditingJournalId(null); setNewJournalText(''); }} className="w-full text-stone-400 font-black text-sm uppercase tracking-[0.4em]">{t.journal_cancel}</button>
                  )}
                </div>
             </div>
             <div className="space-y-12 pt-20">
                {journals.map(j => (
                  <div key={j.id} className="bg-white rounded-[80px] p-16 border border-stone-100 shadow-xl group hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start mb-8">
                      <span className="text-emerald-600 font-black text-sm uppercase tracking-[0.5em]">{j.date} • {j.mood}</span>
                      <div className="flex space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingJournalId(j.id); setNewJournalText(j.text); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-stone-400 hover:text-emerald-500 font-black uppercase text-[10px] tracking-widest">{t.journal_edit}</button>
                        <button onClick={() => deleteJournal(j.id)} className="text-stone-400 hover:text-red-500 font-black uppercase text-[10px] tracking-widest">Delete</button>
                      </div>
                    </div>
                    <p className="text-3xl serif text-stone-900 leading-relaxed italic">"{j.text}"</p>
                  </div>
                ))}
                {journals.length === 0 && <p className="text-center text-stone-400 text-3xl serif italic opacity-50 py-24">{t.journal_empty}</p>}
             </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-9xl font-black serif text-stone-900 tracking-tighter leading-none mb-12">{t.nav_breathing}</h2>
             </header>
             <BreathingExercise lang={lang} />
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
             <header className="flex flex-col items-center text-center space-y-12">
               <div className="relative">
                 <img src={user.photoUrl} className="w-64 h-64 rounded-[88px] border-[16px] border-white shadow-3xl" alt="avatar" />
               </div>
               <div>
                 <h2 className="text-8xl font-black serif text-stone-900 tracking-tighter mb-4">{user.name}</h2>
                 <p className="text-stone-400 font-black text-xl uppercase tracking-[0.8em]">{user.email}</p>
               </div>
             </header>
             <div className="grid grid-cols-2 gap-12">
                <div className="bg-white rounded-[72px] p-12 text-center border border-stone-100 shadow-2xl">
                   <span className="text-stone-400 font-black text-sm uppercase tracking-[0.5em] block mb-4">Streak</span>
                   <span className="text-7xl font-black serif text-stone-900">{user.streak}d</span>
                </div>
                <div className="bg-white rounded-[72px] p-12 text-center border border-stone-100 shadow-2xl">
                   <span className="text-stone-400 font-black text-sm uppercase tracking-[0.5em] block mb-4">Soul Level</span>
                   <span className="text-7xl font-black serif text-stone-900">{zenLevel}</span>
                </div>
             </div>
             <div className="bg-white rounded-[80px] p-16 border border-stone-100 shadow-2xl space-y-12">
                <h3 className="text-4xl font-black serif text-stone-900 tracking-tighter">{t.settings_language}</h3>
                <div className="flex flex-col space-y-6">
                  {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
                    <button key={l} onClick={() => changeLanguage(l)} className={`w-full py-8 px-12 rounded-[40px] text-2xl font-black uppercase tracking-[0.4em] flex justify-between items-center transition-all ${lang === l ? 'bg-emerald-500 text-white shadow-2xl' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}>
                       <span>{l === 'en' ? 'English' : l === 'zh-Hans' ? '简体中文' : '繁體中文'}</span>
                    </button>
                  ))}
                </div>
             </div>
             <button onClick={() => { localStorage.removeItem('calmrelax_active_user'); window.location.reload(); }} className="w-full py-10 rounded-full font-black text-lg uppercase tracking-[1em] text-red-500 border-4 border-red-500/10 hover:bg-red-50 transition-all">Relinquish Presence</button>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-9xl font-black serif text-stone-900 tracking-tighter mb-12">{t.nav_admin}</h2>
             </header>
             <div className="bg-stone-950 rounded-[100px] p-24 text-white shadow-2xl">
                <h3 className="text-5xl font-black serif mb-12">System Resonance</h3>
                <div className="grid grid-cols-1 gap-12">
                   <div className="bg-white/5 p-12 rounded-[56px] border border-white/10">
                      <p className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-4">Total Users (Simulated)</p>
                      <p className="text-7xl font-black serif">1,402</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;