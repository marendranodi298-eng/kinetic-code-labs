import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { incrementPostViews } from "../../actions/blog";
import { Metadata } from "next";
import Footer from "@/app/components/Footer";
import MDContent from "@/app/components/MDContent";
import Script from "next/script";

interface BlogDetailsProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Fresh content on load

// Dynamic SEO Metadata Generation
export async function generateMetadata({
  params,
}: BlogDetailsProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
  });

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      images: post.mediaUrl ? [{ url: post.mediaUrl }] : [],
    },
  };
}

// Custom Markdown to HTML Converter for safe rendering
function renderMarkdownToHtml(markdown: string): string {
  // Prevent XSS while allowing basic formatting
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic *text* -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Links [text](url) -> <a href="url" target="_blank" rel="noopener" class="md-link">text</a>
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener" style="color:var(--color-accent);text-decoration:underline;">$1</a>'
  );

  const lines = html.split("\n");
  let inList = false;
  let result = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        result += '<ul style="margin-left:1.5rem;margin-bottom:1rem;display:flex;flex-direction:column;gap:0.4rem;">';
        inList = true;
      }
      result += `<li>${trimmed.slice(2)}</li>`;
    } else {
      if (inList) {
        result += "</ul>";
        inList = false;
      }

      if (trimmed.startsWith("### ")) {
        result += `<h3 style="font-size:1.2rem;margin-top:1.8rem;margin-bottom:0.8rem;font-family:var(--font-sans);font-weight:700;">${trimmed.slice(4)}</h3>`;
      } else if (trimmed.startsWith("## ")) {
        result += `<h2 style="font-size:1.6rem;margin-top:2.2rem;margin-bottom:1rem;font-family:var(--font-serif);color:var(--color-text-dark);">${trimmed.slice(3)}</h2>`;
      } else if (trimmed.startsWith("# ")) {
        result += `<h1 style="font-size:2rem;margin-top:2.5rem;margin-bottom:1.2rem;font-family:var(--font-serif);color:var(--color-text-dark);border-bottom:1px solid var(--color-border);padding-bottom:0.5rem;">${trimmed.slice(2)}</h1>`;
      } else if (trimmed === "") {
        result += '<div style="height:0.8rem;"></div>';
      } else {
        result += `<p style="font-size:1rem;line-height:1.75;margin-bottom:1.2rem;color:#2C221D;">${trimmed}</p>`;
      }
    }
  }

  if (inList) {
    result += "</ul>";
  }

  return result;
}

export default async function BlogDetailsPage({ params }: BlogDetailsProps) {
  const { slug } = await params;

  // Retrieve post details from the database
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
  });

  if (!post || !post.published) {
    notFound();
  }

  // Increment views on server render (non-blocking)
  incrementPostViews(post.id);

  // Fetch related posts (same format, up to 3 posts, excluding current post)
  const relatedPosts = await db
    .select()
    .from(posts)
    .where(and(eq(posts.published, true), eq(posts.type, post.type), ne(posts.id, post.id)))
    .orderBy(desc(posts.createdAt))
    .limit(3);

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bodyHtml = renderMarkdownToHtml(post.content);

  return (
    <div style={styles.pageContainer} className="fade-in">
      {/* Top Banner */}
      <div className="banner-top">
        <span>✦ JOURNAL ARTICLE</span>
        <span>•</span>
        <span>KINETIC CODE LABS READS</span>
      </div>

      {/* Responsive Navbar */}
      <header className="nav-header">
        <div className="container nav-container">
          <div className="nav-left">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Kinetic Code Labs Logo"
                width={140}
                height={45}
                className="nav-logo-img"
                priority
              />
            </Link>
          </div>
          <div className="nav-right">
            <Link href="/" className="nav-explore-link">
              ← <span className="nav-explore-link-text">Back to </span>Feed
            </Link>
          </div>
        </div>
      </header>

      {/* Main Post Container */}
      <main className="container" style={styles.main}>
        {/* Post Metadata Header */}
        <section style={styles.postMetaHeader}>
          <div style={styles.metaRow}>
            <span className={`badge badge-${post.type}`}>{post.type}</span>
            <span style={styles.metaDivider}>•</span>
            <span style={styles.metaText}>{formattedDate}</span>
            <span style={styles.metaDivider}>•</span>
            <span style={styles.metaText}>{post.views} views</span>
          </div>

          <h1 style={styles.postTitle}>{post.title}</h1>
          <p style={styles.postSummary}>{post.summary}</p>
        </section>

        {/* Media Block (Photos / Videos) */}
        {post.type !== "news" && post.mediaUrl && (
          <section style={styles.mediaSection}>
            {post.type === "video" ? (
              <video
                src={post.mediaUrl}
                controls
                style={styles.videoPlayer}
                className="card"
              />
            ) : (
              <div style={styles.imageWrapper} className="card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.mediaUrl}
                  alt={post.title}
                  style={styles.articleImage}
                />
              </div>
            )}
          </section>
        )}

        {/* Content Body (Supporting MathJax LaTeX and Coding Sandbox) */}
        <section style={styles.contentSection}>
          <MDContent content={post.content} />
        </section>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section style={styles.relatedSection}>
            <h2 style={styles.relatedTitle}>Related {post.type === "news" ? "News" : post.type === "photo" ? "Photos" : "Videos"}</h2>
            <div style={styles.relatedDivider}></div>
            <div style={styles.relatedGrid}>
              {relatedPosts.map((relPost) => (
                <Link
                  key={relPost.id}
                  href={`/blog/${relPost.slug}`}
                  style={styles.relatedCard}
                  className="card"
                >
                  {relPost.type !== "news" && relPost.mediaUrl ? (
                    <div style={styles.relatedCardMedia}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={relPost.mediaUrl}
                        alt={relPost.title}
                        style={styles.relatedCardImage}
                      />
                    </div>
                  ) : (
                    <div style={styles.relatedNewsPlaceholder}>
                      <span>¶</span>
                    </div>
                  )}
                  <div style={styles.relatedCardBody}>
                    <span style={styles.relatedCardDate}>
                      {new Date(relPost.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <h3 style={styles.relatedCardTitle}>{relPost.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Load MathJax asynchronously for LaTeX calculations */}
      <Script
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="afterInteractive"
      />

      {/* Extracted Premium Footer */}
      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "var(--color-bg-light)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "var(--color-bg-light)",
    borderBottom: "1px solid var(--color-border)",
    padding: "1rem 0",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    objectFit: "contain",
  },
  backBtn: {
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--color-text-dark)",
  },
  main: {
    flexGrow: 1,
    paddingTop: "3.5rem",
    paddingBottom: "6rem",
    maxWidth: "800px", // Centered narrow article reader width
  },
  postMetaHeader: {
    marginBottom: "2.5rem",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "1.2rem",
    flexWrap: "wrap",
  },
  metaDivider: {
    color: "var(--color-border)",
  },
  metaText: {
    fontSize: "0.8rem",
    color: "var(--color-text-muted)",
    fontWeight: 500,
  },
  postTitle: {
    fontSize: "3.2rem",
    fontFamily: "var(--font-serif)",
    color: "var(--color-text-dark)",
    lineHeight: "1.1",
    fontWeight: "normal",
    marginBottom: "1rem",
  },
  postSummary: {
    fontSize: "1.15rem",
    lineHeight: "1.6",
    fontStyle: "italic",
    color: "var(--color-text-muted)",
    borderLeft: "2px solid var(--color-accent)",
    paddingLeft: "1.2rem",
    margin: "1.5rem 0",
  },
  mediaSection: {
    width: "100%",
    marginBottom: "3rem",
  },
  videoPlayer: {
    width: "100%",
    maxHeight: "450px",
    backgroundColor: "var(--color-bg-dark)",
    outline: "none",
  },
  imageWrapper: {
    width: "100%",
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: "auto",
    maxHeight: "500px",
    objectFit: "cover",
    display: "block",
  },
  contentSection: {
    marginBottom: "5rem",
  },
  contentBody: {
    fontSize: "1.05rem",
    lineHeight: "1.8",
  },
  relatedSection: {
    borderTop: "1px solid var(--color-border)",
    paddingTop: "3rem",
    marginTop: "4rem",
  },
  relatedTitle: {
    fontSize: "1.8rem",
    fontFamily: "var(--font-serif)",
    color: "var(--color-text-dark)",
    marginBottom: "0.5rem",
  },
  relatedDivider: {
    width: "40px",
    height: "2px",
    backgroundColor: "var(--color-accent)",
    marginBottom: "2rem",
  },
  relatedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem",
  },
  relatedCard: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    transition: "var(--transition-smooth)",
  },
  relatedCardMedia: {
    width: "100%",
    height: "140px",
    overflow: "hidden",
    borderBottom: "1px solid var(--color-border)",
  },
  relatedCardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease",
  },
  relatedNewsPlaceholder: {
    width: "100%",
    height: "120px",
    backgroundColor: "#FAF7F2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.5rem",
    color: "var(--color-border)",
    fontFamily: "var(--font-serif)",
    borderBottom: "1px solid var(--color-border)",
  },
  relatedCardBody: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  relatedCardDate: {
    fontSize: "0.7rem",
    color: "var(--color-text-muted)",
    marginBottom: "0.4rem",
  },
  relatedCardTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--color-text-dark)",
    lineHeight: "1.35",
    // Line clamping
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  footer: {
    backgroundColor: "var(--color-bg-dark)",
    color: "var(--color-bg-light)",
    padding: "3.5rem 0",
    borderTop: "1px solid var(--color-border-dark)",
    marginTop: "auto",
  },
  footerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "1.5rem",
  },
  footerLogo: {
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
  },
  footerText: {
    fontSize: "0.8rem",
    color: "var(--color-bg-tan)",
    opacity: 0.7,
    maxWidth: "400px",
  },
  footerLinks: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.8rem",
    color: "var(--color-bg-tan)",
  },
  footerLink: {
    transition: "var(--transition-fast)",
  },
};
