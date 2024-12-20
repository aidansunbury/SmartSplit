import { Skeleton } from "@/components/ui/skeleton";

export function FeedSkeleton() {
  return (
    <div className=" w-full max-w-[600px] pt-2 pr-4">
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <div key={i} className="flex items-start gap-4 border-b pb-6">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GroupSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col-reverse justify-center lg:flex-row">
        {/* Main Feed */}
        <FeedSkeleton />

        {/* Right Sidebar - Appears on top on mobile */}
        <div className="hidden w-56 lg:block">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
            <Skeleton className="mt-8 h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
