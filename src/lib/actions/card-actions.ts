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

const generateCardSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic must be less than 500 characters'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
  cardType: z.enum(['definition', 'question-answer', 'concept-explanation', 'vocabulary']).optional().default('question-answer'),
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

export async function generateCardAction(input: z.infer<typeof generateCardSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = generateCardSchema.parse(input);
    
    // Generate card content using AI
    const generatedContent = await generateCardContent(validatedData);
    
    return { success: true, content: generatedContent };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to generate card content' };
  }
}

// Helper function to generate card content using AI
async function generateCardContent({ topic, difficulty, cardType }: z.infer<typeof generateCardSchema>) {
  // Enhanced mock implementation with better content generation
  // In a real app, you'd integrate with an AI service like OpenAI, Anthropic, etc.
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate more realistic content based on topic and difficulty
  const generateContent = () => {
    const difficultyLevels = {
      beginner: { complexity: 'simple', depth: 'basic', examples: 'basic examples' },
      intermediate: { complexity: 'moderate', depth: 'detailed', examples: 'practical examples' },
      advanced: { complexity: 'complex', depth: 'comprehensive', examples: 'advanced examples' }
    };
    
    const level = difficultyLevels[difficulty];
    
    switch (cardType) {
      case 'definition':
        return {
          front: `What is ${topic}?`,
          back: `${topic} is a ${level.complexity} concept that involves ${level.depth} understanding. It includes ${level.examples} and practical applications.`
        };
        
      case 'question-answer':
        return {
          front: `Explain ${topic} and its key characteristics.`,
          back: `${topic} is characterized by several key aspects: 1) Core principles that define its nature, 2) Important characteristics that distinguish it, 3) Practical applications in real-world scenarios, 4) Common examples and use cases.`
        };
        
      case 'concept-explanation':
        return {
          front: `${topic} - Core Concept`,
          back: `${topic} represents a fundamental concept that encompasses multiple dimensions: theoretical foundations, practical applications, key principles, and real-world examples. Understanding ${topic} requires grasping both its abstract concepts and concrete implementations.`
        };
        
      case 'vocabulary':
        return {
          front: `${topic}`,
          back: `Definition: ${topic} refers to a specific term or concept in this field. Usage: It is commonly used in contexts related to [relevant domain]. Example: A practical example would be [contextual example].`
        };
        
      default:
        return {
          front: `What is ${topic}?`,
          back: `${topic} is an important concept that involves multiple aspects and practical applications.`
        };
    }
  };
  
  return generateContent();
}
