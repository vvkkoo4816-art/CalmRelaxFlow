
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, ZenCenter, Language } from './types';
import { MEDITATION_SESSIONS, DAILY_MEDITATION, SLEEP_STORIES, QUICK_RELIEF } from './constants';
import { findNearbyZenCenters, generateAppAsset, getPersonalizedRecommendation } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'status' | 'content' | 'deployment'>('status');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [nearbyCenters, setNearbyCenters] = useState<ZenCenter[]>([]);

  // Deployment & Asset State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [assetStatus, setAssetStatus] = useState<Record<string, boolean>>({
    icon: false,
    metadata: false,
    assetlinks: false
  });

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
    checkPhysicalAssets();
  }, []);

  const checkPhysicalAssets = async () => {
    const paths = {
      icon: '/icon.png',
      metadata: '/metadata.json',
      assetlinks: '/.well-known/assetlinks.json'
    };
    const results: Record<string, boolean> = {};
    for (const [key, path] of Object.entries(paths)) {
      try {
        const res = await fetch(path);
        results[key] = res.ok && !res.headers.get('Content-Type')?.includes('text/html');
      } catch {
        results[key] = false;
      }
    }
    setAssetStatus(results);
  };

  const handleMoodSelect = async (mood: string) => {
    setRecommendation("Loading your personalized path...");
    const advice = await getPersonalizedRecommendation(mood, lang);
    setRecommendation(advice);
  };

  const loginAsAdmin = () => {
    const adminUser: User = {
      id: "admin-1",
      name: "Admin",
      email: "vvkkoo4816@gmail.com",
      photoUrl: "https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff",
      isLoggedIn: true,
      streak: 12,
      minutesMeditated: 450,
      role: 'admin'
    };
    setUser(adminUser);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(adminUser));
  };

  const generateIcon = async () => {
    setIsGenerating(true);
    try {
      const url = await generateAppAsset('icon');
      if (url) setGeneratedIcon(url);
    } catch (e) {
      alert("Error generating icon. Please check your API configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
        <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mb-10 shadow-2xl relative z-10">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <h1 className="text-5xl font-extrabold serif mb-4 tracking-tighter text-stone-900">CalmRelax</h1>
        <p className="text-stone-500 text-sm font-medium mb-16 max-w-[280px] leading-relaxed">Your professional mindfulness companion for daily peace.</p>
        <button onClick={() => setShowLoginModal(true)} className="w-full max-w-[320px] bg-stone-900 text-white py-6 rounded-[32px] font-black shadow-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all">
          <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
          <span className="uppercase text-xs tracking-widest">Sign in with Google</span>
        </button>

        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className="bg-white w-full max-w-sm rounded-[44px] p-10 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-2xl font-black mb-8 serif">Welcome</h2>
              <button onClick={loginAsAdmin} className="w-full p-6 bg-stone-50 border border-stone-100 rounded-3xl flex items-center space-x-4 mb-4 hover:bg-emerald-50 transition-all">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">V</div>
                <div className="text-left">
                  <p className="font-bold text-stone-800 text-sm">vvkkoo4816@gmail.com</p>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Administrator</p>
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
              <h4 className="text-lg font-black serif text-stone-800">How are you today?</h4>
              <div className="grid grid-cols-4 gap-3">
                {['Stress', 'Anxious', 'Happy', 'Tired'].map(mood => (
                  <button key={mood} onClick={() => handleMoodSelect(mood)} className="p-4 bg-white border border-stone-100 rounded-3xl text-[11px] font-black uppercase tracking-wider text-stone-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-sm">
                    {mood}
                  </button>
                ))}
              </div>
              {recommendation && (
                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] animate-in fade-in slide-in-from-top-4">
                  <p className="text-sm text-emerald-900 font-medium leading-relaxed italic">"{recommendation}"</p>
                </div>
              )}
            </section>
          </>
        )}

        {view === 'library' && (
          <div className="space-y-10">
            <h2 className="text-3xl font-black serif text-stone-900">{t.nav_library}</h2>
            <div className="space-y-8">
              {['Anxiety', 'Gratitude', 'Quick Relief'].map(category => (
                <div key={category} className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-400">{category}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {MEDITATION_SESSIONS.filter(s => s.category === category).map(session => (
                      <div key={session.id} onClick={() => setActiveSession(session)} className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm active:scale-95 transition-transform cursor-pointer">
                        <img src={session.imageUrl} className="w-full h-32 object-cover rounded-[24px] mb-4" alt={session.title} />
                        <h5 className="font-bold text-stone-800 text-sm truncate">{session.title}</h5>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">{session.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-10">
            <h2 className="text-3xl font-black serif text-stone-900">{t.nav_sleep}</h2>
            <div className="grid grid-cols-1 gap-6">
              {SLEEP_STORIES.map(story => (
                <div key={story.id} onClick={() => setActiveSession(story)} className="relative h-48 rounded-[40px] overflow-hidden group cursor-pointer shadow-lg">
                  <img src={story.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={story.title} />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <h4 className="text-xl font-black text-white">{story.title}</h4>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{story.duration}</p>
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
              <h2 className="text-3xl font-black serif text-stone-900">Deployment</h2>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-red-500 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 decoration-2">Full Reset</button>
            </header>

            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
              <button onClick={() => setAdminTab('status')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'status' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>Health</button>
              <button onClick={() => setAdminTab('deployment')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'deployment' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>Asset Gen</button>
            </div>

            {adminTab === 'status' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[44px] border border-stone-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-black serif text-stone-800">Deployment Checklist</h3>
                  <div className="space-y-3">
                    {Object.entries(assetStatus).map(([key, ok]) => (
                      <div key={key} className={`p-5 rounded-3xl border flex justify-between items-center ${ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <span className="text-[11px] font-black uppercase text-stone-600 tracking-wider">/{key === 'assetlinks' ? '.well-known/assetlinks.json' : key === 'icon' ? 'icon.png' : key + '.json'}</span>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full ${ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {ok ? 'DETECTED' : 'MISSING'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!assetStatus.icon && (
                    <div className="p-6 bg-stone-900 rounded-[32px] text-white">
                      <p className="text-[11px] font-medium leading-relaxed">
                        ⚠️ <b>Attention:</b> icon.png is not found in your root folder. Use the <b>Asset Gen</b> tab to create your official app icon for Google Play.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminTab === 'deployment' && (
              <div className="bg-white p-10 rounded-[50px] border border-stone-100 text-center space-y-10 shadow-sm">
                <div className="w-20 h-20 bg-emerald-50 rounded-[28px] flex items-center justify-center mx-auto text-4xl">🎨</div>
                <h3 className="text-2xl font-black serif text-stone-900">AI App Store Studio</h3>
                <p className="text-[12px] text-stone-500 leading-relaxed px-4">Generate and download your high-resolution 512x512 app icon for the Google Play Store.</p>
                
                {generatedIcon ? (
                  <div className="space-y-8">
                    <img src={generatedIcon} className="w-56 h-56 rounded-[64px] shadow-2xl mx-auto border-4 border-white" alt="generated" />
                    <button onClick={() => {
                      const link = document.createElement('a'); link.href = generatedIcon; link.download = 'icon.png'; link.click();
                    }} className="w-full py-6 bg-emerald-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">Download & Place in /public</button>
                    <button onClick={() => setGeneratedIcon(null)} className="text-stone-300 text-[10px] font-black uppercase tracking-widest underline decoration-2">Regenerate</button>
                  </div>
                ) : (
                  <button onClick={generateIcon} disabled={isGenerating} className="w-full py-20 border-4 border-dashed border-stone-100 rounded-[50px] bg-stone-50/30 flex flex-col items-center justify-center group active:scale-95 transition-all">
                    {isGenerating ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Designing with Gemini...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform">✨</div>
                        <p className="mt-8 text-[11px] font-black uppercase text-stone-400 tracking-widest">Create Official icon.png</p>
                      </>
                    )}
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

export default App;
