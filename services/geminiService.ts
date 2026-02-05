
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

/**
 * Gets a personalized mindfulness recommendation.
 * Returns static data if quota is limited or API fails.
 */
export const getPersonalizedRecommendation = async (mood: string, lang: Language = 'en') => {
  // Use process.env.API_KEY directly as per guidelines
  if (!process.env.API_KEY) return "Take a deep breath. You are exactly where you need to be.";

  // Create a new GoogleGenAI instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const langMap: Record<Language, string> = {
      'en': 'English',
      'zh-Hans': 'Simplified Chinese',
      'zh-Hant': 'Traditional Chinese'
    };

    // Use gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Mood: ${mood}. Provide 2 sentences of mindfulness advice in ${langMap[lang]}.`,
    });
    
    // .text is a property, not a method
    return response.text || "Breathe deeply and find your center today.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "The present moment is the only moment available to us, and it is the door to all moments.";
  }
};
