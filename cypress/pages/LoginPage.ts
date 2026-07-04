import { selectors } from './selectors';
import { getFirstAvailable, getFirstTextInput } from '../utils/selectorHelpers';

export class LoginPage {
  visit(): void {
    cy.visit('/');
  }

  login(email: string, password: string): void {
    cy.get('body', { log: false }).then(($body) => {
      const emailSelector = selectors.login.emailInput.find((candidate) => $body.find(candidate).filter(':visible').length > 0);

      if (emailSelector) {
        cy.get(emailSelector).filter(':visible').first().clear({ force: true }).type(email, { force: true });
        return;
      }

      // Login screen currently shows two visible inputs with Bulgarian labels and no visible placeholder.
      // This fallback keeps the project runnable until stable data-testid attributes are added.
      getFirstTextInput('login email input').clear({ force: true }).type(email, { force: true });
    });

    getFirstAvailable(selectors.login.passwordInput, 'login password input')
      .clear({ force: true })
      .type(password, { log: false, force: true });

    // The current login form displays the Bulgarian label "Логин".
    // Some UI libraries render the visible text inside nested elements, so we keep the selector broad but scoped to clickable controls.
    cy.contains('button, [type="submit"], [role="button"], input[type="submit"]', selectors.login.submitButtonText)
      .should('be.visible')
      .click({ force: true });
  }

  assertLoggedIn(): void {
    cy.location('pathname', { timeout: 20000 }).should('not.match', /login|sign-in/i);
    cy.contains('body', /дашборд|заявки|партньори|dashboard|requests|partners/i, { timeout: 20000 }).should('be.visible');
  }
}
