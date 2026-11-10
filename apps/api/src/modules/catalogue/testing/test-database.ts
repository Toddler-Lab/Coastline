import type { PrismaService } from '../../../common/prisma/prisma.service';
import { seedTestCatalogue } from '../../../common/testing/integration-fixture';

/**
 * Reseeds the shared integration database.
 *
 * `seedTestCatalogue` truncates and re-inserts fixed ids without a lock, so a
 * second test process touching the same database at the same time can collide
 * with the inserts. Retrying keeps this suite stable; specs still run serially
 * because `vitest.config.ts` disables file parallelism.
 */
export async function reseedTestDatabase(prisma: PrismaService, attempts = 5): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await seedTestCatalogue(prisma);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }

  throw lastError;
}
