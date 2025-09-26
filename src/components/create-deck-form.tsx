'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createDeckAction } from '@/lib/actions/deck-actions';
import { Plus } from 'lucide-react';

export function CreateDeckForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;

      const result = await createDeckAction({ name, description });
      
      if (result.success) {
        setIsOpen(false);
        // Form will be reset when component re-renders
      } else {
        setError(result.error || 'Failed to create deck');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent 
          className="flex flex-col items-center justify-center h-32 text-center"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Create new deck</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Deck</CardTitle>
        <CardDescription>
          Create a new flashcard deck to start learning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Enter deck name"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Enter deck description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Deck'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
