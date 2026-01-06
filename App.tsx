
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
  const [wizardStep, setWizardStep] = useState(1);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [generatedFeature, setGeneratedFeature] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<'icon' | 'feature' | null>(null);
  const [productionUrl, setProductionUrl] = useState('');

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

  // Use the dynamic daily session from the library state if it exists
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

  const handleGenerateAsset = async (type: 'icon' | 'feature') => {
    setIsGenerating(type);
    const result = await generateAppAsset(type);
    if (result) {
      if (type === 'icon') setGeneratedIcon(result);
      else setGeneratedFeature(result);
    }
    setIsGenerating(null);
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
                <p className="text-stone-400 text-xs mt-1">Please login as <span className="text-emerald-600 font-bold">vvkkoo4816@gmail.com</span></p>
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
                      <div className="flex justify-between mb-12 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2"></div>
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setWizardStep(s)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${wizardStep >= s ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-stone-800 text-stone-500'}`}>{s}</button>
                        ))}
                      </div>

                      {wizardStep === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Stage 1: AI Branding Assets</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <p className="text-[10px] font-black uppercase text-stone-500">App Icon (512x512)</p>
                              <div className="w-40 h-40 bg-stone-800 rounded-[40px] border border-white/10 flex items-center justify-center overflow-hidden">{generatedIcon ? <img src={generatedIcon} className="w-full h-full object-cover" /> : <span className="text-4xl">🧘</span>}</div>
                              <button onClick={() => handleGenerateAsset('icon')} disabled={!!isGenerating} className="px-6 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase">{isGenerating === 'icon' ? 'Panting...' : 'Generate AI Icon'}</button>
                            </div>
                            <div className="space-y-4">
                              <p className="text-[10px] font-black uppercase text-stone-500">Store Graphic (1024x500)</p>
                              <div className="aspect-video w-full bg-stone-800 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden">{generatedFeature ? <img src={generatedFeature} className="w-full h-full object-cover" /> : <span className="text-4xl">🌄</span>}</div>
                              <button onClick={() => handleGenerateAsset('feature')} disabled={!!isGenerating} className="px-6 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase">{isGenerating === 'feature' ? 'Painting...' : 'Generate AI Graphic'}</button>
                            </div>
                          </div>
                          <button onClick={() => setWizardStep(2)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6 shadow-lg shadow-emerald-500/20">Continue to Setup</button>
                        </div>
                      )}

                      {wizardStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Stage 2: Linking GitHub</h4>
                          <div className="bg-black/30 p-8 rounded-[40px] border border-white/5 space-y-4 font-mono text-xs">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                              <p className="text-red-200 font-bold mb-1">Fixing "refspec main does not match any" Error:</p>
                              <p className="text-stone-400 text-[10px] leading-relaxed">This happens if your branch is named 'master'. Use the command <code>git branch -M main</code> to fix it.</p>
                            </div>
                            <p className="text-stone-400 leading-relaxed mb-4 font-sans italic text-xs">Correct Command Sequence:</p>
                            <code className="block bg-black p-4 rounded-xl text-emerald-400 leading-loose break-all border border-emerald-500/20">
                              git init<br />
                              git add .<br />
                              git commit -m "Initial release"<br />
                              git branch -M main<br />
                              git remote add origin YOUR_GITHUB_URL<br />
                              git push -u origin main
                            </code>
                          </div>
                          <div className="flex space-x-4"><button onClick={() => setWizardStep(1)} className="text-stone-500 font-bold text-xs uppercase p-4">Back</button><button onClick={() => setWizardStep(3)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Next: Deploy to Web</button></div>
                        </div>
                      )}

                      {wizardStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Stage 3: Deploy to Vercel</h4>
                          <div className="bg-black/30 p-8 rounded-[40px] border border-white/5 space-y-6">
                            <div className="space-y-3">
                              <h5 className="font-bold text-white text-sm">Step 1: Deployment Method</h5>
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest text-emerald-400">Option A: Easy (No Git Needed)</p>
                                <p className="text-stone-400 text-[11px] leading-relaxed">Go to <a href="https://vercel.com/new" target="_blank" className="text-white underline">vercel.com/new</a> and find the "Drag and Drop" area. Drag your <b>project folder</b> there. Done!</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h5 className="font-bold text-white text-sm">Step 2: Production URL</h5>
                              <input type="text" value={productionUrl} onChange={e => setProductionUrl(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-emerald-400 font-mono text-sm outline-none" placeholder="https://clamrelaxflow.vercel.app" />
                            </div>
                          </div>
                          <div className="flex space-x-4"><button onClick={() => setWizardStep(2)} className="text-stone-500 font-bold text-xs uppercase p-4">Back</button><button onClick={() => setWizardStep(4)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Next: Build Error Fix</button></div>
                        </div>
                      )}

                      {wizardStep === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-5 overflow-y-auto max-h-[500px] pr-4">
                          <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">Stage 4: Fixing Build Errors</h4>
                          
                          {/* CRITICAL SEQUENCE FIX */}
                          <div className="p-6 bg-red-600/20 border-2 border-red-500 rounded-[32px] mb-8 shadow-lg">
                            <h5 className="text-lg font-black text-white mb-2 flex items-center">
                              <span className="mr-2">🚨</span> Fix: missing "twa-manifest.json"
                            </h5>
                            <p className="text-xs text-stone-200 mb-4 leading-relaxed font-medium">
                              If you see "no such file or directory, open twa-manifest.json", it means <b>init failed</b>. 
                              You cannot run <code>build</code> until you fix the corrupted JDK and finish <code>init</code>.
                            </p>
                            
                            <div className="space-y-4">
                              <div className="bg-black/40 p-4 rounded-2xl border border-red-500/20">
                                <p className="text-[10px] font-black uppercase text-red-400 mb-2">1. Manual Environment Setup</p>
                                <ul className="text-[11px] text-stone-300 list-disc pl-4 space-y-1">
                                  <li>Download/Run: <a href="https://adoptium.net/temurin/releases/?version=17" target="_blank" className="text-white underline font-bold">JDK 17 MSI Installer</a></li>
                                  <li>Delete this broken folder: <br/><code className="text-white">C:\Users\YOUR_NAME\.bubblewrap\jdk</code></li>
                                </ul>
                              </div>

                              <div className="bg-black/40 p-4 rounded-2xl border border-red-500/20">
                                <p className="text-[10px] font-black uppercase text-red-400 mb-2">2. RE-RUN INIT (Essential)</p>
                                <p className="text-[11px] text-stone-300 mb-2">You must regenerate the manifest. Run this exact command:</p>
                                <code className="block bg-black p-2 rounded text-emerald-400 text-[9px] mb-2">npx @bubblewrap/cli init --manifest={productionUrl || 'https://YOUR_PRODUCTION_URL'}/metadata.json</code>
                                <p className="text-[11px] text-stone-300 italic">When asked "Do you want Bubblewrap to install the JDK?", type <b>N</b> and press Enter. Then paste your local JDK path.</p>
                              </div>

                              <div className="bg-black/40 p-4 rounded-2xl border border-red-500/20">
                                <p className="text-[10px] font-black uppercase text-red-400 mb-2">3. FINAL BUILD</p>
                                <p className="text-[11px] text-stone-300">Only after Step 2 finishes, run: <br/><code className="text-white">npx @bubblewrap/cli build</code></p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6 opacity-40 grayscale">
                            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                              <p className="text-sm font-bold text-blue-400 mb-2">Step C: Domain Proof (Assetlinks)</p>
                              <p className="text-xs text-stone-400 mb-4">Bubblewrap creates <code>assetlinks.json</code> in your folder. Copy the fingerprint from it into your code's <code>public/.well-known/assetlinks.json</code> and re-deploy.</p>
                            </div>
                          </div>
                          <div className="flex space-x-4 mt-6"><button onClick={() => setWizardStep(3)} className="text-stone-500 font-bold text-xs uppercase p-4">Back</button><button onClick={() => setWizardStep(5)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Final Steps</button></div>
                        </div>
                      )}

                      {wizardStep === 5 && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                          <div className="flex items-center space-x-4">
                            <span className="text-4xl">🚀</span>
                            <h4 className="text-3xl font-black text-emerald-400">Final Release</h4>
                          </div>
                          <div className="space-y-8">
                            <div className="space-y-3">
                              <h5 className="font-black text-xs uppercase tracking-widest text-white/60">1. Play Console Upload</h5>
                              <p className="text-sm text-stone-400">Upload your <code>app-release-bundle.aab</code> (located in your local folder) to the Google Play Console Internal Testing track.</p>
                            </div>
                            <div className="space-y-3">
                              <h5 className="font-black text-xs uppercase tracking-widest text-white/60">2. Address Bar Removal</h5>
                              <p className="text-sm text-stone-400">Once your updated <code>assetlinks.json</code> is live on your website and Google Play recognizes the app, the address bar will automatically vanish!</p>
                            </div>
                          </div>
                          <button onClick={() => setWizardStep(1)} className="px-10 py-4 bg-white/10 rounded-3xl font-black text-xs uppercase">Start Over</button>
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
