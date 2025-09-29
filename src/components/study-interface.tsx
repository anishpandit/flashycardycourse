'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface StudyInterfaceProps {
  deck: {
    id: number;
    name: string;
    description: string | null;
  };
  cards: Array<{
    id: number;
    deckId: number;
    front: string;
    back: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export function StudyInterface({ deck, cards }: StudyInterfaceProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [isStudyComplete, setIsStudyComplete] = useState(false);

  const currentCard = cards[currentCardIndex];
  const progress = Math.round(((currentCardIndex + 1) / cards.length) * 100);

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setStudiedCards(prev => new Set(prev).add(currentCard.id));
    } else {
      // Study complete
      setStudiedCards(prev => new Set(prev).add(currentCard.id));
      setIsStudyComplete(true);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRestartStudy = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudiedCards(new Set());
    setIsStudyComplete(false);
  };

  if (isStudyComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center p-8">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Study Complete!</h2>
              <p className="text-muted-foreground">
                You've reviewed all {cards.length} cards in "{deck.name}"
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRestartStudy} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
              <Link href={`/decks/${deck.id}`}>
                <Button>
                  Back to Deck
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{currentCardIndex + 1} of {cards.length}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <Card 
        className="aspect-[4/3] cursor-pointer select-none transition-all duration-300 hover:shadow-lg"
        onClick={handleFlipCard}
      >
        <CardContent className="h-full flex items-center justify-center p-8">
          <div className="text-center space-y-4 w-full">
            <div className="text-sm font-medium text-muted-foreground">
              {isFlipped ? 'Back' : 'Front'}
            </div>
            <div className="text-xl font-medium leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </div>
            {!isFlipped && (
              <div className="text-sm text-muted-foreground mt-4">
                Click to reveal answer
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handlePreviousCard}
          disabled={currentCardIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleFlipCard}>
            {isFlipped ? 'Show Front' : 'Show Back'}
          </Button>
        </div>

        <Button 
          onClick={handleNextCard}
          disabled={!isFlipped}
        >
          {currentCardIndex === cards.length - 1 ? 'Complete' : 'Next'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Study tips */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Click the card to flip it, then press "Next" to continue</p>
      </div>
    </div>
  );
}
