module.exports = {
  testPathIgnorePatterns: ["<rootDir>/.next/"],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/utils/functions/$1',
  },
};
