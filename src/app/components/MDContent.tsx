"use client";

import React, { useState, useEffect } from "react";
import TerminalSandbox from "./TerminalSandbox";
import ScienceSimEngine, { SimCategory } from "./ScienceSimEngine";
import katex from "katex";

interface MDContentProps {
  content: string;
}

interface ContentBlock {
  type: "text" | "code" | "sim";
  content: string;
  language: string;
  simCategory?: SimCategory;
  simPreset?: string;
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

// Auto-repairs mangled formulas that were copy-pasted from browser rendered KaTeX/ChatGPT selections
function repairMangledMathFormulas(raw: string): string {
  if (!raw) return "";
  let text = raw;

  // Clean up broken vertical character artifacts and rogue HTML tags in formulas
  text = text.replace(/<\s*b\s*r\s*>/gi, "");
  text = text.replace(/<\s*\/\s*h1\s*>\s*<\s*p\s*>/gi, " = ");

  // 1. Speed of light formula: c = 299,792,458 m/s
  text = text.replace(/(?:<br>)?\s*c\s*=\s*299\s*,\s*792\s*,\s*458\s*m\/s\s*(?:<br>)?/gi, "\n\n$$ c = 299,792,458\\text{ m/s} $$\n\n");

  // 2. Time Dilation: Δt = γ Δτ
  text = text.replace(/(?:<br>)?\s*[Δ\\]?t\s*=\s*[γ\\]?\s*[Δ\\]?τ\s*(?:<br>)?/gi, "\n\n$$ \\Delta t = \\gamma \\Delta \\tau $$\n\n");

  // 3. Lorentz Factor: γ = 1 / sqrt(1 - v^2/c^2)
  text = text.replace(/(?:<br>)?\s*γ\s*=\s*[\s\S]*?1−[\s\S]*?c[\s\S]*?2[\s\S]*?v[\s\S]*?2[\s\S]*?1\s*(?:<br>)?/gi, "\n\n$$ \\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}} $$\n\n");
  text = text.replace(/\[\s*\\?gamma\s*=\s*\\?frac\{1\}\{\\?sqrt\{1-\\?frac\{v\^2\}\{c\^2\}\}\}\s*\]/gi, "\n\n$$ \\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}} $$\n\n");

  // 4. Lorentz limit: γ → ∞
  text = text.replace(/(?:<br>)?\s*[γ\\]?\s*→\s*∞\s*(?:<br>)?/gi, "\n\n$$ \\gamma \\rightarrow \\infty $$\n\n");
  text = text.replace(/\[\s*\\?gamma\s*\\?rightarrow\s*\\?infty\s*\]/gi, "\n\n$$ \\gamma \\rightarrow \\infty $$\n\n");

  // 5. Length Contraction: L = L_0 / γ
  text = text.replace(/(?:<br>)?\s*L\s*=\s*[\s\S]*?L\s*0[\s\S]*?γ\s*(?:<br>)?/gi, "\n\n$$ L = \\frac{L_0}{\\gamma} $$\n\n");
  text = text.replace(/\[\s*L\s*=\s*\\?frac\{L_0\}\{\\?gamma\}\s*\]/gi, "\n\n$$ L = \\frac{L_0}{\\gamma} $$\n\n");

  // 6. Mass-Energy Equivalence: E = mc^2 and E_0 = mc^2
  text = text.replace(/(?:<br>)?\s*E\s*0\s*=\s*mc\s*2\s*(?:<br>)?/gi, "\n\n$$ E_0 = mc^2 $$\n\n");
  text = text.replace(/(?:<br>)?\s*E\s*=\s*mc\s*2\s*(?:<br>)?/gi, "\n\n$$ E = mc^2 $$\n\n");
  text = text.replace(/\[\s*E_0\s*=\s*mc\^2\s*\]/gi, "\n\n$$ E_0 = mc^2 $$\n\n");
  text = text.replace(/\[\s*E\s*=\s*mc\^2\s*\]/gi, "\n\n$$ E = mc^2 $$\n\n");

  // 7. Relativistic Energy-Momentum: E^2 = p^2c^2 + m^2c^4
  text = text.replace(/(?:<br>)?\s*E\s*2\s*=\s*p\s*2\s*c\s*2\s*\+\s*m\s*2\s*c\s*4\s*(?:<br>)?/gi, "\n\n$$ E^2 = p^2c^2 + m^2c^4 $$\n\n");
  text = text.replace(/\[\s*E\^2\s*=\s*p\^2c\^2\s*\+\s*m\^2c\^4\s*\]/gi, "\n\n$$ E^2 = p^2c^2 + m^2c^4 $$\n\n");

  // 8. Flat Spacetime Interval: ds^2 = -c^2dt^2 + dx^2 + dy^2 + dz^2
  text = text.replace(/(?:<br>)?\s*ds\s*2\s*=\s*−?c\s*2\s*dt\s*2\s*\+\s*dx\s*2\s*\+\s*dy\s*2\s*\+\s*dz\s*2\s*(?:<br>)?/gi, "\n\n$$ ds^2 = -c^2dt^2 + dx^2 + dy^2 + dz^2 $$\n\n");
  text = text.replace(/\[\s*ds\^2\s*=\s*-c\^2dt\^2\s*\+\s*dx\^2\s*\+\s*dy\^2\s*\+\s*dz\^2\s*\]/gi, "\n\n$$ ds^2 = -c^2dt^2 + dx^2 + dy^2 + dz^2 $$\n\n");

  // 9. Einstein Field Equation: G_μν + Λ g_μν = (8πG / c^4) T_μν
  text = text.replace(/(?:<br>)?\s*G\s*μν\s*\+\s*Λ\s*g\s*μν[\s\S]*?8πG[\s\S]*?c\s*4[\s\S]*?T\s*μν\s*(?:<br>)?/gi, "\n\n$$ G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu} $$\n\n");
  text = text.replace(/\[\s*G_\{?\\?mu\\?nu\}?\s*\+\s*\\?Lambda\s*g_\{?\\?mu\\?nu\}?[\s\S]*?\\?frac\{8\\?pi\s*G\}\{c\^4\}\s*T_\{?\\?mu\\?nu\}?\s*\]/gi, "\n\n$$ G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu} $$\n\n");

  // 10. General Metric: ds^2 = g_μν dx^μ dx^ν
  text = text.replace(/(?:<br>)?\s*ds\s*2\s*=\s*g\s*μν\s*dx\s*μ\s*dx\s*ν\s*(?:<br>)?/gi, "\n\n$$ ds^2 = g_{\\mu\\nu} dx^\\mu dx^\\nu $$\n\n");
  text = text.replace(/\[\s*ds\^2\s*=\s*g_\{?\\?mu\\?nu\}?\s*dx\^\\?mu\s*dx\^\\?nu\s*\]/gi, "\n\n$$ ds^2 = g_{\\mu\\nu} dx^\\mu dx^\\nu $$\n\n");

  // 11. Schwarzschild Radius: r_s = 2GM / c^2
  text = text.replace(/(?:<br>)?\s*r\s*s\s*=\s*[\s\S]*?2GM[\s\S]*?c\s*2\s*(?:<br>)?/gi, "\n\n$$ r_s = \\frac{2GM}{c^2} $$\n\n");
  text = text.replace(/\[\s*r_s\s*=\s*\\?frac\{2GM\}\{c\^2\}\s*\]/gi, "\n\n$$ r_s = \\frac{2GM}{c^2} $$\n\n");

  // 12. Gravitational Time Dilation: dτ = dt sqrt(1 - 2GM/rc^2)
  text = text.replace(/(?:<br>)?\s*dτ[\s\S]*?dt[\s\S]*?1−[\s\S]*?2GM[\s\S]*?rc\s*2\s*(?:<br>)?/gi, "\n\n$$ d\\tau = dt \\sqrt{1 - \\frac{2GM}{rc^2}} $$\n\n");
  text = text.replace(/\[\s*d\\?tau\s*=[\s\S]*?dt\s*\\?sqrt\{1\s*-\s*\\?frac\{2GM\}\{rc\^2\}\}\s*\]/gi, "\n\n$$ d\\tau = dt \\sqrt{1 - \\frac{2GM}{rc^2}} $$\n\n");

  // 13. dτ → 0
  text = text.replace(/(?:<br>)?\s*d[τ\\]\s*→\s*0\s*(?:<br>)?/gi, "\n\n$$ d\\tau \\rightarrow 0 $$\n\n");

  // 14. Fix duplicated variables from browser screen reader selections
  text = text.replace(/\bvelocity\s+v\s*\n*\s*v\b/gi, "velocity $v$");
  text = text.replace(/\bapproaches\s+c\s*\n*\s*c\b/gi, "approaches $c$");
  text = text.replace(/\bapproaches\s+r\s*\n*\s*r\b/gi, "approaches $r$");
  text = text.replace(/\bhowever,\s*γ\s*\n*\s*γ\b/gi, "however, $\\gamma$");
  text = text.replace(/\bwhere\s+L\s*0\s*\n*\s*L\s*0\b/gi, "where $L_0$");
  text = text.replace(/\bparticle at rest,\s*p\s*\n*\s*=\s*\n*\s*0\s*\n*\s*p=0\b/gi, "particle at rest, $p = 0$");
  text = text.replace(/\bΛ\s*\n*\s*Λ\s*is\b/gi, "$\\Lambda$ is");

  return text;
}

// Renders mathematical equations using KaTeX
function renderMathInText(rawText: string): string {
  if (!rawText) return "";

  // Run the formula repair cleaner first
  let text = repairMangledMathFormulas(rawText);

  // 1. Clean up and render multi-line bracket equations
  text = text.replace(/\[\s*([\s\S]*?)\s*\]/g, (_match, inner) => {
    const clean = inner
      .replace(/\r/g, "")
      .replace(/\n\s*={3,}\s*\n/g, " = ")
      .replace(/\n\s*-{3,}\s*\n/g, " = ")
      .replace(/\n+/g, " ")
      .replace(/;m\/s/g, " \\text{ m/s}")
      .trim();

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

  text = text.replace(/\$([^$\n]+)\$/g, (_match, inner) => {
    try {
      return katex.renderToString(inner.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `$${inner}$`;
    }
  });

  // 4. Convert inline Greek & LaTeX variables in parentheses: (\Delta\tau), (G_{\mu\nu}), (\Lambda), (\gamma)
  text = text.replace(/\((\\[a-zA-Z]+(?:_[0-9a-zA-Z{}]+)?)\)/g, (_match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `(${math})`;
    }
  });

  // 5. Convert single/double letter math variables in parentheses: (v), (c), (L_0), (p=0), (c^2), (E_0), (r_s), (r)
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

// Master Article Parser: splits pure code sandboxes and 3D simulations from normal reading content
export function parseArticleContent(rawContent: string): ContentBlock[] {
  if (!rawContent || !rawContent.trim()) return [];

  let raw = rawContent.replace(/\r\n/g, "\n");

  // Helper to extract sim tag types
  const codeItems: { code: string; language: string; isSim?: boolean; simCategory?: SimCategory; simPreset?: string }[] = [];

  // Pattern 0: Direct [sim:category:preset] or [simulation:category] shortcodes
  raw = raw.replace(/\[\s*(?:simulation|sim):([a-zA-Z0-9_-]+)(?::([a-zA-Z0-9_-]+))?\s*\]/gi, (_match, cat, pre) => {
    const placeholder = `\n__CODE_BLOCK_SLOT_${codeItems.length}__\n`;
    const simCat = (cat.toLowerCase() as SimCategory) || "physics";
    codeItems.push({
      code: "",
      language: "sim",
      isSim: true,
      simCategory: simCat,
      simPreset: pre || (simCat === "physics" ? "spacetime" : simCat === "chemistry" ? "water" : simCat === "biotech" ? "dna" : "surface"),
    });
    return placeholder;
  });

  // Pattern 1: HTML <pre><code>...</code></pre> blocks
  let text = raw.replace(/<pre[^>]*>[\s\S]*?<code(?: class="(?:language-)?([\w:-]+)")?[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, (_match, lang, codeHtml) => {
    const cleanCode = decodeHtmlEntities(codeHtml.replace(/<[^>]*>/g, ""));
    const placeholder = `\n__CODE_BLOCK_SLOT_${codeItems.length}__\n`;
    const isSim = (lang || "").startsWith("sim");
    let simCategory: SimCategory = "physics";
    let simPreset: string = "spacetime";

    if (isSim) {
      const parts = (lang || "").split(":");
      if (parts[1]) simCategory = parts[1] as SimCategory;
      if (parts[2]) simPreset = parts[2];
    }

    codeItems.push({ code: cleanCode.trim(), language: lang || "javascript", isSim, simCategory, simPreset });
    return placeholder;
  });

  // Pattern 2: Markdown triple backtick code fences: ```lang\ncode\n```
  text = text.replace(/(?:^|\n)```([\w:-]*)\n([\s\S]*?)\n```(?:\n|$)/g, (_match, lang, codeText) => {
    const placeholder = `\n__CODE_BLOCK_SLOT_${codeItems.length}__\n`;
    const isSim = (lang || "").startsWith("sim");
    let simCategory: SimCategory = "physics";
    let simPreset: string = "spacetime";

    if (isSim) {
      const parts = (lang || "").split(":");
      if (parts[1]) simCategory = parts[1] as SimCategory;
      if (parts[2]) simPreset = parts[2];
    }

    codeItems.push({ code: codeText.trim(), language: lang || "javascript", isSim, simCategory, simPreset });
    return placeholder;
  });

  // Split text by the unique slot tokens
  const parts = text.split(/__CODE_BLOCK_SLOT_(\d+)__/);
  const blocks: ContentBlock[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // Slot index for code item
      const slotIndex = parseInt(parts[i], 10);
      const item = codeItems[slotIndex];
      if (item) {
        if (item.isSim) {
          blocks.push({
            type: "sim",
            content: item.code,
            language: item.language,
            simCategory: item.simCategory,
            simPreset: item.simPreset,
          });
        } else {
          blocks.push({
            type: "code",
            content: item.code,
            language: item.language,
          });
        }
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
        } else if (block.type === "sim") {
          return (
            <ScienceSimEngine
              key={index}
              initialCategory={block.simCategory || "physics"}
              initialPreset={block.simPreset || "spacetime"}
              initialCode={block.content || undefined}
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
