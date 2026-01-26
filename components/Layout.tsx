import React from 'react';
import { AppView, User, Language } from '../types';
import { translations } from '../translations';

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
  const isAdmin = user.email && user.email.toLowerCase().trim() === 'vvkkoo4816@gmail.com';

  return (
    <div className="flex flex-col flex-1 min-h-screen relative pb-32 max-w-full overflow-x-hidden">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-[#fdfcfb]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-stone-50">
        <div className="flex items-center space-x-3">
           <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
           </div>
           <div>
             <span className="text-3xl font-black tracking-tighter serif text-stone-900 block leading-tight">CalmRelaxFlow</span>
           </div>
        </div>
        <button onClick={() => setActiveView(isAdmin ? 'admin' : 'profile')} className="ml-4 shrink-0">
          <img src={user.photoUrl} className="w-12 h-12 rounded-2xl border-2 border-white shadow-lg" alt="profile" />
        </button>
      </header>

      <main className="flex-1 px-6 py-6 w-full">
        {children}
      </main>

      <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
        <nav className="flex justify-between items-center px-2 py-2 bg-stone-900/95 backdrop-blur-3xl rounded-[28px] border border-white/5 shadow-2xl w-full max-w-xl">
          <MobileNavItem active={activeView === 'today'} onClick={() => setActiveView('today')} icon={<TodayIcon active={activeView === 'today'} />} label={t.nav_today} />
          <MobileNavItem active={activeView === 'library'} onClick={() => setActiveView('library')} icon={<LibraryIcon active={activeView === 'library'} />} label={t.nav_library} />
          <MobileNavItem active={activeView === 'sleep'} onClick={() => setActiveView('sleep')} icon={<SleepIcon active={activeView === 'sleep'} />} label={t.nav_sleep} />
          <MobileNavItem active={activeView === 'journal'} onClick={() => setActiveView('journal')} icon={<JournalIcon active={activeView === 'journal'} />} label={t.nav_journal} />
          <MobileNavItem active={activeView === 'explore'} onClick={() => setActiveView('explore')} icon={<CourseIcon active={activeView === 'explore'} />} label={t.nav_breathing} />
          {isAdmin && (
            <MobileNavItem active={activeView === 'admin'} onClick={() => setActiveView('admin')} icon={<AdminIcon active={activeView === 'admin'} />} label={t.nav_admin} />
          )}
        </nav>
      </div>
    </div>
  );
};

const MobileNavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center flex-1 py-1">
    <div className={`p-2 rounded-xl mb-1 transition-all ${active ? 'bg-emerald-500 text-white shadow-lg' : 'text-stone-500'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tight ${active ? 'text-white' : 'text-stone-500'}`}>
      {label}
    </span>
  </button>
);

const TodayIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
);
const LibraryIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
);
const SleepIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
);
const JournalIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
);
const CourseIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
);
const AdminIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
);

export default Layout;