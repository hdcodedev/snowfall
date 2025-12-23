import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Snowfall, SnowfallProvider, DebugPanel } from '@hdcodedev/snowfall';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "@hdcodedev/snowfall - Demo",
  description: "Realistic snowfall effect for React with physics-based accumulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SnowfallProvider>
          <Snowfall />
          <DebugPanel />
          {children}
        </SnowfallProvider>
      </body>
    </html>
  );
}
