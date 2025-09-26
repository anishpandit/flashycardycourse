# Authentication & Security Rules

## Overview
**CRITICAL: All authentication is handled by Clerk. Users must ONLY access their own data.**

## Clerk Authentication

### Required Imports
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
```

### Authentication Patterns

#### Server Components
```typescript
import { auth } from '@clerk/nextjs/server';

export default async function ProtectedPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // Now safe to use userId for data access
}
```

#### API Routes
```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Use userId for database queries
}
```

#### Client Components
```typescript
import { useAuth, useUser } from '@clerk/nextjs';

export default function ClientComponent() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) redirect('/sign-in');
  
  // Component logic here
}
```

## Data Access Security

### MANDATORY Security Checks

#### Every Database Query MUST Include User Validation
```typescript
// ✅ CORRECT - Always filter by userId
const userDecks = await db
  .select()
  .from(decksTable)
  .where(eq(decksTable.userId, userId));

// ❌ FORBIDDEN - Never query without user context
const allDecks = await db.select().from(decksTable);
```

#### Ownership Verification for Updates/Deletes
```typescript
// ✅ CORRECT - Verify ownership before operations
const deck = await db
  .select()
  .from(decksTable)
  .where(and(
    eq(decksTable.id, deckId),
    eq(decksTable.userId, userId)
  ));

if (!deck.length) {
  throw new Error('Deck not found or access denied');
}

await db
  .update(decksTable)
  .set({ name: newName })
  .where(and(
    eq(decksTable.id, deckId),
    eq(decksTable.userId, userId)
  ));
```

#### Deck-Card Relationship Security
```typescript
// ✅ CORRECT - Verify deck ownership before card operations
async function createCard(userId: string, deckId: number, cardData: CardInsert) {
  // First verify user owns the deck
  const deck = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ));
    
  if (!deck.length) {
    throw new Error('Deck not found or access denied');
  }
  
  // Now safe to create card
  return await db
    .insert(cardsTable)
    .values({ ...cardData, deckId });
}
```

## Required Security Patterns

### API Route Security Template
```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate input
    const body = await request.json();
    // Add validation logic here

    // 3. Perform operation with userId context
    const result = await performOperation(userId, body);

    return Response.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### Server Action Security Template
```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function createDeck(formData: FormData) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // 2. Validate input
  const name = formData.get('name') as string;
  if (!name) {
    throw new Error('Name is required');
  }

  // 3. Perform operation
  const deck = await db
    .insert(decksTable)
    .values({ userId, name })
    .returning();

  // 4. Revalidate relevant paths
  revalidatePath('/decks');
  
  return deck[0];
}
```

## Prohibited Security Anti-Patterns

### ❌ NEVER DO THESE

```typescript
// ❌ FORBIDDEN - Trusting client-side user IDs
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId'); // NEVER TRUST THIS
  // Use auth() instead
}

// ❌ FORBIDDEN - Queries without user context
const getAllDecks = () => db.select().from(decksTable);

// ❌ FORBIDDEN - Admin-style queries
const getDeckById = (id: number) => 
  db.select().from(decksTable).where(eq(decksTable.id, id));

// ❌ FORBIDDEN - Bulk operations without user filtering
const deleteAllCards = () => db.delete(cardsTable);
```

## Environment Security

### Required Environment Variables
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=postgresql://...
```

### Environment Validation
```typescript
// Always validate required environment variables
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
```

## Error Handling Security

### Safe Error Messages
```typescript
// ✅ CORRECT - Don't expose internal details
catch (error) {
  console.error('Internal error:', error); // Log for debugging
  return Response.json(
    { error: 'Operation failed' }, // Generic user message
    { status: 500 }
  );
}

// ❌ FORBIDDEN - Exposing sensitive information
catch (error) {
  return Response.json({ error: error.message }, { status: 500 });
}
```

## Testing Security

### Authentication Test Helpers
```typescript
// Mock authenticated user for tests
const mockAuth = (userId: string) => {
  jest.mock('@clerk/nextjs/server', () => ({
    auth: jest.fn().mockResolvedValue({ userId }),
  }));
};

// Test unauthorized access
const mockUnauthenticated = () => {
  jest.mock('@clerk/nextjs/server', () => ({
    auth: jest.fn().mockResolvedValue({ userId: null }),
  }));
};
```

## Security Checklist

Before deploying any feature:

- [ ] All API routes check authentication with `auth()`
- [ ] All database queries filter by authenticated `userId`
- [ ] Ownership verification for update/delete operations
- [ ] No direct exposure of other users' data
- [ ] Error messages don't leak sensitive information
- [ ] Environment variables are properly validated
- [ ] Client-side auth state is properly handled

**Remember: Every piece of data must be tied to the authenticated user. There should be NO way for users to access data that doesn't belong to them.**
