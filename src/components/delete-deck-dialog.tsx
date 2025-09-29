'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { deleteDeckAction } from '@/lib/actions/deck-actions';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteDeckDialogProps {
  deckId: number;
  deckName: string;
  onDelete?: () => void;
}

export function DeleteDeckDialog({ deckId, deckName, onDelete }: DeleteDeckDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    console.log('Attempting to delete deck:', deckId);
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteDeckAction({ id: deckId });
      console.log('Delete result:', result);
      
      if (result.success) {
        setIsOpen(false);
        onDelete?.();
        // Refresh the page to show updated deck list
        window.location.reload();
      } else {
        setError(result.error || 'Failed to delete deck');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Delete button clicked for deck:', deckId);
            setIsOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Deck</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{deckName}"? This action cannot be undone and will also delete all cards in this deck.
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
            onClick={() => setIsOpen(false)}
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
  );
}