import { runSeed, type SeedProfile } from '../../src/seed.js';

const profile = (process.env['SEED_PROFILE'] ?? 'reference') as SeedProfile;
runSeed(profile === 'dev' ? 'dev' : 'reference').catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
