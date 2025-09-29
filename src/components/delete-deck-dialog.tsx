'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteDeckAction } from '@/lib/actions/deck-actions';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteDeckDialogProps {
  deck: {
    id: number;
    name: string;
  };
  onCancel: () => void;
}

export function DeleteDeckDialog({ deck, onCancel }: DeleteDeckDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteDeckAction({ id: deck.id });
      
      if (result.success) {
        // Redirect to dashboard after successful deletion
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to delete deck');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <CardTitle>Delete Deck</CardTitle>
              <CardDescription>This action cannot be undone</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Are you sure you want to delete <strong>"{deck.name}"</strong>? 
            This will permanently delete the deck and all its cards.
          </p>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
