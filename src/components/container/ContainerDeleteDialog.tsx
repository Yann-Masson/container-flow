import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

interface ContainerDeleteDialogProps {
    containerName: string;
    onDelete: () => void;
}

export function ContainerDeleteDialog({ containerName, onDelete }: ContainerDeleteDialogProps) {
    return (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Container</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the container "{containerName}"?
                            This action cannot be undone and will permanently remove the container.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                                onClick={onDelete}
                                className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
    );
}
