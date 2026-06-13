import { execSync } from 'child_process';
import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    
    for (const env of ['production', 'preview', 'development']) {
      console.log(`Adding ${key} to ${env}...`);
      try {
        execSync(`npx vercel env add ${key} ${env} --value "${value}" --yes`, { stdio: 'inherit' });
      } catch (err) {
        console.warn(`Failed to add ${key} to ${env}:`, err.message);
      }
    }
  }
  console.log("All environment variables processed!");
} catch (err) {
  console.error("Error running script:", err);
}
