"use client";

import React, { useEffect } from "react";
import TerminalSandbox from "./TerminalSandbox";

interface MDContentProps {
  content: string;
}

export default function MDContent({ content }: MDContentProps) {
  useEffect(() => {
    // Trigger MathJax parsing on mount or when content updates
    if (typeof window !== "undefined" && (window as any).MathJax) {
      try {
        (window as any).MathJax.typesetPromise();
      } catch (err) {
        console.error("MathJax typeset error:", err);
      }
    }
  }, [content]);

  // Unified parser supporting both Markdown (```lang) and Rich Text Editor HTML (<pre><code>)
  const blocks: { type: "text" | "code"; content: string; language: string }[] = [];

  // Match HTML pre/code tags
  const hasHtmlPreCode = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi.test(content);

  if (hasHtmlPreCode) {
    let lastIndex = 0;
    const regex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore.trim() || textBefore.includes("\n")) {
        blocks.push({ type: "text", content: textBefore, language: "" });
      }

      // Extract raw code inside <code> and unescape HTML characters
      const rawCode = match[1]
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .trim();

      blocks.push({ type: "code", content: rawCode, language: "javascript" });
      lastIndex = regex.lastIndex;
    }

    const textRemaining = content.substring(lastIndex);
    if (textRemaining.trim() || textRemaining.includes("\n")) {
      blocks.push({ type: "text", content: textRemaining, language: "" });
    }
  } else {
    // Fallback: Split content by markdown code block delimiter (```)
    const parts = content.split("```");
    parts.forEach((part, index) => {
      if (index % 2 === 0) {
        blocks.push({ type: "text", content: part, language: "" });
      } else {
        if (!part.trim()) return;
        const firstLineBreak = part.indexOf("\n");
        let language = "javascript";
        let code = part;

        if (firstLineBreak !== -1) {
          const possibleLang = part.substring(0, firstLineBreak).trim().toLowerCase();
          if (possibleLang) {
            language = possibleLang;
            code = part.substring(firstLineBreak + 1);
          }
        }
        blocks.push({ type: "code", content: code, language });
      }
    });
  }

  return (
    <div className="md-content-wrapper">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          if (!block.content.trim() && !block.content.includes("\n")) return null;
          const html = renderMarkdownToHtmlCompact(block.content);
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              style={styles.textBlock}
            />
          );
        } else {
          const isRunnable = ["js", "javascript", "ts", "typescript"].includes(block.language);
          return (
            <TerminalSandbox
              key={index}
              initialCode={block.content}
              language={isRunnable ? block.language : `${block.language} (read-only)`}
            />
          );
        }
      })}
    </div>
  );
}

// Helper to insert unique id attributes into HTML headings for TOC anchors
function addIdsToHtmlHeadings(html: string): string {
  return html.replace(/<(h2|h3)([^>]*)>(.*?)<\/(h2|h3)>/gi, (match, tag, attrs, text) => {
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    if (attrs.includes("id=")) return match;
    return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
  });
}

// Compact markdown & HTML detection parser
function renderMarkdownToHtmlCompact(markdown: string): string {
  // Check if content already contains native HTML structures (saved from WYSIWYG editor)
  const isHtml = /<[a-z][\s\S]*>/i.test(markdown);
  if (isHtml) return addIdsToHtmlHeadings(markdown);

  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline code `code`
  html = html.replace(/`(.*?)`/g, "<code style='background:rgba(198,154,91,0.1);color:var(--color-text-dark);padding:0.15rem 0.35rem;border-radius:4px;font-family:monospace;font-size:0.9rem;'>$1</code>");

  // Links [text](url)
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener" style="color:var(--color-accent);text-decoration:underline;font-weight:600;">$1</a>'
  );

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
        result += '<div style="height:0.8rem;"></div>';
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

const styles: Record<string, React.CSSProperties> = {
  textBlock: {
    fontSize: "1.05rem",
    lineHeight: "1.8",
    color: "#2C221D",
    marginBottom: "1rem",
  }
};
