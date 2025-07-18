import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function LoadingSkeleton() {
    return (
            <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                        <Card key={`skeleton-${i}`}
                              className="w-full mb-4 hover:shadow-md transition-shadow duration-300">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-6 w-3/4 mb-2"/>
                                <Skeleton className="h-4 w-1/2"/>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Skeleton className="h-6 w-20"/>
                                    <Skeleton className="h-6 w-24"/>
                                </div>
                                <Skeleton className="h-4 w-full mb-2"/>
                                <Skeleton className="h-4 w-2/3"/>
                            </CardContent>
                        </Card>
                ))}
            </div>
    );
}
