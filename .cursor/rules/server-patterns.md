# Server Components & Server Actions Rules

## Overview
**CRITICAL: All data retrieval MUST use server components. All mutations MUST use server actions. All data MUST be validated with Zod.**

## Core Principles

1. **Data Retrieval**: Always use server components for fetching data
2. **Data Mutations**: Always use server actions for create/update/delete operations
3. **Validation**: All data must be validated using Zod schemas
4. **Type Safety**: Server actions must use typed parameters, never FormData
5. **Security**: All operations must authenticate and scope to user data

## Server Components for Data Retrieval

### Required Pattern for Data Fetching
```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { deckService } from '@/lib/services/deck-service';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // 1. AUTHENTICATION (MANDATORY)
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // 2. DATA FETCHING (Server Component)
  const decks = await deckService.getUserDecks(userId);

  // 3. RENDER UI
  return (
    <div>
      <h1>Your Decks</h1>
      <DeckList decks={decks} />
    </div>
  );
}
```

### Server Component with Error Handling
```typescript
// app/decks/[id]/page.tsx
import { auth } from '@clerk/nextjs/server';
import { deckService } from '@/lib/services/deck-service';
import { notFound, redirect } from 'next/navigation';

interface DeckPageProps {
  params: { id: string };
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const deckId = parseInt(params.id);
  if (isNaN(deckId)) {
    notFound();
  }

  try {
    const deck = await deckService.getUserDeck(userId, deckId);
    if (!deck) {
      notFound();
    }

    const cards = await deckService.getUserDeckCards(userId, deckId);

    return (
      <div>
        <DeckHeader deck={deck} />
        <CardList cards={cards} deckId={deckId} />
      </div>
    );
  } catch (error) {
    console.error('Error loading deck:', error);
    throw error; // Let error boundary handle it
  }
}
```

### Loading and Error States
```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}

// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## Server Actions for Mutations

### Required Server Action Pattern
```typescript
// lib/actions/deck-actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { deckService } from '@/lib/services/deck-service';

// 1. ZOD SCHEMA (MANDATORY)
const createDeckSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

// 2. TYPED INPUT (NEVER FormData)
type CreateDeckInput = z.infer<typeof createDeckSchema>;

// 3. SERVER ACTION IMPLEMENTATION
export async function createDeckAction(input: CreateDeckInput) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Input validation
    const validatedData = createDeckSchema.parse(input);

    // Database operation
    const deck = await deckService.createDeck(userId, validatedData);

    // Revalidate cache
    revalidatePath('/dashboard');
    
    // Return success response
    return { 
      success: true, 
      data: deck,
      message: 'Deck created successfully' 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    console.error('Create deck error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deck',
    };
  }
}
```

### Update Server Action
```typescript
// lib/actions/deck-actions.ts
const updateDeckSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
}).refine(data => data.name !== undefined || data.description !== undefined, {
  message: 'At least one field must be provided for update',
});

type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export async function updateDeckAction(input: UpdateDeckInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = updateDeckSchema.parse(input);
    const { id, ...updateData } = validatedData;

    const deck = await deckService.updateDeck(userId, id, updateData);

    revalidatePath('/dashboard');
    revalidatePath(`/decks/${id}`);

    return { 
      success: true, 
      data: deck,
      message: 'Deck updated successfully' 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    console.error('Update deck error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update deck',
    };
  }
}
```

### Delete Server Action
```typescript
// lib/actions/deck-actions.ts
const deleteDeckSchema = z.object({
  id: z.number().positive(),
});

type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;

export async function deleteDeckAction(input: DeleteDeckInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const { id } = deleteDeckSchema.parse(input);

    await deckService.deleteDeck(userId, id);

    revalidatePath('/dashboard');

    return { 
      success: true,
      message: 'Deck deleted successfully' 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    console.error('Delete deck error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete deck',
    };
  }
}
```

## Card Actions

### Card Server Actions
```typescript
// lib/actions/card-actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cardService } from '@/lib/services/card-service';

const createCardSchema = z.object({
  deckId: z.number().positive(),
  front: z.string().min(1, 'Front content is required').max(2000),
  back: z.string().min(1, 'Back content is required').max(2000),
});

type CreateCardInput = z.infer<typeof createCardSchema>;

export async function createCardAction(input: CreateCardInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = createCardSchema.parse(input);
    const { deckId, ...cardData } = validatedData;

    const card = await cardService.createCard(userId, deckId, cardData);

    revalidatePath(`/decks/${deckId}`);

    return { 
      success: true, 
      data: card,
      message: 'Card created successfully' 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    console.error('Create card error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create card',
    };
  }
}

const updateCardSchema = z.object({
  id: z.number().positive(),
  front: z.string().min(1).max(2000).optional(),
  back: z.string().min(1).max(2000).optional(),
}).refine(data => data.front !== undefined || data.back !== undefined, {
  message: 'At least one field must be provided for update',
});

type UpdateCardInput = z.infer<typeof updateCardSchema>;

export async function updateCardAction(input: UpdateCardInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = updateCardSchema.parse(input);
    const { id, ...updateData } = validatedData;

    const card = await cardService.updateCard(userId, id, updateData);

    // Get deck ID for revalidation
    const cardWithDeck = await cardService.getCard(userId, id);
    if (cardWithDeck) {
      revalidatePath(`/decks/${cardWithDeck.deckId}`);
    }

    return { 
      success: true, 
      data: card,
      message: 'Card updated successfully' 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    console.error('Update card error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update card',
    };
  }
}
```

## Client Components with Server Actions

### Form Components with Server Actions
```typescript
// components/CreateDeckForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { createDeckAction } from '@/lib/actions/deck-actions';
import { useRouter } from 'next/navigation';

export function CreateDeckForm() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      // Convert FormData to typed object
      const input = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
      };

      const result = await createDeckAction(input);

      if (result.success) {
        router.push('/dashboard');
      } else {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        } else {
          setErrors({ general: [result.error || 'An error occurred'] });
        }
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block font-medium">
          Deck Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          disabled={isPending}
          className="w-full border rounded px-3 py-2"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block font-medium">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          disabled={isPending}
          className="w-full border rounded px-3 py-2"
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description[0]}</p>
        )}
      </div>

      {errors.general && (
        <p className="text-red-500 text-sm">{errors.general[0]}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create Deck'}
      </button>
    </form>
  );
}
```

### Optimistic Updates
```typescript
// components/DeckList.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { deleteDeckAction } from '@/lib/actions/deck-actions';

interface Deck {
  id: number;
  name: string;
  description: string | null;
}

export function DeckList({ decks }: { decks: Deck[] }) {
  const [optimisticDecks, addOptimisticDelete] = useOptimistic(
    decks,
    (state, deletedId: number) => state.filter(deck => deck.id !== deletedId)
  );
  const [isPending, startTransition] = useTransition();

  const handleDelete = (deckId: number) => {
    startTransition(async () => {
      addOptimisticDelete(deckId);
      
      const result = await deleteDeckAction({ id: deckId });
      
      if (!result.success) {
        // Handle error - optimistic update will be reverted automatically
        console.error('Delete failed:', result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {optimisticDecks.map((deck) => (
        <div key={deck.id} className="border rounded p-4">
          <h3 className="font-bold">{deck.name}</h3>
          {deck.description && <p>{deck.description}</p>}
          <button
            onClick={() => handleDelete(deck.id)}
            disabled={isPending}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Validation Schema Patterns

### Common Validation Schemas
```typescript
// lib/schemas/deck-schemas.ts
import { z } from 'zod';

export const deckSchemas = {
  create: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters')
      .trim(),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional()
      .transform(val => val === '' ? undefined : val),
  }),

  update: z.object({
    id: z.number().positive('Invalid deck ID'),
    name: z.string()
      .min(1, 'Name cannot be empty')
      .max(255, 'Name too long')
      .trim()
      .optional(),
    description: z.string()
      .max(1000, 'Description too long')
      .optional()
      .transform(val => val === '' ? undefined : val),
  }).refine(
    data => data.name !== undefined || data.description !== undefined,
    { message: 'At least one field must be provided for update' }
  ),

  delete: z.object({
    id: z.number().positive('Invalid deck ID'),
  }),
};

// Card schemas
export const cardSchemas = {
  create: z.object({
    deckId: z.number().positive('Invalid deck ID'),
    front: z.string()
      .min(1, 'Front content is required')
      .max(2000, 'Front content too long')
      .trim(),
    back: z.string()
      .min(1, 'Back content is required')
      .max(2000, 'Back content too long')
      .trim(),
  }),

  update: z.object({
    id: z.number().positive('Invalid card ID'),
    front: z.string()
      .min(1, 'Front content cannot be empty')
      .max(2000, 'Front content too long')
      .trim()
      .optional(),
    back: z.string()
      .min(1, 'Back content cannot be empty')
      .max(2000, 'Back content too long')
      .trim()
      .optional(),
  }).refine(
    data => data.front !== undefined || data.back !== undefined,
    { message: 'At least one field must be provided for update' }
  ),

  delete: z.object({
    id: z.number().positive('Invalid card ID'),
  }),
};
```

### Advanced Validation Patterns
```typescript
// lib/schemas/study-schemas.ts
import { z } from 'zod';

export const studySchemas = {
  recordStudySession: z.object({
    deckId: z.number().positive(),
    cardResults: z.array(z.object({
      cardId: z.number().positive(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      correct: z.boolean(),
      timeSpent: z.number().min(0).max(300), // max 5 minutes per card
    })).min(1, 'At least one card result required'),
    totalDuration: z.number().min(1), // in seconds
  }),

  updateStudySettings: z.object({
    cardsPerSession: z.number().min(1).max(100).default(20),
    reviewFrequency: z.enum(['daily', 'weekly', 'custom']),
    difficultyWeighting: z.object({
      easy: z.number().min(0).max(1),
      medium: z.number().min(0).max(1),
      hard: z.number().min(0).max(1),
    }),
  }),
};
```

## Error Handling Patterns

### Server Action Error Types
```typescript
// lib/types/action-types.ts
export type ActionResult<T = void> = 
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Utility function for consistent error handling
export function createActionError(
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred'
): ActionResult {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return {
    success: false,
    error: message,
  };
}
```

### Client-side Error Handling
```typescript
// hooks/useActionState.ts
import { useState } from 'react';
import type { ActionResult } from '@/lib/types/action-types';

export function useActionState() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string>('');

  const executeAction = async <T>(
    action: () => Promise<ActionResult<T>>,
    onSuccess?: (data?: T) => void
  ) => {
    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const result = await action();

      if (result.success) {
        if (result.message) setMessage(result.message);
        onSuccess?.(result.data);
      } else {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        } else {
          setErrors({ general: [result.error] });
        }
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    errors,
    message,
    executeAction,
    clearErrors: () => setErrors({}),
    clearMessage: () => setMessage(''),
  };
}
```

## Prohibited Patterns

### ❌ NEVER DO THESE

```typescript
// ❌ FORBIDDEN - Data fetching in client components
'use client';
export function BadDashboard() {
  const [decks, setDecks] = useState([]);
  
  useEffect(() => {
    fetch('/api/decks').then(r => r.json()).then(setDecks);
  }, []);
  
  return <div>{/* ... */}</div>;
}

// ❌ FORBIDDEN - Using FormData as server action parameter type
export async function badAction(formData: FormData) {
  const name = formData.get('name'); // No type safety
  // ...
}

// ❌ FORBIDDEN - No validation in server actions
export async function badAction(input: any) {
  // Using input directly without validation
  await db.insert(decksTable).values(input);
}

// ❌ FORBIDDEN - Client-side mutations without server actions
'use client';
export function BadForm() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Direct API call instead of server action
    await fetch('/api/decks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };
}

// ❌ FORBIDDEN - Server actions without authentication
export async function badAction(input: CreateDeckInput) {
  // No auth check - anyone can access
  const deck = await deckService.createDeck('any-user', input);
}

// ❌ FORBIDDEN - Not revalidating after mutations
export async function badAction(input: CreateDeckInput) {
  const { userId } = await auth();
  const deck = await deckService.createDeck(userId, input);
  // Missing revalidatePath - UI won't update
  return { success: true, data: deck };
}
```

## File Organization

### Recommended Structure
```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx          # Server component for data fetching
│   │   ├── loading.tsx       # Loading UI
│   │   └── error.tsx         # Error UI
│   └── decks/
│       └── [id]/
│           ├── page.tsx      # Server component
│           └── edit/
│               └── page.tsx  # Server component
├── lib/
│   ├── actions/
│   │   ├── deck-actions.ts   # Server actions for decks
│   │   └── card-actions.ts   # Server actions for cards
│   ├── schemas/
│   │   ├── deck-schemas.ts   # Zod schemas for decks
│   │   └── card-schemas.ts   # Zod schemas for cards
│   └── services/
│       ├── deck-service.ts   # Database operations
│       └── card-service.ts   # Database operations
└── components/
    ├── forms/
    │   ├── CreateDeckForm.tsx # Client component with server action
    │   └── EditCardForm.tsx   # Client component with server action
    └── ui/
        ├── DeckList.tsx       # Client component for interactivity
        └── CardList.tsx       # Client component for interactivity
```

## Performance Best Practices

### Streaming and Suspense
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { deckService } from '@/lib/services/deck-service';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<DecksListSkeleton />}>
        <DecksList userId={userId} />
      </Suspense>
      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivity userId={userId} />
      </Suspense>
    </div>
  );
}

async function DecksList({ userId }: { userId: string }) {
  const decks = await deckService.getUserDecks(userId);
  return <DecksListComponent decks={decks} />;
}

async function RecentActivity({ userId }: { userId: string }) {
  const activity = await activityService.getRecentActivity(userId);
  return <RecentActivityComponent activity={activity} />;
}
```

### Partial Prerendering (PPR) Ready
```typescript
// Components designed for PPR
export default async function DeckPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const deckId = parseInt(params.id);
  
  // Static content that can be prerendered
  return (
    <div>
      <DeckHeader deckId={deckId} />
      
      {/* Dynamic content wrapped in Suspense */}
      <Suspense fallback={<CardsListSkeleton />}>
        <DeckCards userId={userId} deckId={deckId} />
      </Suspense>
    </div>
  );
}
```

## Testing Patterns

### Server Action Testing
```typescript
// __tests__/actions/deck-actions.test.ts
import { createDeckAction } from '@/lib/actions/deck-actions';
import { auth } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/deck-service');

describe('createDeckAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create deck successfully with valid input', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_123' });
    
    const input = {
      name: 'Test Deck',
      description: 'Test description',
    };

    const result = await createDeckAction(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should return validation errors for invalid input', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_123' });
    
    const input = {
      name: '', // Invalid - empty name
      description: 'Test',
    };

    const result = await createDeckAction(input);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.name).toBeDefined();
  });

  it('should return unauthorized error for unauthenticated user', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });
    
    const input = {
      name: 'Test Deck',
    };

    const result = await createDeckAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});
```

**Remember: Always use server components for data fetching, server actions for mutations, and Zod for validation. Every operation must be authenticated and user-scoped.**
