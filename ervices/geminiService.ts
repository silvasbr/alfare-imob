
import { GoogleGenAI, Type } from "@google/genai";

export async function parsePropertyInfo(input: string) {
  // Always use the API key directly from process.env.API_KEY as per the world-class guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Extraia os dados deste anúncio: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: { type: Type.STRING },
            neighborhood: { type: Type.STRING },
            city: { type: Type.STRING },
            type: { type: Type.STRING },
            negotiation: { type: Type.STRING },
            area: { type: Type.STRING },
            beds: { type: Type.STRING },
            baths: { type: Type.STRING },
            parking: { type: Type.STRING },
            amenities: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    // Extract text using the .text property (not a method).
    return JSON.parse(response.text || "{}");
  } catch (e) { return null; }
}

export async function generateCaptions(property: any) {
  // Create a new instance for each call to ensure the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Gere legendas para: ${JSON.stringify(property)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feed: { type: Type.STRING },
            reels: { type: Type.STRING }
          }
        }
      }
    });
    // Extract text using the .text property (not a method).
    return JSON.parse(response.text || "{}");
  } catch (e) { return { feed: "Oportunidade!", reels: "Veja!" }; }
}
