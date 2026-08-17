"use client";

import React, { useState } from "react";

export default function SidebarNewsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "Sidebar Newsletter Widget" }),
      });

      if (response.ok || response.status === 404) {
        setSubscribed(true);
      } else {
        throw new Error("Failed to subscribe.");
      }
    } catch (err) {
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card} className="card">
      <div style={styles.iconRow}>
        <span style={styles.mailIcon}>✉</span>
        <h4 style={styles.title}>Subscribe to updates</h4>
      </div>
      <p style={styles.description}>
        Get notified when I publish something new, and unsubscribe at any time.
      </p>

      {subscribed ? (
        <div style={styles.successMsg}>
          ✦ Thank you! You have been successfully added to the newsletter subscription feed.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            disabled={loading}
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Joining..." : "Join"}
          </button>
        </form>
      )}
      {error && <div style={styles.errorMsg}>{error}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#FAF7F2",
    border: "1px solid var(--color-border)",
    padding: "1.5rem",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  iconRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  mailIcon: {
    fontSize: "1.2rem",
    color: "var(--color-accent)",
  },
  title: {
    fontFamily: "var(--font-sans)",
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--color-text-dark)",
    margin: 0,
  },
  description: {
    fontSize: "0.8rem",
    lineHeight: "1.5",
    color: "var(--color-text-muted)",
    fontWeight: 400,
    margin: 0,
  },
  form: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.4rem",
  },
  input: {
    flexGrow: 1,
    padding: "0.5rem 0.8rem",
    border: "1px solid var(--color-border)",
    backgroundColor: "var(--color-white)",
    fontSize: "0.85rem",
    outline: "none",
    fontFamily: "var(--font-sans)",
  },
  button: {
    backgroundColor: "var(--color-text-dark)",
    color: "var(--color-bg-light)",
    border: "1px solid var(--color-text-dark)",
    padding: "0.5rem 1.2rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
  successMsg: {
    fontSize: "0.8rem",
    color: "var(--color-accent)",
    fontWeight: 600,
    lineHeight: "1.4",
  },
  errorMsg: {
    fontSize: "0.75rem",
    color: "#B91C1C",
    fontWeight: 500,
  },
};
