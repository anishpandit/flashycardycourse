'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createCardAction, updateCardAction, generateCardAction } from '@/lib/actions/card-actions';

interface CardFormProps {
  deckId: number;
  card?: {
    id: number;
    front: string;
    back: string;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function CardForm({ deckId, card, onCancel, onSuccess }: CardFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateDifficulty, setGenerateDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [generateCardType, setGenerateCardType] = useState<'definition' | 'question-answer' | 'concept-explanation' | 'vocabulary'>('question-answer');
  const isEditing = !!card;

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const front = formData.get('front') as string;
      const back = formData.get('back') as string;

      let result;
      if (isEditing) {
        result = await updateCardAction({ 
          id: card.id, 
          front, 
          back 
        });
      } else {
        result = await createCardAction({ 
          deckId, 
          front, 
          back 
        });
      }
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || `Failed to ${isEditing ? 'update' : 'create'} card`);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateTopic.trim()) {
      setError('Please enter a topic to generate content');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateCardAction({
        topic: generateTopic,
        difficulty: generateDifficulty,
        cardType: generateCardType
      });

      if (result.success && result.content) {
        // Populate the form fields with generated content
        const frontInput = document.getElementById('card-front') as HTMLTextAreaElement;
        const backInput = document.getElementById('card-back') as HTMLTextAreaElement;
        
        if (frontInput) frontInput.value = result.content.front;
        if (backInput) backInput.value = result.content.back;
        
        setShowGenerateForm(false);
        setGenerateTopic('');
      } else {
        setError(result.error || 'Failed to generate card content');
      }
    } catch (err) {
      setError('An unexpected error occurred while generating content');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-generate section */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Auto-generate Content</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            disabled={isLoading || isGenerating}
          >
            {showGenerateForm ? 'Hide' : 'Generate'}
          </Button>
        </div>
        
        {showGenerateForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generate-topic">Topic</Label>
              <Input
                id="generate-topic"
                value={generateTopic}
                onChange={(e) => setGenerateTopic(e.target.value)}
                placeholder="Enter a topic (e.g., 'Photosynthesis', 'World War II', 'Machine Learning')"
                disabled={isGenerating}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="generate-difficulty">Difficulty Level</Label>
                <select
                  id="generate-difficulty"
                  value={generateDifficulty}
                  onChange={(e) => setGenerateDifficulty(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={isGenerating}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="generate-type">Card Type</Label>
                <select
                  id="generate-type"
                  value={generateCardType}
                  onChange={(e) => setGenerateCardType(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={isGenerating}
                >
                  <option value="question-answer">Question & Answer</option>
                  <option value="definition">Definition</option>
                  <option value="concept-explanation">Concept Explanation</option>
                  <option value="vocabulary">Vocabulary</option>
                </select>
              </div>
            </div>
            
            {generateTopic.trim() && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Preview:</strong> Will generate a {generateCardType.replace('-', ' ')} card about "{generateTopic}" at {generateDifficulty} level.
                </p>
              </div>
            )}
            
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !generateTopic.trim()}
                className="w-full"
                variant="default"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Card Content'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-front">Front</Label>
          <Textarea 
            id="card-front" 
            name="front" 
            defaultValue={card?.front || ''}
            placeholder="Enter the front side of the card"
            rows={3}
            required
            disabled={isLoading || isGenerating}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="card-back">Back</Label>
          <Textarea 
            id="card-back" 
            name="back" 
            defaultValue={card?.back || ''}
            placeholder="Enter the back side of the card"
            rows={3}
            required
            disabled={isLoading || isGenerating}
          />
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading || isGenerating}>
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Card' : 'Create Card')
            }
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading || isGenerating}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
