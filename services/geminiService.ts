
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FileItem, ChatMessage } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export async function* askGeminiStream(
  prompt: string,
  files: FileItem[],
  history: ChatMessage[]
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  // Prepare file parts for Gemini
  const fileParts = files.map(file => ({
    inlineData: {
      data: file.data.split(',')[1],
      mimeType: file.type
    }
  }));

  // Structure system instruction for maximum accuracy
  const systemInstruction = `
    あなたは「実践へのBridge講座」の高度な専門アシスタントです。
    以下のガイドラインを厳守して回答の精度を高めてください：
    
    1. 根拠の明示: 提供された資料の内容に基づき、可能な限り「どの資料のどの部分」を参照したか明記してください。
    2. 思考プロセス: 回答の前に内部で論理的なステップを組み立て、正確性を期してください。
    3. 情報の境界: 資料に記載がない場合は、自身の知識を使用しつつ「資料外の情報であること」を明記してください。
    4. 構成: 専門用語は分かりやすく解説し、構造的な箇条書きなどを活用して読みやすくしてください。
    5. 言語: 常に丁寧な日本語で回答してください。
  `;

  const relevantHistory = history.slice(-6).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: [
        ...relevantHistory,
        {
          role: 'user',
          parts: [
            ...fileParts,
            { text: prompt }
          ]
        }
      ],
      config: {
        systemInstruction,
        temperature: 0.4, // 低めの温度設定で正確性を優先
        topP: 0.95,
        // 思考プロセスを有効化して精度を向上
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AIとの通信中にエラーが発生しました。");
  }
}
