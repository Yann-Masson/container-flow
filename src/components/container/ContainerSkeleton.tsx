import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface ContainerSkeletonProps {
    count?: number;
}

export function ContainerSkeleton({ count = 3 }: ContainerSkeletonProps) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card
                    key={`skeleton-${i}`}
                    variant="glass"
                    accent="glow"
                    interactive={false}
                    withHoverOverlay
                    className="group relative py-4 overflow-hidden"
                >
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center gap-6">
                            {/* Left Column (matches ContainerCard content flow) */}
                            <div className="flex-1 space-y-2 min-w-0">
                                {/* Title / Name */}
                                <Skeleton className="h-5 w-1/3 rounded-md" />
                                {/* ID line */}
                                <Skeleton className="h-3 w-1/4 rounded" />
                                {/* Badges row */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                {/* Created line */}
                                <Skeleton className="h-3 w-2/5 rounded" />
                            </div>

                            {/* Right Column (status + actions) */}
                            <div className="flex flex-row items-center justify-center gap-3">
                                {/* Status indicator (dot + text) */}
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-gradient-to-br from-slate-400/40 to-slate-500/30 animate-pulse" />
                                    <Skeleton className="h-3 w-14" />
                                </div>
                                {/* Action buttons row */}
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
