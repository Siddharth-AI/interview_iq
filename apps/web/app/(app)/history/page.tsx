'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FilePlus2 } from 'lucide-react';
import type { InterviewSummary } from '@interview-iq/shared';
import { useRequireAuth } from '@/lib/use-require-auth';
import { interviewApi } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api';
import { formatDate, scoreTone } from '@/lib/utils';
import { EmptyState, ErrorState } from '@/components/states';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

const statusTone = { setup: 'neutral', in_progress: 'warning', completed: 'success' } as const;

export default function HistoryPage() {
  const { ready } = useRequireAuth();
  const router = useRouter();

  const [items, setItems] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await interviewApi.history());
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const open = (item: InterviewSummary) => {
    if (item.status === 'completed' && item.assessmentId) {
      router.push(`/assessment/${item.assessmentId}`);
    } else {
      router.push(`/interview/${item.id}`);
    }
  };

  if (!ready || loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading history" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Interview history</h1>
          <p className="mt-1 text-muted-foreground">Revisit past assessments or resume a session.</p>
        </div>
        <Button onClick={() => router.push('/upload')}>
          <FilePlus2 className="h-4 w-4" aria-hidden />
          New
        </Button>
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No interviews yet"
            description="Upload a resume to run your first personalised mock interview."
            action={<Button onClick={() => router.push('/upload')}>Start practicing</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{item.role}</p>
                        <Badge tone={statusTone[item.status]}>{item.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                        {item.seniority} level · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {item.overallScore !== null && (
                        <Badge tone={scoreTone(item.overallScore)} className="font-mono">
                          {item.overallScore}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => open(item)}>
                        {item.status === 'completed' ? 'View' : 'Resume'}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
