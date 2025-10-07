import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Copy, Download, FileText, RefreshCw, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAppSelector } from '@/store/hooks';
import { selectOperationStatus } from '@/store/selectors/containerSelectors';
import { ScrollArea } from '../ui/scroll-area';

// Define the types that match the server-side implementation
interface ProcessedLogLine {
    original: string;
    cleaned: string;
    category: 'error' | 'warning' | 'info' | 'default';
    timestamp: string | null;
}

interface ProcessedLogs {
    lines: ProcessedLogLine[];
    totalLines: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
    searchTerm?: string;
}

interface LogSearchOptions {
    searchTerm?: string;
    page?: number;
    pageSize?: number;
}

interface ContainerLogsDialogProps {
    containerName: string;
    containerId: string;
    onGetLogs: (searchOptions?: LogSearchOptions) => Promise<ProcessedLogs>;
}

export function ContainerLogsDialog({
    containerName,
    containerId,
    onGetLogs,
}: ContainerLogsDialogProps) {
    const [processedLogs, setProcessedLogs] = useState<ProcessedLogs | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const operationStatus = useAppSelector(selectOperationStatus);

    // Debounce search to avoid server calls on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 150);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Server-side search when debounced term changes
    useEffect(() => {
        if (processedLogs && debouncedSearchTerm !== (processedLogs.searchTerm || '')) {
            fetchLogs(debouncedSearchTerm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm]);

    const fetchLogs = async (searchQuery?: string) => {
        setIsLoading(true);
        if (searchQuery !== undefined) {
            setIsSearching(true);
        }
        try {
            const searchOptions: LogSearchOptions = {};
            if (searchQuery) {
                searchOptions.searchTerm = searchQuery;
            }
            const logsData = await onGetLogs(searchOptions);
            setProcessedLogs(logsData);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setProcessedLogs({
                lines: [
                    {
                        original: 'Error fetching logs',
                        cleaned: 'Error fetching logs',
                        category: 'error',
                        timestamp: null,
                    },
                ],
                totalLines: 1,
                totalPages: 1,
                currentPage: 1,
                hasMore: false,
                searchTerm: searchQuery,
            });
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    const copyToClipboard = async () => {
        if (processedLogs) {
            const rawText = processedLogs.lines.map((line) => line.original).join('\n');
            await navigator.clipboard.writeText(rawText);
        }
    };

    const downloadLogs = () => {
        if (processedLogs) {
            const rawText = processedLogs.lines.map((line) => line.original).join('\n');
            const blob = new Blob([rawText], { type: 'text/plain' });
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

    const formatLogLine = (logLine: ProcessedLogLine, index: number, highlightTerm?: string) => {
        const { cleaned, timestamp, category } = logLine;

        let lineClass = 'text-gray-300';
        if (category === 'error') lineClass = 'text-red-400';
        else if (category === 'warning') lineClass = 'text-yellow-400';
        else if (category === 'info') lineClass = 'text-blue-400';

        const highlightedLine = highlightTerm
            ? cleaned.replace(
                  new RegExp(`(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                  '<mark class="bg-yellow-300 text-black">$1</mark>',
              )
            : cleaned;

        const baseClasses = `${lineClass} hover:bg-gray-800/50 px-3 py-1 leading-relaxed text-base font-medium whitespace-pre`;
        return (
            <div key={index} className={baseClasses}>
                {timestamp && <span className='text-gray-500 mr-2'>{timestamp}</span>}
                <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
            </div>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant='outline'
                    className='h-8 w-8 p-0 hidden sm:inline-flex'
                    disabled={operationStatus.removing[containerId]}
                    onClick={() => {
                        if (!processedLogs) fetchLogs();
                    }}
                >
                    <FileText className='h-4 w-4' />
                </Button>
            </DialogTrigger>
            {/* Wider dialog with larger max width for better horizontal viewing */}
            <DialogContent className='max-h-[90vh] w-[95vw] max-w-[1600px]'>
                <DialogHeader className='w-full'>
                    <DialogTitle className='flex items-center justify-between'>
                        <span>Container Logs - {containerName}</span>
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className='h-8 w-8 p-0'
                            >
                                <Search className='h-4 w-4' />
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => fetchLogs()}
                                disabled={isLoading}
                                className='h-8 w-8 p-0'
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                                />
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={copyToClipboard}
                                disabled={!processedLogs}
                                className='h-8 w-8 p-0'
                            >
                                <Copy className='h-4 w-4' />
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={downloadLogs}
                                disabled={!processedLogs}
                                className='h-8 w-8 p-0'
                            >
                                <Download className='h-4 w-4' />
                            </Button>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Real-time container logs • {processedLogs?.totalLines || 0} lines
                        {processedLogs?.searchTerm && ` • ${processedLogs.lines.length} displayed`}
                    </DialogDescription>
                </DialogHeader>

                {isSearchOpen && (
                    <div className='flex items-center gap-2 my-2'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <Input
                                placeholder='Search logs...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='pl-8'
                            />
                            {isSearching && (
                                <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent'></div>
                                </div>
                            )}
                        </div>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                setSearchTerm('');
                                setIsSearchOpen(false);
                            }}
                            className='h-8 w-8 p-0'
                        >
                            <X className='h-4 w-4' />
                        </Button>
                    </div>
                )}

                <ScrollArea
                    className={`p-4 overflow-auto select-text ${
                        isSearchOpen ? 'max-h-[calc(90vh-200px)]' : 'max-h-[calc(90vh-140px)]'
                    }`}
                    type='always'
                >
                    <div className='space-y-4'>
                        {isLoading ? (
                            <div
                                className={`flex items-center justify-center ${
                                    isSearchOpen
                                        ? 'min-h-[calc(90vh-200px)]'
                                        : 'min-h-[calc(90vh-140px)]'
                                }`}
                            >
                                <div className='flex items-center gap-2'>
                                    <div className='animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent'></div>
                                    <span className='text-sm text-gray-600'>Loading logs...</span>
                                </div>
                            </div>
                        ) : (
                            <div className='font-mono text-base space-y-0 min-w-fit'>
                                {(() => {
                                    // Show search results or all logs
                                    if (processedLogs?.lines && processedLogs.lines.length > 0) {
                                        return processedLogs.lines.map((logLine, index) =>
                                            formatLogLine(
                                                logLine,
                                                index,
                                                // Highlight the search term if we have one
                                                processedLogs.searchTerm || debouncedSearchTerm,
                                            ),
                                        );
                                    }

                                    // Show searching state
                                    if (isSearching) {
                                        return (
                                            <div className='flex items-center justify-center py-8'>
                                                <div className='flex items-center gap-2'>
                                                    <div className='animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent'></div>
                                                    <span className='text-sm text-gray-400'>
                                                        Searching logs...
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // No logs found message
                                    if (processedLogs?.searchTerm) {
                                        return (
                                            <div className='text-yellow-500 italic text-center py-8'>
                                                No logs match your search
                                            </div>
                                        );
                                    }

                                    // Default: no logs
                                    return (
                                        <div className='text-gray-500 italic text-center py-8'>
                                            No logs available
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export type { ProcessedLogLine, ProcessedLogs, LogSearchOptions };
