// Web Speech API (SpeechSynthesis) ラッパーサービス

export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentId: string | null;
  currentTitle: string | null;
  rate: number;
  pitch: number;
  voice: SpeechSynthesisVoice | null;
}

type SpeechStateListener = (state: SpeechState) => void;

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<SpeechStateListener> = new Set();
  private selectedVoice: SpeechSynthesisVoice | null = null;

  private state: SpeechState = {
    isPlaying: false,
    isPaused: false,
    currentId: null,
    currentTitle: null,
    rate: 1.0,
    pitch: 1.0,
    voice: null,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      // voiceschanged イベントが発生してから音声リストを取得する
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
      // 既に読み込み済みの場合に備えて即時も試みる
      this.initVoices();
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const allVoices = this.synth.getVoices();
    const jaVoices = allVoices.filter(v => v.lang.startsWith('ja'));

    // Natural / Neural / Google / Online 系を優先選択
    const preferredVoice =
      jaVoices.find(v =>
        v.name.includes('Natural') ||
        v.name.includes('Online') ||
        v.name.includes('Google') ||
        v.name.includes('Nanami') ||
        v.name.includes('Kyoko')
      ) || jaVoices[0] || null;

    if (!this.state.voice && preferredVoice) {
      this.state.voice = preferredVoice;
      this.selectedVoice = preferredVoice;
      this.notifyListeners();
    }
  }

  public getAvailableJapaneseVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const allVoices = this.synth.getVoices();
    const jaVoices = allVoices.filter(v => v.lang.startsWith('ja'));
    return jaVoices.length > 0 ? jaVoices : allVoices;
  }

  public setVoice(voiceName: string) {
    const voices = this.getAvailableJapaneseVoices();
    const target = voices.find(v => v.name === voiceName);
    if (target) {
      this.selectedVoice = target;
      this.state.voice = target;
      this.notifyListeners();
    }
  }

  public setRate(rate: number) {
    this.state.rate = rate;
    this.notifyListeners();
  }

  public subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  /**
   * Markdown 記号などを除去して自然な読み上げテキストを生成する
   */
  public prepareTextForSpeech(text: string): string {
    if (!text) return '';
    let t = text;
    // コードブロック除去
    t = t.replace(/```[\s\S]*?```/g, '。コードブロック省略。');
    // インラインコード
    t = t.replace(/`([^`]+)`/g, '$1');
    // 見出し
    t = t.replace(/^#{1,6}\s+/gm, '');
    // 太字・斜体
    t = t.replace(/(\*\*|__)(.*?)\1/g, '$2');
    t = t.replace(/(\*|_)(.*?)\1/g, '$2');
    // リンク
    t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // 画像
    t = t.replace(/!\[([^\]]*)\]\([^)]+\)/g, '画像');
    // 箇条書き
    t = t.replace(/^\s*[-*+]\s+/gm, '。');
    t = t.replace(/^\s*\d+\.\s+/gm, '。');
    // 引用
    t = t.replace(/^\s*>\s+/gm, '');
    // 改行→読点
    t = t.replace(/\n{2,}/g, '。');
    t = t.replace(/\n/g, '、');
    // 連続句読点を整理
    t = t.replace(/[。、]{2,}/g, '。');
    return t.trim();
  }

  public speak(id: string, title: string, textContent: string) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }

    // 同一IDが再生中なら一時停止/再開を切り替え
    if (this.state.currentId === id) {
      if (this.state.isPlaying) {
        this.pause();
        return;
      } else if (this.state.isPaused) {
        this.resume();
        return;
      }
    }

    this.stop();

    const cleanText = this.prepareTextForSpeech(textContent);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // ボイス設定
    const voice = this.selectedVoice || this.getAvailableJapaneseVoices()[0] || null;
    if (voice) utterance.voice = voice;
    utterance.lang = 'ja-JP';
    utterance.rate = this.state.rate;
    utterance.pitch = this.state.pitch;

    utterance.onstart = () => {
      this.state = { ...this.state, isPlaying: true, isPaused: false, currentId: id, currentTitle: title };
      this.notifyListeners();
    };
    utterance.onend = () => {
      this.state = { ...this.state, isPlaying: false, isPaused: false, currentId: null, currentTitle: null };
      this.notifyListeners();
    };
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      this.state = { ...this.state, isPlaying: false, isPaused: false, currentId: null, currentTitle: null };
      this.notifyListeners();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.state.isPlaying) {
      this.synth.pause();
      this.state = { ...this.state, isPlaying: false, isPaused: true };
      this.notifyListeners();
    }
  }

  public resume() {
    if (this.synth && this.state.isPaused) {
      this.synth.resume();
      this.state = { ...this.state, isPlaying: true, isPaused: false };
      this.notifyListeners();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.state = { ...this.state, isPlaying: false, isPaused: false, currentId: null, currentTitle: null };
      this.notifyListeners();
    }
  }
}

// シングルトンとしてエクスポート
export const speechService = new SpeechService();
