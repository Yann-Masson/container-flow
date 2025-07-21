import { ContainerCreateOptions, ContainerInfo } from 'dockerode';
import { Card, CardContent, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ContainerDetailsDialog } from "./ContainerDetailsDialog";
import { ContainerDeleteDialog } from "./ContainerDeleteDialog";
import { ContainerLogsDialog } from "./ContainerLogsDialog";
import { ContainerDuplicateDialog } from "./ContainerDuplicateDialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { PlayIcon, SquareIcon } from "lucide-react";

interface ContainerCardProps {
    container: ContainerInfo;
    containerName: string;
    isRunning: boolean;
    isLoading: boolean;
    getStatusColor: (status: string) => string;
    getStatusText: (status: string) => string;
    getImageBadgeStyle: (image: string) => string;
    onStart: (containerId: string, containerName: string) => void;
    onStop: (containerId: string, containerName: string) => void;
    onGetLogs: (containerId: string, containerName: string) => Promise<string>;
    onDelete: (containerId: string, containerName: string) => void;
    onDuplicate: (containerId: string, containerConfig: ContainerCreateOptions, removeCurrentContainer: boolean) => void;
}

export function ContainerCard({
                                  container,
                                  containerName,
                                  isRunning,
                                  isLoading,
                                  getStatusColor,
                                  getStatusText,
                                  getImageBadgeStyle,
                                  onStart,
                                  onStop,
                                  onGetLogs,
                                  onDelete,
                                  onDuplicate
                              }: ContainerCardProps) {
    return (
        <ContainerDetailsDialog
            container={container}
            containerName={containerName}
            getImageBadgeStyle={getImageBadgeStyle}
            getStatusColor={getStatusColor}
        >
            <Card
                className="hover:shadow-md transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div className="flex-1 gap-3">
                            <CardTitle className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                {containerName}
                            </CardTitle>
                            <p className="text-xs text-gray-500">ID: {container.Id.substring(0, 12)}</p>
                            <div className="flex flex-wrap gap-2 my-2">
                                <Badge className={getImageBadgeStyle(container.Image)}>
                                    {container.Image}
                                </Badge>
                                <Badge variant="outline">{container.Status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Created
                                on {new Date(container.Created * 1000).toLocaleDateString()} at {new Date(container.Created * 1000).toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center">
                                <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(container.Status)}`}></div>
                                <span className="text-sm">{getStatusText(container.Status)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isRunning ? (
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStop(container.Id, containerName);
                                        }}
                                        variant="default"
                                        disabled={isLoading}
                                        className="h-8 w-8"
                                    >
                                        <SquareIcon className="w-4 h-4"/>
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStart(container.Id, containerName);
                                        }}
                                        variant="outline"
                                        disabled={isLoading}
                                        className="h-8 w-8 p-0"
                                    >
                                        <PlayIcon className="w-4 h-4"/>
                                    </Button>
                                )}

                                <div onClick={(e) => e.stopPropagation()}>
                                    <ContainerLogsDialog
                                        containerName={containerName}
                                        onGetLogs={() => onGetLogs(container.Id, containerName)}
                                    />
                                </div>

                                <div onClick={(e) => e.stopPropagation()}>
                                    <ContainerDeleteDialog
                                        containerName={containerName}
                                        onDelete={() => onDelete(container.Id, containerName)}
                                    />
                                </div>


                                <div onClick={(e) => e.stopPropagation()}>
                                    <ContainerDuplicateDialog
                                        containerId={container.Id}
                                        containerName={containerName}
                                        onDuplicate={onDuplicate}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </ContainerDetailsDialog>
    );
}
