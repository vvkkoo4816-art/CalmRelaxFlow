
import React, { useState } from 'react';
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

  const askAI = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResponse(null);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setResponse("Peace is within, but your AI connection is not configured yet. (Please set up your Gemini API Key in the environment settings to enable the Mood Companion).");
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
          systemInstruction: "You are an empathetic, calm mindfulness guide. Help users feel understood and provide actionable relaxation advice based on their mood."
        }
      });
      
      setResponse(result.text || "Breathe deeply. This moment is yours.");
    } catch (error) {
      console.error("AI Error:", error);
      setResponse("The clouds will clear. Please try again in a moment. (Connection to the sanctuary AI failed).");
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-[48px] p-10 md:p-14 border border-stone-50 shadow-[0_30px_60px_rgba(0,0,0,0.04)] space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center space-x-6">
        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shrink-0">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        </div>
        <div>
          <h3 className="text-3xl font-black serif text-stone-900 leading-tight">{t.chat_title}</h3>
          <p className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.4em] mt-1">{t.chat_think}</p>
        </div>
      </div>

      {!response && !isLoading ? (
        <div className="space-y-8">
          <p className="text-stone-500 serif italic text-xl leading-relaxed">"{t.chat_greet}"</p>
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-[28px] px-8 py-5 font-medium text-stone-800 focus:ring-0 focus:border-emerald-200 transition-all serif text-lg"
              placeholder={t.chat_placeholder}
            />
            <button 
              onClick={askAI}
              className="absolute right-3 top-2.5 bottom-2.5 bg-stone-900 text-white px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
              Talk to me
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/50 p-10 rounded-[40px] border border-emerald-100/50 space-y-8 animate-in zoom-in-95 duration-500">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-6 py-14">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-emerald-600 font-black text-[11px] uppercase tracking-[0.4em]">{t.chat_think}</p>
            </div>
          ) : (
            <>
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-600">Reflection Received</h4>
              <div className="text-stone-700 serif italic text-xl leading-relaxed space-y-6">
                {response?.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <button 
                onClick={() => setResponse(null)}
                className="w-full py-5 bg-white border border-emerald-100 rounded-[28px] text-[11px] font-black uppercase tracking-widest text-emerald-600 shadow-sm active:scale-95 transition-all"
              >
                Clear Awareness
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIChatbox;
