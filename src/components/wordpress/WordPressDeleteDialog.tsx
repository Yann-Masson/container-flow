import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteWordPressProject } from '@/store/slices/containerSlice';
import { selectOperationStatus } from '@/store/selectors/containerSelectors';

interface WordPressDeleteDialogProps {
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WordPressDeleteDialog({ projectName, open, onOpenChange }: WordPressDeleteDialogProps) {
  const dispatch = useAppDispatch();
  const operationStatus = useAppSelector(selectOperationStatus);
  const isDeleting = (operationStatus as any).deleting?.[projectName];
  const [value, setValue] = useState('');

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setValue('');
    }
  }, [open]);

  const handleDelete = async () => {
    if (isDeleting || value !== projectName) return;
    try {
      toast.info('🧨 Deleting project...', { description: projectName });
      const result = await dispatch(deleteWordPressProject(projectName));
      if (deleteWordPressProject.fulfilled.match(result)) {
        toast.success('✅ Project deleted', { description: projectName });
        onOpenChange(false);
      } else {
        toast.error('❌ Error deleting project', { description: (result as any).payload || 'Unknown error' });
      }
    } catch (e) {
      toast.error('❌ Error deleting project', { description: e instanceof Error ? e.message : 'Unknown error' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/80 backdrop-blur-md border-red-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Delete Project <Badge variant="destructive" className="text-[10px]">Danger</Badge></DialogTitle>
          <DialogDescription>
            This will permanently remove all containers, volumes and the database for <span className="font-medium text-foreground">{projectName}</span>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-xs text-red-300">Type <span className="font-semibold">{projectName}</span> to confirm.</p>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={projectName}
            className="w-full rounded-md bg-black/40 border border-red-500/30 focus:border-red-500/60 focus:ring-0 px-3 py-2 text-sm outline-none placeholder:text-red-400/40"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancel</Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || value !== projectName}
          >
            {isDeleting ? 'Deleting...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
