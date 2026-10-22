import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-3xl bg-line/80", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="mt-4 h-6 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-5 h-12 w-full rounded-full" />
    </div>
  );
}
