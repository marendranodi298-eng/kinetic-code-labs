import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import PostEditor from "../../components/PostEditor";
import { logoutAdmin } from "../../../actions/blog";

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  // Retrieve post details from the database
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
  });

  // If the post does not exist, throw a 404
  if (!post) {
    notFound();
  }

  return (
    <div style={styles.pageContainer} className="fade-in">
      {/* Header */}
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
            <span style={styles.workspaceTag}>Editor Workspace</span>
          </div>
          <form action={logoutAdmin}>
            <button type="submit" style={styles.logoutBtn}>
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="container" style={styles.main}>
        <div style={styles.navRow}>
          <Link href="/admin" style={styles.backLink}>
            ← Back to Dashboard
          </Link>
        </div>

        <div style={styles.titleBlock}>
          <h1 style={styles.pageTitle}>Edit Publication</h1>
          <p style={styles.pageSubtitle}>
            Modify the content, toggle publication status, or update media assets.
          </p>
        </div>

        {/* Reusable Editor loaded with post details */}
        <PostEditor post={post} />
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
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent)",
    padding: "0.2rem 0.5rem",
    borderRadius: "2px",
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
  },
  main: {
    flexGrow: 1,
    paddingTop: "2rem",
    paddingBottom: "4rem",
  },
  navRow: {
    marginBottom: "1.5rem",
  },
  backLink: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-text-muted)",
    transition: "var(--transition-fast)",
  },
  titleBlock: {
    marginBottom: "2.5rem",
  },
  pageTitle: {
    fontSize: "2.2rem",
    color: "var(--color-text-dark)",
  },
  pageSubtitle: {
    fontSize: "0.85rem",
    color: "var(--color-text-muted)",
    marginTop: "0.2rem",
  },
};
