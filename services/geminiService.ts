
import { FileItem, ChatMessage } from "../types";

export async function* askGeminiStream(
  prompt: string,
  files: FileItem[],
  history: ChatMessage[]
) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        files,
        history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "サーバーとの通信中にエラーが発生しました。");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("ストリームの読み込みに失敗しました。");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  } catch (error: any) {
    console.error("Chat Error:", error);
    
    let errorMessage = "AIとの通信中にエラーが発生しました。";
    if (error.message && error.message.includes("exceeds the supported page limit of 1000")) {
      errorMessage = "資料のページ数が上限（1000ページ）を超えています。資料を分割してアップロードするか、重要な箇所のみを抽出したファイルを使用してください。";
    } else if (error.message && error.message.includes("429")) {
      errorMessage = "リクエストが多すぎます。少し時間を置いてから再度お試しください。";
    }
    
    throw new Error(errorMessage);
  }
}
