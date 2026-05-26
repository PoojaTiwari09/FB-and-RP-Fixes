import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../modules/m03-ai-summaries-genai/app/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "SalesIQ AI Assistant",
  description: "SalesIQ AI Copilot",
};

import SessionSync from "@/modules/m05-account-intelligence/components/SessionSync";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        <SessionSync />
        {children}
      </body>
    </html>
  );
}
