import type { PartnerData } from '../types/partner';
import { fillIfAvailable, normalizeText } from '../utils/selectorHelpers';
import { PartnerFormPage } from './PartnerFormPage';
import { selectors } from './selectors';

function isVisibleElement(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return Cypress.$(element).is(':visible') && rect.width > 0 && rect.height > 0;
}

function getClickableOwner(element: HTMLElement): HTMLElement {
  return element.closest('button, [role="button"], a') ?? element;
}

function isLikelyRowActionCandidate(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const text = normalizeText(element.textContent ?? '');
  const metadata = `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('data-testid') ?? ''}`;

  if (!isVisibleElement(element)) return false;

  return (
    text === '...' ||
    text === '…' ||
    text === '•••' ||
    text === '⋯' ||
    /more|actions|menu|MoreHoriz|ellipsis/i.test(metadata) ||
    element.matches('svg[data-testid="MoreHorizIcon"], [data-testid="MoreHorizIcon"]') ||
    (rect.left > window.innerWidth * 0.72 && rect.top > 140 && rect.width <= 90 && rect.height <= 90)
  );
}

function findActionCandidate($root: JQuery<HTMLElement>): HTMLElement | undefined {
  for (const selector of selectors.partners.rowActionButton) {
    const element = $root
      .find(selector)
      .filter((_index, candidate) => isVisibleElement(candidate as HTMLElement))
      .first()
      .get(0);

    if (element) return getClickableOwner(element as HTMLElement);
  }

  const visibleCandidates = $root
    .find('button, [role="button"], a, svg, div, span')
    .filter((_index, element) => isLikelyRowActionCandidate(element as HTMLElement))
    .toArray() as HTMLElement[];

  if (!visibleCandidates.length) return undefined;

  visibleCandidates.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    if (Math.abs(ar.top - br.top) > 12) return ar.top - br.top;
    return br.left - ar.left;
  });

  return getClickableOwner(visibleCandidates[0]);
}

export class PartnersPage {
  private readonly form = new PartnerFormPage();

  startPartnerCreation(): void {
    cy.contains('button, a, [role="button"]', selectors.partners.createButtonText, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    this.form.expectCreateFormVisible();
  }

  createPartner(partner: PartnerData): void {
    this.startPartnerCreation();
    this.form.fillRequiredPartnerDetails(partner);
    this.form.fillOptionalPartnerDetails(partner);
    this.form.save();

    this.openPartnersList();
  }

  openPartnersList(): void {
    cy.visit(selectors.routes.partners);

    cy.location('pathname', { timeout: 10000 }).should('include', selectors.routes.partners);

    cy.contains('button, a, [role="button"]', selectors.partners.createButtonText, { timeout: 15000 })
      .should('be.visible');
  }

  searchForPartner(partnerName: string): void {
    this.openPartnersList();

    fillIfAvailable(selectors.partners.searchInput, partnerName, 'partners search input');

    cy.contains('body', partnerName, { timeout: 20000 }).should('be.visible');
  }

  expectPartnerVisible(partnerName: string): void {
    cy.contains('body', partnerName, { timeout: 20000 }).should('be.visible');
  }

  updatePartnerName(currentName: string, updatedName: string): void {
    this.searchForPartner(currentName);
    this.openRowActionsForCurrentSearchResult();
    this.clickEditAction();

    this.form.updatePartnerName(updatedName);
    this.form.save();

    this.openPartnersList();
  }

  private openRowActionsForCurrentSearchResult(): void {
    cy.get('body', { timeout: 20000 }).should('be.visible');

    cy.get('body', { log: false }).then(($body) => {
      const actionCandidate = findActionCandidate($body);

      if (!actionCandidate) {
        throw new Error(
          'Could not find the Partner row actions menu. Prefer adding a stable data-cy="partner-row-actions" attribute to the application.'
        );
      }

      cy.wrap(Cypress.$(actionCandidate)).click({ force: true });
    });
  }

  private clickEditAction(): void {
    cy.contains('button, [role="menuitem"], [role="button"], a, div, span', selectors.partners.editButtonText, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    this.form.expectEditFormVisible();
  }
}