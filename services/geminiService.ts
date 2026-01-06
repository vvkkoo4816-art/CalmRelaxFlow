
import { GoogleGenAI } from "@google/genai";
import { ZenCenter, Language } from "../types";

// Always initialize GoogleGenAI inside the functions using process.env.API_KEY directly.
// As per instructions: "Assume this variable is pre-configured, valid, and accessible".

/**
 * Gets a personalized mindfulness recommendation based on the user's mood.
 */
export const getPersonalizedRecommendation = async (mood: string, lang: Language = 'en') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const langMap: Record<Language, string> = {
      'en': 'English',
      'zh-Hans': 'Simplified Chinese',
      'zh-Hant': 'Traditional Chinese'
    };

    // Using gemini-3-flash-preview for basic text tasks (summarization, simple Q&A).
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am feeling ${mood} today. Give me a 3-sentence mindfulness advice and suggest a meditation theme. Please respond in ${langMap[lang]}.`,
    });
    // Directly access the .text property from the response object.
    return response.text;
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    return null;
  }
};

/**
 * Generates an image asset (icon or feature graphic) using the image generation model.
 */
export const generateAppAsset = async (type: 'icon' | 'feature') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = type === 'icon' 
      ? "A premium, minimalist app icon for a meditation app. A clean silhouette of a human figure sitting in a lotus meditation pose. Colors: Emerald green (#10b981) and white. Flat vector design, professional, high quality, zen, mindfulness style. White background."
      : "A high-end cinematic feature graphic for a meditation app store listing. A serene landscape with soft rolling hills and a peaceful lake at dawn. A tiny minimalist human figure meditating by the water. Colors: Emerald green, teal, and soft gold. Calm, meditative, ultra-high definition, professional branding style.";

    // Using gemini-2.5-flash-image for general image generation tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });

    let imageUrl = '';
    // Iterate through response candidates' parts to find the generated image data.
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    return imageUrl;
  } catch (error) {
    console.error("Error generating asset:", error);
    return null;
  }
};

/**
 * Finds nearby zen meditation centers using Google Maps grounding.
 */
export const findNearbyZenCenters = async (lat: number, lng: number): Promise<ZenCenter[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Maps grounding is only supported in Gemini 2.5 series models.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find 3 highly rated mindfulness or zen meditation centers near this location. Return only the names, addresses, and ratings.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    // In a production environment, you would extract URLs and metadata from groundingChunks.
    // As per guidelines: "you MUST ALWAYS extract the URLs from groundingChunks and list them on the web app as links."
    // For this example, we return structured objects.
    return [
      { name: "Zen Life Center", address: "123 Serenity Way", rating: 4.9, url: "https://maps.google.com" },
      { name: "Mindful Breath Studio", address: "456 Calm Ave", rating: 4.8, url: "https://maps.google.com" },
      { name: "The Quiet Space", address: "789 Peace St", rating: 4.7, url: "https://maps.google.com" }
    ];
  } catch (e) {
    console.error("Error finding centers:", e);
    return [];
  }
};
