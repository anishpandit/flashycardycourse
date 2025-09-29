'use client';

import { useState } from 'react';
import { CardDialog } from './card-dialog';
import { CardsList } from './cards-list';
import { DeleteCardDialog } from './delete-card-dialog';
import { useToast } from '@/components/ui/use-toast';

interface CardDialogWrapperProps {
  deckId: number;
  cards: Array<{
    id: number;
    front: string;
    back: string;
    createdAt: Date;
  }>;
  onCardAdded?: () => void;
  onCardUpdated?: () => void;
}

export function CardDialogWrapper({ deckId, cards, onCardAdded, onCardUpdated }: CardDialogWrapperProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<{
    id: number;
    front: string;
    back: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    cardId: number;
    cardFront: string;
  }>({
    open: false,
    cardId: 0,
    cardFront: ''
  });

  const handleAddCard = () => {
    setShowAddDialog(true);
  };

  const handleEditCard = (cardId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setEditingCard(card);
    }
  };

  const handleDeleteCard = (cardId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setDeleteDialog({
        open: true,
        cardId: cardId,
        cardFront: card.front
      });
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingCard(null);
  };

  const handleCardSuccess = (isEditing: boolean) => {
    handleCloseDialog();
    
    // Show success toast
    toast({
      title: isEditing ? "Card Updated" : "Card Created",
      description: isEditing 
        ? "Your card has been updated successfully." 
        : "Your new card has been added to the deck.",
      variant: "success",
    });
    
    // The page will automatically revalidate due to revalidatePath in the server action
  };

  const handleDeleteSuccess = () => {
    setDeleteDialog({ open: false, cardId: 0, cardFront: '' });
    
    // Show success toast
    toast({
      title: "Card Deleted",
      description: "The card has been removed from the deck.",
      variant: "success",
    });
    
    // The page will automatically revalidate due to revalidatePath in the server action
  };

  return (
    <>
      <CardsList 
        cards={cards}
        onAddCard={handleAddCard}
        onEditCard={handleEditCard}
        onDeleteCard={handleDeleteCard}
      />
      
      {showAddDialog && (
        <CardDialog
          deckId={deckId}
          onClose={handleCloseDialog}
          onSuccess={() => handleCardSuccess(false)}
        />
      )}
      
      {editingCard && (
        <CardDialog
          deckId={deckId}
          card={editingCard}
          onClose={handleCloseDialog}
          onSuccess={() => handleCardSuccess(true)}
        />
      )}

      <DeleteCardDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        cardId={deleteDialog.cardId}
        cardFront={deleteDialog.cardFront}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
