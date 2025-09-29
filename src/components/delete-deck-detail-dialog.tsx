'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteDeckAction } from '@/lib/actions/deck-actions';
import { useRouter } from 'next/navigation';

interface DeleteDeckDetailDialogProps {
  deck: {
    id: number;
    name: string;
    description: string | null;
  };
  onCancel: () => void;
}

export function DeleteDeckDetailDialog({ deck, onCancel }: DeleteDeckDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    console.log('Attempting to delete deck:', deck.id);
    setIsLoading(true);
    setIsDeleting(true);
    setError(null);

    try {
      // The server action will handle the redirect
      await deleteDeckAction({ id: deck.id });
    } catch (err) {
      console.error('Delete error:', err);
      setError('An unexpected error occurred');
      setIsDeleting(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deck</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deck.name}"? This action cannot be undone and will also delete all cards in this deck.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Deck'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Loading overlay to prevent error page flash */}
      {isDeleting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Deleting deck...</p>
          </div>
        </div>
      )}
    </>
  );
}
