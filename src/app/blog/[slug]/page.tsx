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
import { optimizeCloudinaryUrl } from "@/lib/media";
import SidebarNewsletter from "@/app/components/SidebarNewsletter";

interface BlogDetailsProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Fresh content on load

interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

// Extract headings for dynamic Table of Contents
function extractHeadings(content: string): HeadingItem[] {
  if (!content) return [];
  const headings: HeadingItem[] = [];
  const seenIds = new Set<string>();

  // 1. Match HTML headings: <h2>...</h2> and <h3>...</h3>
  const htmlHeadingRegex = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  
  while ((match = htmlHeadingRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    const level = tag === "h2" ? 2 : 3;
    const text = match[3].replace(/<[^>]*>/g, "").trim();
    if (text) {
      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      if (!seenIds.has(id)) {
        seenIds.add(id);
        headings.push({ text, level, id });
      }
    }
  }

  if (headings.length > 0) return headings;

  // 2. Fallback to Markdown headings: ## and ###
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      const level = trimmed.startsWith("## ") ? 2 : 3;
      const text = level === 2 ? trimmed.slice(3).trim() : trimmed.slice(4).trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      if (text && !seenIds.has(id)) {
        seenIds.add(id);
        headings.push({ text, level, id });
      }
    }
  }

  return headings;
}

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

export default async function BlogDetailsPage({ params }: BlogDetailsProps) {
  const { slug } = await params;

  // Retrieve post details from the database
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
  });

  if (!post || !post.published) {
    notFound();
  }

  // Increment views on server render
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

  const headings = extractHeadings(post.content);

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

      {/* Main Post Container (Two-column Grid Layout) */}
      <main className="container editorial-layout" style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}>
        {/* Left Column: Article Body */}
        <div className="editorial-main">
          {/* Post Metadata Header */}
          <section style={styles.postMetaHeader}>
            <div style={styles.metaRow}>
              <span style={styles.metaText}>{formattedDate}</span>
              <span style={styles.metaDivider}>•</span>
              <span style={styles.metaText}>{post.views} views</span>
            </div>

            <h1 className="post-title-fluid">{post.title}</h1>
            <p style={styles.postSummary}>{post.summary}</p>
            
            {/* Hashtag tags list */}
            <div style={styles.pillsRow}>
              <span className="badge badge-news" style={styles.pill}>#{post.type}</span>
              <span className="badge badge-photo" style={styles.pill}>#global-insights</span>
              <span className="badge badge-video" style={styles.pill}>#trending</span>
            </div>
          </section>

          {/* Media Block (Photos / Videos) */}
          {post.type !== "news" && post.mediaUrl && (
            <section style={styles.mediaSection}>
              {post.type === "video" ? (
                <video
                  src={optimizeCloudinaryUrl(post.mediaUrl)}
                  controls
                  style={styles.videoPlayer}
                  className="card"
                />
              ) : (
                <div style={styles.imageWrapper} className="card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizeCloudinaryUrl(post.mediaUrl)}
                    alt={post.title}
                    style={styles.articleImage}
                  />
                </div>
              )}
            </section>
          )}

          {/* Table of Contents Widget */}
          {headings.length > 0 && (
            <div style={styles.tocBox} className="card">
              <h4 style={styles.tocTitle}>Table of Contents</h4>
              <ul style={styles.tocList}>
                {headings.map((h, i) => (
                  <li 
                    key={i} 
                    style={{ 
                      ...styles.tocItem, 
                      borderLeft: h.level === 2 ? "1.5px solid var(--color-border)" : "none",
                      paddingLeft: h.level === 2 ? "0.6rem" : "1.2rem"
                    }}
                  >
                    <a href={`#${h.id}`} style={styles.tocLink}>
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Body */}
          <section style={styles.contentSection}>
            <MDContent content={post.content} />
          </section>
        </div>

        {/* Right Column: Sticky Sidebar Widgets */}
        <aside className="editorial-sidebar">
          {/* Sidebar Newsletter card */}
          <SidebarNewsletter />

          {/* Sidebar Recommended Stories Widget */}
          {relatedPosts.length > 0 && (
            <div style={styles.sidebarRelSection}>
              <h4 style={styles.sidebarRelHeader}>RECOMMENDED READS</h4>
              <div style={styles.sidebarRelList}>
                {relatedPosts.map((relPost) => (
                  <Link
                    key={relPost.id}
                    href={`/blog/${relPost.slug}`}
                    className="sidebar-rel-card"
                  >
                    <div className="sidebar-rel-media">
                      {relPost.type !== "news" && relPost.mediaUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={optimizeCloudinaryUrl(relPost.mediaUrl)}
                          alt={relPost.title}
                          className="sidebar-rel-img"
                        />
                      ) : (
                        <div className="sidebar-rel-placeholder">
                          <span>¶</span>
                        </div>
                      )}
                    </div>
                    <div className="sidebar-rel-info">
                      <span className="sidebar-rel-date">
                        {new Date(relPost.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <h3 className="sidebar-rel-title">{relPost.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

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
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  postMetaHeader: {
    marginBottom: "2rem",
    width: "100%",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "1rem",
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
  postSummary: {
    fontSize: "1.1rem",
    lineHeight: "1.6",
    fontStyle: "italic",
    color: "var(--color-text-muted)",
    borderLeft: "2px solid var(--color-accent)",
    paddingLeft: "1rem",
    margin: "1.2rem 0",
  },
  pillsRow: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
    marginTop: "1rem",
  },
  pill: {
    fontSize: "0.65rem",
    padding: "0.2rem 0.5rem",
  },
  mediaSection: {
    width: "100%",
    marginBottom: "2.5rem",
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
  tocBox: {
    padding: "1.2rem 1.4rem",
    backgroundColor: "var(--color-white)",
    marginBottom: "2.5rem",
    borderRadius: "4px",
  },
  tocTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "0.8rem",
    color: "var(--color-text-dark)",
  },
  tocList: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  tocItem: {
    fontSize: "0.88rem",
  },
  tocLink: {
    color: "var(--color-text-muted)",
    textDecoration: "none",
    transition: "color 0.15s",
  },
  contentSection: {
    marginBottom: "3.5rem",
    width: "100%",
    maxWidth: "100%",
  },
  sidebarRelSection: {
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    padding: "1.2rem",
    borderRadius: "4px",
  },
  sidebarRelHeader: {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--color-text-dark)",
    marginBottom: "1rem",
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "0.4rem",
  },
  sidebarRelList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
};
