"use client";

import React, { useState, useEffect } from "react";
import TerminalSandbox from "./TerminalSandbox";
import katex from "katex";

interface MDContentProps {
  content: string;
}

interface ContentBlock {
  type: "text" | "code";
  content: string;
  language: string;
}

// Decodes HTML entities back to raw characters
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Renders mathematical equations using KaTeX
function renderMathInText(rawText: string): string {
  if (!rawText) return "";

  let text = rawText;

  // 1. Clean up and render multi-line bracket equations (including equations with === or --- underlines)
  text = text.replace(/\[\s*([\s\S]*?)\s*\]/g, (_match, inner) => {
    const clean = inner
      .replace(/\r/g, "")
      .replace(/\n\s*={3,}\s*\n/g, " = ")
      .replace(/\n\s*-{3,}\s*\n/g, " = ")
      .replace(/\n+/g, " ")
      .replace(/;m\/s/g, " \\text{ m/s}")
      .trim();

    // Check if inner content is mathematical
    const isMath = /[=\\^_{}]|\b(?:c|v|E|m|p|G|L|r|dt|dx|dy|dz|ds|rs|d\tau)\b|\\[a-zA-Z]+/.test(clean);
    if (isMath) {
      try {
        const rendered = katex.renderToString(clean, {
          displayMode: true,
          throwOnError: false,
        });
        return `<div class="katex-display-wrapper" style="margin: 1.6rem 0; overflow-x: auto; text-align: center;">${rendered}</div>`;
      } catch {
        return `$$ ${clean} $$`;
      }
    }
    return `[${inner}]`;
  });

  // 2. Render standard display math $$ ... $$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    try {
      const clean = inner.trim();
      const rendered = katex.renderToString(clean, {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-display-wrapper" style="margin: 1.6rem 0; overflow-x: auto; text-align: center;">${rendered}</div>`;
    } catch {
      return `$$ ${inner} $$`;
    }
  });

  // 3. Render inline math \( ... \) or $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => {
    try {
      return katex.renderToString(inner.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return inner;
    }
  });

  // 4. Convert inline Greek & LaTeX variables in parentheses:
  // e.g. (\Delta\tau), (G_{\mu\nu}), (\Lambda), (\gamma), (\Delta t)
  text = text.replace(/\((\\[a-zA-Z]+(?:_[0-9a-zA-Z{}]+)?)\)/g, (_match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `(${math})`;
    }
  });

  // 5. Convert single/double letter math variables in parentheses:
  // e.g. (v), (c), (L_0), (p=0), (c^2), (E_0), (r_s), (r)
  text = text.replace(/(^|\s)\(([a-zA-Z](?:_[0-9a-zA-Z{}]+|\^[0-9a-zA-Z{}]+)?(?:=[0-9a-zA-Z]+)?)\)(\s|[.,;:?!]|$)/g, (_match, prefix, variable, suffix) => {
    try {
      const rendered = katex.renderToString(variable.trim(), { displayMode: false, throwOnError: false });
      return `${prefix}${rendered}${suffix}`;
    } catch {
      return `${prefix}(${variable})${suffix}`;
    }
  });

  return text;
}

// Injects id attributes to headings for TOC scroll anchors
function addIdsToHtmlHeadings(html: string): string {
  return html.replace(/<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, text) => {
    if (attrs.includes("id=")) return match;
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
  });
}

// Converts Markdown formatting to semantic HTML
function renderMarkdownToHtmlCompact(markdown: string): string {
  // First render all KaTeX math formulas in the text
  const mathRendered = renderMathInText(markdown);

  let html = mathRendered
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline code `code`
  html = html.replace(/`(.*?)`/g, "<code style='background:rgba(198,154,91,0.12);color:var(--color-text-dark);padding:0.15rem 0.4rem;border-radius:4px;font-family:monospace;font-size:0.9rem;'>$1</code>");

  // Blockquotes > quote
  html = html.replace(/^>\s*(.*?)$/gm, '<blockquote style="border-left:3px solid var(--color-accent);padding:0.6rem 1.2rem;margin:1.5rem 0;font-style:italic;color:#5A4D45;background:rgba(198,154,91,0.05);border-radius:0 6px 6px 0;">$1</blockquote>');

  // Horizontal Rules ---
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid var(--color-border);margin:2rem 0;" />');

  // Links [text](url)
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--color-accent);text-decoration:underline;font-weight:600;">$1</a>'
  );

  // Restore KaTeX HTML tags that were escaped by &lt; / &gt;
  html = html
    .replace(/&lt;(span|div|math|semantics|mrow|mi|mo|mn|annotation|svg|path|line|text)([^&]*)&gt;/gi, '<$1$2>')
    .replace(/&lt;\/(span|div|math|semantics|mrow|mi|mo|mn|annotation|svg|path|line|text)&gt;/gi, '</$1>');

  const lines = html.split("\n");
  let inList = false;
  let result = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        result += '<ul style="margin-left:1.5rem;margin-bottom:1.2rem;display:flex;flex-direction:column;gap:0.4rem;list-style-type:disc;">';
        inList = true;
      }
      result += `<li style="font-size:1.05rem;line-height:1.75;color:#2C221D;">${trimmed.slice(2)}</li>`;
    } else {
      if (inList) {
        result += "</ul>";
        inList = false;
      }

      if (trimmed.startsWith("### ")) {
        const text = trimmed.slice(4);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        result += `<h3 id="${id}" style="font-size:1.25rem;margin-top:1.8rem;margin-bottom:0.8rem;font-family:var(--font-sans);font-weight:700;color:var(--color-text-dark);line-height:1.3;">${text}</h3>`;
      } else if (trimmed.startsWith("## ")) {
        const text = trimmed.slice(3);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        result += `<h2 id="${id}" style="font-size:1.6rem;margin-top:2.2rem;margin-bottom:1rem;font-family:var(--font-serif);color:var(--color-text-dark);line-height:1.2;">${text}</h2>`;
      } else if (trimmed.startsWith("# ")) {
        const text = trimmed.slice(2);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        result += `<h1 id="${id}" style="font-size:2rem;margin-top:2.5rem;margin-bottom:1.2rem;font-family:var(--font-serif);color:var(--color-text-dark);border-bottom:1px solid var(--color-border);padding-bottom:0.5rem;line-height:1.15;">${text}</h1>`;
      } else if (trimmed === "") {
        result += '<div style="height:0.6rem;"></div>';
      } else if (trimmed.startsWith('<div class="katex-display-wrapper"') || trimmed.startsWith("<hr")) {
        result += trimmed;
      } else {
        result += `<p style="font-size:1.05rem;line-height:1.8;margin-bottom:1.2rem;color:#2C221D;font-weight:300;">${trimmed}</p>`;
      }
    }
  }

  if (inList) {
    result += "</ul>";
  }

  return result;
}

// Formats non-code text parts whether they contain HTML or Markdown
function renderFormattedText(content: string): string {
  const isHtml = /<(?:p|div|h[1-6]|ul|ol|li|table|img|blockquote|hr|a|span|b|i|strong|em|br)[^>]*>/i.test(content);
  if (isHtml) {
    const mathInHtml = renderMathInText(content);
    return addIdsToHtmlHeadings(mathInHtml);
  }
  return renderMarkdownToHtmlCompact(content);
}

// Master Article Parser: splits pure code sandboxes from normal reading content
export function parseArticleContent(rawContent: string): ContentBlock[] {
  if (!rawContent || !rawContent.trim()) return [];

  const raw = rawContent.replace(/\r\n/g, "\n");
  const codeItems: { code: string; language: string }[] = [];

  // Pattern 1: HTML <pre><code>...</code></pre> blocks
  let text = raw.replace(/<pre[^>]*>[\s\S]*?<code(?: class="(?:language-)?([\w-]+)")?[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, (_match, lang, codeHtml) => {
    const cleanCode = decodeHtmlEntities(codeHtml.replace(/<[^>]*>/g, ""));
    const placeholder = `\n__CODE_BLOCK_SLOT_${codeItems.length}__\n`;
    codeItems.push({ code: cleanCode.trim(), language: lang || "javascript" });
    return placeholder;
  });

  // Pattern 2: Markdown triple backtick code fences: ```lang\ncode\n```
  text = text.replace(/(?:^|\n)```([\w-]*)\n([\s\S]*?)\n```(?:\n|$)/g, (_match, lang, codeText) => {
    const placeholder = `\n__CODE_BLOCK_SLOT_${codeItems.length}__\n`;
    codeItems.push({ code: codeText.trim(), language: lang || "javascript" });
    return placeholder;
  });

  // Pattern 3: Inline/loosely formatted backticks
  text = text.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_match, lang, codeText) => {
    const placeholder = `\n__CODE_BLOCK_SLOT_${codeItems.length}__\n`;
    codeItems.push({ code: codeText.trim(), language: lang || "javascript" });
    return placeholder;
  });

  // Split text by the unique slot tokens
  const parts = text.split(/__CODE_BLOCK_SLOT_(\d+)__/);
  const blocks: ContentBlock[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // Slot index for code item
      const slotIndex = parseInt(parts[i], 10);
      if (codeItems[slotIndex]) {
        blocks.push({
          type: "code",
          content: codeItems[slotIndex].code,
          language: codeItems[slotIndex].language,
        });
      }
    } else {
      // Text content part
      const partContent = parts[i];
      if (partContent && (partContent.trim() || partContent.includes("<img") || partContent.includes("<table"))) {
        const htmlPart = renderFormattedText(partContent);
        if (htmlPart.trim()) {
          blocks.push({
            type: "text",
            content: htmlPart,
            language: "",
          });
        }
      }
    }
  }

  return blocks;
}

export default function MDContent({ content }: MDContentProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => parseArticleContent(content));

  useEffect(() => {
    setBlocks(parseArticleContent(content));
  }, [content]);

  return (
    <div className="md-content-wrapper">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: block.content }}
              style={styles.textBlock}
            />
          );
        } else {
          return (
            <TerminalSandbox
              key={index}
              initialCode={block.content}
              language={block.language}
            />
          );
        }
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  textBlock: {
    fontSize: "1.05rem",
    lineHeight: "1.8",
    color: "#2C221D",
    marginBottom: "1rem",
  }
};
