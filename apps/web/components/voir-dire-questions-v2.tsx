'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  MessageSquare,
  Target,
  Scale,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
} from 'lucide-react';

interface VoirDireQuestion {
  question: string;
  purpose: string;
  targetArchetypes: string[];
  expectedResponses: {
    archetype: string;
    likelyResponse: string;
    redFlags: string[];
  }[];
  followUpPrompts: string[];
}

interface VoirDireQuestionSet {
  openingQuestions: VoirDireQuestion[];
  archetypeIdentification: VoirDireQuestion[];
  caseSpecific: VoirDireQuestion[];
  strikeJustification: VoirDireQuestion[];
}

interface VoirDireQuestionsV2Props {
  questionSet: VoirDireQuestionSet;
  caseType?: string;
  attorneySide?: string;
}

export function VoirDireQuestionsV2({
  questionSet,
  caseType,
  attorneySide,
}: VoirDireQuestionsV2Props) {
  const [activeCategory, setActiveCategory] = useState<string>('opening');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const categories = [
    {
      id: 'opening',
      label: 'Opening Questions',
      icon: MessageSquare,
      questions: questionSet.openingQuestions,
      description: 'Broad questions to start conversation',
    },
    {
      id: 'identification',
      label: 'Archetype Identification',
      icon: Target,
      questions: questionSet.archetypeIdentification,
      description: 'Questions to reveal behavioral patterns',
    },
    {
      id: 'case-specific',
      label: 'Case-Specific',
      icon: Scale,
      questions: questionSet.caseSpecific,
      description: 'Questions tied to case issues',
    },
    {
      id: 'strike',
      label: 'Strike Justification',
      icon: AlertTriangle,
      questions: questionSet.strikeJustification,
      description: 'Questions to document cause for strike',
    },
  ];

  const activeQuestions =
    categories.find((c) => c.id === activeCategory)?.questions || [];

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const copyQuestion = async (question: string, index: number) => {
    await navigator.clipboard.writeText(question);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-filevine-gray-900">
            Voir Dire Questions (V2)
          </h2>
          <p className="text-sm text-filevine-gray-600 mt-1">
            Strategic questions generated from persona "Phrases You'll Hear" data
          </p>
          {(caseType || attorneySide) && (
            <div className="flex gap-2 mt-2">
              {caseType && (
                <Badge variant="outline" className="text-xs">
                  {caseType}
                </Badge>
              )}
              {attorneySide && (
                <Badge variant="outline" className="text-xs capitalize">
                  {attorneySide} Attorney
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-filevine-gray-200">
        <div className="flex gap-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = category.questions.length;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeCategory === category.id
                    ? 'border-filevine-blue-500 text-filevine-blue-600'
                    : 'border-transparent text-filevine-gray-600 hover:text-filevine-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{category.label}</span>
                {count > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-xs px-1.5 py-0.5"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Description */}
      <Alert>
        <AlertDescription>
          {categories.find((c) => c.id === activeCategory)?.description}
        </AlertDescription>
      </Alert>

      {/* Questions List */}
      {activeQuestions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-filevine-gray-500">
            No questions available in this category
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeQuestions.map((q, index) => (
            <QuestionCard
              key={index}
              question={q}
              index={index}
              isExpanded={expandedQuestions.has(index)}
              onToggle={() => toggleQuestion(index)}
              onCopy={() => copyQuestion(q.question, index)}
              isCopied={copiedIndex === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  isExpanded,
  onToggle,
  onCopy,
  isCopied,
}: {
  question: VoirDireQuestion;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  isCopied: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Q{index + 1}
              </Badge>
              {question.targetArchetypes.length > 0 && (
                <div className="flex gap-1">
                  {question.targetArchetypes.slice(0, 3).map((archetype, i) => (
                    <Badge
                      key={i}
                      className="text-xs bg-purple-100 text-purple-700"
                    >
                      {archetype}
                    </Badge>
                  ))}
                  {question.targetArchetypes.length > 3 && (
                    <Badge className="text-xs bg-purple-100 text-purple-700">
                      +{question.targetArchetypes.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <CardTitle className="text-lg leading-relaxed">
              {question.question}
            </CardTitle>
            <CardDescription className="mt-2">
              <span className="font-medium">Purpose:</span> {question.purpose}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="shrink-0"
            >
              {isCopied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Expected Responses */}
          {question.expectedResponses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
                Expected Responses by Archetype
              </h4>
              <div className="space-y-3">
                {question.expectedResponses.map((response, i) => (
                  <div
                    key={i}
                    className="bg-filevine-gray-50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-purple-100 text-purple-700">
                        {response.archetype}
                      </Badge>
                    </div>
                    <p className="text-sm text-filevine-gray-700">
                      {response.likelyResponse}
                    </p>
                    {response.redFlags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-700 mb-1">
                          Red Flags:
                        </p>
                        <ul className="space-y-1">
                          {response.redFlags.map((flag, j) => (
                            <li
                              key={j}
                              className="text-xs text-red-600 flex items-start"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Prompts */}
          {question.followUpPrompts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
                Follow-up Questions
              </h4>
              <ul className="space-y-2">
                {question.followUpPrompts.map((prompt, i) => (
                  <li
                    key={i}
                    className="text-sm text-filevine-gray-700 flex items-start"
                  >
                    <span className="mr-2 text-filevine-blue-500">
                      {i + 1}.
                    </span>
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
