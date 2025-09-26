'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { deckService } from '@/lib/services/deck-service';

// Validation schemas
const createDeckSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
});

const updateDeckSchema = z.object({
  id: z.number().int().positive('Invalid deck ID'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  description: z.string().optional(),
});

const deleteDeckSchema = z.object({
  id: z.number().int().positive('Invalid deck ID'),
});

export async function createDeckAction(input: z.infer<typeof createDeckSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = createDeckSchema.parse(input);
    const deck = await deckService.createDeck(userId, validatedData);
    
    revalidatePath('/dashboard');
    return { success: true, deck };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to create deck' };
  }
}

export async function updateDeckAction(input: z.infer<typeof updateDeckSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = updateDeckSchema.parse(input);
    const { id, ...updateData } = validatedData;
    
    const deck = await deckService.updateDeck(userId, id, updateData);
    if (!deck) {
      return { success: false, error: 'Deck not found or access denied' };
    }
    
    revalidatePath('/dashboard');
    return { success: true, deck };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to update deck' };
  }
}

export async function deleteDeckAction(input: z.infer<typeof deleteDeckSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = deleteDeckSchema.parse(input);
    const deck = await deckService.deleteDeck(userId, validatedData.id);
    
    if (!deck) {
      return { success: false, error: 'Deck not found or access denied' };
    }
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to delete deck' };
  }
}
