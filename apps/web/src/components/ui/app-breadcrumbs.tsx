import { Link } from '@tanstack/react-router';

type BreadcrumbItem = {
  label: string;
  params?: Record<string, string>;
  search?: Record<string, string | undefined>;
  to?: string;
};

export function AppBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-fg-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}:${item.to ?? 'current'}`} className="flex items-center gap-1.5">
              {item.to && !isLast ? (
                <Link
                  params={item.params as never}
                  search={item.search as never}
                  to={item.to as never}
                  className="font-mono transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-mono text-fg">{item.label}</span>
              )}
              {!isLast ? <span className="font-mono text-fg-faint">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
