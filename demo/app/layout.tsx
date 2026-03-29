import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Snowfall, SnowfallProvider } from '@hdcodedev/snowfall';
import { Analytics } from "@vercel/analytics/next";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
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
        className={`${playfair.variable} ${dmSans.variable} antialiased grain-overlay`}
      >
        <SnowfallProvider>
          <Snowfall />
          {children}
        </SnowfallProvider>
        <Analytics />
      </body>
    </html>
  );
}
