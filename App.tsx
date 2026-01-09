
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, ZenCenter, Language } from './types';
import { MEDITATION_SESSIONS, DAILY_MEDITATION, SLEEP_STORIES, QUICK_RELIEF } from './constants';
import { getPersonalizedRecommendation, findNearbyZenCenters, generateAppAsset } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [adminTab, setAdminTab] = useState<'content' | 'status' | 'assets'>('content');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const t = translations[lang] || translations['en'];

  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [nearbyCenters, setNearbyCenters] = useState<ZenCenter[]>([]);
  const [healthChecks, setHealthChecks] = useState<{ [key: string]: 'pending' | 'ok' | 'fail' }>({
    icon: 'pending', manifest: 'pending'
  });

  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

  const [newSession, setNewSession] = useState({
    title: '',
    category: 'Daily' as MeditationSession['category'],
    duration: '10 min',
    audioUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800'
  });

  const isAdminUser = user?.email?.toLowerCase().trim() === 'vvkkoo4816@gmail.com';

  useEffect(() => {
    // Initial Load
    const savedSessions = localStorage.getItem('calmrelax_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(Array.isArray(parsed) && parsed.length > 0 ? parsed : MEDITATION_SESSIONS);
      } catch (e) {
        setSessions(MEDITATION_SESSIONS);
      }
    } else {
      setSessions(MEDITATION_SESSIONS);
    }

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

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('calmrelax_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const forceResetLibrary = () => {
    if (confirm("Restore factory defaults? Your custom scenarios will be deleted.")) {
      setSessions(MEDITATION_SESSIONS);
      localStorage.setItem('calmrelax_sessions', JSON.stringify(MEDITATION_SESSIONS));
    }
  };

  const currentDailySession = sessions.find(s => s.category === 'Daily') || DAILY_MEDITATION;

  const handleScanCenters = async () => {
    const centers = await findNearbyZenCenters(37.7749, -122.4194);
    setNearbyCenters(centers);
  };

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

  const handleAddSession = () => {
    if (!newSession.title || !newSession.audioUrl) return alert("Fill required fields");
    const session: MeditationSession = { id: 'custom-' + Date.now(), ...newSession };
    setSessions(prev => [session, ...prev]);
    setShowAddForm(false);
  };

  // Fix: Implemented missing handleLogout function
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('calmrelax_active_user');
    setView('today');
  };

  // Fix: Implemented missing handleGenerateIcon function to call Gemini API
  const handleGenerateIcon = async () => {
    setIsGeneratingIcon(true);
    try {
      const icon = await generateAppAsset('icon');
      if (icon) {
        setGeneratedIcon(icon);
      }
    } catch (e) {
      console.error("Failed to generate icon:", e);
    } finally {
      setIsGeneratingIcon(false);
    }
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
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
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
              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="text-xs">🔥</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase">3 Day Streak</span>
              </div>
            </header>

            <section className="relative h-80 rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setActiveSession(currentDailySession)}>
              <img src={currentDailySession.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="daily zen" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <span className="px-3 py-1 bg-emerald-500 rounded-full text-[9px] font-black text-white uppercase tracking-widest mb-3 inline-block shadow-lg">Daily Zen Session</span>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">{currentDailySession.title}</h3>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-2xl transition-all active:scale-90">
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-black serif mb-6 text-stone-800">For You</h3>
              <div className="space-y-4">
                {QUICK_RELIEF.map(s => (
                  <div key={s.id} onClick={() => setActiveSession(s)} className="bg-white p-5 rounded-[32px] border border-stone-100 flex items-center space-x-5 cursor-pointer active:scale-[0.98] transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50">
                    <img src={s.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt={s.title} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 text-sm truncate">{s.title}</h4>
                      <p className="text-[10px] text-stone-400 font-black uppercase mt-1">{s.category} • {s.duration}</p>
                    </div>
                    <div className="text-emerald-500 bg-emerald-50 w-9 h-9 rounded-full flex items-center justify-center border border-emerald-100">
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-8 pb-10">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-extrabold serif text-stone-900">Library</h2>
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-100">{sessions.length} Items</div>
            </header>
            <div className="space-y-5">
              {sessions.map(s => (
                <div key={s.id} onClick={() => setActiveSession(s)} className="relative h-44 rounded-[40px] overflow-hidden group cursor-pointer shadow-xl active:scale-95 transition-all">
                  <img src={s.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" alt={s.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-[9px] font-black text-emerald-400 uppercase mb-1 block tracking-widest">{s.category}</span>
                    <div className="flex justify-between items-end">
                      <h3 className="text-xl font-extrabold text-white truncate max-w-[70%]">{s.title}</h3>
                      <span className="text-[10px] text-white/70 font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">{s.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-10 pb-10">
            <header>
              <h2 className="text-3xl font-extrabold serif text-stone-900">Sleep Stories</h2>
              <p className="text-stone-400 text-xs mt-1">Gently drift into deep rest.</p>
            </header>
            
            <div className="grid grid-cols-1 gap-6">
              {SLEEP_STORIES.map(s => (
                <div key={s.id} onClick={() => setActiveSession(s)} className="bg-stone-900 rounded-[40px] p-2 flex items-center space-x-6 pr-6 shadow-2xl active:scale-95 transition-all">
                  <img src={s.imageUrl} className="w-24 h-24 rounded-[32px] object-cover" alt={s.title} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{s.title}</h4>
                    <p className="text-[10px] text-stone-500 font-black uppercase mt-1 tracking-widest">{s.duration} • Gentle Narrative</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-stone-800 flex items-center justify-center text-stone-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21a9 9 0 100-18 9 9 0 000 18zM10 8l6 4-6 4V8z"/></svg>
                  </div>
                </div>
              ))}
            </div>

            <section className="bg-white p-8 rounded-[44px] border border-stone-100 shadow-sm">
              <h3 className="text-lg font-black serif mb-6 text-stone-800 text-center">Sleep Soundscapes</h3>
              <SoundMixer />
            </section>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-10 pb-10">
            <header>
              <h2 className="text-3xl font-extrabold serif text-stone-900">Explore</h2>
              <p className="text-stone-400 text-xs mt-1">Tools for inner exploration.</p>
            </header>

            <section className="bg-white p-6 rounded-[44px] border border-stone-100 shadow-sm overflow-hidden">
               <h3 className="text-lg font-black serif mb-8 text-stone-800 text-center">Breathing Rituals</h3>
               <BreathingExercise lang={lang} />
            </section>

            <section className="bg-emerald-50 p-8 rounded-[44px] border border-emerald-100 text-center">
              <div className="w-16 h-16 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-emerald-200/50 shadow-xl">📍</div>
              <h3 className="text-xl font-extrabold serif text-emerald-900 mb-2">Find Local Zen</h3>
              <p className="text-emerald-700/60 text-xs mb-8 leading-relaxed">Discover highly-rated meditation centers and mindfulness studios near your location.</p>
              <button onClick={handleScanCenters} className="w-full py-5 bg-emerald-600 text-white rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-200 active:scale-95 transition-all">Scan Nearby Area</button>
              
              {nearbyCenters.length > 0 && (
                <div className="mt-8 space-y-4 text-left">
                  {nearbyCenters.map((c, i) => (
                    <div key={i} className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-stone-800">{c.name}</h4>
                        <span className="text-emerald-500 font-black text-[10px]">★ {c.rating}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 truncate">{c.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-10 pb-12">
             <header className="flex justify-between items-center">
                <h2 className="text-3xl font-black serif text-stone-900">Admin</h2>
                <button onClick={handleLogout} className="text-red-500 text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Log Out</button>
             </header>

             <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                <button onClick={() => setAdminTab('content')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'content' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>Content Feed</button>
                <button onClick={() => setAdminTab('status')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'status' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>App Health</button>
                <button onClick={() => setAdminTab('assets')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shrink-0 transition-all ${adminTab === 'assets' ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-100 text-stone-400'}`}>Asset Studio</button>
             </div>

             {adminTab === 'content' && (
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setShowAddForm(!showAddForm)} className="py-4 bg-emerald-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">
                     {showAddForm ? '✕ Close Form' : '+ New Item'}
                   </button>
                   <button onClick={forceResetLibrary} className="py-4 bg-stone-100 text-stone-500 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2">
                     <span>🔄</span> <span>Reset Library</span>
                   </button>
                 </div>

                 {showAddForm && (
                    <div className="p-8 bg-white rounded-[44px] border border-stone-100 space-y-5 shadow-2xl animate-in slide-in-from-top-4">
                       <h3 className="font-black text-stone-800 text-center mb-2">Publish New Content</h3>
                       <input type="text" placeholder="Session Title" value={newSession.title} onChange={e => setNewSession({...newSession, title: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                       <select value={newSession.category} onChange={e => setNewSession({...newSession, category: e.target.value as any})} className="w-full p-4 bg-stone-50 rounded-2xl border-none outline-none text-sm font-bold">
                          <option value="Daily">Daily</option><option value="Focus">Focus</option><option value="Sleep">Sleep</option><option value="Quick Relief">Quick Relief</option>
                       </select>
                       <input type="text" placeholder="Audio URL (Pixabay)" value={newSession.audioUrl} onChange={e => setNewSession({...newSession, audioUrl: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl border-none text-sm" />
                       <button onClick={handleAddSession} className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Push to Production</button>
                    </div>
                 )}

                 <div className="space-y-4">
                   {sessions.map(s => (
                     <div key={s.id} className="p-5 bg-white rounded-[32px] border border-stone-100 flex items-center space-x-5 shadow-sm">
                       <img src={s.imageUrl} className="w-12 h-12 rounded-xl object-cover" alt="thumb" />
                       <div className="flex-1 min-w-0">
                         <p className="font-bold text-stone-900 text-sm truncate">{s.title}</p>
                         <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest mt-0.5">{s.category} • {s.duration}</p>
                       </div>
                       <div className="flex space-x-2">
                         <button onClick={() => setActiveSession(s)} className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xs shadow-sm">▶</button>
                         <button onClick={() => setSessions(prev => prev.filter(it => it.id !== s.id))} className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xs shadow-sm">🗑</button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {adminTab === 'status' && (
                <div className="space-y-6">
                  <div className="p-8 bg-stone-900 rounded-[44px] text-center text-white space-y-4 shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20">✓</div>
                    <h3 className="text-xl font-black serif">System Normal</h3>
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-black">All Microservices Online</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <div className="p-6 bg-white rounded-[32px] border border-stone-100 flex justify-between items-center shadow-sm">
                        <div><p className="font-bold text-sm">PWA Descriptor</p><p className="text-[9px] text-stone-400 font-black uppercase">metadata.json</p></div>
                        <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</span>
                     </div>
                     <div className="p-6 bg-white rounded-[32px] border border-stone-100 flex justify-between items-center shadow-sm">
                        <div><p className="font-bold text-sm">App Assets</p><p className="text-[9px] text-stone-400 font-black uppercase">icon.png (512px)</p></div>
                        <span className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">!</span>
                     </div>
                  </div>
                </div>
             )}

             {adminTab === 'assets' && (
               <div className="p-10 bg-white rounded-[50px] border border-stone-100 text-center space-y-10 shadow-sm">
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black serif text-stone-900">Icon Studio</h3>
                   <p className="text-stone-400 text-[11px] leading-relaxed">Let Gemini AI design a premium zen-style icon for your Google Play store listing.</p>
                 </div>
                 
                 {generatedIcon ? (
                   <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                     <div className="relative inline-block">
                        <img src={generatedIcon} className="w-56 h-56 rounded-[64px] shadow-2xl border-4 border-white mx-auto" alt="generated" />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-xl">AI Masterpiece</div>
                     </div>
                     <button onClick={() => {
                        const link = document.createElement('a'); link.href = generatedIcon; link.download = 'icon.png'; link.click();
                     }} className="w-full py-5 bg-emerald-500 text-white rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-xl">Download for /public</button>
                     <button onClick={handleGenerateIcon} className="text-stone-300 text-[10px] font-black uppercase hover:text-stone-900 transition-colors">Generate New Variant</button>
                   </div>
                 ) : (
                    <button onClick={handleGenerateIcon} disabled={isGeneratingIcon} className="w-full py-20 border-4 border-dashed border-stone-100 rounded-[50px] group hover:border-emerald-200 bg-stone-50/30 transition-all flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl transition-all group-hover:scale-110 group-hover:rotate-12">
                        {isGeneratingIcon ? '⏳' : '🎨'}
                      </div>
                      <p className="mt-6 text-[11px] font-black uppercase text-stone-400 tracking-widest group-hover:text-emerald-500">{isGeneratingIcon ? 'Dreaming Designs...' : 'Begin AI Design Studio'}</p>
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
