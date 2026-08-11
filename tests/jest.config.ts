import type { Config } from 'jest';

const config: Config = {
  // ── Use test-specific tsconfig ────────────────────────
  preset         : 'ts-jest',
  testEnvironment: 'node',
  rootDir        : '..',   // Project root — so <rootDir>/src and <rootDir>/tests resolve correctly

  // ── ESM / CJS handling ────────────────────────────────
  // Use CommonJS for Jest compatibility
  extensionsToTreatAsEsm: [],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig    : '<rootDir>/tests/tsconfig.test.json',
        useESM      : false,
        diagnostics : { ignoreCodes: [1343] },
      },
    ],
  },

  // ── Module Path Aliases ───────────────────────────────
  moduleNameMapper: {
    // ✅ nanoid is ESM-only — stub it out for CJS Jest (must be before generic rules)
    '^nanoid$': '<rootDir>/tests/__mocks__/nanoid.ts',
    // ✅ pdf-parse loads @napi-rs/canvas (native GC) — stub to prevent open handle
    '^pdf-parse$': '<rootDir>/tests/__mocks__/pdf-parse.ts',
    // ✅ Bull queues open Redis connections on import — stub for tests (must be before @/ catch-all)
    '^@/jobs/queues(\\.js)?$': '<rootDir>/tests/__mocks__/queues.ts',
    // ✅ Maps @/foo.js → src/foo (strips .js extension from alias imports)
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    // ✅ Maps @/foo → src/foo (no extension)
    '^@/(.*)$': '<rootDir>/src/$1',
    // ✅ Strips .js from relative imports — required for ESM→CJS compatibility
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // ── Setup Files ───────────────────────────────────────
  // setupFiles runs in worker BEFORE any module is imported — so env.ts
  // sees the test variables when it calls envSchema.parse(process.env)
  setupFiles         : ['<rootDir>/tests/env.setup.ts'],
  setupFilesAfterEnv : ['<rootDir>/tests/jest.setup.ts'],
  globalSetup        : '<rootDir>/tests/global.setup.ts',
  globalTeardown     : '<rootDir>/tests/global.teardown.ts',

  // ── Test Discovery ────────────────────────────────────
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
  ],

  // ── Coverage ──────────────────────────────────────────
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/config/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      // Thresholds raised incrementally as test coverage grows
      branches  : 2,
      functions : 3,
      lines     : 25,
      statements: 25,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // ── Behavior ──────────────────────────────────────────
  testTimeout      : 30_000,
  clearMocks       : true,
  resetMocks       : false,
  restoreMocks     : false,
  forceExit        : true,
  detectOpenHandles: true,
  verbose          : true,
};

export default config;