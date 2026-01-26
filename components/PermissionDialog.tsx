
import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface PermissionDialogProps {
  isOpen: boolean;
  onAllow: () => void;
  onCancel: () => void;
  lang: Language;
  provider: 'Google' | 'Facebook';
}

const PermissionDialog: React.FC<PermissionDialogProps> = ({ isOpen, onAllow, onCancel, lang, provider }) => {
  const t = translations[lang] || translations['en'];
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping duration-[3s]"></div>
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <h3 className="text-2xl font-black serif text-stone-900 text-center mb-4">{t.auth_permission_title}</h3>
        <p className="text-stone-500 text-sm text-center leading-relaxed mb-8 serif italic">
          {t.auth_permission_desc}
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              {provider === 'Google' ? (
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="google" />
              ) : (
                <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              )}
            </div>
            <div>
              <p className="text-xs font-black text-stone-800 uppercase tracking-widest">Identity Sync</p>
              <p className="text-[10px] text-stone-400">Secure link with your {provider} account</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="w-10 h-10 flex items-center justify-center text-emerald-500 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-black text-stone-800 uppercase tracking-widest">Zen Mapping</p>
              <p className="text-[10px] text-stone-400">Detect nearest calm centers and verify region</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button 
            onClick={onAllow}
            className="w-full bg-emerald-500 text-white py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 active:scale-95 transition-all"
          >
            {t.auth_allow}
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-4 rounded-full font-black text-xs text-stone-300 uppercase tracking-widest hover:text-stone-500 transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDialog;
