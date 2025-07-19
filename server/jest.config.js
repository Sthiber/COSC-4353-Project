export default {
  testEnvironment: 'node',
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.js",
    "controllers/**/*.js",
    "!app/createApp.js"
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 }
  }
};