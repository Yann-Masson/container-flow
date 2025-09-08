import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Copy, Download, FileText, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";

interface ContainerLogsDialogProps {
    containerName: string;
    onGetLogs: () => Promise<string>;
    disabled?: boolean; // New prop to disable the dialog
}

export function ContainerLogsDialog({ containerName, onGetLogs, disabled = false }: ContainerLogsDialogProps) {
    const [logs, setLogs] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

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

    const copyToClipboard = async () => {
        if (logs) {
            await navigator.clipboard.writeText(logs);
        }
    };

    const downloadLogs = () => {
        if (logs) {
            const blob = new Blob([logs], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${containerName}-logs.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    // Function to clean ANSI escape sequences and other control characters
    const cleanLogLine = (line: string): string => {
        return line
            // Remove ANSI escape sequences (colors, cursor movements, etc.)
            .replace(/\x1b\[[0-9;]*m/g, '')
            // Remove other control characters but keep printable characters
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Remove replacement character (�)
            .replace(/\uFFFD/g, '');
    };

    const formatLogLine = (line: string, index: number) => {
        // Clean the line first
        const cleanedLine = cleanLogLine(line);

        const timestamp = cleanedLine.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        const isError = /error|Error|ERROR|fail|Fail|FAIL|exception|Exception|EXCEPTION/i.test(cleanedLine);
        const isWarning = /warn|Warning|WARNING|WARN/i.test(cleanedLine);
        const isInfo = /info|Info|INFO/i.test(cleanedLine);

        let lineClass = "text-gray-300";
        if (isError) lineClass = "text-red-400";
        else if (isWarning) lineClass = "text-yellow-400";
        else if (isInfo) lineClass = "text-blue-400";

        const highlightedLine = searchTerm
            ? cleanedLine.replace(
                new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                '<mark class="bg-yellow-300 text-black">$1</mark>'
            )
            : cleanedLine;

        return (
            <div key={index} className={`${lineClass} hover:bg-gray-800/50 px-2 py-0.5 leading-relaxed`}>
                {timestamp && (
                    <span className="text-gray-500 mr-2">
                        {timestamp[0]}
                    </span>
                )}
                <span dangerouslySetInnerHTML={{ __html: highlightedLine }}/>
            </div>
        );
    };

    const filteredLogs = logs && searchTerm
        ? logs.split('\n').filter(line =>
            cleanLogLine(line).toLowerCase().includes(searchTerm.toLowerCase())
        ).join('\n')
        : logs;

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                >
                    <FileText className="h-4 w-4"/>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] !max-w-11/12">
                <DialogHeader className="w-full">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Container Logs - {containerName}</span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="h-8 w-8 p-0"
                            >
                                <Search className="h-4 w-4"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchLogs}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyToClipboard}
                                disabled={!logs}
                                className="h-8 w-8 p-0"
                            >
                                <Copy className="h-4 w-4"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={downloadLogs}
                                disabled={!logs}
                                className="h-8 w-8 p-0"
                            >
                                <Download className="h-4 w-4"/>
                            </Button>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Logs en temps réel du conteneur • {logs?.split('\n').length || 0} lignes
                    </DialogDescription>
                </DialogHeader>

                {isSearchOpen && (
                    <div className="flex items-center gap-2 pb-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Rechercher dans les logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchTerm("");
                                setIsSearchOpen(false);
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                )}

                <ScrollArea className="max-h-[calc(90vh-120px)] p-4">
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center min-h-[calc(90vh-120px)]">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                                    <span className="text-sm text-gray-600">Chargement des logs...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-900 rounded-lg border border-gray-700">
                                <div className="bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <span className="text-sm text-gray-400 font-mono">
                                          {containerName} logs
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 font-mono text-sm space-y-0">
                                    {filteredLogs ? (
                                        filteredLogs.split('\n').map((line, index) =>
                                            formatLogLine(line, index)
                                        )
                                    ) : (
                                        <div className="text-gray-500 italic text-center py-8">
                                            Aucun log disponible
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
