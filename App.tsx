
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
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES } from './constants';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en'); 
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [zenQuote, setZenQuote] = useState<string>(STATIC_QUOTES[2]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [newJournalText, setNewJournalText] = useState('');
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);

  // Auth & Permission States
  const [isRegistering, setIsRegistering] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<'Google' | 'Facebook' | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Interstitial Ad States
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);

  // Journal UI States
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const t = useMemo(() => translations[lang] || translations['en'], [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('calmrelax_active_user');
    const savedLang = localStorage.getItem('calmrelax_lang');
    const savedJournals = localStorage.getItem('calmrelax_journals');
    const savedLogins = localStorage.getItem('calmrelax_login_db');
    
    if (savedLang) setLang(savedLang as Language);
    if (savedJournals) setJournals(JSON.parse(savedJournals));
    if (savedLogins) setLoginHistory(JSON.parse(savedLogins));
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.isLoggedIn) {
        setUser(parsed);
        setIsLoggedIn(true);
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
    if (newView !== view) {
      setPendingView(newView);
      setIsShowingAd(true);
    }
  };

  const finalizeViewChange = () => {
    if (pendingView) {
      setView(pendingView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsShowingAd(false);
    setPendingView(null);
  };

  const initiateSocialLogin = (provider: 'Google' | 'Facebook') => {
    setPendingProvider(provider);
    setShowPermissionDialog(true);
  };

  const handlePermissionGranted = () => {
    setShowPermissionDialog(false);
    if (pendingProvider) {
      finalizeLogin(pendingProvider);
    }
  };

  const finalizeLogin = async (provider: 'Email' | 'Google' | 'Facebook' = 'Email') => {
    if (provider === 'Email' && !inputEmail.trim()) {
      setAuthError("Username or Email is required.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    
    await new Promise(resolve => setTimeout(resolve, 2200));

    const email = inputEmail.trim().toLowerCase() || `user_${Math.floor(Math.random()*1000)}@${provider.toLowerCase()}.com`;
    const isAdmin = email === 'vvkkoo4816@gmail.com';

    let locationStr = "Unknown Location";
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        locationStr = `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
      }
    } catch (e) {
      console.warn("Location tracking refused or unavailable.");
    }

    const newRecord: LoginRecord = {
      email,
      timestamp: new Date().toLocaleString(),
      location: locationStr
    };

    const updatedLogins = [newRecord, ...loginHistory].slice(0, 50);
    setLoginHistory(updatedLogins);
    localStorage.setItem('calmrelax_login_db', JSON.stringify(updatedLogins));
    
    const mockUser: User = {
      id: `${provider.toLowerCase()}-${Date.now()}`,
      name: isAdmin ? "Zen Master" : (inputName || email.split('@')[0] || "Zen Seeker"),
      email: email,
      photoUrl: provider === 'Google' 
        ? 'https://lh3.googleusercontent.com/a/default-user=s120-c' 
        : `https://ui-avatars.com/api/?name=${email}&background=10b981&color=fff`,
      isLoggedIn: true,
      streak: 1,
      minutesMeditated: 0,
      role: isAdmin ? 'admin' : 'user',
      isPremium: true
    };

    setUser(mockUser);
    setIsLoggedIn(true);
    setIsAuthenticating(false);
    setPendingProvider(null);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setIsRegistering(false);
    localStorage.removeItem('calmrelax_active_user');
    setView('today');
  };

  const saveJournal = async () => {
    if (!newJournalText.trim()) return;
    
    setIsSavingJournal(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      text: newJournalText,
      mood: 'Neutral'
    };
    const updated = [newEntry, ...journals];
    setJournals(updated);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updated));
    setNewJournalText('');
    setIsSavingJournal(false);
    setSaveStatus('success');
    
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleDownloadApk = () => {
    const link = document.createElement('a');
    link.href = '/icon1.apk';
    link.download = 'icon1.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setMoodFromEmoji = (emoji: string) => {
    handleViewChange('journal');
  };

  const getBallColor = (index: number) => {
    if (index % 3 === 0) return 'bg-[#e11d48] shadow-[#e11d48]/50';
    if (index % 3 === 1) return 'bg-[#2563eb] shadow-[#2563eb]/50';
    return 'bg-[#10b981] shadow-[#10b981]/50';
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center pt-12 px-6 relative overflow-x-hidden">
        <PermissionDialog 
          isOpen={showPermissionDialog} 
          provider={pendingProvider || 'Google'} 
          lang={lang} 
          onAllow={handlePermissionGranted} 
          onCancel={() => setShowPermissionDialog(false)} 
        />

        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="flex space-x-1 bg-stone-100/50 backdrop-blur-xl p-1 rounded-full border border-stone-200/50 z-50">
            {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
              <button key={l} onClick={() => changeLanguage(l)} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>
                {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简体' : '繁體'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 mt-12 animate-in zoom-in duration-700">
          <div className="w-20 h-20 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white shadow-2xl zen-card-glow">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
        </div>

        <h1 className="text-4xl font-black text-stone-900 mb-2 serif">{isRegistering ? 'Create Account' : 'Sign in'}</h1>
        <p className="text-stone-400 text-sm mb-10 serif italic">Return to your inner sanctuary.</p>

        <div className="w-full max-w-sm bg-stone-200/50 rounded-[40px] p-8 flex flex-col items-center shadow-inner border border-stone-300/30">
           <div className="w-full space-y-4 mb-6">
              {isRegistering && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[11px] font-bold text-stone-600 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full bg-stone-100/30 border border-stone-400/50 rounded-xl px-4 py-3.5 text-stone-800 font-medium focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Zen Soul"
                  />
                </div>
              )}
              <div className="space-y-1">
                 <label className="text-[11px] font-bold text-stone-600 ml-1">Username / Email</label>
                 <input 
                   type="text" 
                   value={inputEmail}
                   onChange={(e) => setInputEmail(e.target.value)}
                   className="w-full bg-stone-100/30 border border-stone-400/50 rounded-xl px-4 py-3.5 text-stone-800 font-medium focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                   placeholder="Enter username"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-bold text-stone-600 ml-1">Password</label>
                 <input 
                   type="password" 
                   value={inputPassword}
                   onChange={(e) => setInputPassword(e.target.value)}
                   className="w-full bg-stone-100/30 border border-stone-400/50 rounded-xl px-4 py-3.5 text-stone-800 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                   placeholder="••••••••"
                 />
              </div>
              
              {authError && <p className="text-[10px] text-rose-500 font-bold ml-1">{authError}</p>}

              {!isRegistering && (
                <div className="flex justify-end">
                  <button className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors">Forgot Access?</button>
                </div>
              )}
           </div>

           <button 
             onClick={() => finalizeLogin('Email')}
             disabled={isAuthenticating}
             className="w-full bg-stone-900 text-white py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all mb-4 flex items-center justify-center"
           >
             {isAuthenticating ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               isRegistering ? 'Create Profile' : 'Enter Now'
             )}
           </button>

           <button 
             onClick={() => setIsRegistering(!isRegistering)}
             className="text-[12px] font-black text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest"
           >
             {isRegistering ? 'Back to sign in' : 'New Seeker? Create Profile'}
           </button>
        </div>

        <div className="mt-auto mb-10 w-full max-w-sm px-4">
          <div className="bg-white rounded-[40px] shadow-2xl border border-stone-100 p-8 flex flex-col space-y-4 animate-in slide-in-from-bottom-10 duration-1000">
             <div className="text-center mb-2">
               <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.4em]">One-Tap Entrance</p>
             </div>

             <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => initiateSocialLogin('Google')} 
                  disabled={isAuthenticating}
                  className="w-full py-4 bg-white border-2 border-stone-50 rounded-2xl flex items-center justify-center space-x-3 hover:bg-stone-50 transition-all shadow-sm active:scale-98"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="google" />
                  <span className="text-[13px] font-black text-stone-700 uppercase tracking-widest">{t.sign_in_google}</span>
                </button>
                <button 
                  onClick={() => initiateSocialLogin('Facebook')} 
                  disabled={isAuthenticating}
                  className="w-full bg-[#1877F2] py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-[#166fe5] transition-all shadow-lg active:scale-98"
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span className="text-[13px] font-black text-white uppercase tracking-widest">{t.sign_in_facebook}</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <ZenAdInterstitial isVisible={isShowingAd} onComplete={finalizeViewChange} lang={lang} pendingView={pendingView} />
      
      <div className="max-w-3xl mx-auto pb-64 space-y-12">
        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Prominent App Branding */}
            <div className="relative text-center py-6">
              <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full"></div>
              <h1 className="text-6xl font-black serif text-stone-900 tracking-tighter mb-2 relative">CalmRelaxFlow</h1>
              <div className="flex items-center justify-center space-x-3 opacity-60">
                 <div className="h-[1px] w-8 bg-stone-300"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Your Inner Sanctuary</p>
                 <div className="h-[1px] w-8 bg-stone-300"></div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-stone-50">
               <div>
                  <div className="flex items-center space-x-2 mb-1">
                     <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-200">{t.status_zen_master} • LV 49</span>
                     <span className="text-stone-300 text-[10px] font-black uppercase">{t.welcome_back}</span>
                  </div>
                  <h2 className="text-4xl font-black serif text-stone-900">{user.name}</h2>
               </div>
               <div className="w-16 h-16 rounded-full border-4 border-emerald-50 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin duration-[4s]"></div>
                  <span className="text-sm font-black text-stone-800">0%</span>
               </div>
            </div>

            <div className="bg-stone-950 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-8 left-8 flex space-x-2">
                 <div className="w-6 h-6 bg-emerald-500 rounded-full opacity-50 blur-sm"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">{t.traditional_wisdom}</span>
               </div>
               <div className="mt-8 mb-12">
                 <p className="text-3xl md:text-4xl serif italic leading-tight text-white/95">
                   "{zenQuote}"
                 </p>
               </div>
               <div className="flex space-x-4">
                 <button 
                  onClick={() => setActiveSession(DAILY_MEDITATION)}
                  className="bg-white text-stone-900 px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                 >
                   {t.enter_silence}
                 </button>
                 <button 
                  onClick={() => handleViewChange('library')}
                  className="bg-white/10 text-white px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all backdrop-blur-md"
                 >
                   {t.the_sanctum}
                 </button>
               </div>
            </div>

            <div className="bg-white rounded-[40px] p-10 border border-stone-50 shadow-sm text-center space-y-8">
               <h3 className="text-2xl font-black serif text-stone-900">{t.tune_vibration}</h3>
               <div className="flex justify-around items-center">
                  {['✨', '🧘', '☁️', '🌠', '🌑'].map((emoji, i) => (
                    <button 
                      key={i} 
                      onClick={() => setMoodFromEmoji(emoji)}
                      className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-2xl grayscale hover:grayscale-0 hover:bg-emerald-50 cursor-pointer transition-all border border-stone-100/50 hover:scale-110 active:scale-90 shadow-sm"
                    >
                      {emoji}
                    </button>
                  ))}
               </div>
            </div>
            
            <AdSlot />
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <h2 className="text-5xl font-black serif text-stone-900 mb-2">{t.header_vault}</h2>
              <p className="text-stone-400 serif italic">{t.vault_subtitle}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {MEDITATION_SESSIONS.map(session => (
                <button key={session.id} onClick={() => setActiveSession(session)} className="group relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-xl text-left active:scale-95 transition-all">
                   <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={session.title} />
                   <div className="absolute inset-0 bg-stone-950/40 group-hover:bg-stone-950/20 transition-all"></div>
                   <div className="absolute top-4 left-4">
                     <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-white/10">{session.category}</span>
                   </div>
                   <div className="absolute bottom-6 left-6 right-6">
                     <h4 className="text-xl font-black serif text-white leading-tight mb-1">{session.title}</h4>
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{session.duration}</p>
                   </div>
                </button>
              ))}
            </div>

            <section className="pt-10 space-y-8 border-t border-stone-100">
               <div>
                 <h3 className="text-3xl font-black serif text-stone-900">{t.mixer_title}</h3>
               </div>
               <SoundMixer />
            </section>
            
            <AdSlot />
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <h2 className="text-5xl font-black serif text-stone-900">{t.header_sleep}</h2>
             <p className="text-stone-400 serif italic -mt-6 mb-4">{t.vault_subtitle_sleep || "Drift into stillness with soothing narratives."}</p>
             <div className="grid grid-cols-1 gap-6">
               {SLEEP_STORIES.map(story => (
                 <button key={story.id} onClick={() => setActiveSession(story)} className="w-full bg-white p-6 rounded-[40px] border border-stone-50 shadow-sm hover:shadow-xl transition-all flex items-center space-x-8 group active:scale-98">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg shrink-0">
                       <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={story.title} />
                    </div>
                    <div className="text-left flex-1">
                       <h4 className="text-2xl font-black serif text-stone-900 mb-1">{story.title}</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">{story.duration}</p>
                       {story.description && <p className="text-[11px] text-stone-400 serif italic leading-tight">{story.description}</p>}
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                 </button>
               ))}
             </div>
             <AdSlot />
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <h2 className="text-5xl font-black serif text-stone-900">{t.header_journal}</h2>

             <AIChatbox lang={lang} />

             <div className="bg-white rounded-[40px] p-10 border border-stone-50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-3xl font-black serif text-stone-800 leading-none">{t.lucky_title}</h3>
                 <button onClick={generateLuckyNumbers} className="flex items-center space-x-2 bg-white border border-stone-100 text-emerald-500 hover:text-emerald-600 px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                   <span className="text-[10px] font-black uppercase tracking-widest">{t.lucky_refresh}</span>
                 </button>
               </div>
               
               <div className="flex items-center space-x-4 mb-8">
                  {luckyNumbers.slice(0, 6).map((n, i) => (
                    <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shadow-xl transform transition-all duration-300 hover:scale-110 ${getBallColor(i)}`}>
                       {n}
                    </div>
                  ))}
                  <span className="text-stone-200 font-light text-3xl mx-1">+</span>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shadow-xl transform transition-all duration-300 hover:scale-110 ${getBallColor(6)}`}>
                     {luckyNumbers[6]}
                  </div>
               </div>
               <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.4em]">{t.lucky_sync}</p>
             </div>

             <div className="bg-white rounded-[40px] p-10 border border-stone-50 shadow-sm space-y-8">
                <textarea 
                  value={newJournalText}
                  onChange={(e) => setNewJournalText(e.target.value)}
                  className="w-full bg-stone-50/50 border-none rounded-[32px] p-8 text-stone-800 font-medium placeholder:italic placeholder:text-stone-300 focus:ring-0 min-h-[350px] resize-none text-2xl leading-relaxed serif"
                  placeholder={t.journal_placeholder}
                />
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={saveJournal} 
                    disabled={isSavingJournal || saveStatus === 'success'}
                    className={`flex-1 flex items-center justify-center space-x-3 py-6 rounded-[28px] font-black text-base shadow-2xl active:scale-95 transition-all ${saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-stone-950 text-white'}`}
                  >
                    {isSavingJournal ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         <span>Reflecting...</span>
                       </>
                    ) : saveStatus === 'success' ? (
                       <span>Captured ✨</span>
                    ) : (
                       <span>{t.journal_save}</span>
                    )}
                  </button>
                  <button 
                    onClick={handleDownloadApk}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-400 border border-stone-100 shadow-lg active:scale-90 transition-transform hover:text-emerald-500"
                    title="Download icon1.apk"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </button>
                </div>
             </div>
             <AdSlot />
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="space-y-6">
                <h2 className="text-7xl font-black text-stone-900 uppercase tracking-tighter leading-none">{t.header_breath}</h2>
             </div>

             <BreathingExercise lang={lang} />
             
             <div className="space-y-10 pt-10">
                <div>
                   <h2 className="text-5xl font-black serif text-stone-900 mb-2">{t.header_guide}</h2>
                   <p className="text-stone-400 serif italic">{t.breath_subtitle}</p>
                </div>

                <div className="space-y-12">
                   <GuideCard 
                      title={t.guide_s1_title} 
                      desc={t.guide_s1_desc} 
                      img="https://images.unsplash.com/photo-1514371879740-2e7d2068f502?auto=format&fit=crop&q=80&w=800"
                      label={t.watch_guide}
                   />
                   <GuideCard 
                      title={t.guide_s2_title} 
                      desc={t.guide_s2_desc} 
                      img="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800"
                      label={t.watch_guide}
                   />
                   <GuideCard 
                      title={t.guide_s3_title} 
                      desc={t.guide_s3_desc} 
                      img="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800"
                      label={t.watch_guide}
                   />
                </div>
             </div>
             <AdSlot />
          </div>
        )}

        {(view === 'admin' || view === 'profile') && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-white rounded-[40px] p-10 border border-stone-50 shadow-sm text-center">
                <h2 className="text-4xl font-black serif text-stone-900 mb-12">{t.db_status}</h2>
                
                {user.email === 'vvkkoo4816@gmail.com' && (
                  <div className="mb-12 p-6 bg-stone-50 rounded-[32px] border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">{t.login_history}</h4>
                    <div className="max-h-60 overflow-y-auto space-y-3 px-2">
                      {loginHistory.length > 0 ? loginHistory.map((log, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl text-left border border-stone-100 shadow-sm flex justify-between items-center group transition-all hover:border-emerald-200">
                           <div>
                              <p className="text-[10px] font-black text-stone-900">{log.email}</p>
                              <p className="text-[8px] text-stone-400 uppercase tracking-widest">{log.timestamp}</p>
                           </div>
                           <div className="text-right">
                              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{log.location}</span>
                           </div>
                        </div>
                      )) : (
                        <p className="text-stone-300 text-[10px] font-black uppercase italic py-10">{t.no_records}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-12 p-6 bg-stone-50 rounded-[32px] border border-stone-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">Language / 語言 / 语言</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => changeLanguage('en')} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${lang === 'en' ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}>{t.lang_en}</button>
                    <button onClick={() => changeLanguage('zh-Hans')} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${lang === 'zh-Hans' ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}>{t.lang_hans}</button>
                    <button onClick={() => changeLanguage('zh-Hant')} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${lang === 'zh-Hant' ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}>{t.lang_hant}</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-12">
                   <div className="bg-stone-50 p-6 rounded-3xl text-center">
                      <span className="block text-[10px] font-black uppercase text-stone-400 mb-2">Release Candidate</span>
                      <span className="text-2xl font-black serif">v1.0.0</span>
                   </div>
                   <div className="bg-emerald-50 p-6 rounded-3xl text-center">
                      <span className="block text-[10px] font-black uppercase text-emerald-400 mb-2">Build Status</span>
                      <span className="text-2xl font-black serif text-emerald-600">Stable</span>
                   </div>
                </div>
                
                <button onClick={handleLogout} className="w-full py-5 rounded-3xl border border-stone-200 text-stone-400 font-black uppercase text-[10px] tracking-[0.4em] hover:bg-stone-50 transition-colors">Terminate Session</button>
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

const GuideCard = ({ title, desc, img, label }: { title: string, desc: string, img: string, label: string }) => (
  <div className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-stone-50 group transition-all duration-700 hover:shadow-2xl">
    <div className="h-[400px] overflow-hidden">
      <img src={img} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt={title} />
    </div>
    <div className="p-10 space-y-4">
       <h3 className="text-3xl font-black serif text-stone-900 leading-tight">{title}</h3>
       <p className="text-stone-500 serif leading-relaxed italic opacity-80">{desc}</p>
       <button className="bg-stone-950 text-white px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center space-x-3 active:scale-95 transition-all">
         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
         <span>{label}</span>
       </button>
    </div>
  </div>
);

export default App;
