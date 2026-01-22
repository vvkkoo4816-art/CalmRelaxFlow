import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import AdSlot from './components/AdSlot';
import { AppView, User, MeditationSession, Language, JournalEntry, LoginRecord } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES, COURSES, PUBLIC_AUDIO_FILES } from './constants';
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
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [newJournalText, setNewJournalText] = useState('');
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);

  const [adRefreshKey, setAdRefreshKey] = useState(0);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<'Google' | 'Facebook' | null>(null);
  const [inputEmail, setInputEmail] = useState('');
  const [isShowingInterstitial, setIsShowingInterstitial] = useState(false);
  const [canSkipInterstitial, setCanSkipInterstitial] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);

  const t = useMemo(() => translations[lang] || translations['en'], [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('calmrelax_active_user');
    const savedLang = localStorage.getItem('calmrelax_lang');
    const savedJournals = localStorage.getItem('calmrelax_journals');
    const savedLogins = localStorage.getItem('calmrelax_login_history');
    
    if (savedLang) setLang(savedLang as Language);
    if (savedJournals) setJournals(JSON.parse(savedJournals));
    if (savedLogins) setLoginHistory(JSON.parse(savedLogins));
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.isLoggedIn && parsed?.email) {
        setUser(parsed);
        setIsLoggedIn(true);
        setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
        recordLogin(parsed.email, new Date().toISOString(), "Session Resumed");
      }
    }
    generateLuckyNumbers();
  }, []);

  const generateLuckyNumbers = () => {
    const nums: number[] = [];
    while (nums.length < 7) {
      const n = Math.floor(Math.random() * 49) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    setLuckyNumbers(nums);
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('calmrelax_lang', newLang);
  };

  const handleViewChange = (newView: AppView) => {
    if (newView === view) return;
    setPendingView(newView);
    setIsShowingInterstitial(true);
    setCanSkipInterstitial(false);
    setAdRefreshKey(prev => prev + 1);
    setTimeout(() => setCanSkipInterstitial(true), 3000);
    setTimeout(() => { if (isShowingInterstitial) completeViewChange(newView); }, 4500); 
  };

  const completeViewChange = (newView: AppView) => {
    setIsShowingInterstitial(false);
    setView(newView);
    setPendingView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const initiateAuth = (method: 'Google' | 'Facebook') => {
    setAuthMethod(method);
    setIsConsentModalOpen(true);
    setInputEmail('vvkkoo4816@gmail.com');
  };

  const finalizeLogin = () => {
    const email = inputEmail.trim().toLowerCase() || "guest@sanctuary.com";
    const timestamp = new Date().toISOString();
    completeAuthSequence(email, timestamp, "Web Native");
  };

  const completeAuthSequence = (email: string, timestamp: string, location: string) => {
    recordLogin(email, timestamp, location);

    const isAdmin = email === 'vvkkoo4816@gmail.com';
    const mockUser: User = {
      id: `social-${Date.now()}`,
      name: isAdmin ? "Sanctuary Admin" : email.split('@')[0],
      email: email,
      photoUrl: `https://ui-avatars.com/api/?name=${email}&background=${isAdmin ? '10b981' : '3b82f6'}&color=fff`,
      isLoggedIn: true,
      streak: 1,
      minutesMeditated: 0,
      role: isAdmin ? 'admin' : 'user',
      isPremium: true
    };

    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
    setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
    setIsConsentModalOpen(false);
    setAuthMethod(null);
  };

  const recordLogin = (email: string, timestamp: string, location: string) => {
    const newRecord: LoginRecord = { email, timestamp, location };
    const savedLogins = localStorage.getItem('calmrelax_login_history');
    const history = savedLogins ? JSON.parse(savedLogins) : [];
    const updatedHistory = [newRecord, ...history].slice(0, 1000);
    setLoginHistory(updatedHistory);
    localStorage.setItem('calmrelax_login_history', JSON.stringify(updatedHistory));
  };

  const downloadSanctuaryCSV = () => {
    const headers = ["Category", "User Email", "Event Timestamp", "Metadata (Loc/Mood)", "Description/Content"];
    const rows = [
      ...loginHistory.map(l => ["AUTHENTICATION", l.email, l.timestamp, l.location, "User Session Started"]),
      ...journals.map(j => ["JOURNAL_ENTRY", user?.email || "Unknown", j.date, j.mood, `"${j.text.replace(/"/g, '""')}"`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sanctuary_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem('calmrelax_active_user');
    setIsLoggedIn(false);
    setUser(null);
    setView('today');
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsAiLoading(true);
    try {
      const recommendation = await getPersonalizedRecommendation(mood, lang);
      setAiTip(recommendation);
    } catch (error) {
      console.error("AI resonance error:", error);
      setAiTip(t.mood_fallback || "Take a deep breath. You are safe.");
    } finally {
      setIsAiLoading(false);
    }
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

  const progressPercent = Math.min(((user?.minutesMeditated ?? 0) % 60 / 30) * 100, 100);
  const zenLevel = Math.floor((user?.minutesMeditated ?? 0) / 120) + 1;

  const LuckyBall = ({ num, color }: { num: number, color: 'red' | 'blue' | 'green' }) => {
    const colorClasses = {
      red: 'from-red-500 to-red-700 shadow-red-200 border-red-400',
      blue: 'from-blue-500 to-blue-700 shadow-blue-200 border-blue-400',
      green: 'from-green-500 to-green-700 shadow-green-200 border-green-400'
    };
    return (
      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${colorClasses[color]} border-2 shadow-lg flex items-center justify-center relative transform hover:scale-110 transition-transform active:scale-95 group`}>
        <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-inner">
          <span className="text-stone-900 font-black text-xs md:text-sm">{num}</span>
        </div>
      </div>
    );
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
            <button onClick={() => initiateAuth('Google')} className="w-full bg-white border border-stone-200 text-stone-800 px-8 py-5 rounded-full font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-95 group">
               <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="google" />
               <span className="text-base tracking-tight uppercase">{t.sign_in_google}</span>
            </button>
            <button onClick={() => initiateAuth('Facebook')} className="w-full bg-[#1877F2] text-white px-8 py-5 rounded-full font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-95 group border-b-4 border-blue-900">
               <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               <span className="text-base tracking-tight uppercase">{t.sign_in_facebook}</span>
            </button>
          </div>
        </div>

        {isConsentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-stone-950/95 backdrop-blur-3xl">
            <div className="bg-white w-full max-w-sm rounded-[50px] p-10 shadow-2xl animate-in zoom-in duration-500">
               <h3 className="text-2xl font-black serif text-stone-900 mb-2">{t.auth_permission_title}</h3>
               <p className="text-stone-500 text-sm mb-6 leading-relaxed serif italic">{t.auth_permission_desc}</p>
               
               <div className="mb-8 space-y-4">
                 <label className="block text-[10px] font-black uppercase text-stone-400 tracking-widest text-left ml-2">Identify via {authMethod}</label>
                 <input 
                   type="email" 
                   value={inputEmail}
                   onChange={(e) => setInputEmail(e.target.value)}
                   className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-5 py-4 font-bold text-stone-800 focus:outline-none focus:border-emerald-500/30 transition-all"
                   placeholder="Enter sanctuary email"
                 />
               </div>

               <div className="flex flex-col space-y-3">
                 <button onClick={finalizeLogin} className="w-full bg-emerald-600 text-white py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">{t.auth_allow}</button>
                 <button onClick={() => { setIsConsentModalOpen(false); setAuthMethod(null); }} className="w-full text-stone-400 py-3 rounded-full font-black text-xs uppercase tracking-[0.2em]">{t.auth_deny}</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <div className="max-w-3xl mx-auto pb-64 space-y-6 md:space-y-12 px-4">
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center ad-interstitial-in">
             <div className="w-16 h-16 border-[6px] border-emerald-50 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-xl shadow-emerald-500/20"></div>
             <p className="text-emerald-800 font-black text-sm uppercase tracking-[0.3em] animate-pulse italic mb-8">Refining Frequency...</p>
             <div className="w-full max-w-md bg-stone-50 rounded-3xl p-4 border border-stone-100 shadow-inner mb-8 min-h-[150px] flex items-center justify-center">
               <AdSlot key={`interstitial-ad-${adRefreshKey}`} />
             </div>
             {canSkipInterstitial && (
               <button 
                 onClick={() => pendingView && completeViewChange(pendingView)} 
                 className="px-8 py-3 bg-stone-900 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-xl animate-in fade-in duration-500"
               >
                 Enter {pendingView}
               </button>
             )}
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
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
            <section className="bg-white rounded-[60px] p-10 md:p-14 border border-stone-100 shadow-xl shadow-stone-200/40 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-50 via-emerald-500 to-emerald-50 opacity-90"></div>
               <h3 className="font-black serif text-2xl md:text-3xl mb-10 text-center text-stone-900 tracking-tighter">Tune your inner Vibration</h3>
               <div className="grid grid-cols-5 items-center mb-8 md:mb-12 px-2 md:px-6 gap-4">
                  {['High', 'Calm', 'Cloud', 'Vast', 'Quiet'].map((label, i) => (
                    <button 
                      key={label} 
                      onClick={() => handleMoodSelect(label)} 
                      className={`flex flex-col items-center space-y-2 md:space-y-6 transition-all duration-700 ${selectedMood === label ? 'scale-110' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}
                    >
                       <div className="text-4xl md:text-6xl transform hover:rotate-6 transition-transform filter drop-shadow-xl">
                         {['✨', '🧘', '☁️', '🌌', '🌑'][i]}
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
            <AdSlot key={`home-ad-${adRefreshKey}`} className="mb-4" />
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-6xl md:text-8xl font-black serif text-stone-900 tracking-tighter leading-none mb-6">The Vault</h2>
               <p className="text-stone-400 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl italic opacity-95 serif">Architectural soundscapes engineered for total cognitive surrender.</p>
             </header>
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
               <h3 className="text-3xl md:text-4xl font-black serif text-stone-900 mb-10 md:mb-16 flex items-center">Ambient Alchemist</h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-5xl md:text-8xl font-black serif text-stone-900 tracking-tighter leading-none mb-4">{t.sleep_title}</h2>
               <p className="text-stone-400 text-lg md:text-2xl mt-2 font-medium leading-relaxed serif italic opacity-95">{t.sleep_subtitle}</p>
             </header>
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
          <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
             <header>
               <h2 className="text-4xl md:text-6xl font-black serif text-stone-900 tracking-tighter mb-4">{t.journal_title}</h2>
             </header>

             {/* Lucky Numbers Section */}
             <section className="bg-white rounded-[40px] p-8 md:p-10 border border-stone-100 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                </div>
                <div className="relative z-10 text-center md:text-left">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl md:text-3xl font-black serif text-stone-900 tracking-tighter">Lucky Number Today</h3>
                      <button 
                        onClick={generateLuckyNumbers}
                        className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] border border-emerald-100 px-4 py-2 rounded-full hover:bg-emerald-50 transition-all flex items-center space-x-2"
                      >
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                         <span>Refresh</span>
                      </button>
                   </div>
                   
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-5 mb-2">
                      <LuckyBall num={luckyNumbers[0]} color="red" />
                      <LuckyBall num={luckyNumbers[1]} color="blue" />
                      <LuckyBall num={luckyNumbers[2]} color="green" />
                      <LuckyBall num={luckyNumbers[3]} color="blue" />
                      <LuckyBall num={luckyNumbers[4]} color="green" />
                      <LuckyBall num={luckyNumbers[5]} color="red" />
                      <div className="text-2xl font-bold text-stone-300 mx-1">+</div>
                      <LuckyBall num={luckyNumbers[6]} color="green" />
                   </div>
                   <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em] mt-6 opacity-60">Synchronicity in every sequence</p>
                </div>
             </section>

             <div className="bg-white rounded-[40px] p-6 md:p-10 border border-stone-100 shadow-xl">
                <textarea 
                   value={newJournalText}
                   onChange={(e) => setNewJournalText(e.target.value)}
                   className="w-full h-48 md:h-64 p-6 md:p-10 text-xl md:text-2xl serif bg-stone-50 rounded-[32px] focus:outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all resize-none italic"
                   placeholder={t.journal_placeholder}
                />
                <div className="mt-8 flex flex-col space-y-4">
                  <div className="flex space-x-4">
                    <button onClick={saveJournal} className="flex-1 bg-stone-900 text-white py-5 rounded-full font-black text-base uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                      {editingJournalId ? t.journal_update : t.journal_save}
                    </button>
                    <a href="/icon1.apk" download="icon1.apk" className="w-16 h-16 bg-white border border-stone-200 text-stone-400 rounded-full flex items-center justify-center hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-lg active:scale-95 group" title="Download APK">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </a>
                  </div>
                  {editingJournalId && (
                    <button onClick={() => { setEditingJournalId(null); setNewJournalText(''); }} className="w-full text-stone-400 font-black text-sm uppercase tracking-[0.1em]">{t.journal_cancel}</button>
                  )}
                </div>
             </div>
             <AdSlot key={`journal-ad-middle-${adRefreshKey}`} />
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
             </div>
          </div>
        )}

        {view === 'admin' && user.role === 'admin' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
             <header className="flex justify-between items-end border-b border-stone-100 pb-8">
               <div>
                 <h2 className="text-4xl md:text-6xl font-black serif text-stone-900 tracking-tighter mb-2">{t.nav_admin}</h2>
                 <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">V33 Deployment Control</p>
               </div>
             </header>

             <section className="bg-stone-950 text-white p-8 md:p-12 rounded-[50px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="relative z-10">
                   <h3 className="text-2xl font-black serif mb-8 flex items-center space-x-3">
                     <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     <span>Closed Testing Goal Tracker</span>
                   </h3>
                   <div className="space-y-10">
                      <div>
                        <div className="flex justify-between items-center mb-3 px-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Unique Testers</span>
                          <span className="text-emerald-400 font-black text-xs">4 / 20</span>
                        </div>
                        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                           <div className="h-full bg-emerald-500 transition-all duration-[2s]" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                   </div>
                </div>
             </section>

             <section className="bg-white border-2 border-stone-950 p-8 md:p-12 rounded-[50px] shadow-2xl transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex-1">
                      <h3 className="text-3xl font-black serif text-stone-900 mb-2">Data Intelligence</h3>
                      <p className="text-stone-500 font-medium leading-relaxed italic serif opacity-80">Export all sanctuary logs, login records, and journal metadata for external analysis.</p>
                   </div>
                   <button 
                     onClick={downloadSanctuaryCSV}
                     className="bg-stone-950 text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 flex items-center justify-center space-x-4 group"
                   >
                     <svg className="w-5 h-5 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                     <span>Export Analytics CSV</span>
                   </button>
                </div>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-4 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Logins</span>
                      <span className="text-2xl font-black serif text-stone-900">{loginHistory.length}</span>
                   </div>
                   <div className="p-4 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Journals</span>
                      <span className="text-2xl font-black serif text-stone-900">{journals.length}</span>
                   </div>
                   <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Status</span>
                      <span className="text-xs font-black text-emerald-700 tracking-tight">Active Stream</span>
                   </div>
                </div>
             </section>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-emerald-950 text-emerald-50 p-10 rounded-[48px] shadow-2xl">
                   <h3 className="text-2xl font-black serif mb-6">Asset Audit</h3>
                   <div className="grid grid-cols-1 gap-4">
                     {PUBLIC_AUDIO_FILES.map(file => (
                       <div key={file} className="flex items-center justify-between p-5 bg-emerald-900/40 border border-emerald-500/20 rounded-3xl">
                         <span className="font-mono text-sm tracking-tight">{file}</span>
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Synced</span>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="bg-stone-900 text-stone-100 p-10 rounded-[48px] shadow-xl">
                   <h3 className="text-2xl font-black serif mb-4">Manifest</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-stone-500 font-bold text-[10px] uppercase">Code</span>
                        <span className="text-emerald-400 font-black">33</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-stone-500 font-bold text-[10px] uppercase">Name</span>
                        <span className="text-emerald-400 font-black">6.3.1</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header className="text-center">
               <div className="relative inline-block mb-6">
                 <img src={user.photoUrl} className="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl" alt="avatar" />
                 <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 </div>
               </div>
               <h2 className="text-4xl font-black serif text-stone-900 tracking-tighter">{user.name}</h2>
               <p className="text-stone-400 font-medium serif italic mt-1">{user.email}</p>
             </header>

             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-lg text-center">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 block mb-2">Current Streak</span>
                 <span className="text-3xl font-black serif text-stone-900">{user.streak} Days</span>
               </div>
               <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-lg text-center">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 block mb-2">Total Minutes</span>
                 <span className="text-3xl font-black serif text-stone-900">{user.minutesMeditated}</span>
               </div>
             </div>

             <div className="bg-white rounded-[40px] p-6 border border-stone-100 shadow-xl space-y-2">
               <button onClick={handleLogout} className="w-full text-red-500 font-black uppercase tracking-[0.2em] py-5 rounded-[24px] hover:bg-red-50 transition-all border border-transparent hover:border-red-100">Sign Out Sanctuary</button>
             </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
             <header><h2 className="text-4xl md:text-6xl font-black serif text-stone-900 tracking-tighter mb-4">{t.nav_breathing}</h2></header>
             <BreathingExercise lang={lang} />
             
             <section className="pt-12 border-t border-stone-100 space-y-12">
                <header>
                  <h3 className="text-3xl md:text-5xl font-black serif text-stone-900 tracking-tight">The Meditation Guide</h3>
                  <p className="text-stone-400 font-medium serif italic text-lg md:text-xl">Illustrations and guidance for your architectural mindfulness practice.</p>
                </header>

                <div className="grid grid-cols-1 gap-12">
                   <div className="bg-white rounded-[50px] border border-stone-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-700">
                      <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200" className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-[10s]" alt="Posture Guide" />
                      <div className="p-8 md:p-12">
                         <h4 className="text-3xl font-black serif text-stone-900 mb-4">Stage I: Divine Alignment</h4>
                         <p className="text-stone-500 text-lg serif italic leading-relaxed mb-8">Establish a firm foundation. Sit tall, let your shoulders drop, and find the center of your gravity.</p>
                         <a href="https://www.youtube.com/watch?v=ssss7V1_eyA" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-3 bg-stone-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            <span>Watch Posture Guide</span>
                         </a>
                      </div>
                   </div>

                   <div className="bg-white rounded-[50px] border border-stone-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-700">
                      <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200" className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-[10s]" alt="Breath Guide" />
                      <div className="p-8 md:p-12">
                         <h4 className="text-3xl font-black serif text-stone-900 mb-4">Stage II: The Etheric Bridge</h4>
                         <p className="text-stone-500 text-lg serif italic leading-relaxed mb-8">Connect your physical body with your spirit through rhythmic, conscious breathing.</p>
                         <a href="https://www.youtube.com/watch?v=ZToicYcHIOU" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-3 bg-stone-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            <span>Watch Breath Guide</span>
                         </a>
                      </div>
                   </div>

                   <div className="bg-white rounded-[50px] border border-stone-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-700">
                      <img src="https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&q=80&w=1200" className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-[10s]" alt="Silence Guide" />
                      <div className="p-8 md:p-12">
                         <h4 className="text-3xl font-black serif text-stone-900 mb-4">Stage III: The Sound of Silence</h4>
                         <p className="text-stone-500 text-lg serif italic leading-relaxed mb-8">Vanish into the absolute presence of the now. Where thought ends, clarity begins.</p>
                         <a href="https://www.youtube.com/watch?v=inpok4MKVLM" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-3 bg-stone-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            <span>Watch Session Guide</span>
                         </a>
                      </div>
                   </div>
                </div>
             </section>
             <AdSlot key={`explore-ad-bottom-${adRefreshKey}`} />
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;