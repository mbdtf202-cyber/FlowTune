export default {
  // Test environment
  testEnvironment: 'node',
  
  // Test timeout
  testTimeout: 30000,
  
  // Transform configuration
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Test suites configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/tests/controllers/**/*.test.js',
        '<rootDir>/tests/middleware/**/*.test.js',
        '<rootDir>/tests/services/**/*.test.js',
        '<rootDir>/tests/utils/**/*.test.js',
        '<rootDir>/tests/routes/**/*.test.js'
      ],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/tests/integration/**/*.test.js'
      ],
      testEnvironment: 'node'
    },
    {
      displayName: 'e2e',
      testMatch: [
        '<rootDir>/tests/e2e/**/*.test.js'
      ],
      testEnvironment: 'node'
    },
    {
      displayName: 'performance',
      testMatch: [
        '<rootDir>/tests/performance/**/*.test.js'
      ],
      testEnvironment: 'node'
    }
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true
};