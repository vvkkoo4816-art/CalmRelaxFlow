
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import AdSlot from './components/AdSlot';
import { AppView, User, MeditationSession, Language, JournalEntry, ZenCenter } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES, COURSES, PUBLIC_AUDIO_FILES } from './constants';
import { translations } from './translations';
import { getPersonalizedRecommendation, findNearbyZenCenters } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [zenQuote, setZenQuote] = useState<string>(STATIC_QUOTES[0]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [newJournalText, setNewJournalText] = useState('');
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [zenCenters, setZenCenters] = useState<ZenCenter[]>([]);

  const [dynamicFileName, setDynamicFileName] = useState('');
  const [adRefreshKey, setAdRefreshKey] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isShowingInterstitial, setIsShowingInterstitial] = useState(false);
  const [canSkipInterstitial, setCanSkipInterstitial] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);

  const t = useMemo(() => translations[lang] || translations['en'], [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('calmrelax_active_user');
    const savedLang = localStorage.getItem('calmrelax_lang');
    const savedJournals = localStorage.getItem('calmrelax_journals');
    if (savedLang) setLang(savedLang as Language);
    if (savedJournals) setJournals(JSON.parse(savedJournals));
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.isLoggedIn) {
        setUser(parsed);
        setIsLoggedIn(true);
        setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
      }
    }

    findNearbyZenCenters(0,0).then(setZenCenters);
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('calmrelax_lang', newLang);
    setCopyFeedback(newLang === 'en' ? "Language Synced" : "语言已同步");
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const handleViewChange = (newView: AppView) => {
    if (newView === view) return;
    
    setPendingView(newView);
    setIsShowingInterstitial(true);
    setCanSkipInterstitial(false);
    setAdRefreshKey(prev => prev + 1);

    setTimeout(() => {
      setCanSkipInterstitial(true);
    }, 3000);

    setTimeout(() => {
      if (isShowingInterstitial) completeViewChange(newView);
    }, 4500); 
  };

  const completeViewChange = (newView: AppView) => {
    setIsShowingInterstitial(false);
    setView(newView);
    setPendingView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsAiLoading(true);
    try {
      const tip = await getPersonalizedRecommendation(mood, lang);
      setAiTip(tip);
    } catch (e) {
      setAiTip(translations[lang]?.mood_fallback || "Breathe deeply. You are safe in this moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const finalizeLogin = () => {
    const mockUser: User = {
      id: `social-auth-${Date.now()}`,
      name: "Zen Seeker",
      email: "vvkkoo4816@gmail.com",
      photoUrl: `https://ui-avatars.com/api/?name=Zen+Seeker&background=10b981&color=fff`,
      isLoggedIn: true,
      streak: 35,
      minutesMeditated: 5820,
      role: 'admin',
      isPremium: true
    };
    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
    setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
    setIsConsentModalOpen(false);
  };

  const saveJournal = () => {
    if (!newJournalText.trim()) return;
    let updatedJournals: JournalEntry[];
    if (editingJournalId) {
      updatedJournals = journals.map(j => 
        j.id === editingJournalId 
          ? { ...j, text: newJournalText, date: `${new Date().toLocaleDateString()} (Edited)` } 
          : j
      );
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        text: newJournalText,
        mood: selectedMood || 'Neutral'
      };
      updatedJournals = [newEntry, ...journals];
    }
    setJournals(updatedJournals);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updatedJournals));
    setNewJournalText('');
    setEditingJournalId(null);
  };

  const deleteJournal = (id: string) => {
    const updated = journals.filter(j => j.id !== id);
    setJournals(updated);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updated));
  };

  const handleDynamicDownload = () => {
    if (!dynamicFileName.trim()) return;
    const link = document.createElement('a');
    link.href = dynamicFileName.startsWith('/') ? dynamicFileName : `/${dynamicFileName}`;
    link.download = dynamicFileName.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} copied!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const progressPercent = Math.min(((user?.minutesMeditated ?? 0) % 60 / 30) * 100, 100);
  const zenLevel = Math.floor((user?.minutesMeditated ?? 0) / 120) + 1;

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-12 flex space-x-2 bg-stone-200/40 backdrop-blur-xl p-1.5 rounded-full border border-stone-300/30 z-50">
          {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
            <button key={l} onClick={() => changeLanguage(l)} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-white text-stone-900 shadow-xl' : 'text-stone-500 hover:text-stone-800'}`}>
              {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简体' : '繁體'}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-32 duration-1000">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mb-12 shadow-[0_20px_60px_rgba(16,185,129,0.3)] animate-bounce duration-[10s]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-6xl font-black serif mb-6 text-stone-900 tracking-tighter text-balance">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium mb-24 max-w-sm leading-relaxed mx-auto text-xl italic serif opacity-80">{t.app_slogan}</p>
          
          <div className="w-full max-w-xs flex flex-col space-y-4">
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-white border border-stone-200 text-stone-800 px-8 py-5 rounded-full font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-95 group">
               <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="google" />
               <span className="text-base tracking-tight uppercase">{t.sign_in_google}</span>
            </button>
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-[#1877F2] text-white px-8 py-5 rounded-full font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-95 group border-b-4 border-blue-900">
               <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               <span className="text-base tracking-tight uppercase">{t.sign_in_facebook}</span>
            </button>
          </div>
        </div>

        {isConsentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-stone-950/95 backdrop-blur-3xl">
            <div className="bg-white w-full max-w-sm rounded-[50px] p-12 shadow-2xl animate-in zoom-in duration-500">
               <h3 className="text-3xl font-black serif text-stone-900 mb-4">{t.auth_permission_title}</h3>
               <p className="text-stone-500 text-lg mb-10 leading-relaxed serif italic">{t.auth_permission_desc}</p>
               <div className="flex flex-col space-y-4">
                 <button onClick={finalizeLogin} className="w-full bg-emerald-600 text-white py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">{t.auth_allow}</button>
                 <button onClick={() => setIsConsentModalOpen(false)} className="w-full text-stone-400 py-3 rounded-full font-black text-sm uppercase tracking-[0.2em]">{t.auth_deny}</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <div className="max-w-3xl mx-auto pb-64 space-y-6 md:space-y-12 px-4">
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center ad-interstitial-in">
             <div className="w-16 h-16 border-[6px] border-emerald-50 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-xl shadow-emerald-500/20"></div>
             <p className="text-emerald-800 font-black text-sm uppercase tracking-[0.3em] animate-pulse italic mb-8">Refining Frequency...</p>
             <div className="w-full max-w-md bg-stone-50 rounded-3xl p-4 border border-stone-100 shadow-inner mb-8 min-h-[150px] flex items-center justify-center">
               <AdSlot key={`interstitial-ad-${adRefreshKey}`} />
             </div>
             {canSkipInterstitial && (
               <button 
                 onClick={() => pendingView && completeViewChange(pendingView)} 
                 className="px-8 py-3 bg-stone-900 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-xl animate-in fade-in duration-500"
               >
                 Enter {pendingView}
               </button>
             )}
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[40px] border border-stone-100 shadow-xl shadow-stone-200/20 gap-6">
              <div className="min-w-0 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-2">
                   <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm">Zen Master • Lv {zenLevel}</span>
                   <p className="text-stone-400 font-black text-[11px] uppercase tracking-[0.4em]">{t.welcome_back}</p>
                </div>
                <h2 className="text-4xl md:text-5xl font-black serif text-stone-900 leading-tight truncate tracking-tighter">{user.name}</h2>
              </div>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                 <svg className="w-full h-full transform -rotate-90 filter drop-shadow-lg">
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-50" />
                    <circle cx="48" cy="48" r="42" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray={264} strokeDashoffset={264 - (264 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-xl font-black text-stone-800 leading-none">{Math.round(progressPercent)}%</span>
                 </div>
              </div>
            </header>
            <section className="bg-stone-950 rounded-[60px] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/95 group zen-card-glow transition-all duration-1000">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[8s]"></div>
               <div className="relative z-10">
                 <div className="flex items-center space-x-6 mb-8 md:mb-12">
                    <span className="w-8 h-8 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_40px_rgba(52,211,153,0.5)]"></span>
                    <p className="text-emerald-400 font-black text-[14px] uppercase tracking-[0.8em]">{t.tradition_title}</p>
                 </div>
                 <h3 className="text-3xl md:text-5xl font-light serif mb-10 md:mb-16 italic leading-[1.2] tracking-tighter text-white/98 max-w-2xl">"{zenQuote}"</h3>
                 <div className="flex flex-wrap gap-4 md:gap-8">
                   <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-950 px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[14px] md:text-[16px] shadow-xl hover:bg-emerald-50 transition-all active:scale-95">Enter Silence</button>
                   <button onClick={() => handleViewChange('library')} className="bg-stone-800/95 backdrop-blur-3xl text-stone-200 px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[14px] md:text-[16px] hover:bg-stone-700 transition-all border border-white/10">The Sanctum</button>
                 </div>
               </div>
            </section>
            <AdSlot key={`home-ad-${adRefreshKey}`} className="mb-4" />
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-6xl md:text-8xl font-black serif text-stone-900 tracking-tighter leading-none mb-6">The Vault</h2>
               <p className="text-stone-400 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl italic opacity-95 serif">Architectural soundscapes engineered for total cognitive surrender.</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] bg-stone-100 rounded-[48px] relative overflow-hidden cursor-pointer group shadow-xl border border-stone-100 hover:-translate-y-4 transition-all duration-700">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[30s] grayscale-[0.8] group-hover:grayscale-0" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/20 to-transparent"></div>
                  <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 text-white">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-3xl rounded-full text-[12px] font-black uppercase tracking-[0.2em] mb-4 border border-white/10">{session.category}</span>
                    <h4 className="text-3xl md:text-5xl font-black serif leading-tight mb-4 tracking-tighter">{session.title}</h4>
                    <span className="text-[14px] md:text-[16px] font-black uppercase tracking-[0.4em] opacity-80">{session.duration}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-12 border-t border-stone-100">
               <h3 className="text-3xl md:text-4xl font-black serif text-stone-900 mb-10 md:mb-16 flex items-center">
                 Ambient Alchemist
               </h3>
               <SoundMixer />
            </div>
          </div>
        )}

        {view === 'sleep' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
             <header>
               <h2 className="text-5xl md:text-8xl font-black serif text-stone-900 tracking-tighter leading-none mb-4">{t.sleep_title}</h2>
               <p className="text-stone-400 text-lg md:text-2xl mt-2 font-medium leading-relaxed serif italic opacity-95">{t.sleep_subtitle}</p>
             </header>
             <div className="grid grid-cols-1 gap-8">
                {SLEEP_STORIES.map(story => (
                  <div key={story.id} onClick={() => setActiveSession(story)} className="bg-white rounded-[40px] p-6 md:p-8 border border-stone-100 shadow-xl flex flex-col md:flex-row items-center md:space-x-12 cursor-pointer group hover:bg-stone-50 transition-all duration-700">
                     <div className="w-40 md:w-56 h-40 md:h-56 rounded-[32px] overflow-hidden shrink-0 shadow-xl mb-6 md:mb-0">
                        <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[15s]" alt={story.title} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[12px] md:text-[14px] font-black uppercase text-emerald-600 tracking-[0.4em] mb-4 block">{story.duration}</span>
                        <h4 className="text-2xl md:text-4xl font-black serif text-stone-900 mb-4 tracking-tighter">{story.title}</h4>
                        <p className="text-stone-500 text-lg md:text-xl leading-relaxed max-xl italic opacity-95 serif">"{story.description}"</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
             <header className="flex justify-between items-end border-b border-stone-100 pb-8">
               <div>
                 <h2 className="text-4xl md:text-6xl font-black serif text-stone-900 tracking-tighter mb-2">{t.nav_admin}</h2>
                 <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">V32 Deployment Control</p>
               </div>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-emerald-950 text-emerald-50 p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
                   <h3 className="text-2xl font-black serif mb-6">Sanctuary Asset Audit</h3>
                   <p className="text-[10px] text-emerald-300 mb-8 leading-relaxed uppercase tracking-[0.3em] font-black">Verify presence in /public folder:</p>
                   <div className="grid grid-cols-1 gap-4">
                     {PUBLIC_AUDIO_FILES.map(file => (
                       <div key={file} className="flex items-center justify-between p-5 bg-emerald-900/40 border border-emerald-500/20 rounded-3xl group hover:bg-emerald-800/60 transition-all">
                         <div className="flex items-center space-x-4">
                           <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,1)] animate-pulse"></div>
                           <span className="font-mono text-sm tracking-tight">{file}</span>
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 group-hover:opacity-100">Reachable</span>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="bg-stone-900 text-stone-100 p-10 rounded-[48px] shadow-xl border border-white/5">
                   <h3 className="text-2xl font-black serif mb-4">Version Info</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-stone-500 font-bold text-[10px] uppercase">Version Code</span>
                        <span className="text-emerald-400 font-black">32</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-stone-500 font-bold text-[10px] uppercase">Version Name</span>
                        <span className="text-emerald-400 font-black">6.3.0</span>
                      </div>
                   </div>
                   <div className="mt-12">
                     <ResourceItemMini name="V32 Release Bundle" url="/icon1.apk" label="icon1.apk" />
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

const ResourceItemMini = ({ name, url, label }: { name: string, url: string, label: string }) => (
  <div className="flex items-center justify-between group p-4 bg-white/5 rounded-2xl">
    <div>
      <p className="text-[10px] font-bold text-white">{name}</p>
      <p className="text-[8px] text-stone-400 font-mono">{label}</p>
    </div>
    <a href={url} download={label} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg">
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
    </a>
  </div>
);

export default App;
