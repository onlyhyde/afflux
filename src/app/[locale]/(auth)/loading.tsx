import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Skeleton className="h-96 w-96 rounded-lg" />
    </div>
  );
}
