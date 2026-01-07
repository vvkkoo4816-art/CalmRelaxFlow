
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
  const [adminTab, setAdminTab] = useState<'wizard' | 'content' | 'assets'>('content');
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

  // Asset Studio State
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

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
    const savedUsers = localStorage.getItem('calmrelax_members');
    if (savedUsers) {
      try {
        setMembershipDatabase(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Failed to parse members", e);
      }
    }

    const savedSessions = localStorage.getItem('calmrelax_sessions');
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

    const savedSession = localStorage.getItem('calmrelax_active_user');
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
      localStorage.setItem('calmrelax_sessions', JSON.stringify(sessions));
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

    localStorage.setItem('calmrelax_active_user', JSON.stringify(loggedUser));
    if (!existingUser) {
      const updatedDB = [...membershipDatabase, loggedUser];
      setMembershipDatabase(updatedDB);
      localStorage.setItem('calmrelax_members', JSON.stringify(updatedDB));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('calmrelax_active_user');
    setIsLoggedIn(false);
    setUser(null);
    setView('today');
  };

  const handleGenerateIcon = async () => {
    setIsGeneratingIcon(true);
    const url = await generateAppAsset('icon');
    if (url) {
      setGeneratedIcon(url);
    } else {
      alert("Icon generation failed. Please check your API key.");
    }
    setIsGeneratingIcon(false);
  };

  const downloadIcon = () => {
    if (!generatedIcon) return;
    const link = document.createElement('a');
    link.href = generatedIcon;
    link.download = 'icon.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    localStorage.setItem('calmrelax_sessions', JSON.stringify(sessions));
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-between p-8 text-center relative overflow-hidden">
        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden p-8 flex flex-col items-center">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-12 h-12 mb-6" />
              {loginStep === 'select' ? (
                <>
                  <h2 className="text-2xl font-black text-stone-900 mb-2 text-center">Sign in to CalmRelaxFlow</h2>
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
          <h1 className="text-5xl font-extrabold serif text-stone-900 mb-6 tracking-tighter">CalmRelaxFlow</h1>
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
                      <button onClick={() => setAdminTab('content')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'content' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Content</button>
                      <button onClick={() => setAdminTab('assets')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'assets' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Assets Studio</button>
                      <button onClick={() => setAdminTab('wizard')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'wizard' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Release Wizard</button>
                    </div>
                  </div>
                </header>

                {adminTab === 'wizard' && (
                  <section className="bg-stone-900 text-white p-10 rounded-[40px] shadow-2xl min-h-[600px]">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between mb-12 relative overflow-x-auto pb-4">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2"></div>
                        {[0, 1, 2.5, 2.9, 3, 3.5, 4, 5].map(s => (
                          <button key={s} onClick={() => setWizardStep(s)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black transition-all shrink-0 ${wizardStep >= s ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-stone-800 text-stone-500'}`}>
                            {s === 0 ? '🛠️' : s === 2.9 ? '🔑' : s === 3.5 ? '🚨' : s}
                          </button>
                        ))}
                      </div>

                      {wizardStep === 0 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">Phase 0: Readiness Check</h4>
                          <p className="text-sm text-stone-300 leading-relaxed">Ensure you have <b>Node.js 18+</b> and <b>JDK 17</b> installed on your computer. If you skip these, build will crash.</p>
                          <button onClick={() => setWizardStep(1)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Next Phase</button>
                        </div>
                      )}

                      {wizardStep === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 1: Clone Your Project</h4>
                          <p className="text-sm text-stone-300">Open VS Code, click "Clone Repository" and paste this URL:</p>
                          <div className="p-4 bg-black rounded-xl border border-white/10 text-emerald-400 font-mono text-xs">https://github.com/vvkkoo4816-art/CalmRelaxFlow</div>
                          <button onClick={() => setWizardStep(2.5)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Cloned & Ready</button>
                        </div>
                      )}

                      {wizardStep === 2.5 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 2.5: The Icon Secret</h4>
                          <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[32px] space-y-4">
                             <p className="text-xs font-black uppercase text-emerald-400">⚠️ MUST TEST BEFORE PROCEEDING</p>
                             <p className="text-[11px] text-white">Click the test link below. If it fails, your build will fail at 44%.</p>
                             <div className="flex items-center space-x-3 bg-black/40 p-4 rounded-2xl border border-white/10">
                               <code className="flex-1 text-[10px] text-emerald-300 truncate">https://calm-relax-flow-vvlt.vercel.app/icon.png</code>
                               <a href="https://calm-relax-flow-vvlt.vercel.app/icon.png" target="_blank" className="p-2 bg-white/10 text-white rounded-lg text-[10px] font-black">TEST LINK</a>
                             </div>
                             <p className="text-[10px] text-stone-400">If TEST LINK shows 404: Place icon.png in VS Code `public/` folder, then git add, commit, and push!</p>
                          </div>
                          <button onClick={() => setWizardStep(2.9)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Icon Verified, Next</button>
                        </div>
                      )}

                      {wizardStep === 2.9 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">Phase 2.9: Generate Your Key</h4>
                          <p className="text-sm text-stone-300 leading-relaxed">Run these commands in your VS Code terminal (PowerShell/CMD):</p>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-[10px] text-stone-400 font-black uppercase">1. Fix Terminal Encoding (Crucial for Windows):</p>
                              <div className="relative group">
                                <code className="block bg-black p-4 rounded-xl text-emerald-300 text-[11px] font-mono border border-white/10">chcp 65001</code>
                                <button onClick={() => copyToClipboard('chcp 65001')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs">📋</button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] text-stone-400 font-black uppercase">2. Generate the Key:</p>
                              <div className="relative group">
                                <code className="block bg-black p-4 rounded-xl text-emerald-300 text-[11px] font-mono border border-white/10 break-all leading-relaxed pr-12">
                                  keytool -genkey -v -keystore android.keystore -alias calmrelaxkey -keyalg RSA -keysize 2048 -validity 10000
                                </code>
                                <button 
                                  onClick={() => copyToClipboard('keytool -genkey -v -keystore android.keystore -alias calmrelaxkey -keyalg RSA -keysize 2048 -validity 10000')}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs"
                                >
                                  📋
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 p-6 bg-red-500/10 rounded-[32px] border border-red-500/20">
                             <p className="text-[10px] font-black uppercase text-red-400">🚨 Troubleshooting "?????":</p>
                             <p className="text-[11px] text-stone-300 leading-relaxed">
                               If you see <b>????????</b>, don't panic! It is simply asking for a <b>Password</b>. 
                               Type your password (e.g., <span className="text-white font-mono">123456</span>) and press Enter. 
                               The screen won't move while you type—this is normal. Do it twice!
                             </p>
                          </div>

                          <button onClick={() => setWizardStep(3)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Key Generated, Build Now</button>
                        </div>
                      )}

                      {wizardStep === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 3: The Build Commands</h4>
                          <div className="space-y-4">
                            <p className="text-xs font-bold text-stone-400">1. Start the session:</p>
                            <code className="block bg-black p-4 rounded-xl text-emerald-400 text-[11px] border border-white/5">npx @bubblewrap/cli init --manifest=https://calm-relax-flow-vvlt.vercel.app/metadata.json</code>
                            <p className="text-xs font-bold text-stone-400">2. Run the build:</p>
                            <code className="block bg-black p-4 rounded-xl text-emerald-400 text-[11px] border border-white/5">npx @bubblewrap/cli build</code>
                          </div>
                          <button onClick={() => setWizardStep(3.5)} className="bg-red-500 px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl shadow-red-500/20">🚨 HELP: Build crashed at 44%</button>
                        </div>
                      )}

                      {wizardStep === 3.5 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5 overflow-y-auto max-h-[500px] pr-2">
                          <h4 className="text-3xl font-black text-red-400 tracking-tighter">Fix: 44% Buffer null Crash</h4>
                          
                          <div className="p-6 bg-red-500/10 border-2 border-red-500/40 rounded-[32px] space-y-4">
                             <p className="text-xs font-black uppercase text-red-400">Why it crashed:</p>
                             <p className="text-[11px] text-white">Bubblewrap couldn't download your icon. Even if you fixed the link, it is still "cached" as broken on your computer.</p>
                             
                             <div className="bg-black p-6 rounded-2xl space-y-6">
                               <div className="space-y-2">
                                 <p className="text-[10px] text-emerald-400 font-bold uppercase">1. Clear the local cache:</p>
                                 <p className="text-[10px] text-stone-400">Paste this command into VS Code terminal and press Enter:</p>
                                 <code className="bg-stone-900 p-3 rounded block text-[11px] text-emerald-300 font-mono">npx @bubblewrap/cli update</code>
                                 <p className="text-[10px] text-stone-500 italic">Select "Yes" when it asks to regenerate the project.</p>
                               </div>

                               <div className="space-y-2">
                                 <p className="text-[10px] text-emerald-400 font-bold uppercase">2. Retry the Build:</p>
                                 <code className="bg-stone-900 p-3 rounded block text-[11px] text-emerald-300 font-mono">npx @bubblewrap/cli build</code>
                               </div>
                             </div>
                          </div>

                          <div className="flex space-x-4 mt-6">
                            <button onClick={() => setWizardStep(3)} className="bg-stone-800 px-8 py-3 rounded-2xl font-black text-xs uppercase">Back to Build</button>
                          </div>
                        </div>
                      )}

                      {wizardStep === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 4: Play Store Upload</h4>
                          <p className="text-sm text-stone-300">Upload <b>app-release-bundle.aab</b> to Google Play Console.</p>
                          <button onClick={() => setWizardStep(5)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Last Step</button>
                        </div>
                      )}

                      {wizardStep === 5 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400">Phase 5: Digital Asset Links</h4>
                          <p className="text-sm text-stone-300">Update `assetlinks.json` with your SHA-256 fingerprint from Google Play.</p>
                          <button onClick={() => setWizardStep(0)} className="bg-stone-800 px-8 py-3 rounded-2xl font-black text-xs uppercase">Restart Wizard</button>
                        </div>
                      )}
                    </div>
                  </section>
                )}
                
                {adminTab === 'content' && (
                  <div className="p-8 bg-white rounded-[40px] shadow-sm border border-stone-100">
                    <h3 className="text-2xl font-black text-stone-800 mb-6">Library Scenarios</h3>
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 border-b border-stone-50">
                        <span className="font-bold">{s.title}</span>
                        <button onClick={() => handleDeleteSession(s.id)} className="text-red-500 text-xs font-black uppercase">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
                
                {adminTab === 'assets' && (
                   <div className="p-8 bg-stone-50 rounded-[40px] border border-stone-200 text-center space-y-8">
                     <h3 className="text-3xl font-black text-stone-900 serif">Icon Studio</h3>
                     <p className="text-stone-500 text-sm max-w-md mx-auto">Generate a high-quality icon for your Android app.</p>
                     {generatedIcon ? (
                       <div className="space-y-4">
                         <img src={generatedIcon} alt="Icon" className="w-48 h-48 rounded-[48px] mx-auto shadow-2xl border-4 border-white" />
                         <button onClick={downloadIcon} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase">Download icon.png</button>
                       </div>
                     ) : (
                       <button onClick={handleGenerateIcon} disabled={isGeneratingIcon} className="bg-stone-900 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs">
                         {isGeneratingIcon ? 'Designing...' : 'Generate New Zen Icon'}
                       </button>
                     )}
                   </div>
                )}
              </div>
            )}
          </div>
        </Layout>
  );
};

export default App;
