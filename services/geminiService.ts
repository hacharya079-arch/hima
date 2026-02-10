
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeStreamContext = async (title: string, broadcaster: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on a live stream titled "${title}" by ${broadcaster}, generate 3 engaging tags and a short catchy description for a viewer dashboard. Output as JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const getAiModeratorResponse = async (chatHistory: string, lastMessage: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI moderator for a professional RTMP stream. 
      Context: ${chatHistory}
      New message: ${lastMessage}
      If the message is problematic, warn the user. If it's a question, answer it concisely. If it's a greeting, respond warmly.
      Keep response under 50 words.`,
    });
    return response.text;
  } catch (error) {
    return "I'm monitoring the chat and ensuring a positive environment!";
  }
};
