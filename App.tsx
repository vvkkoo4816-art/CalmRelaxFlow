
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, ZenCenter, Language } from './types';
import { MEDITATION_SESSIONS, DAILY_MEDITATION, SLEEP_STORIES } from './constants';
import { generateAppAsset, getPersonalizedRecommendation } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'status' | 'deployment'>('status');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // Deployment & Asset State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [assetHealth, setAssetHealth] = useState<Record<string, { ok: boolean, status: string, isFallback: boolean }>>({});

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
    const targets = ['/icon.png', '/icon1.png', '/metadata.json'];
    const results: Record<string, any> = {};

    for (const path of targets) {
      try {
        const res = await fetch(`${path}?t=${Date.now()}`);
        const contentType = res.headers.get('Content-Type') || '';
        // If Vercel returns HTML for a PNG request, it's a "404 Fallback"
        const isHtmlFallback = contentType.includes('text/html');
        
        results[path] = {
          ok: res.ok && !isHtmlFallback,
          status: isHtmlFallback ? 'MSR-404 (Returns App HTML)' : res.statusText || (res.ok ? 'OK' : 'Not Found'),
          isFallback: isHtmlFallback
        };
      } catch {
        results[path] = { ok: false, status: 'Network Error', isFallback: false };
      }
    }
    setAssetHealth(results);
  };

  const loginAsAdmin = () => {
    const adminUser: User = {
      id: "admin-1",
      name: "Admin",
      email: "vvkkoo4816@gmail.com",
      photoUrl: "https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff",
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

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
        <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mb-10 shadow-2xl relative z-10 overflow-hidden">
           <img 
            src="/icon.png" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl">🧘</span>';
            }} 
            className="w-full h-full object-cover" 
            alt="app-icon"
          />
        </div>
        <h1 className="text-5xl font-extrabold serif mb-4 tracking-tighter text-stone-900">CalmRelax</h1>
        <p className="text-stone-500 text-sm font-medium mb-16 max-w-[280px] leading-relaxed">Professional mindfulness and serenity tools.</p>
        <button onClick={() => setShowLoginModal(true)} className="w-full max-w-[320px] bg-stone-900 text-white py-6 rounded-[32px] font-black shadow-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all">
          <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
          <span className="uppercase text-xs tracking-widest">Sign in with Google</span>
        </button>

        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className="bg-white w-full max-w-sm rounded-[44px] p-10 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-2xl font-black mb-8 serif">Select Account</h2>
              <button onClick={loginAsAdmin} className="w-full p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center space-x-4 mb-4 hover:bg-emerald-100 transition-all">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">V</div>
                <div className="text-left">
                  <p className="font-bold text-emerald-900 text-sm">vvkkoo4816@gmail.com</p>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Master Administrator</p>
                </div>
              </button>
              <button onClick={() => setShowLoginModal(false)} className="mt-6 text-stone-400 text-[10px] font-black uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="w-full space-y-10 animate-in fade-in duration-500 pb-20">
        {view === 'today' && (
          <>
            <section className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{t.welcome_back}</p>
              <h2 className="text-4xl font-black serif text-stone-900">{t.hey}, {user.name}</h2>
            </section>

            <section className="relative h-96 rounded-[50px] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setActiveSession(DAILY_MEDITATION)}>
              <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="daily" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-4 inline-block shadow-lg">{t.daily_zen}</span>
                <h3 className="text-3xl font-black text-white mb-6 leading-tight">{DAILY_MEDITATION.title}</h3>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-2xl hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h4 className="text-lg font-black serif text-stone-800">Your Current Mood?</h4>
              <div className="grid grid-cols-4 gap-3">
                {['Stressed', 'Calm', 'Focus', 'Sleepy'].map(mood => (
                  <button key={mood} onClick={() => handleMoodSelect(mood)} className="p-4 bg-white border border-stone-100 rounded-3xl text-[10px] font-black uppercase tracking-wider text-stone-500 hover:bg-stone-900 hover:text-white transition-all active:scale-95 shadow-sm">
                    {mood}
                  </button>
                ))}
              </div>
              {recommendation && (
                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] animate-in slide-in-from-top-4">
                  <p className="text-sm text-emerald-900 font-medium italic leading-relaxed">"{recommendation}"</p>
                </div>
              )}
            </section>
          </>
        )}

        {view === 'library' && (
          <div className="space-y-10">
            <h2 className="text-3xl font-black serif text-stone-900">{t.nav_library}</h2>
            <div className="grid grid-cols-2 gap-4">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="bg-white p-4 rounded-[32px] border border-stone-100 shadow-sm active:scale-95 transition-all cursor-pointer">
                  <img src={session.imageUrl} className="w-full h-32 object-cover rounded-[24px] mb-4" alt={session.title} />
                  <h5 className="font-bold text-stone-800 text-sm truncate">{session.title}</h5>
                  <p className="text-[10px] text-stone-400 font-black uppercase">{session.duration}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-10">
            <h2 className="text-3xl font-black serif text-stone-900">{t.nav_sleep}</h2>
            <div className="space-y-6">
              {SLEEP_STORIES.map(story => (
                <div key={story.id} onClick={() => setActiveSession(story)} className="relative h-44 rounded-[40px] overflow-hidden group cursor-pointer shadow-lg">
                  <img src={story.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={story.title} />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all"></div>
                  <div className="absolute bottom-6 left-6">
                    <h4 className="text-lg font-black text-white">{story.title}</h4>
                    <p className="text-[10px] text-white/80 font-black uppercase tracking-widest">{story.duration}</p>
                  </div>
                </div>
              ))}
            </div>
            <SoundMixer />
          </div>
        )}

        {view === 'explore' && <BreathingExercise lang={lang} />}

        {view === 'admin' && (
          <div className="space-y-10">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black serif text-stone-900">Vercel Deployment</h2>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-red-500 text-[10px] font-black uppercase tracking-widest underline decoration-2">Logout</button>
            </header>

            <div className="flex space-x-2 border-b border-stone-100 pb-2">
              <button onClick={() => setAdminTab('status')} className={`px-4 py-2 text-[11px] font-black uppercase ${adminTab === 'status' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Integrity Check</button>
              <button onClick={() => setAdminTab('deployment')} className={`px-4 py-2 text-[11px] font-black uppercase ${adminTab === 'deployment' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Asset Studio</button>
            </div>

            {adminTab === 'status' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[44px] border border-stone-100 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="text-lg font-black serif text-stone-800">Asset Diagnostic</h3>
                      <button onClick={checkAssetIntegrity} className="text-[10px] font-black uppercase text-emerald-500 underline">Refresh</button>
                   </div>
                   
                   <div className="space-y-4">
                     {/* Fix: Explicitly cast Object.entries results to match expected health object structure to avoid 'unknown' errors. */}
                     {(Object.entries(assetHealth) as Array<[string, { ok: boolean; status: string; isFallback: boolean }]>).map(([path, info]) => (
                       <div key={path} className={`p-5 rounded-3xl border flex justify-between items-center ${info.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                         <div>
                            <p className="text-[11px] font-black text-stone-700 uppercase tracking-wider">{path}</p>
                            <p className={`text-[9px] font-bold ${info.ok ? 'text-emerald-600' : 'text-red-600'}`}>{info.status}</p>
                         </div>
                         <div className={`w-3 h-3 rounded-full ${info.ok ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                       </div>
                     ))}
                   </div>

                   {/* Fix: Explicitly cast Object.values result to access properties on the health items. */}
                   {(Object.values(assetHealth) as Array<{ isFallback: boolean }>).some(h => h.isFallback) && (
                     <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-200 text-amber-900 space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest">⚠️ Vercel Routing Error</p>
                        <p className="text-[11px] leading-relaxed font-medium">
                          Vercel is returning your App's HTML instead of your icon. This happens when the file is <b>missing</b> from your <code>public/</code> folder on GitHub.
                        </p>
                        <div className="p-3 bg-white/50 rounded-xl text-[10px] font-mono">
                          Move icon.png to: <b>/public/icon.png</b>
                        </div>
                     </div>
                   )}
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
