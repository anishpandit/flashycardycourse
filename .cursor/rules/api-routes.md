# API Routes & Data Access Rules

## Overview
**CRITICAL: All API routes must authenticate users and enforce data isolation through userId-scoped operations.**

## API Route Structure

### Required Template for All API Routes
```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'; // For validation

export async function GET/POST/PUT/DELETE(request: NextRequest) {
  try {
    // 1. AUTHENTICATION (MANDATORY)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // 2. INPUT VALIDATION (RECOMMENDED)
    // Validate request body/params

    // 3. DATABASE OPERATIONS (USER-SCOPED)
    // All operations must use userId

    // 4. RETURN RESPONSE
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Route Patterns by Resource

### Deck Routes

#### GET /api/decks - List User's Decks
```typescript
// app/api/decks/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { deckService } from '@/lib/services/deck-service';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decks = await deckService.getUserDecks(userId);
    return NextResponse.json({ decks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    );
  }
}
```

#### POST /api/decks - Create New Deck
```typescript
// app/api/decks/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deckService } from '@/lib/services/deck-service';

const createDeckSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDeckSchema.parse(body);

    const deck = await deckService.createDeck(userId, validatedData);
    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating deck:', error);
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    );
  }
}
```

#### GET /api/decks/[id] - Get Specific Deck
```typescript
// app/api/decks/[id]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { deckService } from '@/lib/services/deck-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = parseInt(params.id);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

    const deck = await deckService.getUserDeck(userId, deckId);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json({ deck });
  } catch (error) {
    console.error('Error fetching deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deck' },
      { status: 500 }
    );
  }
}
```

#### PUT /api/decks/[id] - Update Deck
```typescript
// app/api/decks/[id]/route.ts
const updateDeckSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = parseInt(params.id);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateDeckSchema.parse(body);

    const deck = await deckService.updateDeck(userId, deckId, validatedData);
    return NextResponse.json({ deck });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    console.error('Error updating deck:', error);
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    );
  }
}
```

#### DELETE /api/decks/[id] - Delete Deck
```typescript
// app/api/decks/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = parseInt(params.id);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

    await deckService.deleteDeck(userId, deckId);
    return NextResponse.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    );
  }
}
```

### Card Routes

#### GET /api/decks/[deckId]/cards - Get Deck's Cards
```typescript
// app/api/decks/[deckId]/cards/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { cardService } from '@/lib/services/card-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = parseInt(params.deckId);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

    const cards = await cardService.getUserDeckCards(userId, deckId);
    return NextResponse.json({ cards });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
```

#### POST /api/decks/[deckId]/cards - Create Card
```typescript
const createCardSchema = z.object({
  front: z.string().min(1, 'Front content is required'),
  back: z.string().min(1, 'Back content is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = parseInt(params.deckId);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createCardSchema.parse(body);

    const card = await cardService.createCard(userId, deckId, validatedData);
    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}
```

## Input Validation Schemas

### Common Validation Patterns
```typescript
import { z } from 'zod';

// Deck validation
export const deckSchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
  }),
  
  update: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
  }),
};

// Card validation
export const cardSchemas = {
  create: z.object({
    front: z.string().min(1, 'Front content is required').max(2000),
    back: z.string().min(1, 'Back content is required').max(2000),
  }),
  
  update: z.object({
    front: z.string().min(1).max(2000).optional(),
    back: z.string().min(1).max(2000).optional(),
  }),
};

// Query parameters
export const querySchemas = {
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
  
  search: z.object({
    q: z.string().max(100).optional(),
  }),
};
```

## Error Handling Patterns

### Standardized Error Responses
```typescript
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown): NextResponse => {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.errors },
      { status: 400 }
    );
  }
  
  console.error('Unexpected API error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
};

// Usage in routes
export async function POST(request: NextRequest) {
  try {
    // Route logic here
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Rate Limiting & Security Headers

### Rate Limiting (Recommended)
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check rate limit per user
  const { success } = await ratelimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Continue with route logic
}
```

### Security Headers
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ['/'],
  afterAuth(auth, req) {
    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## API Testing Patterns

### Test Structure
```typescript
// __tests__/api/decks.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/decks/route';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

describe('/api/decks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 for unauthenticated users', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: null });
      
      const { req } = createMocks({ method: 'GET' });
      const response = await handler.GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return user decks for authenticated users', async () => {
      const userId = 'user_123';
      (auth as jest.Mock).mockResolvedValue({ userId });
      
      // Mock service
      const mockDecks = [{ id: 1, name: 'Test Deck', userId }];
      deckService.getUserDecks = jest.fn().mockResolvedValue(mockDecks);
      
      const { req } = createMocks({ method: 'GET' });
      const response = await handler.GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.decks).toEqual(mockDecks);
      expect(deckService.getUserDecks).toHaveBeenCalledWith(userId);
    });
  });
});
```

## Prohibited API Patterns

### ❌ NEVER DO THESE

```typescript
// ❌ FORBIDDEN - No authentication check
export async function GET() {
  const decks = await db.select().from(decksTable);
  return NextResponse.json({ decks });
}

// ❌ FORBIDDEN - Trusting client-provided user ID
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  // NEVER trust this userId from client
}

// ❌ FORBIDDEN - Exposing other users' data
export async function GET() {
  const { userId } = await auth();
  const allDecks = await db.select().from(decksTable); // Wrong!
  return NextResponse.json({ decks: allDecks });
}

// ❌ FORBIDDEN - No input validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Using body directly without validation
  const deck = await deckService.createDeck(body.userId, body);
}

// ❌ FORBIDDEN - Exposing sensitive error details
export async function POST() {
  try {
    // operations
  } catch (error) {
    return NextResponse.json({ error: error.message }); // May expose internals
  }
}
```

## API Documentation

### Route Documentation Template
```typescript
/**
 * @api {get} /api/decks Get User's Decks
 * @apiName GetDecks
 * @apiGroup Decks
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieve all decks belonging to the authenticated user
 * 
 * @apiHeader {String} Authorization Bearer token from Clerk
 * 
 * @apiSuccess {Object[]} decks Array of user's decks
 * @apiSuccess {Number} decks.id Deck ID
 * @apiSuccess {String} decks.name Deck name
 * @apiSuccess {String} decks.description Deck description
 * @apiSuccess {String} decks.userId User ID (Clerk)
 * @apiSuccess {Date} decks.createdAt Creation timestamp
 * @apiSuccess {Date} decks.updatedAt Last update timestamp
 * 
 * @apiError (401) Unauthorized User not authenticated
 * @apiError (500) InternalServerError Database or server error
 */
export async function GET() {
  // Implementation
}
```

**Remember: Every API route must authenticate the user and scope all operations to that user's data. No exceptions.**
