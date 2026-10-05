import { AppText } from './AppText';
import { cn } from './cn';

export type TimelineItem = { id: string; title: string; meta: string };

/** Vertical activity history. The rail connects events; text carries the meaning. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <li key={item.id} className="flex gap-3">
          <span aria-hidden className="flex w-3 flex-col items-center">
            <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', i === 0 ? 'bg-accent ring-4 ring-accent-soft' : 'bg-border-strong')} />
            {i < items.length - 1 && <span className="my-1 w-px flex-1 bg-border" />}
          </span>
          <span className={cn('flex min-w-0 flex-1 flex-col', i < items.length - 1 && 'pb-4')}>
            <AppText variant="text-strong">{item.title}</AppText>
            <AppText variant="small" tone="muted">
              {item.meta}
            </AppText>
          </span>
        </li>
      ))}
    </ol>
  );
}
