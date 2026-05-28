import type { ReactNode } from 'react';
/** Dashboard builder styles (do NOT import M02 index.css — it sets body { overflow: hidden }). */
import '@/app/globals.css';
import '@/modules/m02-conversation-intelligence/styles/revenue-portal.css';
import '@/modules/m02-conversation-intelligence/styles/light-theme.css';
import './m07-scroll.css';

export const metadata = {
  title: 'M07 Revenue Dashboards',
  description: 'Revenue dashboards and dataset builder',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
