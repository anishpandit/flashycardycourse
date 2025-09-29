import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { deckService } from '@/lib/services/deck-service';
import { cardService } from '@/lib/services/card-service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DeckActions } from '@/components/deck-actions';
import { CardDialogWrapper } from '@/components/card-dialog-wrapper';
import { DeckPageWrapper } from '@/components/deck-page-wrapper';

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  // Authenticate user following security requirements
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Parse deckId from params
  const { deckId: deckIdParam } = await params;
  const deckId = parseInt(deckIdParam);
  
  // Validate deckId is a valid number
  if (isNaN(deckId) || deckId <= 0) {
    notFound();
  }

  // Fetch deck and cards using the service layer (user-scoped queries)
  try {
    // First check if the deck exists and user owns it
    const deck = await deckService.getUserDeck(userId, deckId);
    
    // If deck doesn't exist or user doesn't own it, show 404
    if (!deck) {
      notFound();
    }

    // Only fetch cards if the deck exists
    const cards = await cardService.getDeckCards(userId, deckId);

    return (
      <DeckPageWrapper deckId={deckId}>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header with navigation */}
            <div className="space-y-4">
              {/* Breadcrumb navigation */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">{deck.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{deck.name}</h1>
                  {deck.description && (
                    <p className="text-muted-foreground mt-1">{deck.description}</p>
                  )}
                </div>
                <DeckActions deck={deck} cards={cards} />
              </div>
            </div>

            {/* Deck stats */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>{cards.length} cards</span>
              <span>Created {new Date(deck.createdAt).toLocaleDateString()}</span>
              <span>Last updated {new Date(deck.updatedAt).toLocaleDateString()}</span>
            </div>

            {/* Study section */}
            {cards.length > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Ready to study?</h3>
                    <p className="text-sm text-muted-foreground">
                      Practice with {cards.length} flashcard{cards.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Link href={`/decks/${deckId}/study`}>
                    <Button size="lg">
                      Start Studying
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Cards section */}
            <CardDialogWrapper 
              deckId={deckId} 
              cards={cards}
            />
          </div>
        </div>
      </DeckPageWrapper>
    );
  } catch (error) {
    // Handle errors from service layer (e.g., deck access denied)
    console.error('Error fetching deck:', error);
    notFound();
  }
}
