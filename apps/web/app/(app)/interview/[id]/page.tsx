'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, CloudOff, Loader2, Mic, MicOff } from 'lucide-react';
import type { InterviewResponse } from '@interview-iq/shared';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useSpeechToText } from '@/lib/use-speech-to-text';
import { interviewApi } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api';
import { Stepper } from '@/components/stepper';
import { ErrorState } from '@/components/states';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const draftKey = (id: string) => `interview-draft-${id}`;

export default function InterviewPage() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const interviewId = params.id;

  const [interview, setInterview] = useState<InterviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const lastSaved = useRef<Record<string, string>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await interviewApi.get(interviewId);
      if (data.status === 'completed' && data.assessmentId) {
        router.replace(`/assessment/${data.assessmentId}`);
        return;
      }
      setInterview(data);

      // Merge server answers with any local draft, preferring the local draft
      // so an interrupted session recovers unsaved edits after a refresh.
      const server: Record<string, string> = {};
      data.answers.forEach((a) => {
        server[a.questionId] = a.text;
      });
      lastSaved.current = { ...server };

      let draft: Record<string, string> = {};
      try {
        draft = JSON.parse(localStorage.getItem(draftKey(interviewId)) ?? '{}');
      } catch {
        draft = {};
      }
      setAnswers({ ...server, ...draft });
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : 'Could not load interview');
    } finally {
      setLoading(false);
    }
  }, [interviewId, router]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const persistDraft = useCallback(
    (next: Record<string, string>) => {
      try {
        localStorage.setItem(draftKey(interviewId), JSON.stringify(next));
      } catch {
        // Ignore storage failures (private mode, quota); server autosave still runs.
      }
    },
    [interviewId],
  );

  const saveAnswer = useCallback(
    async (questionId: string, text: string) => {
      if (lastSaved.current[questionId] === text) return;
      setSaveStatus('saving');
      try {
        await interviewApi.saveAnswer(interviewId, { questionId, text });
        lastSaved.current[questionId] = text;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [interviewId],
  );

  // Optional voice answers. Recognised speech is appended to the current answer,
  // then flows through the same autosave path as typing.
  const appendVoiceRef = useRef<(text: string) => void>(() => {});
  const speech = useSpeechToText((text) => appendVoiceRef.current(text));

  const questions = interview?.questions ?? [];
  const activeQuestion = questions[current];

  const onChangeAnswer = (value: string) => {
    if (!activeQuestion) return;
    const next = { ...answers, [activeQuestion.id]: value };
    setAnswers(next);
    persistDraft(next);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveAnswer(activeQuestion.id, value), 800);
  };

  // Kept current each render so the speech hook always appends to the live answer.
  appendVoiceRef.current = (text: string) => {
    if (!activeQuestion) return;
    const current = answers[activeQuestion.id] ?? '';
    const separator = current && !/\s$/.test(current) ? ' ' : '';
    onChangeAnswer(current + separator + text);
  };

  const flushCurrent = useCallback(async () => {
    if (!activeQuestion) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveAnswer(activeQuestion.id, answers[activeQuestion.id] ?? '');
  }, [activeQuestion, answers, saveAnswer]);

  const goTo = async (index: number) => {
    speech.stop();
    await flushCurrent();
    setCurrent(Math.max(0, Math.min(questions.length - 1, index)));
  };

  const answeredCount = questions.filter((q) => (answers[q.id] ?? '').trim().length > 0).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const complete = async () => {
    setCompleteError(null);
    speech.stop();
    await flushCurrent();
    setCompleting(true);
    try {
      const assessment = await interviewApi.complete(interviewId);
      localStorage.removeItem(draftKey(interviewId));
      router.push(`/assessment/${assessment.id}`);
    } catch (err) {
      setCompleteError(
        err instanceof ApiClientError ? err.message : 'Could not complete the interview',
      );
      setCompleting(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading interview" />
      </div>
    );
  }

  if (loadError || !interview || !activeQuestion) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState message={loadError ?? 'Interview not found'} onRetry={load} />
      </div>
    );
  }

  const isLast = current === questions.length - 1;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Stepper current="Interview" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{interview.role}</h1>
          <p className="text-sm capitalize text-muted-foreground">{interview.seniority} level</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-lg font-medium leading-relaxed">{activeQuestion.text}</p>

          {speech.supported && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                type="button"
                variant={speech.listening ? 'danger' : 'outline'}
                size="sm"
                onClick={speech.toggle}
                aria-pressed={speech.listening}
              >
                {speech.listening ? (
                  <>
                    <MicOff className="h-4 w-4" aria-hidden />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" aria-hidden />
                    Speak answer
                  </>
                )}
              </Button>
              {speech.listening && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-danger" aria-hidden />
                  Listening, speak your answer
                </span>
              )}
            </div>
          )}

          <label htmlFor="answer" className="sr-only">
            Your answer
          </label>
          <Textarea
            id="answer"
            className="mt-4"
            rows={9}
            placeholder="Structure your answer: situation, task, action, result."
            value={answers[activeQuestion.id] ?? ''}
            onChange={(e) => onChangeAnswer(e.target.value)}
            onBlur={() => void flushCurrent()}
          />
        </CardContent>
      </Card>

      {completeError && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {completeError}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => void goTo(current - 1)} disabled={current === 0}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Button>

        {isLast ? (
          <Button onClick={complete} loading={completing} disabled={!allAnswered}>
            <Check className="h-4 w-4" aria-hidden />
            Complete interview
          </Button>
        ) : (
          <Button onClick={() => void goTo(current + 1)}>
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      {isLast && !allAnswered && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Answer every question to complete. {questions.length - answeredCount} remaining.
        </p>
      )}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Saving
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <Check className="h-3.5 w-3.5" aria-hidden />
        Saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger">
        <CloudOff className="h-3.5 w-3.5" aria-hidden />
        Not saved
      </span>
    );
  }
  return null;
}
