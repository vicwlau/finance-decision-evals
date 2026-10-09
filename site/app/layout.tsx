import { Tickmark } from "@vicwlau/tickmark/react";
import type { Metadata } from "next";
import { Fragment_Mono, Libre_Franklin, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Libre_Franklin({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
/** The section labels and the run stamp. */
const labelMono = Fragment_Mono({ subsets: ["latin"], weight: "400", variable: "--font-label", display: "swap" });

const title = "Jev on ASC 606 contract terms";
const description = "Where a calibrated decision model is weak on revenue-recognition triage, and the data that could help fix it.";

// The share image is app/opengraph-image.png (and twitter-image.png), built from site/design/og/a3.html.
export const metadata: Metadata = {
  metadataBase: new URL("https://jev-revrec.victorlau.dev"),
  title,
  description,
  openGraph: { title, description, type: "article", url: "/", siteName: "Victor Lau", authors: ["Victor Lau"] },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${labelMono.variable}`}>
      <body>
        {children}
        {/* Dev-only UI comments: Alt+C, click an element, comment. Stored by app/api/tickmark/route.ts. */}
        {process.env.NODE_ENV === "development" ? <Tickmark /> : null}
      </body>
    </html>
  );
}
