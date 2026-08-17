"use client";

import React, { useState } from "react";

interface TerminalSandboxProps {
  initialCode: string;
  language?: string;
}

// Light-weight high-speed syntax highlighter for coding terminal previews
function highlightCode(code: string): string {
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Comments: single line (//...) and block (/*...*/) -> greyish taupe
  html = html.replace(/(\/\/.*)/g, '<span style="color:#6B5E56;font-style:italic;">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6B5E56;font-style:italic;">$1</span>');

  // 2. Strings: single quote, double quote, template literals -> vibrant soft green
  html = html.replace(/(["'`])(.*?)\1/g, '<span style="color:#34D399;">$1$2$1</span>');

  // 3. Keywords: const, let, return, if, function -> lavender violet
  const keywords = [
    "const", "let", "var", "function", "return", "if", "else", "for", "while", 
    "import", "export", "from", "default", "class", "new", "async", "await", 
    "try", "catch", "finally", "throw", "error", "null", "undefined", "true", "false",
    "typeof", "instanceof", "in", "of"
  ];
  const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  html = html.replace(keywordRegex, '<span style="color:#C084FC;font-weight:600;">$1</span>');

  // 4. Built-in Objects/Methods: console, log, fetch -> sky blue
  const builtins = ["console", "log", "error", "warn", "info", "fetch", "document", "window", "JSON", "Math", "Promise", "setTimeout"];
  const builtinRegex = new RegExp(`\\b(${builtins.join("|")})\\b`, "g");
  html = html.replace(builtinRegex, '<span style="color:#60A5FA;">$1</span>');

  // 5. Function Calls: customName() -> bright amber yellow
  html = html.replace(/(\b\w+)(?=\()/g, '<span style="color:#FBBF24;">$1</span>');

  // 6. Numeric digits -> neon orange
  html = html.replace(/\b(\d+)\b/g, '<span style="color:#F97316;">$1</span>');

  return html;
}

export default function TerminalSandbox({ initialCode, language = "javascript" }: TerminalSandboxProps) {
  const [code, setCode] = useState(initialCode.trim());
  const [isEditing, setIsEditing] = useState(false);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

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
        // Execute JS code within a sandboxed context overriding console
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
      {/* Header Bar */}
      <div style={styles.header}>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, backgroundColor: "#FF5F56" }}></span>
          <span style={{ ...styles.dot, backgroundColor: "#FFBD2E" }}></span>
          <span style={{ ...styles.dot, backgroundColor: "#27C93F" }}></span>
        </div>
        <div style={styles.title}>{language.toUpperCase()} TERMINAL SANDBOX</div>
        <div style={styles.actions}>
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            style={isEditing ? styles.btnActive : styles.btn}
          >
            {isEditing ? "View Code" : "Edit Code"}
          </button>
          <button 
            onClick={handleRun} 
            disabled={isRunning} 
            style={styles.runBtn}
          >
            {isRunning ? "Running..." : "▶ Run"}
          </button>
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
    backgroundColor: "#110D0B",
    color: "#F7F4EF",
    fontFamily: "monospace",
    margin: "1.5rem 0",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C1512",
    padding: "0.6rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  dots: {
    display: "flex",
    gap: "0.4rem",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
  },
  title: {
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: "#C69A5B",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
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
  },
  codeWrapper: {
    padding: "1rem",
    fontSize: "0.85rem",
    lineHeight: "1.5",
    backgroundColor: "#110D0B",
    overflowX: "auto",
    minHeight: "100px",
    display: "flex",
  },
  codePre: {
    margin: 0,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    color: "#EAE5DB",
    width: "100%",
  },
  editor: {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    color: "#FEF3C7",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    lineHeight: "1.5",
    outline: "none",
    resize: "vertical",
    minHeight: "120px",
  },
  console: {
    backgroundColor: "#080605",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "0.8rem 1rem",
  },
  consoleTitle: {
    fontSize: "0.6rem",
    fontWeight: "bold",
    color: "#6B5E56",
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
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
