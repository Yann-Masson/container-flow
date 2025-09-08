import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface WordPressServiceSkeletonProps {
    count?: number;
}

export default function WordPressServiceSkeleton({ count = 3 }: WordPressServiceSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index} className="py-0">
                    <CardHeader className="p-4">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4" /> {/* Chevron */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-5" /> {/* Globe icon */}
                                        <Skeleton className="h-6 w-32" /> {/* Service name */}
                                    </div>
                                    <Skeleton className="h-4 w-48" /> {/* Container count description */}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-right text-sm space-y-2">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <Skeleton className="h-3 w-3" /> {/* Database icon */}
                                            <Skeleton className="h-4 w-16" /> {/* DB name */}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Skeleton className="h-3 w-3" /> {/* Globe icon */}
                                            <Skeleton className="h-4 w-24" /> {/* URL */}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8" /> {/* Minus button */}
                                    <Skeleton className="h-8 w-8" /> {/* Plus button */}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </>
    );
}
