'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Target,
  MessageSquare,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { VoirDireQuestionsV2 } from '@/components/voir-dire-questions-v2';
import { CaseStrategyV2 } from '@/components/case-strategy-v2';

export default function AITestingPage() {
  const [activeTab, setActiveTab] = useState('persona-suggester');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-filevine-gray-900">
          AI Services V2 Testing
        </h1>
        <p className="text-filevine-gray-600 mt-2">
          Test all Phase 4 AI services with production V2 persona data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="persona-suggester" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Persona Suggester
          </TabsTrigger>
          <TabsTrigger value="voir-dire" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Voir Dire Generator
          </TabsTrigger>
          <TabsTrigger value="case-strategy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Case Strategy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona-suggester" className="mt-6">
          <PersonaSuggesterTest />
        </TabsContent>

        <TabsContent value="voir-dire" className="mt-6">
          <VoirDireTest />
        </TabsContent>

        <TabsContent value="case-strategy" className="mt-6">
          <CaseStrategyTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Types for persona suggester results
interface PersonaSuggestion {
  persona: {
    id: string;
    name: string;
    archetype?: string;
    instantRead?: string;
    [key: string]: unknown; // Allow additional properties from API
  };
  confidence: number;
  reasoning?: string;
  dangerAssessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    plaintiffDanger: number;
    defenseDanger: number;
    recommendation: string;
  };
  strikeRecommendation?: {
    action: string;
    reasoning: string;
  };
  keyMatches?: string[];
}

interface PersonaSuggesterResult {
  suggestions: PersonaSuggestion[];
}

// Persona Suggester Testing Component
function PersonaSuggesterTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PersonaSuggesterResult | null>(null);
  const [jurorData, setJurorData] = useState(`{
  "firstName": "John",
  "lastName": "Smith",
  "age": 45,
  "occupation": "Software Engineer",
  "employer": "Tech Corp",
  "city": "San Francisco",
  "notes": "Seems analytical and detail-oriented"
}`);
  const [attorneySide, setAttorneySide] = useState<'plaintiff' | 'defense'>('plaintiff');

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // Parse juror data
      const juror = JSON.parse(jurorData);

      // Mock juror ID for testing (in real usage, this would come from DB)
      const mockJurorId = 'test-juror-' + Date.now();

      const response = await apiClient.post<PersonaSuggesterResult>('/personas/suggest', {
        jurorId: mockJurorId,
        attorneySide,
        // For testing, we'll simulate juror data
        juror,
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Persona Suggester V2</CardTitle>
          <CardDescription>
            Test persona matching with V2 enhanced data including danger assessments and strike
            recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attorney Side */}
          <div className="space-y-2">
            <Label>Attorney Side</Label>
            <Select value={attorneySide} onChange={(e) => setAttorneySide(e.target.value as 'plaintiff' | 'defense')}>
              <option value="plaintiff">Plaintiff</option>
              <option value="defense">Defense</option>
            </Select>
          </div>

          {/* Juror Data */}
          <div className="space-y-2">
            <Label>Juror Data (JSON)</Label>
            <Textarea
              value={jurorData}
              onChange={(e) => setJurorData(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>

          {/* Test Button */}
          <Button onClick={handleTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Persona Suggester'
            )}
          </Button>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully matched {result.suggestions?.length || 0} personas
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && result.suggestions && (
        <div className="space-y-4">
          {result.suggestions.map((suggestion: PersonaSuggestion, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {index + 1}. {suggestion.persona.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {suggestion.persona.archetype && (
                      <Badge className="bg-purple-100 text-purple-700">
                        {suggestion.persona.archetype}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instant Read */}
                {suggestion.persona.instantRead && (
                  <div>
                    <h4 className="text-sm font-semibold text-filevine-gray-700 mb-1">
                      Instant Read
                    </h4>
                    <p className="text-sm text-filevine-gray-600">
                      {suggestion.persona.instantRead}
                    </p>
                  </div>
                )}

                {/* Reasoning */}
                <div>
                  <h4 className="text-sm font-semibold text-filevine-gray-700 mb-1">
                    Reasoning
                  </h4>
                  <p className="text-sm text-filevine-gray-600">{suggestion.reasoning}</p>
                </div>

                {/* Danger Assessment */}
                {suggestion.dangerAssessment && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Assessment
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-filevine-gray-700">Level:</span>
                        <Badge
                          className={`text-xs ${
                            suggestion.dangerAssessment.level === 'critical'
                              ? 'bg-red-600 text-white'
                              : suggestion.dangerAssessment.level === 'high'
                              ? 'bg-orange-600 text-white'
                              : suggestion.dangerAssessment.level === 'medium'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-green-600 text-white'
                          }`}
                        >
                          {suggestion.dangerAssessment.level.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-filevine-gray-700">Plaintiff Danger:</span>
                        <span className="font-medium">
                          {suggestion.dangerAssessment.plaintiffDanger}/5
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-filevine-gray-700">Defense Danger:</span>
                        <span className="font-medium">
                          {suggestion.dangerAssessment.defenseDanger}/5
                        </span>
                      </div>
                      <p className="text-filevine-gray-700 pt-2 border-t">
                        {suggestion.dangerAssessment.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Strike Recommendation */}
                {suggestion.strikeRecommendation && (
                  <div
                    className={`border rounded-lg p-3 ${
                      suggestion.strikeRecommendation.action.includes('MUST STRIKE')
                        ? 'bg-red-50 border-red-200'
                        : suggestion.strikeRecommendation.action.includes('KEEP')
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
                      Strike Recommendation for {attorneySide} Attorney
                    </h4>
                    <Badge
                      className={`mb-2 ${
                        suggestion.strikeRecommendation.action.includes('MUST STRIKE')
                          ? 'bg-red-600 text-white'
                          : suggestion.strikeRecommendation.action.includes('KEEP')
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {suggestion.strikeRecommendation.action}
                    </Badge>
                    <p className="text-sm text-filevine-gray-700">
                      {suggestion.strikeRecommendation.reasoning}
                    </p>
                  </div>
                )}

                {/* Key Matches */}
                {suggestion.keyMatches && suggestion.keyMatches.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-filevine-gray-700 mb-2">
                      Key Matches
                    </h4>
                    <ul className="space-y-1">
                      {suggestion.keyMatches.map((match: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-filevine-gray-600 flex items-start"
                        >
                          <CheckCircle className="h-3 w-3 mr-2 mt-1 text-green-600 shrink-0" />
                          <span>{match}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Types for voir dire results
interface VoirDireResult {
  openingQuestions?: Array<{ question: string; purpose: string }>;
  archetypeIdentification?: Array<{ question: string; targetArchetype: string }>;
  caseSpecific?: Array<{ question: string; purpose: string }>;
  strikeJustification?: Array<{ question: string; purpose: string }>;
}

// Voir Dire Generator Testing Component
function VoirDireTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoirDireResult | null>(null);
  const [caseType, setCaseType] = useState('personal_injury');
  const [attorneySide, setAttorneySide] = useState<'plaintiff' | 'defense'>('plaintiff');
  const [keyIssues, setKeyIssues] = useState(
    'Defendant negligence\nCausation of injuries\nDamages calculation'
  );

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // For testing, we'll use a mock case ID
      // In production, this would be a real case from the database
      const mockCaseId = 'test-case-' + Date.now();

      const response = await apiClient.post(`/cases/${mockCaseId}/generate-questions-v2`, {
        attorneySide,
        plaintiffTheory: 'Defendant negligently caused severe injuries',
        defenseTheory: 'Plaintiff assumed the risk',
        questionCategories: ['opening', 'identification', 'case-specific', 'strike-justification'],
      });

      setResult(response.questionSet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Voir Dire Generator V2</CardTitle>
          <CardDescription>
            Generate strategic voir dire questions using &quot;Phrases You&apos;ll Hear&quot; data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Case Type */}
          <div className="space-y-2">
            <Label>Case Type</Label>
            <Select value={caseType} onChange={(e) => setCaseType(e.target.value)}>
              <option value="personal_injury">Personal Injury</option>
              <option value="medical_malpractice">Medical Malpractice</option>
              <option value="product_liability">Product Liability</option>
              <option value="employment">Employment</option>
              <option value="contract">Contract Dispute</option>
            </Select>
          </div>

          {/* Attorney Side */}
          <div className="space-y-2">
            <Label>Attorney Side</Label>
            <Select value={attorneySide} onChange={(e) => setAttorneySide(e.target.value as 'plaintiff' | 'defense')}>
              <option value="plaintiff">Plaintiff</option>
              <option value="defense">Defense</option>
            </Select>
          </div>

          {/* Key Issues */}
          <div className="space-y-2">
            <Label>Key Issues (one per line)</Label>
            <Textarea
              value={keyIssues}
              onChange={(e) => setKeyIssues(e.target.value)}
              rows={4}
              placeholder="Enter key case issues..."
            />
          </div>

          {/* Test Button */}
          <Button onClick={handleTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Questions...
              </>
            ) : (
              'Generate Voir Dire Questions'
            )}
          </Button>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully generated{' '}
                {(result.openingQuestions?.length || 0) +
                  (result.archetypeIdentification?.length || 0) +
                  (result.caseSpecific?.length || 0) +
                  (result.strikeJustification?.length || 0)}{' '}
                questions across 4 categories
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <VoirDireQuestionsV2
          questionSet={result}
          caseType={caseType}
          attorneySide={attorneySide}
        />
      )}
    </div>
  );
}

// Types for case strategy results
interface CaseStrategyResult {
  strikeRecommendations?: Array<{
    jurorId: string;
    jurorNumber: string;
    jurorName: string;
    action: string;
    priority: number;
    reasoning: string;
  }>;
  panelComposition?: Record<string, unknown>;
  overallStrategy?: string;
}

// Case Strategy Testing Component
function CaseStrategyTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaseStrategyResult | null>(null);
  const [attorneySide, setAttorneySide] = useState<'plaintiff' | 'defense'>('plaintiff');
  const [availableStrikes, setAvailableStrikes] = useState('6');

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // For testing, we'll use mock IDs
      const mockCaseId = 'test-case-' + Date.now();
      const mockPanelId = 'test-panel-' + Date.now();

      const response = await apiClient.post(`/cases/${mockCaseId}/strategy-v2`, {
        panelId: mockPanelId,
        attorneySide,
        availableStrikes: parseInt(availableStrikes),
      });

      setResult(response.strategy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Case Strategy V2</CardTitle>
          <CardDescription>
            Generate comprehensive case strategy using danger levels and strike/keep guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attorney Side */}
          <div className="space-y-2">
            <Label>Attorney Side</Label>
            <Select value={attorneySide} onChange={(e) => setAttorneySide(e.target.value as 'plaintiff' | 'defense')}>
              <option value="plaintiff">Plaintiff</option>
              <option value="defense">Defense</option>
            </Select>
          </div>

          {/* Available Strikes */}
          <div className="space-y-2">
            <Label>Available Strikes</Label>
            <Select value={availableStrikes} onChange={(e) => setAvailableStrikes(e.target.value)}>
              <option value="3">3 Strikes</option>
              <option value="6">6 Strikes</option>
              <option value="10">10 Strikes</option>
              <option value="12">12 Strikes</option>
            </Select>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertDescription>
              Note: This test requires a case with jurors who have persona mappings. In production,
              you would select an existing case and panel.
            </AlertDescription>
          </Alert>

          {/* Test Button */}
          <Button onClick={handleTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Strategy...
              </>
            ) : (
              'Generate Case Strategy'
            )}
          </Button>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully generated case strategy with{' '}
                {result.strikeRecommendations?.length || 0} strike recommendations
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <CaseStrategyV2
          strategy={result}
          attorneySide={attorneySide}
          availableStrikes={parseInt(availableStrikes)}
        />
      )}
    </div>
  );
}
