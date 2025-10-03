import docker from '../index.ts';
import { ContainerLogsOptions } from 'dockerode';

// Server-side log processing utilities
const cleanLogLine = (line: string): string => {
    return line
        // Remove carriage returns and other whitespace control characters that cause overwriting
        .replace(/\r/g, '')
        // Strip ANSI CSI sequences ending with any alphabetic command
        .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
        // Strip OSC sequences (e.g., hyperlinks)
        .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, '')
        // Remove remaining non-printable control characters
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        .replace(/\uFFFD/g, '');
};

const categorizeLogLine = (line: string): ProcessedLogLine => {
    const cleanedLine = cleanLogLine(line);
    const timestamp = cleanedLine.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    const isError = /error|Error|ERROR|fail|Fail|FAIL|exception|Exception|EXCEPTION/i.test(cleanedLine);
    const isWarning = /warn|Warning|WARNING|WARN/i.test(cleanedLine);
    const isInfo = /info|Info|INFO/i.test(cleanedLine);
    
    let category: 'error' | 'warning' | 'info' | 'default' = 'default';
    if (isError) category = 'error';
    else if (isWarning) category = 'warning';
    else if (isInfo) category = 'info';
    
    return {
        original: line,
        cleaned: cleanedLine,
        category,
        timestamp: timestamp ? timestamp[0] : null
    };
};

interface ProcessedLogLine {
    original: string;
    cleaned: string;
    category: 'error' | 'warning' | 'info' | 'default';
    timestamp: string | null;
}

interface LogSearchOptions {
    searchTerm?: string;
    page?: number;
    pageSize?: number;
}

interface ProcessedLogs {
    lines: ProcessedLogLine[];
    totalLines: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
}

const decodeDockerLogBuffer = (buffer: Buffer): string => {
    const frames: string[] = [];
    let offset = 0;

    while (offset < buffer.length) {
        // Docker multiplexed logs use an 8-byte header: [stream, 0,0,0, size(4 bytes BE)]
        if (offset + 8 > buffer.length) {
            break;
        }

        const streamType = buffer[offset];
        const frameLength = buffer.readUInt32BE(offset + 4);
        const frameStart = offset + 8;
        const frameEnd = frameStart + frameLength;

        if (frameLength < 0 || frameEnd > buffer.length) {
            // Not a multiplexed buffer, bail out and return raw string
            return buffer.toString('utf8');
        }

        if (streamType <= 2) {
            frames.push(buffer.slice(frameStart, frameEnd).toString('utf8'));
        }

        offset = frameEnd;
    }

    if (!frames.length) {
        return buffer.toString('utf8');
    }

    return frames.join('');
};

/**
 * Get logs from a container with optional search and pagination
 * @param {string} containerId - The ID or name of the container
 * @param {ContainerLogsOptions} options - Options for the logs
 * @param {LogSearchOptions} searchOptions - Search and pagination options
 * @returns {Promise<ProcessedLogs>} A promise that resolves with processed logs
 */
export const getLogs = async (
    containerId: string,
    options: ContainerLogsOptions = {},
    searchOptions: LogSearchOptions = {}
): Promise<ProcessedLogs> => {
    try {
        const client = docker.client.getClient();
        if (!client) {
            return Promise.reject(new Error('Docker client not connected'));
        }

        const container = client.getContainer(containerId);

        // Set default options
        const logOptions: ContainerLogsOptions & { follow?: false } = {
            stdout: options.stdout ?? true,
            stderr: options.stderr ?? true,
            follow: false,
            ...(options.tail !== undefined && { tail: options.tail }),
            since: options.since,
            until: options.until,
            timestamps: options.timestamps ?? false,
        };

        // Get container logs
        const logStream = await container.logs(logOptions);

        return new Promise<ProcessedLogs>((resolve) => {
            if (Buffer.isBuffer(logStream)) {
                const rawLogs = decodeDockerLogBuffer(logStream);
                const allLines = rawLogs.split('\n').filter(line => line.trim());
                
                // Process all lines
                const processedLines = allLines.map(line => categorizeLogLine(line));
                
                // Apply search filter if provided
                let filteredLines = processedLines;
                if (searchOptions.searchTerm && searchOptions.searchTerm.length >= 2) {
                    const searchTerm = searchOptions.searchTerm.toLowerCase();
                    filteredLines = processedLines.filter(line => 
                        line.cleaned.toLowerCase().includes(searchTerm)
                    );
                }
                
                // Apply pagination
                const pageSize = searchOptions.pageSize || 1000; // Default to 1000 lines per page
                const currentPage = searchOptions.page || 1;
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedLines = filteredLines.slice(startIndex, endIndex);
                
                resolve({
                    lines: paginatedLines,
                    totalLines: filteredLines.length,
                    totalPages: Math.ceil(filteredLines.length / pageSize),
                    currentPage,
                    hasMore: endIndex < filteredLines.length
                });
            } else {
                resolve({
                    lines: [],
                    totalLines: 0,
                    totalPages: 0,
                    currentPage: 1,
                    hasMore: false
                });
            }
        });
    } catch (error) {
        console.error('Error getting container logs:', error);
        return Promise.reject(error);
    }
};

// Keep the old simple function for backward compatibility
export const getLogsRaw = async (
    containerId: string,
    options: ContainerLogsOptions = {},
): Promise<string> => {
    try {
        const result = await getLogs(containerId, options);
        return result.lines.map(line => line.original).join('\n');
    } catch (error) {
        return Promise.reject(error);
    }
};

// Export types for use in other files
export type { ProcessedLogLine, LogSearchOptions, ProcessedLogs };
