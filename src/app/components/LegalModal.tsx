"use client";

import React, { useState, useEffect } from "react";

interface LegalModalProps {
  isOpen: boolean;
  initialTab: string;
  onClose: () => void;
}

export default function LegalModal({ isOpen, initialTab, onClose }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} className="fade-in">
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Legal &amp; Policy</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabsRow}>
          <button
            onClick={() => setActiveTab("privacy")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "privacy" ? styles.tabBtnActive : {}),
            }}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "terms" ? styles.tabBtnActive : {}),
            }}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab("refund")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "refund" ? styles.tabBtnActive : {}),
            }}
          >
            Refund Policy
          </button>
        </div>

        {/* Content */}
        <div style={styles.scrollContent}>
          {activeTab === "privacy" && (
            <div style={styles.textContent}>
              <h3>Privacy Policy</h3>
              <p>Last updated: August 17, 2026</p>
              <p>
                At Kinetic Code Labs, accessible from kineticcodelabs.in, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Kinetic Code Labs and how we use it.
              </p>
              <h4>1. Information We Collect</h4>
              <p>
                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information (e.g. newsletter subscriptions or contact requests).
              </p>
              <h4>2. How We Use Your Information</h4>
              <p>
                We use the information we collect in various ways, including to provide, operate, and maintain our website, improve, personalize, and expand our services, and communicate with you for customer service and marketing updates.
              </p>
              <h4>3. Media and Uploads</h4>
              <p>
                If you upload images or videos to the website (such as via our workspaces), they are stored securely on Cloudinary. Any metadata associated with media files is treated confidentially and is only used to render requested layouts.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div style={styles.textContent}>
              <h3>Terms of Service</h3>
              <p>Last updated: August 17, 2026</p>
              <p>
                Welcome to Kinetic Code Labs! These terms and conditions outline the rules and regulations for the use of Kinetic Code Labs' Website.
              </p>
              <h4>1. Agreement to Terms</h4>
              <p>
                By accessing this website, we assume you accept these terms and conditions. Do not continue to use Kinetic Code Labs if you do not agree to take all of the terms and conditions stated on this page.
              </p>
              <h4>2. Intellectual Property</h4>
              <p>
                Unless otherwise stated, Kinetic Code Labs and/or its licensors own the intellectual property rights for all material on Kinetic Code Labs. All intellectual property rights are reserved. You must not republish, sell, rent, or sub-license material from Kinetic Code Labs.
              </p>
              <h4>3. User Responsibilities</h4>
              <p>
                You must not use this website in any way that is or may be damaging to this website, or in any way that impacts user access to this website, or contrary to applicable laws and regulations.
              </p>
            </div>
          )}

          {activeTab === "refund" && (
            <div style={styles.textContent}>
              <h3>Refund Policy</h3>
              <p>Last updated: August 17, 2026</p>
              <p>
                Our commitment is to deliver high-quality custom web development and AI automation solutions. Because we work directly in developmental milestones, the following refund terms apply:
              </p>
              <h4>1. Milestone Payments</h4>
              <p>
                Payments for developmental milestones are billed upon completion and approval of each phase. Once a milestone is approved by the client and code is delivered, payments associated with that milestone are non-refundable.
              </p>
              <h4>2. Project Cancellation</h4>
              <p>
                In the event of project cancellation before completion, clients will only be billed for the work completed up to the date of cancellation. Any deposits for unstarted phases will be fully refunded within 7-10 business days.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.modalFooter}>
          <button style={styles.closeActionBtn} onClick={onClose}>
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(28, 21, 18, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1.5rem",
  },
  modalCard: {
    backgroundColor: "var(--color-bg-light)",
    border: "1px solid var(--color-border)",
    width: "100%",
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "85vh",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.15)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "1px solid var(--color-border)",
  },
  title: {
    fontSize: "1.5rem",
    color: "var(--color-text-dark)",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "1.8rem",
    color: "var(--color-text-muted)",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
  },
  tabsRow: {
    display: "flex",
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "#FAF7F2",
  },
  tabBtn: {
    flex: 1,
    padding: "1rem",
    border: "none",
    background: "transparent",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    cursor: "pointer",
    transition: "var(--transition-fast)",
    borderBottom: "2px solid transparent",
  },
  tabBtnActive: {
    color: "var(--color-text-dark)",
    borderBottomColor: "var(--color-accent)",
    backgroundColor: "var(--color-bg-light)",
  },
  scrollContent: {
    padding: "1.5rem",
    overflowY: "auto",
    flexGrow: 1,
    maxHeight: "50vh",
  },
  textContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    fontSize: "0.9rem",
    lineHeight: "1.6",
    color: "var(--color-text-dark)",
  },
  modalFooter: {
    padding: "1.2rem 1.5rem",
    borderTop: "1px solid var(--color-border)",
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "#FAF7F2",
  },
  closeActionBtn: {
    backgroundColor: "var(--color-text-dark)",
    color: "var(--color-bg-light)",
    border: "none",
    padding: "0.6rem 1.4rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "var(--transition-fast)",
  },
};
