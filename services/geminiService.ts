
import { GoogleGenAI, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { FileItem, ChatMessage } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export async function* askGeminiStream(
  prompt: string,
  files: FileItem[],
  history: ChatMessage[]
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

  // Prepare file parts for Gemini
  const fileParts = files.map(file => ({
    inlineData: {
      data: file.data.split(',')[1],
      mimeType: file.type
    }
  }));

  // Structure system instruction for maximum accuracy
  const systemInstruction = `
    あなたは「AIアシスタント」として、高度な専門知識を持つアシスタントの役割を担います。
    特に、土木建築技術に対して深い造詣をもち、専門的な視点からアドバイスや解説を行うことができます。
    
    以下のガイドラインを厳守して回答の精度を高めてください：
    
    1. 根拠の明示: 提供された資料の内容に基づき、可能な限り「どの資料のどの部分」を参照したか明記してください。
    2. 専門性: 土木建築、コード生成、資料要約など、各分野において正確かつ高度な情報を提供してください。
    3. 思考プロセス: 回答の前に内部で論理的なステップを組み立て、正確性を期してください。
    4. 情報の境界: 資料に記載がない場合は、自身の知識を使用しつつ「資料外の情報であること」を明記してください。
    5. 構成: 専門用語は分かりやすく解説し、構造的な箇条書きなどを活用して読みやすくしてください。
    6. 言語: 常に丁寧な日本語で回答してください。
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
        temperature: 1, // 思考モデルの場合は1を推奨
        topP: 0.95,
        // 思考レベルをHIGHに設定して精度を向上
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
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
