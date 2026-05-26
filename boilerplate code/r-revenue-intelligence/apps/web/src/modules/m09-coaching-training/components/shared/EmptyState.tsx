import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Inbox }: { title: string; description: string; actionLabel?: string; onAction?: () => void; icon?: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <Icon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      {actionLabel && onAction ? <Button className="mt-5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
