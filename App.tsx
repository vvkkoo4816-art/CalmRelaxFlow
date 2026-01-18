import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language, JournalEntry } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS, STATIC_QUOTES, SLEEP_STORIES } from './constants';
import { translations } from './translations';
import { getPersonalizedRecommendation } from './services/geminiService';

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
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isShowingInterstitial, setIsShowingInterstitial] = useState(false);

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

  const handleViewChange = (newView: AppView) => {
    if (newView === view) return;
    setIsShowingInterstitial(true);
    setTimeout(() => {
      setIsShowingInterstitial(false);
      setView(newView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 500); 
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setIsAiLoading(true);
    try {
      const tip = await getPersonalizedRecommendation(mood, lang);
      setAiTip(tip);
    } catch (e) {
      setAiTip(translations[lang]?.mood_fallback || "Breathe. You are exactly where you need to be.");
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
      streak: 32,
      minutesMeditated: 5400,
      role: 'admin',
      isPremium: true
    };
    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
    setZenQuote(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
    setIsConsentModalOpen(false);
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        {/* Professional Language Bar */}
        <div className="absolute top-12 flex space-x-1.5 bg-stone-200/50 backdrop-blur-xl p-1.5 rounded-full border border-stone-300/20 z-50">
          {(['en', 'zh-Hans', 'zh-Hant'] as Language[]).map(l => (
            <button key={l} onClick={() => changeLanguage(l)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-white text-stone-900 shadow-xl' : 'text-stone-500 hover:text-stone-800'}`}>
              {l === 'en' ? 'EN' : l === 'zh-Hans' ? '简体' : '繁體'}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-32 duration-1000">
          <div className="w-36 h-36 bg-emerald-500 rounded-[48px] flex items-center justify-center text-white mb-12 shadow-[0_40px_100px_rgba(16,185,129,0.5)] animate-bounce duration-[8s]">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <h1 className="text-7xl font-black serif mb-6 text-stone-900 tracking-tighter">CalmRelaxFlow</h1>
          <p className="text-stone-400 font-medium mb-24 max-w-sm leading-relaxed mx-auto text-2xl italic serif">{t.app_slogan}</p>
          
          <div className="w-full max-w-xs flex flex-col space-y-5">
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-white border border-stone-200 text-stone-800 px-10 py-6 rounded-full font-black shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center space-x-5 active:scale-95 group">
               <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-8 h-8 group-hover:scale-110 transition-transform" alt="google" />
               <span className="text-lg tracking-tight uppercase">{t.sign_in_google}</span>
            </button>
            <button onClick={() => setIsConsentModalOpen(true)} className="w-full bg-[#1877F2] text-white px-10 py-6 rounded-full font-black shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center space-x-5 active:scale-95 group border-b-8 border-blue-900">
               <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               <span className="text-lg tracking-tight uppercase">{t.sign_in_facebook}</span>
            </button>
          </div>
        </div>

        {/* Abstract Zen Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
           <div className="absolute top-[-20%] left-[-10%] w-[150%] h-[150%] bg-gradient-radial from-emerald-950 to-transparent blur-[150px]"></div>
           <svg className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] text-stone-900 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>

        {isConsentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-stone-950/95 backdrop-blur-3xl">
            <div className="bg-white w-full max-w-sm rounded-[72px] p-14 shadow-2xl animate-in zoom-in duration-700">
               <h3 className="text-5xl font-black serif text-stone-900 mb-6">{t.auth_permission_title}</h3>
               <p className="text-stone-500 text-xl mb-16 leading-relaxed serif italic">{t.auth_permission_desc}</p>
               <div className="flex flex-col space-y-6">
                 <button onClick={finalizeLogin} className="w-full bg-emerald-600 text-white py-7 rounded-full font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-700 transition-all">{t.auth_allow}</button>
                 <button onClick={() => setIsConsentModalOpen(false)} className="w-full text-stone-400 py-4 rounded-full font-black text-sm uppercase tracking-[0.4em]">{t.auth_deny}</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const progressPercent = Math.min((user.minutesMeditated % 60 / 30) * 100, 100);
  const zenLevel = Math.floor(user.minutesMeditated / 150) + 1;

  return (
    <Layout activeView={view} setActiveView={handleViewChange} user={user} lang={lang}>
      <div className="max-w-3xl mx-auto pb-64 space-y-28 px-4">
        
        {isShowingInterstitial && (
          <div className="fixed inset-0 z-[1000] bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center ad-interstitial-in">
             <div className="w-32 h-32 border-[14px] border-emerald-50 border-t-emerald-500 rounded-full animate-spin mb-14 shadow-2xl shadow-emerald-500/50"></div>
             <p className="text-emerald-800 font-black text-[20px] uppercase tracking-[1.2em] animate-pulse italic">Aligning Frequency...</p>
          </div>
        )}

        {view === 'today' && (
          <div className="space-y-24 animate-in fade-in duration-1000">
            {/* Status Card Elite */}
            <header className="flex justify-between items-center bg-white p-16 rounded-[80px] border border-stone-100 shadow-2xl shadow-stone-200/40">
              <div className="min-w-0">
                <div className="flex items-center space-x-5 mb-5">
                   <span className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[12px] font-black uppercase tracking-[0.2em] shadow-sm">Zen Master • Lv {zenLevel}</span>
                   <p className="text-stone-400 font-black text-[13px] uppercase tracking-[0.7em]">{t.welcome_back}</p>
                </div>
                <h2 className="text-7xl font-black serif text-stone-900 leading-tight truncate tracking-tighter">{user.name}</h2>
              </div>
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                 <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-stone-50" />
                    <circle cx="64" cy="64" r="58" stroke="#10b981" strokeWidth="14" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-[18px] font-black text-stone-800 leading-none">{Math.round(progressPercent)}%</span>
                 </div>
              </div>
            </header>

            {/* Tradition Wisdom Card */}
            <section className="bg-stone-950 rounded-[112px] p-24 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/90 group zen-card-glow transition-all duration-1000">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[10s]"></div>
               <div className="relative z-10">
                 <div className="flex items-center space-x-10 mb-24">
                    <span className="w-10 h-10 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_70px_rgba(52,211,153,1)]"></span>
                    <p className="text-emerald-400 font-black text-[18px] uppercase tracking-[1.5em]">{t.tradition_title}</p>
                 </div>
                 <h3 className="text-7xl font-light serif mb-36 italic leading-[1.2] tracking-tighter text-white/95 max-w-3xl">"{zenQuote}"</h3>
                 <div className="flex flex-wrap gap-14">
                   <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-950 px-28 py-14 rounded-full font-black uppercase tracking-[0.8em] text-[18px] shadow-2xl hover:bg-emerald-50 transition-all active:scale-95">Enter Silence</button>
                   <button onClick={() => handleViewChange('library')} className="bg-stone-800/90 backdrop-blur-3xl text-stone-200 px-28 py-14 rounded-full font-black uppercase tracking-[0.8em] text-[18px] hover:bg-stone-700 transition-all border border-white/10">The Sanctum</button>
                 </div>
               </div>
               <div className="absolute -bottom-60 -right-60 p-24 opacity-[0.1] pointer-events-none transform -rotate-12 scale-[2]">
                  <svg className="w-[800px] h-[800px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
               </div>
            </section>

            {/* Personalized Heart Vibrations */}
            <section className="bg-white rounded-[100px] p-24 border border-stone-100 shadow-2xl shadow-stone-200/50 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-5 bg-gradient-to-r from-emerald-50 via-emerald-500 to-emerald-50 opacity-80"></div>
               <h3 className="font-black serif text-5xl mb-20 text-center text-stone-900 tracking-tighter">Tune your inner Frequency</h3>
               <div className="flex justify-between items-center mb-28 px-10">
                  {[
                    { label: 'High', emoji: '✨' },
                    { label: 'Calm', emoji: '🧘' },
                    { label: 'Heavy', emoji: '🌑' },
                    { label: 'Vast', emoji: '🌌' },
                    { label: 'Soft', emoji: '☁️' }
                  ].map(mood => (
                    <button 
                      key={mood.label} 
                      onClick={() => handleMoodSelect(mood.label)} 
                      className={`flex flex-col items-center space-y-10 transition-all duration-1000 ${selectedMood === mood.label ? 'scale-125' : 'opacity-25 hover:opacity-100 grayscale hover:grayscale-0'}`}
                    >
                       <div className={`text-8xl transform hover:rotate-12 transition-transform filter drop-shadow-3xl ${selectedMood === mood.label ? 'animate-bounce' : ''}`}>
                         {mood.emoji}
                       </div>
                       <span className={`text-[14px] font-black uppercase tracking-[0.6em] ${selectedMood === mood.label ? 'text-emerald-600' : 'text-stone-400'}`}>{mood.label}</span>
                    </button>
                  ))}
               </div>
               {(selectedMood || isAiLoading) && (
                 <div className="bg-emerald-50/90 p-24 rounded-[96px] border border-emerald-100/80 animate-in slide-in-from-top-20 duration-1000 text-center relative overflow-hidden">
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-10 text-emerald-600 py-20">
                        <div className="w-20 h-20 border-[10px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <span className="text-[22px] font-black uppercase tracking-[1.2em] italic opacity-70">Synthesizing Resonance...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <p className="text-stone-900 text-4xl italic font-medium leading-[1.4] serif px-14">"{aiTip}"</p>
                        <div className="mt-16 flex justify-center space-x-8">
                          <span className="w-6 h-6 bg-emerald-400 rounded-full animate-pulse shadow-3xl"></span>
                          <span className="w-6 h-6 bg-emerald-600 rounded-full animate-pulse delay-150 shadow-3xl"></span>
                          <span className="w-6 h-6 bg-emerald-400 rounded-full animate-pulse delay-300 shadow-3xl"></span>
                        </div>
                      </div>
                    )}
                 </div>
               )}
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
             <header>
               <h2 className="text-9xl font-black serif text-stone-900 tracking-tighter">The Vault</h2>
               <p className="text-stone-400 text-4xl mt-14 font-medium leading-relaxed max-w-3xl italic opacity-90 serif">Master-grade sonic architectures designed for total cognitive surrender.</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-28">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-[4/3] bg-stone-100 rounded-[100px] relative overflow-hidden cursor-pointer group shadow-2xl border border-stone-100 hover:-translate-y-14 transition-all duration-1000">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[70s] grayscale-[0.85] group-hover:grayscale-0" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/100 via-stone-900/60 to-transparent"></div>
                  <div className="absolute bottom-28 left-28 right-28">
                    <span className="inline-block px-14 py-6 bg-white/20 backdrop-blur-3xl text-emerald-400 rounded-[36px] text-[16px] font-black uppercase tracking-[1.2em] mb-14 border border-white/10">{session.category}</span>
                    <h4 className="text-white font-black text-8xl serif leading-tight mb-12 tracking-tighter">{session.title}</h4>
                    <p className="text-white/85 text-[20px] font-black uppercase tracking-[1em] flex items-center">
                      <svg className="w-12 h-12 mr-12 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                      {session.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-32 border-t border-stone-100">
               <h3 className="text-6xl font-black serif text-stone-900 mb-24 px-12 flex items-center">
                 <span className="w-24 h-24 bg-stone-950 rounded-[40px] flex items-center justify-center text-white mr-14 shadow-3xl">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14"/></svg>
                 </span>
                 Ambient Alchemist
               </h3>
               <SoundMixer />
            </div>
          </div>
        )}
      </div>
      {activeSession && <AudioPlayer url={activeSession.audioUrl} title={activeSession.title} onClose={() => setActiveSession(null)} />}
    </Layout>
  );
};

export default App;