# Cursor Rules for FlashyCardyCourse

This directory contains organized development rules for the FlashyCardyCourse project. Each file focuses on a specific aspect of development while maintaining a security-first approach with Clerk authentication.

## Rule Categories

### 🔐 [Authentication & Security](./authentication-security.md)
**CRITICAL: All authentication handled by Clerk. Users can only access their own data.**

- Clerk authentication patterns
- Data access security
- API route security templates
- Server action security
- Required security checks
- Environment security

### 🗄️ [Database](./database.md)
**MANDATORY: All database interactions use Drizzle ORM with user-scoped operations.**

- Drizzle ORM patterns
- User-scoped database queries
- Service layer implementation
- Type safety with database operations
- Performance optimization
- Migration guidelines

### 🛡️ [API Routes & Data Access](./api-routes.md)
**CRITICAL: All API routes must authenticate and enforce data isolation.**

- API route security templates
- Input validation schemas
- Error handling patterns
- Rate limiting and security headers
- API testing strategies
- Standardized responses

### 🎨 [Components & UI](./components-ui.md)
**Focus: Secure, accessible, and user-friendly components.**

- Authentication-aware components
- Data fetching patterns
- Form components with validation
- Reusable UI components
- Accessibility guidelines
- Performance optimization

### ⚡ [Server Components & Server Actions](./server-patterns.md)
**MANDATORY: Data retrieval via server components, mutations via server actions, all validated with Zod.**

- Server components for data fetching
- Server actions for mutations
- Zod validation patterns
- TypeScript types for server actions
- Client-server interaction patterns
- Performance optimization

### 🔍 [Validation Schemas](./validation-schemas.md)
**MANDATORY: All server action inputs must be validated with Zod schemas and typed with TypeScript.**

- Comprehensive Zod schema patterns
- Reusable validation utilities
- Input sanitization and transformation
- Error handling patterns
- Testing validation schemas

### 📁 [Code Organization](./code-organization.md)
**Focus: Maintainable, scalable, and secure project organization.**

- Project structure
- Service layer organization
- Type definitions
- Custom hooks
- Validation schemas
- Development workflow

## Core Security Principles

1. **Authentication First**: Every component and API route must handle authentication
2. **User Data Isolation**: No user should ever access data that doesn't belong to them
3. **Server-Side Validation**: Never trust client-side data - always use Zod validation
4. **Type Safety**: Use TypeScript throughout the application with typed server actions
5. **Error Security**: Don't expose sensitive information in error messages
6. **Server-First Architecture**: Use server components for data, server actions for mutations

## Quick Reference

### Authentication Check Pattern
```typescript
import { auth } from '@clerk/nextjs/server';

const { userId } = await auth();
if (!userId) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Database Query Pattern
```typescript
// ✅ CORRECT - Always filter by userId
const userDecks = await db
  .select()
  .from(decksTable)
  .where(eq(decksTable.userId, userId));

// ❌ FORBIDDEN - Never query without user context
const allDecks = await db.select().from(decksTable);
```

### Server Component Pattern (Data Fetching)
```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { deckService } from '@/lib/services/deck-service';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  
  const decks = await deckService.getUserDecks(userId);
  return <DeckList decks={decks} />;
}
```

### Server Action Pattern (Mutations)
```typescript
// lib/actions/deck-actions.ts
'use server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const createDeckSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function createDeckAction(input: z.infer<typeof createDeckSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const validatedData = createDeckSchema.parse(input);
  return await deckService.createDeck(userId, validatedData);
}
```

## Environment Requirements

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=postgresql://...
```

## Development Checklist

Before implementing any feature:

- [ ] Authentication checks in place
- [ ] Database queries scoped to user
- [ ] Data fetching via server components
- [ ] Mutations via server actions
- [ ] Input validation with Zod schemas
- [ ] TypeScript types defined (no FormData)
- [ ] Error handling secure
- [ ] Accessibility considered
- [ ] Tests written
- [ ] Revalidation after mutations

## Security Checklist

Before deploying:

- [ ] No hardcoded secrets
- [ ] All API routes authenticated
- [ ] All server actions authenticated
- [ ] Database queries user-scoped
- [ ] Error messages don't leak data
- [ ] Input validation on server with Zod
- [ ] No client-side data fetching
- [ ] No FormData types in server actions
- [ ] HTTPS in production
- [ ] Environment variables validated

## Mandatory Architecture Patterns

### ✅ REQUIRED Patterns

1. **Data Fetching**: Always use server components
2. **Data Mutations**: Always use server actions  
3. **Input Validation**: Always use Zod schemas
4. **Type Safety**: Always use TypeScript types (never FormData)
5. **Authentication**: Always check auth in server components/actions
6. **User Scoping**: Always filter database queries by userId

### ❌ FORBIDDEN Patterns

1. **Client-side data fetching** (useEffect + fetch)
2. **FormData types** in server actions
3. **Unvalidated inputs** to server actions
4. **Direct API routes** for mutations
5. **Database queries** without user filtering
6. **Client-side authentication** only

---

**Remember: Security is not optional. Every piece of data must be tied to the authenticated user, and there should be NO way for users to access data that doesn't belong to them. Use server components for data retrieval, server actions for mutations, and Zod for all validation.**
