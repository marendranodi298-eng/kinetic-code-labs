import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kinetic-code-labs-nu.vercel.app"),
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
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Kinetic Code Labs | Global News, Tech, Entertainment & Education Portal",
    description: "Trending multi-format stories (news, photos, videos) across Tech, Bollywood, Hollywood, Education, and 100+ influential sectors.",
    url: "https://kinetic-code-labs-nu.vercel.app/",
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
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body style={{ backgroundColor: "var(--color-bg-light)", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
