
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import AdSlot from './components/AdSlot';
import { AppView, User, MeditationSession, Language, JournalEntry, ZenCenter } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES, COURSES } from './constants';
import { translations } from './translations';
import { getPersonalizedRecommendation, findNearbyZenCenters } from './services/geminiService';

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
  const [zenCenters, setZenCenters] = useState<ZenCenter[]>([]);

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

    findNearbyZenCenters(0,0).then(setZenCenters);
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
    }, 1500); 
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
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mb-12 shadow-[0_20px_60px_rgba(16,185,129,0.3)] animate-bounce duration-[10s]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-6xl font-black serif mb-6 text-stone-900 tracking-tighter text-balance">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium mb-24 max-w-sm leading-relaxed mx-auto text-xl italic serif opacity-80">{t.app_slogan}</p>
          
          <div className="w-full max-w-xs flex flex-col space-y-4">
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-white border border-stone-200 text-stone-800 px-8 py-5 rounded-full font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-95 group">
               <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="google" />
               <span className="text-base tracking-tight uppercase">{t.sign_in_google}</span>
            </button>
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-[#1877F2] text-white px-8 py-5 rounded-full font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-95 group border-b-4 border-blue-900">
               <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               <span className="text-base tracking-tight uppercase">{t.sign_in_facebook}</span>
            </button>
          </div>
        </div>

        {isConsentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-stone-950/95 backdrop-blur-3xl">
            <div className="bg-white w-full max-w-sm rounded-[50px] p-12 shadow-2xl animate-in zoom-in duration-500">
               <h3 className="text-3xl font-black serif text-stone-900 mb-4">{t.auth_permission_title}</h3>
               <p className="text-stone-500 text-lg mb-10 leading-relaxed serif italic">{t.auth_permission_desc}</p>
               <div className="flex flex-col space-y-4">
                 <button onClick={finalizeLogin} className="w-full bg-emerald-600 text-white py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">{t.auth_allow}</button>
                 <button onClick={() => setIsConsentModalOpen(false)} className="w-full text-stone-400 py-3 rounded-full font-black text-sm uppercase tracking-[0.2em]">{t.auth_deny}</button>
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
      <div className="max-w-3xl mx-auto pb-64 space-y-12 px-4">
        
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center ad-interstitial-in">
             <div className="w-16 h-16 border-[6px] border-emerald-50 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-xl shadow-emerald-500/20"></div>
             <p className="text-emerald-800 font-black text-sm uppercase tracking-[0.3em] animate-pulse italic mb-8">Refining Focus...</p>
             <div className="w-full max-w-md bg-stone-50 rounded-3xl p-4 border border-stone-100 shadow-inner">
               <AdSlot />
             </div>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[40px] border border-stone-100 shadow-xl shadow-stone-200/20 gap-6">
              <div className="min-w-0 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-2">
                   <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm">Zen Master • Lv {zenLevel}</span>
                   <p className="text-stone-400 font-black text-[11px] uppercase tracking-[0.4em]">{t.welcome_back}</p>
                </div>
                <h2 className="text-4xl md:text-5xl font-black serif text-stone-900 leading-tight truncate tracking-tighter">{user.name}</h2>
              </div>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                 <svg className="w-full h-full transform -rotate-90 filter drop-shadow-lg">
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-50" />
                    <circle cx="48" cy="48" r="42" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray={264} strokeDashoffset={264 - (264 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-xl font-black text-stone-800 leading-none">{Math.round(progressPercent)}%</span>
                 </div>
              </div>
            </header>

            <section className="bg-stone-950 rounded-[60px] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/95 group zen-card-glow transition-all duration-1000">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[8s]"></div>
               <div className="relative z-10">
                 <div className="flex items-center space-x-6 mb-8 md:mb-12">
                    <span className="w-8 h-8 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_40px_rgba(52,211,153,0.5)]"></span>
                    <p className="text-emerald-400 font-black text-[14px] uppercase tracking-[0.8em]">{t.tradition_title}</p>
                 </div>
                 <h3 className="text-3xl md:text-5xl font-light serif mb-10 md:mb-16 italic leading-[1.2] tracking-tighter text-white/98 max-w-2xl">"{zenQuote}"</h3>
                 <div className="flex flex-wrap gap-4 md:gap-8">
                   <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-950 px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[14px] md:text-[16px] shadow-xl hover:bg-emerald-50 transition-all active:scale-95">Enter Silence</button>
                   <button onClick={() => handleViewChange('library')} className="bg-stone-800/95 backdrop-blur-3xl text-stone-200 px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[14px] md:text-[16px] hover:bg-stone-700 transition-all border border-white/10">The Sanctum</button>
                 </div>
               </div>
            </section>

            <AdSlot className="mb-12" />

            <section className="bg-white rounded-[60px] p-10 md:p-14 border border-stone-100 shadow-xl shadow-stone-200/40 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-50 via-emerald-500 to-emerald-50 opacity-90"></div>
               <h3 className="font-black serif text-2xl md:text-3xl mb-10 text-center text-stone-900 tracking-tighter">Tune your inner Vibration</h3>
               <div className="grid grid-cols-5 items-center mb-8 md:mb-12 px-2 md:px-6 gap-4">
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
                      className={`flex flex-col items-center space-y-2 md:space-y-6 transition-all duration-700 ${selectedMood === mood.label ? 'scale-110' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}
                    >
                       <div className={`text-4xl md:text-6xl transform hover:rotate-6 transition-transform filter drop-shadow-xl ${selectedMood === mood.label ? 'animate-bounce' : ''}`}>
                         {mood.emoji}
                       </div>
                    </button>
                  ))}
               </div>
               {(selectedMood || isAiLoading) && (
                 <div className="bg-emerald-50/95 p-8 rounded-[40px] border border-emerald-100/90 animate-in slide-in-from-top-12 duration-500 text-center relative overflow-hidden">
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-6 text-emerald-600 py-6 md:py-12">
                        <div className="w-12 h-12 border-[6px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <span className="text-[14px] md:text-[18px] font-black uppercase tracking-[0.8em] italic opacity-80">Syncing Resonance...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <p className="text-stone-900 text-xl md:text-3xl italic font-medium leading-[1.4] serif px-2 md:px-8">"{aiTip}"</p>
                      </div>
                    )}
                 </div>
               )}
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-6xl md:text-8xl font-black serif text-stone-900 tracking-tighter leading-none mb-6">The Vault</h2>
               <p className="text-stone-400 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl italic opacity-95 serif">Architectural soundscapes engineered for total cognitive surrender.</p>
             </header>

             <AdSlot />

             <section className="space-y-8">
               <h3 className="text-2xl md:text-3xl font-black serif text-stone-900 tracking-tighter">Guided Journeys</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {COURSES.map(course => (
                    <div key={course.id} className="bg-white rounded-[40px] p-4 md:p-6 border border-stone-100 shadow-xl flex items-center space-x-6 group hover:bg-stone-50 transition-all cursor-pointer">
                      <div className="w-20 md:w-24 h-20 md:h-24 rounded-3xl overflow-hidden shrink-0 shadow-lg">
                        <img src={course.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={course.title} />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1 block">{course.difficulty}</span>
                        <h4 className="text-lg md:text-xl font-black serif text-stone-900 leading-tight">{course.title}</h4>
                        <div className="mt-3 w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: `${(course.completedSteps / course.steps) * 100}%` }}></div>
                        </div>
                        <p className="text-stone-400 text-[10px] mt-1.5 font-black uppercase tracking-widest">{course.completedSteps}/{course.steps} Steps</p>
                      </div>
                    </div>
                  ))}
               </div>
             </section>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] bg-stone-100 rounded-[48px] relative overflow-hidden cursor-pointer group shadow-xl border border-stone-100 hover:-translate-y-4 transition-all duration-700">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[30s] grayscale-[0.8] group-hover:grayscale-0" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/20 to-transparent"></div>
                  <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 text-white">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-3xl rounded-full text-[12px] font-black uppercase tracking-[0.2em] mb-4 border border-white/10">{session.category}</span>
                    <h4 className="text-3xl md:text-5xl font-black serif leading-tight mb-4 tracking-tighter">{session.title}</h4>
                    <span className="text-[14px] md:text-[16px] font-black uppercase tracking-[0.4em] opacity-80">{session.duration}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-12 border-t border-stone-100">
               <h3 className="text-3xl md:text-4xl font-black serif text-stone-900 mb-10 md:mb-16 flex items-center">
                 Ambient Alchemist
               </h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-6xl md:text-8xl font-black serif text-stone-900 tracking-tighter leading-none mb-6">{t.sleep_title}</h2>
               <p className="text-stone-400 text-xl md:text-2xl mt-4 font-medium leading-relaxed serif italic opacity-95">{t.sleep_subtitle}</p>
             </header>

             <AdSlot />

             <div className="grid grid-cols-1 gap-8">
                {SLEEP_STORIES.map(story => (
                  <div key={story.id} onClick={() => setActiveSession(story)} className="bg-white rounded-[40px] p-6 md:p-8 border border-stone-100 shadow-xl flex flex-col md:flex-row items-center md:space-x-12 cursor-pointer group hover:bg-stone-50 transition-all duration-700">
                     <div className="w-40 md:w-56 h-40 md:h-56 rounded-[32px] overflow-hidden shrink-0 shadow-xl mb-6 md:mb-0">
                        <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[15s]" alt={story.title} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[12px] md:text-[14px] font-black uppercase text-emerald-600 tracking-[0.4em] mb-4 block">{story.duration}</span>
                        <h4 className="text-2xl md:text-4xl font-black serif text-stone-900 mb-4 tracking-tighter">{story.title}</h4>
                        <p className="text-stone-500 text-lg md:text-xl leading-relaxed max-xl italic opacity-95 serif">"{story.description}"</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <header>
               <h2 className="text-4xl md:text-6xl font-black serif text-stone-900 tracking-tighter mb-6">{t.journal_title}</h2>
             </header>
             <div className="bg-white rounded-[40px] p-6 md:p-10 border border-stone-100 shadow-xl">
                <textarea 
                   value={newJournalText}
                   onChange={(e) => setNewJournalText(e.target.value)}
                   className="w-full h-48 md:h-64 p-6 md:p-10 text-xl md:text-2xl serif bg-stone-50 rounded-[32px] focus:outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all resize-none italic"
                   placeholder={t.journal_placeholder}
                />
                <div className="mt-8 flex flex-col space-y-4">
                  <button onClick={saveJournal} className="w-full bg-stone-900 text-white py-5 rounded-full font-black text-base uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                    {editingJournalId ? t.journal_update : t.journal_save}
                  </button>
                  {editingJournalId && (
                    <button onClick={() => { setEditingJournalId(null); setNewJournalText(''); }} className="w-full text-stone-400 font-black text-sm uppercase tracking-[0.1em]">{t.journal_cancel}</button>
                  )}
                </div>
             </div>
             
             <AdSlot />

             <div className="space-y-6 pt-8">
                {journals.map(j => (
                  <div key={j.id} className="bg-white rounded-[32px] p-6 md:p-8 border border-stone-100 shadow-md group hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">{j.date} • {j.mood}</span>
                      <div className="flex space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingJournalId(j.id); setNewJournalText(j.text); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-stone-400 hover:text-emerald-500 font-black uppercase text-[10px] tracking-widest">{t.journal_edit}</button>
                        <button onClick={() => deleteJournal(j.id)} className="text-stone-400 hover:text-red-500 font-black uppercase text-[10px] tracking-widest">Delete</button>
                      </div>
                    </div>
                    <p className="text-xl md:text-2xl serif text-stone-900 leading-relaxed italic">"{j.text}"</p>
                  </div>
                ))}
                {journals.length === 0 && <p className="text-center text-stone-400 text-2xl serif italic opacity-50 py-16">{t.journal_empty}</p>}
             </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-4xl md:text-6xl font-black serif text-stone-900 tracking-tighter leading-none mb-6">{t.nav_breathing}</h2>
             </header>
             <BreathingExercise lang={lang} />
             
             <AdSlot />

             <section className="pt-12 border-t border-stone-100">
                <h3 className="text-3xl font-black serif text-stone-900 mb-8">Nearby Presence</h3>
                <div className="grid grid-cols-1 gap-4">
                  {zenCenters.map((center, idx) => (
                    <a key={idx} href={center.url} target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-lg flex justify-between items-center group active:scale-95 transition-all">
                      <div>
                        <h4 className="text-xl font-bold serif text-stone-900 group-hover:text-emerald-600 transition-colors">{center.name}</h4>
                        <p className="text-sm text-stone-400 font-medium">{center.address}</p>
                        <div className="flex items-center space-x-2 mt-2">
                           <span className="text-amber-400">★★★★★</span>
                           <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{center.rating} Presence</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                      </div>
                    </a>
                  ))}
                </div>
             </section>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header className="flex flex-col items-center text-center space-y-8">
               <div className="relative">
                 <img src={user.photoUrl} className="w-32 md:w-48 h-32 md:h-48 rounded-[32px] md:rounded-[48px] border-[8px] md:border-[12px] border-white shadow-2xl" alt="avatar" />
               </div>
               <div>
                 <h2 className="text-4xl md:text-5xl font-black serif text-stone-900 tracking-tighter mb-2">{user.name}</h2>
                 <p className="text-stone-400 font-black text-sm md:text-base uppercase tracking-[0.4em]">{user.email}</p>
               </div>
             </header>
             <div className="grid grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white rounded-[32px] p-6 md:p-8 text-center border border-stone-100 shadow-xl">
                   <span className="text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] block mb-2">Streak</span>
                   <span className="text-3xl md:text-5xl font-black serif text-stone-900">{user.streak}d</span>
                </div>
                <div className="bg-white rounded-[32px] p-6 md:p-8 text-center border border-stone-100 shadow-xl">
                   <span className="text-stone-400 font-black text-[10px] uppercase tracking-[0.2em] block mb-2">Soul Level</span>
                   <span className="text-3xl md:text-5xl font-black serif text-stone-900">{zenLevel}</span>
                </div>
             </div>

             <AdSlot />

             <div className="bg-white rounded-[40px] p-8 md:p-10 border border-stone-100 shadow-xl space-y-8">
                <h3 className="text-xl md:text-2xl font-black serif text-stone-900 tracking-tighter">{t.settings_language}</h3>
                <div className="flex flex-col space-y-4">
                  {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
                    <button key={l} onClick={() => changeLanguage(l)} className={`w-full py-4 md:py-6 px-6 md:px-10 rounded-full text-base md:text-lg font-black uppercase tracking-[0.2em] flex justify-between items-center transition-all ${lang === l ? 'bg-emerald-500 text-white shadow-xl' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}>
                       <span>{l === 'en' ? 'English' : l === 'zh-Hans' ? '简体中文' : '繁體中文'}</span>
                       {lang === l && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                    </button>
                  ))}
                </div>
             </div>
             <button onClick={() => { localStorage.removeItem('calmrelax_active_user'); window.location.reload(); }} className="w-full py-6 rounded-full font-black text-base uppercase tracking-[0.4em] text-red-500 border-2 border-red-500/10 hover:bg-red-50 transition-all">Relinquish Presence</button>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-4xl md:text-6xl font-black serif text-stone-900 tracking-tighter mb-6">{t.nav_admin}</h2>
             </header>
             <div className="space-y-6">
                
                {/* ACCOUNT UPGRADE FIX */}
                <div className="bg-indigo-950 rounded-[48px] p-10 md:p-14 text-white shadow-2xl border-l-8 border-indigo-400">
                    <h3 className="text-2xl md:text-3xl font-black serif mb-8">🛠️ Force Reveal "Sites" Tab</h3>
                    <p className="text-xs text-indigo-200/70 mb-8 italic serif leading-relaxed">Your screenshot shows your account is locked to YouTube. Since there is no blue link on the card, follow this <span className="text-indigo-300 font-black">"Invisible Path"</span>:</p>
                    <div className="space-y-10">
                        <div className="flex items-start space-x-6">
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex-shrink-0 flex items-center justify-center font-black text-indigo-950 shadow-xl">1</div>
                            <div>
                                <p className="font-black text-indigo-100 uppercase tracking-[0.2em] text-xs mb-3">Upgrade Account Type</p>
                                <p className="text-xs text-indigo-300/80 leading-relaxed">Click <span className="bg-white/10 px-2 py-0.5 rounded text-white font-bold">帳戶 (Account)</span> in your left sidebar. Then click <span className="text-white font-bold underline">設定 (Settings)</span> and look for <span className="text-white font-bold underline">帳戶資訊 (Account Info)</span>. You are looking for a button that says "Get Started with Content" or "Upgrade Account".</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-6">
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex-shrink-0 flex items-center justify-center font-black text-indigo-950 shadow-xl">2</div>
                            <div>
                                <p className="font-black text-indigo-100 uppercase tracking-[0.2em] text-xs mb-3">Direct Manual URL</p>
                                <p className="text-xs text-indigo-300/80 leading-relaxed mb-4">Copy and paste this exact link into your browser to bypass the missing menu:</p>
                                <button 
                                  onClick={() => window.open('https://adsense.google.com/adsense/u/0/pub-8929599367151882/sites/my-sites/add-site', '_blank')}
                                  className="bg-indigo-500 hover:bg-indigo-400 text-indigo-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl"
                                >
                                  Open Force-Add Link
                                </button>
                            </div>
                        </div>
                        <div className="flex items-start space-x-6">
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex-shrink-0 flex items-center justify-center font-black text-indigo-950 shadow-xl">3</div>
                            <div>
                                <p className="font-black text-indigo-100 uppercase tracking-[0.2em] text-xs mb-3">Verification Priority</p>
                                <p className="text-xs text-indigo-300/80 leading-relaxed">Google hides the blue links if you haven't clicked the <span className="bg-rose-500 text-white px-2 py-0.5 rounded font-bold uppercase text-[9px]">驗證身份 (Verify Identity)</span> button at the very top. Click that first and upload your documents.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-stone-900 rounded-[48px] p-10 text-white shadow-xl">
                    <h3 className="text-2xl font-black serif mb-6">System Resonance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white/5 p-8 rounded-[32px] border border-white/10">
                          <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-2">Total Users</p>
                          <p className="text-4xl md:text-6xl font-black serif">1,402</p>
                       </div>
                       <div className="bg-white/5 p-8 rounded-[32px] border border-white/10">
                          <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-2">App Version Code</p>
                          <p className="text-4xl md:text-6xl font-black serif">31</p>
                       </div>
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
