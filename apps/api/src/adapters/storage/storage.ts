import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';

export interface StoredFile {
  storagePath: string;
}

export interface StorageDriver {
  readonly kind: 'local';
  save(objectPath: string, buffer: Buffer, contentType?: string): Promise<StoredFile>;
  read(objectPath: string): Promise<Buffer>;
  remove(objectPath: string): Promise<void>;
}

/**
 * Local disk storage for uploaded resumes. The extracted resume text is persisted in the
 * database, so the raw file blob is not read back by any product flow; storage exists to
 * keep the original upload. Swap this driver for object storage (S3, GridFS) if durable,
 * shared file access is ever needed.
 */
class LocalStorageDriver implements StorageDriver {
  readonly kind = 'local' as const;
  private readonly root: string;

  constructor() {
    this.root = resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
  }

  private full(objectPath: string): string {
    return join(this.root, objectPath);
  }

  async save(objectPath: string, buffer: Buffer): Promise<StoredFile> {
    const target = this.full(objectPath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, buffer);
    return { storagePath: objectPath };
  }

  async read(objectPath: string): Promise<Buffer> {
    return readFile(this.full(objectPath));
  }

  async remove(objectPath: string): Promise<void> {
    await unlink(this.full(objectPath)).catch(() => undefined);
  }
}

let cached: StorageDriver | undefined;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  cached = new LocalStorageDriver();
  logger.info({ msg: 'Storage driver ready', driver: cached.kind });
  return cached;
}
