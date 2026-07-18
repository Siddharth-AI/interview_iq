'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ListChecks, Sparkles, Target } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  { icon: FileText, title: 'Resume aware', body: 'Upload a resume and review an extracted profile before you begin.' },
  { icon: Target, title: 'Role specific', body: 'Five questions personalised to your target role and seniority.' },
  { icon: ListChecks, title: 'Autosaved practice', body: 'Answer at your pace. Sessions resume exactly where you left off.' },
  { icon: Sparkles, title: 'Scored feedback', body: 'Category scores, strengths, and one improved answer example.' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/upload');
  }, [loading, user, router]);

  return (
    <div className="animate-fade-in">
      <section className="py-10 text-center sm:py-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          AI interview practice
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Practice interviews that adapt to your resume and role
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
          Upload your resume, run a short personalised mock interview, and get a clear, scored
          assessment with actionable next steps.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push('/register')}>
            Get started
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Demo login: demo@interviewiq.app / Demo1234!
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="flex gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-medium">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
