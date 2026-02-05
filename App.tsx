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
      // Trigger Advertisement on EVERY tab change as requested
      setPendingView(newView);
      setIsShowingAd(true);
    }
  };

  const finalizeViewChange = () => {
    if (pendingView) setView(pendingView);
    setIsShowingAd(false);
    setPendingView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const initiateSocialLogin = (provider: 'Google' | 'Facebook') => {
    setPendingProvider(provider);
    setShowSocialMock(true);
    setAuthError(null);
    setSocialEmail('');
    setSocialName('');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const finalizeLogin = async (provider: 'Email' | 'Google' | 'Facebook' = 'Email') => {
    setAuthError(null);
    setIsAuthenticating(true);
    
    const finalEmail = provider === 'Email' ? inputEmail.trim().toLowerCase() : socialEmail.trim().toLowerCase();
    const finalName = provider === 'Email' ? (inputName || finalEmail.split('@')[0]) : (socialName || finalEmail.split('@')[0]);

    // Mandatory Security Protocol: No blank or invalid emails
    if (!finalEmail) {
      setAuthError(t.error_empty);
      setIsAuthenticating(false);
      return;
    }

    if (!isValidEmail(finalEmail)) {
      setAuthError(t.error_email);
      setIsAuthenticating(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const newRecord: LoginRecord = {
      email: finalEmail,
      timestamp: new Date().toLocaleString(),
      location: "Sanctuary Access",
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
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Secure Protocol Requested</p>
              </div>
              <div className="space-y-4 mb-10">
                <input type="email" value={socialEmail} onChange={(e) => setSocialEmail(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:border-emerald-200" placeholder="Verify Email Address" />
                <input type="text" value={socialName} onChange={(e) => setSocialName(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:border-emerald-200" placeholder="Verify Display Name" />
              </div>
              <button 
                onClick={() => {
                  if (!isValidEmail(socialEmail)) {
                    alert(t.error_email);
                    return;
                  }
                  setShowSocialMock(false); 
                  setShowPermissionDialog(true); 
                }} 
                className="w-full bg-stone-900 text-white py-4.5 rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Continue Verification
              </button>
            </div>
          </div>
        )}

        <PermissionDialog isOpen={showPermissionDialog} provider={pendingProvider || 'Google'} lang={lang} onAllow={() => { setShowPermissionDialog(false); finalizeLogin(pendingProvider!); }} onCancel={() => setShowPermissionDialog(false)} />

        <div className="flex bg-stone-50 p-1.5 rounded-full mb-16 border border-stone-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
          {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
            <button key={l} onClick={() => setLang(l)} className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-white text-stone-900 shadow-md' : 'text-stone-300'}`}>
              {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简体' : '繁體'}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center mb-12 text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-black serif text-stone-900 mb-8 tracking-tighter">CalmRelaxFlow</h1>
          <div className="w-20 h-20 bg-emerald-500 rounded-[30px] flex items-center justify-center text-white shadow-2xl zen-card-glow mb-10">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h2 className="text-4xl font-black text-stone-900 mb-2 serif leading-tight">{isRegistering ? t.register_title : t.login_title}</h2>
          <p className="text-stone-400 serif italic text-sm">{isRegistering ? t.sanctuary_join : t.sanctuary_return}</p>
        </div>

        <div className="w-full max-w-sm bg-stone-100/50 rounded-[48px] p-8 border border-stone-200/40 shadow-inner space-y-7 mb-10">
          {authError && (
             <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">
               {authError}
             </div>
          )}
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">{t.name_label}</label>
              <input type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} className="w-full bg-white/80 border border-stone-200 rounded-2xl px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-emerald-500/20" placeholder="Full Name" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">{t.email_label}</label>
            <input type="email" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className="w-full bg-white/80 border border-stone-200 rounded-2xl px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-emerald-500/20" placeholder="example@email.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">{t.password_label}</label>
            <input type="password" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} className="w-full bg-white/80 border border-stone-200 rounded-2xl px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-emerald-500/20" placeholder="••••••••" />
          </div>
          <button onClick={() => finalizeLogin('Email')} className="w-full bg-stone-900 text-white py-5 rounded-full font-black text-[13px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-6">
            {isAuthenticating ? t.authenticating : isRegistering ? t.register_btn : t.login_btn}
          </button>
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} className="w-full text-center text-[10px] font-black text-stone-400 uppercase tracking-widest pt-2 hover:text-stone-800 transition-colors">
            {isRegistering ? t.switch_to_login : t.switch_to_register}
          </button>
        </div>

        <div className="w-full max-w-sm bg-white rounded-[48px] p-8 shadow-2xl border border-stone-50 space-y-5">
          <p className="text-center text-[9px] font-black text-stone-300 uppercase tracking-[0.4em] mb-2">{t.one_tap}</p>
          <button onClick={() => initiateSocialLogin('Google')} className="w-full py-4.5 bg-white border border-stone-100 rounded-2xl flex items-center justify-center space-x-4 shadow-sm active:scale-98 transition-all hover:bg-stone-50">
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="google" />
            <span className="text-[11px] font-black text-stone-700 uppercase tracking-widest">{t.social_google}</span>
          </button>
          <button onClick={() => initiateSocialLogin('Facebook')} className="w-full py-4.5 bg-[#1877F2] rounded-2xl flex items-center justify-center space-x-4 shadow-lg active:scale-98 transition-all hover:bg-[#166fe5]">
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{t.social_facebook}</span>
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
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="text-center py-6">
              <h1 className="text-5xl sm:text-7xl font-black serif text-stone-900 tracking-tighter mb-3 leading-tight">CalmRelaxFlow</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-400">High-Fidelity Sanctuary</p>
            </div>
            
            <div className="flex justify-between items-center bg-white p-8 rounded-[32px] shadow-sm border border-stone-50">
               <div>
                  <h2 className="text-3xl font-black serif text-stone-900 leading-tight">{user.name}</h2>
                  <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] mt-2">Deep Awareness: {user.streak} Days</p>
               </div>
               <div className="w-20 h-20 rounded-full flex items-center justify-center relative">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <span className="text-lg font-black text-stone-800 z-10">{progressPercent}%</span>
               </div>
            </div>

            <div className="bg-stone-950 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden group">
               <p className="text-2xl sm:text-4xl serif italic leading-tight text-white/95 mb-14">"{zenQuote}"</p>
               <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                 <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-900 px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Enter Silence</button>
                 <button onClick={() => handleViewChange('library')} className="bg-white/10 text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest backdrop-blur-md hover:bg-white/20 transition-all">The Sanctum</button>
               </div>
            </div>
            <AdSlot />
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {MEDITATION_SESSIONS.map(session => (
                  <button key={session.id} onClick={() => setActiveSession(session)} className="group relative bg-white rounded-[32px] overflow-hidden border border-stone-50 shadow-xl transition-all duration-700 text-left hover:shadow-2xl">
                    <div className="h-56 overflow-hidden relative">
                       <img src={session.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={session.title} />
                       <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-900">
                          {session.duration}
                       </div>
                    </div>
                    <div className="p-8 space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">{session.category}</p>
                       <h3 className="text-2xl font-black serif text-stone-900">{session.title}</h3>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {SLEEP_STORIES.map(story => (
                  <button key={story.id} onClick={() => setActiveSession(story)} className="group bg-white rounded-[32px] overflow-hidden border border-stone-50 shadow-xl text-left">
                    <div className="h-56 overflow-hidden relative">
                       <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={story.title} />
                       <div className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white">
                          {story.duration}
                       </div>
                    </div>
                    <div className="p-8 space-y-3">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Night Whisper</p>
                       <h3 className="text-2xl font-black serif text-stone-900">{story.title}</h3>
                    </div>
                  </button>
                ))}
             </div>
             <SoundMixer />
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-14 animate-in fade-in duration-500">
             <BreathingExercise lang={lang} />
             
             {/* Restored 3 Stages of Breath Guides */}
             <div className="space-y-10 pt-10 border-t border-stone-100">
                <h2 className="text-4xl font-black text-stone-900 uppercase tracking-tighter text-center">{t.header_guide}</h2>
                <div className="space-y-12">
                   {[1, 2, 3].map(i => {
                     const videoIds = ['inpok4MKVLM', 'O-6f5wQXSu8', 'm8rRzTtP7Tc'];
                     const images = [
                       'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800',
                       'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
                       'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800'
                     ];
                     return (
                       <div key={i} className="bg-white rounded-[48px] overflow-hidden shadow-2xl border border-stone-50 group transition-all duration-700 hover:shadow-emerald-500/5">
                          <div className="h-[240px] overflow-hidden">
                            <img src={images[i-1]} className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-105" alt={`Stage ${i}`} />
                          </div>
                          <div className="p-8 space-y-6">
                             <h3 className="text-3xl font-black serif text-stone-900">{t[`guide_s${i}_title`]}</h3>
                             <p className="text-stone-500 serif italic leading-relaxed">{t[`guide_s${i}_desc`]}</p>
                             <button onClick={() => setSelectedVideo(videoIds[i-1])} className="bg-stone-950 text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center space-x-4 active:scale-95 transition-all hover:bg-emerald-600">
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
             <AIChatbox lang={lang} />
             <div className="bg-white rounded-[32px] p-8 border border-stone-50 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black serif text-stone-900">{t.lucky_title}</h3>
                  <button onClick={refreshLuckyNumbers} className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-700 transition-colors">Refresh</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {luckyNumbers.map((n, idx) => (
                    <div key={idx} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs bg-emerald-500 shadow-md">
                      {n}
                    </div>
                  ))}
                </div>
             </div>
             <div className="bg-white rounded-[48px] p-8 border border-stone-50 shadow-sm space-y-8">
                <textarea value={newJournalText} onChange={(e) => setNewJournalText(e.target.value)} className="w-full bg-stone-50/50 border-none rounded-[32px] p-10 text-stone-800 outline-none min-h-[300px] text-lg serif leading-relaxed" placeholder={t.journal_placeholder} />
                <button onClick={async () => {
                  if (!newJournalText.trim()) return;
                  setIsSavingJournal(true);
                  await new Promise(r => setTimeout(r, 1200));
                  setNewJournalText('');
                  setIsSavingJournal(false);
                  setSaveStatus('success');
                  setTimeout(() => setSaveStatus('idle'), 2500);
                }} className="w-full py-6 bg-stone-900 text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                  {isSavingJournal ? 'Capturing...' : saveStatus === 'success' ? 'Reflection Captured' : t.journal_save}
                </button>
             </div>
             
             {/* APK Download Button anchored at bottom of Journal tab */}
             <div className="pt-6">
               <a href="/icon1.apk" download className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 rounded-[32px] font-black text-[13px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-4">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                 <span>{t.apk_download}</span>
               </a>
               <p className="text-center mt-4 text-[9px] font-black text-stone-300 uppercase tracking-widest">Architectural Package Node V1.3.0</p>
             </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="bg-white rounded-[48px] p-10 shadow-xl border border-stone-50">
               <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black serif text-stone-900">{t.db_status}</h2>
                 <div className="flex space-x-4">
                    <button onClick={() => { localStorage.removeItem('calmrelax_login_db'); setLoginHistory([]); }} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors">Clear Data</button>
                 </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-stone-100">
                       <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-stone-400">{t.email_label}</th>
                       <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-stone-400">{t.timestamp}</th>
                       <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Node</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-50">
                     {loginHistory.map((record, i) => (
                       <tr key={i} className="group hover:bg-stone-50 transition-colors">
                         <td className="py-5 text-sm font-bold text-stone-800">{record.email}</td>
                         <td className="py-5 text-[11px] font-medium text-stone-400">{record.timestamp}</td>
                         <td className="py-5">
                           <span className="text-[9px] font-black uppercase px-2 py-1 bg-stone-100 rounded-md text-stone-500">{record.device}</span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {loginHistory.length === 0 && <p className="text-center py-20 text-stone-300 serif italic">{t.no_records}</p>}
               </div>
             </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="bg-white rounded-[48px] p-12 border border-stone-50 shadow-sm">
                <div className="flex items-center space-x-10 mb-20">
                   <div className="w-24 h-24 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-4xl font-black shadow-xl">
                      {user.name[0]}
                   </div>
                   <div>
                      <h3 className="text-3xl font-black serif text-stone-900">{user.name}</h3>
                      <p className="text-[12px] font-black uppercase tracking-widest text-stone-300 mt-1">{user.email}</p>
                   </div>
                </div>
                <button onClick={() => { localStorage.removeItem('calmrelax_active_user'); setIsLoggedIn(false); setView('today'); }} className="w-full py-6 rounded-[32px] border-2 border-stone-100 text-stone-300 font-black uppercase text-[12px] tracking-[0.6em] hover:bg-stone-50 hover:text-stone-900 transition-all active:scale-95">Terminate Session</button>
             </div>
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;