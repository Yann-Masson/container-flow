import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, Minus, Plus, Settings, Trash } from 'lucide-react';
import { itemVariants } from './variants';

interface WordPressProjectActionsProps {
  dbName: string;
  url: string;
  disabled: boolean;
  isCloning: boolean;
  canRemoveInstance: boolean;
  onCopy: (value: string, label: string) => void;
  onChangeUrl: () => void;
  onRemoveInstance: () => void;
  onAddInstance: () => void;
  onDeleteProject: () => void;
  isDeleting: boolean;
}

export function WordPressProjectActions({
  dbName,
  url,
  disabled,
  isCloning,
  canRemoveInstance,
  onCopy,
  onChangeUrl,
  onRemoveInstance,
  onAddInstance,
  onDeleteProject,
  isDeleting
}: WordPressProjectActionsProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full p-3 bg-gradient-to-r from-black/70 to-black/40 rounded-lg gap-3"
    >
      <span className="text-sm font-medium sm:ml-4 tracking-wide text-foreground/90 flex items-center gap-2">
        Actions
      </span>
      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(dbName, 'Database name')}
          className="cursor-pointer hover:shadow hover:shadow-primary/20 transition"
          disabled={disabled}
        >
          <Copy className="h-3 w-3 mr-1"/>
          <span className="hidden md:inline">Copy DB</span>
          <span className="md:hidden">DB</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(`https://${url}`, 'URL')}
          className="cursor-pointer hover:shadow hover:shadow-primary/20 transition"
          disabled={disabled}
        >
          <Copy className="h-3 w-3 mr-1"/>
          <span className="hidden md:inline">Copy URL</span>
          <span className="md:hidden">URL</span>
        </Button>
        <Button
            size="sm"
            variant="outline"
            onClick={onChangeUrl}
            className="cursor-pointer hover:shadow hover:shadow-primary/20 transition"
            disabled={disabled}
        >
            <Settings className="h-3 w-3 mr-1"/>
            <span className="hidden md:inline">Change URL</span>
            <span className="md:hidden">URL</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRemoveInstance}
          disabled={!canRemoveInstance || disabled}
          className="hover:shadow hover:shadow-primary/20 transition"
        >
          <Minus className="h-3 w-3"/>
          <span className="hidden md:block">Remove</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddInstance}
          disabled={isCloning || disabled}
          className="hover:shadow hover:shadow-primary/20 transition"
        >
          <Plus className="h-3 w-3"/>
          <span className="hidden md:inline">Add</span>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDeleteProject}
          disabled={isDeleting || disabled}
          className="hover:shadow hover:shadow-red-500/30 transition"
        >
            <span className="flex items-center gap-2">
                {isDeleting ? (
                    <span className="h-2 w-2 animate-ping rounded-full bg-red-500"/>
                ) : (
                   <Trash className="h-3 w-3"/>
                )}
            <span>Delete</span>
            </span>
        </Button>
      </div>
    </motion.div>
  );
}
