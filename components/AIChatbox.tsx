
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';
import { translations } from '../translations';

interface AIChatboxProps {
  lang: Language;
}

const AIChatbox: React.FC<AIChatboxProps> = ({ lang }) => {
  const t = translations[lang] || translations['en'];
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const askAI = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResponse(null);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setResponse("Peace is within. (API Key not found)");
      setIsLoading(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const langMap: Record<Language, string> = {
      'en': 'English',
      'zh-Hans': 'Simplified Chinese',
      'zh-Hant': 'Traditional Chinese'
    };

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `The user says: "${input}". 
        Role: Empathetic Mindfulness Coach. 
        Instruction: Briefly acknowledge their feeling and suggest 3 concrete steps to relax right now. 
        Language: Respond in ${langMap[lang]}. 
        Format: Markdown (bullet points).`,
        config: {
          systemInstruction: "You are an empathetic, calm mindfulness guide. Your goal is to help users feel understood and provide actionable relaxation advice based on their current mood."
        }
      });
      
      setResponse(result.text || "Breathe deeply. This moment is yours.");
    } catch (error) {
      console.error("AI Error:", error);
      setResponse("The clouds will clear. Please try again in a moment.");
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-stone-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg relative shrink-0">
          <div className="absolute inset-0 bg-emerald-500 rounded-2xl animate-ping opacity-20 duration-[3s]"></div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        </div>
        <div>
          <h3 className="text-2xl font-black serif text-stone-900 leading-tight">{t.chat_title}</h3>
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">{t.chat_think}</p>
        </div>
      </div>

      {!response && !isLoading ? (
        <div className="space-y-6">
          <p className="text-stone-500 serif italic text-lg leading-relaxed">"{t.chat_greet}"</p>
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 font-medium text-stone-800 focus:ring-0 focus:border-emerald-200 transition-all serif"
              placeholder={t.chat_placeholder}
            />
            <button 
              onClick={askAI}
              className="absolute right-3 top-2 bottom-2 bg-stone-900 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
            >
              Check-in
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100/50 space-y-6 animate-in zoom-in-95 duration-500">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4 py-10">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">{t.chat_think}</p>
            </div>
          ) : (
            <>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">{t.chat_suggest}</h4>
              <div className="text-stone-700 serif italic text-lg leading-relaxed space-y-4 prose prose-emerald">
                {response?.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <button 
                onClick={() => setResponse(null)}
                className="w-full py-4 bg-white border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm active:scale-95 transition-all"
              >
                Clear Mind
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIChatbox;
