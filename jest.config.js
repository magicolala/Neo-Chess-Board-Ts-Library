export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    pretendToBeVisual: true,
  },
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/demo'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.(test|spec).{ts,tsx}'],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\.(ogg|mp3|wav|mpe?g|png|gif|eot|otf|webp|svg|ttf|woff2?|ico)$':
      '<rootDir>/tests/__mocks__/fileMock.js',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
