
import { GoogleGenAI } from "@google/genai";
import { ZenCenter, Language } from "../types";

/**
 * Gets a personalized mindfulness recommendation based on the user's mood.
 * Uses gemini-3-flash-preview for basic text advice.
 */
export const getPersonalizedRecommendation = async (mood: string, lang: Language = 'en') => {
  // Create a new instance right before the call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const langMap: Record<Language, string> = {
      'en': 'English',
      'zh-Hans': 'Simplified Chinese',
      'zh-Hant': 'Traditional Chinese'
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am feeling ${mood} today. Give me a 3-sentence mindfulness advice and suggest a meditation theme. Please respond in ${langMap[lang]}.`,
    });
    // Property .text is the standard way to extract output
    return response.text || "Breathe deeply and find your center today.";
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    return "Take a moment to simply observe your breath. Peace begins within.";
  }
};

/**
 * Finds nearby zen meditation centers using Google Maps grounding.
 * Maps grounding is supported in Gemini 2.5 series models.
 */
export const findNearbyZenCenters = async (lat: number, lng: number): Promise<ZenCenter[]> => {
  // Create a new instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find 3 highly rated mindfulness or zen meditation centers near this location. Tell me their names and addresses.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
        // responseMimeType and responseSchema are prohibited when using googleMaps tool
      },
    });

    const centers: ZenCenter[] = [];
    // Extract grounding chunks from the response
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks && chunks.length > 0) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          centers.push({
            name: chunk.maps.title || "Zen Sanctuary",
            address: "Nearby your location",
            rating: 4.8,
            url: chunk.maps.uri || "https://maps.google.com"
          });
        }
      });
    }

    // Fallback if no real centers found or API error
    if (centers.length === 0) {
      return [
        { name: "Zen Life Center", address: "Local Studio", rating: 4.9, url: "https://maps.google.com" },
        { name: "Mindful Breath Studio", address: "City Meditation", rating: 4.8, url: "https://maps.google.com" },
        { name: "The Quiet Space", address: "Wellness Hub", rating: 4.7, url: "https://maps.google.com" }
      ];
    }

    return centers.slice(0, 3);
  } catch (e) {
    console.error("Error finding centers:", e);
    // Return mock data for local development if API fails
    return [
      { name: "Zen Life Center", address: "Local Studio", rating: 4.9, url: "https://maps.google.com" },
      { name: "Mindful Breath Studio", address: "City Meditation", rating: 4.8, url: "https://maps.google.com" },
      { name: "The Quiet Space", address: "Wellness Hub", rating: 4.7, url: "https://maps.google.com" }
    ];
  }
};
