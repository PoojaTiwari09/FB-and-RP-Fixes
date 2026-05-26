import { SharedDashboardClient } from "@/modules/m07-revenue-dashboards/components/shared-dashboard-client";

export default function SharedDashboardPage({ params }: { params: { token: string } }) {
  return <SharedDashboardClient token={params.token} />;
}
