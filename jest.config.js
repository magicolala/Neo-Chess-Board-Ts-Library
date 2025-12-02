const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  testTimeout: 30_000,
  testEnvironmentOptions: {
    pretendToBeVisual: true,
  },
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/demo'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.(test|spec).{ts,tsx}'],
  transform: {
    [String.raw`^.+\.(ts|tsx)$`]: [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    [String.raw`\.(css|less|scss|sass)$`]: 'identity-obj-proxy',
    [String.raw`\.(ogg|mp3|wav|mpe?g|png|gif|eot|otf|webp|svg|ttf|woff2?|ico)$`]:
      '<rootDir>/tests/__mocks__/fileMock.js',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

export default config;
