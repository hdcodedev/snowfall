import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Snowfall, SnowfallProvider, DebugPanel } from '@hdcodedev/snowfall';
import { Analytics } from "@vercel/analytics/next";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Snowfall — Realistic Snow Physics for React",
  description: "A refined snowfall effect with physics-based accumulation, wind, melting, and surface detection. Built for React.",
  openGraph: {
    title: "Snowfall — Realistic Snow Physics for React",
    description: "Physics-based snow accumulation with wind, melting, and smart surface detection.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${display.variable} ${body.variable} antialiased frost-grain`}
      >
        <SnowfallProvider>
          <Snowfall />
          <DebugPanel />
          {children}
        </SnowfallProvider>
        <Analytics />
      </body>
    </html>
  );
}
