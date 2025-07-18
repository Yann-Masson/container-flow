import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { ContainerInfo } from 'dockerode';

interface ContainerDetailsDialogProps {
    container: ContainerInfo;
    containerName: string;
    getImageBadgeStyle: (image: string) => string;
    getStatusColor: (status: string) => string;
    children: React.ReactNode;
}

export function ContainerDetailsDialog({
                                           container,
                                           containerName,
                                           getImageBadgeStyle,
                                           getStatusColor,
                                           children
                                       }: ContainerDetailsDialogProps) {
    return (
            <Dialog>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {containerName}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed container information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-1">ID</h3>
                                <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded overflow-auto break-all text-xs">
                                    {container.Id}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold mb-1">Image</h3>
                                <Badge className={`${getImageBadgeStyle(container.Image)} w-fit`}>
                                    {container.Image}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-1">Status</h3>
                            <div className="flex items-center">
                                <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(container.Status)}`}></div>
                                <span>{container.Status}</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-1">Created on</h3>
                            <p>{new Date(container.Created * 1000).toLocaleString()}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-1">Ports</h3>
                            {container.Ports && container.Ports.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {container.Ports.map((port, index) => (
                                                <Badge key={index} variant="outline"
                                                       className="bg-gray-100 dark:bg-gray-800">
                                                    {port.PublicPort ? `${port.PublicPort}:${port.PrivatePort}` : port.PrivatePort} {port.Type}
                                                </Badge>
                                        ))}
                                    </div>
                            ) : (
                                    <p className="text-sm text-gray-500">No exposed ports</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-1">Labels</h3>
                            {container.Labels && Object.keys(container.Labels).length > 0 ? (
                                    <div className="overflow-auto max-h-40 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                        {Object.entries(container.Labels).map(([key, value]) => (
                                                <div key={key} className="mb-1">
                                                    <span className="text-blue-600 dark:text-blue-400">{key}</span>: {value}
                                                </div>
                                        ))}
                                    </div>
                            ) : (
                                    <p className="text-sm text-gray-500">No labels</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
    );
}
