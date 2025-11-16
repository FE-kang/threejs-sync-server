import path from 'path';

export const ROOT_DIR: string = process.cwd();

export function resolveRoot(...segments: string[]): string {
  return path.join(ROOT_DIR, ...segments);
}