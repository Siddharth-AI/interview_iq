import {
  candidateProfileSchema,
  assessmentResultSchema,
  QUESTIONS_PER_INTERVIEW,
  SCORE_MIN,
  SCORE_MAX,
  type CandidateProfile,
  type AssessmentResult,
} from '@interview-iq/shared';
import type {
  AIProvider,
  GenerateQuestionsInput,
  ScoreInterviewInput,
} from './types';

/**
 * Deterministic, offline AI provider. It produces plausible, schema-valid output using
 * transparent heuristics so the entire product flow works with zero external dependency,
 * and so tests are reproducible. It is also the fallback when the real provider fails.
 */

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express', 'Python',
  'Go', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
  'Microservices', 'System Design', 'Testing', 'CSS', 'Tailwind', 'Prisma',
  'Leadership', 'Mentoring', 'Agile',
];

const STRUCTURE_MARKERS = [
  'first', 'then', 'next', 'finally', 'because', 'therefore', 'for example',
  'as a result', 'situation', 'task', 'action', 'result', 'however', 'so that',
];

function clamp(value: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(value)));
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9.#+]+/g) ?? [];
}

function uniqueWordRatio(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  return new Set(tokens).size / tokens.length;
}

function firstSentences(text: string, count: number): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, count).join(' ');
}

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async extractProfile(resumeText: string): Promise<CandidateProfile> {
    const text = resumeText.trim();
    const lower = text.toLowerCase();

    const skills = KNOWN_SKILLS.filter((skill) => lower.includes(skill.toLowerCase())).slice(0, 20);

    // Build experience entries from lines that look like roles (contain "engineer",
    // "developer", "manager", or a date range).
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const roleLike = lines.filter((l) =>
      /(engineer|developer|manager|lead|architect|consultant|designer)/i.test(l),
    );
    const experience = roleLike.slice(0, 5).map((line) => ({
      title: line.slice(0, 120),
      company: '',
      duration: '',
      highlights: [],
    }));

    const summary =
      firstSentences(text, 3) ||
      'Experienced professional with a background across software delivery and product work.';

    return candidateProfileSchema.parse({
      summary: summary.slice(0, 2000),
      skills: skills.length > 0 ? skills : ['Communication', 'Problem Solving'],
      experience,
    });
  }

  async generateQuestions(input: GenerateQuestionsInput): Promise<string[]> {
    const { role, seniority, profile, jobDescription } = input;
    const topSkills = profile.skills.slice(0, 3);
    const skillA = topSkills[0] ?? 'your core stack';
    const skillB = topSkills[1] ?? 'a recent project';
    const jdFocus = jobDescription
      ? 'the responsibilities described in the job description'
      : `a ${role} role`;

    const questions = [
      `Walk me through a ${seniority}-level project where you used ${skillA}. What was your specific contribution and the outcome?`,
      `Describe a technical decision you made involving ${skillB}. What trade-offs did you weigh, and what would you change now?`,
      `Tell me about a time a system you owned failed in production. How did you detect, mitigate, and prevent it from recurring?`,
      `For ${jdFocus}, how would you design a feature end to end, from data model to user experience, under a tight deadline?`,
      `How do you keep quality high as a ${seniority} engineer: testing, review, and collaboration practices you rely on?`,
    ];

    return questions.slice(0, QUESTIONS_PER_INTERVIEW);
  }

  async scoreInterview(input: ScoreInterviewInput): Promise<AssessmentResult> {
    const scored = input.items.map((item) => this.scoreOne(item.question, item.answer));

    const avg = (key: keyof (typeof scored)[number]) =>
      scored.length === 0 ? 0 : scored.reduce((sum, s) => sum + s[key], 0) / scored.length;

    const relevance = clamp(avg('relevance'));
    const clarity = clamp(avg('clarity'));
    const structure = clamp(avg('structure'));
    const communication = clamp(avg('communication'));
    const overallScore = clamp((relevance + clarity + structure + communication) / 4);

    // Weakest answer becomes the coaching example.
    const weakestIndex = scored.reduce(
      (worst, s, i) => (s.total < scored[worst]!.total ? i : worst),
      0,
    );
    const weakest = input.items[weakestIndex] ?? input.items[0]!;

    const strengths = this.buildStrengths({ relevance, clarity, structure, communication });
    const improvements = this.buildImprovements({ relevance, clarity, structure, communication });

    return assessmentResultSchema.parse({
      overallScore,
      categoryScores: { relevance, clarity, structure, communication },
      strengths,
      improvements,
      improvedExample: {
        questionId: weakest.questionId,
        questionText: weakest.question,
        originalAnswer: weakest.answer,
        improvedAnswer: this.improveAnswer(weakest.question, weakest.answer, input.role),
        rationale:
          'Restructured with a clear situation, the specific action you took, and a measurable result, and tied it directly to the question.',
      },
    });
  }

  private scoreOne(question: string, answer: string) {
    const answerTokens = words(answer);
    const questionTokens = new Set(words(question));
    const length = answerTokens.length;

    // Relevance: overlap with the question plus adequate substance.
    const overlap = answerTokens.filter((t) => questionTokens.has(t)).length;
    const overlapRatio = length > 0 ? overlap / length : 0;
    const relevance = length === 0 ? 0 : 45 + overlapRatio * 200 + Math.min(length, 120) * 0.15;

    // Clarity: reward a healthy amount of content, penalize extremes.
    const clarity =
      length === 0 ? 0 : 55 + Math.min(length, 150) * 0.2 - Math.max(0, length - 320) * 0.1;

    // Structure: reward connective and STAR-style markers.
    const markerHits = STRUCTURE_MARKERS.filter((m) => answer.toLowerCase().includes(m)).length;
    const structure = length === 0 ? 0 : 50 + markerHits * 9;

    // Communication: vocabulary richness plus sufficient length.
    const communication =
      length === 0 ? 0 : 50 + uniqueWordRatio(answerTokens) * 40 + Math.min(length, 100) * 0.1;

    const r = clamp(relevance);
    const c = clamp(clarity);
    const s = clamp(structure);
    const m = clamp(communication);
    return { relevance: r, clarity: c, structure: s, communication: m, total: r + c + s + m };
  }

  private buildStrengths(scores: {
    relevance: number;
    clarity: number;
    structure: number;
    communication: number;
  }): string[] {
    const out: string[] = [];
    if (scores.relevance >= 65) out.push('Answers stayed on topic and addressed what was asked.');
    if (scores.structure >= 65) out.push('Responses followed a logical, easy-to-follow structure.');
    if (scores.communication >= 65)
      out.push('Clear communication with varied, precise vocabulary.');
    if (scores.clarity >= 65) out.push('Explanations were concise without losing detail.');
    if (out.length === 0)
      out.push('You engaged with every question and provided a complete set of answers.');
    return out.slice(0, 5);
  }

  private buildImprovements(scores: {
    relevance: number;
    clarity: number;
    structure: number;
    communication: number;
  }): string[] {
    const out: string[] = [];
    if (scores.structure < 70)
      out.push('Use the STAR method (Situation, Task, Action, Result) to structure answers.');
    if (scores.relevance < 70)
      out.push('Tie each answer back to the exact question and the target role.');
    if (scores.communication < 70)
      out.push('Add concrete metrics and outcomes to make impact tangible.');
    if (scores.clarity < 70)
      out.push('Lead with a one-sentence summary, then expand with supporting detail.');
    if (out.length === 0)
      out.push('Push for even more specificity: numbers, named technologies, and results.');
    return out.slice(0, 5);
  }

  private improveAnswer(question: string, original: string, role: string): string {
    const base = original.trim();
    const opener = `In my most recent ${role} work, `;
    const body = base.length > 0 ? base : 'I owned a feature end to end.';
    return `${opener}${body} Situation: I faced a concrete constraint. Task: I was responsible for the outcome. Action: I broke the work into clear steps and validated each. Result: the change shipped and improved a measurable metric. This directly answers the question by showing decision, execution, and impact.`;
  }
}
