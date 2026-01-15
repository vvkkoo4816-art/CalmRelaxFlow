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
  const t = translations[lang] || translations['en'];
  
  if (!user) return null;
  const isAdmin = user.email && user.email.toLowerCase().trim() === 'vvkkoo4816@gmail.com';

  return (
    <div className="flex flex-col flex-1 min-h-screen relative pb-32">
      {/* Premium Boutique Header */}
      <header className="px-8 pt-12 pb-6 flex justify-between items-center bg-[#fdfcfb]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center space-x-3">
           <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
           </div>
           <div>
             <span className="text-2xl font-black tracking-tighter serif text-stone-900 block leading-none">CalmRelaxFlow</span>
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600">Pure Sanctuary</span>
           </div>
        </div>
        <button onClick={() => setActiveView('profile')} className="relative group">
          <img src={user.photoUrl} className="w-11 h-11 rounded-[18px] border-2 border-white shadow-lg transition-transform group-active:scale-90" alt="profile" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-8 py-6 overflow-x-hidden">
        {children}
      </main>

      {/* Responsive Premium Bottom Navigation */}
      <div className="fixed bottom-8 left-6 right-6 z-50 flex justify-center pointer-events-none">
        <nav className="flex justify-between items-center px-4 py-3 bg-stone-900/95 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl w-full max-w-lg pointer-events-auto">
          <MobileNavItem active={activeView === 'today'} onClick={() => setActiveView('today')} icon={<TodayIcon active={activeView === 'today'} />} label={t.nav_today} />
          <MobileNavItem active={activeView === 'library'} onClick={() => setActiveView('library')} icon={<LibraryIcon active={activeView === 'library'} />} label={t.nav_library} />
          <MobileNavItem active={activeView === 'sleep'} onClick={() => setActiveView('sleep')} icon={<SleepIcon active={activeView === 'sleep'} />} label={t.nav_sleep} />
          <MobileNavItem active={activeView === 'explore'} onClick={() => setActiveView('explore')} icon={<ExploreIcon active={activeView === 'explore'} />} label={t.nav_explore} />
          {isAdmin && (
            <MobileNavItem active={activeView === 'admin'} onClick={() => setActiveView('admin')} icon={<AdminIcon active={activeView === 'admin'} />} label={t.nav_admin} />
          )}
        </nav>
      </div>
    </div>
  );
};

const MobileNavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center flex-1 min-w-0 group transition-all relative">
    <div className={`p-2.5 rounded-2xl mb-1 transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 scale-110' : 'text-stone-500 group-hover:text-stone-300'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors duration-300 truncate w-full text-center ${active ? 'text-white' : 'text-stone-500'}`}>
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
const ExploreIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
);
const AdminIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
);

export default Layout;