import { Button } from "../ui/button";
import { FileText, Play, Square, Trash2 } from "lucide-react";

interface ContainerActionsProps {
    containerId: string;
    containerName: string;
    isRunning: boolean;
    isLoading: boolean;
    onStart: (containerId: string, containerName: string) => void;
    onStop: (containerId: string, containerName: string) => void;
    onShowLogs: (containerId: string, containerName: string) => void;
    onShowDeleteDialog: () => void;
}

export function ContainerActions({
                                     containerId,
                                     containerName,
                                     isRunning,
                                     isLoading,
                                     onStart,
                                     onStop,
                                     onShowLogs,
                                     onShowDeleteDialog
                                 }: ContainerActionsProps) {
    return (
            <div className="flex items-center gap-2">
                {/* Start/Stop Button */}
                {isRunning ? (
                        <Button
                                onClick={() => onStop(containerId, containerName)}
                                disabled={isLoading}
                                variant="outline"
                                className="h-8 w-8 p-0"
                        >
                            <Square className="h-4 w-4"/>
                        </Button>
                ) : (
                        <Button
                                onClick={() => onStart(containerId, containerName)}
                                disabled={isLoading}
                                variant="outline"
                                className="h-8 w-8 p-0"
                        >
                            <Play className="h-4 w-4"/>
                        </Button>
                )}

                {/* Logs Button */}
                <Button
                        onClick={() => onShowLogs(containerId, containerName)}
                        variant="outline"
                        className="h-8 w-8 p-0"
                >
                    <FileText className="h-4 w-4"/>
                </Button>

                {/* Delete Button */}
                <Button
                        onClick={onShowDeleteDialog}
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
    );
}
