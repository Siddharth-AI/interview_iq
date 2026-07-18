import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@interviewiq.app';
const DEMO_PASSWORD = 'Demo1234!';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Idempotent: reset the demo user's data on each seed run.
  const existing = await prisma.user.findFirst({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: 'Demo Candidate', passwordHash },
  });

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      filename: 'demo-resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12_000,
      storagePath: `${user.id}/demo-resume.pdf`,
      rawText: 'Senior Software Engineer with experience in TypeScript, React, Node.js, and PostgreSQL.',
    },
  });

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      summary:
        'Senior software engineer with eight years building product-focused web applications, strong in TypeScript, React, and Node.js, with a track record of leading delivery and mentoring.',
      skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'System Design'],
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'Acme Corp',
          duration: '2021 - Present',
          highlights: ['Led migration to a modular monolith', 'Mentored four engineers'],
        },
      ],
    },
  });

  const questions = [
    'Walk me through a senior-level project where you used TypeScript. What was your contribution and the outcome?',
    'Describe a technical decision involving React. What trade-offs did you weigh?',
    'Tell me about a production failure you owned. How did you detect, mitigate, and prevent recurrence?',
    'How would you design a feature end to end under a tight deadline?',
    'How do you keep quality high: testing, review, and collaboration practices?',
  ];

  const interview = await prisma.interview.create({
    data: {
      userId: user.id,
      profileId: profile.id,
      role: 'Senior Fullstack Engineer',
      seniority: 'senior',
      status: 'completed',
      questions: { create: questions.map((text, i) => ({ order: i + 1, text })) },
    },
    include: { questions: true },
  });

  for (const q of interview.questions) {
    await prisma.answer.create({
      data: {
        interviewId: interview.id,
        questionId: q.id,
        text: 'I led the work end to end, made a deliberate trade-off, executed in clear steps, and measured the result which improved a key metric.',
      },
    });
  }

  await prisma.assessment.create({
    data: {
      interviewId: interview.id,
      overallScore: 78,
      relevanceScore: 80,
      clarityScore: 76,
      structureScore: 74,
      communicationScore: 82,
      strengths: [
        'Answers stayed on topic and addressed what was asked.',
        'Clear communication with varied, precise vocabulary.',
      ],
      improvements: [
        'Use the STAR method to structure answers.',
        'Add concrete metrics to make impact tangible.',
      ],
      improvedExample: {
        questionId: interview.questions[2]!.id,
        questionText: questions[2],
        originalAnswer: 'We had an outage and I fixed it.',
        improvedAnswer:
          'Situation: a deploy caused elevated error rates. Task: I owned incident response. Action: I rolled back, added a regression test, and introduced a canary stage. Result: mean time to recovery dropped and the class of bug has not recurred.',
        rationale: 'Restructured with STAR and a measurable result tied to the question.',
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
