import { describe, expect, it } from "vitest";
import { computeEditorStats } from "./editor-stats";

describe("computeEditorStats", () => {
  it("빈 문자열은 모든 값이 0이고 읽기 시간은 최소 1분이다", () => {
    const stats = computeEditorStats("");
    expect(stats.charCount).toBe(0);
    expect(stats.wordCount).toBe(0);
    expect(stats.readTime).toBe(1);
  });

  it("한글/영문 글자수를 구분해서 센다", () => {
    const stats = computeEditorStats("안녕 hello");
    expect(stats.koreanChars).toBe(2);
    expect(stats.englishChars).toBe(5);
    expect(stats.charCount).toBe(7); // 공백 제외
  });

  it("어절/단어 수는 공백 기준으로 센다", () => {
    const stats = computeEditorStats("이것은 세 어절 입니다");
    expect(stats.wordCount).toBe(4);
  });

  it("읽기 시간은 500자당 1분, 최소 1분이다", () => {
    const longText = "가".repeat(1000);
    expect(computeEditorStats(longText).readTime).toBe(2);
  });
});
