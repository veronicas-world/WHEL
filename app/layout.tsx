import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";

// Typography per §07 of the design system.
// Two families, no more:
//   - Newsreader carries the editorial weight (headlines, body, long-form).
//   - IBM Plex Mono carries the technical voice (labels, captions, data).
// Backward-compat: the legacy --font-source-serif and --font-plex-sans
// variables are aliased to --font-newsreader in globals.css so existing
// inline fontFamily references continue to resolve.

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Women's Health Evidence Lab",
    template: "%s | Women's Health Evidence Lab",
  },
  description:
    "An evidence index for under-researched women's health conditions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#F2EEE5" }}>
        <Nav />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
