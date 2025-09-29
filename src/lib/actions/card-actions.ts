'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cardService } from '@/lib/services/card-service';

// Validation schemas
const createCardSchema = z.object({
  deckId: z.number().int().positive('Invalid deck ID'),
  front: z.string().min(1, 'Front content is required').max(2000, 'Front content must be less than 2000 characters'),
  back: z.string().min(1, 'Back content is required').max(2000, 'Back content must be less than 2000 characters'),
});

const updateCardSchema = z.object({
  id: z.number().int().positive('Invalid card ID'),
  front: z.string().min(1, 'Front content is required').max(2000, 'Front content must be less than 2000 characters').optional(),
  back: z.string().min(1, 'Back content is required').max(2000, 'Back content must be less than 2000 characters').optional(),
});

const deleteCardSchema = z.object({
  id: z.number().int().positive('Invalid card ID'),
});

export async function createCardAction(input: z.infer<typeof createCardSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = createCardSchema.parse(input);
    const { deckId, ...cardData } = validatedData;
    
    const card = await cardService.createCard(userId, deckId, cardData);
    
    revalidatePath('/dashboard');
    revalidatePath(`/decks/${deckId}`);
    return { success: true, card };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to create card' };
  }
}

export async function updateCardAction(input: z.infer<typeof updateCardSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = updateCardSchema.parse(input);
    const { id, ...updateData } = validatedData;
    
    const card = await cardService.updateCard(userId, id, updateData);
    if (!card) {
      return { success: false, error: 'Card not found or access denied' };
    }
    
    // We need to get the deckId to revalidate the correct path
    const cardWithDeck = await cardService.getCard(userId, id);
    if (cardWithDeck) {
      revalidatePath('/dashboard');
      revalidatePath(`/decks/${cardWithDeck.deckId}`);
    }
    
    return { success: true, card };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to update card' };
  }
}

export async function deleteCardAction(input: z.infer<typeof deleteCardSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = deleteCardSchema.parse(input);
    
    // Get the card first to know which deck to revalidate
    const cardWithDeck = await cardService.getCard(userId, validatedData.id);
    if (!cardWithDeck) {
      return { success: false, error: 'Card not found or access denied' };
    }
    
    const card = await cardService.deleteCard(userId, validatedData.id);
    
    if (!card) {
      return { success: false, error: 'Card not found or access denied' };
    }
    
    revalidatePath('/dashboard');
    revalidatePath(`/decks/${cardWithDeck.deckId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to delete card' };
  }
}
