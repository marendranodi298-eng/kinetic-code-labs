import React from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, like, or, desc, sql } from "drizzle-orm";
import Footer from "@/app/components/Footer";
import { optimizeCloudinaryUrl } from "@/lib/media";

interface HomeProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    search?: string;
  }>;
}

export const revalidate = 0; // Fresh content on load

// Top 50 High-Search Global Tech & Science Categories
const TOP_50_CATEGORIES = [
  "Artificial Intelligence", "WebGL 3D Physics", "Astrophysics", "Quantum Computing",
  "Machine Learning", "Robotics", "Mechanical CAD", "Cybersecurity",
  "Cloud Architecture", "Biotechnology", "DNA Transcription", "Aerospace Flight",
  "Thermodynamics", "Full-Stack Web", "Next.js 15", "Neuroscience",
  "Electric Vehicles", "Clean Energy & Fusion", "Mathematics", "Nanotechnology",
  "Autonomous Systems", "Data Science", "DevOps & CI/CD", "Computer Vision",
  "Game Engines", "FinTech & Cryptography", "Semiconductors", "Mobile Apps",
  "Cellular Biology", "Space Exploration", "Generative AI", "Particle Physics",
  "Materials Science", "Rocket Escape Velocity", "Industrial Automation", "Supercomputing",
  "Distributed Systems", "Fluid Dynamics", "Deep Tech", "Augmented Reality",
  "API Architecture", "Database Optimization", "Compiler Design", "Biomedical Tech",
  "Edge Computing", "Simulation Labs", "Career Guides", "Global Innovation",
  "Scientific Papers", "Technical Education"
];

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

  // Structured Data Schema for Google SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.kineticcodelabs.in/#organization",
        "name": "Kinetic Code Labs",
        "legalName": "Kinetic Code Labs",
        "alternateName": ["Kinetic Code Labs India", "Kinetic Code Labs Kanpur"],
        "url": "https://www.kineticcodelabs.in/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.kineticcodelabs.in/logo.png"
        },
        "foundingDate": "2026-05",
        "description": "Kinetic Code Labs is a premier custom software engineering and IT services agency headquartered in Kanpur, Uttar Pradesh, India, founded by Ajeet Prakash Yadav. We deliver 18+ specialized digital engineering services including custom website development without templates, Full Stack MERN web applications, Artificial Intelligence chatbots and intelligent automation workflows, Python backend servers, business ERP and inventory software, zero-cost sales analytics dashboards, VPS cloud hosting setup, e-commerce online stores with payment gateways, UI/UX design, and Programmatic SEO (pSEO) to local Indian small businesses and global technology clients. We maintain the Kinetic Code Journal, offer the AI Vision Readiness Tool, ensure 100/100 Lighthouse Performance Scores on all web applications, and conduct an intensive 12-week AI & Software Engineering Internship program.",
        "knowsAbout": [
          "Custom Website Development without Templates",
          "Full Stack MERN Web Applications (React, Node.js, MongoDB)",
          "Artificial Intelligence (AI) Chatbot Systems",
          "Machine Learning (ML) & Predictive Analytics",
          "Python Engineering & Automation (FastAPI, Flask)",
          "Large Language Models (LLM) & RAG Vector Databases",
          "Custom ERP & Business Management Software",
          "Zero-Cost Data Analytics & Admin Dashboards",
          "Cloud VPS Server Deployment & DevOps (AWS, Render, Vercel)",
          "E-Commerce Online Stores & Secure Payment Gateways",
          "Responsive UI/UX Design & Landing Pages",
          "Programmatic SEO (pSEO) & Organic Google Ranking",
          "WhatsApp Business API Bots & Custom Integrations",
          "12-Week Production Software & AI Mentorship in Kanpur"
        ],
        "areaServed": [
          { "@type": "City", "name": "Kanpur" },
          { "@type": "AdministrativeArea", "name": "Uttar Pradesh" },
          { "@type": "Country", "name": "India" },
          { "@type": "Country", "name": "USA" },
          { "@type": "Country", "name": "UK" },
          { "@type": "Country", "name": "Germany" },
          { "@type": "Country", "name": "Japan" },
          { "@type": "Country", "name": "Australia" },
          { "@type": "Country", "name": "Canada" },
          { "@type": "Country", "name": "UAE" }
        ],
        "sameAs": [
          "https://www.instagram.com/kineticcodelabs_",
          "https://www.linkedin.com/in/kinetic-code-labs-132b77412",
          "https://x.com/yadavajit_spy",
          "https://github.com/kineticscodelabs-ux",
          "https://github.com/kineticscodelabs-ux/kineticscodelabs-ux",
          "https://www.justdial.com/Kanpur/Kinetic-Code-Labs-Yashoda-Nagar/0512PX512-X512-260513011900-W1I3_BZDET",
          "https://www.kineticcodelabs.in/about",
          "https://www.kineticcodelabs.in/instalinks",
          "https://www.kineticcodelabs.in/blogs",
          "https://www.kineticcodelabs.in/work",
          "mailto:connect@kineticcodelabs.in"
        ],
        "founder": {
          "@id": "https://www.kineticcodelabs.in/#founder"
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "sales",
            "telephone": "+91-90269-26680",
            "email": "connect@kineticcodelabs.in",
            "availableLanguage": ["en", "hi"]
          }
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Yashoda Nagar",
          "addressLocality": "Kanpur",
          "addressRegion": "Uttar Pradesh",
          "postalCode": "208011",
          "addressCountry": "IN"
        }
      },
      {
        "@type": "Person",
        "@id": "https://www.kineticcodelabs.in/#founder",
        "name": "Ajeet Prakash Yadav",
        "alternateName": ["Ajit Prakash Yadav", "Ajeet Yadav", "Ajit Yadav", "Founder Kinetic Code Labs Kanpur"],
        "jobTitle": "Founder, Managing Director & Chief Software Architect",
        "description": "Ajeet Prakash Yadav is an Indian software engineer, MERN stack architect, Artificial Intelligence developer, and tech entrepreneur in Kanpur, Uttar Pradesh. Holding a Bachelor of Technology (B.Tech) in Mechanical Engineering, he merges mechanical engineering precision, logical problem-solving, and strict system reliability into software architecture. He designs and develops crash-proof, sub-100ms web applications and AI tools from scratch without relying on generic templates.",
        "alumniOf": { "@type": "EducationalOrganization", "name": "Bachelor of Technology in Mechanical Engineering" },
        "knowsAbout": [
          "Ajeet Prakash Yadav",
          "Kinetic Code Labs Founder",
          "Web Development Kanpur",
          "Custom Software Development without Templates",
          "Full Stack MERN Architecture (MongoDB, Express, React, Node.js)",
          "Artificial Intelligence (AI) Tools & Custom Chatbot Integration",
          "Python Engineering & Machine Learning (ML)",
          "Large Language Models (LLM) & RAG Vector Databases",
          "Custom ERP & Business Management Software",
          "Zero-Cost Data Analytics & Executive Admin Dashboards",
          "Cloud Server Setup & DevOps (AWS, Vercel, Render)",
          "E-Commerce Website & Secure Payment Gateway Setup",
          "Programmatic SEO (pSEO) & Google Brand Optimization",
          "Production Software Engineering Mentorship in Kanpur"
        ],
        "image": [
          "https://www.kineticcodelabs.in/images/founder/user_photo1.jpg",
          "https://www.kineticcodelabs.in/images/founder/user_photo2.jpg",
          "https://www.kineticcodelabs.in/images/founder/user_photo3.jpg",
          "https://www.kineticcodelabs.in/images/founder/user_photo4.jpg",
          "https://www.kineticcodelabs.in/images/founder/user_photo5.jpg",
          "https://www.kineticcodelabs.in/assets/founder-portrait.webp",
          "https://res.cloudinary.com/de3eouhfj/image/upload/v1779546244/kinetic_uploads/jbiqab61qbrocinzc7or.jpg",
          "https://res.cloudinary.com/de3eouhfj/image/upload/v1779546268/kinetic_uploads/wc1fxtwu3qcd4ulma1af.jpg",
          "https://res.cloudinary.com/de3eouhfj/image/upload/v1779645209/kinetic_uploads/gryb7mf9sytziieybcwq.jpg",
          "https://res.cloudinary.com/de3eouhfj/image/upload/v1779659723/kinetic_uploads/omyflpq7gamwzzu8dltp.jpg",
          "https://res.cloudinary.com/de3eouhfj/image/upload/v1779659735/kinetic_uploads/hmtgzbjbkaj7tuk692ts.jpg"
        ],
        "worksFor": {
          "@id": "https://www.kineticcodelabs.in/#organization",
          "name": "Kinetic Code Labs",
          "url": "https://www.kineticcodelabs.in/"
        },
        "sameAs": [
          "https://www.instagram.com/kineticcodelabs_",
          "https://www.linkedin.com/in/kinetic-code-labs-132b77412",
          "https://x.com/yadavajit_spy",
          "https://github.com/kineticscodelabs-ux",
          "https://github.com/kineticscodelabs-ux/kineticscodelabs-ux",
          "https://www.justdial.com/Kanpur/Kinetic-Code-Labs-Yashoda-Nagar/0512PX512-X512-260513011900-W1I3_BZDET",
          "https://www.kineticcodelabs.in/about",
          "https://www.kineticcodelabs.in/instalinks"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://journal.kineticcodelabs.in/#website",
        "url": "https://journal.kineticcodelabs.in/",
        "name": "Kinetic Code Labs Journal",
        "description": "Next-generation interactive 3D science simulations, deep tech publishing platform, and software engineering technical journal by Ajeet Prakash Yadav at Kinetic Code Labs.",
        "publisher": {
          "@id": "https://www.kineticcodelabs.in/#organization"
        }
      }
    ]
  };

  return (
    <div style={styles.pageContainer} className="fade-in">
      {/* SEO JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Banner */}
      <div className="banner-top">
        <span>✦ KINETIC CODE LABS JOURNAL</span>
        <span>•</span>
        <span>A PRODUCT BY AJEET PRAKASH YADAV</span>
        <span>•</span>
        <a 
          href="https://www.kineticcodelabs.in" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: "var(--color-accent)", textDecoration: "underline" }}
        >
          WWW.KINETICCODELABS.IN
        </a>
      </div>

      {/* Responsive Navbar */}
      <header className="nav-header">
        <div className="container nav-container">
          <div className="nav-left">
            <Link href="/admin" className="nav-explore-link">
              <span className="nav-explore-menu"></span>
              <span className="nav-explore-link-text">Workspace</span>
            </Link>
          </div>

          <div className="nav-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Kinetic Code Labs Logo"
                width={260}
                height={75}
                className="nav-logo-img"
                priority
              />
            </Link>
          </div>

          <div className="nav-right">
            <a 
              href="https://www.kineticcodelabs.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="nav-member-tag"
              style={{ textDecoration: "none" }}
            >
              MAIN AGENCY ↗
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div className="container" style={styles.heroContainer}>
          {/* Founder & Brand Badge */}
          <div style={styles.founderBadge}>
            ✦ A Flagship Innovation by <strong style={{ color: "var(--color-text-dark)" }}>AJEET PRAKASH YADAV</strong> • Powered by <a href="https://www.kineticcodelabs.in" target="_blank" rel="noopener noreferrer" style={styles.founderLink}>Kinetic Code Labs</a>
          </div>

          <h1 className="hero-title-fluid">
            Interactive Science, Deep Tech &amp; Engineering. <br />
            <span style={styles.heroTitleItalic}>Experience Knowledge in Real-Time 3D.</span>
          </h1>

          <p style={styles.heroDescription}>
            Welcome to the official technical journal of <strong>Kinetic Code Labs</strong>. We combine cutting-edge software engineering, artificial intelligence, and hardware-accelerated 3D WebGL simulations to explain complex physics, aerospace, and computing concepts in simple, beautiful English.
          </p>

          {/* Responsive Stats Bar */}
          <div className="stats-bar-responsive">
            <div style={styles.statBox}>
              <div style={styles.statLabel}>CURATED STORIES</div>
              <div style={styles.statVal}>{stats.total}</div>
              <div style={styles.statSubText}>Total articles published</div>
            </div>
            <div style={styles.statBoxDivider} className="stat-box-divider-responsive"></div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>NEWS &amp; ARTICLES</div>
              <div style={styles.statVal}>{stats.news}</div>
              <div style={styles.statSubText}>Deep-dive technical guides</div>
            </div>
            <div style={styles.statBoxDivider} className="stat-box-divider-responsive"></div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>3D SIMULATION LABS</div>
              <div style={styles.statVal}>{stats.photo + stats.video}</div>
              <div style={styles.statSubText}>Live interactive 60 FPS models</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top 50 High-Search Trending Categories Exploration Cloud */}
      <section style={styles.categorySection}>
        <div className="container">
          <div style={styles.categoryHeader}>
            <span style={styles.categoryPreTitle}>EXPLORE 50+ GLOBAL TOPICS</span>
            <h2 style={styles.categoryTitle}>Trending Tech &amp; Scientific Categories</h2>
            <p style={styles.categorySubText}>
              Click any category to filter our research articles, tutorials, and interactive 3D simulations.
            </p>
          </div>

          <div style={styles.categoryPillsWrapper}>
            {TOP_50_CATEGORIES.map((cat, idx) => (
              <Link
                key={idx}
                href={{ pathname: "/", query: { search: cat } }}
                style={{
                  ...styles.categoryPill,
                  backgroundColor: search.toLowerCase() === cat.toLowerCase() ? "var(--color-accent)" : "#FAF7F2",
                  color: search.toLowerCase() === cat.toLowerCase() ? "#1C1512" : "var(--color-text-muted)",
                  borderColor: search.toLowerCase() === cat.toLowerCase() ? "var(--color-accent)" : "var(--color-border)",
                  fontWeight: search.toLowerCase() === cat.toLowerCase() ? 700 : 500,
                }}
              >
                #{cat}
              </Link>
            ))}
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
              News &amp; Research
            </Link>
            <Link
              href={{ pathname: "/", query: { type: "photo", search } }}
              style={{
                ...styles.filterTab,
                ...(type === "photo" ? styles.filterTabActive : {}),
              }}
            >
              Photo Insights
            </Link>
            <Link
              href={{ pathname: "/", query: { type: "video", search } }}
              style={{
                ...styles.filterTab,
                ...(type === "video" ? styles.filterTabActive : {}),
              }}
            >
              3D &amp; Video Labs
            </Link>
          </div>

          {/* Search form */}
          <form method="GET" action="/" style={styles.searchForm}>
            <input type="hidden" name="type" value={type} />
            <input
              type="text"
              name="search"
              placeholder="Search topics, keywords..."
              defaultValue={search}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>
              Search
            </button>
            {search && (
              <Link href="/" style={styles.clearSearchBtn} title="Clear search">
                ✕
              </Link>
            )}
          </form>
        </div>
      </section>

      {/* Main Grid */}
      <main className="container" style={styles.mainFeed}>
        {search && (
          <div style={styles.activeSearchBanner}>
            <span>Showing results for: <strong>&ldquo;{search}&rdquo;</strong></span>
            <Link href="/" style={styles.clearSearchLink}>Reset search</Link>
          </div>
        )}

        {matchingPosts.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No Stories Found</h3>
            <p>We couldn&apos;t find any articles matching your search criteria. Try a different topic or explore all formats.</p>
            <Link href="/" className="btn-secondary" style={{ marginTop: "1.5rem" }}>
              Clear All Filters
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

                  {/* Card Media */}
                  {post.type !== "news" && post.mediaUrl ? (
                    <div style={styles.cardMediaBox}>
                      {post.type === "video" ? (
                        <div style={styles.videoThumbnailWrapper}>
                          <video
                            src={optimizeCloudinaryUrl(post.mediaUrl)}
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
                          src={optimizeCloudinaryUrl(post.mediaUrl)}
                          alt={post.title}
                          style={styles.cardImage}
                        />
                      )}
                    </div>
                  ) : (
                    <div style={styles.newsAestheticBlock}>
                      <span style={styles.newsSymbol}>¶</span>
                    </div>
                  )}

                  {/* Card Content Info */}
                  <div style={styles.cardBody}>
                    <div style={styles.cardMetaRow}>
                      <span className={`badge badge-${post.type}`}>
                        {post.type === "video" ? "3D Simulation" : post.type}
                      </span>
                      <span style={styles.cardDate}>
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    <h2 style={styles.cardTitle}>{post.title}</h2>
                    <p style={styles.cardExcerpt}>{post.summary}</p>

                    <Link href={`/blog/${post.slug}`} style={styles.readMoreLink}>
                      Read Article &amp; Simulate →
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
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  heroSection: {
    padding: "3.5rem 0 2.5rem 0",
    borderBottom: "1px solid var(--color-border)",
    width: "100%",
  },
  heroContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  founderBadge: {
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    backgroundColor: "#FAF7F2",
    border: "1px solid var(--color-border)",
    padding: "0.35rem 0.9rem",
    borderRadius: "20px",
    marginBottom: "1.2rem",
    maxWidth: "95%",
  },
  founderLink: {
    color: "var(--color-accent)",
    fontWeight: 700,
    textDecoration: "underline",
  },
  heroTitleItalic: {
    fontStyle: "italic",
    color: "var(--color-accent)",
  },
  heroDescription: {
    color: "var(--color-text-muted)",
    fontSize: "0.98rem",
    lineHeight: "1.7",
    maxWidth: "780px",
    margin: "0.8rem auto 0 auto",
    fontWeight: 400,
    textAlign: "center",
  },
  statBox: {
    flex: 1,
    padding: "0.6rem 1rem",
    textAlign: "center",
  },
  statBoxDivider: {
    width: "1px",
    height: "42px",
    backgroundColor: "var(--color-border)",
  },
  statLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
  },
  statVal: {
    fontFamily: "var(--font-serif)",
    fontSize: "2.2rem",
    fontWeight: 600,
    color: "var(--color-accent)",
    lineHeight: "1.1",
    margin: "0.15rem 0",
  },
  statSubText: {
    fontSize: "0.72rem",
    color: "var(--color-text-muted)",
    opacity: 0.85,
  },
  categorySection: {
    backgroundColor: "#FAF7F2",
    borderBottom: "1px solid var(--color-border)",
    padding: "2.5rem 0",
    width: "100%",
  },
  categoryHeader: {
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  categoryPreTitle: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "var(--color-accent)",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "0.3rem",
  },
  categoryTitle: {
    fontSize: "1.5rem",
    fontFamily: "var(--font-serif)",
    color: "var(--color-text-dark)",
    marginBottom: "0.4rem",
  },
  categorySubText: {
    fontSize: "0.82rem",
    color: "var(--color-text-muted)",
    maxWidth: "600px",
    margin: "0 auto",
  },
  categoryPillsWrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem",
    justifyContent: "center",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  categoryPill: {
    fontSize: "0.72rem",
    padding: "0.3rem 0.65rem",
    borderRadius: "4px",
    border: "1px solid",
    transition: "all 0.15s ease",
    textDecoration: "none",
  },
  controlsSection: {
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "var(--color-bg-light)",
    width: "100%",
  },
  controlsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "0.8rem",
    paddingBottom: "0.8rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  filtersGroup: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  filterTab: {
    fontSize: "0.78rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "0.4rem 0",
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
    alignItems: "center",
    gap: "0.4rem",
    flexGrow: 1,
    maxWidth: "340px",
  },
  searchInput: {
    padding: "0.5rem 0.8rem",
    border: "1px solid var(--color-border)",
    fontSize: "0.8rem",
    backgroundColor: "var(--color-white)",
    flex: 1,
    minWidth: 0,
    outline: "none",
  },
  searchBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--color-text-dark)",
    color: "var(--color-bg-light)",
    border: "none",
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  clearSearchBtn: {
    padding: "0.5rem 0.6rem",
    backgroundColor: "#F1F5F9",
    border: "1px solid var(--color-border)",
    fontSize: "0.72rem",
    color: "var(--color-text-dark)",
    textDecoration: "none",
    fontWeight: 700,
  },
  activeSearchBanner: {
    backgroundColor: "#FAF7F2",
    border: "1px solid var(--color-border)",
    padding: "0.8rem 1.2rem",
    borderRadius: "4px",
    marginBottom: "1.8rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.88rem",
  },
  clearSearchLink: {
    fontSize: "0.75rem",
    color: "var(--color-accent)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  mainFeed: {
    paddingTop: "3rem",
    paddingBottom: "5rem",
    flexGrow: 1,
    width: "100%",
  },
  emptyState: {
    padding: "4rem 1.5rem",
    textAlign: "center",
    color: "var(--color-text-muted)",
  },
  emptyTitle: {
    fontSize: "1.6rem",
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
    top: "0.8rem",
    right: "1.2rem",
    fontFamily: "var(--font-serif)",
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--color-border)",
    zIndex: 10,
  },
  cardMediaBox: {
    width: "100%",
    height: "200px",
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "var(--color-bg-dark)",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease",
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
    width: "44px",
    height: "44px",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--color-bg-light)",
    color: "var(--color-text-dark)",
    borderRadius: "50%",
    fontSize: "1rem",
    paddingLeft: "3px",
  },
  newsAestheticBlock: {
    width: "100%",
    height: "160px",
    backgroundColor: "#FAF7F2",
    borderBottom: "1px solid var(--color-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  newsSymbol: {
    fontFamily: "var(--font-serif)",
    fontSize: "2.5rem",
    color: "var(--color-border)",
  },
  cardBody: {
    padding: "1.4rem",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  cardMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.8rem",
  },
  cardDate: {
    fontSize: "0.72rem",
    color: "var(--color-text-muted)",
  },
  cardTitle: {
    fontSize: "1.35rem",
    fontFamily: "var(--font-serif)",
    color: "var(--color-text-dark)",
    lineHeight: "1.25",
    marginBottom: "0.6rem",
  },
  cardExcerpt: {
    fontSize: "0.88rem",
    color: "var(--color-text-muted)",
    lineHeight: "1.6",
    marginBottom: "1.4rem",
    flexGrow: 1,
  },
  readMoreLink: {
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--color-text-dark)",
    display: "inline-flex",
    alignItems: "center",
    marginTop: "auto",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "3.5rem",
    borderTop: "1px solid var(--color-border)",
    paddingTop: "1.8rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  pageBtn: {
    fontSize: "0.75rem",
    padding: "0.6rem 1.2rem",
  },
  pageBtnDisabled: {
    fontSize: "0.75rem",
    padding: "0.6rem 1.2rem",
    color: "var(--color-border)",
    border: "1px solid var(--color-border)",
    cursor: "not-allowed",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  pageIndicator: {
    fontSize: "0.78rem",
    color: "var(--color-text-muted)",
    fontWeight: 600,
  },
};
