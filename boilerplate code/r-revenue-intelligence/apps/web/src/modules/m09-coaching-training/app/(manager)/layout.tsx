import { AppShell } from '@/components/layout/AppShell';
import { ManagerSidebar } from '@/components/layout/ManagerSidebar';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebar={<ManagerSidebar />}>{children}</AppShell>;
}
