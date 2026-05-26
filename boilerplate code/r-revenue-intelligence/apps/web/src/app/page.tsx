import Link from "next/link";
import { KpiCard } from "@/modules/m07-revenue-dashboards/components/kpi-card";

export default function HomePage() {
  return (
    <main className="shell grid">
      <section className="hero">
        <p>Revenue Intelligence Workspace</p>
        <h1>Build datasets, dashboards, and revenue views</h1>
        <p>
          Start in Dataset Builder to model your source data, then move into
          Dashboard Builder to add widgets, filters, and shareable views.
        </p>
        <div className="actions" style={{ marginTop: 16 }}>
          <Link href="/datasets" className="primary">Open Dataset Builder</Link>
          <Link href="/dashboards" className="secondary">Open Dashboard Builder</Link>
        </div>
      </section>

      <section className="builder-layout">
        <div className="card stack">
          <div className="section-head">
            <h2>Dataset Builder</h2>
            <span>Step-by-step modeling</span>
          </div>
          <p>Create datasets from CRM, calls, and transcriptions.</p>
          <p>Select objects, fields, define relationships, validate mappings, and preview sample rows before saving.</p>
          <Link href="/datasets" className="primary">Go to Dataset Builder</Link>
        </div>

        <div className="card stack">
          <div className="section-head">
            <h2>Dashboard Builder</h2>
            <span>Widget-based canvas</span>
          </div>
          <p>Add KPI, bar, line, pie, and funnel widgets dynamically.</p>
          <p>Configure X-axis, Y-axis metrics, filters, export snapshots, and create shareable links.</p>
          <Link href="/dashboards" className="primary">Go to Dashboard Builder</Link>
        </div>
      </section>

      <section className="kpis">
        <KpiCard label="Bookings" value="$100k" subtitle="Sample workspace KPI" />
        <KpiCard label="% Target Attainment" value="67%" subtitle="Backend governed metric" />
        <KpiCard label="Win Rate" value="50%" subtitle="Sales rep snapshot" />
      </section>
    </main>
  );
}
