'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardForm } from './card-form';

interface CardDialogProps {
  deckId: number;
  card?: {
    id: number;
    front: string;
    back: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function CardDialog({ deckId, card, onClose, onSuccess }: CardDialogProps) {
  const isEditing = !!card;

  const handleSuccess = () => {
    onClose();
    onSuccess?.();
    // The page will revalidate automatically due to server action revalidatePath
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Card' : 'Add New Card'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Update the card content' : 'Create a new flashcard for this deck'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CardForm 
            deckId={deckId}
            card={card}
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
