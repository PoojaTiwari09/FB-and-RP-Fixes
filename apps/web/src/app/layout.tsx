import type { Metadata } from "next";
import "./globals.css";
import Sidebar from '@shared/components/Sidebar/Sidebar';
import { getUserSession } from '@shared/lib/auth';
import { RoleProvider } from '@shared/context/RoleContext';

export const metadata: Metadata = {
  title: "Revenue Intelligence Platform",
  description:
    "Enterprise revenue intelligence platform with coaching, call analytics, and sales enablement.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getUserSession();

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full overflow-hidden bg-background text-foreground" suppressHydrationWarning>
        <RoleProvider session={session}>
          <div className="flex h-full overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
              {children}
            </div>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
