'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createCardAction, updateCardAction } from '@/lib/actions/card-actions';

interface CardFormProps {
  deckId: number;
  card?: {
    id: number;
    front: string;
    back: string;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function CardForm({ deckId, card, onCancel, onSuccess }: CardFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!card;

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const front = formData.get('front') as string;
      const back = formData.get('back') as string;

      let result;
      if (isEditing) {
        result = await updateCardAction({ 
          id: card.id, 
          front, 
          back 
        });
      } else {
        result = await createCardAction({ 
          deckId, 
          front, 
          back 
        });
      }
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || `Failed to ${isEditing ? 'update' : 'create'} card`);
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
          <Label htmlFor="card-front">Front</Label>
          <Textarea 
            id="card-front" 
            name="front" 
            defaultValue={card?.front || ''}
            placeholder="Enter the front side of the card"
            rows={3}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="card-back">Back</Label>
          <Textarea 
            id="card-back" 
            name="back" 
            defaultValue={card?.back || ''}
            placeholder="Enter the back side of the card"
            rows={3}
            required
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
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Card' : 'Create Card')
            }
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
