import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Play } from "lucide-react";

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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold truncate">
          {deck.name}
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {deck.description || "No description"}
        </CardDescription>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Created {new Date(deck.createdAt).toLocaleDateString()}
          </span>
          <Button size="sm" className="h-8">
            <Play className="h-4 w-4 mr-1" />
            Study
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
