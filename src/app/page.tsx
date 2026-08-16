import React from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, like, or, desc, sql } from "drizzle-orm";
import Footer from "@/app/components/Footer";

interface HomeProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    search?: string;
  }>;
}

export const revalidate = 0; // Fresh content on load

export default async function HomePage({ searchParams }: HomeProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");
  const type = resolvedParams.type || "all";
  const search = resolvedParams.search || "";
  const limit = 6;
  const offset = (page - 1) * limit;

  // 1. Build database query conditions
  const conditions = [eq(posts.published, true)];

  if (type !== "all") {
    conditions.push(eq(posts.type, type as "news" | "photo" | "video"));
  }

  if (search) {
    const searchFilter = or(
      like(posts.title, `%${search}%`),
      like(posts.summary, `%${search}%`)
    );
    if (searchFilter) {
      conditions.push(searchFilter);
    }
  }

  // 2. Query posts and count matching posts for pagination
  const matchingPosts = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(and(...conditions));

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // 3. Fetch overall counts for header stats
  const statCounts = await db
    .select({
      total: sql<number>`count(*)`,
      news: sql<number>`sum(case when type = 'news' then 1 else 0 end)`,
      photo: sql<number>`sum(case when type = 'photo' then 1 else 0 end)`,
      video: sql<number>`sum(case when type = 'video' then 1 else 0 end)`,
    })
    .from(posts)
    .where(eq(posts.published, true));

  const stats = {
    total: statCounts[0]?.total || 0,
    news: statCounts[0]?.news || 0,
    photo: statCounts[0]?.photo || 0,
    video: statCounts[0]?.video || 0,
  };

  return (
    <div style={styles.pageContainer} className="fade-in">
      {/* Top Banner (Zarnoor Jewels inspired) */}
      <div className="banner-top">
        <span>✦ KINETIC CODE LABS JOURNAL</span>
        <span>•</span>
        <span>OPEN-SOURCE INNOVATION</span>
        <span>•</span>
        <span>HIGH PERFORMANCE WEB DEVELOPMENT</span>
      </div>

      {/* Navbar (Zarnoor Jewels inspired) */}
      <header style={styles.header}>
        <div className="container" style={styles.headerContainer}>
          <div style={styles.headerLeft}>
            <Link href="/admin" style={styles.exploreLink}>
              <span style={styles.exploreMenu}></span>
              Workspace
            </Link>
          </div>

          <div style={styles.headerCenter}>
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Kinetic Code Labs Logo"
                width={180}
                height={55}
                style={styles.logo}
                priority
              />
            </Link>
          </div>

          <div style={styles.headerRight}>
            <span style={styles.memberTag}>PUBLIC FEED</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div className="container" style={styles.heroContainer}>
          <span style={styles.heroPreTitle}>GLOBAL CONTENT PORTAL</span>
          <h1 style={styles.heroTitle}>
            Trending Stories Across Tech, Entertainment, <br />
            <span style={styles.heroTitleItalic}>Bollywood, Education, and 100+ Influential Sectors.</span>
          </h1>
          <p style={{
            color: "var(--color-text-muted)",
            fontSize: "0.95rem",
            lineHeight: "1.6",
            maxWidth: "800px",
            margin: "1rem auto 0 auto",
            fontWeight: 300,
            textAlign: "center"
          }}>
            Explore our curated feed of news, photo stories, and video series. From cutting-edge software engineering and AI breakthroughs to Bollywood updates, Hollywood gossips, educational guides, and top-tier industry insights.
          </p>

          {/* Stats Bar (Zarnoor Jewels inspired) */}
          <div style={styles.statsBar}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>CURATED STORIES</div>
              <div style={styles.statVal}>{stats.total}</div>
              <div style={styles.statSubText}>Total articles published</div>
            </div>
            <div style={styles.statBoxDivider}></div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>NEWS & SHORTS</div>
              <div style={styles.statVal}>{stats.news}</div>
              <div style={styles.statSubText}>Updates and highlights</div>
            </div>
            <div style={styles.statBoxDivider}></div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>PHOTOGRAPHIC & VIDEO</div>
              <div style={styles.statVal}>{stats.photo + stats.video}</div>
              <div style={styles.statSubText}>Interactive media files</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feed Controls: Search & Filters */}
      <section style={styles.controlsSection}>
        <div className="container" style={styles.controlsContainer}>
          {/* Filters */}
          <div style={styles.filtersGroup}>
            <Link
              href={{ pathname: "/", query: { type: "all", search } }}
              style={{
                ...styles.filterTab,
                ...(type === "all" ? styles.filterTabActive : {}),
              }}
            >
              All Formats
            </Link>
            <Link
              href={{ pathname: "/", query: { type: "news", search } }}
              style={{
                ...styles.filterTab,
                ...(type === "news" ? styles.filterTabActive : {}),
              }}
            >
              News Feed
            </Link>
            <Link
              href={{ pathname: "/", query: { type: "photo", search } }}
              style={{
                ...styles.filterTab,
                ...(type === "photo" ? styles.filterTabActive : {}),
              }}
            >
              Photo Stories
            </Link>
            <Link
              href={{ pathname: "/", query: { type: "video", search } }}
              style={{
                ...styles.filterTab,
                ...(type === "video" ? styles.filterTabActive : {}),
              }}
            >
              Video Series
            </Link>
          </div>

          {/* Search form */}
          <form method="GET" action="/" style={styles.searchForm}>
            <input type="hidden" name="type" value={type} />
            <input
              type="text"
              name="search"
              placeholder="Search posts..."
              defaultValue={search}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Grid */}
      <main className="container" style={styles.mainFeed}>
        {matchingPosts.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No Stories Found</h3>
            <p>Try searching for a different keyword or resetting filters.</p>
            <Link href="/" className="btn-secondary" style={{ marginTop: "1.5rem" }}>
              Clear Filters
            </Link>
          </div>
        ) : (
          <div className="grid-container">
            {matchingPosts.map((post, index) => {
              const cardNum = (offset + index + 1).toString().padStart(2, "0");
              return (
                <article key={post.id} className="card" style={styles.card}>
                  {/* Card Index Badge */}
                  <span style={styles.cardCounter}>{cardNum}</span>

                  {/* Card Media (if photo/video and has URL) */}
                  {post.type !== "news" && post.mediaUrl ? (
                    <div style={styles.cardMediaBox}>
                      {post.type === "video" ? (
                        <div style={styles.videoThumbnailWrapper}>
                          <video
                            src={post.mediaUrl}
                            style={styles.cardImage}
                            muted
                            playsInline
                          />
                          <div style={styles.playOverlay}>
                            <span style={styles.playIcon}>▶</span>
                          </div>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          style={styles.cardImage}
                        />
                      )}
                    </div>
                  ) : (
                    // Default news aesthetic placeholder block
                    <div style={styles.newsAestheticBlock}>
                      <span style={styles.newsSymbol}>¶</span>
                    </div>
                  )}

                  {/* Card Content Info */}
                  <div style={styles.cardBody}>
                    <div style={styles.cardMetaRow}>
                      <span className={`badge badge-${post.type}`}>
                        {post.type}
                      </span>
                      <span style={styles.cardDate}>
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <h2 style={styles.cardTitle}>{post.title}</h2>
                    <p style={styles.cardExcerpt}>{post.summary}</p>

                    <Link href={`/blog/${post.slug}`} style={styles.readMoreLink}>
                      Read Article →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Block */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            {hasPrevPage ? (
              <Link
                href={{
                  pathname: "/",
                  query: { page: page - 1, type, search },
                }}
                className="btn-secondary"
                style={styles.pageBtn}
              >
                ← Previous Page
              </Link>
            ) : (
              <span style={{ ...styles.pageBtnDisabled, marginRight: "auto" }}>
                ← Previous Page
              </span>
            )}

            <span style={styles.pageIndicator}>
              Page {page} of {totalPages}
            </span>

            {hasNextPage ? (
              <Link
                href={{
                  pathname: "/",
                  query: { page: page + 1, type, search },
                }}
                className="btn-primary"
                style={styles.pageBtn}
              >
                Next Page →
              </Link>
            ) : (
              <span style={{ ...styles.pageBtnDisabled, marginLeft: "auto" }}>
                Next Page →
              </span>
            )}
          </div>
        )}
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
  },
  header: {
    backgroundColor: "var(--color-bg-light)",
    borderBottom: "1px solid var(--color-border)",
    padding: "1.2rem 0",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
  },
  exploreLink: {
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  exploreMenu: {
    display: "inline-block",
    width: "16px",
    height: "2px",
    backgroundColor: "var(--color-text-dark)",
    position: "relative",
    // Creates standard burger lines
    boxShadow: "0 -5px 0 var(--color-text-dark), 0 5px 0 var(--color-text-dark)",
  },
  headerCenter: {
    display: "flex",
    justifyContent: "center",
  },
  logo: {
    objectFit: "contain",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  memberTag: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent)",
    padding: "0.2rem 0.5rem",
    borderRadius: "2px",
  },
  heroSection: {
    padding: "4rem 0 3rem 0",
    borderBottom: "1px solid var(--color-border)",
  },
  heroContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  heroPreTitle: {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    marginBottom: "1rem",
  },
  heroTitle: {
    fontSize: "3rem",
    fontFamily: "var(--font-serif)",
    color: "var(--color-text-dark)",
    lineHeight: "1.15",
    fontWeight: "normal",
  },
  heroTitleItalic: {
    fontStyle: "italic",
    color: "var(--color-accent)",
  },
  statsBar: {
    display: "flex",
    width: "100%",
    maxWidth: "800px",
    backgroundColor: "#FAF7F2",
    border: "1px solid var(--color-border)",
    padding: "1.5rem",
    marginTop: "3rem",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    padding: "0 1rem",
  },
  statBoxDivider: {
    width: "1px",
    height: "50px",
    backgroundColor: "var(--color-border)",
  },
  statLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
  },
  statVal: {
    fontFamily: "var(--font-serif)",
    fontSize: "1.8rem",
    color: "var(--color-text-dark)",
    lineHeight: "1.2",
    margin: "0.2rem 0",
  },
  statSubText: {
    fontSize: "0.7rem",
    color: "var(--color-text-muted)",
    opacity: 0.8,
  },
  controlsSection: {
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "#FAF8F4",
  },
  controlsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "0.8rem",
    paddingBottom: "0.8rem",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  filtersGroup: {
    display: "flex",
    gap: "1.5rem",
  },
  filterTab: {
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "0.5rem 0",
    borderBottom: "2px solid transparent",
    color: "var(--color-text-muted)",
    transition: "var(--transition-fast)",
  },
  filterTabActive: {
    color: "var(--color-text-dark)",
    borderColor: "var(--color-accent)",
  },
  searchForm: {
    display: "flex",
    gap: "0.5rem",
  },
  searchInput: {
    padding: "0.5rem 0.8rem",
    border: "1px solid var(--color-border)",
    fontSize: "0.8rem",
    backgroundColor: "var(--color-white)",
    width: "200px",
  },
  searchBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--color-text-dark)",
    color: "var(--color-bg-light)",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
  },
  mainFeed: {
    paddingTop: "4rem",
    paddingBottom: "6rem",
    flexGrow: 1,
  },
  emptyState: {
    padding: "5rem 2rem",
    textAlign: "center",
    color: "var(--color-text-muted)",
  },
  emptyTitle: {
    fontSize: "1.8rem",
    fontFamily: "var(--font-serif)",
    color: "var(--color-text-dark)",
    marginBottom: "0.5rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  cardCounter: {
    position: "absolute",
    top: "1rem",
    right: "1.5rem",
    fontFamily: "var(--font-serif)",
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--color-border)",
    zIndex: 10,
  },
  cardMediaBox: {
    width: "100%",
    height: "220px",
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "var(--color-bg-dark)",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s ease",
  },
  videoThumbnailWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(35, 27, 24, 0.3)",
  },
  playIcon: {
    display: "inline-flex",
    width: "48px",
    height: "48px",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--color-bg-light)",
    color: "var(--color-text-dark)",
    borderRadius: "50%",
    fontSize: "0.9rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    paddingLeft: "4px", // Align triangle
  },
  newsAestheticBlock: {
    width: "100%",
    height: "180px",
    backgroundColor: "#FAF7F2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid var(--color-border)",
  },
  newsSymbol: {
    fontFamily: "var(--font-serif)",
    fontSize: "4rem",
    color: "var(--color-border)",
  },
  cardBody: {
    padding: "1.8rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  cardMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  cardDate: {
    fontSize: "0.75rem",
    color: "var(--color-text-muted)",
    fontWeight: 500,
  },
  cardTitle: {
    fontSize: "1.4rem",
    color: "var(--color-text-dark)",
    lineHeight: "1.25",
    marginBottom: "0.8rem",
    fontWeight: "normal",
  },
  cardExcerpt: {
    fontSize: "0.85rem",
    color: "var(--color-text-muted)",
    lineHeight: "1.6",
    marginBottom: "1.5rem",
    flexGrow: 1,
  },
  readMoreLink: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--color-text-dark)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginTop: "auto",
    borderBottom: "1px solid transparent",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4rem",
    borderTop: "1px solid var(--color-border)",
    paddingTop: "2rem",
  },
  pageBtn: {
    fontSize: "0.75rem",
    padding: "0.6rem 1.2rem",
    minWidth: "150px",
    textAlign: "center",
  },
  pageBtnDisabled: {
    fontSize: "0.75rem",
    padding: "0.6rem 1.2rem",
    minWidth: "150px",
    textAlign: "center",
    color: "var(--color-text-muted)",
    backgroundColor: "transparent",
    border: "1px solid var(--color-border)",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  pageIndicator: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--color-text-dark)",
  },
  footer: {
    backgroundColor: "var(--color-bg-dark)",
    color: "var(--color-bg-light)",
    padding: "3.5rem 0",
    borderTop: "1px solid var(--color-border-dark)",
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
