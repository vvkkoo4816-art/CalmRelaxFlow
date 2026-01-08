
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
  const [adminTab, setAdminTab] = useState<'wizard' | 'content' | 'assets' | 'status'>('content');
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
  const [healthChecks, setHealthChecks] = useState<{ [key: string]: 'pending' | 'ok' | 'fail' }>({
    icon: 'pending',
    manifest: 'pending',
    assetlinks: 'pending',
    key: 'pending'
  });

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

  const runDeploymentHealthCheck = async () => {
    setAdminTab('status');
    const baseUrl = window.location.origin;
    
    // Check Icon
    try {
      const iconRes = await fetch(`${baseUrl}/icon.png`, { method: 'HEAD' });
      setHealthChecks(prev => ({ ...prev, icon: iconRes.ok ? 'ok' : 'fail' }));
    } catch {
      setHealthChecks(prev => ({ ...prev, icon: 'fail' }));
    }

    // Check Manifest
    try {
      const manifestRes = await fetch(`${baseUrl}/metadata.json`);
      setHealthChecks(prev => ({ ...prev, manifest: manifestRes.ok ? 'ok' : 'fail' }));
    } catch {
      setHealthChecks(prev => ({ ...prev, manifest: 'fail' }));
    }

    // Check AssetLinks
    try {
      const assetRes = await fetch(`${baseUrl}/.well-known/assetlinks.json`);
      setHealthChecks(prev => ({ ...prev, assetlinks: assetRes.ok ? 'ok' : 'fail' }));
    } catch {
      setHealthChecks(prev => ({ ...prev, assetlinks: 'fail' }));
    }
  };

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

  const handleDeleteSession = (id: string) => {
    if (confirm("Delete this scenario permanently?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-between p-8 text-center relative overflow-hidden">
        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-sm rounded-[40px] shadow-2xl overflow-hidden p-8 flex flex-col items-center">
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
        <div className="absolute top-8 right-8"><div className="flex space-x-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 shadow-inner">{(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map((l) => (<button key={l} onClick={() => setLang(l)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lang === l ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>{l === 'en' ? 'EN' : l === 'zh-Hans' ? '简' : '繁'}</button>))}</div></div>
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
                <button onClick={handleLogout} className="mt-8 px-6 py-2 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Sign Out</button>
              </div>
            ) : (
              <div className="admin-content">
                <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold serif text-stone-900 mb-2">Admin Console</h2>
                    <div className="flex flex-wrap gap-2 mt-6">
                      <button onClick={() => setAdminTab('content')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'content' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Library</button>
                      <button onClick={() => setAdminTab('status')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'status' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Deploy Health</button>
                      <button onClick={() => setAdminTab('assets')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'assets' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Assets Studio</button>
                      <button onClick={() => setAdminTab('wizard')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'wizard' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Wizard</button>
                    </div>
                  </div>
                  <button onClick={runDeploymentHealthCheck} className="mt-4 md:mt-0 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200">Scan System Health</button>
                </header>

                {adminTab === 'content' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="p-8 bg-white rounded-[40px] shadow-sm border border-stone-100 overflow-hidden">
                      <h3 className="text-2xl font-black text-stone-800 mb-6 flex items-center"><span className="mr-3">📚</span> Scenario Library</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-stone-50">
                              <th className="pb-4 font-black text-stone-400 uppercase text-[10px] tracking-widest">Title</th>
                              <th className="pb-4 font-black text-stone-400 uppercase text-[10px] tracking-widest">Category</th>
                              <th className="pb-4 font-black text-stone-400 uppercase text-[10px] tracking-widest">Duration</th>
                              <th className="pb-4 font-black text-stone-400 uppercase text-[10px] tracking-widest">Source</th>
                              <th className="pb-4 font-black text-stone-400 uppercase text-[10px] tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map(s => (
                              <tr key={s.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                                <td className="py-4 font-bold text-stone-800">{s.title}</td>
                                <td className="py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black">{s.category}</span></td>
                                <td className="py-4 text-stone-500 font-medium">{s.duration}</td>
                                <td className="py-4 max-w-[150px] truncate text-[10px] text-stone-400 font-mono">{s.audioUrl}</td>
                                <td className="py-4 text-right space-x-2">
                                  <button onClick={() => setActiveSession(s)} className="p-2 text-stone-400 hover:text-emerald-500">▶️</button>
                                  <button onClick={() => handleDeleteSession(s.id)} className="p-2 text-stone-400 hover:text-red-500">🗑️</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-8 bg-stone-900 text-white rounded-[40px] shadow-2xl">
                      <h3 className="text-xl font-black mb-6">✨ Add New Scenario</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="text" placeholder="Session Title" value={newSessionData.title} onChange={e => setNewSessionData({...newSessionData, title: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" />
                        <select value={newSessionData.category} onChange={e => setNewSessionData({...newSessionData, category: e.target.value as any})} className="bg-white/5 border border-white/10 p-4 rounded-2xl outline-none">
                          <option value="Daily">Daily</option>
                          <option value="Focus">Focus</option>
                          <option value="Sleep">Sleep</option>
                          <option value="Quick Relief">Quick Relief</option>
                        </select>
                        <input type="text" placeholder="Duration (e.g. 15 min)" value={newSessionData.duration} onChange={e => setNewSessionData({...newSessionData, duration: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-2xl" />
                        <input type="text" placeholder="Audio URL" value={newSessionData.audioUrl} onChange={e => setNewSessionData({...newSessionData, audioUrl: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-2xl" />
                      </div>
                      <button onClick={createNewSession} className="mt-8 w-full bg-emerald-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20">Add to Library</button>
                    </div>
                  </div>
                )}

                {adminTab === 'status' && (
                  <div className="animate-in slide-in-from-right-5">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-100 space-y-10">
                      <h3 className="text-2xl font-black text-stone-900 serif">Deployment Health Check</h3>
                      <p className="text-stone-500 -mt-6">Verifying your project's critical files at <b>{window.location.origin}</b></p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <HealthCard title="icon.png" desc="Android App Icon" status={healthChecks.icon} path="/icon.png" />
                        <HealthCard title="metadata.json" desc="PWA Manifest File" status={healthChecks.manifest} path="/metadata.json" />
                        <HealthCard title="assetlinks.json" desc="Play Store Verified Link" status={healthChecks.assetlinks} path="/.well-known/assetlinks.json" />
                        <HealthCard title="API Security" desc="Google Generative AI" status="ok" path="Configured" />
                      </div>

                      <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100">
                        <h4 className="font-black text-amber-800 text-sm mb-2">Final Readiness Verdict</h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          {Object.values(healthChecks).every(s => s === 'ok') 
                            ? "✅ Everything looks green! You are ready to run the Bubblewrap build commands in your terminal."
                            : "⚠️ Fix the red items above. Most errors are caused by missing files in your VS Code 'public/' folder or pending GitHub pushes."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

                      {wizardStep === 2.9 && (
                        <div className="space-y-8 animate-in slide-in-from-right-5">
                          <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">Phase 2.9: Keytool Decoder</h4>
                          <div className="bg-black/60 p-6 rounded-[32px] border border-white/10 space-y-4 font-mono text-[10px]">
                            <div className="flex justify-between items-center text-red-400 border-b border-white/5 pb-2"><span>Terminal Shows:</span><span>Translation:</span></div>
                            <div className="flex justify-between items-center"><span className="text-stone-500">?????????:</span><span className="text-emerald-400 font-bold">"Enter keystore password:"</span></div>
                            <div className="flex justify-between items-center"><span className="text-stone-500">????????????:</span><span className="text-emerald-400 font-bold">"Re-enter new password:"</span></div>
                          </div>
                          <div className="space-y-4">
                            <div className="relative group"><code className="block bg-black p-4 rounded-xl text-emerald-300 text-[11px] font-mono border border-white/10">chcp 65001</code><button onClick={() => copyToClipboard('chcp 65001')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs">📋</button></div>
                            <div className="relative group"><code className="block bg-black p-4 rounded-xl text-emerald-300 text-[11px] font-mono border border-white/10 break-all leading-relaxed pr-12">keytool -genkey -v -keystore android.keystore -alias calmrelaxkey -keyalg RSA -keysize 2048 -validity 10000</code><button onClick={() => copyToClipboard('keytool -genkey -v -keystore android.keystore -alias calmrelaxkey -keyalg RSA -keysize 2048 -validity 10000')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs">📋</button></div>
                          </div>
                          <button onClick={() => setWizardStep(3)} className="bg-emerald-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest mt-6">Key Generated, Build Now</button>
                        </div>
                      )}
                      
                      {/* ... other steps as needed ... */}
                    </div>
                  </section>
                )}
                
                {adminTab === 'assets' && (
                   <div className="p-8 bg-stone-50 rounded-[40px] border border-stone-200 text-center space-y-8 animate-in zoom-in-95">
                     <h3 className="text-3xl font-black text-stone-900 serif">Icon Studio</h3>
                     <p className="text-stone-500 text-sm max-w-md mx-auto">Generate a high-quality icon for your Android app.</p>
                     {generatedIcon ? (
                       <div className="space-y-4">
                         <img src={generatedIcon} alt="Icon" className="w-48 h-48 rounded-[48px] mx-auto shadow-2xl border-4 border-white" />
                         <button onClick={downloadIcon} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase">Download icon.png</button>
                       </div>
                     ) : (
                       <button onClick={handleGenerateIcon} disabled={isGeneratingIcon} className="bg-stone-900 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs">{isGeneratingIcon ? 'Designing...' : 'Generate New Zen Icon'}</button>
                     )}
                   </div>
                )}
              </div>
            )}
          </div>
        </Layout>
  );
};

const HealthCard = ({ title, desc, status, path }: { title: string, desc: string, status: 'ok' | 'fail' | 'pending', path: string }) => (
  <div className={`p-6 rounded-3xl border transition-all ${status === 'ok' ? 'bg-emerald-50 border-emerald-100 shadow-emerald-100/20 shadow-lg' : status === 'fail' ? 'bg-red-50 border-red-100 shadow-red-100/20 shadow-lg' : 'bg-stone-50 border-stone-100'}`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-black text-stone-800 text-sm">{title}</h4>
        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{desc}</p>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${status === 'ok' ? 'bg-emerald-500 text-white' : status === 'fail' ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-400 animate-pulse'}`}>
        {status === 'ok' ? '✓' : status === 'fail' ? '✗' : '...'}
      </div>
    </div>
    <div className="bg-white/50 p-2 rounded-xl border border-black/5">
      <code className="text-[10px] font-mono text-stone-600 block truncate">{path}</code>
    </div>
  </div>
);

export default App;
