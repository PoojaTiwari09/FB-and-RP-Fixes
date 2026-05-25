import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Revenue Intelligence",
  description: "Revenue dashboard platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
