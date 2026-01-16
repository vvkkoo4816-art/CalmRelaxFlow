import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language, JournalEntry } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES } from './constants';
import { translations } from './translations';
import { GoogleGenAI } from "@google/genai";

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

  // Auth States
  const [pendingLoginProvider, setPendingLoginProvider] = useState<'google' | 'facebook' | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  // Ad States
  const [isShowingInterstitial, setIsShowingInterstitial] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);

  // Asset Generation States (Admin Only)
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<{ url: string, type: 'icon' | 'feature' | 'play_asset' } | null>(null);

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
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('calmrelax_lang', newLang);
  };

  // AD NAVIGATION HOOK: Show ad when changing tabs
  const handleViewChange = (newView: AppView) => {
    if (newView === view) return;
    
    // Trigger interstitial ad overlay
    setPendingView(newView);
    setIsShowingInterstitial(true);
    
    // Auto-advance after 3 seconds (simulating ad time)
    setTimeout(() => {
      setIsShowingInterstitial(false);
      setView(newView);
      setPendingView(null);
    }, 3000);
  };

  const startLoginFlow = (provider: 'google' | 'facebook') => {
    setPendingLoginProvider(provider);
    setIsConsentModalOpen(true);
  };

  const finalizeLogin = () => {
    if (!pendingLoginProvider) return;
    const mockUser: User = {
      id: `${pendingLoginProvider}-123`,
      name: pendingLoginProvider === 'google' ? "Zen Explorer" : "Mindful Friend",
      email: pendingLoginProvider === 'google' ? "vvkkoo4816@gmail.com" : "friend@social.com",
      photoUrl: `https://ui-avatars.com/api/?name=${pendingLoginProvider === 'google' ? 'Zen+Explorer' : 'Mindful+Friend'}&background=${pendingLoginProvider === 'google' ? '10b981' : '1877f2'}&color=fff`,
      isLoggedIn: true,
      streak: 5,
      minutesMeditated: 420,
      role: 'admin',
      isPremium: true // All functions unlocked by default
    };
    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
    setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
    setIsConsentModalOpen(false);
    setPendingLoginProvider(null);
  };

  const handleSessionClick = (session: MeditationSession) => {
    setActiveSession(session);
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
        mood: 'Normal'
      };
      updatedJournals = [newEntry, ...journals];
    }
    setJournals(updatedJournals);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updatedJournals));
    setNewJournalText('');
    setEditingJournalId(null);
  };

  const generateAsset = async (type: 'icon' | 'feature' | 'play_asset') => {
    setIsGenerating(true);
    setGeneratedAsset(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = type === 'icon' 
        ? "Minimalist lotus app icon, green theme."
        : type === 'feature'
        ? "Serene lake background for app feature graphic."
        : "Google Play Store vertical app graphic, 500x1024, serene nature.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: type === 'icon' ? "1:1" : (type === 'feature' ? "16:9" : "9:16") } }
      });

      let foundImageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          foundImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (foundImageUrl) setGeneratedAsset({ url: foundImageUrl, type });
    } catch (err: any) {
      console.error("Asset Gen Failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
        {/* Language Selector Overlay */}
        <div className="absolute top-12 flex space-x-2 bg-stone-100 p-1.5 rounded-full border border-stone-200 shadow-sm z-50">
          <button onClick={() => changeLanguage('en')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'en' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>EN</button>
          <button onClick={() => changeLanguage('zh-Hans')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'zh-Hans' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>简体</button>
          <button onClick={() => changeLanguage('zh-Hant')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'zh-Hant' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>繁體</button>
        </div>

        {isConsentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsConsentModalOpen(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-10 animate-in zoom-in duration-300">
               <h3 className="text-xl font-black serif text-stone-900 mb-2">{t.auth_permission_title}</h3>
               <p className="text-stone-500 text-sm mb-6 leading-relaxed">{t.auth_permission_desc}</p>
               <button onClick={finalizeLogin} className="w-full bg-stone-900 text-white py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-stone-800 transition-all">
                 {t.auth_allow}
               </button>
            </div>
          </div>
        )}
        
        {/* Branding Container */}
        <div className="flex flex-col items-center relative z-10">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-500/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-4xl font-black serif mb-2 text-stone-900">CalmRelaxFlow</h1>
          <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mb-8">Pure Sanctuary</p>
          <p className="text-stone-400 font-medium mb-12 max-w-xs leading-relaxed">{t.app_slogan}</p>
          
          <div className="w-full max-w-sm space-y-4">
            <button onClick={() => startLoginFlow('google')} className="w-full bg-white border border-stone-200 text-stone-700 px-8 py-4 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-3 active:scale-95">
               <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="google" />
               <span>{t.sign_in_google}</span>
            </button>
            <button onClick={() => startLoginFlow('facebook')} className="w-full bg-[#1877F2] text-white px-8 py-4 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-3 active:scale-95">
               <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
               <span>{t.sign_in_facebook}</span>
            </button>
          </div>
        </div>

        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50"></div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto pb-24 space-y-12">
        
        {/* INTERSTITIAL AD OVERLAY (Shown on tab change) */}
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-10 text-center ad-interstitial-in">
             <div className="absolute top-6 right-6 flex items-center space-x-2">
               <div className="w-6 h-6 border-2 border-stone-100 border-t-emerald-500 rounded-full animate-spin"></div>
               <span className="text-[10px] font-black text-stone-400">LOADING...</span>
             </div>
             <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-4 inline-block">Mindful Moment</span>
                <h2 className="text-3xl font-black serif text-stone-900 mb-4">Discover Sanctuary</h2>
                <p className="text-stone-500 text-sm max-w-xs leading-relaxed">Wait a moment while we prepare your space. This sponsored moment keeps CalmRelaxFlow free for everyone.</p>
             </div>
             
             {/* Ad Body / Placement for AdMob Tag */}
             <div className="w-full aspect-[4/5] md:aspect-video bg-stone-100 rounded-[40px] overflow-hidden shadow-2xl relative mb-12 border-4 border-stone-50">
                <img src="https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover grayscale-[0.2]" alt="advertisement" />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[2px]">
                   <div className="bg-white p-8 rounded-[32px] shadow-2xl text-center max-w-[240px]">
                      <p className="text-stone-900 font-black serif text-lg mb-4">Deep Sleep Essentials</p>
                      <button onClick={() => window.open('https://google.com', '_blank')} className="w-full bg-stone-900 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">Learn More</button>
                   </div>
                </div>
                <div className="absolute top-4 left-4 bg-white/40 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-white">AD</div>
             </div>
             <p className="text-stone-300 text-[10px] font-black uppercase tracking-widest">Resuming in 3 seconds...</p>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
              <div>
                <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">{t.welcome_back}</p>
                <h2 className="text-4xl font-black serif text-stone-900">{user.name}</h2>
              </div>
            </header>
            <section className="bg-stone-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl">
               <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Daily Insight</p>
              <h3 className="text-2xl md:text-3xl font-black serif mb-8 italic leading-relaxed">"{zenQuote}"</h3>
              <button onClick={() => handleSessionClick(DAILY_MEDITATION)} className="bg-white text-stone-900 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-stone-50 transition-colors">Start Meditation</button>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <h2 className="text-3xl font-black serif text-stone-900">{t.nav_library}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => handleSessionClick(session)} className="aspect-[16/9] bg-stone-200 rounded-[40px] relative overflow-hidden cursor-pointer group shadow-sm border border-stone-100 hover:shadow-2xl transition-all">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[10s]" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-8 right-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">{session.category}</p>
                    <h4 className="text-white font-black text-xl serif leading-tight mb-2">{session.title}</h4>
                  </div>
                </div>
              ))}
            </div>
            <SoundMixer />
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900">{t.nav_breathing}</h2>
            <BreathingExercise lang={lang} />
          </div>
        )}

        {view === 'calm' && (
          <div className="space-y-10 animate-in fade-in duration-700 text-center">
             <div className="aspect-[3/4] md:aspect-video rounded-[60px] bg-stone-900 relative overflow-hidden shadow-2xl group">
               <img src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-[20s] scale-110 group-hover:scale-100" alt="Calm" />
               <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
                  <h3 className="text-4xl md:text-6xl font-black serif mb-6">Instant Calm</h3>
                  <p className="text-sm font-medium text-white/70 max-w-sm mb-12">Tap into immediate serenity with our curated peaceful soundscape.</p>
                  <button onClick={() => handleSessionClick(MEDITATION_SESSIONS[3])} className="bg-emerald-500 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform">
                    <svg className="w-10 h-10 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
               </div>
             </div>
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900">{t.journal_title}</h2>
            <div className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-xl">
               <textarea value={newJournalText} onChange={(e) => setNewJournalText(e.target.value)} placeholder={t.journal_placeholder} className="w-full h-40 bg-stone-50 rounded-3xl p-6 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none mb-4" />
               <div className="flex space-x-3">
                 <button onClick={saveJournal} className="flex-1 bg-emerald-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200">{editingJournalId ? t.journal_update : t.journal_save}</button>
                 {editingJournalId && <button onClick={() => { setEditingJournalId(null); setNewJournalText(''); }} className="px-6 bg-stone-100 text-stone-400 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px]">{t.journal_cancel}</button>}
               </div>
            </div>
            <div className="space-y-6">
              {journals.length === 0 ? <p className="text-center text-stone-300 italic py-10">{t.journal_empty}</p> : journals.map(entry => (
                <div key={entry.id} className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm relative group">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{entry.date}</span>
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditingJournalId(entry.id); setNewJournalText(entry.text); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-2 py-1 rounded-lg bg-emerald-50">{t.journal_edit}</button>
                      </div>
                   </div>
                   <p className="text-stone-700 leading-relaxed font-medium serif text-lg">"{entry.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <div className="text-center">
               <img src={user.photoUrl} className="w-28 h-28 rounded-[40px] border-4 border-white shadow-2xl mx-auto" alt="profile" />
               <h2 className="text-3xl font-black serif text-stone-900 mt-6">{user.name}</h2>
               <p className="text-stone-400 text-sm">{user.email}</p>
             </div>
             <div className="max-w-xs mx-auto space-y-4">
                <button onClick={() => { localStorage.removeItem('calmrelax_active_user'); window.location.reload(); }} className="w-full bg-red-50 text-red-500 px-8 py-5 rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-100 transition-colors">Sign Out</button>
             </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900">Admin Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button disabled={isGenerating} onClick={() => generateAsset('icon')} className="bg-emerald-500 text-white p-6 rounded-[40px] text-left shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
                <span className="font-black serif text-lg block">512x512 Icon</span>
              </button>
              <button disabled={isGenerating} onClick={() => generateAsset('feature')} className="bg-stone-800 text-white p-6 rounded-[40px] text-left shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
                <span className="font-black serif text-lg block">Feature Graphic</span>
              </button>
              <button disabled={isGenerating} onClick={() => generateAsset('play_asset')} className="bg-emerald-900 text-white p-6 rounded-[40px] text-left shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
                <span className="font-black serif text-lg block">Play Asset</span>
              </button>
            </div>
            {isGenerating && <p className="text-center text-stone-400 mt-6">Creating store assets...</p>}
            {generatedAsset && (
              <div className="text-center space-y-4 mt-8 animate-in zoom-in">
                <img src={generatedAsset.url} className="w-full max-w-xs rounded-3xl mx-auto shadow-2xl" />
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Asset Ready for Store Upload</p>
              </div>
            )}
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;