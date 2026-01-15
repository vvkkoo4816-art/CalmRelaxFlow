
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import { AppView, User, MeditationSession, Language } from './types';
import { DAILY_MEDITATION } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  
  // Diagnostic state
  const [imgStatus, setImgStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('Initializing diagnostics...');

  useEffect(() => {
    const savedUser = localStorage.getItem('calmrelax_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.isLoggedIn) {
          setUser(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {}
    }
    validateIcon();
  }, []);

  const validateIcon = async () => {
    setImgStatus('loading');
    setDiagnosticInfo("Checking asset availability at /icon.png...");
    
    // Check if we are running in a known problematic environment (like a preview or redirect loop)
    if (window.location.href.includes('404')) {
      setDiagnosticInfo("WARNING: Current URL contains '404'. You might be trapped in a redirect loop.");
    }

    try {
      // Use a cache-busting query parameter to ensure we get the latest from the server
      const response = await fetch(`/icon.png?v=${Date.now()}`, { 
        method: 'HEAD', // Just check headers first
        cache: 'no-store' 
      });
      
      const contentType = response.headers.get('Content-Type');
      
      if (response.ok && contentType?.includes('image')) {
        setImgStatus('ok');
        setDiagnosticInfo(`Success! Server returned a valid image (${contentType}). The asset is live.`);
      } else if (contentType?.includes('text/html')) {
        setImgStatus('fail');
        const text = await (await fetch('/icon.png')).text();
        const isIndexHtml = text.includes('<html') || text.includes('<!DOCTYPE');
        if (isIndexHtml) {
          setDiagnosticInfo("CRITICAL ERROR: The server is returning the Website (HTML) instead of the Image. This happens when the image file is missing from the 'public' folder or 'dist' folder on the server.");
        } else {
          setDiagnosticInfo(`ERROR: Server returned HTML (possible 404 page). Check if 'public/icon.png' exists.`);
        }
      } else {
        setImgStatus('fail');
        setDiagnosticInfo(`FAILED: Server responded with status ${response.status} and type ${contentType || 'unknown'}.`);
      }
    } catch (e) {
      setImgStatus('fail');
      setDiagnosticInfo("NETWORK ERROR: The app cannot reach /icon.png. Ensure the file is in the 'public' directory.");
    }
  };

  const loginAsAdmin = () => {
    const adminUser: User = {
      id: "admin-1",
      name: "Zen Master",
      email: "vvkkoo4816@gmail.com",
      photoUrl: "https://ui-avatars.com/api/?name=Zen+Master&background=10b981&color=fff",
      isLoggedIn: true, streak: 15, minutesMeditated: 1240, role: 'admin'
    };
    setUser(adminUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(adminUser));
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mb-8 animate-pulse">
           <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <h1 className="text-4xl font-black serif mb-2">CalmRelaxFlow</h1>
        <p className="text-stone-400 text-xs mb-12 uppercase tracking-[0.2em] font-bold">Maintenance & Diagnostics</p>
        
        <div className="space-y-4 w-full max-w-sm">
          <button onClick={loginAsAdmin} className="w-full bg-emerald-500 text-white px-8 py-5 rounded-[24px] font-black shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Enter Dashboard
          </button>
          <button onClick={validateIcon} className="w-full bg-stone-50 text-stone-500 px-8 py-4 rounded-[24px] font-bold text-sm border border-stone-100">
            Check Asset Health
          </button>
        </div>
        
        <div className="mt-12 text-[10px] text-stone-300 font-mono max-w-xs break-all">
          {diagnosticInfo}
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto space-y-12 pb-24">
        {view === 'admin' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black serif">System Health</h2>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Asset Synchronization Check</p>
              </div>
              <button onClick={validateIcon} className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">Run Scan</button>
            </header>

            <div className="bg-white p-10 rounded-[56px] border border-stone-100 shadow-xl text-center">
              <div className="mb-8 relative mx-auto w-56 h-56 bg-stone-50 rounded-[56px] overflow-hidden flex items-center justify-center border-8 border-stone-50 shadow-inner">
                {imgStatus === 'ok' ? (
                  <img 
                    src={`/icon.png?t=${Date.now()}`} 
                    className="w-full h-full object-cover"
                    alt="Server Icon"
                    onError={() => {
                      setImgStatus('fail');
                      setDiagnosticInfo("Image tag failed to load the source. The file is likely corrupted or not a valid PNG.");
                    }}
                  />
                ) : (
                  <div className="text-red-400 flex flex-col items-center">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <span className="font-black text-[10px] uppercase tracking-tighter px-8">Missing Asset</span>
                  </div>
                )}
                {imgStatus === 'loading' && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-[32px] border text-left transition-colors ${imgStatus === 'ok' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-2 h-2 rounded-full ${imgStatus === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <h3 className={`font-black text-[10px] uppercase tracking-widest ${imgStatus === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {imgStatus === 'ok' ? 'Network Reachable' : 'Asset Unreachable'}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed font-bold opacity-80 font-mono text-stone-600 bg-white/50 p-3 rounded-xl border border-stone-100/50">
                  {diagnosticInfo}
                </p>
              </div>
            </div>

            <div className="bg-stone-900 text-white p-10 rounded-[56px] space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 text-stone-900">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <div>
                  <h4 className="font-black text-emerald-400 serif text-xl mb-3">Action Required</h4>
                  <p className="text-sm opacity-70 leading-relaxed font-medium">
                    If the image above is still broken, it's likely because the file <span className="text-emerald-300">icon.png</span> was not properly included in the project's <span className="text-emerald-300">public</span> folder before deploying.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <span className="block text-[10px] font-black text-emerald-500 uppercase mb-2">Step 1</span>
                    <p className="text-[11px] font-bold opacity-80">Verify <code className="bg-black/20 px-1 rounded">public/icon.png</code> is present in your code editor.</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <span className="block text-[10px] font-black text-emerald-500 uppercase mb-2">Step 2</span>
                    <p className="text-[11px] font-bold opacity-80">Re-deploy to Netlify to ensure the asset is uploaded.</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-12 py-10">
            <h2 className="text-4xl font-black serif">Path to Peace</h2>
            <div className="aspect-video bg-emerald-500 rounded-[56px] relative overflow-hidden shadow-2xl border-8 border-white cursor-pointer group" onClick={() => setActiveSession(DAILY_MEDITATION)}>
              <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" alt="daily" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2">Today's Session</p>
                <h3 className="text-3xl font-black text-white serif">{DAILY_MEDITATION.title}</h3>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;
