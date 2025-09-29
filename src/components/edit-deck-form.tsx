'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateDeckAction } from '@/lib/actions/deck-actions';

interface EditDeckFormProps {
  deck: {
    id: number;
    name: string;
    description: string | null;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function EditDeckForm({ deck, onCancel, onSuccess }: EditDeckFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;

      const result = await updateDeckAction({ 
        id: deck.id, 
        name, 
        description: description || undefined 
      });
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to update deck');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Name</Label>
          <Input 
            id="edit-name" 
            name="name" 
            defaultValue={deck.name}
            placeholder="Enter deck name"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description (optional)</Label>
          <Textarea 
            id="edit-description" 
            name="description" 
            defaultValue={deck.description || ''}
            placeholder="Enter deck description"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
