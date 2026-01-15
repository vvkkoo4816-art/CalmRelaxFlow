import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AudioPlayer from './components/AudioPlayer';
import SoundMixer from './components/SoundMixer';
import BreathingExercise from './components/BreathingExercise';
import { AppView, User, MeditationSession, Language, ZenCenter, JournalEntry } from './types';
import { DAILY_MEDITATION, MEDITATION_SESSIONS } from './constants';
import { translations } from './translations';
import { getPersonalizedRecommendation, findNearbyZenCenters } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('today');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [zenQuote, setZenQuote] = useState<string | null>(null);
  const [zenCenters, setZenCenters] = useState<ZenCenter[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [newJournalText, setNewJournalText] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);

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
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && view === 'explore' && zenCenters.length === 0) {
      loadZenCenters();
    }
  }, [isLoggedIn, view]);

  const loadZenCenters = async () => {
    setIsLoadingCenters(true);
    // Use San Francisco coordinates as default
    const centers = await findNearbyZenCenters(37.7749, -122.4194);
    setZenCenters(centers);
    setIsLoadingCenters(false);
  };

  const saveJournal = () => {
    if (!newJournalText.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      text: newJournalText,
      mood: mood || 'Calm'
    };
    const updated = [entry, ...journals];
    setJournals(updated);
    localStorage.setItem('calmrelax_journals', JSON.stringify(updated));
    setNewJournalText('');
  };

  const fetchZenQuote = async () => {
    setIsLoadingQuote(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a single, short, powerful mindfulness mantra in ${lang}. Maximum 10 words.`,
      });
      setZenQuote(response.text || "Breathe.");
    } catch (err) {
      setZenQuote("Peace begins with a smile.");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleGoogleLogin = () => {
    const mockUser: User = {
      id: "google-123",
      name: "Zen Explorer",
      email: "vvkkoo4816@gmail.com",
      photoUrl: "https://ui-avatars.com/api/?name=Zen+Explorer&background=10b981&color=fff",
      isLoggedIn: true,
      streak: 5,
      minutesMeditated: 420,
      role: 'admin'
    };
    setUser(mockUser);
    setIsLoggedIn(true);
    localStorage.setItem('calmrelax_active_user', JSON.stringify(mockUser));
    fetchZenQuote();
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mb-8 shadow-2xl">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <h1 className="text-4xl font-black serif mb-4 text-stone-900">CalmRelaxFlow</h1>
        <p className="text-stone-400 font-medium mb-12 max-w-xs">{t.app_slogan}</p>
        <button onClick={handleGoogleLogin} className="w-full max-w-sm bg-white border border-stone-200 text-stone-700 px-8 py-4 rounded-full font-bold shadow-sm hover:shadow-md transition-all">
          {t.sign_in_google}
        </button>
      </div>
    );
  }

  return (
    <Layout activeView={view} setActiveView={setView} user={user} lang={lang}>
      <div className="max-w-2xl mx-auto pb-24 space-y-12">
        {view === 'today' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <header className="flex justify-between items-end">
              <div>
                <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">{t.welcome_back}</p>
                <h2 className="text-4xl font-black serif text-stone-900">{user.name}</h2>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm text-center">
                 <span className="text-xl font-black serif text-stone-800">{user.streak}</span>
                 <p className="text-[8px] font-black uppercase text-stone-400">Streak</p>
              </div>
            </header>

            <section className="bg-stone-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl">
              <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Focus of the Day</p>
              <h3 className="text-3xl font-black serif mb-8 italic">
                {isLoadingQuote ? "..." : `"${zenQuote || 'Quiet the mind, and the soul will speak.'}"`}
              </h3>
              <button onClick={() => setActiveSession(DAILY_MEDITATION)} className="bg-white text-stone-900 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl">
                Start Session
              </button>
            </section>
          </div>
        )}

        {view === 'explore' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900">{t.nav_explore}</h2>
            
            <section className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-xl">
              <h3 className="text-xl font-black text-stone-800 mb-2 serif">{t.zen_centers_nearby}</h3>
              <p className="text-stone-400 text-sm mb-6">{t.find_peace_locally}</p>
              
              <div className="space-y-4">
                {isLoadingCenters ? (
                  <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : zenCenters.map((center, i) => (
                  <a key={i} href={center.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-stone-50 rounded-3xl hover:bg-emerald-50 transition-colors group">
                    <div>
                      <h4 className="font-black text-stone-900 text-sm">{center.name}</h4>
                      <p className="text-[10px] text-stone-400">{center.address}</p>
                    </div>
                    <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                  </a>
                ))}
              </div>
            </section>
            
            <BreathingExercise lang={lang} />
          </div>
        )}

        {view === 'journal' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black serif text-stone-900">{t.journal_title}</h2>
            
            <div className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-xl">
               <textarea 
                 value={newJournalText}
                 onChange={(e) => setNewJournalText(e.target.value)}
                 placeholder={t.journal_placeholder}
                 className="w-full h-40 bg-stone-50 rounded-3xl p-6 text-stone-700 font-medium placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none mb-4"
               />
               <button onClick={saveJournal} className="w-full bg-emerald-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200">
                 {t.journal_save}
               </button>
            </div>

            <div className="space-y-6">
              {journals.length === 0 ? (
                <p className="text-center text-stone-300 italic py-10">{t.journal_empty}</p>
              ) : journals.map(entry => (
                <div key={entry.id} className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{entry.date}</span>
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">{entry.mood}</span>
                   </div>
                   <p className="text-stone-700 leading-relaxed font-medium serif text-lg">"{entry.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <h2 className="text-3xl font-black serif text-stone-900">Library</h2>
             <div className="grid grid-cols-2 gap-6">
              {MEDITATION_SESSIONS.map(session => (
                <div key={session.id} onClick={() => setActiveSession(session)} className="aspect-square bg-stone-200 rounded-[40px] relative overflow-hidden cursor-pointer group shadow-sm border border-stone-100 hover:shadow-2xl transition-all">
                  <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[10s]" alt={session.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">{session.category}</p>
                    <h4 className="text-white font-black text-sm serif leading-tight">{session.title}</h4>
                  </div>
                </div>
              ))}
            </div>
            <SoundMixer />
          </div>
        )}
      </div>

      {activeSession && (
        <AudioPlayer 
          url={activeSession.audioUrl} 
          title={activeSession.title} 
          onClose={() => setActiveSession(null)} 
        />
      )}
    </Layout>
  );
};

export default App;