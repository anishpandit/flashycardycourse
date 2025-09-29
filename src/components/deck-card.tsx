import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

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
    <Link href={`/decks/${deck.id}`} className="block group">
      <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer">
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
      </Card>
    </Link>
  );
}
