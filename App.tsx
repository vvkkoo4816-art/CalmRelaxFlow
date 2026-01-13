
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language } from './types';
import { MEDITATION_SESSIONS, DAILY_MEDITATION, SLEEP_STORIES } from './constants';
import { getPersonalizedRecommendation, generateAppAsset } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'status' | 'playstore' | 'hosting' | 'studio'>('status');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const [assetHealth, setAssetHealth] = useState<Record<string, { ok: boolean, status: string, details?: string, mime?: string }>>({});
  const [isCheckingAssets, setIsCheckingAssets] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<string | null>(null);
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);

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
    setIsCheckingAssets(true);
    const host = window.location.origin;
    const targets = ['/icon.png', '/manifest.json', '/.well-known/assetlinks.json'];
    const results: Record<string, any> = {};

    for (const path of targets) {
      try {
        const res = await fetch(host + path, { method: 'GET', cache: 'no-store' });
        const contentType = res.headers.get('Content-Type') || 'unknown';
        const isHtml = contentType.includes('text/html');
        
        let isOk = res.ok && !isHtml;
        
        results[path] = {
          ok: isOk,
          mime: contentType,
          status: isOk ? "Healthy" : "Corrupted/Missing",
          details: isHtml ? "Warning: Server returned HTML (likely a 404 page). Bubblewrap will FAIL." : (isOk ? "Verified PNG/JSON." : "File not found.")
        };
      } catch (e) {
        results[path] = { ok: false, status: 'Network Error', details: "Failed to connect." };
      }
    }
    setAssetHealth(results);
    setIsCheckingAssets(false);
  };

  const loginAsAdmin = () => {
    const adminUser: User = {
      id: "admin-1",
      name: "Zen Master",
      email: "vvkkoo4816@gmail.com",
      photoUrl: "https://ui-avatars.com/api/?name=Zen+Master&background=10b981&color=fff",
      isLoggedIn: true,
      streak: 15,
      minutesMeditated: 1240,
      role: 'admin'
    };
    setUser(adminUser);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(adminUser));
  };

  const handleMoodSelect = async (mood: string) => {
    setRecommendation("Analyzing your mood...");
    const advice = await getPersonalizedRecommendation(mood, lang);
    setRecommendation(advice);
  };

  const handleGenerateAsset = async (type: 'icon' | 'feature') => {
    setIsGeneratingAsset(true);
    const img = await generateAppAsset(type);
    setGeneratedAsset(img);
    setIsGeneratingAsset(false);
  };

  const generateManifestJson = () => {
    return JSON.stringify({
      packageId: "com.calmrelaxflow.app",
      host: window.location.hostname,
      name: "CalmRelaxFlow",
      launcherName: "CalmRelaxFlow",
      display: "standalone",
      themeColor: "#10B981",
      backgroundColor: "#10B981",
      startUrl: "/",
      iconUrl: `${window.location.origin}/icon.png`,
      maskableIconUrl: `${window.location.origin}/icon.png`,
      webManifestUrl: `${window.location.origin}/manifest.json`
    }, null, 2);
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2/3 bg-emerald-500/10 blur-[150px] pointer-events-none animate-pulse"></div>
        <div className="w-28 h-28 bg-emerald-500 rounded-[36px] flex items-center justify-center mb-10 shadow-2xl relative z-10 overflow-hidden border-4 border-white/50">
           <span className="text-5xl">🧘</span>
        </div>
        <h1 className="text-6xl font-black serif mb-4 tracking-tighter text-stone-900 leading-none">CalmRelaxFlow</h1>
        <p className="text-stone-500 text-sm font-medium mb-16 max-w-[280px] leading-relaxed uppercase tracking-[0.2em]">{t.personalized_paths}</p>
        
        <button onClick={() => setShowLoginModal(true)} className="w-full max-w-[340px] bg-stone-900 text-white py-6 rounded-[32px] font-black shadow-2xl flex items-center justify-center space-x-3 transition-all active:scale-95 group relative">
          <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
          <span className="uppercase text-xs tracking-widest">{t.sign_in_google}</span>
        </button>

        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
            <div className="bg-white w-full max-w-sm rounded-[48px] p-12 shadow-2xl">
              <h2 className="text-3xl font-black mb-8 serif">Login</h2>
              <button onClick={loginAsAdmin} className="w-full p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] flex items-center space-x-4 mb-4 text-left">
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xl">V</div>
                <div>
                  <p className="font-black text-stone-900 text-sm">vvkkoo4816@gmail.com</p>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Zen Master</p>
                </div>
              </button>
              <button onClick={() => setShowLoginModal(false)} className="mt-8 text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="w-full space-y-12 animate-in fade-in duration-500 pb-20">
        {view === 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black serif text-stone-900 tracking-tight">System Hub</h2>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Android App Readiness</p>
              </div>
              <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">V4.0</span>
            </header>

            <div className="flex space-x-2 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setAdminTab('status')} className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === 'status' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Diagnostic</button>
              <button onClick={() => setAdminTab('hosting')} className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === 'hosting' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Hosting Fixes</button>
              <button onClick={() => setAdminTab('playstore')} className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === 'playstore' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Bubblewrap JSON</button>
              <button onClick={() => setAdminTab('studio')} className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === 'studio' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Studio</button>
            </div>

            {adminTab === 'status' && (
              <div className="space-y-8">
                <div className="p-8 bg-amber-50 border border-amber-200 rounded-[40px] space-y-4">
                  <h3 className="text-sm font-black text-amber-900 uppercase">Live MIME Check</h3>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                    If any file below says "text/html", Bubblewrap will fail to download it. This usually means your Hosting provider (Vercel/GitHub) can't find the file in your public folder.
                  </p>
                </div>
                <div className="space-y-4">
                   {Object.entries(assetHealth).map(([path, info]: [string, any]) => (
                     <div key={path} className={`p-6 rounded-[32px] border flex justify-between items-center ${info.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="max-w-[80%]">
                           <p className="text-[11px] font-black text-stone-900 uppercase">{path}</p>
                           <p className={`text-[9px] font-bold mt-1 ${info.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                              {info.mime} — {info.details}
                           </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${info.ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                     </div>
                   ))}
                   <button onClick={checkAssetIntegrity} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 border border-stone-100 rounded-3xl">Force Re-Scan</button>
                </div>
              </div>
            )}

            {adminTab === 'hosting' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="p-8 bg-stone-900 text-white rounded-[40px] space-y-4">
                   <h3 className="text-lg font-black serif">Firebase (Best Success Rate)</h3>
                   <p className="text-[11px] opacity-70 leading-relaxed">
                     Firebase Hosting is the gold standard for Android TWA apps. It handles MIME types perfectly.
                   </p>
                   <ol className="text-[11px] space-y-2 list-decimal ml-4 opacity-90">
                     <li>Install Firebase CLI: <code className="bg-white/10 px-1">npm i -g firebase-tools</code></li>
                     <li>Run <code className="bg-white/10 px-1">firebase init hosting</code> (Select "dist" as public folder)</li>
                     <li>The <code className="bg-white/10 px-1">firebase.json</code> I provided handles all headers.</li>
                     <li>Run <code className="bg-white/10 px-1">firebase deploy</code></li>
                   </ol>
                </div>

                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] space-y-4">
                   <h3 className="text-lg font-black serif text-emerald-900">Netlify (Easier than Vercel)</h3>
                   <p className="text-[11px] text-emerald-800 leading-relaxed">
                     1. Run <code className="bg-stone-100 px-1">npm run build</code>.<br/>
                     2. Drag the <code className="bg-stone-100 px-1">dist</code> folder into Netlify Drop.<br/>
                     3. Netlify will use the <code className="bg-stone-100 px-1">netlify.toml</code> file automatically.
                   </p>
                </div>

                <div className="p-8 bg-blue-50 border border-blue-100 rounded-[40px] space-y-4">
                   <h3 className="text-lg font-black serif text-blue-900">GitHub Pages (Must Do)</h3>
                   <p className="text-[11px] text-blue-800 leading-relaxed">
                     Ensure you have an empty file named <code className="bg-white/50 px-1">.nojekyll</code> in your root. This tells GitHub NOT to hide the <code className="bg-white/50 px-1">.well-known</code> folder.
                   </p>
                </div>
              </div>
            )}

            {adminTab === 'playstore' && (
              <div className="space-y-6">
                 <div className="bg-stone-50 p-6 rounded-[32px] border border-stone-100 overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">application.json for Bubblewrap</h3>
                    <div className="bg-stone-900 p-4 rounded-2xl">
                       <pre className="text-[9px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{generateManifestJson()}</pre>
                    </div>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(generateManifestJson()); alert("Copied to clipboard!"); }} className="w-full py-5 bg-stone-900 text-white rounded-[32px] font-black text-[10px] uppercase tracking-widest shadow-xl">Copy JSON for Android</button>
              </div>
            )}

            {adminTab === 'studio' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[56px] border border-stone-100 shadow-2xl space-y-8">
                   <h3 className="text-2xl font-black serif text-stone-900">Icon Laboratory</h3>
                   <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">Generate a valid 512px PNG</p>
                   <div className="grid grid-cols-1 gap-4">
                      <button onClick={() => handleGenerateAsset('icon')} disabled={isGeneratingAsset} className="p-10 bg-stone-50 border border-stone-100 rounded-[48px] text-[10px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-900 hover:text-white transition-all disabled:opacity-50">
                        {isGeneratingAsset ? 'Generating...' : 'Generate New Android Icon'}
                      </button>
                   </div>
                   {generatedAsset && !isGeneratingAsset && (
                     <div className="space-y-6 animate-in zoom-in-95">
                        <div className="relative rounded-[64px] overflow-hidden border-[16px] border-white shadow-3xl aspect-square">
                          <img src={generatedAsset} alt="icon" className="w-full h-full object-cover" />
                        </div>
                        <a href={generatedAsset} download="icon.png" className="block w-full text-center py-6 bg-stone-900 text-white rounded-[32px] font-black uppercase text-[11px] tracking-widest">Download icon.png</a>
                        <p className="text-[10px] text-center text-stone-400 font-bold leading-relaxed">
                          **Final Action**: After downloading, place this file in <code className="bg-stone-50 px-1">public/icon.png</code> and deploy again.
                        </p>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <section className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Daily Reflection</p>
              <h2 className="text-4xl font-black serif text-stone-900 leading-tight">Welcome, {user.name.split(' ')[0]}</h2>
            </section>
            <section className="relative h-96 rounded-[56px] overflow-hidden shadow-2xl border-8 border-white cursor-pointer group" onClick={() => setActiveSession(DAILY_MEDITATION)}>
              <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="daily" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Daily Zen</span>
                <h3 className="text-3xl font-black text-white serif">{DAILY_MEDITATION.title}</h3>
              </div>
            </section>
            <section className="space-y-4">
              <h4 className="text-xl font-black serif text-stone-800">Quick Check-in</h4>
              <div className="grid grid-cols-2 gap-4">
                {['Stressed', 'Calm', 'Focus', 'Tired'].map(mood => (
                  <button key={mood} onClick={() => handleMoodSelect(mood)} className="p-6 bg-white border border-stone-100 rounded-[32px] text-[10px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-900 hover:text-white transition-all">
                    {mood}
                  </button>
                ))}
              </div>
              {recommendation && <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] text-sm italic font-bold text-emerald-900 leading-relaxed">"{recommendation}"</div>}
            </section>
          </div>
        )}
        
        {/* Placeholder for other views to keep it clean */}
        {view !== 'today' && view !== 'admin' && (
          <div className="py-20 text-center space-y-6">
             <div className="w-20 h-20 bg-stone-100 rounded-[32px] mx-auto flex items-center justify-center text-3xl">🧘</div>
             <p className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-300">{view} view active</p>
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
