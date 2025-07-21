import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface ContainerLogsDialogProps {
    containerName: string;
    onGetLogs: () => Promise<string>;
}

export function ContainerLogsDialog({ containerName, onGetLogs }: ContainerLogsDialogProps) {
    const [logs, setLogs] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const logsData = await onGetLogs();
            setLogs(logsData);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs('Error fetching logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    onClick={onGetLogs}
                    variant="outline"
                    className="h-8 w-8 p-0"
                >
                    <FileText className="h-4 w-4"/>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[600px]">
                <DialogHeader>
                    <DialogTitle>Container Logs - {containerName}</DialogTitle>
                    <DialogDescription>
                        Latest logs from the container
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2">Loading logs...</span>
                        </div>
                    ) : (
                        <div
                            className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-auto whitespace-pre-wrap">
                            {logs || 'No logs available'}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
