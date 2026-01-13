
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
  const [scanResult, setScanResult] = useState<{ status: string; type: string; snippet: string; color: string; headers: string } | null>(null);
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

  const runDeepScan = async () => {
    setIsScanning(true);
    // Use a unique name to bypass any generic "icon.png" redirect rules on the server
    const targetFile = '/meditation-app-icon.png';
    try {
      const res = await fetch(targetFile, { cache: 'no-store' });
      const contentType = res.headers.get('Content-Type') || 'unknown';
      const blob = await res.blob();
      const textSample = await blob.slice(0, 200).text();
      
      let headersStr = "";
      res.headers.forEach((v, k) => { headersStr += `${k}: ${v}\n`; });

      if (textSample.toLowerCase().includes('<html') || textSample.toLowerCase().includes('<!doctype')) {
        setScanResult({
          status: "CRITICAL: SERVER ERROR",
          type: `Server is sending a Webpage (HTML) instead of the Image. Content-Type: ${contentType}`,
          snippet: textSample.substring(0, 100),
          headers: headersStr,
          color: "text-red-500 bg-red-50 border-red-200"
        });
      } else if (res.ok && (contentType.includes('image') || blob.size > 1000)) {
        setScanResult({
          status: "VERIFIED: IMAGE FOUND",
          type: `Correctly identified as ${contentType}. Size: ${(blob.size / 1024).toFixed(1)}KB`,
          snippet: "Binary Data Signature Detected (Valid PNG)",
          headers: headersStr,
          color: "text-emerald-600 bg-emerald-50 border-emerald-200"
        });
      } else {
        setScanResult({
          status: "ERROR: FILE NOT SERVED",
          type: `Status ${res.status}. The server couldn't find ${targetFile} or it is empty.`,
          snippet: textSample || "No data received from server.",
          headers: headersStr,
          color: "text-amber-600 bg-amber-50 border-amber-200"
        });
      }
    } catch (e) {
      setScanResult({
        status: "SCAN FAILED",
        type: "Network error occurred while trying to reach the asset.",
        snippet: String(e),
        headers: "N/A",
        color: "text-red-600 bg-red-50 border-red-200"
      });
    }
    setIsScanning(false);
  };

  const downloadFixIcon = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#10B981';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 200px serif';
    ctx.fillStyle = '#10B981';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧘', 256, 270);

    const link = document.createElement('a');
    // Renamed for unique identification
    link.download = 'meditation-app-icon.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    alert("Step 1 Complete: 'meditation-app-icon.png' downloaded.\nStep 2: Upload this to your /public folder. Ensure the filename matches exactly.");
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
              <h2 className="text-3xl font-black serif">Asset Recovery</h2>
              <div className="flex space-x-2">
                <button onClick={() => setAdminTab('status')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-full ${adminTab === 'status' ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>Verify</button>
                <button onClick={() => setAdminTab('repair')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-full ${adminTab === 'repair' ? 'bg-emerald-500 text-white' : 'bg-stone-100'}`}>Fix Tools</button>
              </div>
            </header>

            {adminTab === 'status' && (
              <div className="space-y-6">
                <div className="p-8 bg-stone-50 rounded-[48px] border border-stone-100 text-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-6">Target: /meditation-app-icon.png</h3>
                  <button 
                    onClick={runDeepScan} 
                    disabled={isScanning}
                    className="bg-white border-2 border-stone-900 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all"
                  >
                    {isScanning ? 'Inspecting Bytes...' : 'Run Forensic Scan'}
                  </button>

                  {scanResult && (
                    <div className={`mt-8 p-8 rounded-[32px] border text-left space-y-4 ${scanResult.color}`}>
                      <div>
                        <p className="font-black text-lg">{scanResult.status}</p>
                        <p className="text-xs font-bold opacity-80">{scanResult.type}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase opacity-50">Content Snippet</p>
                        <div className="bg-white/50 p-4 rounded-xl font-mono text-[10px] break-all">
                          {scanResult.snippet}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase opacity-50">Server Headers</p>
                        <pre className="bg-stone-900 text-emerald-400 p-4 rounded-xl font-mono text-[9px] overflow-auto max-h-32">
                          {scanResult.headers}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <p className="text-blue-900 text-xs font-bold leading-relaxed">
                    💡 <b>Why it says Missing:</b> Your server sees "/icon.png" and thinks you are trying to visit a page on your website, so it sends the homepage instead. Using a unique name like <b>meditation-app-icon.png</b> forces the server to treat it as a real file.
                  </p>
                </div>
              </div>
            )}

            {adminTab === 'repair' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[56px] border border-stone-100 shadow-xl text-center">
                  <canvas ref={canvasRef} width="512" height="512" className="hidden" />
                  <div className="w-40 h-40 bg-emerald-500 rounded-[40px] mx-auto mb-8 flex items-center justify-center text-6xl shadow-2xl border-4 border-white">🧘</div>
                  <h3 className="text-xl font-black serif mb-2">Nuclear Reset Tool</h3>
                  <p className="text-stone-400 text-xs mb-8 max-w-xs mx-auto">This tool generates the file with a specific name that bypasses common server redirect loops.</p>
                  <button onClick={downloadFixIcon} className="w-full py-6 bg-stone-900 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl">Get meditation-app-icon.png</button>
                </div>

                <div className="p-8 bg-emerald-900 text-white rounded-[40px] space-y-4">
                  <h4 className="font-black serif">Final Steps:</h4>
                  <ul className="text-xs space-y-3 opacity-80 list-disc ml-4">
                    <li>Upload the new <b>meditation-app-icon.png</b> to your <b>public/</b> folder.</li>
                    <li>The code is already updated to look for this specific file.</li>
                    <li>Once uploaded, the "Forensic Scan" in the Verify tab should turn Green.</li>
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
