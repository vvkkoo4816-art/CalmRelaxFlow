
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import { AppView, User, MeditationSession, Language } from './types';
import { DAILY_MEDITATION } from './constants';
import { getPersonalizedRecommendation } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'status' | 'playstore' | 'studio'>('status');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [assetHealth, setAssetHealth] = useState<Record<string, any>>({});
  const [isChecking, setIsChecking] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = translations[lang] || translations['en'];

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
    checkAssetIntegrity();
  }, []);

  const checkAssetIntegrity = async () => {
    setIsChecking(true);
    const targets = ['/icon.png', '/manifest.json'];
    const results: Record<string, any> = {};

    for (const path of targets) {
      try {
        const res = await fetch(window.location.origin + path, { cache: 'no-store' });
        const text = await res.clone().text();
        const isHtml = text.trim().toLowerCase().startsWith('<html') || text.trim().toLowerCase().startsWith('<!doctype');
        
        results[path] = {
          ok: res.ok && !isHtml,
          status: isHtml ? "FAKE (HTML Content)" : (res.ok ? "REAL IMAGE" : "MISSING (404)"),
          details: isHtml ? "Your server is sending a webpage instead of an image. Bubblewrap will fail." : "File is valid.",
          color: isHtml ? 'text-red-500' : (res.ok ? 'text-emerald-500' : 'text-amber-500')
        };
      } catch (e) {
        results[path] = { ok: false, status: 'Error', details: "Network failure.", color: 'text-red-500' };
      }
    }
    setAssetHealth(results);
    setIsChecking(false);
  };

  const generateEmergencyIcon = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#10B981';
    ctx.fillRect(0, 0, 512, 512);

    // Zen Circle (Ensō)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(256, 256, 160, 0, Math.PI * 1.8);
    ctx.stroke();

    // Human silhouette
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(256, 200, 40, 0, Math.PI * 2); // Head
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(256, 300, 60, 80, 0, 0, Math.PI * 2); // Body
    ctx.fill();

    const link = document.createElement('a');
    link.download = 'icon.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
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
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10">
        <h1 className="text-4xl font-black serif mb-10">CalmRelaxFlow</h1>
        <button onClick={loginAsAdmin} className="bg-stone-900 text-white px-8 py-4 rounded-full font-bold">Sign in to Fix Icon</button>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto space-y-12 pb-24">
        {view === 'admin' && (
          <div className="space-y-8">
            <div className="flex space-x-4 border-b border-stone-100">
              {['status', 'playstore', 'studio'].map((tab: any) => (
                <button key={tab} onClick={() => setAdminTab(tab)} className={`pb-4 text-xs font-black uppercase tracking-widest ${adminTab === tab ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {adminTab === 'status' && (
              <div className="space-y-6">
                <div className="bg-red-50 p-8 rounded-[40px] border border-red-100">
                  <h3 className="text-red-900 font-black serif text-xl mb-2">Why your icon is "Broken"</h3>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    Your server is confusing the <b>icon.png</b> request with your app code. When Bubblewrap downloads it, it gets 1,000 lines of code instead of an image.
                  </p>
                  <div className="space-y-3">
                    {Object.entries(assetHealth).map(([path, info]: [string, any]) => (
                      <div key={path} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-red-200">
                        <span className="text-[10px] font-black uppercase">{path}</span>
                        <span className={`text-[10px] font-black uppercase ${info.color}`}>{info.status}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={checkAssetIntegrity} className="mt-6 w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Re-Scan Server Now</button>
                </div>
              </div>
            )}

            {adminTab === 'studio' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-xl text-center">
                  <h3 className="text-2xl font-black serif mb-4">Step 1: Get a Real Image</h3>
                  <p className="text-stone-500 text-sm mb-8">This button creates a 100% valid PNG file on your computer. Use THIS file, do not use old ones.</p>
                  
                  <canvas ref={canvasRef} width="512" height="512" className="hidden" />
                  <div className="w-48 h-48 bg-emerald-500 rounded-[48px] mx-auto mb-8 flex items-center justify-center shadow-2xl border-8 border-white">
                    <span className="text-6xl text-white">🧘</span>
                  </div>
                  
                  <button onClick={generateEmergencyIcon} className="w-full py-6 bg-emerald-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">
                    Generate & Download Real icon.png
                  </button>
                </div>

                <div className="bg-stone-900 text-white p-8 rounded-[40px]">
                  <h3 className="text-lg font-black serif mb-4">Step 2: Deployment Fix</h3>
                  <ol className="text-xs space-y-4 list-decimal ml-4 opacity-80">
                    <li>Take the <b>icon.png</b> you just downloaded.</li>
                    <li>Put it in your <b>public/</b> folder.</li>
                    <li>Open <b>netlify.toml</b> and make sure the "Redirects" section is correct (see below).</li>
                    <li>Push to GitHub and wait for the "Health Check" to turn <b>Green</b>.</li>
                  </ol>
                </div>
              </div>
            )}
            
            {adminTab === 'playstore' && (
              <div className="p-8 bg-stone-50 rounded-[40px] border border-stone-100">
                <h3 className="font-black text-xs uppercase tracking-widest mb-4">Bubblewrap JSON</h3>
                <pre className="bg-stone-900 text-emerald-400 p-6 rounded-2xl text-[10px] overflow-auto">
                  {JSON.stringify({
                    packageId: "com.calmrelaxflow.app",
                    host: window.location.hostname,
                    iconUrl: `${window.location.origin}/icon.png`,
                    maskableIconUrl: `${window.location.origin}/icon.png`
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-8 py-10">
            <h2 className="text-4xl font-black serif">Daily Path</h2>
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
