interface RoleBadgeProps {
  role: string;
}

const roleStyles: Record<string, string> = {
  sales_manager: 'bg-blue-100 text-blue-800',
  sales_rep: 'bg-green-100 text-green-800',
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  rep: 'bg-green-100 text-green-800',
};

const roleLabels: Record<string, string> = {
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  admin: 'Admin',
  manager: 'Manager',
  rep: 'Rep',
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const style = roleStyles[role] || 'bg-gray-100 text-gray-800';
  const label = roleLabels[role] || role;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
