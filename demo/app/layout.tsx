import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { DemoSnow } from '@/components/DemoSnow';
import { Analytics } from "@vercel/analytics/next";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["300"],
  style: ["normal", "italic"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "500"],
});

export const metadata: Metadata = {
  title: "Snowfall — Cozy Snow for React",
  description: "GPU-rendered snowfall for React: depth, gusting wind, drifting piles on your elements. One prop, three presets.",
  openGraph: {
    title: "Snowfall — Cozy Snow for React",
    description: "GPU-rendered snowfall with drifting piles. One prop, three presets.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} antialiased`}
      >
        <DemoSnow>{children}</DemoSnow>
        <Analytics />
      </body>
    </html>
  );
}
