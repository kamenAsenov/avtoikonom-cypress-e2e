import type { PartnerData } from '../types/partner';
import { selectors } from './selectors';

function modal(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy
    .get('.ant-modal-content:visible, [role="dialog"]:visible', { timeout: 10000 })
    .last()
    .should('be.visible');
}

function fieldNextToLabel(labelPattern: RegExp, controlSelector: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return modal().then(($modal) => {
    const labels = $modal
      .find('label, div, span, p')
      .filter((_index, element) => {
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
        return text.length > 0 && text.length <= 80 && labelPattern.test(text);
      })
      .toArray() as HTMLElement[];

    if (!labels.length) {
      throw new Error(`Could not find label: ${labelPattern}`);
    }

    const label = labels[0];
    const labelRect = label.getBoundingClientRect();

    const candidates = $modal
      .find(controlSelector)
      .filter((_index, element) => {
        const el = element as HTMLElement;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        if (style.visibility === 'hidden' || style.display === 'none') return false;
        if (rect.width <= 0 || rect.height <= 0) return false;

        // The form layout is label on the left, field on the right.
        if (rect.left <= labelRect.left) return false;

        // Same row / very near the label vertically.
        if (Math.abs(rect.top - labelRect.top) > 90) return false;

        return true;
      })
      .toArray() as HTMLElement[];

    if (!candidates.length) {
      const debug = $modal
        .find('input, textarea, .ant-select-selector, [role="combobox"]')
        .toArray()
        .map((element) => {
          const el = element as HTMLElement;
          const input = el as HTMLInputElement;
          const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
          const placeholder = input.placeholder ?? '';
          const rect = el.getBoundingClientRect();

          return {
            tag: el.tagName,
            text,
            placeholder,
            className: el.className,
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        });

      // Open browser DevTools console if we need this.
      // eslint-disable-next-line no-console
      console.table(debug);

      throw new Error(`Could not find control next to label: ${labelPattern}`);
    }

    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      if (Math.abs(ar.top - br.top) > 10) return ar.top - br.top;
      return ar.left - br.left;
    });

    return cy.wrap(Cypress.$(candidates[0]));
  });
}

function fillText(labelPattern: RegExp, value: string): void {
  fieldNextToLabel(labelPattern, 'input:not([type="hidden"]):not([type="file"]), textarea')
    .click({ force: true })
    .clear({ force: true })
    .type(value, { force: true });
}

function clickDropdown(labelPattern: RegExp): void {
  fieldNextToLabel(labelPattern, '.ant-select-selector, [role="combobox"], input:not([type="hidden"])')
    .click({ force: true });
}

function selectVisibleOption(optionPattern: RegExp): void {
  cy.get('body', { timeout: 10000 }).then(($body) => {
    const options = $body
      .find('.ant-select-item-option-content, [role="option"], .ant-select-item, div, span')
      .filter((_index, element) => {
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
        const rect = (element as HTMLElement).getBoundingClientRect();
        const style = window.getComputedStyle(element as HTMLElement);

        return (
          text.length > 0 &&
          text.length <= 120 &&
          optionPattern.test(text) &&
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none'
        );
      })
      .toArray() as HTMLElement[];

    if (!options.length) {
      throw new Error(`Could not find dropdown option: ${optionPattern}`);
    }

    cy.wrap(Cypress.$(options[0])).click({ force: true });
  });
}

function selectDropdown(labelPattern: RegExp, optionPattern: RegExp): void {
  clickDropdown(labelPattern);
  selectVisibleOption(optionPattern);
}

export class PartnerFormPage {
  expectCreateFormVisible(): void {
    cy.contains(/new partner|нов партньор/i, { timeout: 10000 }).should('be.visible');
  }

  expectEditFormVisible(): void {
    cy.contains(/edit partner|update partner|промени партньор|редактирай партньор/i, { timeout: 10000 }).should('be.visible');
  }

  fillRequiredPartnerDetails(partner: PartnerData): void {
    this.expectCreateFormVisible();

    fillText(/^name\s*\*?$|^име\s*\*?$/i, partner.name);

    selectDropdown(/^type\s*\*?$|^тип\s*\*?$/i, /service|сервиз/i);

    selectDropdown(/^services\s*\*?$|^услуги\s*\*?$/i, /шлайфане на глава|head grinding|grinding/i);

    selectDropdown(/^subscription plan\s*\*?$|^абонаментен план\s*\*?$/i, /automation subscription|subscription tier/i);

    fillText(/^address\s*\*?$|^адрес\s*\*?$/i, partner.address);
    cy.focused().type('{downarrow}{enter}', { force: true });

    fillText(/^telephone\s*\*?$|^phone\s*\*?$|^телефон\s*\*?$/i, partner.phone);

    fillText(/^contact person\s*\*?$|лице за контакти|лице за контакт/i, partner.contactPerson);

    fillText(/^description\s*\*?$|^описание\s*\*?$/i, partner.notes);

    this.uploadLogoIfFileInputExists();
  }

  fillOptionalPartnerDetails(_partner: PartnerData): void {
    // The current Partner form does not expose an email field in the screenshots.
  }

  updatePartnerName(updatedName: string): void {
    this.expectEditFormVisible();

    fillText(/^name\s*\*?$|^име\s*\*?$/i, updatedName);
  }

  save(): void {
    cy.contains('button, [type="submit"], [role="button"]', selectors.partnerForm.saveButtonText, { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    cy.contains(selectors.partnerForm.modalTitleText, { timeout: 20000 }).should('not.exist');
  }

  private uploadLogoIfFileInputExists(): void {
    cy.get('body', { log: false }).then(($body) => {
      const fileInput = $body.find('.ant-modal-content input[type="file"], [role="dialog"] input[type="file"]').first();

      if (!fileInput.length) {
        Cypress.log({ name: 'optional-upload-missing', message: 'Logo file input was not found. Skipping logo upload.' });
        return;
      }

      cy.wrap(fileInput).selectFile('cypress/fixtures/qa-logo.png', { force: true });
    });
  }
}