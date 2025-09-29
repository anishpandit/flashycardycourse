'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteCardAction } from '@/lib/actions/card-actions';

interface DeleteCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number;
  cardFront: string;
  onSuccess?: () => void;
}

export function DeleteCardDialog({ 
  open, 
  onOpenChange, 
  cardId, 
  cardFront, 
  onSuccess 
}: DeleteCardDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCardAction({ id: cardId });
      if (result.success) {
        onSuccess?.();
        onOpenChange(false);
      } else {
        alert(result.error || 'Failed to delete card');
      }
    } catch (error) {
      alert('An unexpected error occurred while deleting the card');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this card? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-sm font-medium text-muted-foreground mb-1">Card to be deleted:</p>
            <p className="text-sm font-medium">"{cardFront}"</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete Card'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
