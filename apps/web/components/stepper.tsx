import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Upload', 'Profile', 'Interview', 'Assessment'] as const;
export type StepName = (typeof STEPS)[number];

export function Stepper({ current }: { current: StepName }) {
  const currentIndex = STEPS.indexOf(current);
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary text-primary',
                !done && !active && 'border-border text-muted-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm sm:inline',
                active ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
            {index < STEPS.length - 1 && (
              <span className={cn('h-px flex-1', done ? 'bg-primary' : 'bg-border')} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
