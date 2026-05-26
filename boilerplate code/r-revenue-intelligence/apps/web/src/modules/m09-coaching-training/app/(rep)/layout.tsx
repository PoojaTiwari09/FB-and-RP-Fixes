import { AppShell } from '@/components/layout/AppShell';
import { RepSidebar } from '@/components/layout/RepSidebar';

export default function RepLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebar={<RepSidebar />}>{children}</AppShell>;
}
