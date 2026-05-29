module.exports = {
  displayName: '@incident-postmortem/backend',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],
  coverageDirectory: '../../../coverage/backend',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@incidents/shared$': '<rootDir>/../shared/src/index',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@incidents)/)',
  ],
};

