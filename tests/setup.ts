import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local for vitest
dotenv.config({ path: resolve(__dirname, '../.env.local') });
