import type { Metadata } from "next";
import "./globals.css";
import SessionSync from "@/components/SessionSync";

export const metadata: Metadata = {
  title: "Revenue Intelligence Dashboard",
  description: "Multi-role CRM-synced account management dashboard with AI-powered briefs and Q&A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionSync />
        {children}
      </body>
    </html>
  );
}
