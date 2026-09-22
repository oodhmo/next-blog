import { describe, expect, it } from "vitest";
import {
  formatViewCount,
  estimateReadTime,
  generateSlug,
  parsePostSort,
} from "./utils";

describe("formatViewCount", () => {
  it("1000 미만은 그대로 문자열로 반환한다", () => {
    expect(formatViewCount(0)).toBe("0");
    expect(formatViewCount(999)).toBe("999");
  });

  it("1000 이상은 k 단위로 축약한다", () => {
    expect(formatViewCount(1000)).toBe("1.0k");
    expect(formatViewCount(5800)).toBe("5.8k");
    expect(formatViewCount(12345)).toBe("12.3k");
  });
});

describe("estimateReadTime", () => {
  it("HTML 태그를 제거하고 단어 수 기준으로 분을 계산한다", () => {
    const html = "<p>" + Array(200).fill("word").join(" ") + "</p>";
    expect(estimateReadTime(html)).toBe(1);
  });

  it("내용이 없으면 0분을 반환한다", () => {
    expect(estimateReadTime("")).toBe(0);
  });

  it("wordsPerMinute을 바꾸면 결과도 바뀐다", () => {
    const html = Array(100).fill("word").join(" ");
    expect(estimateReadTime(html, 100)).toBe(1);
    expect(estimateReadTime(html, 50)).toBe(2);
  });
});

describe("generateSlug", () => {
  it("영문 제목을 소문자 하이픈 슬러그로 변환한다", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("한글은 제거된다 (영소문자/숫자/하이픈만 허용)", () => {
    expect(generateSlug("안녕 Hello 세상")).toBe("hello");
  });

  it("연속 공백/하이픈을 하나로 합친다", () => {
    expect(generateSlug("a   b---c")).toBe("a-b-c");
  });
});

describe("parsePostSort", () => {
  it("유효한 값은 그대로 반환한다", () => {
    expect(parsePostSort("views")).toBe("views");
    expect(parsePostSort("oldest")).toBe("oldest");
  });

  it("잘못된 값이나 undefined는 기본값 latest로 대체한다", () => {
    expect(parsePostSort("invalid")).toBe("latest");
    expect(parsePostSort(undefined)).toBe("latest");
  });
});
