import { LoginPage } from '../pages/LoginPage';
import { getRequiredEnv } from '../utils/env';

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  const loginPage = new LoginPage();

  loginPage.visit();
  loginPage.login(getRequiredEnv('email'), getRequiredEnv('password'));
  loginPage.assertLoggedIn();
});

export {};
