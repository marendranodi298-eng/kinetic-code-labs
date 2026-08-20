"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LegalModal from "./LegalModal";

interface FooterProps {
  transparent?: boolean;
}

export default function Footer({ transparent }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [legalModal, setLegalModal] = useState({ open: false, tab: "privacy" });
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const openLegalModal = (e: React.MouseEvent, tab: string) => {
    e.preventDefault();
    setLegalModal({ open: true, tab });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      try {
        await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: "Footer Newsletter Form" }),
        });
      } catch (err) {
        console.error("Footer subscribe error:", err);
      }
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 5000);
    }
  };

  return (
    <footer className="footer-main" style={{ backgroundColor: transparent ? "transparent" : "#030303", color: transparent ? "var(--color-text-dark)" : "#ffffff" }}>
      {/* Footer Custom Compact Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap');
        
        .footer-main {
          position: relative;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          overflow: hidden;
          font-family: 'Manrope', sans-serif;
          margin-top: 3.5rem;
        }

        .shimmer-text {
          background: linear-gradient(90deg, #fef3c7 0%, #ffffff 100%);
          color: transparent;
          -webkit-background-clip: text;
          display: inline-block;
          vertical-align: baseline;
          font-family: 'Playfair Display', serif;
          font-style: italic;
        }

        .bottom-aura {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 1000px;
          height: 300px;
          background: radial-gradient(circle, rgba(198, 154, 91, 0.12) 0%, rgba(255, 255, 255, 0.01) 60%, transparent 100%);
          transform: translate(-50%, 0);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .footer-wrapper {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1.5rem 1.5rem 1.5rem;
        }

        @media (max-width: 768px) {
          .footer-wrapper {
            padding: 2rem 1rem 1rem 1rem;
          }
        }

        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.2rem;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .footer-brand-section {
          max-width: 600px;
          display: flex;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .footer-logo-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .footer-logo {
          height: 38px;
          width: auto;
          opacity: 0.95;
          transition: opacity 0.3s;
          filter: brightness(0) invert(1);
        }

        .footer-logo-text {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(254, 243, 199, 0.75);
        }

        .footer-grand-title {
          font-size: 1.6rem;
          font-weight: 300;
          letter-spacing: -0.01em;
          line-height: 1.2;
          color: #ffffff;
          margin: 0;
        }

        .footer-description {
          color: #9CA3AF;
          font-size: 0.8rem;
          font-weight: 300;
          line-height: 1.5;
          margin: 0;
          max-width: 450px;
        }

        .newsletter-form-wrapper {
          width: 100%;
          max-width: 320px;
          position: relative;
        }
        .newsletter-form-glow {
          position: absolute;
          top: -1px; left: -1px; right: -1px; bottom: -1px;
          background: linear-gradient(90deg, rgba(254,243,199,0.2) 0%, rgba(254,240,138,0.1) 50%, rgba(255,255,255,0.1) 100%);
          border-radius: 9999px;
          filter: blur(3px);
          opacity: 0.4;
          z-index: 1;
        }

        .newsletter-form {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          background: rgba(5, 5, 5, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 0.25rem;
        }

        .newsletter-input {
          flex-grow: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.75rem;
          padding: 0.5rem 1rem;
          outline: none;
          font-weight: 300;
        }
        .newsletter-input::placeholder {
          color: #6B7280;
        }

        .newsletter-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          padding: 0.6rem;
          border-radius: 9999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease-out;
        }
        .newsletter-btn:hover {
          background: #FEF3C7;
          color: #000000;
          border-color: #FEF3C7;
        }

        .joined-text {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #FEF3C7;
          padding: 0 0.4rem;
        }

        .operations-bar {
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-size: 0.7rem;
        }

        .operations-title {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: rgba(254, 243, 199, 0.7);
          text-transform: uppercase;
        }

        .country-pill {
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          color: #9CA3AF;
          transition: all 0.3s;
        }
        .country-pill:hover {
          background: rgba(198, 154, 91, 0.08);
          border-color: rgba(198, 154, 91, 0.2);
          color: #FEF3C7;
        }
        
        .country-pill-hq {
          padding: 0.25rem 0.5rem;
          background: rgba(198, 154, 91, 0.15);
          border: 1px solid rgba(198, 154, 91, 0.3);
          color: #FCD34D;
          font-weight: 700;
          border-radius: 6px;
        }

        .footer-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 50%, transparent 100%);
          margin-bottom: 2.2rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        .footer-grid-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .col-title {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #ffffff;
        }

        .col-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          font-size: 0.8rem;
          font-weight: 300;
          padding: 0;
          margin: 0;
        }

        .footer-link {
          color: #9CA3AF;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .footer-link:hover {
          color: #FEF3C7;
          transform: translateX(3px);
        }

        .whatsapp-link {
          color: #FCD34D;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }
        .whatsapp-link:hover {
          color: #FEF3C7;
          transform: translateX(3px);
        }

        .whatsapp-online-badge {
          font-size: 0.5rem;
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.05rem 0.3rem;
          font-weight: 700;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .discovery-call-btn {
          display: inline-block;
          padding: 0.45rem 1rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.7rem;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s;
          text-align: center;
        }
        .discovery-call-btn:hover {
          background: #FEF3C7;
          color: #000000;
          border-color: #FEF3C7;
        }

        .verify-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-weight: 500;
          color: #E5E7EB;
        }
        .verify-badge:hover {
          color: #FEF3C7;
        }

        .footer-bottom {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }

        .copyright-text {
          font-size: 0.7rem;
          font-weight: 300;
          color: #9CA3AF;
          letter-spacing: 0.05em;
        }

        .socials-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .social-btn {
          color: #9CA3AF;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.4rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .social-btn:hover {
          color: #FEF3C7;
          background: rgba(255, 255, 255, 0.08);
        }

        .justdial-btn {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.3rem 0.6rem;
          background: rgba(249, 115, 22, 0.08);
          color: #FDBA74;
          border: 1px solid rgba(249, 115, 22, 0.25);
          border-radius: 8px;
          transition: all 0.2s;
        }
        .justdial-btn:hover {
          background: rgba(249, 115, 22, 0.15);
          color: #FFedd5;
        }
      `}} />

      {/* Aura background glowing bulb */}
      <div className="bottom-aura" />

      {/* Footer Container */}
      <div className="footer-wrapper">
        {/* Top Section: The Grand Statement */}
        <div className="footer-top">
          <div className="footer-brand-section">
            <div className="footer-logo-row">
              <Link href="/">
                <Image src="/logo.png" alt="Kinetic Code Labs" width={110} height={30} className="footer-logo" />
              </Link>
              <span className="footer-logo-text">Kinetic Code Labs</span>
            </div>

            <h3 className="footer-grand-title">
              Build Your Digital <span className="shimmer-text">Future.</span>
            </h3>

            <p className="footer-description">
              Kanpur's premium software agency building custom web apps, programmatic SEO, and AI tools directly with developers.
            </p>
          </div>

          {/* Newsletter Box */}
          <div className="newsletter-form-wrapper">
            <div className="newsletter-form-glow" />
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for weekly updates..."
                className="newsletter-input"
                required={!subscribed}
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="newsletter-btn"
              >
                {subscribed ? (
                  <span className="joined-text">Joined ✓</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Global Operations Badge Bar */}
        <div className="operations-bar">
          <span className="operations-title">Serving Clients In:</span>
          <span className="country-pill">USA</span>
          <span className="country-pill">UK</span>
          <span className="country-pill">Germany</span>
          <span className="country-pill">Japan</span>
          <span className="country-pill">Australia</span>
          <span className="country-pill">Canada</span>
          <span className="country-pill">UAE</span>
          <span className="country-pill-hq">India HQ</span>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Grid Section: Links */}
        <div className="footer-grid">
          {/* Column 1: Platform */}
          <div className="footer-grid-col">
            <h4 className="col-title">Platform &amp; About</h4>
            <ul className="col-list">
              <li><a href="https://www.kineticcodelabs.in/about" target="_blank" rel="noopener noreferrer" className="footer-link">About Us &amp; Founder</a></li>
              <li><a href="https://www.kineticcodelabs.in/internship" target="_blank" rel="noopener noreferrer" className="footer-link">Student Internship Portal</a></li>
              <li><a href="https://www.kineticcodelabs.in/work" target="_blank" rel="noopener noreferrer" className="footer-link">Our Past Work &amp; Projects</a></li>
              <li><a href="https://www.kineticcodelabs.in/workspace" target="_blank" rel="noopener noreferrer" className="footer-link">Client Workspace Login</a></li>
              <li><a href="https://www.kineticcodelabs.in/blogs" target="_blank" rel="noopener noreferrer" className="footer-link">Technology Articles &amp; Blogs</a></li>
            </ul>
          </div>

          {/* Column 2: Our Services */}
          <div className="footer-grid-col">
            <h4 className="col-title">Our Services</h4>
            <ul className="col-list">
              <li><a href="https://www.kineticcodelabs.in/service/database-architecture" target="_blank" rel="noopener noreferrer" className="footer-link">Custom Website Architecture</a></li>
              <li><a href="https://www.kineticcodelabs.in/service/ai-engineering" target="_blank" rel="noopener noreferrer" className="footer-link">AI &amp; Smart Automation</a></li>
              <li><a href="https://www.kineticcodelabs.in/service/responsive-ui-ux-design" target="_blank" rel="noopener noreferrer" className="footer-link">Responsive UI/UX Design</a></li>
              <li><a href="https://www.kineticcodelabs.in/service/enterprise-software" target="_blank" rel="noopener noreferrer" className="footer-link">SaaS Platform Development</a></li>
              <li><a href="https://www.kineticcodelabs.in/service/e-commerce-solutions" target="_blank" rel="noopener noreferrer" className="footer-link">E-commerce Solutions</a></li>
            </ul>
          </div>

          {/* Column 3: Get In Touch */}
          <div className="footer-grid-col">
            <h4 className="col-title">Get In Touch</h4>
            <ul className="col-list">
              <li>
                <a href="https://wa.me/919470688754" target="_blank" rel="noreferrer" className="whatsapp-link">
                  <span>Chat directly on WhatsApp</span>
                  <span className="whatsapp-online-badge">Online</span>
                </a>
              </li>
              <li>
                <a href="mailto:support@kineticcodelabs.in" className="footer-link">
                  support@kineticcodelabs.in
                </a>
              </li>
              <li>
                <span style={{ color: "#9CA3AF", fontSize: "0.75rem", lineHeight: "1.4" }}>
                  HQ: Yashoda Nagar, Kanpur, UP, India (208011)
                </span>
              </li>
              <li style={{ paddingTop: "0.25rem" }}>
                <a href="https://www.kineticcodelabs.in/book" target="_blank" rel="noopener noreferrer" className="discovery-call-btn">
                  Book Free Discovery Call ➜
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Security */}
          <div className="footer-grid-col">
            <h4 className="col-title">Legal &amp; Security</h4>
            <ul className="col-list">
              <li>
                <a href="https://www.kineticcodelabs.in/privacy-policy" onClick={(e) => openLegalModal(e, "privacy")} className="footer-link">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://www.kineticcodelabs.in/terms-and-conditions" onClick={(e) => openLegalModal(e, "terms")} className="footer-link">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="https://www.kineticcodelabs.in/refund-policy" onClick={(e) => openLegalModal(e, "refund")} className="footer-link">
                  Refund Policy
                </a>
              </li>
              <li style={{ paddingTop: "0.1rem" }}>
                <a href="https://www.kineticcodelabs.in/get-certificate" target="_blank" rel="noopener noreferrer" className="verify-badge">
                  <span>Verify Student Diplomas</span>
                  <svg style={{ width: "12px", height: "12px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="footer-bottom">
          <p className="copyright-text">
            &copy; {currentYear} <span style={{ fontWeight: 600, color: "#ffffff" }}>Kinetic Code Labs</span>. Built in Kanpur by <a href="https://www.linkedin.com/in/kinetic-code-labs-132b77412" target="_blank" rel="noreferrer" style={{ color: "#FCD34D", fontWeight: 700 }}>Ajeet Prakash Yadav</a>.
          </p>

          {/* Socials */}
          <div className="socials-row">
            <a aria-label="LinkedIn" href="https://www.linkedin.com/in/kinetic-code-labs-132b77412" target="_blank" rel="noreferrer" className="social-btn">
              <svg style={{ width: "14px", height: "14px" }} fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a aria-label="Instagram" href="https://www.instagram.com/kineticcodelabs_" target="_blank" rel="noreferrer" className="social-btn">
              <svg style={{ width: "14px", height: "14px" }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a aria-label="X (Twitter)" href="https://x.com/yadavajit_spy" target="_blank" rel="noreferrer" className="social-btn">
              <svg style={{ width: "14px", height: "14px" }} fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L5.77 3.087H3.582l14.025 17.563z"/></svg>
            </a>
            <a aria-label="GitHub" href="https://github.com/kineticscodelabs-ux" target="_blank" rel="noreferrer" className="social-btn">
              <svg style={{ width: "14px", height: "14px" }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a aria-label="Justdial" href="https://www.justdial.com/Kanpur/Kinetic-Code-Labs-Yashoda-Nagar/0512PX512-X512-260513011900-W1I3_BZDET" target="_blank" rel="noreferrer" className="justdial-btn">
              ★ Justdial Verified
            </a>
          </div>
        </div>
      </div>

      <LegalModal
        isOpen={legalModal.open}
        initialTab={legalModal.tab}
        onClose={() => setLegalModal({ ...legalModal, open: false })}
      />
    </footer>
  );
}
