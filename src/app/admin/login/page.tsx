"use client";

import React, { useActionState, startTransition } from "react";
import { authenticateAdmin } from "../../actions/blog";
import Link from "next/link";
import Image from "next/image";

const initialState = {
  success: false,
  requireOtp: false,
  error: null as string | null,
};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await authenticateAdmin(prevState, formData);
    },
    initialState
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  // If successfully logged in, redirect will be handled or we can handle it here
  React.useEffect(() => {
    if (state.success) {
      window.location.href = "/admin";
    }
  }, [state.success]);

  return (
    <div style={styles.container} className="fade-in">
      {/* Left split - brand banner */}
      <div style={styles.leftPanel}>
        <div style={styles.logoContainer}>
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Kinetic Code Labs Logo"
              width={160}
              height={50}
              style={styles.logo}
              priority
            />
          </Link>
        </div>
        <div style={styles.bannerText}>
          <h1 style={styles.bannerTitle}>Kinetic Code Labs</h1>
          <p style={styles.bannerSubtitle}>Control Center</p>
          <div style={styles.divider}></div>
          <p style={styles.bannerDescription}>
            Manage and publish rich-text articles, photographic galleries, and streaming videos from a single unified workspace.
          </p>
        </div>
        <div style={styles.footerBrand}>
          © 2026 Kinetic Code Labs. All rights reserved.
        </div>
      </div>

      {/* Right split - login form */}
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <span style={styles.badge}>Security Vault</span>
            <h2 style={styles.cardTitle}>Admin Access</h2>
            <p style={styles.cardSubtitle}>
              Please verify your identity to access the management dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {state.error && <div style={styles.errorAlert}>{state.error}</div>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="form-input"
                style={styles.input}
                placeholder="e.g. admin"
              />
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input"
                style={styles.input}
                placeholder="••••••••••••"
              />
            </div>

            {state.requireOtp && (
              <div className="form-group" style={{ marginBottom: "2rem" }}>
                <label htmlFor="otp" style={{ color: "var(--color-accent)", fontWeight: "bold" }}>
                  Telegram 2FA Security Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  required
                  className="form-input"
                  style={{ 
                    ...styles.input, 
                    borderColor: "var(--color-accent)", 
                    letterSpacing: "0.4em", 
                    fontSize: "1.25rem",
                    textAlign: "center",
                    color: "var(--color-accent)",
                    fontWeight: "bold",
                    fontFamily: "monospace"
                  }}
                  placeholder="000000"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
              style={styles.button}
            >
              {isPending ? "Verifying..." : "Enter Workspace →"}
            </button>
          </form>

          <Link href="/" style={styles.backLink}>
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "var(--color-bg-light)",
  },
  leftPanel: {
    flex: "1 1 45%",
    backgroundColor: "var(--color-bg-dark)",
    color: "var(--color-bg-light)",
    padding: "3rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    borderRight: "1px solid var(--color-border-dark)",
    backgroundImage: "linear-gradient(to bottom, var(--color-bg-dark), #15100e)",
  },
  rightPanel: {
    flex: "1 1 55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 2rem",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    objectFit: "contain",
    filter: "brightness(0) invert(1)", // Makes dark logo white for dark bg
  },
  bannerText: {
    margin: "4rem 0",
  },
  bannerTitle: {
    fontSize: "3rem",
    fontWeight: "normal",
    fontFamily: "var(--font-serif)",
    color: "var(--color-accent)",
    lineHeight: "1.1",
    marginBottom: "0.5rem",
  },
  bannerSubtitle: {
    fontSize: "0.9rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "var(--color-bg-tan)",
    fontWeight: 600,
  },
  divider: {
    width: "60px",
    height: "2px",
    backgroundColor: "var(--color-accent)",
    margin: "1.5rem 0",
  },
  bannerDescription: {
    fontSize: "0.95rem",
    color: "var(--color-bg-tan)",
    opacity: 0.8,
    maxWidth: "400px",
    lineHeight: "1.7",
  },
  footerBrand: {
    fontSize: "0.75rem",
    opacity: 0.5,
    color: "var(--color-bg-tan)",
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    marginBottom: "2rem",
  },
  badge: {
    display: "inline-block",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent)",
    padding: "0.2rem 0.5rem",
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "2.2rem",
    color: "var(--color-text-dark)",
    marginBottom: "0.5rem",
  },
  cardSubtitle: {
    fontSize: "0.85rem",
    color: "var(--color-text-muted)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  input: {
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-border)",
    padding: "0.9rem 1.1rem",
  },
  button: {
    width: "100%",
    padding: "1rem",
    marginTop: "0.5rem",
    letterSpacing: "0.15em",
  },
  errorAlert: {
    backgroundColor: "#FDF2F2",
    border: "1px solid #F8B4B4",
    color: "#9B1C1C",
    padding: "0.8rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 500,
    borderRadius: "2px",
    marginBottom: "0.5rem",
  },
  backLink: {
    marginTop: "2rem",
    fontSize: "0.8rem",
    textAlign: "center",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};
