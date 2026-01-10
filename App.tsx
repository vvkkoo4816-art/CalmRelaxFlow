
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, ZenCenter, Language } from './types';
import { MEDITATION_SESSIONS, DAILY_MEDITATION, SLEEP_STORIES, QUICK_RELIEF } from './constants';
import { getPersonalizedRecommendation, findNearbyZenCenters, generateAppAsset } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'content' | 'status' | 'assets'>('content');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const t = translations[lang] || translations['en'];

  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [nearbyCenters, setNearbyCenters] = useState<ZenCenter[]>([]);
  
  // Advanced Health Check State
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<Record<string, {
    status: 'checking' | 'ok' | 'fail' | 'wrong_type',
    mimeType?: string
  }>>({
    icon: { status: 'checking' },
    icon1: { status: 'checking' },
    manifest: { status: 'checking' },
    assetlinks: { status: 'checking' }
  });

  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

  const checkAssets = async () => {
    setHealthStatus({
      icon: { status: 'checking' },
      icon1: { status: 'checking' },
      manifest: { status: 'checking' },
      assetlinks: { status: 'checking' }
    });
    
    const verify = async (path: string) => {
      try {
        const res = await fetch(`${path}?t=${Date.now()}`);
        if (!res.ok) return { status: 'fail' as const };
        
        const contentType = res.headers.get('Content-Type') || '';
        
        // If we expect an image but get HTML, it's a false positive (SPA routing error)
        if (path.endsWith('.png') && contentType.includes('text/html')) {
          return { status: 'wrong_type' as const, mimeType: contentType };
        }
        
        return { status: 'ok' as const, mimeType: contentType };
      } catch (e) {
        return { status: 'fail' as const };
      }
    };

    const [iconRes, icon1Res, manifestRes, assetlinksRes] = await Promise.all([
      verify('/icon.png'),
      verify('/icon1.png'),
      verify('/metadata.json'),
      verify('/.well-known/assetlinks.json')
    ]);

    setHealthStatus({
      icon: iconRes,
      icon1: icon1Res,
      manifest: manifestRes,
      assetlinks: assetlinksRes
    });
    setLastScanned(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    if (view === 'admin' && adminTab === 'status') {
      checkAssets();
    }
  }, [view, adminTab]);

  useEffect(() => {
    const savedSessions = localStorage.getItem('calmrelax_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(Array.isArray(parsed) && parsed.length > 0 ? parsed : MEDITATION_SESSIONS);
      } catch (e) {
        setSessions(MEDITATION_SESSIONS);
      }
    } else {
      setSessions(MEDITATION_SESSIONS);
    }

    const savedUser = localStorage.getItem('calmrelax_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.email) {
          setUser(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('calmrelax_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('calmrelax_active_user');
    setView('today');
  };

  const completeLogin = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === 'vvkkoo4816@gmail.com';
    const loggedUser: User = {
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
    localStorage.setItem('calmrelax_active_user', JSON.stringify(loggedUser));
  };

  const handleGenerateIcon = async () => {
    setIsGeneratingIcon(true);
    try {
      const icon = await generateAppAsset('icon');
      if (icon) setGeneratedIcon(icon);
    } catch (e) {
      console.error("Failed to generate icon:", e);
    } finally {
      setIsGeneratingIcon(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
            <div className="bg-white w-full rounded-[40px] p-10 shadow-2xl flex flex-col items-center animate-in zoom-in-95">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-10 h-10 mb-8" />
              <h2 className="text-xl font-black mb-2 serif">Sign In</h2>
              <p className="text-xs text-stone-400 mb-10 uppercase tracking-widest font-black">Secure Member Access</p>
              <button onClick={() => completeLogin('vvkkoo4816@gmail.com')} className="w-full p-5 rounded-3xl border border-stone-100 bg-stone-50 hover:bg-stone-100 flex items-center space-x-4 mb-4 transition-all active:scale-95">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200">V</div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold">vvkkoo4816@gmail.com</p>
                  <p className="text-[9px] text-emerald-600 font-black uppercase">Administrator</p>
                </div>
                <div className="text-stone-300">➜</div>
              </button>
              <button onClick={() => setShowLoginModal(false)} className="text-stone-400 text-[10px] font-black uppercase mt-8 tracking-widest">Cancel</button>
            </div>
          </div>
        )}
        <div className="w-20 h-20 bg-emerald-500 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl relative z-10 animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <h1 className="text-5xl font-extrabold serif mb-4 tracking-tighter relative z-10 text-stone-900">CalmRelax</h1>
        <p className="text-stone-500 text-sm font-medium mb-16 relative z-10 max-w-[240px] leading-relaxed">Personalized paths to a calmer, more mindful you.</p>
        <button onClick={() => setShowLoginModal(true)} className="w-full max-w-[300px] bg-stone-900 text-white py-6 rounded-[32px] font-black shadow-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all relative z-10">
          <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
          <span className="uppercase text-xs tracking-widest">Sign in with Google</span>
        </button>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="w-full animate-in fade-in duration-700">
        {view === 'today' && (
          <div className="space-y-12">
            <header className="flex justify-between items-end">
              <div>
                <p className="text-stone-400 font-black text-[10px] uppercase tracking-widest mb-1">{t.welcome_back}</p>
                <h2 className="text-3xl font-extrabold serif text-stone-900">{t.hey}, {user.name}</h2>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="text-xs">🔥</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase">3 Day Streak</span>
              </div>
            </header>

            <section className="relative h-80 rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setActiveSession(sessions.find(s => s.category === 'Daily') || DAILY_MEDITATION)}>
              <img src={(sessions.find(s => s.category === 'Daily') || DAILY_MEDITATION).imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="daily zen" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <span className="px-3 py-1 bg-emerald-500 rounded-full text-[9px] font-black text-white uppercase tracking-widest mb-3 inline-block shadow-lg">Daily Zen Session</span>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">{(sessions.find(s => s.category === 'Daily') || DAILY_MEDITATION).title}</h3>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-2xl transition-all active:scale-90">
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-10 pb-12">
             <header className="flex justify-between items-center">
                <h2 className="text-3xl font-black serif text-stone-900">Admin</h2>
                <button onClick={handleLogout} className="text-red-500 text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Log Out</button>
             </header>

             <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                <button onClick={() => setAdminTab('content')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'content' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>Content Feed</button>
                <button onClick={() => setAdminTab('status')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'status' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>App Health</button>
                <button onClick={() => setAdminTab('assets')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'assets' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>Asset Studio</button>
             </div>

             {adminTab === 'status' && (
                <div className="space-y-6">
                  <div className="p-8 bg-stone-900 rounded-[44px] text-center text-white space-y-4 shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20">✓</div>
                    <h3 className="text-xl font-black serif">App Diagnostics</h3>
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-black">Last Scanned: {lastScanned || 'Never'}</p>
                  </div>
                  
                  <div className="bg-white p-8 rounded-[44px] border border-stone-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-4">
                      <h3 className="text-lg font-black serif text-stone-800">Advanced Asset Scanner</h3>
                      <button onClick={checkAssets} className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Refresh Now</button>
                    </div>
                    
                    <div className="space-y-4">
                      <HealthRow label="icon.png" data={healthStatus.icon} path="/icon.png" description="PWA Icon (PNG Required)" />
                      <HealthRow label="icon1.png" data={healthStatus.icon1} path="/icon1.png" description="Secondary Logo" />
                      <HealthRow label="metadata.json" data={healthStatus.manifest} path="/metadata.json" description="App Config" />
                      <HealthRow label="assetlinks.json" data={healthStatus.assetlinks} path="/.well-known/assetlinks.json" description="Play Store Key" />
                    </div>

                    <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 space-y-3">
                      <h4 className="font-bold text-red-900 text-sm">Crucial Fix Guide</h4>
                      <p className="text-[11px] text-red-700 leading-relaxed">
                        If an icon shows <strong>"Wrong Type (HTML)"</strong>, your server is returning a webpage instead of an image. This happens if you haven't put the file in the <code>public</code> folder.
                      </p>
                      <ul className="text-[11px] text-red-800 space-y-1 font-bold">
                        <li>1. Create a folder named <code>public</code> at the project root.</li>
                        <li>2. Move your <code>icon.png</code> and <code>icon1.png</code> inside it.</li>
                        <li>3. Git add, commit, and push to Vercel.</li>
                      </ul>
                    </div>
                  </div>
                </div>
             )}

             {adminTab === 'assets' && (
               <div className="p-10 bg-white rounded-[50px] border border-stone-100 text-center space-y-10 shadow-sm">
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black serif text-stone-900">AI Icon Studio</h3>
                   <p className="text-stone-400 text-[11px]">Generate a high-res PWA logo.</p>
                 </div>
                 {generatedIcon ? (
                   <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                     <img src={generatedIcon} className="w-56 h-56 rounded-[64px] shadow-2xl border-4 border-white mx-auto" alt="generated" />
                     <button onClick={() => {
                        const link = document.createElement('a'); link.href = generatedIcon; link.download = 'icon.png'; link.click();
                     }} className="w-full py-5 bg-emerald-500 text-white rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-xl">Download for /public</button>
                     <button onClick={handleGenerateIcon} className="text-stone-300 text-[10px] font-black uppercase">Try Again</button>
                   </div>
                 ) : (
                    <button onClick={handleGenerateIcon} disabled={isGeneratingIcon} className="w-full py-20 border-4 border-dashed border-stone-100 rounded-[50px] bg-stone-50/30 transition-all flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl">{isGeneratingIcon ? '⏳' : '🎨'}</div>
                      <p className="mt-6 text-[11px] font-black uppercase text-stone-400 tracking-widest">{isGeneratingIcon ? 'Designing...' : 'Generate Icon'}</p>
                    </button>
                 )}
               </div>
             )}
          </div>
        )}
      </div>

      {activeSession && (
        <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />
      )}
    </Layout>
  );
};

// Sub-component for health check rows with visual preview
const HealthRow = ({ label, data, path, description }: { label: string, data: any, path: string, description: string }) => {
  const { status, mimeType } = data;
  const isOk = status === 'ok';
  const isPending = status === 'checking';
  const isWrong = status === 'wrong_type';
  
  return (
    <div className={`flex flex-col p-4 rounded-2xl border transition-all ${isWrong ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100 shadow-sm'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {label.endsWith('.png') && (
             <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden flex items-center justify-center border border-stone-200 shrink-0">
               {isOk ? <img src={path} className="w-full h-full object-cover" alt="preview" /> : <span className="text-xs">?</span>}
             </div>
          )}
          <div className="min-w-0 pr-4">
            <p className={`font-bold text-sm truncate ${isOk ? 'text-stone-800' : 'text-stone-400'}`}>{label}</p>
            <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className={`text-[9px] font-black uppercase tracking-widest ${isOk ? 'text-emerald-500' : isWrong ? 'text-amber-600' : isPending ? 'text-stone-300' : 'text-red-500'}`}>
              {isPending ? 'Pinging...' : isOk ? 'Found' : isWrong ? 'False Positive' : 'Not Found'}
            </p>
            {isWrong && <p className="text-[8px] text-amber-500 font-bold uppercase">MIME: HTML (Code)</p>}
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-sm transition-all duration-500 ${isOk ? 'bg-emerald-500' : isWrong ? 'bg-amber-500' : isPending ? 'bg-stone-200' : 'bg-red-500'}`}>
            {isPending ? '...' : isOk ? '✓' : isWrong ? '!' : '✕'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
