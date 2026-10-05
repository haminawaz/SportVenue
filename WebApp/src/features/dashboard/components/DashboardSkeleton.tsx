import { Skeleton } from '@/ui/Skeleton';

/** Mirrors the loaded layout (stat row, two columns of cards) so nothing jumps. */
export function DashboardSkeleton() {
  return (
    <div role="progressbar" aria-label="Loading dashboard" aria-busy className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="surface-card flex flex-col gap-3 p-5">
            <Skeleton width="55%" height={12} />
            <Skeleton width="70%" height={28} />
            <Skeleton width="45%" height={12} />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="surface-card flex flex-col gap-4 p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={16} width={`${92 - i * 8}%`} />
          ))}
        </div>
        <div className="surface-card flex flex-col gap-3 p-5">
          <Skeleton height={44} />
          <Skeleton height={36} />
        </div>
      </div>
    </div>
  );
}
