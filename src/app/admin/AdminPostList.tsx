"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { deleteBlogPost, toggleBlogPostPublish } from "../actions/blog";
import { Post } from "@/db";

interface AdminPostListProps {
  initialPosts: Post[];
}

export default function AdminPostList({ initialPosts }: AdminPostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "news" | "photo" | "video">("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.summary.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || post.type === filterType;
    return matchesSearch && matchesType;
  });

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the post: "${title}"?\nThis will also remove any hosted media from Cloudinary.`)) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      try {
        const result = await deleteBlogPost(id);
        if (result.success) {
          setPosts((prev) => prev.filter((p) => p.id !== id));
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete post");
      } finally {
        setDeletingId(null);
      }
    });
  };

  // Handle publish toggle
  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        const result = await toggleBlogPostPublish(id, currentStatus);
        if (result.success) {
          setPosts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, published: !currentStatus } : p))
          );
        }
      } catch (err: any) {
        alert(err.message || "Failed to update status");
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div style={styles.container}>
      {/* Search and Filters */}
      <div style={styles.controls}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search posts by title or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterWrapper}>
          <button
            onClick={() => setFilterType("all")}
            style={{
              ...styles.filterBtn,
              ...(filterType === "all" ? styles.filterBtnActive : {}),
            }}
          >
            All Types
          </button>
          <button
            onClick={() => setFilterType("news")}
            style={{
              ...styles.filterBtn,
              ...(filterType === "news" ? styles.filterBtnActive : {}),
            }}
          >
            News
          </button>
          <button
            onClick={() => setFilterType("photo")}
            style={{
              ...styles.filterBtn,
              ...(filterType === "photo" ? styles.filterBtnActive : {}),
            }}
          >
            Photos
          </button>
          <button
            onClick={() => setFilterType("video")}
            style={{
              ...styles.filterBtn,
              ...(filterType === "video" ? styles.filterBtnActive : {}),
            }}
          >
            Videos
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div style={styles.tableWrapper}>
        {filteredPosts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No blog posts found. Create a new one to get started!</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Post Title</th>
                <th style={styles.th}>Format</th>
                <th style={styles.th}>Views</th>
                <th style={styles.th}>Date Created</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id} style={styles.tdRow}>
                  <td style={styles.tdTitle}>
                    <div style={styles.titleText}>{post.title}</div>
                    <div style={styles.slugText}>/{post.slug}</div>
                  </td>
                  <td style={styles.td}>
                    <span
                      className={`badge badge-${post.type}`}
                      style={{ fontSize: "0.6rem" }}
                    >
                      {post.type}
                    </span>
                  </td>
                  <td style={styles.td}>{post.views}</td>
                  <td style={styles.td}>{formatDate(post.createdAt)}</td>
                  <td style={styles.td}>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={post.published}
                        disabled={isPending}
                        onChange={() => handleTogglePublish(post.id, post.published)}
                        style={styles.switchInput}
                      />
                      <span
                        style={{
                          ...styles.switchSlider,
                          ...(post.published ? styles.switchSliderActive : {}),
                        }}
                      ></span>
                    </label>
                    <span style={styles.switchLabel}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={styles.tdActions}>
                    <Link
                      href={`/admin/edit/${post.id}`}
                      style={styles.editBtn}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      disabled={deletingId === post.id}
                      style={{
                        ...styles.deleteBtn,
                        ...(deletingId === post.id ? { opacity: 0.5 } : {}),
                      }}
                    >
                      {deletingId === post.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  searchWrapper: {
    flex: "1 1 300px",
  },
  searchInput: {
    padding: "0.7rem 1rem",
    fontSize: "0.85rem",
  },
  filterWrapper: {
    display: "flex",
    gap: "0.5rem",
  },
  filterBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    backgroundColor: "var(--color-bg-tan)",
    border: "1px solid transparent",
    color: "var(--color-text-dark)",
    cursor: "pointer",
    transition: "var(--transition-fast)",
  },
  filterBtnActive: {
    backgroundColor: "var(--color-text-dark)",
    color: "var(--color-bg-light)",
    borderColor: "var(--color-text-dark)",
  },
  tableWrapper: {
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    overflowX: "auto",
  },
  emptyState: {
    padding: "4rem 2rem",
    textAlign: "center",
    color: "var(--color-text-muted)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "0.85rem",
  },
  thRow: {
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "var(--color-bg-light)",
  },
  th: {
    padding: "1rem 1.5rem",
    fontWeight: 600,
    textTransform: "uppercase",
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    color: "var(--color-text-muted)",
  },
  tdRow: {
    borderBottom: "1px solid var(--color-border)",
    transition: "var(--transition-fast)",
  },
  td: {
    padding: "1.2rem 1.5rem",
    verticalAlign: "middle",
  },
  tdTitle: {
    padding: "1.2rem 1.5rem",
    verticalAlign: "middle",
    maxWidth: "320px",
  },
  titleText: {
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "var(--color-text-dark)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  slugText: {
    fontSize: "0.7rem",
    color: "var(--color-text-muted)",
    fontFamily: "monospace",
    marginTop: "0.2rem",
  },
  tdActions: {
    padding: "1.2rem 1.5rem",
    verticalAlign: "middle",
    display: "flex",
    gap: "0.8rem",
  },
  editBtn: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--color-accent)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid transparent",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#C81E1E",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    padding: 0,
  },
  // Custom switch styles
  switch: {
    position: "relative",
    display: "inline-block",
    width: "36px",
    height: "20px",
    verticalAlign: "middle",
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
    borderRadius: "20px",
    transition: ".2s",
  },
  switchSliderActive: {
    backgroundColor: "var(--color-accent)",
  },
  switchLabel: {
    marginLeft: "0.5rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    verticalAlign: "middle",
  },
};
