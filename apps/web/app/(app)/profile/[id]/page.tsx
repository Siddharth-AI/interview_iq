'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import {
  SENIORITY_LEVELS,
  type ExperienceEntry,
  type ProfileResponse,
  type Seniority,
} from '@interview-iq/shared';
import { useRequireAuth } from '@/lib/use-require-auth';
import { profileApi, interviewApi } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api';
import { Stepper } from '@/components/stepper';
import { ErrorState } from '@/components/states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

export default function ProfilePage() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const profileId = params.id;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);

  const [role, setRole] = useState('');
  const [seniority, setSeniority] = useState<Seniority>('mid');
  const [jobDescription, setJobDescription] = useState('');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await profileApi.get(profileId);
        setProfile(data);
        setSummary(data.summary);
        setSkills(data.skills);
        setExperience(data.experience);
      } catch (err) {
        setLoadError(err instanceof ApiClientError ? err.message : 'Could not load profile');
      } finally {
        setLoading(false);
      }
    },
    [profileId],
  );

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const addSkill = () => {
    const value = skillDraft.trim();
    if (value && !skills.includes(value)) setSkills([...skills, value]);
    setSkillDraft('');
  };

  const updateExperience = (index: number, patch: Partial<ExperienceEntry>) => {
    setExperience((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  };

  const startInterview = async () => {
    setSubmitError(null);
    if (role.trim().length < 2) {
      setSubmitError('Enter the target role you are practicing for.');
      return;
    }
    setSubmitting(true);
    try {
      await profileApi.update(profileId, { summary, skills, experience });
      const interview = await interviewApi.create({
        profileId,
        role: role.trim(),
        seniority,
        jobDescription: jobDescription.trim() || undefined,
      });
      router.push(`/interview/${interview.id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : 'Could not start the interview');
      setSubmitting(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading profile" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState message={loadError ?? 'Profile not found'} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Stepper current="Profile" />
      <h1 className="text-2xl font-semibold tracking-tight">Review your profile</h1>
      <p className="mt-1 text-muted-foreground">
        Edit anything that is off, then set your target role to generate the interview.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Candidate profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Summary" htmlFor="summary">
            <Textarea id="summary" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Skills</span>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} tone="primary" className="pr-1">
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </Badge>
              ))}
              {skills.length === 0 && (
                <span className="text-sm text-muted-foreground">No skills yet. Add a few below.</span>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                aria-label="Add a skill"
                placeholder="Add a skill"
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </Button>
            </div>
          </div>

          {experience.length > 0 && (
            <div className="space-y-3">
              <span className="block text-sm font-medium">Experience</span>
              {experience.map((entry, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-3">
                  <Input
                    aria-label="Job title"
                    value={entry.title}
                    onChange={(e) => updateExperience(index, { title: e.target.value })}
                  />
                  <Input
                    aria-label="Company"
                    placeholder="Company"
                    value={entry.company}
                    onChange={(e) => updateExperience(index, { company: e.target.value })}
                  />
                  <Input
                    aria-label="Duration"
                    placeholder="Duration"
                    value={entry.duration}
                    onChange={(e) => updateExperience(index, { duration: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Interview setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Target role" htmlFor="role">
            <Input
              id="role"
              placeholder="e.g. Senior Fullstack Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </Field>
          <Field label="Seniority" htmlFor="seniority">
            <select
              id="seniority"
              value={seniority}
              onChange={(e) => setSeniority(e.target.value as Seniority)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SENIORITY_LEVELS.map((level) => (
                <option key={level} value={level} className="capitalize">
                  {level}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Job description"
            htmlFor="jd"
            hint="Optional. Paste it to tailor questions more closely."
          >
            <Textarea
              id="jd"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </Field>

          {submitError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {submitError}
            </p>
          )}

          <Button className="w-full" loading={submitting} onClick={startInterview}>
            Generate interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
