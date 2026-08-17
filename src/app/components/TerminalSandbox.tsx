"use client";

import React, { useState } from "react";

interface TerminalSandboxProps {
  initialCode: string;
  language?: string;
}

// Light-weight high-speed lexical syntax tokenizer for coding terminal previews
function highlightCode(code: string): string {
  let html = "";
  let i = 0;
  
  const keywords = new Set([
    "const", "let", "var", "function", "return", "if", "else", "for", "while", 
    "import", "export", "from", "default", "class", "new", "async", "await", 
    "try", "catch", "finally", "throw", "error", "null", "undefined", "true", "false",
    "typeof", "instanceof", "in", "of"
  ]);
  
  const builtins = new Set([
    "console", "log", "error", "warn", "info", "fetch", "document", "window", "JSON", "Math", "Promise", "setTimeout"
  ]);

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  while (i < code.length) {
    const char = code[i];

    // 1. Comments: single line (//) and block (/* */)
    if (char === "/" && code[i + 1] === "/") {
      let comment = "";
      while (i < code.length && code[i] !== "\n") {
        comment += code[i++];
      }
      html += `<span style="color:#6B5E56;font-style:italic;">${escapeHtml(comment)}</span>`;
      continue;
    }
    
    if (char === "/" && code[i + 1] === "*") {
      let comment = "";
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        comment += code[i++];
      }
      if (i < code.length) comment += code[i++]; // *
      if (i < code.length) comment += code[i++]; // /
      html += `<span style="color:#6B5E56;font-style:italic;">${escapeHtml(comment)}</span>`;
      continue;
    }

    // 2. Strings: single quote, double quote, template literals
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === "\\") {
          str += code[i++];
        }
        str += code[i++];
      }
      if (i < code.length) str += code[i++]; // closing quote
      html += `<span style="color:#34D399;">${escapeHtml(str)}</span>`;
      continue;
    }

    // 3. Numbers
    if (/\d/.test(char)) {
      let num = "";
      while (i < code.length && /[\d.]/.test(code[i])) {
        num += code[i++];
      }
      html += `<span style="color:#F97316;">${escapeHtml(num)}</span>`;
      continue;
    }

    // 4. Identifiers, Keywords, and Built-ins
    if (/[a-zA-Z_$]/.test(char)) {
      let id = "";
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        id += code[i++];
      }
      
      if (keywords.has(id)) {
        html += `<span style="color:#C084FC;font-weight:600;">${id}</span>`;
      } else if (builtins.has(id)) {
        html += `<span style="color:#60A5FA;">${id}</span>`;
      } else {
        // Check if it is a function call
        let tempI = i;
        while (tempI < code.length && /\s/.test(code[tempI])) {
          tempI++;
        }
        if (code[tempI] === "(") {
          html += `<span style="color:#FBBF24;">${id}</span>`;
        } else {
          html += escapeHtml(id);
        }
      }
      continue;
    }

    // 5. Default character escaping
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

  const cleanLang = language.replace(" (read-only)", "").toLowerCase();
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
    }, 400);
  };

  return (
    <div style={styles.terminalContainer} className="card">
      {/* ChatGPT / Gemini Header Bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.langBadge}>{cleanLang}</span>
        </div>
        <div style={styles.actions}>
          <button onClick={handleCopy} style={styles.copyBtn}>
            {copied ? "✓ Copied!" : "📋 Copy code"}
          </button>
          {isRunnable && (
            <>
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                style={isEditing ? styles.btnActive : styles.btn}
              >
                {isEditing ? "View Code" : "Edit"}
              </button>
              <button 
                onClick={handleRun} 
                disabled={isRunning} 
                style={styles.runBtn}
              >
                {isRunning ? "Running..." : "▶ Run"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Code Area */}
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
            <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
          </pre>
        )}
      </div>

      {/* Output Terminal */}
      {output && (
        <div style={styles.console}>
          <div style={styles.consoleTitle}>CONSOLE OUTPUT:</div>
          <pre style={styles.consolePre}>{output}</pre>
        </div>
      )}

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .card {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          overflow: hidden;
        }
      `}} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  terminalContainer: {
    backgroundColor: "#1E1E1E", // ChatGPT dark-grey coding theme
    color: "#F3F4F6",
    fontFamily: "monospace",
    margin: "2rem 0",
    display: "flex",
    flexDirection: "column",
    borderRadius: "6px",
    border: "1px solid var(--color-border)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2D2D2D", // Header dark slate
    padding: "0.6rem 1.2rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
  },
  langBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#D1A751", // Luxury gold language label
    textTransform: "lowercase",
    fontFamily: "var(--font-sans)",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
  },
  copyBtn: {
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    fontSize: "0.72rem",
    cursor: "pointer",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    transition: "color 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
  },
  btn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#EAE5DB",
    padding: "0.25rem 0.6rem",
    fontSize: "0.65rem",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
  },
  btnActive: {
    background: "#C69A5B",
    border: "1px solid #C69A5B",
    color: "#1C1512",
    padding: "0.25rem 0.6rem",
    fontSize: "0.65rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontFamily: "var(--font-sans)",
  },
  runBtn: {
    background: "#27C93F",
    border: "1px solid #27C93F",
    color: "#110D0B",
    padding: "0.25rem 0.75rem",
    fontSize: "0.65rem",
    fontWeight: "bold",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
  },
  codeWrapper: {
    padding: "1.2rem",
    fontSize: "0.85rem",
    lineHeight: "1.6",
    backgroundColor: "#1E1E1E",
    overflowX: "auto",
    minHeight: "80px",
    display: "flex",
  },
  codePre: {
    margin: 0,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    color: "#E5E7EB",
    width: "100%",
  },
  editor: {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    color: "#FEF3C7",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    lineHeight: "1.6",
    outline: "none",
    resize: "vertical",
    minHeight: "120px",
  },
  console: {
    backgroundColor: "#151515",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "0.8rem 1.2rem",
  },
  consoleTitle: {
    fontSize: "0.65rem",
    fontWeight: "bold",
    color: "#6B5E56",
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
    fontFamily: "var(--font-sans)",
  },
  consolePre: {
    margin: 0,
    fontFamily: "monospace",
    fontSize: "0.8rem",
    color: "#34D399",
    whiteSpace: "pre-wrap",
    lineHeight: "1.4",
  },
};
