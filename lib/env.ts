/** Normalize Vercel / Neon / local env names before Prisma or NextAuth boot. */
export function applyRuntimeEnv() {
  if (!process.env.DATABASE_URL) {
    const fallback =
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL;
    if (fallback) process.env.DATABASE_URL = fallback;
  }

  if (!process.env.DIRECT_URL) {
    const fallback =
      process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
    if (fallback) process.env.DIRECT_URL = fallback;
  }

  if (!process.env.NEXTAUTH_URL) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    }
  }
}

applyRuntimeEnv();
