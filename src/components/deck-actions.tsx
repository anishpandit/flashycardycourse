'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { DeckManagementDialog } from './deck-management-dialog';
import { DeleteDeckDialog } from './delete-deck-dialog';

interface DeckActionsProps {
  deck: {
    id: number;
    name: string;
    description: string | null;
  };
  cards: Array<{
    id: number;
    front: string;
    back: string;
    createdAt: Date;
  }>;
}

export function DeckActions({ deck, cards }: DeckActionsProps) {
  const [showManagementDialog, setShowManagementDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowManagementDialog(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Deck
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Deck
        </Button>
      </div>

      {showManagementDialog && (
        <DeckManagementDialog 
          deck={deck}
          cards={cards}
          onClose={() => setShowManagementDialog(false)}
        />
      )}

      {showDeleteDialog && (
        <DeleteDeckDialog 
          deck={deck}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}
