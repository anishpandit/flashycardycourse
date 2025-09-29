import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc } from 'drizzle-orm';
import { cardsTable, decksTable } from '@/db/schema';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class CardService {
  /**
   * Get all cards for a specific deck (ensures user owns the deck)
   */
  async getDeckCards(userId: string, deckId: number) {
    // First verify the user owns the deck
    const deck = await db
      .select()
      .from(decksTable)
      .where(and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      ));
    
    if (!deck.length) {
      // Return empty array instead of throwing error
      // The deck page will handle the 404 case
      return [];
    }

    return await db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.deckId, deckId))
      .orderBy(desc(cardsTable.createdAt));
  }

  /**
   * Get a specific card by ID (ensures user owns the deck)
   */
  async getCard(userId: string, cardId: number) {
    const result = await db
      .select({
        id: cardsTable.id,
        deckId: cardsTable.deckId,
        front: cardsTable.front,
        back: cardsTable.back,
        createdAt: cardsTable.createdAt,
        updatedAt: cardsTable.updatedAt,
        userId: decksTable.userId,
      })
      .from(cardsTable)
      .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
      .where(and(
        eq(cardsTable.id, cardId),
        eq(decksTable.userId, userId)
      ));

    return result[0] || null;
  }

  /**
   * Create a new card for a deck (ensures user owns the deck)
   */
  async createCard(userId: string, deckId: number, data: { front: string; back: string }) {
    // First verify the user owns the deck
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

    const result = await db
      .insert(cardsTable)
      .values({
        ...data,
        deckId,
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Update a card (ensures user owns the deck)
   */
  async updateCard(
    userId: string, 
    cardId: number, 
    data: { front?: string; back?: string }
  ) {
    // First get the card to find its deck and verify ownership
    const cardWithDeck = await db
      .select({
        cardId: cardsTable.id,
        deckId: cardsTable.deckId,
        userId: decksTable.userId,
      })
      .from(cardsTable)
      .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
      .where(eq(cardsTable.id, cardId));
    
    if (!cardWithDeck.length || cardWithDeck[0].userId !== userId) {
      throw new Error('Card not found or access denied');
    }

    const result = await db
      .update(cardsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(cardsTable.id, cardId))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Delete a card (ensures user owns the deck)
   */
  async deleteCard(userId: string, cardId: number) {
    // First get the card to find its deck and verify ownership
    const cardWithDeck = await db
      .select({
        cardId: cardsTable.id,
        deckId: cardsTable.deckId,
        userId: decksTable.userId,
      })
      .from(cardsTable)
      .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
      .where(eq(cardsTable.id, cardId));
    
    if (!cardWithDeck.length || cardWithDeck[0].userId !== userId) {
      throw new Error('Card not found or access denied');
    }

    const result = await db
      .delete(cardsTable)
      .where(eq(cardsTable.id, cardId))
      .returning();
    
    return result[0] || null;
  }
}

export const cardService = new CardService();
