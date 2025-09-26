# Validation Schemas Reference

## Overview
**MANDATORY: All data passed to server actions must be validated using Zod schemas with proper TypeScript types.**

This file provides comprehensive Zod validation patterns and reusable schemas for the FlashyCardyCourse project.

## Core Validation Principles

1. **Server-Side Only**: All validation happens on the server
2. **TypeScript Integration**: Use `z.infer<>` for type safety
3. **User Input Sanitization**: Transform and sanitize all user inputs
4. **Comprehensive Error Messages**: Provide clear, user-friendly error messages
5. **Security First**: Validate all inputs to prevent injection attacks

## Deck Validation Schemas

```typescript
// lib/schemas/deck-schemas.ts
import { z } from 'zod';

// Base deck validation with transforms
const deckBaseSchema = z.object({
  name: z.string()
    .min(1, 'Deck name is required')
    .max(255, 'Deck name must be less than 255 characters')
    .trim()
    .transform(name => name.replace(/\s+/g, ' ')), // Normalize whitespace
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(desc => {
      if (!desc || desc.trim() === '') return undefined;
      return desc.trim().replace(/\s+/g, ' ');
    }),
});

export const deckSchemas = {
  // Create deck schema
  create: deckBaseSchema,

  // Update deck schema - at least one field required
  update: z.object({
    id: z.number()
      .positive('Invalid deck ID')
      .int('Deck ID must be an integer'),
    
    name: z.string()
      .min(1, 'Deck name cannot be empty')
      .max(255, 'Deck name too long')
      .trim()
      .transform(name => name.replace(/\s+/g, ' '))
      .optional(),
    
    description: z.string()
      .max(1000, 'Description too long')
      .optional()
      .transform(desc => {
        if (!desc || desc.trim() === '') return undefined;
        return desc.trim().replace(/\s+/g, ' ');
      }),
  }).refine(
    data => data.name !== undefined || data.description !== undefined,
    {
      message: 'At least one field (name or description) must be provided for update',
      path: ['root']
    }
  ),

  // Delete deck schema
  delete: z.object({
    id: z.number()
      .positive('Invalid deck ID')
      .int('Deck ID must be an integer'),
  }),

  // Bulk operations
  bulkDelete: z.object({
    ids: z.array(z.number().positive().int())
      .min(1, 'At least one deck ID is required')
      .max(50, 'Cannot delete more than 50 decks at once'),
  }),
};

// Type exports
export type CreateDeckInput = z.infer<typeof deckSchemas.create>;
export type UpdateDeckInput = z.infer<typeof deckSchemas.update>;
export type DeleteDeckInput = z.infer<typeof deckSchemas.delete>;
export type BulkDeleteDeckInput = z.infer<typeof deckSchemas.bulkDelete>;
```

## Card Validation Schemas

```typescript
// lib/schemas/card-schemas.ts
import { z } from 'zod';

// HTML sanitization (basic)
const sanitizeHtml = (content: string) => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim();
};

// Card content validation with HTML support
const cardContentSchema = z.string()
  .min(1, 'Content is required')
  .max(2000, 'Content must be less than 2000 characters')
  .transform(sanitizeHtml)
  .refine(
    content => content.length > 0,
    { message: 'Content cannot be empty after sanitization' }
  );

export const cardSchemas = {
  // Create card schema
  create: z.object({
    deckId: z.number()
      .positive('Invalid deck ID')
      .int('Deck ID must be an integer'),
    
    front: cardContentSchema,
    back: cardContentSchema,
    
    // Optional metadata
    tags: z.array(z.string().max(50))
      .max(10, 'Maximum 10 tags allowed')
      .optional()
      .transform(tags => tags?.filter(tag => tag.trim().length > 0)),
  }),

  // Update card schema
  update: z.object({
    id: z.number()
      .positive('Invalid card ID')
      .int('Card ID must be an integer'),
    
    front: cardContentSchema.optional(),
    back: cardContentSchema.optional(),
    
    tags: z.array(z.string().max(50))
      .max(10, 'Maximum 10 tags allowed')
      .optional()
      .transform(tags => tags?.filter(tag => tag.trim().length > 0)),
  }).refine(
    data => data.front !== undefined || data.back !== undefined || data.tags !== undefined,
    {
      message: 'At least one field must be provided for update',
      path: ['root']
    }
  ),

  // Delete card schema
  delete: z.object({
    id: z.number()
      .positive('Invalid card ID')
      .int('Card ID must be an integer'),
  }),

  // Bulk card operations
  bulkCreate: z.object({
    deckId: z.number().positive().int(),
    cards: z.array(z.object({
      front: cardContentSchema,
      back: cardContentSchema,
      tags: z.array(z.string().max(50)).max(10).optional(),
    }))
      .min(1, 'At least one card is required')
      .max(100, 'Cannot create more than 100 cards at once'),
  }),

  bulkUpdate: z.object({
    updates: z.array(z.object({
      id: z.number().positive().int(),
      front: cardContentSchema.optional(),
      back: cardContentSchema.optional(),
      tags: z.array(z.string().max(50)).max(10).optional(),
    }))
      .min(1, 'At least one card update is required')
      .max(50, 'Cannot update more than 50 cards at once'),
  }),

  // Import/Export
  import: z.object({
    deckId: z.number().positive().int(),
    format: z.enum(['csv', 'json', 'anki']),
    data: z.string().min(1, 'Import data is required'),
    options: z.object({
      skipDuplicates: z.boolean().default(true),
      preserveFormatting: z.boolean().default(false),
    }).optional(),
  }),
};

// Type exports
export type CreateCardInput = z.infer<typeof cardSchemas.create>;
export type UpdateCardInput = z.infer<typeof cardSchemas.update>;
export type DeleteCardInput = z.infer<typeof cardSchemas.delete>;
export type BulkCreateCardsInput = z.infer<typeof cardSchemas.bulkCreate>;
export type BulkUpdateCardsInput = z.infer<typeof cardSchemas.bulkUpdate>;
export type ImportCardsInput = z.infer<typeof cardSchemas.import>;
```

## Study Session Schemas

```typescript
// lib/schemas/study-schemas.ts
import { z } from 'zod';

export const studySchemas = {
  // Start study session
  startSession: z.object({
    deckId: z.number().positive().int(),
    sessionType: z.enum(['review', 'new', 'mixed']).default('mixed'),
    maxCards: z.number()
      .min(1, 'Must study at least 1 card')
      .max(100, 'Cannot study more than 100 cards per session')
      .default(20),
    includeReversed: z.boolean().default(false),
  }),

  // Record card response
  recordResponse: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    cardId: z.number().positive().int(),
    response: z.enum(['again', 'hard', 'good', 'easy']),
    timeSpent: z.number()
      .min(0.1, 'Time spent must be positive')
      .max(300, 'Maximum 5 minutes per card'),
    wasRevealed: z.boolean(),
    notes: z.string().max(500).optional(),
  }),

  // End study session
  endSession: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    completedCards: z.number().min(0).int(),
    totalTimeSpent: z.number().min(0),
    sessionRating: z.number()
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5')
      .optional(),
  }),

  // Update study preferences
  updatePreferences: z.object({
    cardsPerSession: z.number().min(1).max(100).default(20),
    newCardsPerDay: z.number().min(0).max(50).default(10),
    reviewInterval: z.enum(['conservative', 'normal', 'aggressive']).default('normal'),
    showTimer: z.boolean().default(true),
    autoAdvance: z.boolean().default(false),
    enableSound: z.boolean().default(false),
  }),
};

// Type exports
export type StartSessionInput = z.infer<typeof studySchemas.startSession>;
export type RecordResponseInput = z.infer<typeof studySchemas.recordResponse>;
export type EndSessionInput = z.infer<typeof studySchemas.endSession>;
export type UpdatePreferencesInput = z.infer<typeof studySchemas.updatePreferences>;
```

## Query Parameter Schemas

```typescript
// lib/schemas/query-schemas.ts
import { z } from 'zod';

export const querySchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number()
      .min(1, 'Page must be positive')
      .default(1),
    limit: z.coerce.number()
      .min(1, 'Limit must be positive')
      .max(100, 'Maximum 100 items per page')
      .default(20),
  }),

  // Search
  search: z.object({
    q: z.string()
      .max(100, 'Search query too long')
      .optional()
      .transform(q => q?.trim()),
    tags: z.string()
      .optional()
      .transform(tags => tags?.split(',').map(t => t.trim()).filter(Boolean)),
  }),

  // Sorting
  sort: z.object({
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'cardCount']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Filtering
  deckFilters: z.object({
    hasCards: z.coerce.boolean().optional(),
    minCards: z.coerce.number().min(0).optional(),
    maxCards: z.coerce.number().min(0).optional(),
    createdAfter: z.coerce.date().optional(),
    createdBefore: z.coerce.date().optional(),
  }),

  // Combined query schema
  deckQuery: z.object({
    ...querySchemas.pagination.shape,
    ...querySchemas.search.shape,
    ...querySchemas.sort.shape,
    ...querySchemas.deckFilters.shape,
  }),
};

// Type exports
export type PaginationInput = z.infer<typeof querySchemas.pagination>;
export type SearchInput = z.infer<typeof querySchemas.search>;
export type SortInput = z.infer<typeof querySchemas.sort>;
export type DeckFiltersInput = z.infer<typeof querySchemas.deckFilters>;
export type DeckQueryInput = z.infer<typeof querySchemas.deckQuery>;
```

## User Preferences Schemas

```typescript
// lib/schemas/user-schemas.ts
import { z } from 'zod';

export const userSchemas = {
  // Update profile
  updateProfile: z.object({
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(100, 'Display name too long')
      .trim()
      .optional(),
    
    timezone: z.string()
      .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid timezone format')
      .optional(),
    
    language: z.enum(['en', 'es', 'fr', 'de', 'ja', 'zh'])
      .default('en'),
  }),

  // Study settings
  studySettings: z.object({
    defaultDeckId: z.number().positive().int().optional(),
    studyReminders: z.boolean().default(true),
    reminderTime: z.string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
      .default('09:00'),
    weeklyGoal: z.number()
      .min(1, 'Weekly goal must be positive')
      .max(1000, 'Weekly goal too high')
      .default(50),
  }),

  // Privacy settings
  privacySettings: z.object({
    profileVisibility: z.enum(['private', 'friends', 'public']).default('private'),
    shareStudyStats: z.boolean().default(false),
    allowDataExport: z.boolean().default(true),
  }),
};

// Type exports
export type UpdateProfileInput = z.infer<typeof userSchemas.updateProfile>;
export type StudySettingsInput = z.infer<typeof userSchemas.studySettings>;
export type PrivacySettingsInput = z.infer<typeof userSchemas.privacySettings>;
```

## Validation Utilities

```typescript
// lib/utils/validation.ts
import { z } from 'zod';

// Create a reusable validation utility
export function createValidationHandler<T extends z.ZodTypeAny>(schema: T) {
  return {
    parse: (data: unknown): z.infer<T> => {
      return schema.parse(data);
    },
    
    safeParse: (data: unknown): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    },
    
    // For server actions
    validate: async (data: unknown): Promise<{ data?: z.infer<T>; errors?: Record<string, string[]> }> => {
      try {
        const validatedData = schema.parse(data);
        return { data: validatedData };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { errors: error.flatten().fieldErrors };
        }
        throw error;
      }
    }
  };
}

// Common validation patterns
export const commonPatterns = {
  // ID validation
  id: z.number().positive().int(),
  
  // UUID validation
  uuid: z.string().uuid(),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Date validation
  dateString: z.string().datetime('Invalid date format'),
  
  // Color validation (hex)
  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
  
  // Phone number validation (basic)
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  
  // Slug validation
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
};

// File upload validation
export const fileSchemas = {
  image: z.object({
    file: z.instanceof(File),
    maxSize: z.number().default(5 * 1024 * 1024), // 5MB
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif']),
  }).refine(
    data => data.file.size <= data.maxSize,
    { message: 'File size too large' }
  ).refine(
    data => data.allowedTypes.includes(data.file.type),
    { message: 'Invalid file type' }
  ),
  
  csv: z.object({
    file: z.instanceof(File),
    maxSize: z.number().default(10 * 1024 * 1024), // 10MB
  }).refine(
    data => data.file.type === 'text/csv' || data.file.name.endsWith('.csv'),
    { message: 'File must be a CSV' }
  ).refine(
    data => data.file.size <= data.maxSize,
    { message: 'File size too large' }
  ),
};
```

## Error Handling

```typescript
// lib/utils/validation-errors.ts
import { z } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

export function handleValidationError<T>(
  error: unknown,
  fallbackMessage: string = 'Validation failed'
): ValidationResult<T> {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      errors: error.flatten().fieldErrors,
      message: fallbackMessage,
    };
  }
  
  return {
    success: false,
    message: error instanceof Error ? error.message : fallbackMessage,
  };
}

export function createValidationResult<T>(data: T): ValidationResult<T> {
  return {
    success: true,
    data,
  };
}

// Custom error messages
export const errorMessages = {
  required: 'This field is required',
  invalid: 'This field is invalid',
  tooLong: (max: number) => `Must be ${max} characters or less`,
  tooShort: (min: number) => `Must be at least ${min} characters`,
  invalidEmail: 'Please enter a valid email address',
  invalidUrl: 'Please enter a valid URL',
  invalidDate: 'Please enter a valid date',
  unauthorized: 'You are not authorized to perform this action',
  notFound: 'The requested resource was not found',
  duplicate: 'This item already exists',
} as const;
```

## Testing Validation Schemas

```typescript
// __tests__/schemas/deck-schemas.test.ts
import { deckSchemas } from '@/lib/schemas/deck-schemas';

describe('Deck Validation Schemas', () => {
  describe('create schema', () => {
    it('should validate valid deck data', () => {
      const validData = {
        name: 'Test Deck',
        description: 'A test deck for flashcards',
      };
      
      expect(() => deckSchemas.create.parse(validData)).not.toThrow();
    });
    
    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Test description',
      };
      
      expect(() => deckSchemas.create.parse(invalidData)).toThrow();
    });
    
    it('should trim and normalize whitespace', () => {
      const input = {
        name: '  Test    Deck  ',
        description: '  Multiple   spaces  ',
      };
      
      const result = deckSchemas.create.parse(input);
      expect(result.name).toBe('Test Deck');
      expect(result.description).toBe('Multiple spaces');
    });
  });
  
  describe('update schema', () => {
    it('should require at least one field', () => {
      const invalidData = { id: 1 };
      
      expect(() => deckSchemas.update.parse(invalidData)).toThrow();
    });
    
    it('should allow partial updates', () => {
      const validData = { id: 1, name: 'New Name' };
      
      expect(() => deckSchemas.update.parse(validData)).not.toThrow();
    });
  });
});
```

## Best Practices

### 1. Schema Organization
- Keep schemas in separate files by domain
- Export both schemas and their inferred types
- Use consistent naming conventions

### 2. Validation Messages
- Provide clear, user-friendly error messages
- Use consistent language across all schemas
- Include specific requirements (e.g., character limits)

### 3. Data Transformation
- Always trim string inputs
- Normalize whitespace
- Sanitize HTML content when needed
- Convert empty strings to undefined for optional fields

### 4. Security Considerations
- Sanitize all HTML content
- Validate file uploads strictly
- Limit array sizes and string lengths
- Use positive integer validation for IDs

### 5. Performance
- Use transforms sparingly (they run on every validation)
- Cache compiled schemas when possible
- Use `safeParse` in performance-critical paths

**Remember: Every server action must validate its inputs with Zod schemas. Never trust client-provided data, and always use TypeScript types derived from your schemas.**
