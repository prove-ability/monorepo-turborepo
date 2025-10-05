import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-6" role="banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div aria-hidden="true">{icon}</div>}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        {action && <div role="navigation" aria-label="페이지 액션">{action}</div>}
      </div>
      {description && (
        <p className="text-sm text-gray-600 mt-1" role="doc-subtitle">{description}</p>
      )}
    </header>
  );
}
