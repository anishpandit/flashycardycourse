'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EditDeckForm } from './edit-deck-form';

interface EditDeckDialogProps {
  deck: {
    id: number;
    name: string;
    description: string | null;
  };
  onClose: () => void;
}

export function EditDeckDialog({ deck, onClose }: EditDeckDialogProps) {
  const handleSuccess = () => {
    onClose();
    // The page will revalidate automatically due to server action revalidatePath
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Deck</CardTitle>
          <CardDescription>
            Update your deck information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditDeckForm 
            deck={deck} 
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
