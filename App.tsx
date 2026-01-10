
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, ZenCenter, Language } from './types';
import { MEDITATION_SESSIONS, DAILY_MEDITATION, SLEEP_STORIES, QUICK_RELIEF } from './constants';
import { findNearbyZenCenters, generateAppAsset } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'content' | 'status' | 'assets'>('content');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [nearbyCenters, setNearbyCenters] = useState<ZenCenter[]>([]);

  // Asset Debugging State
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<Record<string, any>>({});
  const [localIconOverride, setLocalIconOverride] = useState<string | null>(localStorage.getItem('app_icon_override'));

  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

  const t = translations[lang] || translations['en'];

  const checkAssets = async () => {
    const assetsToTest = [
      { id: 'icon', path: '/icon.png', label: 'Root Icon' },
      { id: 'icon_alt', path: '/public/icon.png', label: 'Public Subfolder Icon' },
      { id: 'icon1', path: '/icon1.png', label: 'Secondary Icon' },
      { id: 'manifest', path: '/metadata.json', label: 'Manifest' }
    ];

    const results: Record<string, any> = {};

    await Promise.all(assetsToTest.map(async (asset) => {
      try {
        const res = await fetch(`${asset.path}?t=${Date.now()}`);
        const contentType = res.headers.get('Content-Type') || 'unknown';
        const size = res.headers.get('Content-Length') || 'unknown';
        
        results[asset.id] = {
          label: asset.label,
          path: asset.path,
          ok: res.ok,
          status: res.status,
          type: contentType,
          size: size,
          isImage: contentType.includes('image'),
          isHtml: contentType.includes('text/html')
        };
      } catch (e) {
        results[asset.id] = { label: asset.label, ok: false, status: 'Error', path: asset.path };
      }
    }));

    setHealthStatus(results);
    setLastScanned(new Date().toLocaleTimeString());
  };

  const handleLocalIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLocalIconOverride(base64);
        localStorage.setItem('app_icon_override', base64);
        alert("Success! The app will now use this uploaded image instead of the broken server link.");
      };
      reader.readAsDataURL(file);
    }
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
      } catch (e) { setSessions(MEDITATION_SESSIONS); }
    } else { setSessions(MEDITATION_SESSIONS); }

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

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('calmrelax_active_user');
    setView('today');
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
          {localIconOverride ? (
            <img src={localIconOverride} className="w-full h-full rounded-[28px] object-cover" alt="icon" />
          ) : (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          )}
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
                <h2 className="text-3xl font-black serif text-stone-900">Admin Panel</h2>
                <button onClick={handleLogout} className="text-red-500 text-[10px] font-black uppercase tracking-widest underline underline-offset-4">Log Out</button>
             </header>

             <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                <button onClick={() => setAdminTab('content')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'content' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>Content</button>
                <button onClick={() => setAdminTab('status')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'status' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>System Health</button>
             </div>

             {adminTab === 'status' && (
                <div className="space-y-6">
                  {/* Local Override Tool */}
                  <div className="p-8 bg-emerald-500 rounded-[44px] text-white space-y-4 shadow-2xl shadow-emerald-100">
                    <h3 className="text-xl font-black serif">Bypass Broken Icons</h3>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80 uppercase tracking-wider">If your server icons are broken, upload a local file here. The app will use this instead of the URL.</p>
                    <div className="relative">
                      <input type="file" accept="image/png" onChange={handleLocalIconUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="w-full py-4 bg-white/20 rounded-2xl border-2 border-dashed border-white/40 flex items-center justify-center font-black uppercase text-[10px] tracking-widest">
                        {localIconOverride ? 'Change Local Override' : 'Upload Local icon.png'}
                      </div>
                    </div>
                    {localIconOverride && (
                      <button onClick={() => { setLocalIconOverride(null); localStorage.removeItem('app_icon_override'); }} className="text-[10px] font-black uppercase underline">Remove Override</button>
                    )}
                  </div>

                  <div className="bg-white p-8 rounded-[44px] border border-stone-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-black serif text-stone-800">Surgical Asset Scanner</h3>
                      <button onClick={checkAssets} className="text-emerald-500 text-[10px] font-black uppercase">Re-Scan</button>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(healthStatus).map(([id, info]: [string, any]) => (
                        <div key={id} className={`p-5 rounded-3xl border transition-all ${info.isHtml ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-100'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-sm text-stone-800">{info.label}</p>
                              <p className="text-[9px] text-stone-400 font-mono">{info.path}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${info.ok && !info.isHtml ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                              {info.ok && !info.isHtml ? 'VERIFIED' : 'FAILED'}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                            <div>Type: <span className={info.isHtml ? 'text-red-600' : 'text-stone-600'}>{info.type}</span></div>
                            <div>HTTP: <span className="text-stone-600">{info.status}</span></div>
                          </div>

                          {info.isHtml && (
                            <div className="mt-4 p-3 bg-red-100 rounded-xl text-[10px] font-bold text-red-700 leading-tight">
                              CRITICAL ERROR: The server is sending a Webpage (HTML) instead of an Image. 
                              Check your "public" folder path.
                            </div>
                          )}

                          {info.ok && !info.isHtml && (
                            <div className="mt-4 flex items-center space-x-4">
                              <div className="w-12 h-12 bg-white rounded-xl border border-stone-200 overflow-hidden">
                                <img src={`${info.path}?t=${Date.now()}`} className="w-full h-full object-contain" alt="preview" />
                              </div>
                              <p className="text-[10px] text-emerald-600 font-black">Browser Successfully Rendered This Asset</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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

export default App;
