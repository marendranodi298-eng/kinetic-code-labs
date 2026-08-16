import React from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { logoutAdmin } from "../actions/blog";
import AdminPostList from "./AdminPostList";

export const revalidate = 0; // Disable server caching for admin pages

export default async function AdminDashboardPage() {
  // Fetch posts from database sorted by creation time
  const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));

  // Compute metrics
  const totalPosts = allPosts.length;
  const newsCount = allPosts.filter((p) => p.type === "news").length;
  const photoCount = allPosts.filter((p) => p.type === "photo").length;
  const videoCount = allPosts.filter((p) => p.type === "video").length;
  const totalViews = allPosts.reduce((sum, p) => sum + p.views, 0);

  return (
    <div style={styles.pageContainer} className="fade-in">
      {/* Admin Navbar */}
      <header style={styles.header}>
        <div className="container" style={styles.headerContainer}>
          <div style={styles.logoBlock}>
            <Image
              src="/logo.png"
              alt="Kinetic Code Labs Logo"
              width={130}
              height={40}
              style={styles.logo}
            />
            <span style={styles.workspaceTag}>Workspace</span>
          </div>

          <nav style={styles.nav}>
            <Link href="/" style={styles.navLink} target="_blank">
              View Website ↗
            </Link>
            <form action={logoutAdmin}>
              <button type="submit" style={styles.logoutBtn}>
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={styles.main}>
        {/* Dashboard Title & Action */}
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>Workspace Dashboard</h1>
            <p style={styles.subtitle}>
              Monitor audience views and publish content updates.
            </p>
          </div>
          <Link href="/admin/new" className="btn-primary" style={styles.createBtn}>
            + Create New Post
          </Link>
        </div>

        {/* Statistics Grid */}
        <section style={styles.statsGrid}>
          {/* Total Posts Card */}
          <div className="card card-dark" style={styles.statCard}>
            <span style={styles.statNumber}>01</span>
            <div style={styles.statLabel}>Total Publications</div>
            <div style={styles.statVal}>{totalPosts}</div>
            <div style={styles.statFooter}>News, Photos & Videos</div>
          </div>

          {/* Views Card */}
          <div className="card" style={{ ...styles.statCard, borderColor: "var(--color-accent)" }}>
            <span style={{ ...styles.statNumber, color: "var(--color-accent)" }}>02</span>
            <div style={styles.statLabel}>Audience Interactions</div>
            <div style={{ ...styles.statVal, color: "var(--color-text-dark)" }}>{totalViews}</div>
            <div style={styles.statFooter}>Lifetime page views</div>
          </div>

          {/* Breakdown Card */}
          <div className="card" style={styles.statCard}>
            <span style={styles.statNumber}>03</span>
            <div style={styles.statLabel}>Format Breakdown</div>
            <div style={styles.breakdownRow}>
              <div style={styles.breakdownItem}>
                <span className="badge badge-news" style={styles.smallBadge}>News</span>
                <span style={styles.breakdownCount}>{newsCount}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span className="badge badge-photo" style={styles.smallBadge}>Photo</span>
                <span style={styles.breakdownCount}>{photoCount}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span className="badge badge-video" style={styles.smallBadge}>Video</span>
                <span style={styles.breakdownCount}>{videoCount}</span>
              </div>
            </div>
            <div style={styles.statFooter}>Distribution of media</div>
          </div>
        </section>

        {/* Interactive Post List */}
        <section style={styles.listSection}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Manage Content</h2>
          </div>
          <AdminPostList initialPosts={allPosts} />
        </section>
      </main>
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
    backgroundColor: "var(--color-bg-dark)",
    borderBottom: "1px solid var(--color-border-dark)",
    padding: "0.8rem 0",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoBlock: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
  },
  logo: {
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
  },
  workspaceTag: {
    fontSize: "0.6rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent)",
    padding: "0.2rem 0.5rem",
    borderRadius: "2px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  navLink: {
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-bg-tan)",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#E5E7EB",
    cursor: "pointer",
    padding: "0.4rem 0.8rem",
    transition: "var(--transition-fast)",
  },
  main: {
    flexGrow: 1,
    paddingTop: "3rem",
    paddingBottom: "4rem",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "2.5rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "2.5rem",
    color: "var(--color-text-dark)",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "var(--color-text-muted)",
    marginTop: "0.2rem",
  },
  createBtn: {
    fontSize: "0.75rem",
    padding: "0.7rem 1.4rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3.5rem",
  },
  statCard: {
    padding: "2rem",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "180px",
  },
  statNumber: {
    position: "absolute",
    top: "1.5rem",
    right: "2rem",
    fontFamily: "var(--font-serif)",
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "var(--color-border-dark)",
  },
  statLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--color-accent)",
    marginBottom: "1rem",
  },
  statVal: {
    fontSize: "3rem",
    fontFamily: "var(--font-serif)",
    lineHeight: "1",
    fontWeight: 500,
  },
  breakdownRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    margin: "0.5rem 0",
  },
  breakdownItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallBadge: {
    fontSize: "0.55rem",
    padding: "0.15rem 0.4rem",
  },
  breakdownCount: {
    fontWeight: 700,
    fontSize: "0.85rem",
  },
  statFooter: {
    fontSize: "0.75rem",
    color: "var(--color-text-muted)",
    marginTop: "1.5rem",
    borderTop: "1px solid var(--color-border)",
    paddingTop: "0.6rem",
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  listHeader: {
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "0.8rem",
  },
  listTitle: {
    fontSize: "1.6rem",
    color: "var(--color-text-dark)",
  },
};
