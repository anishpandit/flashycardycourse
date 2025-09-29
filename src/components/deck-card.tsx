import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { DeleteDeckDialog } from "./delete-deck-dialog";

interface DeckCardProps {
  deck: {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function DeckCard({ deck }: DeckCardProps) {
  return (
    <Card className="relative hover:shadow-lg hover:border-primary/20 transition-all duration-200 group">
      <div className="flex">
        <Link href={`/decks/${deck.id}`} className="flex-1 block">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
              {deck.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {deck.description || "No description"}
            </CardDescription>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Created {new Date(deck.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                <span className="mr-1">View deck</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </CardContent>
        </Link>
        
        {/* Delete button - positioned in top right */}
        <div className="absolute top-2 right-2 z-10">
          <DeleteDeckDialog deckId={deck.id} deckName={deck.name} />
        </div>
      </div>
    </Card>
  );
}
