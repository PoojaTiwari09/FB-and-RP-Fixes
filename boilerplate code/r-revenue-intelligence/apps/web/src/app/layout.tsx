import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "../modules/m03-ai-summaries-genai/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "R-Revenue Intelligence Platform",
  description: "Enterprise-grade AI-powered revenue intelligence platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

import SessionSync from "@/modules/m05-account-intelligence/components/SessionSync";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ fontFamily: "var(--font-inter), var(--font-plus-jakarta), Inter, sans-serif", background: "#f9fafb" }}>
        <SessionSync />
        {children}
      </body>
    </html>
  );
}
