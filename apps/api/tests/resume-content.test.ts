import { describe, it, expect } from 'vitest';
import { looksLikeResume } from '../src/services/resume.service';

describe('looksLikeResume', () => {
  it('accepts text that reads like a resume', () => {
    const resume = `Jane Doe
    jane.doe@example.com
    Summary: Senior Software Engineer with 8 years of experience.
    Experience: Acme Corp, 2019 - Present. Built and scaled services.
    Education: B.Tech in Computer Science, State University, 2015.
    Skills: TypeScript, React, Node.js.`;
    expect(looksLikeResume(resume)).toBe(true);
  });

  it('rejects an unrelated document', () => {
    const invoice = `INVOICE #4821
    Bill to: John Smith
    Item: Ceramic mug x2
    Amount due: 24.00 dollars
    Thank you for your purchase.`;
    expect(looksLikeResume(invoice)).toBe(false);
  });

  it('rejects generic prose with no resume signals', () => {
    const article = `The weather today is pleasant and calm. Many people enjoy a walk
    in the park when the sky is clear and the breeze is gentle.`;
    expect(looksLikeResume(article)).toBe(false);
  });
});
