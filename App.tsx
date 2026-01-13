
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import { AppView, User, MeditationSession, Language } from './types';
import { DAILY_MEDITATION } from './constants';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'status' | 'repair'>('status');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  
  // Diagnostic state
  const [results, setResults] = useState<Record<string, any>>({});
  const [isScanning, setIsScanning] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const checkFile = async (path: string) => {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      const contentType = res.headers.get('Content-Type') || 'unknown';
      const blob = await res.blob();
      const textSample = await blob.slice(0, 200).text();
      const isHtml = textSample.toLowerCase().includes('<html') || textSample.toLowerCase().includes('<!doctype');
      
      return {
        path,
        status: res.status,
        ok: res.ok && !isHtml && blob.size > 0,
        contentType,
        size: blob.size,
        isHtml,
        error: isHtml ? "REDIRECT LOOP (Server sent a webpage instead of an image)" : (res.ok ? null : `Status ${res.status}`)
      };
    } catch (e) {
      return { path, ok: false, error: String(e) };
    }
  };

  const runDeepScan = async () => {
    setIsScanning(true);
    const paths = ['/icon.png', '/meditation-app-icon.png', '/manifest.json'];
    const newResults: Record<string, any> = {};
    
    for (const path of paths) {
      newResults[path] = await checkFile(path);
    }
    
    setResults(newResults);
    setIsScanning(false);
  };

  const downloadFixIcon = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw high quality 512x512 icon
    ctx.fillStyle = '#10B981';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(256, 256, 140, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 220px serif';
    ctx.fillStyle = '#10B981';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧘', 256, 275);

    const link = document.createElement('a');
    // Using meditation-app-icon.png as the primary standard to avoid generic "icon.png" cache/redirect issues
    link.download = 'meditation-app-icon.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    alert("CRITICAL INSTRUCTION:\n1. Rename your local file to 'meditation-app-icon.png'.\n2. Place it in the 'public/' folder.\n3. DELETE any old 'icon.png'.\n4. Push to GitHub.");
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
        <p className="text-stone-400 text-sm mb-12">Deployment Asset Management</p>
        <button onClick={loginAsAdmin} className="bg-emerald-500 text-white px-12 py-5 rounded-[32px] font-black shadow-2xl shadow-emerald-100">Enter Admin Mode</button>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto space-y-12 pb-24">
        {view === 'admin' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black serif">Icon Repair Hub</h2>
              <div className="flex space-x-2">
                <button onClick={() => setAdminTab('status')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-full ${adminTab === 'status' ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>Status</button>
                <button onClick={() => setAdminTab('repair')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-full ${adminTab === 'repair' ? 'bg-emerald-500 text-white' : 'bg-stone-100'}`}>Repair</button>
              </div>
            </header>

            {adminTab === 'status' && (
              <div className="space-y-6">
                <div className="p-8 bg-stone-50 rounded-[48px] border border-stone-100 text-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">Server Diagnostic</h3>
                  <button 
                    onClick={runDeepScan} 
                    disabled={isScanning}
                    className="bg-white border-2 border-stone-900 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all shadow-xl shadow-stone-200"
                  >
                    {isScanning ? 'Pinging Assets...' : 'Deep Scan Server'}
                  </button>

                  <div className="mt-8 grid gap-4">
                    {Object.entries(results).map(([path, res]) => (
                      <div key={path} className={`p-6 rounded-[24px] border text-left flex justify-between items-center ${res.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <div>
                          <p className="font-black text-xs tracking-tight">{path}</p>
                          <p className={`text-[10px] font-bold ${res.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                            {res.ok ? `Verified (${(res.size/1024).toFixed(1)}KB)` : res.error || 'Missing'}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${res.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {res.ok ? '✓' : '!'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!results['/meditation-app-icon.png']?.ok && results['/icon.png']?.ok && (
                  <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-200 animate-pulse">
                    <p className="text-amber-900 text-xs font-black uppercase mb-2">⚠️ Critical Mismatch Found</p>
                    <p className="text-amber-800 text-xs leading-relaxed">
                      You have <b>icon.png</b> but the app is looking for <b>meditation-app-icon.png</b>. 
                      Go to the Repair tab, download the new file, and rename it correctly.
                    </p>
                  </div>
                )}
              </div>
            )}

            {adminTab === 'repair' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[56px] border border-stone-100 shadow-xl text-center">
                  <canvas ref={canvasRef} width="512" height="512" className="hidden" />
                  <div className="w-40 h-40 bg-emerald-500 rounded-[40px] mx-auto mb-8 flex items-center justify-center text-6xl shadow-2xl border-4 border-white">🧘</div>
                  <h3 className="text-xl font-black serif mb-2">Asset Generator</h3>
                  <p className="text-stone-400 text-xs mb-8 max-w-xs mx-auto">Click below to generate a real, high-resolution 512x512 PNG file in your browser.</p>
                  <button onClick={downloadFixIcon} className="w-full py-6 bg-stone-900 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Download meditation-app-icon.png</button>
                </div>

                <div className="bg-stone-900 text-white p-8 rounded-[48px] space-y-4">
                  <h4 className="font-black text-emerald-400 serif">Final Deployment Check:</h4>
                  <ul className="text-[11px] font-bold space-y-3 opacity-90 list-decimal ml-4">
                    <li>Open your computer's <b>public/</b> folder.</li>
                    <li>Ensure there is a file named exactly <b>meditation-app-icon.png</b>.</li>
                    <li>If you see <b>icon.png</b>, rename it or replace it.</li>
                    <li>Ensure <b>manifest.json</b> has "src": "/meditation-app-icon.png".</li>
                  </ul>
                </div>
              </div>
            )}
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
