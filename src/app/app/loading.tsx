import { Skeleton } from "@/components/ui";
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-40 mb-3" /><Skeleton className="h-9 w-3/4 max-w-lg mb-2" /><Skeleton className="h-5 w-1/2 max-w-sm mb-10" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
        <div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-5/6" /><Skeleton className="h-5 w-4/6" /><Skeleton className="h-5 w-5/6" /></div>
      </div>
    </div>
  );
}
