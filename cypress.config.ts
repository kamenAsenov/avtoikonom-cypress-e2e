import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'https://dev.admin.avtoikonom.com',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    screenshotOnRunFailure: true,
    video: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      email: process.env.CYPRESS_EMAIL,
      password: process.env.CYPRESS_PASSWORD
    },
    setupNodeEvents(_on, config) {
      // Placeholder for future reporting/plugins without changing test code.
      return config;
    }
  }
});
