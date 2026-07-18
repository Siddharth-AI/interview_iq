'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Lightbulb, TrendingUp } from 'lucide-react';
import type { AssessmentResponse } from '@interview-iq/shared';
import { useRequireAuth } from '@/lib/use-require-auth';
import { assessmentApi } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api';
import { Stepper } from '@/components/stepper';
import { ErrorState } from '@/components/states';
import { ScoreRing, CategoryBar } from '@/components/score-visuals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function AssessmentPage() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const assessmentId = params.id;

  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssessment(await assessmentApi.get(assessmentId));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load assessment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  if (!ready || loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading assessment" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState message={error ?? 'Assessment not found'} onRetry={load} />
      </div>
    );
  }

  const categories = Object.entries(assessment.categoryScores);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Stepper current="Assessment" />
      <h1 className="text-2xl font-semibold tracking-tight">Your assessment</h1>
      <p className="mt-1 text-muted-foreground">{assessment.role}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <ScoreRing score={assessment.overallScore} />
            <span className="text-sm text-muted-foreground">Overall score</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map(([label, value]) => (
              <CategoryBar key={label} label={label} score={value} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assessment.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-warning" aria-hidden />
              Areas to improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assessment.improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
            Improved answer example
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium">{assessment.improvedExample.questionText}</p>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your answer
            </p>
            <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              {assessment.improvedExample.originalAnswer || 'No answer provided.'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
              Stronger version
            </p>
            <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
              {assessment.improvedExample.improvedAnswer}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{assessment.improvedExample.rationale}</p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => router.push('/upload')}>
          Practice again
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="outline" onClick={() => router.push('/history')}>
          View history
        </Button>
      </div>
    </div>
  );
}
