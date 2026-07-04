import { selectors } from './selectors';

export class NavigationPage {
  goToPartners(): void {
    // The sidebar is icon-only in the captured UI. Direct route navigation after login is more stable
    // and still validates that the Partners page can be loaded and used by an authenticated user.
    cy.visit(selectors.routes.partners);

    cy.location('pathname', { timeout: 10000 }).should('include', selectors.routes.partners);

    // The page title is rendered as a generic element in this application, not always as h1/h2.
    // The stronger business assertion is that the page exposes the create-partner action.
    cy.contains('button, a, [role="button"]', selectors.partners.createButtonText, { timeout: 10000 })
      .should('be.visible');
  }
}
