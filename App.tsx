
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import { AppView, User, MeditationSession, Language } from './types';
import { DAILY_MEDITATION } from './constants';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  
  // Diagnostic state
  const [imgStatus, setImgStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const [imgError, setImgError] = useState<string | null>(null);

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
  }, []);

  const validateIcon = () => {
    setImgStatus('loading');
    const img = new Image();
    // Cache bust to ensure we see the latest server version
    const testUrl = `/icon.png?t=${Date.now()}`;
    
    img.onload = () => setImgStatus('ok');
    img.onerror = () => {
      setImgStatus('fail');
      setImgError("The server found the file but it's not a valid image (likely it's sending HTML text instead). Check your Netlify deployment logs.");
    };
    img.src = testUrl;
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
        <h1 className="text-4xl font-black serif mb-4">CalmRelaxFlow</h1>
        <p className="text-stone-400 text-sm mb-12">Asset Debug Mode</p>
        <button onClick={loginAsAdmin} className="bg-emerald-500 text-white px-12 py-5 rounded-[32px] font-black shadow-2xl shadow-emerald-100">Enter Admin Repair</button>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto space-y-12 pb-24">
        {view === 'admin' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black serif">Icon Live Preview</h2>
              <button onClick={validateIcon} className="bg-stone-100 px-4 py-2 rounded-full text-[10px] font-black uppercase">Refresh Check</button>
            </header>

            <div className="bg-white p-10 rounded-[56px] border border-stone-100 shadow-xl text-center">
              <div className="mb-8 relative mx-auto w-48 h-48">
                {/* This actually tries to load the image from your server */}
                <img 
                  src={`/icon.png?t=${Date.now()}`} 
                  className={`w-full h-full rounded-[48px] shadow-2xl object-cover transition-opacity duration-500 ${imgStatus === 'ok' ? 'opacity-100' : 'opacity-20'}`}
                  onLoad={() => setImgStatus('ok')}
                  onError={() => setImgStatus('fail')}
                  alt="Server Icon"
                />
                {imgStatus === 'fail' && (
                  <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-xs p-4 bg-red-50 rounded-[48px]">
                    Image Broken
                  </div>
                )}
                {imgStatus === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-3xl border ${imgStatus === 'ok' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <h3 className={`font-black text-sm uppercase mb-1 ${imgStatus === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {imgStatus === 'ok' ? '✓ Icon is Live' : '✗ Icon is Blocked'}
                </h3>
                <p className="text-[11px] opacity-70 font-medium">
                  {imgStatus === 'ok' 
                    ? "Great! Netlify is correctly serving the image. You can now proceed with your app build." 
                    : imgError || "The file exists in your project but the server is returning a 404 or a redirect."}
                </p>
              </div>
            </div>

            <div className="bg-stone-900 text-white p-8 rounded-[48px] space-y-4">
              <h4 className="font-black text-emerald-400 serif">Manual Verification Link:</h4>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Open this in a new tab: <br/>
                <a href="/icon.png" target="_blank" className="underline font-mono text-emerald-300">https://calmrelaxflow.netlify.app/icon.png</a>
              </p>
              <p className="text-[10px] text-stone-400">
                If the link above shows your Buddha image, everything is fixed. If it shows your website home page, Netlify is still misconfigured.
              </p>
            </div>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-12 py-10">
            <h2 className="text-4xl font-black serif">Path to Peace</h2>
            <div className="aspect-video bg-emerald-500 rounded-[56px] relative overflow-hidden shadow-2xl border-8 border-white cursor-pointer" onClick={() => setActiveSession(DAILY_MEDITATION)}>
              <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="daily" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2">Today's Session</p>
                <h3 className="text-3xl font-black text-white serif">{DAILY_MEDITATION.title}</h3>
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
