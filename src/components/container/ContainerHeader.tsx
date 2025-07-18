import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { State } from "@/types/state.ts";

interface ContainerHeaderProps {
    state: State;
    message: string;
    error: string;
}

export function ContainerHeader({ state, message, error }: ContainerHeaderProps) {
    return (
            <Card className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Docker Container Manager</CardTitle>
                </CardHeader>
                <CardContent>
                    {state === State.SUCCESS && (
                            <Badge variant="outline"
                                   className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                                {message}
                            </Badge>
                    )}

                    {state === State.ERROR && (
                            <Badge variant="outline"
                                   className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700">
                                {error}
                            </Badge>
                    )}

                    {state === State.LOADING && (
                            <Badge variant="outline"
                                   className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 animate-pulse">
                                Loading containers...
                            </Badge>
                    )}
                </CardContent>
            </Card>
    );
}
