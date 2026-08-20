"use client";

import React, { useState } from "react";

interface TerminalSandboxProps {
  initialCode: string;
  language?: string;
}

// Multi-language Lexical Syntax Tokenizer for clean ChatGPT/Gemini style code blocks
function highlightCode(code: string, lang: string): string {
  let html = "";
  let i = 0;
  const cleanLang = lang.toLowerCase().trim();

  // Keyword sets
  const jsKeywords = new Set([
    "const", "let", "var", "function", "return", "if", "else", "for", "while", 
    "import", "export", "from", "default", "class", "new", "async", "await", 
    "try", "catch", "finally", "throw", "error", "null", "undefined", "true", "false",
    "typeof", "instanceof", "in", "of", "interface", "type", "extends", "implements"
  ]);

  const pyKeywords = new Set([
    "def", "class", "import", "from", "as", "return", "if", "elif", "else", "for",
    "while", "try", "except", "finally", "raise", "with", "lambda", "pass", "yield",
    "break", "continue", "True", "False", "None", "is", "not", "and", "or", "in", "global", "nonlocal"
  ]);

  const sqlKeywords = new Set([
    "select", "from", "where", "insert", "into", "update", "delete", "join", "inner",
    "left", "right", "full", "outer", "group", "by", "order", "having", "limit", "offset",
    "create", "table", "drop", "alter", "add", "column", "primary", "key", "foreign", "references",
    "null", "not", "distinct", "union", "all", "as", "and", "or", "values", "set", "count", "sum", "avg"
  ]);

  const htmlKeywords = new Set([
    "html", "head", "body", "div", "span", "p", "a", "img", "button", "input", "form",
    "ul", "ol", "li", "table", "tr", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6",
    "header", "footer", "section", "article", "nav", "aside", "main", "script", "style", "meta", "link"
  ]);

  const builtins = new Set([
    "console", "log", "error", "warn", "info", "fetch", "document", "window", "JSON",
    "Math", "Promise", "setTimeout", "setInterval", "print", "len", "range", "str", "int", "dict", "list", "set"
  ]);

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const isPythonOrBash = ["python", "py", "bash", "sh", "shell", "yaml", "yml"].includes(cleanLang);
  const isSql = cleanLang === "sql";

  while (i < code.length) {
    const char = code[i];

    // 1. Comments
    // JS/C/Java style: // ... or /* ... */
    if (char === "/" && code[i + 1] === "/") {
      let comment = "";
      while (i < code.length && code[i] !== "\n") {
        comment += code[i++];
      }
      html += `<span style="color:#8B949E;font-style:italic;">${escapeHtml(comment)}</span>`;
      continue;
    }
    if (char === "/" && code[i + 1] === "*") {
      let comment = "";
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        comment += code[i++];
      }
      if (i < code.length) comment += code[i++];
      if (i < code.length) comment += code[i++];
      html += `<span style="color:#8B949E;font-style:italic;">${escapeHtml(comment)}</span>`;
      continue;
    }
    // Python / Bash / YAML style: # ...
    if (char === "#" && (isPythonOrBash || !/[a-fA-F0-9]/.test(code[i + 1] || ""))) {
      let comment = "";
      while (i < code.length && code[i] !== "\n") {
        comment += code[i++];
      }
      html += `<span style="color:#8B949E;font-style:italic;">${escapeHtml(comment)}</span>`;
      continue;
    }
    // SQL style: -- ...
    if (char === "-" && code[i + 1] === "-" && isSql) {
      let comment = "";
      while (i < code.length && code[i] !== "\n") {
        comment += code[i++];
      }
      html += `<span style="color:#8B949E;font-style:italic;">${escapeHtml(comment)}</span>`;
      continue;
    }

    // 2. Strings
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === "\\") {
          str += code[i++];
        }
        if (i < code.length) {
          str += code[i++];
        }
      }
      if (i < code.length) str += code[i++];
      html += `<span style="color:#7EE787;">${escapeHtml(str)}</span>`;
      continue;
    }

    // 3. Numbers
    if (/\d/.test(char)) {
      let num = "";
      while (i < code.length && /[\d.a-fA-FxX]/.test(code[i])) {
        num += code[i++];
      }
      html += `<span style="color:#FF7B72;">${escapeHtml(num)}</span>`;
      continue;
    }

    // 4. Words (Identifiers, Keywords, Built-ins)
    if (/[a-zA-Z_$]/.test(char)) {
      let id = "";
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        id += code[i++];
      }
      
      const lowerId = id.toLowerCase();
      const isKeyword = jsKeywords.has(id) || pyKeywords.has(id) || sqlKeywords.has(lowerId) || (cleanLang.includes("html") && htmlKeywords.has(lowerId));

      if (isKeyword) {
        html += `<span style="color:#D2A8FF;font-weight:600;">${id}</span>`;
      } else if (builtins.has(id)) {
        html += `<span style="color:#79C0FF;">${id}</span>`;
      } else {
        // Lookahead for function call (e.g. func())
        let tempI = i;
        while (tempI < code.length && /\s/.test(code[tempI])) {
          tempI++;
        }
        if (code[tempI] === "(") {
          html += `<span style="color:#FFA657;">${id}</span>`;
        } else {
          html += escapeHtml(id);
        }
      }
      continue;
    }

    // 5. Default character
    html += escapeHtml(char);
    i++;
  }

  return html;
}

export default function TerminalSandbox({ initialCode, language = "javascript" }: TerminalSandboxProps) {
  const [code, setCode] = useState(initialCode.trim());
  const [isEditing, setIsEditing] = useState(false);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanLang = language.replace(" (read-only)", "").toLowerCase().trim() || "code";
  const isRunnable = ["js", "javascript", "ts", "typescript"].includes(cleanLang) && !language.includes("read-only");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setIsRunning(true);
    setOutput("Running execution...");
    
    setTimeout(() => {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
        },
        error: (...args: any[]) => {
          logs.push("❌ [Error] " + args.join(" "));
        },
        warn: (...args: any[]) => {
          logs.push("⚠️ [Warning] " + args.join(" "));
        }
      };

      try {
        const executeCode = new Function("console", code);
        executeCode(customConsole);
        
        if (logs.length === 0) {
          setOutput("Code executed successfully.\n(No console.log output produced)");
        } else {
          setOutput(logs.join("\n"));
        }
      } catch (err: any) {
        setOutput(`❌ Runtime Error:\n${err.message}`);
      }
      setIsRunning(false);
    }, 300);
  };

  return (
    <div style={styles.terminalContainer} className="terminal-code-box">
      {/* ChatGPT / Gemini Style Top Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.langBadge}>{cleanLang}</span>
        </div>
        <div style={styles.actions}>
          <button onClick={handleCopy} style={styles.copyBtn} type="button" title="Copy code to clipboard">
            {copied ? "✓ Copied!" : "📋 Copy code"}
          </button>
          {isRunnable && (
            <>
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                style={isEditing ? styles.btnActive : styles.btn}
                type="button"
              >
                {isEditing ? "View Code" : "Edit"}
              </button>
              <button 
                onClick={handleRun} 
                disabled={isRunning} 
                style={styles.runBtn}
                type="button"
              >
                {isRunning ? "Running..." : "▶ Run"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Code Viewer / Interactive Editor Area */}
      <div style={styles.codeWrapper}>
        {isEditing ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={styles.editor}
            spellCheck={false}
          />
        ) : (
          <pre style={styles.codePre}>
            <code dangerouslySetInnerHTML={{ __html: highlightCode(code, cleanLang) }} />
          </pre>
        )}
      </div>

      {/* Output Console Box */}
      {output && (
        <div style={styles.console}>
          <div style={styles.consoleTitle}>CONSOLE OUTPUT:</div>
          <pre style={styles.consolePre}>{output}</pre>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  terminalContainer: {
    backgroundColor: "#161B22", // Clean dark theme (GitHub / ChatGPT dark)
    color: "#E6EDF3",
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
    margin: "1.8rem 0",
    display: "flex",
    flexDirection: "column",
    borderRadius: "8px",
    border: "1px solid #30363D",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0D1117",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #30363D",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
  },
  langBadge: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#D1A751",
    textTransform: "lowercase",
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.03em",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  copyBtn: {
    background: "transparent",
    border: "none",
    color: "#8B949E",
    fontSize: "0.75rem",
    cursor: "pointer",
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
  },
  btn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid #30363D",
    color: "#C9D1D9",
    padding: "0.25rem 0.6rem",
    fontSize: "0.7rem",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
  },
  btnActive: {
    background: "#C69A5B",
    border: "1px solid #C69A5B",
    color: "#161B22",
    padding: "0.25rem 0.6rem",
    fontSize: "0.7rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontFamily: "var(--font-sans)",
  },
  runBtn: {
    background: "#238636",
    border: "1px solid #2EA043",
    color: "#FFFFFF",
    padding: "0.25rem 0.75rem",
    fontSize: "0.7rem",
    fontWeight: "bold",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
  },
  codeWrapper: {
    padding: "1.2rem",
    fontSize: "0.9rem",
    lineHeight: "1.65",
    backgroundColor: "#161B22",
    overflowX: "auto",
    minHeight: "60px",
    display: "flex",
  },
  codePre: {
    margin: 0,
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "#E6EDF3",
    width: "100%",
  },
  editor: {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    color: "#F0F6FC",
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    fontSize: "0.9rem",
    lineHeight: "1.65",
    outline: "none",
    resize: "vertical",
    minHeight: "100px",
  },
  console: {
    backgroundColor: "#0D1117",
    borderTop: "1px solid #30363D",
    padding: "0.8rem 1.2rem",
  },
  consoleTitle: {
    fontSize: "0.68rem",
    fontWeight: "bold",
    color: "#8B949E",
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
    fontFamily: "var(--font-sans)",
  },
  consolePre: {
    margin: 0,
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    fontSize: "0.82rem",
    color: "#7EE787",
    whiteSpace: "pre-wrap",
    lineHeight: "1.45",
  },
};
