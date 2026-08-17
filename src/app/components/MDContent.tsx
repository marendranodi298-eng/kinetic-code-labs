"use client";

import React, { useEffect, useState } from "react";
import TerminalSandbox from "./TerminalSandbox";

interface MDContentProps {
  content: string;
}

export default function MDContent({ content }: MDContentProps) {
  const [blocks, setBlocks] = useState<{ type: "text" | "code"; content: string; language: string }[]>([]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Convert markdown to HTML first if it is pure markdown
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    let htmlContent = content;

    if (!isHtml) {
      htmlContent = renderMarkdownToHtmlCompact(content);
    }

    // Use DOMParser to safely parse HTML and extract elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Extract only pre elements that contain a code tag (real sandbox/code blocks)
    const preElements = Array.from(doc.querySelectorAll("pre")).filter(pre => pre.querySelector("code") !== null);
    const parsedBlocks: { type: "text" | "code"; content: string; language: string }[] = [];

    if (preElements.length === 0) {
      // No code blocks, render full HTML directly
      setBlocks([{ type: "text", content: doc.body.innerHTML, language: "" }]);
    } else {
      let currentHtml = doc.body.innerHTML;
      
      // Replace each pre tag with a unique split delimiter
      preElements.forEach((pre, index) => {
        const delimiter = `__CODE_BLOCK_DELIMITER_${index}__`;
        
        // Extract raw code text (automatically decoding HTML entities and stripping nested styling tags)
        const rawCode = pre.textContent || pre.innerText || "";
        
        // Detect language if present in class list
        let language = "javascript";
        const codeElement = pre.querySelector("code");
        if (codeElement) {
          const className = codeElement.className || "";
          const match = className.match(/language-(\w+)/);
          if (match) {
            language = match[1];
          }
        }

        // Replace outer HTML with split delimiter safely
        currentHtml = currentHtml.replace(pre.outerHTML, delimiter);
        parsedBlocks.push({ type: "code", content: rawCode.trim(), language });
      });

      // Split the HTML by delimiters
      const textParts = currentHtml.split(/__CODE_BLOCK_DELIMITER_\d+__/);
      const finalBlocks: { type: "text" | "code"; content: string; language: string }[] = [];

      textParts.forEach((part, index) => {
        if (part.trim() || part.includes("\n")) {
          finalBlocks.push({ type: "text", content: part, language: "" });
        }
        if (index < parsedBlocks.length) {
          finalBlocks.push(parsedBlocks[index]);
        }
      });

      setBlocks(finalBlocks);
    }
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

// Helper to strip copy-pasted rich formatting HTML tags from terminal code
function stripHtml(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n");
  // Strip all other HTML tags (like spans, styles, colors)
  text = text.replace(/<[^>]*>/g, "");
  // Unescape standard HTML entities
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
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
