import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc } from 'drizzle-orm';
import { decksTable, cardsTable } from '@/db/schema';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DeckService {
  /**
   * Get all decks for a specific user
   */
  async getUserDecks(userId: string) {
    return await db
      .select()
      .from(decksTable)
      .where(eq(decksTable.userId, userId))
      .orderBy(desc(decksTable.updatedAt));
  }

  /**
   * Get a specific deck by ID for a user (ensures user owns the deck)
   */
  async getUserDeck(userId: string, deckId: number) {
    const deck = await db
      .select()
      .from(decksTable)
      .where(and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      ));
    
    return deck[0] || null;
  }

  /**
   * Create a new deck for a user
   */
  async createDeck(userId: string, data: { name: string; description?: string }) {
    const result = await db
      .insert(decksTable)
      .values({
        ...data,
        userId,
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Update a deck (ensures user owns the deck)
   */
  async updateDeck(
    userId: string, 
    deckId: number, 
    data: { name?: string; description?: string }
  ) {
    const result = await db
      .update(decksTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(decksTable.id, deckId), eq(decksTable.userId, userId)))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Delete a deck (ensures user owns the deck)
   */
  async deleteDeck(userId: string, deckId: number) {
    const result = await db
      .delete(decksTable)
      .where(and(eq(decksTable.id, deckId), eq(decksTable.userId, userId)))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Get all cards for a specific deck (ensures user owns the deck)
   */
  async getDeckCards(userId: string, deckId: number) {
    // First verify the user owns the deck
    const deck = await this.getUserDeck(userId, deckId);
    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    return await db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.deckId, deckId))
      .orderBy(cardsTable.createdAt);
  }
}

export const deckService = new DeckService();
