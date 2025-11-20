import { GoogleGenAI } from "@google/genai";
import { AIActionType, PromptsConfig } from '../types';
import { getPromptForAction } from '../prompts';

export const processTextWithAI = async (
  text: string,
  action: AIActionType,
  apiKey: string,
  promptsConfig?: PromptsConfig,
  extraContext?: string
): Promise<string> => {
  try {
    if (!apiKey) {
      throw new Error("未配置 API Key。请在设置中添加您的 Google Gemini API Key。");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = getPromptForAction(action, text, promptsConfig, extraContext);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || text; // Fallback to original if empty
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};