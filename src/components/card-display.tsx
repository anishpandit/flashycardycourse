import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface CardDisplayProps {
  card: {
    id: number;
    front: string;
    back: string;
    createdAt: Date;
  };
  onEdit?: (cardId: number) => void;
  onDelete?: (cardId: number) => void;
}

export function CardDisplay({ card, onEdit, onDelete }: CardDisplayProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Front
        </CardTitle>
        <CardDescription className="text-base text-foreground font-normal">
          {card.front}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Back
          </p>
          <p className="text-base text-foreground">
            {card.back}
          </p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {new Date(card.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-1">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onEdit(card.id)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onDelete(card.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
