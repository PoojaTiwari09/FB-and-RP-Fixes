import "./globals.css";
import "../modules/m02-conversation-intelligence/styles/index.css";
import "../modules/m02-conversation-intelligence/styles/revenue-portal.css";
import "../modules/m02-conversation-intelligence/styles/light-theme.css";
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
