interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-neutral-700">{title}</h3>
      {description && (
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
