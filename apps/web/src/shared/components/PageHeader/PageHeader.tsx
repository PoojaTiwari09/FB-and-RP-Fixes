interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 bg-white">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
