import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { deckService } from '@/lib/services/deck-service';
import { DeckCard } from '@/components/deck-card';
import { CreateDeckForm } from '@/components/create-deck-form';

export default async function DashboardPage() {
  // Authenticate user following security requirements
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user's decks using the service layer (user-scoped queries)
  const decks = await deckService.getUserDecks(userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your Flashcard Decks</h1>
          <p className="text-muted-foreground">
            Create and manage your flashcard decks to enhance your learning
          </p>
        </div>

        {/* Deck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create new deck form */}
          <CreateDeckForm />
          
          {/* Existing decks */}
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>

        {/* Empty state */}
        {decks.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No decks yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Create your first deck to get started with flashcard learning
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
