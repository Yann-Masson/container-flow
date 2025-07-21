import { Card, CardContent, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { State } from "@/types/state.ts";
import { Button } from "@/components/ui/button.tsx";
import { RefreshCw } from "lucide-react";

interface ContainerHeaderProps {
    state: State,
    message: string,
    refreshFunction?: () => Promise<void>
}

export function ContainerHeader({ state, message, refreshFunction }: ContainerHeaderProps) {
    return (
        <Card
            className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-none shadow-lg">
            <CardContent className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold mb-6">Docker Container Manager</CardTitle>
                    {state === State.SUCCESS && (
                        <Badge variant="outline"
                               className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                            {message}
                        </Badge>
                    )}

                    {state === State.ERROR && (
                        <Badge variant="outline"
                               className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700">
                            {message || "An error occurred while loading containers."}
                        </Badge>
                    )}

                    {state === State.LOADING && (
                        <Badge variant="outline"
                               className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 animate-pulse">
                            Loading containers...
                        </Badge>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={refreshFunction}
                    disabled={state === State.LOADING}
                >
                    <RefreshCw className={state === State.LOADING ? "animate-spin" : ""}/>
                </Button>
            </CardContent>
        </Card>
    );
}
