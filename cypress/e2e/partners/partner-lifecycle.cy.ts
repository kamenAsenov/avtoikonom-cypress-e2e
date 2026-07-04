type TestPartner = {
  name: string;
  address: string;
  phone: string;
  contactPerson: string;
  description: string;
  updatedDescription: string;
};

Cypress.on('uncaught:exception', (error) => {
  const message = error.message ?? '';

  if (message.includes("reading 'location'") || message.includes('Cannot read properties of undefined')) {
    return false;
  }

  return true;
});

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Cypress.$(element).is(':visible')
  );
}

function getMainPartnerModal(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('.ant-modal-content:visible, [role="dialog"]:visible', { timeout: 15000 }).then(($modals) => {
    const partnerModals = $modals
      .filter((_index, element) => {
        const text = normalizeText(element.textContent ?? '');

        return /new partner|нов партньор|edit partner|промени партньор/i.test(text) && !/edit photo/i.test(text);
      })
      .toArray() as HTMLElement[];

    if (!partnerModals.length) {
      throw new Error('Could not find the main Partner modal.');
    }

    return cy.wrap(Cypress.$(partnerModals[partnerModals.length - 1])).should('be.visible');
  });
}

function clickModalHeaderToBlur(): void {
  getMainPartnerModal().click(30, 25, { force: true });
  cy.wait(250);
}

function findLabelInModal($modal: JQuery<HTMLElement>, labelPattern: RegExp): HTMLElement {
  const labels = $modal
    .find('label, div, span, p')
    .filter((_index, element) => {
      const text = normalizeText(element.textContent ?? '');

      return text.length > 0 && text.length <= 90 && labelPattern.test(text);
    })
    .toArray() as HTMLElement[];

  if (!labels.length) {
    throw new Error(`Could not find modal label: ${labelPattern}`);
  }

  labels.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    if (Math.abs(ar.top - br.top) > 10) return ar.top - br.top;

    return ar.left - br.left;
  });

  return labels[0];
}

function getControlForLabel(
  labelPattern: RegExp,
  controlSelector: string,
  maxVerticalDistance = 35
): Cypress.Chainable<JQuery<HTMLElement>> {
  return getMainPartnerModal().then(($modal) => {
    const label = findLabelInModal($modal, labelPattern);
    const labelRect = label.getBoundingClientRect();
    const labelCenterY = labelRect.top + labelRect.height / 2;

    const candidates = $modal
      .find(controlSelector)
      .filter((_index, element) => {
        const el = element as HTMLElement;
        const rect = el.getBoundingClientRect();

        if (!isVisible(el)) return false;
        if (rect.left <= labelRect.left + 40) return false;

        return true;
      })
      .toArray() as HTMLElement[];

    const scoredCandidates = candidates
      .map((candidate) => {
        const rect = candidate.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;

        return {
          element: candidate,
          distance: Math.abs(centerY - labelCenterY),
          rect
        };
      })
      .sort((a, b) => {
        if (Math.abs(a.distance - b.distance) > 2) return a.distance - b.distance;

        return a.rect.left - b.rect.left;
      });

    const bestCandidate = scoredCandidates[0];

    if (!bestCandidate || bestCandidate.distance > maxVerticalDistance) {
      const debug = scoredCandidates.map((candidate) => ({
        text: normalizeText(candidate.element.textContent ?? ''),
        tag: candidate.element.tagName,
        className: String(candidate.element.className),
        top: Math.round(candidate.rect.top),
        centerY: Math.round(candidate.rect.top + candidate.rect.height / 2),
        left: Math.round(candidate.rect.left),
        width: Math.round(candidate.rect.width),
        height: Math.round(candidate.rect.height),
        distanceFromLabel: Math.round(candidate.distance)
      }));

      console.table(debug);

      throw new Error(
        `Could not find same-row control for label ${labelPattern}. Closest distance: ${
          bestCandidate ? Math.round(bestCandidate.distance) : 'none'
        }`
      );
    }

    return cy.wrap(Cypress.$(bestCandidate.element));
  });
}

function fillInputByPlaceholder(pattern: RegExp, value: string): void {
  getMainPartnerModal().then(($modal) => {
    const input = $modal
      .find('input')
      .filter((_index, element) => {
        const htmlInput = element as HTMLInputElement;
        const placeholder = htmlInput.placeholder ?? '';

        return (
          isVisible(htmlInput) &&
          htmlInput.type !== 'hidden' &&
          htmlInput.type !== 'file' &&
          !htmlInput.disabled &&
          pattern.test(placeholder)
        );
      })
      .first();

    if (!input.length) {
      throw new Error(`Could not find visible modal input by placeholder: ${pattern}`);
    }

    cy.wrap(input).click({ force: true }).clear({ force: true }).type(value, { force: true });
  });
}

function fillInputByLabel(labelPattern: RegExp, value: string): void {
  getControlForLabel(labelPattern, 'input:not([type="hidden"]):not([type="file"])')
    .click({ force: true })
    .clear({ force: true })
    .type(value, { force: true });
}

function fillTextareaByPlaceholder(pattern: RegExp, value: string): void {
  getMainPartnerModal().then(($modal) => {
    const textarea = $modal
      .find('textarea')
      .filter((_index, element) => {
        const htmlTextarea = element as HTMLTextAreaElement;
        const placeholder = htmlTextarea.placeholder ?? '';

        return isVisible(htmlTextarea) && !htmlTextarea.disabled && pattern.test(placeholder);
      })
      .first();

    if (!textarea.length) {
      throw new Error(`Could not find visible modal textarea by placeholder: ${pattern}`);
    }

    cy.wrap(textarea).click({ force: true }).clear({ force: true }).type(value, { force: true });
  });
}

function fillTextareaByLabel(labelPattern: RegExp, value: string): void {
  getControlForLabel(labelPattern, 'textarea')
    .click({ force: true })
    .clear({ force: true })
    .type(value, { force: true });
}

function assertTextareaByLabel(labelPattern: RegExp, expectedValue: string): void {
  getControlForLabel(labelPattern, 'textarea').should(($textarea) => {
    const value = String(($textarea.get(0) as HTMLTextAreaElement).value ?? '');

    expect(value).to.eq(expectedValue);
  });
}

function openDropdownByLabel(labelPattern: RegExp): void {
  getControlForLabel(labelPattern, '.ant-select-selector', 35).click({ force: true });
  cy.wait(400);
}

function selectOpenDropdownOption(optionPattern: RegExp, fieldName: string): void {
  cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', { timeout: 10000 }).then(
    ($options) => {
      const visibleOptions = $options
        .filter((_index, element) => {
          const text = normalizeText(element.textContent ?? '');

          return text.length > 0 && isVisible(element as HTMLElement);
        })
        .toArray() as HTMLElement[];

      const matchingOptions = visibleOptions.filter((element) => {
        const text = normalizeText(element.textContent ?? '');

        return optionPattern.test(text);
      });

      if (!matchingOptions.length) {
        const visibleTexts = visibleOptions.map((element) => normalizeText(element.textContent ?? '')).join(' | ');

        throw new Error(
          `Could not find option for ${fieldName}. Pattern: ${optionPattern}. Visible options: ${visibleTexts}`
        );
      }

      cy.wrap(Cypress.$(matchingOptions[0])).click({ force: true });
    }
  );

  cy.wait(250);
}

function assertDropdownValue(labelPattern: RegExp, expectedPattern: RegExp, fieldName: string): void {
  getControlForLabel(labelPattern, '.ant-select-selector', 35).should(($control) => {
    const text = normalizeText($control.text());

    expect(text, `${fieldName} selected value`).to.match(expectedPattern);
  });
}

function selectDropdownByLabel(
  labelPattern: RegExp,
  optionPattern: RegExp,
  expectedValuePattern: RegExp,
  fieldName: string
): void {
  openDropdownByLabel(labelPattern);
  selectOpenDropdownOption(optionPattern, fieldName);
  assertDropdownValue(labelPattern, expectedValuePattern, fieldName);
  clickModalHeaderToBlur();
}

function fillPartnerName(value: string): void {
  fillInputByPlaceholder(/write partner name|partner name|напиши име|име на партньор/i, value);
}

function selectFirstAddressSuggestion(): void {
  cy.wait(1000);

  cy.get('body', { timeout: 10000 }).then(($body) => {
    const suggestions = $body
      .find(
        [
          '.pac-container .pac-item',
          '.pac-item',
          '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option',
          '.ant-select-dropdown:not(.ant-select-dropdown-hidden) [role="option"]',
          '[role="option"]'
        ].join(', ')
      )
      .filter((_index, element) => {
        const text = normalizeText(element.textContent ?? '');

        return text.length > 0 && isVisible(element as HTMLElement);
      })
      .toArray() as HTMLElement[];

    if (suggestions.length) {
      cy.wrap(Cypress.$(suggestions[0])).click({ force: true });
      return;
    }

    cy.focused().type('{downarrow}{enter}', { force: true });
  });

  cy.wait(500);
}

function fillAddress(value: string): void {
  fillInputByPlaceholder(/enter a location|location|въведи локация|локация/i, value);

  selectFirstAddressSuggestion();

  clickModalHeaderToBlur();
}

function fillPhone(value: string): void {
  fillInputByLabel(/^telephone\s*\*?$|^phone\s*\*?$|^телефон\s*\*?$/i, value);
}

function fillContactPerson(value: string): void {
  fillInputByPlaceholder(/names of contact person|contact person|имена на лицето|лице за контакт/i, value);
}

function fillDescription(value: string): void {
  fillTextareaByPlaceholder(/write description|description|напиши описание|описание/i, value);
}

function savePhotoEditorIfOpened(): void {
  cy.get('body', { timeout: 10000 }).then(($body) => {
    const photoModal = $body
      .find('.ant-modal-content:visible, [role="dialog"]:visible')
      .filter((_index, element) => {
        const text = normalizeText(element.textContent ?? '');

        return /edit photo|crop|снимка|редактирай/i.test(text);
      })
      .last();

    if (!photoModal.length) {
      return;
    }

    cy.wrap(photoModal).within(() => {
      cy.contains('button, [role="button"]', /^save$|^запази$/i, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true });
    });

    cy.wait(1000);
  });
}

function uploadLogoIfExists(): void {
  cy.get('body', { log: false }).then(($body) => {
    const input = $body.find('.ant-modal-content input[type="file"], [role="dialog"] input[type="file"]').first();

    if (!input.length) {
      return;
    }

    cy.wrap(input).selectFile('cypress/fixtures/qa-logo.png', { force: true });
  });

  cy.wait(700);
  savePhotoEditorIfOpened();
}

function saveMainPartnerModal(): void {
  savePhotoEditorIfOpened();

  getMainPartnerModal().within(() => {
    cy.contains('button, [role="button"]', /^save$|^запази$/i, { timeout: 10000 })
      .scrollIntoView()
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });
  });

  cy.get('.ant-modal-content:visible, [role="dialog"]:visible', { timeout: 20000 }).should('not.exist');
}

function cancelMainPartnerModal(): void {
  getMainPartnerModal().within(() => {
    cy.contains('button, [role="button"]', /^cancel$|^отказ$/i, { timeout: 10000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });
  });

  cy.get('.ant-modal-content:visible, [role="dialog"]:visible', { timeout: 10000 }).should('not.exist');
}

function login(): void {
  cy.visit('/login');

  cy.get('input:visible')
    .not('[type="password"]')
    .first()
    .clear({ force: true })
    .type(Cypress.env('email'), { force: true });

  cy.get('input[type="password"]:visible')
    .first()
    .clear({ force: true })
    .type(Cypress.env('password'), { force: true });

  cy.contains('button, [role="button"]', /login|логин|sign in|вход|влез/i, { timeout: 10000 })
    .should('be.visible')
    .click({ force: true });

  cy.location('pathname', { timeout: 20000 }).should('not.include', '/login');
}

function openPartnersPage(): void {
  cy.visit('/partners');

  cy.location('pathname', { timeout: 15000 }).should('include', '/partners');

  cy.contains('button, [role="button"], a', /new partner|нов партньор/i, { timeout: 15000 }).should('be.visible');
}

function openNewPartnerModal(): void {
  cy.contains('button, [role="button"], a', /new partner|нов партньор/i, { timeout: 15000 })
    .should('be.visible')
    .click({ force: true });

  cy.contains(/new partner|нов партньор/i, { timeout: 15000 }).should('be.visible');
}

function createPartner(partner: TestPartner): void {
  openNewPartnerModal();

  fillPartnerName(partner.name);

  selectDropdownByLabel(/^type\s*\*?$|^тип\s*\*?$/i, /^service$/i, /^service$/i, 'Type');

  selectDropdownByLabel(
    /^services\s*\*?$|^услуги\s*\*?$/i,
    /^смяна на гуми$/i,
    /смяна на гуми/i,
    'Services'
  );

  selectDropdownByLabel(
    /^subscription plan\s*\*?$|^абонаментен план\s*\*?$/i,
    /automation subscription tier/i,
    /automation subscription/i,
    'Subscription plan'
  );

  fillAddress(partner.address);
  fillPhone(partner.phone);
  fillContactPerson(partner.contactPerson);
  fillDescription(partner.description);

  uploadLogoIfExists();

  saveMainPartnerModal();

  cy.location('pathname', { timeout: 20000 }).should((pathname) => {
    expect(pathname).to.match(/\/partners(\/details)?/);
  });
}

function validatePartnerVisibleInList(partner: TestPartner): void {
  openPartnersPage();

  cy.contains('body', partner.name, { timeout: 20000 }).should('be.visible');
  cy.contains('body', partner.contactPerson, { timeout: 20000 }).should('be.visible');
  cy.contains('body', /смяна на гуми/i, { timeout: 20000 }).should('be.visible');
}

function getPartnerRow(partnerName: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.contains('tr', partnerName, { timeout: 20000 }).then(($row) => {
    if (!$row.length) {
      throw new Error(`Could not find table row for partner: ${partnerName}`);
    }

    return cy.wrap($row);
  });
}

function openPartnerRowActions(partnerName: string): void {
  getPartnerRow(partnerName).then(($row) => {
    cy.wrap($row).scrollIntoView();

    const row = $row.get(0);
    const rowText = normalizeText(row.textContent ?? '');

    expect(rowText).to.include(partnerName);

    const actionCandidates = Cypress.$(row)
      .find('button, [role="button"], .ant-dropdown-trigger, span, div, svg')
      .filter((_index, element) => {
        const el = element as HTMLElement;
        const rect = el.getBoundingClientRect();
        const text = normalizeText(el.textContent ?? '');
        const metadata = `${el.getAttribute('aria-label') ?? ''} ${el.getAttribute('title') ?? ''} ${
          el.getAttribute('data-testid') ?? ''
        } ${String(el.className)}`;

        if (!isVisible(el)) return false;

        return (
          text === '...' ||
          text === '…' ||
          text === '⋯' ||
          text === '•••' ||
          /more|actions|menu|ellipsis|dropdown/i.test(metadata) ||
          el.tagName.toLowerCase() === 'svg'
        );
      })
      .toArray() as HTMLElement[];

    if (!actionCandidates.length) {
      throw new Error(`Could not find actions button inside row for partner: ${partnerName}`);
    }

    actionCandidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      return br.left - ar.left;
    });

    const action = actionCandidates[0];
    const clickable = action.closest('button, [role="button"], a, .ant-dropdown-trigger') ?? action;

    cy.wrap(Cypress.$(clickable)).click({ force: true });
  });

  cy.contains('button, [role="menuitem"], [role="button"], a, div, span', /^edit$|^change$|^промени$/i, {
    timeout: 10000
  }).should('be.visible');
}

function clickEditFromRowActions(): void {
  cy.contains('button, [role="menuitem"], [role="button"], a, div, span', /^edit$|^change$|^промени$/i, {
    timeout: 10000
  })
    .should('be.visible')
    .click({ force: true });

  cy.contains(/edit partner|update partner|change partner|промени партньор|редактирай партньор/i, {
    timeout: 15000
  }).should('be.visible');
}

function openEditPartnerModal(partnerName: string): void {
  openPartnersPage();
  cy.contains('body', partnerName, { timeout: 20000 }).should('be.visible');

  openPartnerRowActions(partnerName);
  clickEditFromRowActions();
}

function updatePartnerDescription(partner: TestPartner): void {
  openEditPartnerModal(partner.name);

  fillTextareaByLabel(/^description\s*\*?$|^описание\s*\*?$/i, partner.updatedDescription);

  saveMainPartnerModal();

  openEditPartnerModal(partner.name);

  assertTextareaByLabel(/^description\s*\*?$|^описание\s*\*?$/i, partner.updatedDescription);

  cancelMainPartnerModal();
}

describe('Partner lifecycle workflow', () => {
  it('creates a new Service partner and updates it successfully', () => {
    cy.viewport(1440, 900);

    const timestamp = Date.now();

    const partner: TestPartner = {
      name: `QA Partner ${timestamp}`,
      address: 'Sofia Bulgaria',
      phone: `88${String(timestamp).slice(-7)}`,
      contactPerson: `QA Contact ${String(timestamp).slice(-5)}`,
      description: `Automation create description ${timestamp}`,
      updatedDescription: `Automation updated description ${timestamp}`
    };

    login();

    openPartnersPage();

    createPartner(partner);

    validatePartnerVisibleInList(partner);

    updatePartnerDescription(partner);
  });
});