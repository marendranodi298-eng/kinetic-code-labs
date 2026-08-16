"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { createBlogPost, updateBlogPost } from "../../actions/blog";
import { Post } from "@/db";

interface PostEditorProps {
  post?: Post; // If provided, we are in Edit Mode
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

  // Cloudinary media states
  const [mediaUrl, setMediaUrl] = useState(post?.mediaUrl || "");
  const [mediaPublicId, setMediaPublicId] = useState(post?.mediaPublicId || "");
  const [mediaType, setMediaType] = useState(post?.mediaType || "");
  const [mediaWidth, setMediaWidth] = useState<number | null>(post?.mediaWidth || null);
  const [mediaHeight, setMediaHeight] = useState<number | null>(post?.mediaHeight || null);

  // File upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Editor layout tab: "write" or "preview"
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");

  const editorRef = React.useRef<HTMLDivElement>(null);

  // Sync content with editable paper sheet on load and tab toggle
  React.useEffect(() => {
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

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerHTML);
  };

  // Handle file selection and direct signed upload to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation based on selected type
    if (type === "photo" && !file.type.startsWith("image/")) {
      setError("Please upload an image file for photo posts.");
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      setError("Please upload a video file for video posts.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get secure signature from API
      const sigResponse = await fetch("/api/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "kinetic_code_labs" }),
      });

      if (!sigResponse.ok) {
        throw new Error("Failed to authenticate upload signature request.");
      }

      const sigData = await sigResponse.json();

      if (sigData.isMock) {
        // Fallback for local-only mock testing if Cloudinary is not configured
        setUploadProgress(50);
        setTimeout(() => {
          setMediaUrl(URL.createObjectURL(file)); // local preview object URL
          setMediaPublicId(`mock_${Date.now()}`);
          setMediaType(file.type);
          setUploadProgress(100);
          setIsUploading(false);
          alert("Simulation: File upload completed successfully. Set Cloudinary credentials to save live assets.");
        }, 1000);
        return;
      }

      // 2. Upload file directly to Cloudinary
      const resourceType = type === "video" ? "video" : "image";
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${resourceType}/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", sigData.timestamp.toString());
      formData.append("signature", sigData.signature);
      formData.append("folder", sigData.folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", cloudinaryUrl, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setMediaUrl(response.secure_url);
          setMediaPublicId(response.public_id);
          setMediaType(response.resource_type + "/" + response.format);
          setMediaWidth(response.width);
          setMediaHeight(response.height);
          setIsUploading(false);
          setUploadProgress(null);
        } else {
          setError(`Upload failed: ${xhr.statusText}`);
          setIsUploading(false);
          setUploadProgress(null);
        }
      };

      xhr.onerror = () => {
        setError("Network error during upload.");
        setIsUploading(false);
        setUploadProgress(null);
      };

      xhr.send(formData);
    } catch (err: any) {
      setError(err.message || "File upload failed.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveMedia = () => {
    setMediaUrl("");
    setMediaPublicId("");
    setMediaType("");
    setMediaWidth(null);
    setMediaHeight(null);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (type !== "news" && !mediaUrl) {
      setError(`Media upload is required for ${type} posts.`);
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("type", type);
    formData.append("summary", summary);
    formData.append("content", content);
    formData.append("published", published.toString());

    // Only append media fields if present
    if (mediaUrl) {
      formData.append("mediaUrl", mediaUrl);
      formData.append("mediaPublicId", mediaPublicId);
      formData.append("mediaType", mediaType);
      if (mediaWidth) formData.append("mediaWidth", mediaWidth.toString());
      if (mediaHeight) formData.append("mediaHeight", mediaHeight.toString());
    } else {
      // Send blank media fields in edit mode to flag deletion
      formData.append("mediaUrl", "");
      formData.append("mediaPublicId", "");
      formData.append("mediaType", "");
    }

    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateBlogPost(post.id, formData);
        } else {
          await createBlogPost(formData);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong while saving the post.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.formContainer}>
      {error && <div style={styles.errorAlert}>{error}</div>}

      <div style={styles.flexLayout}>
        {/* Left Side: Fields */}
        <div style={styles.leftFields}>
          {/* Post Title */}
          <div className="form-group">
            <label htmlFor="post-title">Blog Title</label>
            <input
              id="post-title"
              type="text"
              required
              placeholder="e.g. 10 Next.js Hacks Every Developer Must Know"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Format Type */}
          <div className="form-group">
            <label htmlFor="post-type">Blog Format</label>
            <select
              id="post-type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="form-input"
              style={styles.select}
            >
              <option value="news">News / Rich Text</option>
              <option value="photo">Photo Post</option>
              <option value="video">Video Post</option>
            </select>
          </div>

          {/* Excerpt Summary */}
          <div className="form-group">
            <label htmlFor="post-summary">Card Excerpt (Summary)</label>
            <textarea
              id="post-summary"
              required
              rows={3}
              placeholder="Write a brief, catchy summary for the homepage cards..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="form-input"
              style={styles.textarea}
            />
          </div>

          {/* MS Word-style WYSIWYG Ribbon Rich Editor */}
          <div className="form-group" style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div style={styles.editorHeader}>
              <label style={{ margin: 0, fontWeight: 700 }}>Main Article Editor (Rich Text &amp; LaTeX)</label>
              <div style={styles.editorTabs}>
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  style={{
                    ...styles.tabBtn,
                    ...(editorTab === "write" ? styles.tabBtnActive : {}),
                  }}
                >
                  Document Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  style={{
                    ...styles.tabBtn,
                    ...(editorTab === "preview" ? styles.tabBtnActive : {}),
                  }}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {editorTab === "write" ? (
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                {/* Word Ribbon Toolbar */}
                <div style={styles.editorToolbar}>
                  {/* Font Format Group */}
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

                  {/* Alignments Group */}
                  <div style={styles.toolbarGroup}>
                    <button type="button" onClick={() => execCmd("justifyLeft")} title="Align Left" style={styles.toolbarBtn}>Left</button>
                    <button type="button" onClick={() => execCmd("justifyCenter")} title="Align Center" style={styles.toolbarBtn}>Center</button>
                    <button type="button" onClick={() => execCmd("justifyRight")} title="Align Right" style={styles.toolbarBtn}>Right</button>
                  </div>

                  {/* Insert Complex Elements Group */}
                  <div style={styles.toolbarGroup}>
                    <button 
                      type="button" 
                      onClick={() => execCmd("insertHTML", "<pre><code>\n// Write JavaScript Code here\nconsole.log('Sandbox executing...');\n</code></pre>")} 
                      title="Insert Code Terminal Sandbox" 
                      style={{ ...styles.toolbarBtn, color: "var(--color-accent)", fontWeight: 700 }}
                    >
                      ⚡ Sandbox
                    </button>
                    <button 
                      type="button" 
                      onClick={() => execCmd("insertHTML", "$$ E = m c^2 $$")} 
                      title="Insert LaTeX Math Equation" 
                      style={{ ...styles.toolbarBtn, color: "var(--color-accent)", fontWeight: 700 }}
                    >
                      Σ LaTeX
                    </button>
                    <button 
                      type="button" 
                      onClick={() => execCmd("insertHTML", "<table border='1' style='width:100%; border-collapse:collapse; margin:1rem 0;'><tr style='background:rgba(0,0,0,0.03);'><th style='padding:6px;'>Header 1</th><th style='padding:6px;'>Header 2</th></tr><tr><td style='padding:6px;'>Data 1</td><td style='padding:6px;'>Data 2</td></tr></table>")} 
                      title="Insert Grid Table" 
                      style={styles.toolbarBtn}
                    >
                      Grid Table
                    </button>
                    <button type="button" onClick={() => execCmd("insertHorizontalRule")} title="Horizontal Line" style={styles.toolbarBtn}>Line</button>
                  </div>

                  {/* Actions Group */}
                  <div style={styles.toolbarGroup}>
                    <button type="button" onClick={() => execCmd("removeFormat")} title="Clear Formatting" style={styles.toolbarBtn}>Clear</button>
                    <button type="button" onClick={() => execCmd("undo")} title="Undo" style={styles.toolbarBtn}>↶</button>
                    <button type="button" onClick={() => execCmd("redo")} title="Redo" style={styles.toolbarBtn}>↷</button>
                  </div>
                </div>

                {/* MS Word Paper Sheet Editable Container */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  style={styles.wordPaperSheet}
                  className="form-input"
                  data-placeholder="Start typing your rich text article here... Use the toolbar ribbon above to design layouts, create code terminals, insert LaTeX equations, or copy-paste directly from Microsoft Word."
                />
              </div>
            ) : (
              <div style={styles.previewBox}>
                {content ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: content }} 
                    style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#2C221D" }}
                  />
                ) : (
                  <p style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Media Uploader & Publication */}
        <div style={styles.rightUploader}>
          {/* Media Section */}
          {type !== "news" && (
            <div style={styles.mediaContainer}>
              <h3 style={styles.sectionHeader}>Media Asset</h3>
              <p style={styles.sectionSubtitle}>
                Upload a high-quality {type === "video" ? "video" : "image"}. Delivering optimized streams via Cloudinary.
              </p>

              {mediaUrl ? (
                <div style={styles.mediaPreviewContainer}>
                  {type === "video" ? (
                    <video src={mediaUrl} controls style={styles.mediaPreview} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl} alt="Upload preview" style={styles.mediaPreview} />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    style={styles.removeMediaBtn}
                  >
                    × Remove Asset
                  </button>
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
                    : "Draft - Only viewable in workspace"}
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
    marginBottom: "0.5rem",
  },
  editorTabs: {
    display: "flex",
    border: "1px solid var(--color-border)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  tabBtn: {
    padding: "0.3rem 0.8rem",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    border: "none",
    background: "var(--color-bg-light)",
    color: "var(--color-text-muted)",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "var(--color-text-dark)",
    color: "var(--color-bg-light)",
  },
  previewBox: {
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    padding: "1.5rem",
    minHeight: "280px",
    overflowY: "auto",
  },
  markdownPreview: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  pHeading1: {
    fontSize: "1.8rem",
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "0.4rem",
    color: "var(--color-text-dark)",
  },
  pHeading2: {
    fontSize: "1.4rem",
    color: "var(--color-text-dark)",
  },
  pHeading3: {
    fontSize: "1.1rem",
    color: "var(--color-text-dark)",
  },
  pParagraph: {
    fontSize: "0.95rem",
    lineHeight: "1.6",
  },
  pListItem: {
    marginLeft: "1.5rem",
    fontSize: "0.95rem",
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
    fontSize: "1rem",
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
  // Custom switch styles
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
  editorToolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
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
  wordPaperSheet: {
    width: "100%",
    minHeight: "350px",
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    borderTop: "none",
    borderRadius: "0 0 6px 6px",
    padding: "1.5rem",
    fontSize: "0.95rem",
    lineHeight: "1.6",
    outline: "none",
    overflowY: "auto",
    fontFamily: "var(--font-sans)",
  },
};
