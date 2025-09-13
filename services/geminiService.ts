
import { GoogleGenAI, Modality, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function editImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw error;
  }
}

export function startChat(): Chat {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'أنت مساعد ذكي ومفيد. تحدث باللغة العربية.',
    },
  });
}

export async function* sendMessageStream(
  chat: Chat,
  message: string
): AsyncGenerator<string, void, unknown> {
  try {
    const responseStream = await chat.sendMessageStream({ message });
    for await (const chunk of responseStream) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error in sendMessageStream:", error);
    throw error;
  }
}
