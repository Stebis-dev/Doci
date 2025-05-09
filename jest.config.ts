import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config> => ({
  projects: await getJestProjectsAsync(),
  coverageReporters: ['clover', 'json', 'lcov', ['text', { skipFull: true }], 'text-summary'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
});
