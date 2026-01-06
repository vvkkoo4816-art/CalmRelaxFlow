
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
  
  // Robust safety check
  if (!user) return null;

  // Strict admin check by email
  const isAdmin = user.email && user.email.toLowerCase() === 'vvkkoo4816@gmail.com';

  return (
    <div className="h-screen bg-[#fdfcfb] text-stone-900 flex flex-col overflow-hidden">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-72 bg-white border-r border-stone-100 p-8 space-y-10 fixed left-0 top-0 bottom-0 z-50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <span className="text-xl font-black tracking-tighter serif">ClamRelaxFlow</span>
        </div>

        <div className="flex-1 space-y-2">
          <NavItem active={activeView === 'today'} onClick={() => setActiveView('today')} icon={<TodayIcon active={activeView === 'today'} />} label={t.nav_today} />
          <NavItem active={activeView === 'library'} onClick={() => setActiveView('library')} icon={<LibraryIcon active={activeView === 'library'} />} label={t.nav_library} />
          <NavItem active={activeView === 'breathing'} onClick={() => setActiveView('breathing')} icon={<BreathingIcon active={activeView === 'breathing'} />} label={t.nav_breathing} />
          <NavItem active={activeView === 'sleep'} onClick={() => setActiveView('sleep')} icon={<SleepIcon active={activeView === 'sleep'} />} label={t.nav_sleep} />
          <NavItem active={activeView === 'explore'} onClick={() => setActiveView('explore')} icon={<ExploreIcon active={activeView === 'explore'} />} label={t.nav_explore} />
          {isAdmin && (
            <NavItem active={activeView === 'admin'} onClick={() => setActiveView('admin')} icon={<AdminIcon active={activeView === 'admin'} />} label={t.nav_admin} />
          )}
          <NavItem active={activeView === 'profile'} onClick={() => setActiveView('profile')} icon={<ProfileIcon active={activeView === 'profile'} />} label={t.nav_profile} />
        </div>

        <div className="p-4 bg-stone-50 rounded-3xl flex items-center space-x-4 border border-stone-100 shadow-inner">
          <img src={user.photoUrl} alt="Profile" className="w-10 h-10 rounded-full bg-stone-200 object-cover border-2 border-white shadow-sm" />
          <div className="overflow-hidden">
            <p className="text-sm font-black truncate text-stone-800">{user.name}</p>
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{user.streak} {t.day_streak}</p>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scroll-container md:ml-72 relative">
        <div className="p-6 md:p-16 w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Android Bottom Navigation */}
      <nav className="md:hidden flex justify-around items-center px-2 pt-3 pb-[calc(1.2rem+var(--safe-area-inset-bottom))] bg-white/90 backdrop-blur-2xl border-t border-stone-100 fixed bottom-0 left-0 right-0 z-50 overflow-x-auto">
        <MobileNavItem active={activeView === 'today'} onClick={() => setActiveView('today')} icon={<TodayIcon active={activeView === 'today'} />} label={t.nav_today} />
        <MobileNavItem active={activeView === 'library'} onClick={() => setActiveView('library')} icon={<LibraryIcon active={activeView === 'library'} />} label={t.nav_library} />
        <MobileNavItem active={activeView === 'breathing'} onClick={() => setActiveView('breathing')} icon={<BreathingIcon active={activeView === 'breathing'} />} label={t.nav_breathing} />
        <MobileNavItem active={activeView === 'sleep'} onClick={() => setActiveView('sleep')} icon={<SleepIcon active={activeView === 'sleep'} />} label={t.nav_sleep} />
        <MobileNavItem active={activeView === 'explore'} onClick={() => setActiveView('explore')} icon={<ExploreIcon active={activeView === 'explore'} />} label={t.nav_explore} />
        {isAdmin && (
          <MobileNavItem active={activeView === 'admin'} onClick={() => setActiveView('admin')} icon={<AdminIcon active={activeView === 'admin'} />} label={t.nav_admin} />
        )}
        <MobileNavItem active={activeView === 'profile'} onClick={() => setActiveView('profile')} icon={<ProfileIcon active={activeView === 'profile'} />} label={t.nav_profile} />
      </nav>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[24px] transition-all group active:scale-[0.97] ${active ? 'bg-stone-900 text-white shadow-xl shadow-stone-200' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-700'}`}>
    <span className={`${active ? 'text-emerald-400' : 'text-stone-300'}`}>{icon}</span>
    <span className="font-black text-xs uppercase tracking-widest truncate">{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center min-w-[70px] group transition-all shrink-0">
    <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110' : 'text-stone-300'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <span className={`text-[9px] mt-1.5 font-black uppercase tracking-[0.05em] transition-colors duration-300 ${active ? 'text-emerald-600' : 'text-stone-300'} truncate w-full text-center`}>
      {label}
    </span>
  </button>
);

// Icons
const TodayIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className || "w-6 h-6"} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>
);
const LibraryIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className || "w-6 h-6"} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
);
const BreathingIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className || "w-6 h-6"} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 12a7.5 7.5 0 0015 0 7.5 7.5 0 00-15 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v6m-3-3h6"/></svg>
);
const SleepIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className || "w-6 h-6"} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
);
const ExploreIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className || "w-6 h-6"} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
);
const ProfileIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className || "w-6 h-6"} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
);
const AdminIcon = ({ active, className }: { active?: boolean, className?: string }) => (
  <svg className={className || "w-6 h-6"} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
);

export default Layout;
