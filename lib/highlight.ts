import hljs from "highlight.js";

// DB에 저장된 HTML의 코드 블록에 syntax highlighting 토큰 span을 삽입한다.
// Tiptap getHTML()은 ProseMirror 데코레이션을 직렬화하지 않으므로
// 서버 렌더링 시점에 직접 처리해야 한다.
export function highlightCodeBlocks(html: string): string {
  return html.replace(
    /<pre[^>]*><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
    (match, attrs: string, rawCode: string) => {
      const lang = attrs.match(/language-(\w+)/)?.[1];
      const decoded = rawCode
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      try {
        const result =
          lang && hljs.getLanguage(lang)
            ? hljs.highlight(decoded, { language: lang })
            : hljs.highlightAuto(decoded);
        const cls = `hljs${lang ? ` language-${lang}` : ""}`;
        return `<pre><code class="${cls}">${result.value}</code></pre>`;
      } catch {
        return match;
      }
    }
  );
}
