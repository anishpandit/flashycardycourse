'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeckPageWrapperProps {
  children: React.ReactNode;
  deckId: number;
}

export function DeckPageWrapper({ children, deckId }: DeckPageWrapperProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in the middle of a deletion
    const deletionKey = `deleting-deck-${deckId}`;
    const isDeletingDeck = sessionStorage.getItem(deletionKey);
    
    if (isDeletingDeck) {
      setIsDeleting(true);
      // Clear the flag and redirect
      sessionStorage.removeItem(deletionKey);
      router.replace('/dashboard');
    }
  }, [deckId, router]);

  if (isDeleting) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

