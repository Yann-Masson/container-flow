import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { ChevronRight, Database, ExternalLink, Globe } from 'lucide-react';
import { WordPressProject } from '@/store/types/container';

interface WordPressProjectHeaderProps {
  project: WordPressProject;
  isExpanded: boolean;
  runningCount: number;
  totalCount: number;
  onOpenUrl: () => void;
  disabled: boolean;
}

export function WordPressProjectHeader({
  project,
  isExpanded,
  runningCount,
  totalCount,
  onOpenUrl,
  disabled
}: WordPressProjectHeaderProps) {
  return (
    <div className="w-full relative z-10">
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5"/>
              <motion.span layoutId={`wp-title-${project.name}`}>{project.name}</motion.span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold text-foreground/90">{totalCount}</span>
                container{totalCount !== 1 ? 's' : ''}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold text-foreground/90">{runningCount}</span>
                running
              </span>
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-sm text-gray-400 mr-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center flex-nowrap gap-1">
                <Database className="h-3 w-3"/>
                {project.dbName}
              </span>
              <span className="flex items-center gap-1 max-w-[200px] min-w-0">
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">{project.url}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {project.url !== 'N/A' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenUrl}
                className="cursor-pointer hover:shadow-md hover:shadow-primary/20 transition"
                disabled={disabled}
              >
                <ExternalLink className="h-3 w-3"/>
                <span className="hidden xs:inline">Open</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="text-muted-foreground shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 truncate">
                <Globe className="h-5 w-5 shrink-0"/>
                <span className="truncate">{project.name}</span>
              </CardTitle>
              <CardDescription className="hidden min-[301px]:block text-xs">
                <p>{totalCount} container{totalCount !== 1 ? 's' : ''} • {runningCount} running</p>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {project.url !== 'N/A' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenUrl}
                className="cursor-pointer"
                disabled={disabled}
              >
                <ExternalLink className="h-3 w-3"/>
                <span className="hidden xs:inline">Open</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-row w-full items-center justify-around gap-2 text-sm text-gray-400 pl-7 hidden min-[301px]:flex">
          <span className="flex items-center gap-1 max-w-[200px] min-w-0">
            <Database className="h-3 w-3 shrink-0"/>
            <span className="truncate">{project.dbName}</span>
          </span>
          <span className="flex items-center gap-1 max-w-[200px] min-w-0">
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">{project.url}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
