import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve from this project, even when started from a different directory.
export const envPath = fileURLToPath(new URL('../.env', import.meta.url));
dotenv.config({ path: envPath, quiet: true });
