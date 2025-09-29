import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { deckService } from '@/lib/services/deck-service';
import { cardService } from '@/lib/services/card-service';
import Link from 'next/link';
import { StudyInterface } from '@/components/study-interface';

interface StudyPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
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
    const [deck, cards] = await Promise.all([
      deckService.getUserDeck(userId, deckId),
      cardService.getDeckCards(userId, deckId)
    ]);

    // If deck doesn't exist or user doesn't own it, show 404
    if (!deck) {
      notFound();
    }

    // If no cards exist, redirect back to deck page
    if (cards.length === 0) {
      redirect(`/decks/${deckId}`);
    }

    return (
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
              <Link href={`/decks/${deckId}`} className="hover:text-foreground transition-colors">
                {deck.name}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Study</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Study: {deck.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {cards.length} card{cards.length === 1 ? '' : 's'} to review
                </p>
              </div>
            </div>
          </div>

          {/* Study Interface */}
          <StudyInterface deck={deck} cards={cards} />
        </div>
      </div>
    );
  } catch (error) {
    // Handle errors from service layer (e.g., deck access denied)
    console.error('Error fetching deck for study:', error);
    notFound();
  }
}
