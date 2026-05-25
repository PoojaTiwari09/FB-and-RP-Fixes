import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "M6 Forecasting & Prediction — AI Revenue Predictor",
  description: "AI-powered revenue forecasting for Sales Reps. Submit commit forecasts, view AI projections, and understand deal-level breakdowns.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "#f9fafb" }}>
        {children}
      </body>
    </html>
  );
}
