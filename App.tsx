
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
  const [adminTab, setAdminTab] = useState<'status' | 'deployment'>('status');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // Admin Asset State
  const [assetHealth, setAssetHealth] = useState<Record<string, { ok: boolean, status: string, isFallback: boolean, details?: string, remoteUrl?: string }>>({});
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
    // These are the files Bubblewrap needs
    const targets = ['/icon.png', '/icon1.png', '/metadata.json', '/.well-known/assetlinks.json'];
    const results: Record<string, any> = {};
    const remoteHost = "https://calm-relax-flow.vercel.app";

    for (const path of targets) {
      try {
        // Check local first
        const localRes = await fetch(`${path}?t=${Date.now()}`);
        const localContentType = localRes.headers.get('Content-Type') || '';
        const isLocalHtml = localContentType.includes('text/html');
        
        // Check remote (What Bubblewrap sees)
        const remoteUrl = `${remoteHost}${path}`;
        let remoteOk = false;
        let remoteStatus = "Checking...";

        try {
            const remoteRes = await fetch(`${remoteUrl}?t=${Date.now()}`, { method: 'HEAD' });
            remoteOk = remoteRes.ok && !(remoteRes.headers.get('Content-Type') || '').includes('text/html');
            remoteStatus = remoteOk ? "Live" : `Error ${remoteRes.status}`;
        } catch (e) {
            remoteStatus = "Unreachable";
        }

        let details = "";
        if (!localRes.ok || isLocalHtml) {
          details = "Local file missing. Bubblewrap cannot bundle a missing icon.";
        } else if (!remoteOk) {
          details = `Bubblewrap Error Source: Your remote URL (${remoteUrl}) is returning a 404. You must deploy the icons to Vercel first!`;
        }

        results[path] = {
          ok: localRes.ok && !isLocalHtml && remoteOk,
          status: remoteOk ? 'Healthy & Live' : 'Build Blocker ❌',
          isFallback: isLocalHtml,
          details,
          remoteUrl
        };
      } catch (e) {
        results[path] = { ok: false, status: 'Network Error', isFallback: false, details: "Check your local server." };
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

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2/3 bg-emerald-500/10 blur-[150px] pointer-events-none animate-pulse"></div>
        <div className="w-28 h-28 bg-emerald-500 rounded-[36px] flex items-center justify-center mb-10 shadow-2xl relative z-10 overflow-hidden border-4 border-white/50">
           <span className="text-5xl">🧘</span>
        </div>
        <h1 className="text-6xl font-black serif mb-4 tracking-tighter text-stone-900 leading-none">CalmRelaxFlow</h1>
        <p className="text-stone-500 text-sm font-medium mb-16 max-w-[280px] leading-relaxed uppercase tracking-[0.2em]">{t.personalized_paths}</p>
        
        <button onClick={() => setShowLoginModal(true)} className="w-full max-w-[340px] bg-stone-900 text-white py-6 rounded-[32px] font-black shadow-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 relative z-10" />
          <span className="uppercase text-xs tracking-widest relative z-10">{t.sign_in_google}</span>
        </button>

        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
            <div className="bg-white w-full max-w-sm rounded-[48px] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <h2 className="text-3xl font-black mb-8 serif tracking-tight">Welcome back</h2>
              <button onClick={loginAsAdmin} className="w-full p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] flex items-center space-x-4 mb-4 hover:bg-emerald-100 transition-all text-left">
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg">V</div>
                <div>
                  <p className="font-black text-stone-900 text-sm">vvkkoo4816@gmail.com</p>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">Zen Master (Admin)</p>
                </div>
              </button>
              <button onClick={() => setShowLoginModal(false)} className="mt-8 text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-stone-600 transition-colors w-full">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="w-full space-y-12 animate-in fade-in duration-500 pb-20">
        {view === 'today' && (
          <>
            <section className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{t.welcome_back}</p>
              <h2 className="text-4xl font-black serif text-stone-900 leading-tight">{t.hey}, {user.name.split(' ')[0]}</h2>
            </section>

            <section className="relative h-96 rounded-[56px] overflow-hidden shadow-2xl group cursor-pointer border-8 border-white" onClick={() => setActiveSession(DAILY_MEDITATION)}>
              <img src={DAILY_MEDITATION.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="daily" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block shadow-xl">{t.daily_zen}</span>
                <h3 className="text-4xl font-black text-white mb-6 leading-none serif">{DAILY_MEDITATION.title}</h3>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 hover:bg-white hover:text-stone-900 transition-all">
                  <svg className="w-9 h-9 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h4 className="text-xl font-black serif text-stone-800 tracking-tight">How are you feeling?</h4>
              <div className="grid grid-cols-2 gap-4">
                {['Stressed', 'Calm', 'Anxious', 'Focus'].map(mood => (
                  <button key={mood} onClick={() => handleMoodSelect(mood)} className="p-6 bg-white border border-stone-100 rounded-[32px] text-[11px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-900 hover:text-white transition-all active:scale-95 shadow-sm">
                    {mood}
                  </button>
                ))}
              </div>
              {recommendation && (
                <div className="p-10 bg-emerald-50 border border-emerald-100 rounded-[48px] animate-in slide-in-from-top-6 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <p className="text-base text-emerald-900 font-bold italic leading-relaxed relative z-10">"{recommendation}"</p>
                </div>
              )}
            </section>
          </>
        )}

        {view === 'library' && (
          <div className="space-y-10">
            <h2 className="text-4xl font-black serif text-stone-900 tracking-tight">{t.nav_library}</h2>
            <div className="grid grid-cols-2 gap-5">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="bg-white p-5 rounded-[40px] border border-stone-100 shadow-md active:scale-95 transition-all cursor-pointer group">
                  <div className="relative overflow-hidden rounded-[32px] mb-4">
                    <img src={session.imageUrl} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700" alt={session.title} />
                  </div>
                  <h5 className="font-black text-stone-800 text-sm truncate px-1">{session.title}</h5>
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1 px-1">{session.duration}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-12">
            <h2 className="text-4xl font-black serif text-stone-900 tracking-tight">{t.nav_sleep}</h2>
            <div className="space-y-6">
              {SLEEP_STORIES.map(story => (
                <div key={story.id} onClick={() => setActiveSession(story)} className="relative h-56 rounded-[48px] overflow-hidden group cursor-pointer shadow-xl border-4 border-white">
                  <img src={story.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={story.title} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-8 left-8">
                    <h4 className="text-2xl font-black text-white serif mb-1">{story.title}</h4>
                    <p className="text-[11px] text-emerald-400 font-black uppercase tracking-[0.2em]">{story.duration}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6">
               <h3 className="text-xl font-black serif text-stone-800 mb-8">{t.soundscape_mixer}</h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'explore' && <BreathingExercise lang={lang} />}

        {view === 'profile' && (
          <div className="space-y-12 flex flex-col items-center py-10">
            <div className="relative">
              <img src={user.photoUrl} className="w-32 h-32 rounded-[48px] border-4 border-white shadow-2xl" alt="profile" />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-black serif text-stone-900">{user.name}</h2>
              <p className="text-xs text-stone-400 font-bold tracking-widest mt-1 uppercase">{user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm text-center space-y-2">
                 <p className="text-3xl font-black text-stone-900 serif">{user.streak}</p>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.day_streak}</p>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm text-center space-y-2">
                 <p className="text-3xl font-black text-stone-900 serif">{user.minutesMeditated}</p>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.total_minutes}</p>
              </div>
            </div>

            <div className="w-full space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 ml-4">{t.settings_language}</h4>
              <div className="bg-white rounded-[32px] border border-stone-100 p-2 flex">
                {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
                  <button key={l} onClick={() => setLang(l)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-3xl transition-all ${lang === l ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400'}`}>
                    {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简' : '繁'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-6 bg-red-50 text-red-500 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all">
              Sign Out
            </button>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black serif text-stone-900 tracking-tight">Admin Console</h2>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Build Readiness & Asset Studio</p>
              </div>
              <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-100">BUILDER MODE</span>
            </header>

            <div className="flex space-x-2 border-b border-stone-100 pb-2">
              <button onClick={() => setAdminTab('status')} className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${adminTab === 'status' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Build Integrity</button>
              <button onClick={() => setAdminTab('deployment')} className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${adminTab === 'deployment' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-stone-300'}`}>Asset Studio</button>
            </div>

            {adminTab === 'status' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[48px] border border-stone-100 shadow-xl space-y-8">
                   <div className="bg-red-900 p-8 rounded-[40px] text-white space-y-4">
                      <div className="flex items-center space-x-3">
                         <span className="text-3xl">🛡️</span>
                         <h4 className="text-sm font-black uppercase tracking-widest">Bubblewrap Crash Fixer</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        If <code className="bg-black/20 p-1">bubblewrap update</code> fails with <code className="bg-black/20 p-1">MIME for Buffer null</code>, it means Bubblewrap can't find your icons at your public URL.
                      </p>
                   </div>

                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black serif text-stone-800 tracking-tight">Remote Availability Scan</h3>
                      <button 
                        onClick={checkAssetIntegrity} 
                        disabled={isCheckingAssets}
                        className={`px-5 py-2 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isCheckingAssets ? 'opacity-50' : 'hover:scale-105 shadow-lg'}`}
                      >
                        {isCheckingAssets ? 'Scanning...' : 'Test Build Readiness'}
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                     {(Object.entries(assetHealth) as Array<[string, { ok: boolean; status: string; isFallback: boolean; details?: string, remoteUrl?: string }]>).map(([path, info]) => (
                       <div key={path} className={`p-6 rounded-[32px] border flex flex-col space-y-3 transition-all ${info.ok ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' : 'bg-red-50 border-red-200'}`}>
                         <div className="flex justify-between items-center w-full">
                            <div className="flex items-center space-x-3">
                               <div className={`w-3 h-3 rounded-full shadow-inner ${info.ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                               <div>
                                  <p className="text-[11px] font-black text-stone-700 uppercase tracking-widest">{path}</p>
                                  <p className={`text-[10px] font-bold mt-1 ${info.ok ? 'text-emerald-600' : 'text-red-600'}`}>{info.status}</p>
                               </div>
                            </div>
                         </div>
                         {info.details && (
                           <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-red-100 text-stone-600">
                             <p className="text-[10px] leading-relaxed font-bold mb-2 text-red-600 uppercase tracking-widest">BUILD BLOCKER:</p>
                             <p className="text-[11px] leading-relaxed font-medium">
                               {info.details}
                             </p>
                             {info.remoteUrl && (
                               <a href={info.remoteUrl} target="_blank" className="inline-block mt-3 text-[9px] font-black uppercase text-blue-500 underline">Try opening URL manually</a>
                             )}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>

                   <div className="p-8 bg-stone-50 rounded-[40px] border border-stone-200">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">Fix Sequence:</h4>
                      <ol className="text-[11px] space-y-4 font-medium text-stone-600">
                         <li className="flex items-start">
                            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5">1</span>
                            <span>Download the icon from <b>Asset Studio</b> tab.</span>
                         </li>
                         <li className="flex items-start">
                            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5">2</span>
                            <span>Rename it to exactly <code>icon.png</code> and place in your <code>public/</code> folder.</span>
                         </li>
                         <li className="flex items-start">
                            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5">3</span>
                            <span><b>PUSH TO GITHUB</b>. Vercel must finish the deployment.</span>
                         </li>
                         <li className="flex items-start">
                            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5">4</span>
                            <span>Wait until the scan above shows "Healthy & Live".</span>
                         </li>
                         <li className="flex items-start">
                            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5">5</span>
                            <span>Run <code>bubblewrap update</code> again.</span>
                         </li>
                      </ol>
                   </div>
                </div>
              </div>
            )}

            {adminTab === 'deployment' && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                <div className="bg-white p-10 rounded-[48px] border border-stone-100 shadow-xl space-y-10">
                   <div className="space-y-2">
                     <h3 className="text-xl font-black serif text-stone-800 tracking-tight">Zen Asset Studio</h3>
                     <p className="text-[11px] text-stone-400 font-medium leading-relaxed">Generate 512x512 branding assets. These are <b>required</b> for the Android build to succeed.</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleGenerateAsset('icon')} 
                        disabled={isGeneratingAsset}
                        className="p-8 bg-stone-50 border border-stone-100 rounded-[40px] text-[10px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-900 hover:text-white transition-all disabled:opacity-50 shadow-sm active:scale-95"
                      >
                        Generate App Icon
                      </button>
                      <button 
                        onClick={() => handleGenerateAsset('feature')} 
                        disabled={isGeneratingAsset}
                        className="p-8 bg-stone-50 border border-stone-100 rounded-[40px] text-[10px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-900 hover:text-white transition-all disabled:opacity-50 shadow-sm active:scale-95"
                      >
                        Feature Graphic
                      </button>
                   </div>

                   {isGeneratingAsset && (
                     <div className="flex flex-col items-center space-y-5 py-16 animate-pulse">
                        <div className="w-16 h-16 border-[6px] border-emerald-50 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600">Visualizing Serenity...</p>
                     </div>
                   )}

                   {generatedAsset && !isGeneratingAsset && (
                     <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="relative rounded-[56px] overflow-hidden border-[12px] border-stone-50 shadow-2xl group">
                          <img src={generatedAsset} alt="generated-asset" className="w-full aspect-square object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = generatedAsset;
                                  link.download = 'icon.png';
                                  link.click();
                                }}
                                className="px-8 py-4 bg-white rounded-full shadow-2xl text-stone-900 font-black uppercase text-[10px] tracking-widest active:scale-90 transition-all"
                              >
                                 Download for Public/ Folder
                              </button>
                          </div>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100">
                           <p className="text-[10px] text-center text-emerald-900 font-bold uppercase tracking-widest leading-loose">
                              PRO TIP: Save this as <code className="bg-emerald-100 px-1">icon.png</code> and place it in your project's root <code className="bg-emerald-100 px-1">public</code> directory.
                           </p>
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
