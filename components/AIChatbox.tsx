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
      setIsLoading(false);
      setResponse("The sanctuary's AI portal is awaiting its key activation.");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const langMap: Record<Language, string> = {
        'en': 'English',
        'zh-Hans': 'Simplified Chinese',
        'zh-Hant': 'Traditional Chinese'
      };

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: `You are an empathetic, calm mindfulness guide. 
          Help users feel understood and provide 3 concrete steps to relax right now. 
          Respond in ${langMap[lang]}. Format with Markdown bullet points.`,
          temperature: 0.7
        }
      });
      
      const generatedText = result.text;
      setResponse(generatedText || "Breathe deeply. This moment is yours.");
    } catch (error: any) {
      console.error("AI Sanctuary Error:", error);
      if (error?.message?.includes('429')) {
        setResponse("The AI Sanctuary is currently resting due to high vibrations (capacity limit). Please try again in a moment.");
      } else {
        setResponse("The digital clouds are passing. Please ensure your sanctuary connection is stable and try again.");
      }
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-[32px] sm:rounded-[48px] p-8 sm:p-14 border border-stone-50 shadow-[0_30px_60px_rgba(0,0,0,0.04)] space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center space-x-6">
        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        </div>
        <div>
          <h3 className="text-2xl font-black serif text-stone-900 leading-tight">{t.chat_title}</h3>
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">{t.chat_think}</p>
        </div>
      </div>

      {!response && !isLoading ? (
        <div className="space-y-8">
          <p className="text-stone-500 serif italic text-lg leading-relaxed">"{t.chat_greet}"</p>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 font-medium text-stone-800 focus:ring-0 focus:border-emerald-200 transition-all serif text-base"
              placeholder={t.chat_placeholder}
            />
            <button onClick={askAI} className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl">Talk to me</button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100/50 space-y-8 animate-in zoom-in-95 duration-500">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-6 py-10">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em]">{t.chat_think}</p>
            </div>
          ) : (
            <>
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-600">Reflection Received</h4>
              <div className="text-stone-700 serif italic text-lg leading-relaxed space-y-6 break-words">
                {response?.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <button onClick={() => setResponse(null)} className="w-full py-4 bg-white border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm transition-all">Clear Awareness</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIChatbox;