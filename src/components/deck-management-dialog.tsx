'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { EditDeckForm } from './edit-deck-form';
import { CardDialog } from './card-dialog';
import { deleteCardAction } from '@/lib/actions/card-actions';

interface DeckManagementDialogProps {
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
  onClose: () => void;
}

export function DeckManagementDialog({ deck, cards, onClose }: DeckManagementDialogProps) {
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<{ id: number; front: string; back: string } | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

  const handleEditCard = (card: { id: number; front: string; back: string }) => {
    setEditingCard(card);
    setShowCardDialog(true);
  };

  const handleAddCard = () => {
    setEditingCard(null);
    setShowCardDialog(true);
  };

  const handleCloseCardDialog = () => {
    setShowCardDialog(false);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId: number) => {
    setDeletingCardId(cardId);
    try {
      const result = await deleteCardAction({ id: cardId });
      if (!result.success) {
        alert(result.error || 'Failed to delete card');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setDeletingCardId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Deck</CardTitle>
                <CardDescription>Edit deck information and manage cards</CardDescription>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="info" className="h-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="info">Deck Info</TabsTrigger>
                <TabsTrigger value="cards">Cards ({cards.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="p-6 space-y-0">
                <EditDeckForm 
                  deck={deck} 
                  onCancel={onClose}
                  onSuccess={onClose}
                />
              </TabsContent>
              
              <TabsContent value="cards" className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cards</h3>
                  <Button onClick={handleAddCard}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {cards.length > 0 ? (
                    cards.map((card) => (
                      <Card key={card.id} className="relative">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Front</p>
                              <p className="text-sm">{card.front}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Back</p>
                              <p className="text-sm">{card.back}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">
                              {new Date(card.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditCard(card)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleDeleteCard(card.id)}
                                disabled={deletingCardId === card.id}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No cards yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-2" 
                        onClick={handleAddCard}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Card
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {showCardDialog && (
        <CardDialog
          deckId={deck.id}
          card={editingCard}
          onClose={handleCloseCardDialog}
        />
      )}
    </>
  );
}
