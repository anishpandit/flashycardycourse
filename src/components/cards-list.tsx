import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CardDisplay } from "./card-display";

interface CardsListProps {
  cards: Array<{
    id: number;
    front: string;
    back: string;
    createdAt: Date;
  }>;
  onAddCard?: () => void;
  onEditCard?: (cardId: number) => void;
  onDeleteCard?: (cardId: number) => void;
}

export function CardsList({ cards, onAddCard, onEditCard, onDeleteCard }: CardsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cards</h2>
        {onAddCard && (
          <Button onClick={onAddCard}>
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        )}
      </div>

      {cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <CardDisplay
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No cards yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first card to start building this deck
          </p>
          {onAddCard && (
            <Button onClick={onAddCard}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Card
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
