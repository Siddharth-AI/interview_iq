import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, useSupabaseStorage } from '../../config/env';
import { logger } from '../../lib/logger';

export interface StoredFile {
  storagePath: string;
}

export interface StorageDriver {
  readonly kind: 'supabase' | 'local';
  save(objectPath: string, buffer: Buffer, contentType: string): Promise<StoredFile>;
  read(objectPath: string): Promise<Buffer>;
  remove(objectPath: string): Promise<void>;
}

/** Supabase Storage driver. Files live in a private bucket, reachable only via the service role. */
class SupabaseStorageDriver implements StorageDriver {
  readonly kind = 'supabase' as const;
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor() {
    this.client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    this.bucket = env.SUPABASE_STORAGE_BUCKET;
  }

  async save(objectPath: string, buffer: Buffer, contentType: string): Promise<StoredFile> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(objectPath, buffer, { contentType, upsert: true });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return { storagePath: objectPath };
  }

  async read(objectPath: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucket).download(objectPath);
    if (error || !data) throw new Error(`Supabase download failed: ${error?.message}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async remove(objectPath: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([objectPath]);
  }
}

/** Local disk driver. Used when Supabase is not configured, so the app runs fully offline. */
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
  cached = useSupabaseStorage ? new SupabaseStorageDriver() : new LocalStorageDriver();
  logger.info({ msg: 'Storage driver ready', driver: cached.kind });
  return cached;
}
