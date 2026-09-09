import 'dotenv/config';
import {defineConfig} from 'prisma/config';

// `prisma generate` only creates the client and must be able to run during a
// Vercel build before runtime secrets are injected. Migrations and the Prisma
// client still require a real DATABASE_URL when they actually connect.
const buildOnlyDatabaseUrl = 'postgresql://hoga:build-only@127.0.0.1:5432/hoga';
export default defineConfig({schema:'prisma/schema.prisma',migrations:{path:'prisma/migrations',seed:'tsx --env-file=.env prisma/seed.ts'},datasource:{url:process.env.DATABASE_URL||buildOnlyDatabaseUrl}});
