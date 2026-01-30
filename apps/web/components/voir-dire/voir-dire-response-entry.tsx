'use client';

import { useState, useEffect } from 'react';
import { useCreateVoirDireResponse } from '@/hooks/use-voir-dire-responses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Save, X } from 'lucide-react';

interface VoirDireResponseEntryProps {
  jurorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  suggestedQuestionId?: string;
  suggestedQuestionText?: string;
  caseQuestionId?: string;
  caseQuestionText?: string;
}

export function VoirDireResponseEntry({
  jurorId,
  isOpen,
  onClose,
  onSuccess,
  suggestedQuestionId,
  suggestedQuestionText,
  caseQuestionId,
  caseQuestionText,
}: VoirDireResponseEntryProps) {
  const [questionText, setQuestionText] = useState('');
  const [responseSummary, setResponseSummary] = useState('');
  const [yesNoAnswer, setYesNoAnswer] = useState<boolean | null>(null); // null = freeform, true = yes, false = no
  const [entryMethod, setEntryMethod] = useState<'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT'>('TYPED');
  const [responseTimestamp, setResponseTimestamp] = useState<string>('');

  const createMutation = useCreateVoirDireResponse();

  // Pre-populate question if provided
  useEffect(() => {
    if (caseQuestionText && isOpen) {
      setQuestionText(caseQuestionText);
    } else if (suggestedQuestionText && isOpen) {
      setQuestionText(suggestedQuestionText);
    } else if (isOpen) {
      setQuestionText('');
    }
    // Reset yes/no answer when dialog opens
    if (isOpen) {
      setYesNoAnswer(null);
      setResponseSummary('');
    }
  }, [caseQuestionText, suggestedQuestionText, isOpen]);

  // Set default timestamp to now when dialog opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setResponseTimestamp(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: either yes/no answer or response summary must be provided
    if (!questionText.trim() || (yesNoAnswer === null && !responseSummary.trim())) {
      return;
    }

    try {
      // Determine question type and ID
      const questionId = caseQuestionId || suggestedQuestionId;
      const questionType = caseQuestionId
        ? 'CASE_LEVEL'
        : suggestedQuestionId
        ? 'DISCRIMINATIVE'
        : 'CUSTOM';

      // If yes/no answer is set, use that as the summary; otherwise use the text summary
      const finalResponseSummary = yesNoAnswer !== null 
        ? (yesNoAnswer ? 'Yes' : 'No')
        : responseSummary.trim();

      await createMutation.mutateAsync({
        jurorId,
        input: {
          questionId,
          questionType,
          questionText: questionText.trim(),
          responseSummary: finalResponseSummary,
          yesNoAnswer: yesNoAnswer,
          entryMethod,
          responseTimestamp: responseTimestamp
            ? new Date(responseTimestamp).toISOString()
            : undefined,
        },
      });

      // Reset form
      setQuestionText('');
      setResponseSummary('');
      setYesNoAnswer(null);
      setEntryMethod('TYPED');
      setResponseTimestamp('');

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create voir dire response:', error);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setQuestionText('');
      setResponseSummary('');
      setYesNoAnswer(null);
      setEntryMethod('TYPED');
      setResponseTimestamp('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Voir Dire Response</DialogTitle>
          <DialogDescription>
            Record a question asked during voir dire and the juror's response
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Question Asked</Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the question that was asked..."
              rows={3}
              required
              disabled={createMutation.isPending}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responseSummary">Juror's Response</Label>
            
            {/* Yes/No Toggle */}
            <div className="flex items-center gap-4 mb-3">
              <span className="text-sm text-filevine-gray-600">Quick Answer:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setYesNoAnswer(yesNoAnswer === true ? null : true)}
                  disabled={createMutation.isPending}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    yesNoAnswer === true
                      ? 'bg-filevine-green text-white'
                      : 'bg-filevine-gray-100 text-filevine-gray-700 hover:bg-filevine-gray-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setYesNoAnswer(yesNoAnswer === false ? null : false)}
                  disabled={createMutation.isPending}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    yesNoAnswer === false
                      ? 'bg-filevine-red text-white'
                      : 'bg-filevine-gray-100 text-filevine-gray-700 hover:bg-filevine-gray-200'
                  }`}
                >
                  No
                </button>
                {yesNoAnswer !== null && (
                  <button
                    type="button"
                    onClick={() => setYesNoAnswer(null)}
                    disabled={createMutation.isPending}
                    className="text-xs text-filevine-gray-500 hover:text-filevine-gray-700 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Freeform Response */}
            <Textarea
              id="responseSummary"
              value={responseSummary}
              onChange={(e) => {
                setResponseSummary(e.target.value);
                // Clear yes/no answer when typing freeform
                if (yesNoAnswer !== null) {
                  setYesNoAnswer(null);
                }
              }}
              placeholder={yesNoAnswer !== null ? "Add additional notes (optional)..." : "Enter a summary of the juror's response..."}
              rows={5}
              required={yesNoAnswer === null}
              disabled={createMutation.isPending}
              className="resize-none"
            />
            {yesNoAnswer !== null && (
              <p className="text-xs text-filevine-gray-500">
                Answer set to: <strong>{yesNoAnswer ? 'Yes' : 'No'}</strong>. Add notes above if needed.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryMethod">Entry Method</Label>
              <select
                id="entryMethod"
                value={entryMethod}
                onChange={(e) =>
                  setEntryMethod(e.target.value as 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT')
                }
                disabled={createMutation.isPending}
                className="w-full rounded-md border border-filevine-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-filevine-blue"
              >
                <option value="TYPED">Typed</option>
                <option value="VOICE_TO_TEXT">Voice-to-Text</option>
                <option value="QUICK_SELECT">Quick Select</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseTimestamp">Response Time</Label>
              <Input
                id="responseTimestamp"
                type="datetime-local"
                value={responseTimestamp}
                onChange={(e) => setResponseTimestamp(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !questionText.trim() || (yesNoAnswer === null && !responseSummary.trim())}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Response
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
