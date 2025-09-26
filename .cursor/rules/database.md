# Database Rules

## Overview
**MANDATORY: All database interactions MUST use Drizzle ORM with the defined schema and proper user isolation.**

## Database Schema Requirements

### Schema Imports
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, or, desc, asc, count, like } from 'drizzle-orm';
import { decksTable, cardsTable } from '@/db/schema';
```

### Current Schema Structure
- `decksTable`: For flashcard decks (id, userId, name, description, createdAt, updatedAt)
- `cardsTable`: For individual flashcards (id, deckId, front, back, createdAt, updatedAt)

### Database Connection
```typescript
const db = drizzle(process.env.DATABASE_URL!);
```

## Security-First Database Patterns

### User-Scoped Queries (MANDATORY)

#### Deck Operations
```typescript
// ✅ Get user's decks
const getUserDecks = async (userId: string) => {
  return await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.userId, userId))
    .orderBy(desc(decksTable.updatedAt));
};

// ✅ Get specific deck with ownership check
const getUserDeck = async (userId: string, deckId: number) => {
  const deck = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ));
    
  return deck[0] || null;
};

// ✅ Create deck with user ownership
const createDeck = async (userId: string, data: DeckInsert) => {
  return await db
    .insert(decksTable)
    .values({ ...data, userId })
    .returning();
};
```

#### Card Operations with Deck Ownership Verification
```typescript
// ✅ Get cards with deck ownership verification
const getUserDeckCards = async (userId: string, deckId: number) => {
  // First verify deck ownership
  const deck = await getUserDeck(userId, deckId);
  if (!deck) {
    throw new Error('Deck not found or access denied');
  }
  
  return await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .orderBy(asc(cardsTable.createdAt));
};

// ✅ Create card with deck ownership verification
const createCard = async (userId: string, deckId: number, data: CardInsert) => {
  // Verify user owns the deck
  const deck = await getUserDeck(userId, deckId);
  if (!deck) {
    throw new Error('Deck not found or access denied');
  }
  
  return await db
    .insert(cardsTable)
    .values({ ...data, deckId })
    .returning();
};

// ✅ Update card with deck ownership verification
const updateCard = async (userId: string, cardId: number, data: Partial<CardInsert>) => {
  // First get the card to find its deck
  const card = await db
    .select({ deckId: cardsTable.deckId })
    .from(cardsTable)
    .where(eq(cardsTable.id, cardId));
    
  if (!card.length) {
    throw new Error('Card not found');
  }
  
  // Verify user owns the deck
  const deck = await getUserDeck(userId, card[0].deckId);
  if (!deck) {
    throw new Error('Access denied');
  }
  
  return await db
    .update(cardsTable)
    .set(data)
    .where(eq(cardsTable.id, cardId))
    .returning();
};
```

## Type Safety

### Inferred Types
```typescript
type DeckSelect = typeof decksTable.$inferSelect;
type DeckInsert = typeof decksTable.$inferInsert;
type CardSelect = typeof cardsTable.$inferSelect;
type CardInsert = typeof cardsTable.$inferInsert;

// Custom types for user-scoped operations
type UserDeck = DeckSelect;
type UserCard = CardSelect;
type UserDeckWithCards = DeckSelect & { cards: CardSelect[] };
```

### Service Layer Types
```typescript
interface DeckService {
  getUserDecks(userId: string): Promise<UserDeck[]>;
  getUserDeck(userId: string, deckId: number): Promise<UserDeck | null>;
  createDeck(userId: string, data: Omit<DeckInsert, 'userId'>): Promise<UserDeck>;
  updateDeck(userId: string, deckId: number, data: Partial<DeckInsert>): Promise<UserDeck>;
  deleteDeck(userId: string, deckId: number): Promise<void>;
}

interface CardService {
  getUserDeckCards(userId: string, deckId: number): Promise<UserCard[]>;
  createCard(userId: string, deckId: number, data: Omit<CardInsert, 'deckId'>): Promise<UserCard>;
  updateCard(userId: string, cardId: number, data: Partial<CardInsert>): Promise<UserCard>;
  deleteCard(userId: string, cardId: number): Promise<void>;
}
```

## Database Service Layer

### Deck Service Implementation
```typescript
// src/lib/services/deck-service.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc } from 'drizzle-orm';
import { decksTable, cardsTable } from '@/db/schema';

const db = drizzle(process.env.DATABASE_URL!);

export const deckService = {
  async getUserDecks(userId: string) {
    return await db
      .select()
      .from(decksTable)
      .where(eq(decksTable.userId, userId))
      .orderBy(desc(decksTable.updatedAt));
  },

  async getUserDeck(userId: string, deckId: number) {
    const decks = await db
      .select()
      .from(decksTable)
      .where(and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      ));
    return decks[0] || null;
  },

  async createDeck(userId: string, data: Omit<DeckInsert, 'userId'>) {
    const result = await db
      .insert(decksTable)
      .values({ ...data, userId })
      .returning();
    return result[0];
  },

  async updateDeck(userId: string, deckId: number, data: Partial<DeckInsert>) {
    // Verify ownership first
    const deck = await this.getUserDeck(userId, deckId);
    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    const result = await db
      .update(decksTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      ))
      .returning();
    return result[0];
  },

  async deleteDeck(userId: string, deckId: number) {
    // Verify ownership first
    const deck = await this.getUserDeck(userId, deckId);
    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    await db
      .delete(decksTable)
      .where(and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      ));
  }
};
```

## Advanced Query Patterns

### Deck with Cards (Relational Query)
```typescript
const getUserDeckWithCards = async (userId: string, deckId: number) => {
  const deck = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ));

  if (!deck.length) {
    return null;
  }

  const cards = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .orderBy(asc(cardsTable.createdAt));

  return {
    ...deck[0],
    cards
  };
};
```

### Search and Filtering
```typescript
const searchUserDecks = async (userId: string, searchTerm: string) => {
  return await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.userId, userId),
      or(
        like(decksTable.name, `%${searchTerm}%`),
        like(decksTable.description, `%${searchTerm}%`)
      )
    ))
    .orderBy(desc(decksTable.updatedAt));
};
```

### Pagination
```typescript
const getUserDecksWithPagination = async (
  userId: string, 
  page: number = 1, 
  limit: number = 10
) => {
  const offset = (page - 1) * limit;
  
  const [decks, totalCount] = await Promise.all([
    db
      .select()
      .from(decksTable)
      .where(eq(decksTable.userId, userId))
      .orderBy(desc(decksTable.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(decksTable)
      .where(eq(decksTable.userId, userId))
  ]);

  return {
    decks,
    totalCount: totalCount[0].count,
    totalPages: Math.ceil(totalCount[0].count / limit),
    currentPage: page
  };
};
```

## Error Handling

### Database Error Patterns
```typescript
import { DatabaseError } from 'pg';

const handleDatabaseOperation = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Database error:', error.message);
      throw new Error('Database operation failed');
    }
    throw error;
  }
};
```

## Performance Guidelines

### Indexing Strategy
```sql
-- Recommended indexes for the schema
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_decks_user_id_updated_at ON decks(user_id, updated_at DESC);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_deck_id_created_at ON cards(deck_id, created_at ASC);
```

### Query Optimization
```typescript
// ✅ Select only needed columns
const getDeckSummaries = async (userId: string) => {
  return await db
    .select({
      id: decksTable.id,
      name: decksTable.name,
      updatedAt: decksTable.updatedAt
    })
    .from(decksTable)
    .where(eq(decksTable.userId, userId));
};

// ✅ Use appropriate limits
const getRecentDecks = async (userId: string, limit: number = 5) => {
  return await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.userId, userId))
    .orderBy(desc(decksTable.updatedAt))
    .limit(limit);
};
```

## Prohibited Practices

### ❌ NEVER DO THESE

```typescript
// ❌ Queries without user context
const getAllDecks = () => db.select().from(decksTable);

// ❌ Direct ID-based queries without ownership check
const getDeckById = (id: number) => 
  db.select().from(decksTable).where(eq(decksTable.id, id));

// ❌ Bulk operations without user filtering
const deleteAllCards = () => db.delete(cardsTable);

// ❌ Raw SQL queries
const rawQuery = () => db.execute(sql`SELECT * FROM decks`);

// ❌ Trusting client-provided user IDs
const getDecksForUser = (userIdFromClient: string) =>
  db.select().from(decksTable).where(eq(decksTable.userId, userIdFromClient));
```

## Migration Guidelines

### Schema Migration Best Practices
```typescript
// Use Drizzle Kit for migrations
// npm run db:generate
// npm run db:migrate

// Always include userId in new tables for multi-tenancy
export const newTable = pgTable("new_table", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(), // Always include
  // ... other fields
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});
```

## Testing Database Operations

### Test Helpers
```typescript
// Mock database for testing
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Test user isolation
describe('Deck Service', () => {
  test('should only return user\'s decks', async () => {
    const userId = 'user_123';
    await deckService.getUserDecks(userId);
    
    expect(mockDb.select).toHaveBeenCalledWith(
      expect.objectContaining({
        where: eq(decksTable.userId, userId)
      })
    );
  });
});
```

**Remember: Every database operation must be scoped to the authenticated user. No exceptions.**
