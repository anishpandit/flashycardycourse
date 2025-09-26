# Component & UI Development Rules

## Overview
**Focus: Secure, accessible, and user-friendly components with proper authentication state handling.**

## Authentication-Aware Components

### Client-Side Authentication Patterns

#### Protected Component Template
```typescript
'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ProtectedComponent() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Loading state
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  // Not authenticated
  if (!isSignedIn) {
    return null; // Will redirect via useEffect
  }

  // Authenticated content
  return (
    <div>
      <p>Welcome, {user?.firstName}!</p>
      {/* Component content */}
    </div>
  );
}
```

#### Server Component Authentication
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ServerProtectedPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      {/* Protected content */}
    </div>
  );
}
```

### Conditional Rendering Patterns

#### Auth-Based UI Elements
```typescript
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>Flashy Cardy Course</h1>
      
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn-primary">Sign In</button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
```

## Data Fetching Patterns

### Client-Side Data Fetching with Authentication
```typescript
'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface Deck {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function DecksList() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchDecks = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        
        const response = await fetch('/api/decks', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch decks');
        }

        const data = await response.json();
        setDecks(data.decks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || !isSignedIn) {
    return <div>Please sign in to view your decks.</div>;
  }

  if (loading) {
    return <div>Loading decks...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="grid gap-4">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}
```

### Server-Side Data Fetching
```typescript
import { auth } from '@clerk/nextjs/server';
import { deckService } from '@/lib/services/deck-service';
import { DeckCard } from '@/components/deck-card';

export default async function DecksPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return <div>Please sign in to view your decks.</div>;
  }

  const decks = await deckService.getUserDecks(userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Decks</h1>
      
      {decks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No decks yet. Create your first one!</p>
          <CreateDeckButton />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Form Components with Validation

### Create Deck Form
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const deckSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

type DeckFormData = z.infer<typeof deckSchema>;

export function CreateDeckForm() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<DeckFormData>({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate on client side
      const validatedData = deckSchema.parse(formData);
      
      const token = await getToken();
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deck');
      }

      const { deck } = await response.json();
      router.push(`/decks/${deck.id}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'An error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Deck Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={3}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      {errors.general && (
        <div className="text-red-500 text-sm">{errors.general}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Deck'}
      </button>
    </form>
  );
}
```

## Reusable UI Components

### Loading Components
```typescript
// components/ui/loading-spinner.tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );
}

// components/ui/loading-skeleton.tsx
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}
```

### Error Components
```typescript
// components/ui/error-message.tsx
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="border border-red-200 bg-red-50 p-4 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Card Components
```typescript
// components/deck-card.tsx
import Link from 'next/link';
import { Deck } from '@/types';

interface DeckCardProps {
  deck: Deck;
}

export function DeckCard({ deck }: DeckCardProps) {
  return (
    <Link href={`/decks/${deck.id}`}>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <h3 className="font-semibold text-lg mb-2">{deck.name}</h3>
        {deck.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {deck.description}
          </p>
        )}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Created {new Date(deck.createdAt).toLocaleDateString()}</span>
          <span>Updated {new Date(deck.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
```

## Modal and Dialog Patterns

### Confirmation Dialog
```typescript
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const dialog = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${
              danger 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

// Usage example
export function DeleteDeckButton({ deckId }: { deckId: number }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Delete deck logic
      await deleteDeck(deckId);
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to delete deck:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-700"
        disabled={loading}
      >
        Delete
      </button>
      
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Deck"
        message="Are you sure you want to delete this deck? This action cannot be undone."
        confirmText="Delete"
        danger
      />
    </>
  );
}
```

## Accessibility Guidelines

### Required Accessibility Features
```typescript
// Proper semantic HTML
export function FlashCard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="flashcard"
      role="button"
      tabIndex={0}
      aria-label={`Flashcard: ${card.front}`}
      onClick={() => setFlipped(!flipped)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setFlipped(!flipped);
        }
      }}
    >
      <div 
        className={`card-content ${flipped ? 'flipped' : ''}`}
        aria-live="polite"
      >
        {flipped ? card.back : card.front}
      </div>
    </div>
  );
}
```

### Form Accessibility
```typescript
export function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form>
      <div>
        <label htmlFor="deck-name" className="required">
          Deck Name
        </label>
        <input
          id="deck-name"
          type="text"
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-invalid={!!errors.name}
          required
        />
        {errors.name && (
          <div id="name-error" role="alert" className="error">
            {errors.name}
          </div>
        )}
      </div>
    </form>
  );
}
```

## Performance Optimization

### Memoization Patterns
```typescript
import { memo, useMemo, useCallback } from 'react';

export const DeckCard = memo(({ deck }: { deck: Deck }) => {
  const formattedDate = useMemo(() => 
    new Date(deck.updatedAt).toLocaleDateString(),
    [deck.updatedAt]
  );

  return (
    <div className="deck-card">
      <h3>{deck.name}</h3>
      <p>Updated: {formattedDate}</p>
    </div>
  );
});

export function DecksList({ decks }: { decks: Deck[] }) {
  const handleDeckClick = useCallback((deckId: number) => {
    // Handle click
  }, []);

  return (
    <div>
      {decks.map(deck => (
        <DeckCard 
          key={deck.id} 
          deck={deck}
          onClick={() => handleDeckClick(deck.id)}
        />
      ))}
    </div>
  );
}
```

## Component Testing

### Testing Authenticated Components
```typescript
// __tests__/components/deck-card.test.tsx
import { render, screen } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';
import { DeckCard } from '@/components/deck-card';

const mockDeck = {
  id: 1,
  name: 'Test Deck',
  description: 'Test description',
  userId: 'user_123',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const renderWithClerk = (component: React.ReactElement) => {
  return render(
    <ClerkProvider publishableKey="pk_test_123">
      {component}
    </ClerkProvider>
  );
};

describe('DeckCard', () => {
  it('should render deck information', () => {
    renderWithClerk(<DeckCard deck={mockDeck} />);
    
    expect(screen.getByText('Test Deck')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    renderWithClerk(<DeckCard deck={mockDeck} />);
    
    const card = screen.getByRole('link');
    expect(card).toHaveAttribute('href', '/decks/1');
  });
});
```

## Prohibited UI Patterns

### ❌ NEVER DO THESE

```typescript
// ❌ FORBIDDEN - Trusting client-side user data without server validation
function UnsafeComponent() {
  const userIdFromUrl = useSearchParams().get('userId'); // Never trust this
  // Use useAuth() instead
}

// ❌ FORBIDDEN - Displaying other users' data
function BadDecksList() {
  const [allDecks, setAllDecks] = useState([]); // Should only show user's decks
}

// ❌ FORBIDDEN - No loading states
function BadComponent() {
  const [data, setData] = useState(null);
  // No loading indicator while fetching
  return <div>{data?.name}</div>; // Could show undefined
}

// ❌ FORBIDDEN - Poor error handling
function BadForm() {
  try {
    // form submission
  } catch (error) {
    alert(error.message); // Poor UX
  }
}

// ❌ FORBIDDEN - No accessibility attributes
function BadButton() {
  return <div onClick={handleClick}>Click me</div>; // Should be <button>
}
```

**Remember: All components must respect user authentication state and only display data belonging to the authenticated user.**
