import sanitizeHtmlLib from "sanitize-html";

// 포스트 본문(Tiptap에서 생성된 HTML)을 렌더링 직전에 새니타이즈한다.
// 저장 경로(saveEditorPost/updateEditorPost) 인증이 뚫리는 경우에도
// dangerouslySetInnerHTML로 나가는 마지막 지점에서 스크립트/이벤트 핸들러를 걸러낸다.
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "strike",
  "code", "pre", "blockquote",
  "ul", "ol", "li",
  "a", "img", "span",
];

const ALLOWED_ATTRIBUTES: sanitizeHtmlLib.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "data-s3-key", "loading", "decoding"],
  // highlight.js가 삽입하는 hljs / language-* / hljs-* 토큰 클래스 유지
  span: ["class"],
  code: ["class"],
  pre: ["class"],
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    // http(s)/mailto 이외 스킴(javascript: 등) 차단
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      // rel="noopener noreferrer" 없이 target="_blank"만 있는 링크로부터 보호
      a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer" }, true),
      // 본문 이미지는 dangerouslySetInnerHTML로 삽입되어 next/image를 쓸 수 없다
      // (HTML 파싱 → React 엘리먼트 치환까지는 이번 범위를 벗어나는 리팩터라 보류).
      // 대신 최소한의 최적화로 lazy loading + 비동기 디코딩만 강제한다.
      img: sanitizeHtmlLib.simpleTransform("img", { loading: "lazy", decoding: "async" }, true),
    },
  });
}
