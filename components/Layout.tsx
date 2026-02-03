
import React from 'react';
import { AppView, User, Language } from '../types';
import { translations } from '../translations';
import { ADMIN_EMAIL } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  user: User | null;
  lang: Language;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, user, lang }) => {
  const t = translations[lang] || translations['zh-Hant'];
  
  if (!user) return null;
  const isAdmin = user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL;

  return (
    <div className="flex flex-col flex-1 min-h-screen relative pb-32 max-w-full overflow-x-hidden">
      <header className="px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sm:pb-6 flex justify-between items-center bg-[#fdfcfb]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-stone-100">
        <div className="flex items-center space-x-2 sm:space-x-3">
           <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
             <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
           </div>
           <div className="min-w-0">
             <span className="text-xl sm:text-3xl font-black tracking-tighter serif text-stone-900 block leading-tight truncate">CalmRelaxFlow</span>
           </div>
        </div>
        <button onClick={() => setActiveView(isAdmin ? 'admin' : 'profile')} className="ml-2 sm:ml-4 shrink-0 hover:scale-105 transition-transform active:scale-95">
          <img src={user.photoUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-white shadow-lg" alt="profile" />
        </button>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 w-full">
        {children}
      </main>

      <footer className="px-6 py-12 border-t border-stone-100 bg-stone-50/50 mt-10">
        <div className="max-w-3xl mx-auto flex flex-col items-center space-y-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">© 2024 CalmRelaxFlow Sanctuary</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="/privacy.html" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <a href="/terms.html" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-emerald-500 transition-colors">Terms of Service</a>
            <button onClick={() => setActiveView('today')} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-emerald-500 transition-colors">Home Sanctuary</button>
          </div>
          <p className="text-[9px] text-stone-300 serif italic leading-relaxed max-w-xs">
            A professional high-fidelity platform dedicated to architectural mindfulness and cognitive recovery.
          </p>
        </div>
      </footer>

      <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
        <nav className="flex justify-between items-center px-2 py-1.5 bg-stone-900/95 backdrop-blur-3xl rounded-[28px] border border-white/5 shadow-2xl w-full max-w-2xl overflow-x-auto">
          <MobileNavItem active={activeView === 'today'} onClick={() => setActiveView('today')} icon={<TodayIcon active={activeView === 'today'} />} label={t.nav_today} />
          <MobileNavItem active={activeView === 'library'} onClick={() => setActiveView('library')} icon={<LibraryIcon active={activeView === 'library'} />} label={t.nav_library} />
          <MobileNavItem active={activeView === 'sleep'} onClick={() => setActiveView('sleep')} icon={<SleepIcon active={activeView === 'sleep'} />} label={t.nav_sleep} />
          <MobileNavItem active={activeView === 'journal'} onClick={() => setActiveView('journal')} icon={<JournalIcon active={activeView === 'journal'} />} label={t.nav_journal} />
          <MobileNavItem active={activeView === 'explore'} onClick={() => setActiveView('explore')} icon={<BreathIcon active={activeView === 'explore'} />} label={t.nav_breathing} />
          {isAdmin && (
            <MobileNavItem active={activeView === 'admin'} onClick={() => setActiveView('admin')} icon={<AdminIcon active={activeView === 'admin'} />} label={t.nav_admin} />
          )}
        </nav>
      </div>
    </div>
  );
};

const MobileNavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center flex-1 py-1 group min-w-[50px]">
    <div className={`p-2 rounded-xl mb-1 transition-all group-active:scale-90 ${active ? 'bg-emerald-500 text-white shadow-lg' : 'text-stone-500'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-tight whitespace-nowrap ${active ? 'text-white' : 'text-stone-500'}`}>
      {label}
    </span>
  </button>
);

const TodayIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
);
const LibraryIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
);
const SleepIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
);
const JournalIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
);
const BreathIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
);
const AdminIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

export default Layout;
