import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { unprocessable } from '../../lib/errors';
import { logger } from '../../lib/logger';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Extracts plain text from a resume buffer. Supports PDF and DOCX. The extracted text
 * feeds the AI profile extraction step. Failures surface as a clear 422.
 */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === PDF_MIME) {
      const result = await pdfParse(buffer);
      return normalise(result.text);
    }
    if (mimeType === DOCX_MIME) {
      const result = await mammoth.extractRawText({ buffer });
      return normalise(result.value);
    }
    throw unprocessable('Unsupported resume format');
  } catch (err) {
    if (err instanceof Error && err.name === 'AppError') throw err;
    logger.warn({ msg: 'Resume text extraction failed', error: (err as Error).message });
    throw unprocessable('Could not read text from this resume. Try a different file.');
  }
}

function normalise(text: string): string {
  return text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
