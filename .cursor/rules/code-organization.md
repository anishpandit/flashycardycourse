# Code Organization & Project Structure Rules

## Overview
**Focus: Maintainable, scalable, and secure project organization with clear separation of concerns.**

## Project Structure

### Recommended Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── decks/         # Deck-related endpoints
│   │   └── cards/         # Card-related endpoints
│   ├── decks/             # Deck pages
│   ├── cards/             # Card pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   ├── cards/            # Card-related components
│   └── decks/            # Deck-related components
├── lib/                  # Utility functions and configurations
│   ├── services/         # Business logic services
│   ├── utils/           # General utilities
│   ├── validations/     # Validation schemas
│   └── constants/       # Application constants
├── db/                   # Database related files
│   └── schema.ts        # Drizzle schema
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
└── middleware.ts        # Next.js middleware
```

## Service Layer Organization

### Database Services
```typescript
// src/lib/services/deck-service.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc } from 'drizzle-orm';
import { decksTable } from '@/db/schema';
import type { DeckInsert, DeckSelect } from '@/types/deck';

const db = drizzle(process.env.DATABASE_URL!);

export const deckService = {
  async getUserDecks(userId: string): Promise<DeckSelect[]> {
    return await db
      .select()
      .from(decksTable)
      .where(eq(decksTable.userId, userId))
      .orderBy(desc(decksTable.updatedAt));
  },

  async createDeck(userId: string, data: Omit<DeckInsert, 'userId'>): Promise<DeckSelect> {
    const result = await db
      .insert(decksTable)
      .values({ ...data, userId })
      .returning();
    return result[0];
  },

  // Other methods...
};
```

### API Service Layer
```typescript
// src/lib/services/api-service.ts
export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Deck operations
  async getDecks(): Promise<{ decks: Deck[] }> {
    return this.request('/decks');
  }

  async createDeck(data: CreateDeckRequest): Promise<{ deck: Deck }> {
    return this.request('/decks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Card operations
  async getDeckCards(deckId: number): Promise<{ cards: Card[] }> {
    return this.request(`/decks/${deckId}/cards`);
  }

  async createCard(deckId: number, data: CreateCardRequest): Promise<{ card: Card }> {
    return this.request(`/decks/${deckId}/cards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
```

## Type Definitions

### Centralized Type Management
```typescript
// src/types/deck.ts
export type DeckSelect = typeof decksTable.$inferSelect;
export type DeckInsert = typeof decksTable.$inferInsert;

export interface CreateDeckRequest {
  name: string;
  description?: string;
}

export interface UpdateDeckRequest {
  name?: string;
  description?: string;
}

export interface DeckWithCards extends DeckSelect {
  cards: CardSelect[];
}
```

```typescript
// src/types/card.ts
export type CardSelect = typeof cardsTable.$inferSelect;
export type CardInsert = typeof cardsTable.$inferInsert;

export interface CreateCardRequest {
  front: string;
  back: string;
}

export interface UpdateCardRequest {
  front?: string;
  back?: string;
}
```

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Custom Hooks

### Authentication Hooks
```typescript
// src/hooks/use-auth-guard.ts
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuthGuard(redirectTo: string = '/sign-in') {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push(redirectTo);
    }
  }, [isLoaded, userId, router, redirectTo]);

  return { isAuthenticated: !!userId, isLoaded };
}
```

### Data Fetching Hooks
```typescript
// src/hooks/use-decks.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiService } from '@/lib/services/api-service';
import type { Deck } from '@/types/deck';

export function useDecks() {
  const { isSignedIn, isLoaded } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchDecks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getDecks();
        setDecks(response.decks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load decks');
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [isLoaded, isSignedIn]);

  const refetch = async () => {
    if (!isSignedIn) return;
    
    try {
      setLoading(true);
      const response = await apiService.getDecks();
      setDecks(response.decks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh decks');
    } finally {
      setLoading(false);
    }
  };

  return { decks, loading, error, refetch };
}
```

### Form Hooks
```typescript
// src/hooks/use-form.ts
import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseFormOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
}

export function useForm<T>({ schema, initialValues, onSubmit }: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedValues = schema.parse(values);
      await onSubmit(validatedValues);
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
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, [schema, values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    setValue,
    handleSubmit,
    reset,
  };
}
```

## Validation Schemas

### Centralized Validation
```typescript
// src/lib/validations/deck.ts
import { z } from 'zod';

export const deckSchemas = {
  create: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters'),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
  }),

  update: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters')
      .optional(),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
  }),
};

export type CreateDeckInput = z.infer<typeof deckSchemas.create>;
export type UpdateDeckInput = z.infer<typeof deckSchemas.update>;
```

```typescript
// src/lib/validations/card.ts
import { z } from 'zod';

export const cardSchemas = {
  create: z.object({
    front: z.string()
      .min(1, 'Front content is required')
      .max(2000, 'Front content must be less than 2000 characters'),
    back: z.string()
      .min(1, 'Back content is required')
      .max(2000, 'Back content must be less than 2000 characters'),
  }),

  update: z.object({
    front: z.string()
      .min(1, 'Front content is required')
      .max(2000, 'Front content must be less than 2000 characters')
      .optional(),
    back: z.string()
      .min(1, 'Back content is required')
      .max(2000, 'Back content must be less than 2000 characters')
      .optional(),
  }),
};

export type CreateCardInput = z.infer<typeof cardSchemas.create>;
export type UpdateCardInput = z.infer<typeof cardSchemas.update>;
```

## Utility Functions

### Common Utilities
```typescript
// src/lib/utils/format.ts
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRelativeTime = (date: string | Date) => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
```

```typescript
// src/lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message);
  }
  
  return new AppError('An unexpected error occurred');
};

export const isClientError = (statusCode: number): boolean => {
  return statusCode >= 400 && statusCode < 500;
};

export const isServerError = (statusCode: number): boolean => {
  return statusCode >= 500;
};
```

## Constants and Configuration

### Application Constants
```typescript
// src/lib/constants/app.ts
export const APP_CONFIG = {
  name: 'Flashy Cardy Course',
  description: 'Learn with interactive flashcards',
  version: '1.0.0',
} as const;

export const LIMITS = {
  deck: {
    nameMaxLength: 255,
    descriptionMaxLength: 1000,
  },
  card: {
    contentMaxLength: 2000,
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
} as const;

export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',
  decks: '/decks',
  cards: '/cards',
  api: {
    decks: '/api/decks',
    cards: '/api/cards',
  },
} as const;
```

### Environment Configuration
```typescript
// src/lib/config/env.ts
export const env = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!,
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## Testing Organization

### Test Structure
```
__tests__/
├── api/                  # API route tests
│   ├── decks.test.ts
│   └── cards.test.ts
├── components/           # Component tests
│   ├── ui/
│   ├── forms/
│   └── decks/
├── lib/                 # Utility tests
│   ├── services/
│   └── utils/
├── hooks/               # Custom hook tests
└── setup/              # Test setup files
    ├── jest.config.js
    └── test-utils.tsx
```

### Test Utilities
```typescript
// __tests__/setup/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';
import { ReactElement } from 'react';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider publishableKey="pk_test_123">
      {children}
    </ClerkProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Code Quality Standards

### ESLint Configuration
```typescript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals', '@typescript-eslint/recommended'],
  rules: {
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Code quality
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Import organization
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling'],
      'newlines-between': 'always',
    }],
  },
};
```

### Naming Conventions

```typescript
// File naming
// ✅ kebab-case for files and directories
// src/components/deck-card.tsx
// src/lib/services/deck-service.ts

// ✅ PascalCase for components
export function DeckCard() {}
export class ApiService {}

// ✅ camelCase for functions and variables
const getUserDecks = () => {};
const deckService = new DeckService();

// ✅ SCREAMING_SNAKE_CASE for constants
const MAX_DECK_NAME_LENGTH = 255;
const API_ENDPOINTS = {
  DECKS: '/api/decks',
} as const;

// ✅ Descriptive naming
const isUserAuthenticated = checkAuth();
const createDeckMutation = useMutation();
```

## Development Workflow

### Git Workflow
```bash
# Feature branches
git checkout -b feature/deck-management
git checkout -b fix/card-validation
git checkout -b refactor/database-service

# Commit messages
git commit -m "feat: add deck creation functionality"
git commit -m "fix: resolve card validation error"
git commit -m "refactor: extract database operations to service layer"
```

### Code Review Checklist
- [ ] Authentication checks implemented
- [ ] Data properly scoped to user
- [ ] Input validation included
- [ ] Error handling implemented
- [ ] Types defined and used
- [ ] Tests written
- [ ] Accessibility considered
- [ ] Performance optimized

## Prohibited Patterns

### ❌ NEVER DO THESE

```typescript
// ❌ FORBIDDEN - Mixed concerns in components
function BadDeckComponent() {
  // Database logic in component
  const decks = await db.select().from(decksTable);
  return <div>{/* UI */}</div>;
}

// ❌ FORBIDDEN - Hardcoded values
const API_URL = 'https://api.example.com'; // Use environment variables

// ❌ FORBIDDEN - Poor error handling
function badFunction() {
  try {
    // operation
  } catch (e) {
    console.log(e); // Silent failure
  }
}

// ❌ FORBIDDEN - Direct file imports from deep paths
import { deckService } from '../../../../../lib/services/deck-service';
// Use path aliases: import { deckService } from '@/lib/services/deck-service';

// ❌ FORBIDDEN - Any types
function badFunction(data: any) { // Use proper types
  return data.someProperty;
}

// ❌ FORBIDDEN - Global state without proper management
let globalUserData = {}; // Use proper state management

// ❌ FORBIDDEN - Mixing database and UI logic
async function BadComponent() {
  const userId = await auth();
  const decks = await db.select().from(decksTable).where(eq(decksTable.userId, userId));
  return <div>{/* render decks */}</div>; // Move DB logic to service layer
}
```

**Remember: Maintain clear separation of concerns, use proper typing, and always scope data operations to the authenticated user.**
