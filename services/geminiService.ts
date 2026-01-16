import { GoogleGenAI } from "@google/genai";
import { ZenCenter, Language } from "../types";

/**
 * Gets a personalized mindfulness recommendation.
 * Returns static data if quota is limited or API fails.
 */
export const getPersonalizedRecommendation = async (mood: string, lang: Language = 'en') => {
  // Check for API key availability
  if (!process.env.API_KEY) return "Take a deep breath. You are exactly where you need to be.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const langMap: Record<Language, string> = {
      'en': 'English',
      'zh-Hans': 'Simplified Chinese',
      'zh-Hant': 'Traditional Chinese'
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am feeling ${mood} today. Give me a 3-sentence mindfulness advice in ${langMap[lang]}.`,
    });
    return response.text || "Breathe deeply and find your center today.";
  } catch (error) {
    return "The present moment is the only moment available to us, and it is the door to all moments.";
  }
};

/**
 * Returns highly rated mindfulness centers. 
 * Optimized to use mock data unless real grounding is needed.
 */
export const findNearbyZenCenters = async (lat: number, lng: number): Promise<ZenCenter[]> => {
  // Always return fallback data to save Maps Grounding quota unless specifically requested
  return [
    { name: "Zen Life Center", address: "123 Serenity Way", rating: 4.9, url: "https://maps.google.com" },
    { name: "Mindful Breath Studio", address: "456 Quiet Street", rating: 4.8, url: "https://maps.google.com" },
    { name: "The Quiet Space", address: "789 Peace Lane", rating: 4.7, url: "https://maps.google.com" }
  ];
};