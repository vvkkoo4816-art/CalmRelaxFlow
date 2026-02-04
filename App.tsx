import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import BreathingExercise from './components/BreathingExercise';
import SoundMixer from './components/SoundMixer';
import AdSlot from './components/AdSlot';
import AIChatbox from './components/AIChatbox';
import PermissionDialog from './components/PermissionDialog';
import ZenAdInterstitial from './components/ZenAdInterstitial';
import { AppView, User, MeditationSession, Language, JournalEntry, LoginRecord } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES, COURSES } from './constants';
import { translations } from './translations';

const DAILY_GOAL_MINS = 20;
export const ADMIN_EMAIL = 'vvkkoo4816@gmail.com';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('calmrelax_lang');
    return (saved as Language) || 'en';
  }); 
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [zenQuote, setZenQuote] = useState<string>(STATIC_QUOTES[2]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [newJournalText, setNewJournalText] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([38, 47, 6, 32, 21, 14, 46]);

  // Auth States
  const [isRegistering, setIsRegistering] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<'Google' | 'Facebook' | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showSocialMock, setShowSocialMock] = useState(false);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');

  // Interstitial & Ad States
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);
  const [viewChangeCount, setViewChangeCount] = useState(0);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const t = useMemo(() => translations[lang] || translations['en'], [lang]);

  const progressPercent = useMemo(() => {
    if (!user) return 0;
    return Math.min(Math.round((user.minutesMeditated / DAILY_GOAL_MINS) * 100), 100);
  }, [user?.minutesMeditated]);

  useEffect(() => {
    localStorage.setItem('calmrelax_lang', lang);
  }, [lang]);

  useEffect(() => {
    const savedUserStr = localStorage.getItem('calmrelax_active_user');
    const savedJournals = localStorage.getItem('calmrelax_journals');
    const savedLoginsStr = localStorage.getItem('calmrelax_login_db');
    
    if (savedJournals) setJournals(JSON.parse(savedJournals));
    if (savedLoginsStr) setLoginHistory(JSON.parse(savedLoginsStr));
    
    const activeUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    if (activeUser?.isLoggedIn) {
      setUser(activeUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleViewChange = (newView: AppView) => {
    if (newView === 'admin' && user?.email !== ADMIN_EMAIL) {
      setView('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (newView !== view) {
      const nextCount = viewChangeCount + 1;
      setViewChangeCount(nextCount);
      if (nextCount % 6 === 0) {
        setPendingView(newView);
        setIsShowingAd(true);
      } else {
        setView(newView);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const finalizeViewChange = () => {
    if (pendingView) setView(pendingView);
    setIsShowingAd(false);
    setPendingView(null);
  };

  const initiateSocialLogin = (provider: 'Google' | 'Facebook') => {
    setPendingProvider(provider);
    setShowSocialMock(true);
    setAuthError(null);
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSocialMockSubmit = () => {
    if (!socialEmail.trim()) {
      setAuthError(t.error_empty);
      return;
    }
    if (!validateEmail(socialEmail)) {
      setAuthError(t.error_email);
      return;
    }
    setAuthError(null);
    setShowSocialMock(false);
    setShowPermissionDialog(true);
  };

  const finalizeLogin = async (provider: 'Email' | 'Google' | 'Facebook' = 'Email') => {
    setAuthError(null);

    if (provider === 'Email') {
      if (!inputEmail.trim() || !inputPassword.trim() || (isRegistering && !inputName.trim())) {
        setAuthError(t.error_empty);
        return;
      }
      if (!validateEmail(inputEmail)) {
        setAuthError(t.error_email);
        return;
      }
    }

    setIsAuthenticating(true);
    const finalEmail = provider === 'Email' ? inputEmail.trim().toLowerCase() : socialEmail.trim().toLowerCase();
    const finalName = provider === 'Email' ? (inputName || finalEmail.split('@')[0]) : (socialName || finalEmail.split('@')[0]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const newRecord: LoginRecord = {
      email: finalEmail,
      timestamp: new Date().toLocaleString(),
      location: "Sanctuary Portal",
      device: /Android|iPhone/i.test(navigator.userAgent) ? "Mobile Node" : "Desktop Node"
    };
    const updatedHistory = [newRecord, ...loginHistory].slice(0, 100);
    setLoginHistory(updatedHistory);
    localStorage.setItem('calmrelax_login_db', JSON.stringify(updatedHistory));
    
    const mockUser: User = {
      id: `${provider.toLowerCase()}-${Date.now()}`,
      name: finalName,
      email: finalEmail,
      photoUrl: `https://ui-avatars.com/api/?name=${finalEmail}&background=10b981&color=fff`,
      isLoggedIn: true,
      streak: 5,
      minutesMeditated: 75,
      role: finalEmail === ADMIN_EMAIL ? 'admin' : 'user',
      isPremium: true
    };

    setUser(mockUser);
    setIsLoggedIn(true);
    setIsAuthenticating(false);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
  };

  const refreshLuckyNumbers = () => {
    const nums: number[] = [];
    while (nums.length < 7) {
      const n = Math.floor(Math.random() * 49) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    setLuckyNumbers(nums.sort((a, b) => a - b));
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center pt-8 px-6 pb-20 overflow-x-hidden relative">
        {showSocialMock && (
          <div className="fixed inset-0 z-[110] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl relative animate-in zoom-in-95 duration-500">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-[32px] shadow-xl flex items-center justify-center border border-stone-50">
                {pendingProvider === 'Google' ? (
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-12 h-12" alt="google" />
                ) : (
                  <svg className="w-12 h-12 fill-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                )}
              </div>
              <div className="mt-12 text-center space-y-2 mb-8">
                <h3 className="text-3xl font-black serif text-stone-900">{t.login_title} with {pendingProvider}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{t.sanctuary_join}</p>
              </div>
              <div className="space-y-4 mb-10">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">{t.email_label}</label>
                  <input type="email" value={socialEmail} onChange={(e) => setSocialEmail(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="example@gmail.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">{t.name_label}</label>
                  <input type="text" value={socialName} onChange={(e) => setSocialName(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Your Name" />
                </div>
                {authError && <p className="text-rose-500 text-[10px] font-bold text-center">{authError}</p>}
              </div>
              <button onClick={handleSocialMockSubmit} className="w-full bg-stone-900 text-white py-4.5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">{t.confirm}</button>
              <button onClick={() => setShowSocialMock(false)} className="w-full text-center mt-6 text-[10px] font-black text-stone-300 uppercase tracking-widest hover:text-stone-500 transition-all">{t.cancel}</button>
            </div>
          </div>
        )}

        <PermissionDialog isOpen={showPermissionDialog} provider={pendingProvider || 'Google'} lang={lang} onAllow={() => { setShowPermissionDialog(false); finalizeLogin(pendingProvider!); }} onCancel={() => setShowPermissionDialog(false)} />

        <div className="flex bg-stone-50 p-1.5 rounded-full mb-16 border border-stone-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
          {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
            <button key={l} onClick={() => setLang(l)} className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-white text-stone-900 shadow-md' : 'text-stone-300 hover:text-stone-500'}`}>
              {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简体' : '繁體'}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center mb-12 animate-in fade-in zoom-in-95 duration-1000 text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-black serif text-stone-900 mb-8 tracking-tighter">CalmRelaxFlow</h1>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500 rounded-[30px] sm:rounded-[36px] flex items-center justify-center text-white shadow-2xl zen-card-glow mb-10">
            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-stone-900 mb-2 serif leading-tight">{isRegistering ? t.register_title : t.login_title}</h2>
          <p className="text-stone-400 serif italic text-base">{isRegistering ? t.sanctuary_join : t.sanctuary_return}</p>
        </div>

        <div className="w-full max-w-sm bg-stone-100/50 rounded-[48px] p-8 sm:p-10 border border-stone-200/40 shadow-inner space-y-7 mb-10">
          {isRegistering && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">{t.name_label}</label>
              <input type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} className="w-full bg-white/80 border border-stone-200 rounded-2xl px-5 py-4 text-stone-800 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="Enter your name" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">{t.email_label}</label>
            <input type="text" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className="w-full bg-white/80 border border-stone-200 rounded-2xl px-5 py-4 text-stone-800 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="Enter username" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">{t.password_label}</label>
            <input type="password" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} className="w-full bg-white/80 border border-stone-200 rounded-2xl px-5 py-4 text-stone-800 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="••••••••" />
          </div>
          {authError && <p className="text-rose-500 text-[11px] font-bold text-center mb-2">{authError}</p>}
          <button onClick={() => finalizeLogin('Email')} className="w-full bg-stone-900 text-white py-5 rounded-full font-black text-[13px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all mt-6">
            {isAuthenticating ? t.authenticating : isRegistering ? t.register_btn : t.login_btn}
          </button>
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} className="w-full text-center text-[10px] font-black text-stone-400 uppercase tracking-widest pt-2 hover:text-stone-900 transition-colors">
            {isRegistering ? t.switch_to_login : t.switch_to_register}
          </button>
        </div>

        <div className="w-full max-w-sm bg-white rounded-[48px] p-8 sm:p-10 shadow-2xl border border-stone-50 space-y-5">
          <p className="text-center text-[10px] font-black text-stone-300 uppercase tracking-[0.4em] mb-4">{t.one_tap}</p>
          <button onClick={() => initiateSocialLogin('Google')} className="w-full py-4.5 bg-white border border-stone-100 rounded-2xl flex items-center justify-center space-x-4 shadow-sm hover:bg-stone-50 active:scale-98 transition-all px-4">
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6 shrink-0" alt="google" />
            <span className="text-[11px] sm:text-xs font-black text-stone-700 uppercase tracking-widest truncate">{t.social_google}</span>
          </button>
          <button onClick={() => initiateSocialLogin('Facebook')} className="w-full bg-[#1877F2] py-4.5 rounded-2xl flex items-center justify-center space-x-4 shadow-lg hover:bg-[#166fe5] active:scale-98 transition-all px-4">
            <svg className="w-6 h-6 fill-white shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span className="text-[11px] sm:text-xs font-black text-white uppercase tracking-widest truncate">{t.social_facebook}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <ZenAdInterstitial isVisible={isShowingAd} onComplete={finalizeViewChange} lang={lang} pendingView={pendingView} />
      
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <button onClick={() => setSelectedVideo(null)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-all bg-white/10 p-5 rounded-full">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="w-full max-w-4xl aspect-video rounded-[40px] overflow-hidden shadow-2xl border border-white/10 bg-black">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0&enablejsapi=1`} title="Zen Guide" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
          <p className="mt-10 text-stone-500 font-black uppercase tracking-[0.6em] text-[11px]">Breath in Resonance</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto pb-48 space-y-12 px-4">
        {view === 'today' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="text-center py-6 sm:py-10">
              <h1 className="text-5xl sm:text-7xl font-black serif text-stone-900 tracking-tighter mb-3 leading-none">CalmRelaxFlow</h1>
              <p className="text-[10px] sm:text-sm font-black uppercase tracking-[0.6em] text-stone-400">High-Fidelity Sanctuary</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-sm border border-stone-50 space-y-6 sm:space-y-0">
               <div className="min-w-0 sm:pr-6 text-center sm:text-left w-full overflow-hidden">
                  <h2 className="text-3xl sm:text-4xl font-black serif text-stone-900 break-words leading-tight">{user.name}</h2>
                  <p className="text-emerald-500 font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] mt-2">Deep Awareness: {user.streak} Days</p>
               </div>
               <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center relative shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <span className="text-lg sm:text-xl font-black text-stone-800 z-10">{progressPercent}%</span>
               </div>
            </div>

            <div className="bg-stone-950 rounded-[32px] sm:rounded-[48px] p-10 sm:p-14 text-white shadow-2xl relative overflow-hidden group">
               <p className="text-2xl sm:text-5xl serif italic leading-tight text-white/95 mb-14">"{zenQuote}"</p>
               <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                 <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-900 px-10 sm:px-12 py-5 rounded-full font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all w-full sm:w-auto">Enter Silence</button>
                 <button onClick={() => handleViewChange('library')} className="bg-white/10 text-white px-10 sm:px-12 py-5 rounded-full font-black text-[10px] sm:text-[11px] uppercase tracking-widest backdrop-blur-md hover:bg-white/20 transition-all w-full sm:w-auto">The Sanctum</button>
               </div>
            </div>

            <div className="bg-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 border border-stone-100/40">
               <h3 className="text-lg sm:text-xl font-black serif text-stone-900 mb-4">{t.about_title}</h3>
               <p className="text-stone-500 text-sm sm:text-base leading-relaxed serif italic">
                 {t.about_text}
               </p>
            </div>
            
            <AdSlot />
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="space-y-4">
                <h2 className="text-5xl sm:text-6xl font-black text-stone-900 uppercase tracking-tighter leading-none">{t.header_vault}</h2>
                <p className="text-stone-400 serif italic text-base sm:text-lg leading-relaxed">{t.vault_subtitle}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {MEDITATION_SESSIONS.map(session => (
                  <button 
                    key={session.id}
                    onClick={() => !session.isLocked && setActiveSession(session)}
                    className={`group relative bg-white rounded-[32px] sm:rounded-[40px] overflow-hidden border border-stone-50 shadow-xl transition-all duration-700 text-left ${session.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'}`}
                  >
                    <div className="h-56 sm:h-64 overflow-hidden relative">
                       <img src={session.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={session.title} />
                       {session.isLocked && (
                         <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-white p-4 rounded-full shadow-2xl">
                               <svg className="w-6 h-6 text-stone-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                            </div>
                         </div>
                       )}
                       <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/90 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-stone-900">
                          {session.duration}
                       </div>
                    </div>
                    <div className="p-8 sm:p-10 space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">{session.category}</p>
                       <h3 className="text-2xl sm:text-3xl font-black serif text-stone-900">{session.title}</h3>
                       {session.description && <p className="text-stone-400 serif italic text-sm mt-2">{session.description}</p>}
                    </div>
                  </button>
                ))}
             </div>

             <div className="pt-12 space-y-8">
                <h2 className="text-3xl sm:text-4xl font-black serif text-stone-900">Structured Mastery</h2>
                <div className="grid grid-cols-1 gap-8">
                   {COURSES.map(course => (
                     <div key={course.id} className="bg-stone-900 rounded-[32px] sm:rounded-[48px] p-8 sm:p-10 flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-10 text-white shadow-2xl overflow-hidden relative group">
                        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[28px] sm:rounded-[36px] overflow-hidden shrink-0 border border-white/10 shadow-xl">
                           <img src={course.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                        </div>
                        <div className="flex-1 space-y-6 w-full">
                           <div className="text-center sm:text-left">
                              <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.5em] mb-2">{course.difficulty}</p>
                              <h3 className="text-3xl sm:text-4xl font-black serif leading-tight">{course.title}</h3>
                              <p className="text-stone-400 serif italic text-base sm:text-lg mt-2">{course.description}</p>
                           </div>
                           <div className="w-full bg-white/10 h-1.5 rounded-full relative">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${(course.completedSteps/course.steps)*100}%` }}></div>
                           </div>
                           <button onClick={() => handleViewChange('explore')} className="bg-white text-stone-900 px-8 py-3.5 rounded-full font-black text-[10px] sm:text-[11px] uppercase tracking-widest w-full sm:w-auto">Resume Path</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="space-y-4">
                <h2 className="text-5xl sm:text-6xl font-black text-stone-900 uppercase tracking-tighter leading-none">{t.header_sleep}</h2>
                <p className="text-stone-400 serif italic text-base sm:text-lg leading-relaxed">Surrender to the architectural whispers of the night. Experience deep REM recovery through high-fidelity soundscapes designed to induce relaxation and tranquility.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {SLEEP_STORIES.map(story => (
                  <button 
                    key={story.id}
                    onClick={() => setActiveSession(story)}
                    className="group relative bg-white rounded-[32px] sm:rounded-[40px] overflow-hidden border border-stone-50 shadow-xl transition-all duration-700 hover:shadow-2xl text-left"
                  >
                    <div className="h-56 sm:h-64 overflow-hidden relative">
                       <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={story.title} />
                       <div className="absolute inset-0 bg-indigo-900/10 mix-blend-multiply"></div>
                       <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-stone-900/80 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                          {story.duration}
                       </div>
                    </div>
                    <div className="p-8 sm:p-10 space-y-3">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Night Whisper</p>
                       <h3 className="text-2xl sm:text-3xl font-black serif text-stone-900">{story.title}</h3>
                       <p className="text-stone-400 serif italic text-sm sm:text-base leading-relaxed">{story.description}</p>
                    </div>
                  </button>
                ))}
             </div>

             <div className="pt-12 space-y-10 border-t border-stone-100 pt-16">
                <div className="space-y-4 text-center sm:text-left">
                   <h2 className="text-3xl sm:text-4xl font-black serif text-stone-900">{t.mixer_title}</h2>
                   <p className="text-stone-400 serif italic text-base sm:text-lg leading-relaxed">Architect your perfect acoustic sanctuary with layered ambient sounds. Combine elements of nature and ethereal textures to create a unique meditation background.</p>
                </div>
                <SoundMixer />
             </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-14 animate-in fade-in duration-500">
             <div className="space-y-8 text-center">
                <h2 className="text-5xl sm:text-6xl font-black text-stone-900 uppercase tracking-tighter leading-none">Breath Mastery</h2>
                <p className="text-stone-500 text-base sm:text-lg serif italic leading-relaxed px-4">
                  {t.breath_subtitle} Each breathing exercise is optimized to help you regulate your nervous system and find calm in moments of turbulence.
                </p>
                <BreathingExercise lang={lang} />
             </div>

             <div className="space-y-10 pt-10 border-t border-stone-100">
                <h2 className="text-4xl sm:text-6xl font-black text-stone-900 uppercase tracking-tighter leading-none text-center sm:text-left">{t.header_guide}</h2>
                <div className="space-y-12">
                   {[1, 2, 3].map(i => {
                     const videoIds = ['inpok4MKVLM', 'vS5tV4-3q5M', 'm8rRzTtP7Tc'];
                     return (
                       <div key={i} className="bg-white rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-2xl border border-stone-50 group transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)]">
                          <div className="h-[240px] sm:h-[320px] overflow-hidden">
                            <img src={i === 1 ? 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800' : i === 2 ? 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800' : 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={`Stage ${i}`} />
                          </div>
                          <div className="p-8 sm:p-12 space-y-6">
                             <h3 className="text-3xl sm:text-4xl font-black serif text-stone-900 leading-tight">{t[`guide_s${i}_title`]}</h3>
                             <p className="text-base sm:text-lg text-stone-500 serif leading-relaxed italic opacity-80">{t[`guide_s${i}_desc`]}</p>
                             <button onClick={() => setSelectedVideo(videoIds[i-1])} className="bg-stone-950 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-black text-[10px] sm:text-[11px] uppercase tracking-widest flex items-center justify-center space-x-4 active:scale-95 transition-all w-full sm:w-auto">
                               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                               <span>Watch Guide</span>
                             </button>
                          </div>
                       </div>
                     );
                   })}
                </div>
             </div>
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end space-y-6 sm:space-y-0">
                <div className="space-y-2 max-w-xl">
                   <h2 className="text-5xl sm:text-6xl font-black serif text-stone-900">{t.header_journal}</h2>
                   <p className="text-stone-400 serif italic text-base sm:text-lg">Document your mindfulness journey and track the shifts in your inner landscape.</p>
                </div>
                <a href="/icon1.apk" download className="group flex items-center space-x-3 sm:flex-col sm:items-center sm:space-x-0 sm:space-y-1 mb-2 bg-stone-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none w-full sm:w-auto">
                   <div className="p-3 bg-emerald-500 text-white rounded-xl sm:rounded-2xl shadow-lg active:scale-95 transition-all">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                   </div>
                   <span className="text-[9px] sm:text-[8px] font-black uppercase tracking-widest text-stone-500 sm:text-stone-400">{t.apk_download}</span>
                </a>
             </div>

             <AIChatbox lang={lang} />
             
             <div className="bg-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 border border-stone-50 shadow-sm space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl sm:text-2xl font-black serif text-stone-900">{t.lucky_title}</h3>
                  <button onClick={refreshLuckyNumbers} className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span>{t.lucky_refresh}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {luckyNumbers.map((n, idx) => (
                    <div key={idx} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-lg ${idx === 6 ? 'bg-gradient-to-br from-rose-500 to-pink-500' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
                      {n}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] sm:text-[10px] font-black text-stone-300 uppercase tracking-[0.4em] text-center">{t.lucky_sync}</p>
             </div>

             <div className="bg-white rounded-[32px] sm:rounded-[48px] p-8 sm:p-12 border border-stone-50 shadow-sm space-y-8">
                <textarea value={newJournalText} onChange={(e) => setNewJournalText(e.target.value)} className="w-full bg-stone-50/50 border-none rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 text-stone-800 focus:ring-0 min-h-[250px] sm:min-h-[350px] text-lg sm:text-2xl serif" placeholder={t.journal_placeholder} />
                <button onClick={async () => {
                  if (!newJournalText.trim()) return;
                  setIsSavingJournal(true);
                  await new Promise(r => setTimeout(r, 1200));
                  const updated = [{id: Date.now().toString(), text: newJournalText, date: new Date().toLocaleDateString(), mood: 'Balanced'}, ...journals];
                  setJournals(updated);
                  localStorage.setItem('calmrelax_journals', JSON.stringify(updated));
                  setNewJournalText('');
                  setIsSavingJournal(false);
                  setSaveStatus('success');
                  setTimeout(() => setSaveStatus('idle'), 2500);
                }} className={`w-full py-5 sm:py-6 rounded-[24px] sm:rounded-[32px] font-black text-xs sm:text-sm shadow-2xl active:scale-95 transition-all ${saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-stone-900 text-white'}`}>
                  {isSavingJournal ? 'CAPTURING...' : saveStatus === 'success' ? 'REFLECTION CAPTURED' : t.journal_save}
                </button>
             </div>
          </div>
        )}

        {(view === 'admin' || view === 'profile') && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="bg-white rounded-[32px] sm:rounded-[48px] p-8 sm:p-12 border border-stone-50 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-center sm:space-x-10 mb-12 sm:mb-20 space-y-6 sm:space-y-0">
                   <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-4xl sm:text-5xl font-black shadow-2xl">
                      {user.name[0]}
                   </div>
                   <div className="text-center sm:text-left w-full overflow-hidden">
                      <h3 className="text-3xl sm:text-4xl font-black serif text-stone-900 break-words">{user.name}</h3>
                      <p className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-stone-300 mt-1 truncate">{user.email}</p>
                      {user.email === ADMIN_EMAIL && (
                        <div className="mt-4 sm:mt-2 inline-block px-4 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Sanctuary Administrator</div>
                      )}
                   </div>
                </div>

                {view === 'admin' && (
                  user.email === ADMIN_EMAIL ? (
                    <div className="mb-20 space-y-10">
                      <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-emerald-600 mb-8">{t.login_history}</h4>
                      <div className="bg-stone-50 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 max-h-[500px] overflow-y-auto space-y-6 border border-stone-100 shadow-inner">
                         {loginHistory.map((log, idx) => (
                           <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[12px] border-b border-stone-200 pb-5 last:border-0 last:pb-0 transition-all hover:bg-stone-100/50 rounded-xl p-3 space-y-2 sm:space-y-0">
                              <div className="min-w-0 w-full"><p className="font-bold text-stone-900 truncate">{log.email}</p><p className="text-stone-400 font-semibold">{log.timestamp}</p></div>
                              <div className="text-left sm:text-right w-full shrink-0"><p className="text-emerald-600 font-black uppercase tracking-widest">{log.location}</p><p className="text-[10px] text-stone-300">{log.device}</p></div>
                           </div>
                         ))}
                         {loginHistory.length === 0 && <p className="text-center text-stone-300 py-10 italic serif text-lg">No records in the database.</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-20 p-10 bg-rose-50 rounded-[32px] border border-rose-100 text-center animate-pulse">
                      <p className="text-rose-500 font-black uppercase tracking-[0.5em] text-xs">Sanctuary Access Denied</p>
                    </div>
                  )
                )}
                <button onClick={() => { localStorage.removeItem('calmrelax_active_user'); setIsLoggedIn(false); setView('today'); }} className="w-full py-5 sm:py-6 rounded-[24px] sm:rounded-[32px] border-2 border-stone-100 text-stone-300 font-black uppercase text-[10px] sm:text-[12px] tracking-[0.6em] hover:bg-stone-50 hover:text-stone-900 transition-all">TERMINATE SESSION</button>
             </div>
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;