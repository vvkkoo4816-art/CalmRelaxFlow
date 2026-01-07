
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, ZenCenter, Language } from './types';
import { MEDITATION_SESSIONS, DAILY_MEDITATION } from './constants';
import { getPersonalizedRecommendation, findNearbyZenCenters, generateAppAsset } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'wizard' | 'content'>('content');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'select' | 'manual'>('select');
  const [manualEmail, setManualEmail] = useState('');
  
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [membershipDatabase, setMembershipDatabase] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const t = translations[lang] || translations['en'];

  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [mood, setMood] = useState<string>('calm');
  const [nearbyCenters, setNearbyCenters] = useState<ZenCenter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Release Wizard State
  const [wizardStep, setWizardStep] = useState(0); 

  // Content Management State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const [newSessionData, setNewSessionData] = useState({
    title: '',
    category: 'Daily' as MeditationSession['category'],
    duration: '10 min',
    audioUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800'
  });

  useEffect(() => {
    const savedUsers = localStorage.getItem('clamrelax_members');
    if (savedUsers) {
      try {
        setMembershipDatabase(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Failed to parse members", e);
      }
    }

    const savedSessions = localStorage.getItem('clamrelax_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(Array.isArray(parsed) ? parsed : MEDITATION_SESSIONS);
      } catch (e) {
        setSessions(MEDITATION_SESSIONS);
      }
    } else {
      setSessions(MEDITATION_SESSIONS);
    }

    const savedSession = localStorage.getItem('clamrelax_active_user');
    if (savedSession) {
      try {
        const parsedUser = JSON.parse(savedSession);
        if (parsedUser && parsedUser.email) {
          setUser(parsedUser);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Failed to parse active user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      localStorage.setItem('clamrelax_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const currentDailySession = sessions.find(s => s.category === 'Daily') || DAILY_MEDITATION;

  const handleMoodSelection = useCallback(async (selectedMood: string) => {
    setMood(selectedMood);
    const advice = await getPersonalizedRecommendation(selectedMood, lang);
    setRecommendation(advice || "Close your eyes and let the world drift away for a moment.");
  }, [lang]);

  useEffect(() => {
    if (isLoggedIn && user) {
      handleMoodSelection('calm');
    }
  }, [isLoggedIn, user?.email, lang, handleMoodSelection]);

  const handleLoginClick = () => {
    setLoginStep('select');
    setShowLoginModal(true);
  };

  const completeLogin = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }

    const isAdmin = cleanEmail === 'vvkkoo4816@gmail.com';
    const existingUser = membershipDatabase.find(u => u && u.email === cleanEmail);

    const loggedUser: User = existingUser || {
      id: "u-" + Date.now(),
      name: cleanEmail.split('@')[0].toUpperCase(),
      email: cleanEmail,
      photoUrl: `https://ui-avatars.com/api/?name=${cleanEmail}&background=10b981&color=fff`,
      isLoggedIn: true,
      streak: 1,
      minutesMeditated: 0,
      role: isAdmin ? 'admin' : 'user'
    };

    setUser(loggedUser);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    setManualEmail('');

    localStorage.setItem('clamrelax_active_user', JSON.stringify(loggedUser));
    if (!existingUser) {
      const updatedDB = [...membershipDatabase, loggedUser];
      setMembershipDatabase(updatedDB);
      localStorage.setItem('clamrelax_members', JSON.stringify(updatedDB));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clamrelax_active_user');
    setIsLoggedIn(false);
    setUser(null);
    setView('today');
  };

  const processAudioFile = (file: File, sessionId: string | 'new') => {
    if (!file.type.includes('audio')) {
      alert("Please select a valid audio file.");
      return;
    }

    setIsUploading(sessionId);
    const reader = new FileReader();

    reader.onload = (event) => {
      const audioUrl = event.target?.result as string;
      if (sessionId === 'new') {
        setNewSessionData(prev => ({ ...prev, audioUrl }));
      } else {
        setSessions(prev => (prev || []).map(s => s.id === sessionId ? { ...s, audioUrl } : s));
      }
      setIsUploading(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      alert("Audio file linked successfully.");
    };
    reader.readAsDataURL(file);
  };

  const createNewSession = () => {
    if (!newSessionData.title || !newSessionData.audioUrl) {
      alert("Please provide at least a title and an audio source.");
      return;
    }
    const session: MeditationSession = {
      id: 's-' + Date.now(),
      ...newSessionData,
      description: 'Custom User Scenario'
    };
    setSessions(prev => [session, ...(prev || [])]);
    setNewSessionData({
      title: '',
      category: 'Daily',
      duration: '10 min',
      audioUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800'
    });
    alert("Scenario added to library!");
  };

  const handleUpdateSession = (id: string, field: keyof MeditationSession, value: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleManualSave = () => {
    setSaveStatus('saving');
    localStorage.setItem('clamrelax_sessions', JSON.stringify(sessions));
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleDeleteSession = (id: string) => {
    if (confirm("Delete this scenario permanently?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleScanCenters = () => {
    setIsScanning(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const centers = await findNearbyZenCenters(pos.coords.latitude, pos.coords.longitude);
      setNearbyCenters(centers);
      setIsScanning(false);
    }, () => {
      alert("Location access denied. Showing global centers.");
      findNearbyZenCenters(0, 0).then(setNearbyCenters);
      setIsScanning(false);
    });
  };

  const LanguageToggle = () => (
    <div className="flex space-x-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 shadow-inner">
      {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            lang === l ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简' : '繁'}
        </button>
      ))}
    </div>
  );

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-between p-8 text-center relative overflow-hidden">
        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden p-8 flex flex-col items-center">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-12 h-12 mb-6" />
              {loginStep === 'select' ? (
                <>
                  <h2 className="text-2xl font-black text-stone-900 mb-2 text-center">Sign in to ClamRelaxFlow</h2>
                  <div className="w-full space-y-3 mt-6">
                    <button onClick={() => completeLogin('vvkkoo4816@gmail.com')} className="w-full p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all flex items-center space-x-4 text-left group">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">V</div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-stone-800">vvkkoo4816@gmail.com</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase">Administrator Account</p>
                      </div>
                    </button>
                    <button onClick={() => setLoginStep('manual')} className="w-full p-4 rounded-2xl border border-dashed border-stone-200 hover:bg-stone-50 transition-all text-xs font-bold text-stone-400">Use another account</button>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <input type="email" placeholder="Enter email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-100 mb-4 outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={() => completeLogin(manualEmail)} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black">Continue</button>
                </div>
              )}
              <button onClick={() => setShowLoginModal(false)} className="mt-8 text-stone-400 text-xs font-black uppercase">Cancel</button>
            </div>
          </div>
        )}
        <div className="absolute top-8 right-8"><LanguageToggle /></div>
        <div className="mt-24">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mb-10 shadow-2xl mx-auto">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-5xl font-extrabold serif text-stone-900 mb-6 tracking-tighter">ClamRelaxFlow</h1>
          <p className="text-stone-500 max-w-xs mx-auto text-lg font-medium leading-relaxed">{t.personalized_paths}</p>
        </div>
        <button onClick={handleLoginClick} className="w-full max-w-md bg-stone-900 text-white px-8 py-5 rounded-3xl flex items-center justify-center space-x-4 shadow-xl mb-12 font-bold text-lg hover:scale-[1.02] transition-all active:scale-95">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 rounded-full bg-white p-0.5" />
          <span>{t.sign_in_google}</span>
        </button>
      </div>
    );
  }

  const isAdminUser = user.email.toLowerCase().trim() === 'vvkkoo4816@gmail.com';

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-5xl mx-auto w-full pb-32">
        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5">
            <header className="flex items-center justify-between">
              <div><p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mb-1">{t.welcome_back}</p><h2 className="text-3xl font-extrabold serif text-stone-900">{t.hey}, {user.name}</h2></div>
              <div className="bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-100 flex items-center space-x-2"><span className="text-amber-500">🔥</span><span className="font-extrabold text-stone-700 text-sm">{user.streak || 1}</span></div>
            </header>
            <section className="relative h-[400px] rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setActiveSession(currentDailySession)}>
              <img src={currentDailySession.imageUrl} alt="Daily" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="absolute bottom-10 left-10">
                <span className="px-3 py-1 bg-emerald-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-4 inline-block">{t.daily_zen}</span>
                <h3 className="text-4xl font-black text-white mb-4">{currentDailySession.title}</h3>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-xl group-hover:scale-110 transition-transform"><svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              </div>
            </section>
          </div>
        )}

        {view === 'breathing' && (
          <div className="space-y-12 animate-in fade-in">
            <header>
              <h2 className="text-4xl font-extrabold serif text-stone-900 mb-2">{t.nav_breathing}</h2>
              <p className="text-stone-400 text-sm font-medium">Harmonize your mind and body with guided rhythmic breathing.</p>
            </header>
            <BreathingExercise lang={lang} />
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {!isAdminUser ? (
              <div className="flex flex-col items-center justify-center py-20 bg-stone-50 rounded-[40px] border border-dashed border-stone-200">
                <div className="text-5xl mb-6">🔐</div>
                <h2 className="text-2xl font-black text-stone-800">Administrator Access Only</h2>
                <p className="text-stone-500 mt-2">Current user: <span className="font-bold text-red-500">{user.email}</span></p>
                <button onClick={handleLogout} className="mt-8 px-6 py-2 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Sign Out</button>
              </div>
            ) : (
              <div className="admin-content">
                <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold serif text-stone-900 mb-2">Admin Console</h2>
                    <div className="flex space-x-4 mt-6">
                      <button onClick={() => setAdminTab('content')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'content' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Content Manager</button>
                      <button onClick={() => setAdminTab('wizard')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'wizard' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Release Wizard</button>
                    </div>
                  </div>
                  {adminTab === 'content' && (
                    <button 
                      onClick={handleManualSave}
                      className={`mt-6 md:mt-0 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2 shadow-xl ${
                        saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 
                        saveStatus === 'saving' ? 'bg-stone-400 text-white animate-pulse' : 
                        'bg-stone-900 text-white hover:bg-emerald-600'
                      }`}
                    >
                      <span>{saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Save All Changes'}</span>
                    </button>
                  )}
                </header>

                {adminTab === 'content' ? (
                  <div className="space-y-12">
                    <section className="bg-emerald-50/50 p-8 rounded-[40px] border border-emerald-100 shadow-sm">
                      <h3 className="text-2xl font-black text-stone-800 mb-6">Add New Scenario</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-stone-400">Title</label><input type="text" value={newSessionData.title} onChange={e => setNewSessionData(p => ({...p, title: e.target.value}))} className="w-full p-4 rounded-2xl bg-white border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Zen Rain Walk" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-stone-400">Category</label><select value={newSessionData.category} onChange={e => setNewSessionData(p => ({...p, category: e.target.value as any}))} className="w-full p-4 rounded-2xl bg-white border-stone-200"><option>Daily</option><option>Sleep</option><option>Anxiety</option><option>Focus</option><option>Quick Relief</option></select></div>
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-stone-400">Duration</label><input type="text" value={newSessionData.duration} onChange={e => setNewSessionData(p => ({...p, duration: e.target.value}))} className="w-full p-4 rounded-2xl bg-white border-stone-200" placeholder="10 min" /></div>
                        <div className="lg:col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-stone-400">Audio URL</label><input type="text" value={newSessionData.audioUrl} onChange={e => setNewSessionData(p => ({...p, audioUrl: e.target.value}))} className="w-full p-4 rounded-2xl bg-white border-stone-200" placeholder="https://cdn.example.com/audio.mp3" /></div>
                        <div className="flex items-end space-x-3">
                          <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-white border border-emerald-200 rounded-2xl font-black text-[10px] uppercase text-emerald-600"> {isUploading === 'new' ? 'Loading...' : 'Upload MP3'}</button>
                          <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && processAudioFile(e.target.files[0], 'new')} className="hidden" accept="audio/*" />
                          <button onClick={createNewSession} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Create</button>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-2xl font-black text-stone-800">Library Scenarios ({sessions.length})</h3>
                      <div className="space-y-4">
                        {sessions.map(session => (
                          <div key={session.id} className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                              <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0"><img src={session.imageUrl} className="w-full h-full object-cover" /></div>
                                <div className="flex-1 min-w-0"><input type="text" value={session.title} onChange={e => handleUpdateSession(session.id, 'title', e.target.value)} className="w-full font-black text-stone-800 bg-transparent border-none p-0 focus:ring-0 truncate" /></div>
                              </div>
                              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-stone-400">Audio MP3 Link</label><input type="text" value={session.audioUrl} onChange={e => handleUpdateSession(session.id, 'audioUrl', e.target.value)} className="w-full p-2 bg-stone-50 rounded-xl text-xs outline-none" /></div>
                              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-stone-400">Duration</label><input type="text" value={session.duration} onChange={e => handleUpdateSession(session.id, 'duration', e.target.value)} className="w-full p-2 bg-stone-50 rounded-xl text-xs outline-none" /></div>
                              <div className="flex items-center space-x-2">
                                <button onClick={() => editFileInputRefs.current[session.id]?.click()} className="flex-1 py-3 bg-stone-100 rounded-xl font-black text-[9px] uppercase">{isUploading === session.id ? 'Wait...' : 'Replace MP3'}</button>
                                <input type="file" ref={el => { editFileInputRefs.current[session.id] = el; }} onChange={e => e.target.files?.[0] && processAudioFile(e.target.files[0], session.id)} className="hidden" accept="audio/*" />
                                <button onClick={() => handleDeleteSession(session.id)} className="p-3 bg-red-50 text-red-500 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <section className="bg-stone-900 text-white p-10 rounded-[40px] shadow-2xl min-h-[600px]">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between mb-12 relative overflow-x-auto pb-4">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2"></div>
                        {[0, 1, 1.5, 2, 3, 3.5, 4, 5].map(s => (
                          <button key={s} onClick={() => setWizardStep(s)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black transition-all shrink-0 ${wizardStep >= s ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-stone-800 text-stone-500'}`}>
                            {s === 0 ? '🛠️' : s === 1.5 ? '⬇️' : s === 3.5 ? '⚠️' : s}
                          </button>
                        ))}
                      </div>

                      {wizardStep === 0 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">Step 0: Prerequisites (Verified ✅)</h4>
                          <p className="text-sm text-stone-300 leading-relaxed">Your computer is now ready to run 'npx' commands. You can proceed to the next phase.</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                               <p className="text-xs font-black uppercase text-emerald-400 mb-2">Visual Studio Code</p>
                               <p className="text-[10px] text-stone-400">Installed & Ready.</p>
                            </div>
                            <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                               <p className="text-xs font-black uppercase text-emerald-400 mb-2">Node.js (LTS)</p>
                               <p className="text-[10px] text-stone-400">Path Verified.</p>
                            </div>
                            <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                               <p className="text-xs font-black uppercase text-emerald-400 mb-2">Git</p>
                               <p className="text-[10px] text-stone-400">Sync Ready.</p>
                            </div>
                          </div>

                          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] space-y-4">
                             <p className="text-xs font-black uppercase text-emerald-400">✅ Verification Success</p>
                             <p className="text-[11px] text-stone-300">You successfully ran <code>Get-Command npx</code>. This proves your terminal can build Android apps.</p>
                          </div>

                          <button onClick={() => setWizardStep(1)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Next Phase</button>
                        </div>
                      )}

                      {wizardStep === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 1: Your GitHub Project</h4>
                          <p className="text-sm text-stone-300 leading-relaxed">
                            Every time you click <b>"Save to GitHub"</b> in this online IDE, your progress is stored on the web.
                            Now we need to download (Clone) it to your computer using VS Code.
                          </p>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                             <p className="text-xs font-bold text-white mb-2 uppercase">Your Project URL:</p>
                             <div className="bg-black/50 p-3 rounded-xl font-mono text-emerald-400 text-[11px] break-all">
                                https://github.com/vvkkoo4816-art/CalmRelaxFlow
                             </div>
                             <p className="text-[10px] text-stone-500 mt-2 italic">Copy this URL. You will need it in the next step.</p>
                          </div>
                          <button onClick={() => setWizardStep(1.5)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Next: How to Download</button>
                        </div>
                      )}

                      {wizardStep === 1.5 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">Phase 1.5: How to "Drag" (Clone) in VS Code</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <p className="text-sm text-stone-300">Open <b>VS Code</b> on your computer and follow this:</p>
                              <ol className="text-xs text-stone-400 space-y-4 list-decimal pl-5">
                                 <li>Click the <b>Source Control</b> icon in the left sidebar (it looks like a branch <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9a3 3 0 11-6 0 3 3 0 016 0zM5.07 19.29c.09.63.59 1.15 1.21 1.29l.1.02.1-.02c.62-.14 1.12-.66 1.21-1.29L7.7 18H11v-1H7.7l-.01-.01c-.09-.63-.59-1.15-1.21-1.29L6.38 15.68l-.1.02c-.62.14-1.12.66-1.21 1.29L5.06 17H2v1h3.06l.01.29zM12 11h1v7h-1v-7z"/></svg>).</li>
                                 <li>Click the <b>Clone Repository</b> button.</li>
                                 <li><b>Paste the URL</b> from Step 1 into the box that appears at the top.</li>
                                 <li>Press <b>Enter</b> and choose a folder on your computer to save the app.</li>
                                 <li>Click <b>Open</b> when it asks if you want to open the cloned folder.</li>
                              </ol>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-[40px] p-6 flex flex-col items-center justify-center text-center">
                              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/></svg></div>
                              <p className="text-xs font-bold text-white mb-2">Login Required</p>
                              <p className="text-[10px] text-stone-500">VS Code will ask you to "Sign in to GitHub" in your browser. This is safe! It proves you are the owner.</p>
                            </div>
                          </div>
                          <button onClick={() => setWizardStep(2)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Project Cloned, Next</button>
                        </div>
                      )}

                      {wizardStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 2: Updating Your Computer</h4>
                          <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 mb-4">
                             <p className="text-xs font-bold text-emerald-300">How to open the Terminal in VS Code:</p>
                             <p className="text-[11px] text-stone-400 mt-2">
                                Look at the top menu bar in VS Code: Click <b>Terminal</b> &gt; <b>New Terminal</b>. 
                                <br/>Alternatively, press <b>Ctrl + `</b> (the key next to 1).
                             </p>
                          </div>
                          <p className="text-sm text-stone-300 leading-relaxed">
                            Once your terminal is open at the bottom of VS Code, run this command:
                          </p>
                          <div className="bg-black/30 p-8 rounded-[40px] border border-white/5 space-y-4">
                            <code className="block bg-black/50 p-4 rounded-xl text-emerald-400 font-mono text-[12px]">
                              git pull origin main
                            </code>
                            <p className="text-[10px] text-stone-500 italic">This "pulls" the new work you did in the browser into your local VS Code project.</p>
                          </div>
                          <div className="flex space-x-4"><button onClick={() => setWizardStep(1.5)} className="text-stone-500 font-bold text-xs uppercase p-4">Back</button><button onClick={() => setWizardStep(3)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Next: Build APK</button></div>
                        </div>
                      )}

                      {wizardStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 3: The Build Process</h4>
                          <div className="bg-amber-500/10 p-5 rounded-3xl border border-amber-500/20 mb-4">
                             <p className="text-xs font-bold text-amber-300">Terminal Ready ✅</p>
                             <p className="text-[11px] text-stone-400 mt-2">
                                If your build failed with <b>'npx cannot be loaded'</b> or <b>'scripts disabled'</b>, proceed to the <b>⚠️ Fix: Terminal Scripts</b> step.
                             </p>
                          </div>
                          <div className="bg-black/30 p-8 rounded-[40px] border border-white/5 space-y-6">
                            <p className="text-sm text-stone-300">Run this in your **VS Code Terminal** to create the file for Google Play:</p>
                            <code className="block bg-black p-4 rounded-xl text-emerald-400 font-mono text-sm border border-emerald-500/20">npx @bubblewrap/cli build</code>
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                               <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Look for this file in your computer folder:</p>
                               <p className="text-xs text-white font-bold">app-release-bundle.aab</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-6">
                            <button onClick={() => setWizardStep(2)} className="text-stone-500 font-bold text-xs uppercase p-4">Back</button>
                            <button onClick={() => setWizardStep(3.5)} className="bg-red-500 px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl shadow-red-500/20">⚠️ Fix: Terminal Scripts</button>
                            <button onClick={() => setWizardStep(4)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Next: Play Console</button>
                          </div>
                        </div>
                      )}

                      {wizardStep === 3.5 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-red-400 tracking-tighter">Phase 3.5: Troubleshooting Script Errors</h4>
                          
                          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] space-y-4">
                             <p className="text-xs font-black uppercase text-red-400">Issue A: "npx cannot be loaded because running scripts is disabled"</p>
                             <p className="text-[11px] text-stone-300">Windows blocks scripts by default for security. To fix this, paste this command into your VS Code terminal and press Enter:</p>
                             <code className="bg-black p-4 rounded-xl text-emerald-400 text-[11px] block mt-1 overflow-x-auto border border-white/10 font-mono">
                               Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
                             </code>
                             <p className="text-[10px] text-stone-500 italic">Type 'Y' if asked for confirmation. This is a one-time fix.</p>
                          </div>

                          <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-[32px] space-y-4">
                             <p className="text-xs font-black uppercase text-orange-400">Issue B: "resource drawable/splash not found"</p>
                             <p className="text-[11px] text-stone-300">If your build starts but fails with this specific resource error:</p>
                             <ol className="text-[11px] text-stone-400 list-decimal pl-5 space-y-3">
                                <li>Run this command: <br/><code className="bg-black p-2 rounded text-emerald-400 text-[10px] block mt-1 overflow-x-auto">npx @bubblewrap/cli update</code></li>
                                <li>When asked: <b>"would you like to regenerate your project?"</b>, type <b>Yes</b> and press Enter.</li>
                                <li>Try the build command again.</li>
                             </ol>
                          </div>
                          
                          <div className="flex space-x-4 mt-6"><button onClick={() => setWizardStep(3)} className="bg-stone-800 px-8 py-3 rounded-2xl font-black text-xs uppercase">Back to Build</button></div>
                        </div>
                      )}

                      {wizardStep === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">Phase 4: Play Console Upload</h4>
                          <div className="space-y-4">
                             <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <p className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-widest">Action Required:</p>
                                <ol className="text-xs text-stone-400 space-y-4 list-decimal pl-5">
                                   <li>Open <a href="https://play.google.com/console" target="_blank" className="text-white underline">Google Play Console</a> in your browser.</li>
                                   <li>Go to <b>Internal Testing</b>.</li>
                                   <li>Upload that <b>.aab</b> file from Step 3.</li>
                                   <li>Google will generate the <b>SHA-256 Fingerprint</b>. You'll need it for Phase 5.</li>
                                </ol>
                             </div>
                          </div>
                          <div className="flex space-x-4 mt-6"><button onClick={() => setWizardStep(3.5)} className="text-stone-500 font-bold text-xs uppercase p-4">Back</button><button onClick={() => setWizardStep(5)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Final Step</button></div>
                        </div>
                      )}

                      {wizardStep === 5 && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 5: Final Trust (No Address Bar)</h4>
                          <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-6">
                            <p className="text-sm text-stone-300 leading-relaxed">
                              One last step to remove the browser address bar. Update your <code>assetlinks.json</code> file on your computer.
                            </p>
                            <div className="p-5 bg-black rounded-3xl space-y-3 font-mono text-[10px]">
                               <p className="text-stone-500">// Open public/.well-known/assetlinks.json on your machine</p>
                               <p className="text-emerald-400">"sha256_cert_fingerprints": ["YOUR_PLAY_STORE_FINGERPRINT"]</p>
                            </div>
                            <p className="text-[11px] text-stone-400">
                               After editing, run <b>git push</b> from your computer terminal. Vercel will update, and you are done!
                            </p>
                          </div>
                          <button onClick={() => setWizardStep(0)} className="px-10 py-4 bg-emerald-500 rounded-3xl font-black text-xs uppercase shadow-xl shadow-emerald-500/20">Restart Checklist</button>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5">
            <header><h2 className="text-4xl font-extrabold serif text-stone-900 mb-2">{t.nav_library}</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {sessions.map(s => (
                  <div key={s.id} onClick={() => setActiveSession(s)} className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
                     <div className="h-48 relative overflow-hidden"><img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /><div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-600">{s.category}</div></div>
                     <div className="p-6"><h4 className="font-bold text-lg text-stone-800">{s.title}</h4><p className="text-stone-400 text-xs">{s.duration} • Guided</p></div>
                  </div>
               ))}
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-12 animate-in fade-in">
             <header><h2 className="text-4xl font-extrabold serif text-stone-900 mb-2">{t.sleep_sanctuary}</h2></header>
             <SoundMixer />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                {sessions.filter(s => s.category === 'Sleep').map(story => (
                  <div key={story.id} onClick={() => setActiveSession(story)} className="relative h-64 rounded-[40px] overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all">
                     <img src={story.imageUrl} className="absolute inset-0 w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent"></div>
                     <div className="absolute bottom-6 left-6"><h4 className="text-xl font-bold text-white mb-1">{story.title}</h4><p className="text-[10px] text-white/60 font-black uppercase tracking-widest">{story.duration}</p></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-12 animate-in fade-in">
            <header><h2 className="text-4xl font-extrabold serif text-stone-900 mb-2">{t.nav_explore}</h2></header>
            <section className="bg-stone-50 p-8 rounded-[40px] border border-stone-100">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-stone-900">{t.wellness_near_you}</h3>
                  <button onClick={handleScanCenters} disabled={isScanning} className="bg-stone-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-600 disabled:opacity-50">
                    {isScanning ? 'Scanning...' : t.scan_area}
                  </button>
               </div>
               <div className="space-y-4">
                  {nearbyCenters.map((center, idx) => (
                    <a key={idx} href={center.url} target="_blank" rel="noopener noreferrer" className="bg-white p-5 rounded-3xl flex items-center justify-between group border border-stone-50 hover:shadow-md transition-all">
                       <div className="flex items-center space-x-4"><div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 text-xl">📍</div><div><h4 className="font-bold text-stone-800 group-hover:text-emerald-600 transition-colors">{center.name}</h4><p className="text-[10px] text-stone-400 font-bold uppercase">{center.address}</p></div></div>
                       <div className="flex items-center space-x-1 text-amber-400 font-bold text-xs">★ <span className="text-stone-700">{center.rating}</span></div>
                    </a>
                  ))}
               </div>
            </section>
          </div>
        )}

        {view === 'profile' && (
          <div className="animate-in fade-in text-center py-12">
            <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl mb-8 mx-auto"><img src={user.photoUrl} className="w-full h-full object-cover" /></div>
            <h2 className="text-4xl font-black serif text-stone-900 mb-2">{user.name}</h2>
            <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-12">{user.email}</p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
               <div className="bg-white p-6 rounded-[32px] border border-stone-100"><p className="text-3xl font-black text-emerald-600">{user.streak || 1}</p><p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Day Streak</p></div>
               <div className="bg-white p-6 rounded-[32px] border border-stone-100"><p className="text-3xl font-black text-stone-800">{user.minutesMeditated || 0}</p><p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Mindful Mins</p></div>
            </div>
            <button onClick={handleLogout} className="mt-16 px-10 py-4 bg-stone-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-500 transition-all">Sign Out</button>
          </div>
        )}
      </div>

      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;
