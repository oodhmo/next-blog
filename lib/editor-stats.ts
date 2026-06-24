export interface EditorStats {
  charCount: number;    // 공백 제외 총 글자수
  koreanChars: number;  // 한글(가-힣) 글자수
  englishChars: number; // 영문 알파벳 수
  wordCount: number;    // 한글 어절 + 영어 단어 (공백 기준 split)
  readTime: number;     // 읽기 시간(분) — Math.ceil(charCount / 500)
}

// 한글은 어절(띄어쓰기) 기준, 영어는 단어(공백) 기준으로 통합 카운트
export function computeEditorStats(text: string): EditorStats {
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) ?? []).length;
  const charCount = text.replace(/\s/g, "").length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(charCount / 500));

  return { charCount, koreanChars, englishChars, wordCount, readTime };
}
