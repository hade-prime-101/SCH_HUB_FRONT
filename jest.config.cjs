module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.cjs'],
  moduleNameMapper: {
    '^@/(.*)\\.js$': '<rootDir>/dist/src/$1.js',
    '^@/(.*)$': '<rootDir>/dist/src/$1',
  },
};
