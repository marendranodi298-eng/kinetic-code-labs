import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://journal.kineticcodelabs.in"),
  title: {
    template: "%s | Kinetic Code Labs Journal",
    default: "Kinetic Code Labs Journal — Interactive 3D Simulations, Science, Deep Tech & Engineering",
  },
  description: "Explore interactive 3D science simulations, software engineering, AI breakthroughs, astrophysics, and in-depth technical research by Ajeet Prakash Yadav at Kinetic Code Labs (www.kineticcodelabs.in).",
  verification: {
    google: "5HYx-IQlYm3qUVXkbBvJHgxabhqwZEKb2DGDk6JUZjM",
  },
  authors: [
    { name: "Ajeet Prakash Yadav", url: "https://www.kineticcodelabs.in" }
  ],
  creator: "Ajeet Prakash Yadav",
  publisher: "Kinetic Code Labs",
  alternates: {
    canonical: "https://journal.kineticcodelabs.in",
  },
  keywords: [
    // Top 50 High-Search Keywords & Categories
    "Kinetic Code Labs", "Ajeet Prakash Yadav", "journal.kineticcodelabs.in", "www.kineticcodelabs.in",
    "Interactive 3D Simulations", "WebGL Shaders", "Three.js Engineering", "Astrophysics Black Hole Simulation",
    "Software Engineering", "Artificial Intelligence", "Next.js 15 Full Stack", "Quantum Computing",
    "Machine Learning", "Robotics", "Mechanical CAD & 4-Stroke Engines", "Cybersecurity",
    "Cloud Architecture", "Biotechnology & Genetics", "DNA Transcription 3D", "Aerospace Flight Dynamics",
    "Thermodynamics", "Full-Stack Web Development", "Neuroscience", "Electric Vehicles",
    "Clean Energy & Fusion", "Mathematics & Algorithms", "Nanotechnology", "Autonomous Systems",
    "Data Science", "DevOps & CI/CD", "Computer Vision", "Game Engine Architecture",
    "FinTech & Cryptography", "Semiconductors & VLSI", "Mobile App Engineering", "Cellular Biology",
    "Astronomy & Space Exploration", "Generative AI & LLMs", "Particle Physics", "Materials Science",
    "Orbital Mechanics & Rocket Escape", "Industrial Automation", "High-Performance Computing",
    "Distributed Systems", "Computational Fluid Dynamics", "Deep Tech Startups", "Augmented Reality & WebXR",
    "API Architecture", "Database Optimization", "Compiler Design", "Biomedical Engineering",
    "Edge Computing", "Kinetic Simulation Labs", "Tech Career Insights", "Global Innovation Portal"
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "Kinetic Code Labs Journal — Interactive 3D Simulations & Deep Tech",
    description: "A flagship deep-tech publishing platform by Ajeet Prakash Yadav featuring live 60 FPS 3D simulations, astrophysics, AI, and software engineering.",
    url: "https://journal.kineticcodelabs.in/",
    siteName: "Kinetic Code Labs Journal",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Kinetic Code Labs Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kinetic Code Labs Journal — Interactive 3D Simulations & Deep Tech",
    description: "A flagship deep-tech publishing platform by Ajeet Prakash Yadav featuring live 60 FPS 3D simulations, astrophysics, AI, and software engineering.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="5HYx-IQlYm3qUVXkbBvJHgxabhqwZEKb2DGDk6JUZjM" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" 
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ backgroundColor: "var(--color-bg-light)", minHeight: "100vh" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true,
                  processEnvironments: true
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                }
              };
            `,
          }}
        />
        <script
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          id="MathJax-script"
          async
        />
        {children}
      </body>
    </html>
  );
}
