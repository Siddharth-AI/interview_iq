'use client';

import { useCallback, useRef, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, UploadCloud, X } from 'lucide-react';
import {
  ALLOWED_RESUME_EXTENSIONS,
  ALLOWED_RESUME_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_MB,
} from '@interview-iq/shared';
import { useRequireAuth } from '@/lib/use-require-auth';
import { resumeApi } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api';
import { Stepper } from '@/components/stepper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const MAX_BYTES = DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024;

function validate(file: File): string | null {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const typeOk =
    (ALLOWED_RESUME_MIME_TYPES as readonly string[]).includes(file.type) ||
    (ALLOWED_RESUME_EXTENSIONS as readonly string[]).includes(ext);
  if (!typeOk) return 'Only PDF and DOCX files are supported.';
  if (file.size > MAX_BYTES) return `File must be under ${DEFAULT_MAX_FILE_SIZE_MB}MB.`;
  return null;
}

export default function UploadPage() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pick = useCallback((selected: File | null) => {
    if (!selected) return;
    const problem = validate(selected);
    if (problem) {
      setError(problem);
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files?.[0] ?? null);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const profile = await resumeApi.upload(file);
      router.push(`/profile/${profile.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Stepper current="Upload" />
      <h1 className="text-2xl font-semibold tracking-tight">Upload your resume</h1>
      <p className="mt-1 text-muted-foreground">
        We extract your skills and experience so questions fit you. PDF or DOCX, up to{' '}
        {DEFAULT_MAX_FILE_SIZE_MB}MB.
      </p>

      <Card className="mt-6">
        <CardContent className="pt-6">
          {uploading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Spinner />
              <p className="text-sm text-muted-foreground">
                Reading your resume and building your profile. This can take a few seconds.
              </p>
            </div>
          ) : (
            <>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload a resume file"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60'
                }`}
              >
                <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Drag and drop, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="sr-only"
                  onChange={(e) => pick(e.target.files?.[0] ?? null)}
                />
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" aria-hidden />
                    {file.name}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={() => setFile(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <Button className="mt-6 w-full" disabled={!file} onClick={upload}>
                Continue
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
