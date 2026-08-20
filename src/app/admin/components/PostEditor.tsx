"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { createBlogPost, updateBlogPost } from "../../actions/blog";
import { Post } from "@/db";
import { optimizeCloudinaryUrl } from "@/lib/media";
import MDContent from "@/app/components/MDContent";

interface PostEditorProps {
  post?: Post;
}

export default function PostEditor({ post }: PostEditorProps) {
  const isEditMode = !!post;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(post?.title || "");
  const [type, setType] = useState<"news" | "photo" | "video">(post?.type || "news");
  const [summary, setSummary] = useState(post?.summary || "");
  const [content, setContent] = useState(post?.content || "");
  const [published, setPublished] = useState(post?.published ?? true);

  // Sandbox language picker state
  const [sandboxLang, setSandboxLang] = useState("javascript");

  // Cloudinary media states
  const [mediaUrl, setMediaUrl] = useState(post?.mediaUrl || "");
  const [mediaPublicId, setMediaPublicId] = useState(post?.mediaPublicId || "");
  const [mediaType, setMediaType] = useState(post?.mediaType || "");
  const [mediaWidth, setMediaWidth] = useState<number | null>(post?.mediaWidth || null);
  const [mediaHeight, setMediaHeight] = useState<number | null>(post?.mediaHeight || null);

  // File upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Editor layout tab: "write" | "markdown" | "preview"
  const [editorTab, setEditorTab] = useState<"write" | "markdown" | "preview">("write");

  const editorRef = useRef<HTMLDivElement>(null);

  // Sync content with editable paper sheet on load and tab toggle
  useEffect(() => {
    if (editorTab === "write" && editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [editorTab, content]);

  const execCmd = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Inserts a clean, bordered code sandbox box with immediate trailing paragraph
  const insertCodeSandbox = () => {
    const lang = sandboxLang;
    const defaultPlaceholder = lang === "python" 
      ? `# Write or paste Python code here\nprint("Hello from Python")` 
      : lang === "sql"
      ? `-- SQL Query\nSELECT * FROM users WHERE active = true;`
      : lang === "html"
      ? `<!-- HTML Snippet -->\n<div class="card">\n  <h2>Title</h2>\n</div>`
      : `// Write or paste ${lang} code here\nconsole.log("Hello from ${lang}");`;

    const htmlSnippet = `<pre style="background:#161B22; color:#E6EDF3; padding:1.2rem; border-radius:8px; border:1px solid #30363D; font-family:'Fira Code', Consolas, monospace; margin:1.5rem 0; font-size:0.9rem; line-height:1.6;"><code class="language-${lang}">${defaultPlaceholder}</code></pre><p><br></p>`;
    
    if (editorTab === "write") {
      execCmd("insertHTML", htmlSnippet);
    } else if (editorTab === "markdown") {
      const mdSnippet = `\n\`\`\`${lang}\n${defaultPlaceholder}\n\`\`\`\n\n`;
      setContent((prev) => prev + mdSnippet);
    }
  };

  const insertUploadedImage = () => {
    if (!mediaUrl) return;
    if (editorTab === "write") {
      execCmd("insertHTML", `<img src="${mediaUrl}" style="width:100%; max-height:480px; object-fit:cover; margin:1.8rem 0; border-radius:6px; border:1px solid var(--color-border);" alt="Uploaded Image" /><p><br></p>`);
    } else if (editorTab === "markdown") {
      setContent((prev) => prev + `\n\n![Article Image](${mediaUrl})\n\n`);
    }
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerHTML);
  };

  // Safe paste handler: pastes pure plain text inside code blocks to prevent style corruption
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const textData = clipboardData.getData("text/plain");
    const htmlData = clipboardData.getData("text/html");

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Check if the cursor is currently inside a <pre> or <code> block
    let node = selection.anchorNode;
    let isInCodeBlock = false;

    while (node && node !== editorRef.current) {
      if (node.nodeName === "PRE" || node.nodeName === "CODE") {
        isInCodeBlock = true;
        break;
      }
      node = node.parentNode;
    }

    if (isInCodeBlock) {
      // Paste PURE plain text without any HTML tags or span attributes
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(textData));
      range.collapse(false);
      if (editorRef.current) setContent(editorRef.current.innerHTML);
      return;
    }

    // If outside code blocks, sanitize HTML paste
    if (htmlData) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, "text/html");

      const sanitizeNode = (n: Node): Node | null => {
        if (n.nodeType === Node.TEXT_NODE) {
          return n.cloneNode(true);
        }

        if (n.nodeType === Node.ELEMENT_NODE) {
          const el = n as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          const allowedTags = [
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "br", "span", "div", "blockquote",
            "strong", "b", "em", "i", "u", "s", "strike",
            "ul", "ol", "li",
            "pre", "code",
            "table", "thead", "tbody", "tr", "th", "td",
            "a", "img"
          ];

          if (!allowedTags.includes(tagName)) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < el.childNodes.length; i++) {
              const child = sanitizeNode(el.childNodes[i]);
              if (child) fragment.appendChild(child);
            }
            return fragment;
          }

          const cleanEl = document.createElement(tagName);

          if (tagName === "a") {
            cleanEl.setAttribute("href", el.getAttribute("href") || "#");
            cleanEl.setAttribute("target", "_blank");
            cleanEl.setAttribute("rel", "noopener noreferrer");
            cleanEl.setAttribute("style", "color: var(--color-accent); text-decoration: underline; font-weight: 600;");
          }

          if (tagName === "img") {
            cleanEl.setAttribute("src", el.getAttribute("src") || "");
            cleanEl.setAttribute("alt", el.getAttribute("alt") || "Image");
            cleanEl.setAttribute("style", "width:100%; max-height:480px; object-fit:cover; margin:1.5rem 0; border-radius:6px; border:1px solid var(--color-border);");
          }

          if (tagName === "table") {
            cleanEl.setAttribute("style", "width:100%; border-collapse:collapse; margin:1.2rem 0;");
            cleanEl.setAttribute("border", "1px");
          }
          if (tagName === "td" || tagName === "th") {
            cleanEl.setAttribute("style", "padding:8px; border:1px solid var(--color-border);");
          }
          if (tagName === "pre") {
            cleanEl.setAttribute("style", "background:#161B22; color:#E6EDF3; padding:1.2rem; font-family:monospace; border-radius:8px; border:1px solid #30363D; overflow-x:auto; margin:1.5rem 0;");
          }

          for (let i = 0; i < el.childNodes.length; i++) {
            const child = sanitizeNode(el.childNodes[i]);
            if (child) cleanEl.appendChild(child);
          }

          return cleanEl;
        }

        return null;
      };

      const cleanFragment = document.createDocumentFragment();
      const bodyNodes = doc.body.childNodes;
      for (let i = 0; i < bodyNodes.length; i++) {
        const cleaned = sanitizeNode(bodyNodes[i]);
        if (cleaned) cleanFragment.appendChild(cleaned);
      }

      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(cleanFragment);
      range.collapse(false);
    } else {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(textData));
      range.collapse(false);
    }

    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Handle file selection and direct signed upload to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "photo" && !file.type.startsWith("image/")) {
      setError("Please upload an image file for photo posts.");
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      setError("Please upload a video file for video posts.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const sigRes = await fetch("/api/upload-signature", { method: "POST" });
      if (!sigRes.ok) throw new Error("Failed to authenticate upload request.");
      const { timestamp, signature, apiKey, cloudName, folder } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          setMediaUrl(data.secure_url);
          setMediaPublicId(data.public_id);
          setMediaType(data.resource_type);
          setMediaWidth(data.width || null);
          setMediaHeight(data.height || null);
          setIsUploading(false);
          setUploadProgress(null);
        } else {
          setError("Direct Cloudinary upload failed.");
          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        setError("Network error occurred during Cloudinary transfer.");
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch (err: any) {
      setError(err.message || "Failed to initialize Cloudinary upload pipeline.");
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaUrl("");
    setMediaPublicId("");
    setMediaType("");
    setMediaWidth(null);
    setMediaHeight(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!summary.trim()) {
      setError("Summary is required.");
      return;
    }
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);
      formData.append("summary", summary);
      formData.append("content", content);
      formData.append("published", published ? "true" : "false");
      if (mediaUrl) formData.append("mediaUrl", mediaUrl);
      if (mediaPublicId) formData.append("mediaPublicId", mediaPublicId);
      if (mediaType) formData.append("mediaType", mediaType);
      if (mediaWidth) formData.append("mediaWidth", mediaWidth.toString());
      if (mediaHeight) formData.append("mediaHeight", mediaHeight.toString());

      try {
        if (isEditMode && post) {
          await updateBlogPost(post.id, formData);
        } else {
          await createBlogPost(formData);
        }
      } catch (err: any) {
        if (err.message && err.message.includes("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err.message || "Failed to save article.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.formContainer}>
      {error && (
        <div style={styles.errorAlert} className="card">
          ⚠️ {error}
        </div>
      )}

      <div style={styles.flexLayout}>
        {/* Left Side: Metadata and Document Sheet */}
        <div style={styles.leftFields}>
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Article Title</label>
            <input
              id="title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Building Next.js Web Apps at High Performance"
              required
            />
          </div>

          {/* Type Selection */}
          <div className="form-group">
            <label htmlFor="type">Article Format</label>
            <select
              id="type"
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={styles.select}
            >
              <option value="news">Editorial Article (Text &amp; Code Sandbox)</option>
              <option value="photo">Photo Story (Featured Image Header)</option>
              <option value="video">Video Feature (Video Stream Header)</option>
            </select>
          </div>

          {/* Short Summary */}
          <div className="form-group">
            <label htmlFor="summary">Deck / Summary</label>
            <textarea
              id="summary"
              className="form-input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief 1-2 sentence lead overview of the article..."
              rows={2}
              style={styles.textarea}
              required
            />
          </div>

          {/* Unified Article Editor with 3 Modes */}
          <div className="form-group" style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div style={styles.editorHeader}>
              <label style={{ margin: 0, fontWeight: 700 }}>Article Content Canvas</label>
              <div style={styles.editorTabs}>
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  style={{
                    ...styles.tabBtn,
                    ...(editorTab === "write" ? styles.tabBtnActive : {}),
                  }}
                >
                  📝 Document Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("markdown")}
                  style={{
                    ...styles.tabBtn,
                    ...(editorTab === "markdown" ? styles.tabBtnActive : {}),
                  }}
                >
                  ⚡ Markdown / ChatGPT Mode
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  style={{
                    ...styles.tabBtn,
                    ...(editorTab === "preview" ? styles.tabBtnActive : {}),
                  }}
                >
                  👁️ Live Preview
                </button>
              </div>
            </div>

            {/* TAB 1: Visual Document Editor (MS Word Style) */}
            {editorTab === "write" && (
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                {/* Word Ribbon Toolbar */}
                <div style={styles.editorToolbar}>
                  {/* Typography Group */}
                  <div style={styles.toolbarGroup}>
                    <button type="button" onClick={() => execCmd("bold")} title="Bold" style={styles.toolbarBtn}><b>B</b></button>
                    <button type="button" onClick={() => execCmd("italic")} title="Italic" style={styles.toolbarBtn}><i>I</i></button>
                    <button type="button" onClick={() => execCmd("underline")} title="Underline" style={styles.toolbarBtn}><u>U</u></button>
                    <button type="button" onClick={() => execCmd("strikeThrough")} title="Strikethrough" style={styles.toolbarBtn}><s>S</s></button>
                  </div>
                  
                  {/* Heading Block Group */}
                  <div style={styles.toolbarGroup}>
                    <button type="button" onClick={() => execCmd("formatBlock", "H1")} title="Header 1" style={styles.toolbarBtn}>H1</button>
                    <button type="button" onClick={() => execCmd("formatBlock", "H2")} title="Header 2" style={styles.toolbarBtn}>H2</button>
                    <button type="button" onClick={() => execCmd("formatBlock", "H3")} title="Header 3" style={styles.toolbarBtn}>H3</button>
                    <button type="button" onClick={() => execCmd("formatBlock", "P")} title="Paragraph" style={styles.toolbarBtn}>P</button>
                  </div>

                  {/* Lists Group */}
                  <div style={styles.toolbarGroup}>
                    <button type="button" onClick={() => execCmd("insertUnorderedList")} title="Bullet List" style={styles.toolbarBtn}>• List</button>
                    <button type="button" onClick={() => execCmd("insertOrderedList")} title="Numbered List" style={styles.toolbarBtn}>1. List</button>
                  </div>

                  {/* Code Sandbox Insertion with Language Picker */}
                  <div style={styles.toolbarGroup}>
                    <select
                      value={sandboxLang}
                      onChange={(e) => setSandboxLang(e.target.value)}
                      style={styles.langSelect}
                      title="Select Code Language"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="json">JSON</option>
                      <option value="sql">SQL</option>
                      <option value="bash">Bash / Shell</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={insertCodeSandbox} 
                      title="Insert Code Sandbox at cursor" 
                      style={styles.sandboxInsertBtn}
                    >
                      ⚡ Insert Code Sandbox
                    </button>
                  </div>

                  {/* Extra Rich Media Tools */}
                  <div style={styles.toolbarGroup}>
                    <button 
                      type="button" 
                      onClick={() => execCmd("insertHTML", "$$ E = m c^2 $$")} 
                      title="Insert LaTeX Math Equation" 
                      style={styles.toolbarBtn}
                    >
                      Σ LaTeX
                    </button>
                    <button 
                      type="button" 
                      onClick={() => execCmd("insertHTML", "<table border='1' style='width:100%; border-collapse:collapse; margin:1.2rem 0;'><tr style='background:rgba(0,0,0,0.03);'><th style='padding:8px;'>Column 1</th><th style='padding:8px;'>Column 2</th></tr><tr><td style='padding:8px;'>Data 1</td><td style='padding:8px;'>Data 2</td></tr></table><p><br></p>")} 
                      title="Insert Data Table" 
                      style={styles.toolbarBtn}
                    >
                      Table
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const url = prompt("Enter Image URL to insert into article:");
                        if (url) execCmd("insertHTML", `<img src="${url}" style="width:100%; max-height:480px; object-fit:cover; margin:1.5rem 0; border-radius:6px; border:1px solid var(--color-border);" alt="Inserted Image" /><p><br></p>`);
                      }} 
                      title="Insert External Image URL" 
                      style={styles.toolbarBtn}
                    >
                      📷 Image URL
                    </button>
                    <button type="button" onClick={() => execCmd("insertHorizontalRule")} title="Horizontal Line" style={styles.toolbarBtn}>Line</button>
                  </div>

                  {/* Actions */}
                  <div style={{ ...styles.toolbarGroup, borderRight: "none" }}>
                    <button type="button" onClick={() => execCmd("removeFormat")} title="Clear Formatting" style={styles.toolbarBtn}>Clear</button>
                    <button type="button" onClick={() => execCmd("undo")} title="Undo" style={styles.toolbarBtn}>↶</button>
                    <button type="button" onClick={() => execCmd("redo")} title="Redo" style={styles.toolbarBtn}>↷</button>
                  </div>
                </div>

                {/* Visual Paper Sheet */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onPaste={handlePaste}
                  style={styles.wordPaperSheet}
                  className="form-input"
                  data-placeholder="Start typing your rich article here... Use the toolbar above to format headings, insert code blocks, add photos, or paste content directly from Word or ChatGPT."
                />
              </div>
            )}

            {/* TAB 2: Markdown / ChatGPT Direct Raw Editor */}
            {editorTab === "markdown" && (
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <div style={styles.markdownHintBar}>
                  💡 <b>ChatGPT / Markdown Mode:</b> Directly paste full articles with <code>## Headings</code>, <code>```javascript code blocks```</code>, LaTeX <code>$$ E=mc^2 $$</code>, and lists.
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={styles.markdownTextarea}
                  placeholder={`# Article Title\n\nWrite your blog paragraphs here.\n\n\`\`\`javascript\nconst hello = "world";\nconsole.log(hello);\n\`\`\`\n\nMore paragraphs below...`}
                  rows={18}
                  spellCheck={false}
                />
              </div>
            )}

            {/* TAB 3: Live Preview */}
            {editorTab === "preview" && (
              <div style={styles.previewBox}>
                {content ? (
                  <MDContent content={content} />
                ) : (
                  <p style={{ color: "var(--color-text-muted)", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
                    Nothing to preview yet. Start typing in Document Editor or Markdown Mode!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Media Uploader & Publication Settings */}
        <div style={styles.rightUploader}>
          {/* Media Section */}
          {type !== "news" && (
            <div style={styles.mediaContainer}>
              <h3 style={styles.sectionHeader}>Header Banner Media</h3>
              <p style={styles.sectionSubtitle}>
                Upload a high-quality {type === "video" ? "video" : "image"} for the top hero section.
              </p>

              {mediaUrl ? (
                <div style={styles.mediaPreviewContainer}>
                  {type === "video" ? (
                    <video src={optimizeCloudinaryUrl(mediaUrl)} controls style={styles.mediaPreview} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={optimizeCloudinaryUrl(mediaUrl)} alt="Upload preview" style={styles.mediaPreview} />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    style={styles.removeMediaBtn}
                  >
                    × Remove Asset
                  </button>
                  {type !== "video" && (
                    <button
                      type="button"
                      onClick={insertUploadedImage}
                      style={styles.insertMediaBtn}
                      title="Insert this image directly into the article body"
                    >
                      ➕ Insert Image to Article Body
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.dropzone}>
                  <input
                    type="file"
                    id="media-file"
                    accept={type === "video" ? "video/*" : "image/*"}
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    style={styles.fileInput}
                  />
                  <label htmlFor="media-file" style={styles.dropzoneLabel}>
                    <div style={styles.uploadIcon}>↑</div>
                    <div style={styles.uploadText}>
                      {isUploading
                        ? `Uploading (${uploadProgress}%)`
                        : `Click to select a ${type === "video" ? "video" : "photo"}`}
                    </div>
                    <div style={styles.uploadHint}>
                      {type === "video"
                        ? "MP4, WebM formats supported"
                        : "JPEG, PNG, WebP formats supported"}
                    </div>
                  </label>
                  {isUploading && (
                    <div style={styles.progressBarBg}>
                      <div
                        style={{
                          ...styles.progressBarFill,
                          width: `${uploadProgress || 0}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Publication settings */}
          <div style={styles.publishContainer}>
            <h3 style={styles.sectionHeader}>Publish Settings</h3>

            <div style={styles.switchRow}>
              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  style={styles.switchInput}
                />
                <span
                  style={{
                    ...styles.switchSlider,
                    ...(published ? styles.switchSliderActive : {}),
                  }}
                ></span>
              </label>
              <div style={styles.switchTextGroup}>
                <div style={styles.switchMainLabel}>Visibility</div>
                <div style={styles.switchSubLabel}>
                  {published
                    ? "Visible on public feed immediately"
                    : "Draft - Only viewable in admin"}
                </div>
              </div>
            </div>

            <div style={styles.actionsBox}>
              <button
                type="submit"
                disabled={isPending || isUploading}
                className="btn-gold"
                style={styles.saveBtn}
              >
                {isPending ? "Saving..." : isEditMode ? "Save Changes" : "Publish Post"}
              </button>
              <Link href="/admin" className="btn-secondary" style={styles.cancelBtn}>
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  flexLayout: {
    display: "flex",
    gap: "2.5rem",
    flexWrap: "wrap",
  },
  leftFields: {
    flex: "2 1 600px",
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  rightUploader: {
    flex: "1 1 300px",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  select: {
    cursor: "pointer",
  },
  textarea: {
    resize: "vertical",
  },
  editorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.6rem",
  },
  editorTabs: {
    display: "flex",
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  tabBtn: {
    padding: "0.4rem 0.9rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    border: "none",
    background: "var(--color-bg-light)",
    color: "var(--color-text-muted)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabBtnActive: {
    background: "var(--color-text-dark)",
    color: "#FFFFFF",
  },
  editorToolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.3rem",
    backgroundColor: "#FAF7F2",
    border: "1px solid var(--color-border)",
    borderBottom: "none",
    padding: "0.6rem",
    borderRadius: "6px 6px 0 0",
    alignItems: "center",
  },
  toolbarGroup: {
    display: "flex",
    gap: "0.2rem",
    borderRight: "1px solid var(--color-border)",
    paddingRight: "0.4rem",
    marginRight: "0.2rem",
    alignItems: "center",
  },
  toolbarBtn: {
    background: "transparent",
    border: "1px solid transparent",
    padding: "0.3rem 0.5rem",
    fontSize: "0.75rem",
    cursor: "pointer",
    borderRadius: "4px",
    color: "var(--color-text-dark)",
    fontWeight: 500,
    transition: "var(--transition-fast)",
  },
  langSelect: {
    padding: "0.25rem 0.4rem",
    fontSize: "0.72rem",
    borderRadius: "4px",
    border: "1px solid var(--color-border)",
    background: "#FFFFFF",
    color: "var(--color-text-dark)",
    fontWeight: 600,
    cursor: "pointer",
  },
  sandboxInsertBtn: {
    background: "rgba(198,154,91,0.12)",
    border: "1px solid var(--color-accent)",
    color: "var(--color-accent)",
    padding: "0.25rem 0.6rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    borderRadius: "4px",
    cursor: "pointer",
    transition: "var(--transition-fast)",
  },
  wordPaperSheet: {
    width: "100%",
    minHeight: "380px",
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    borderTop: "none",
    borderRadius: "0 0 6px 6px",
    padding: "1.8rem",
    fontSize: "1rem",
    lineHeight: "1.75",
    outline: "none",
    overflowY: "auto",
    fontFamily: "var(--font-sans)",
  },
  markdownHintBar: {
    backgroundColor: "#FAF7F2",
    border: "1px solid var(--color-border)",
    borderBottom: "none",
    padding: "0.6rem 1rem",
    borderRadius: "6px 6px 0 0",
    fontSize: "0.8rem",
    color: "#5A4D45",
  },
  markdownTextarea: {
    width: "100%",
    minHeight: "380px",
    backgroundColor: "#161B22",
    color: "#F0F6FC",
    border: "1px solid #30363D",
    borderTop: "none",
    borderRadius: "0 0 6px 6px",
    padding: "1.2rem",
    fontSize: "0.9rem",
    lineHeight: "1.6",
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    outline: "none",
    resize: "vertical",
  },
  previewBox: {
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    padding: "2rem",
    minHeight: "380px",
    borderRadius: "6px",
    overflowY: "auto",
  },
  errorAlert: {
    backgroundColor: "#FDF2F2",
    border: "1px solid #F8B4B4",
    color: "#9B1C1C",
    padding: "1rem",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  sectionHeader: {
    fontSize: "0.95rem",
    color: "var(--color-text-dark)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
    marginBottom: "0.2rem",
  },
  sectionSubtitle: {
    fontSize: "0.75rem",
    color: "var(--color-text-muted)",
    marginBottom: "1rem",
  },
  mediaContainer: {
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    padding: "1.5rem",
  },
  mediaPreviewContainer: {
    position: "relative",
    width: "100%",
  },
  mediaPreview: {
    width: "100%",
    height: "auto",
    maxHeight: "220px",
    objectFit: "cover",
    border: "1px solid var(--color-border)",
  },
  removeMediaBtn: {
    width: "100%",
    backgroundColor: "#FDF2F2",
    color: "#9B1C1C",
    border: "1px solid #F8B4B4",
    padding: "0.5rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    marginTop: "0.5rem",
    transition: "var(--transition-fast)",
  },
  insertMediaBtn: {
    width: "100%",
    backgroundColor: "#FAF7F2",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent)",
    padding: "0.5rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    marginTop: "0.5rem",
    transition: "var(--transition-fast)",
  },
  dropzone: {
    border: "2px dashed var(--color-border)",
    padding: "2.5rem 1rem",
    textAlign: "center",
    position: "relative",
    cursor: "pointer",
    transition: "var(--transition-smooth)",
    backgroundColor: "var(--color-bg-light)",
  },
  fileInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  dropzoneLabel: {
    cursor: "pointer",
    display: "block",
  },
  uploadIcon: {
    fontSize: "2rem",
    color: "var(--color-accent)",
    marginBottom: "0.5rem",
  },
  uploadText: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--color-text-dark)",
  },
  uploadHint: {
    fontSize: "0.7rem",
    color: "var(--color-text-muted)",
    marginTop: "0.4rem",
  },
  progressBarBg: {
    width: "100%",
    height: "4px",
    backgroundColor: "var(--color-bg-tan)",
    marginTop: "1.5rem",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "var(--color-accent)",
    transition: "width 0.2s ease",
  },
  publishContainer: {
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    padding: "1.5rem",
  },
  switchRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "2rem",
  },
  switchTextGroup: {
    display: "flex",
    flexDirection: "column",
  },
  switchMainLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--color-text-dark)",
  },
  switchSubLabel: {
    fontSize: "0.7rem",
    color: "var(--color-text-muted)",
  },
  actionsBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  saveBtn: {
    width: "100%",
    padding: "0.9rem",
    letterSpacing: "0.1em",
  },
  cancelBtn: {
    width: "100%",
    padding: "0.9rem",
    fontSize: "0.8rem",
    letterSpacing: "0.1em",
  },
  switch: {
    position: "relative",
    display: "inline-block",
    width: "44px",
    height: "24px",
    flexShrink: 0,
    cursor: "pointer",
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  switchSlider: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "var(--color-bg-tan)",
    borderRadius: "24px",
    transition: ".2s",
  },
  switchSliderActive: {
    backgroundColor: "var(--color-accent)",
  },
};
