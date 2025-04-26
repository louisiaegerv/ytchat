import { Card, Skeleton } from "@/components/ui";

interface LoadingSkeletonProps {
  count?: number;
  viewMode?: "grid" | "list";
}

export default function LoadingSkeleton({
  count = 6,
  viewMode = "grid",
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count });

  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
      }
    >
      {skeletons.map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-3 w-1/4" />
        </Card>
      ))}
    </div>
  );
}
