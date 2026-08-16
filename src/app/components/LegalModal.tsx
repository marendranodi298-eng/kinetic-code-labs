"use client";

import React, { useState, useEffect } from "react";

interface LegalModalProps {
  isOpen: boolean;
  initialTab: string;
  onClose: () => void;
}

export default function LegalModal({ isOpen, initialTab, onClose }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

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
          <h2 style={styles.title}>Compliance &amp; Legal</h2>
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
          <button
            onClick={() => setActiveTab("contact")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "contact" ? styles.tabBtnActive : {}),
            }}
          >
            Contact Us
          </button>
        </div>

        {/* Content */}
        <div style={styles.scrollContent}>
          {activeTab === "privacy" && (
            <div style={styles.textContent}>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>Effective Date: {date}</p>
              <p>Welcome to Kinetic Code Labs.</p>
              <p>At Kinetic Code Labs, we respect user privacy like infrastructure engineers respect production databases — one careless mistake and trust evaporates into the vacuum of space.</p>
              <p>This Privacy Policy explains how we collect, use, store, and protect information when users interact with our website, software systems, consultation forms, AI tools, and digital services.</p>
              
              <h3 style={styles.heading3}>1. Information We Collect</h3>
              <p>We may collect:</p>
              <ul style={styles.list}>
                <li style={styles.listItem}><strong>Personal Information:</strong> Full name, Email address, Phone number, Business details, Project requirements.</li>
                <li style={styles.listItem}><strong>Technical Information:</strong> IP address, Browser/device information, Usage analytics, Error logs, Cookies/session identifiers.</li>
                <li style={styles.listItem}><strong>Project Data:</strong> If clients use custom software, dashboards, portals, or AI systems developed by Kinetic Code Labs, limited operational data may be processed for functionality and security purposes.</li>
              </ul>

              <h3 style={styles.heading3}>2. How We Use Information</h3>
              <p>We use collected data to:</p>
              <ul style={styles.list}>
                <li style={styles.listItem}>Provide software development services</li>
                <li style={styles.listItem}>Respond to inquiries</li>
                <li style={styles.listItem}>Improve system performance</li>
                <li style={styles.listItem}>Maintain platform security</li>
                <li style={styles.listItem}>Prevent abuse or unauthorized access</li>
                <li style={styles.listItem}>Communicate project updates</li>
                <li style={styles.listItem}>Generate analytics and debugging reports</li>
              </ul>
              <p style={{ ...styles.boldWhite, color: "var(--color-accent)" }}>We do NOT sell user data to third parties.</p>
              <p>Unlike data-hungry corporations that behave like digital black holes, our business model is software engineering — not surveillance capitalism.</p>

              <h3 style={styles.heading3}>3. Cookies &amp; Authentication</h3>
              <p>Our systems may use secure cookies, session tokens, and authentication identifiers. These help maintain secure login sessions and platform functionality. Some services may use HttpOnly authentication cookies for enhanced protection against client-side attacks.</p>

              <h3 style={styles.heading3}>4. Third-Party Services</h3>
              <p>We may integrate trusted third-party services including Razorpay, Google OAuth, Cloudinary, hosting providers, analytics, and AI APIs. These services operate under their own privacy policies.</p>

              <h3 style={styles.heading3}>5. Payment Information</h3>
              <p>Payments are securely processed through third-party payment gateways such as Razorpay. Kinetic Code Labs does NOT directly store sensitive card or banking information on its servers.</p>

              <h3 style={styles.heading3}>6. Data Security</h3>
              <p>We implement reasonable technical and organizational safeguards including rate limiting, authentication middleware, access controls, secure APIs, input validation, and infrastructure hardening. However, no internet system is mathematically immortal. Even neutron stars collapse eventually. Therefore, absolute security cannot be guaranteed.</p>

              <h3 style={styles.heading3}>7. User Rights</h3>
              <p>Users may request access to, correction of, or deletion of stored information. Requests can be submitted via: 📧 support@kineticcodelabs.in</p>

              <h3 style={styles.heading3}>8. Intellectual Property</h3>
              <p>All custom software, branding, architecture, UI systems, source code, documentation, and engineering assets developed by Kinetic Code Labs remain protected under applicable intellectual property laws unless otherwise agreed in writing.</p>

              <h3 style={styles.heading3}>9. Policy Updates</h3>
              <p>We may update this Privacy Policy periodically as our systems, infrastructure, or services evolve. Continued use of our services implies acceptance of updated policies.</p>
            </div>
          )}

          {activeTab === "terms" && (
            <div style={styles.textContent}>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>Effective Date: {date}</p>
              <h3 style={styles.heading3}>1. Acceptance of Terms</h3>
              <p>By accessing or using services provided by Kinetic Code Labs, you agree to comply with these Terms &amp; Conditions. If you disagree with any part of these terms, you should not use our services. Simple.</p>

              <h3 style={styles.heading3}>2. Services</h3>
              <p>Kinetic Code Labs provides custom software development, web application engineering, AI integrations, UI/UX systems, backend architecture, consulting, technical maintenance, and cloud deployment solutions.</p>

              <h3 style={styles.heading3}>3. Client Responsibilities</h3>
              <p>Clients must provide accurate project requirements, share necessary assets/content, respond within reasonable timelines, and avoid illegal or abusive platform usage. If a client disappears for 3 weeks like a lost Mars rover and then suddenly demands “urgent delivery,” timelines may shift accordingly. Engineering requires coordination, not teleportation.</p>

              <h3 style={styles.heading3}>4. Payments</h3>
              <ul style={styles.list}>
                <li style={styles.listItem}>Advance payments may be required before development begins.</li>
                <li style={styles.listItem}>Milestone-based billing may apply for large projects.</li>
                <li style={styles.listItem}>Delayed payments may pause project progress.</li>
                <li style={styles.listItem}>Final delivery may be withheld until pending dues are cleared.</li>
              </ul>

              <h3 style={styles.heading3}>5. Project Timelines</h3>
              <p>Estimated timelines are projections, not laws of physics. Delays may occur due to requirement changes, third-party API failures, hosting/platform issues, delayed client responses, or scope expansion.</p>

              <h3 style={styles.heading3}>6. Intellectual Property</h3>
              <p>Unless otherwise agreed, final delivered product ownership transfers after full payment. Internal utilities, reusable frameworks, boilerplates, and engineering systems remain intellectual property of Kinetic Code Labs.</p>

              <h3 style={styles.heading3}>7. Limitation of Liability</h3>
              <p>Kinetic Code Labs shall not be held liable for business losses, data loss from third-party systems, hosting outages, API provider failures, or cyberattacks beyond reasonable control. No software system is immune to entropy. Even billion-dollar infrastructures go down occasionally.</p>

              <h3 style={styles.heading3}>8. Termination</h3>
              <p>We reserve the right to terminate services if clients engage in fraud, abuse staff or systems, request illegal activities, or refuse agreed payments.</p>

              <h3 style={styles.heading3}>9. Governing Law</h3>
              <p>These terms shall be governed under the laws of India. Jurisdiction: Kanpur, Uttar Pradesh, India.</p>
            </div>
          )}

          {activeTab === "refund" && (
            <div style={styles.textContent}>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>Effective Date: {date}</p>
              <p>At Kinetic Code Labs, every project involves custom engineering effort, planning, architecture, and development time.</p>
              <p style={styles.boldWhite}>Software development is not like returning headphones to Amazon because the bass felt “mid.”</p>
              <p>Work hours, infrastructure, and engineering effort cannot be unbuilt after delivery.</p>

              <h3 style={styles.heading3}>1. Advance Payments</h3>
              <p>Advance payments are generally non-refundable once project work has started, as they are used for planning, architecture, research, and development allocation.</p>

              <h3 style={styles.heading3}>2. Refund Eligibility</h3>
              <p>Partial refunds may be considered only if project work has not started, Kinetic Code Labs is unable to initiate agreed services, or duplicate payments occurred accidentally.</p>

              <h3 style={styles.heading3}>3. No Refund Cases</h3>
              <p>Refunds will NOT apply for change of mind, delayed client communication, scope changes after approval, third-party platform limitations, completed milestones, hosting/domain purchases, or API subscription costs already incurred.</p>

              <h3 style={styles.heading3}>4. Project Cancellation</h3>
              <p>If a client cancels an ongoing project, charges may apply for completed work, delivered modules remain billable, and the remaining balance may be recalculated proportionally.</p>

              <h3 style={styles.heading3}>5. Technical Support</h3>
              <p>Reasonable bug fixes related to delivered scope may be provided after deployment for an agreed support duration.</p>
            </div>
          )}

          {activeTab === "contact" && (
            <div style={styles.textContent}>
              <p>For any queries, partnerships, or complaints, please reach out to the respective teams below:</p>
              
              <h3 style={{ ...styles.heading3, color: "var(--color-text-dark)" }}>Business &amp; Partnerships</h3>
              <div style={styles.infoBox}>
                <p><strong>Founder &amp; CEO:</strong> Ajeet Prakash Yadav</p>
                <p style={{ display: "flex", alignItems: "center" }}>
                  <strong>Phone:</strong> +91 90269 26680
                  <a href="https://wa.me/919026926680" target="_blank" rel="noreferrer" style={styles.whatsappBadge}>WhatsApp</a>
                </p>
                <p><strong>Email:</strong> connect@kineticcodelabs.in</p>
              </div>
   
              <h3 style={{ ...styles.heading3, color: "var(--color-text-dark)" }}>Customer Care &amp; Grievances</h3>
              <div style={styles.infoBox}>
                <p><strong>Grievance Officer:</strong> Rudresh Tiwari</p>
                <p style={{ display: "flex", alignItems: "center" }}>
                  <strong>Phone:</strong> +91 94706 88754
                  <a href="https://wa.me/919470688754" target="_blank" rel="noreferrer" style={styles.whatsappBadge}>WhatsApp</a>
                </p>
                <p><strong>Email:</strong> support@kineticcodelabs.in</p>
                <p><strong>Operational Address:</strong> Kanpur, Uttar Pradesh, India - 208011</p>
              </div>
              <p>We will aim to resolve any complaints within 3-5 business days.</p>
   
              <h3 style={{ ...styles.heading3, color: "var(--color-text-dark)" }}>Why Clients Trust Us</h3>
              <ul style={styles.list}>
                <li style={styles.listItem}>✔ Secure MERN Architecture</li>
                <li style={styles.listItem}>✔ AI-Powered Systems</li>
                <li style={styles.listItem}>✔ Razorpay Payment Integrations</li>
                <li style={styles.listItem}>✔ Admin CMS Platforms</li>
                <li style={styles.listItem}>✔ Production-Grade Engineering</li>
                <li style={styles.listItem}>✔ SEO &amp; Performance Optimized</li>
              </ul>
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
    backgroundColor: "rgba(28, 21, 18, 0.7)",
    backdropFilter: "blur(5px)",
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
    maxWidth: "650px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "85vh",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.2rem 1.5rem",
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "#FAF7F2",
  },
  title: {
    fontSize: "1.3rem",
    color: "var(--color-text-dark)",
    margin: 0,
    fontFamily: "var(--font-serif)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "2rem",
    color: "var(--color-text-muted)",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
  },
  tabsRow: {
    display: "flex",
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "#FAF7F2",
    overflowX: "auto",
  },
  tabBtn: {
    flex: 1,
    padding: "0.8rem 0.5rem",
    border: "none",
    background: "transparent",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    cursor: "pointer",
    transition: "var(--transition-fast)",
    borderBottom: "2px solid transparent",
    whiteSpace: "nowrap",
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
    maxHeight: "55vh",
  },
  textContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
    fontSize: "0.85rem",
    lineHeight: "1.6",
    color: "var(--color-text-dark)",
  },
  heading3: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--color-accent)",
    marginTop: "1rem",
    marginBottom: "0.2rem",
  },
  list: {
    paddingLeft: "1.2rem",
    margin: "0 0 0.5rem 0",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  listItem: {
    lineHeight: "1.5",
  },
  boldWhite: {
    fontWeight: "bold",
    color: "var(--color-text-dark)",
  },
  infoBox: {
    backgroundColor: "rgba(198, 154, 91, 0.05)",
    border: "1px solid rgba(198, 154, 91, 0.2)",
    padding: "1rem",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    marginTop: "0.3rem",
    marginBottom: "0.5rem",
  },
  whatsappBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    color: "#ffffff",
    borderRadius: "4px",
    padding: "0.15rem 0.5rem",
    fontSize: "0.65rem",
    fontWeight: "bold",
    textDecoration: "none",
    marginLeft: "0.5rem",
  },
  modalFooter: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid var(--color-border)",
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "#FAF7F2",
  },
  closeActionBtn: {
    backgroundColor: "var(--color-text-dark)",
    color: "var(--color-bg-light)",
    border: "none",
    padding: "0.5rem 1.2rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "var(--transition-fast)",
    borderRadius: "6px",
  },
};
