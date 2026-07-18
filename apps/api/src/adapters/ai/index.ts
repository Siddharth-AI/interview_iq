import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import type {
  AIProvider,
  GenerateQuestionsInput,
  ScoreInterviewInput,
} from './types';
import { MockAIProvider } from './mock.provider';
import { OpenAIProvider } from './openai.provider';

export type { AIProvider } from './types';

/**
 * Wraps a primary provider and falls back to the deterministic mock on any failure
 * (network error, timeout, invalid output). The user flow therefore never fails because
 * of the AI layer. Every fallback is logged for observability.
 */
class FallbackAIProvider implements AIProvider {
  readonly name: string;

  constructor(
    private readonly primary: AIProvider,
    private readonly fallback: AIProvider,
  ) {
    this.name = `${primary.name}+fallback`;
  }

  private async guard<T>(op: string, run: (p: AIProvider) => Promise<T>): Promise<T> {
    try {
      return await run(this.primary);
    } catch (err) {
      logger.warn({
        msg: 'AI primary provider failed, using fallback',
        op,
        provider: this.primary.name,
        error: err instanceof Error ? err.message : String(err),
      });
      return run(this.fallback);
    }
  }

  extractProfile(resumeText: string) {
    return this.guard('extractProfile', (p) => p.extractProfile(resumeText));
  }

  generateQuestions(input: GenerateQuestionsInput) {
    return this.guard('generateQuestions', (p) => p.generateQuestions(input));
  }

  scoreInterview(input: ScoreInterviewInput) {
    return this.guard('scoreInterview', (p) => p.scoreInterview(input));
  }
}

let cached: AIProvider | undefined;

/** Returns the configured AI provider as a singleton. */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const mock = new MockAIProvider();
  if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
    cached = new FallbackAIProvider(new OpenAIProvider(), mock);
    logger.info({ msg: 'AI provider ready', provider: cached.name, model: env.OPENAI_MODEL });
  } else {
    cached = mock;
    logger.info({ msg: 'AI provider ready', provider: 'mock' });
  }
  return cached;
}
