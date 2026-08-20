import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kineticcodelabs-blogs.vercel.app"),
  title: {
    template: "%s | Kinetic Code Labs Blog",
    default: "Kinetic Code Labs - Global News, Tech, Entertainment & Education Portal",
  },
  description: "Discover trending stories and multi-format blogs covering Technology, Entertainment, Bollywood, Hollywood, Education, and 100+ most influential categories across all global sectors.",
  verification: {
    google: "RKOM1eIEjWHIqrbBqzChQutXqwTEmQ-QG7ve6pSiHyA",
  },
  keywords: [
    "Kinetic Code Labs", "Kinetic Code Labs Blog", "Tech News Kanpur", "Bollywood Gossip", 
    "Hollywood Updates", "Education and Career Blogs", "Influential Blog Categories", 
    "Multi-format News Blogs", "Photo Stories", "Video Series", "Kanpur Software Developers",
    "Latest Tech Updates", "Global News Portal"
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Kinetic Code Labs | Global News, Tech, Entertainment & Education Portal",
    description: "Trending multi-format stories (news, photos, videos) across Tech, Bollywood, Hollywood, Education, and 100+ influential sectors.",
    url: "https://kineticcodelabs-blogs.vercel.app/",
    siteName: "Kinetic Code Labs",
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
    title: "Kinetic Code Labs | Global News, Tech, Entertainment & Education Portal",
    description: "Trending multi-format stories across Tech, Bollywood, Hollywood, Education, and 100+ influential sectors.",
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
