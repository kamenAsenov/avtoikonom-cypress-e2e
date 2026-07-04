function formatSelectors(selectors: string[]): string {
  return selectors.map((selector) => `  - ${selector}`).join('\n');
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function isVisibleElement(element: HTMLElement): boolean {
  const $element = Cypress.$(element);
  const rect = element.getBoundingClientRect();

  return $element.is(':visible') && rect.width > 0 && rect.height > 0;
}

function safeFind($root: JQuery<HTMLElement>, selector: string): JQuery<HTMLElement> {
  try {
    return $root.find(selector);
  } catch (_error) {
    Cypress.log({ name: 'invalid-selector-skipped', message: selector });
    return Cypress.$();
  }
}

function getActiveFormRoot($body: JQuery<HTMLElement>): JQuery<HTMLElement> {
  const modalTitlePattern = /new partner|нов партньор|edit partner|update partner|промени партньор|редактирай партньор/i;
  const savePattern = /save|create|submit|запази|съхрани|създай/i;

  // The application uses Ant Design modals. Prefer the actual modal content first so that
  // background table headers such as NAME/ADDRESS/SERVICES cannot be selected by mistake.
  const modalSelectors = [
    '.ant-modal-content',
    '.ant-modal',
    '.ant-drawer-content',
    '[role="dialog"]',
    '[aria-modal="true"]',
    '.MuiDialog-paper',
    '.MuiDialog-root',
    '[class*="modal"]',
    '[class*="Modal"]',
    '[class*="dialog"]',
    '[class*="Dialog"]'
  ].join(', ');

  const semanticDialogs = $body
    .find(modalSelectors)
    .filter((_index, element) => {
      const text = normalizeText(element.textContent ?? '');
      const $element = Cypress.$(element);
      const hasControls = $element.find('input, textarea, select, [role="combobox"], [aria-expanded]').length > 0;

      return isVisibleElement(element as HTMLElement) && modalTitlePattern.test(text) && savePattern.test(text) && hasControls;
    })
    .toArray() as HTMLElement[];

  if (semanticDialogs.length) {
    semanticDialogs.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const areaA = ar.width * ar.height;
      const areaB = br.width * br.height;

      // Prefer the smaller concrete modal content over broad overlay wrappers.
      return areaA - areaB;
    });

    return Cypress.$(semanticDialogs[0]);
  }

  const $title = $body
    .find('h1, h2, h3, h4, div, span, p')
    .filter((_index, element) => {
      const text = normalizeText(element.textContent ?? '');
      return isVisibleElement(element as HTMLElement) && text.length > 0 && text.length <= 80 && modalTitlePattern.test(text);
    })
    .first();

  if (!$title.length) {
    return $body;
  }

  const explicitModalAncestor = $title.closest('.ant-modal-content, .ant-modal, .ant-drawer-content, [role="dialog"], [aria-modal="true"], form');

  if (explicitModalAncestor.length) {
    return explicitModalAncestor as JQuery<HTMLElement>;
  }

  const ancestors = $title.parents().toArray() as HTMLElement[];

  for (const ancestor of ancestors) {
    const $ancestor = Cypress.$(ancestor);
    const text = normalizeText(ancestor.textContent ?? '');
    const hasFormControls = $ancestor.find('input, textarea, select, [role="combobox"], [aria-haspopup="listbox"], [aria-expanded]').length > 0;
    const hasSaveButton = $ancestor
      .find('button, [role="button"], [type="submit"], a')
      .filter((_index, button) => savePattern.test(normalizeText(button.textContent ?? '')))
      .length > 0;

    if (isVisibleElement(ancestor) && hasFormControls && hasSaveButton && modalTitlePattern.test(text)) {
      return $ancestor;
    }
  }

  return $body;
}

function isLikelyFieldLabel(element: HTMLElement, labelText: RegExp): boolean {
  const text = normalizeText(element.textContent ?? '').replace(/\s*\*\s*$/, ' *');

  // Avoid matching large parent containers whose textContent contains the whole modal.
  return text.length > 0 && text.length <= 80 && labelText.test(text);
}

function getVisibleBySelectors($root: JQuery<HTMLElement>, selectors: string[]): JQuery<HTMLElement> {
  for (const selector of selectors) {
    const $candidate = safeFind($root, selector).filter((_index, element) => isVisibleElement(element as HTMLElement)).first();

    if ($candidate.length) {
      return $candidate;
    }
  }

  return Cypress.$();
}

function getLabel($root: JQuery<HTMLElement>, labelText: RegExp): JQuery<HTMLElement> {
  const labels = $root
    .find('label, span, div, p')
    .filter((_index, element) => isLikelyFieldLabel(element as HTMLElement, labelText))
    .toArray() as HTMLElement[];

  if (!labels.length) {
    return Cypress.$();
  }

  // Prefer labels with a visible required asterisk. This avoids matching table headers behind the modal,
  // for example NAME, ADDRESS, SERVICES in the background Partner grid.
  const requiredLabel = labels.find((label) => /\*/.test(normalizeText(label.textContent ?? '')));

  return Cypress.$(requiredLabel ?? labels[0]);
}

function findLinkedField($root: JQuery<HTMLElement>, $label: JQuery<HTMLElement>): JQuery<HTMLElement> {
  const labelFor = $label.attr('for');

  if (!labelFor) {
    return Cypress.$();
  }

  return $root
    .find(`[id="${labelFor.replace(/"/g, '\\"')}"]`)
    .filter((_index, element) => isVisibleElement(element as HTMLElement))
    .first();
}

function isSameOrChild(parent: HTMLElement, child: HTMLElement): boolean {
  return parent === child || parent.contains(child);
}

function textInputCandidatesInside($root: JQuery<HTMLElement>): JQuery<HTMLElement> {
  return $root
    .find('input:not([type="hidden"]):not([type="file"]):not([type="password"]), textarea, [contenteditable="true"], [role="textbox"]')
    .filter((_index, element) => isVisibleElement(element as HTMLElement));
}


function firstLikelyEditableTextField($root: JQuery<HTMLElement>): JQuery<HTMLElement> {
  const fields = textInputCandidatesInside($root)
    .filter((_index, element) => {
      const field = element as HTMLInputElement | HTMLTextAreaElement;
      const isDisabled = field.disabled || field.getAttribute('aria-disabled') === 'true';
      const isReadonly = field.readOnly || field.getAttribute('readonly') !== null;
      const text = normalizeText(field.textContent ?? '');

      if (field.tagName.toLowerCase() !== 'input' && field.tagName.toLowerCase() !== 'textarea' && field.getAttribute('contenteditable') !== 'true') {
        return false;
      }

      return !isDisabled && !isReadonly && text.length <= 120;
    })
    .toArray() as HTMLElement[];

  fields.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    if (Math.abs(ar.top - br.top) > 10) return ar.top - br.top;
    return ar.left - br.left;
  });

  return fields.length ? Cypress.$(fields[0]) : Cypress.$();
}

function dropdownCandidatesInside($root: JQuery<HTMLElement>): JQuery<HTMLElement> {
  return $root
    .find('select, [role="combobox"], [aria-haspopup="listbox"], [aria-expanded], button, [role="button"], input:not([type="hidden"]):not([type="file"])')
    .filter((_index, element) => isVisibleElement(element as HTMLElement));
}

function fieldCandidatesInside($root: JQuery<HTMLElement>, fieldKind: 'text' | 'dropdown' | 'any'): JQuery<HTMLElement> {
  if (fieldKind === 'text') {
    return textInputCandidatesInside($root);
  }

  if (fieldKind === 'dropdown') {
    return dropdownCandidatesInside($root);
  }

  return $root
    .find('input:not([type="hidden"]):not([type="file"]), textarea, select, [role="textbox"], [contenteditable="true"], [role="combobox"], [aria-haspopup="listbox"], [aria-expanded], button, [role="button"]')
    .filter((_index, element) => isVisibleElement(element as HTMLElement));
}

function scoreCandidate(label: HTMLElement, candidate: HTMLElement, fieldKind: 'text' | 'dropdown' | 'any'): number {
  const labelRect = label.getBoundingClientRect();
  const candidateRect = candidate.getBoundingClientRect();
  const tag = candidate.tagName.toLowerCase();
  const text = normalizeText(candidate.textContent ?? '');
  const placeholder = candidate.getAttribute('placeholder') ?? '';
  let score = 0;

  // Most forms in this app are two-column: label on the left, control on the right.
  if (candidateRect.left > labelRect.left) score += 40;
  if (Math.abs(candidateRect.top - labelRect.top) < 55) score += 45;
  if (Math.abs(candidateRect.top - labelRect.top) < 120) score += 20;
  if (candidateRect.width > 80) score += 10;
  if (tag === 'input' || tag === 'textarea' || tag === 'select') score += 25;
  if (fieldKind === 'dropdown' && (candidate.getAttribute('role') === 'combobox' || candidate.hasAttribute('aria-expanded'))) score += 30;
  if (placeholder.length > 0) score += 15;
  if (text.length > 0 && text.length <= 80) score += 8;

  // Avoid parent containers that accidentally look clickable but contain too much text.
  if (text.length > 160) score -= 50;

  return score;
}

function findFieldNearLabel(
  $root: JQuery<HTMLElement>,
  labelText: RegExp,
  fieldKind: 'text' | 'dropdown' | 'any'
): JQuery<HTMLElement> {
  const $label = getLabel($root, labelText);

  if (!$label.length) {
    return Cypress.$();
  }

  const $linkedField = findLinkedField($root, $label);

  if ($linkedField.length) {
    return $linkedField;
  }

  const labelElement = $label.get(0);
  const labelRect = labelElement.getBoundingClientRect();
  const containers = $label.parents().toArray().slice(0, 10) as HTMLElement[];
  const scored: Array<{ element: HTMLElement; score: number }> = [];

  for (const container of containers) {
    const $candidates = fieldCandidatesInside(Cypress.$(container), fieldKind).filter((_index, candidate) => {
      const candidateElement = candidate as HTMLElement;
      const candidateRect = candidateElement.getBoundingClientRect();

      if (isSameOrChild(candidateElement, labelElement)) return false;
      if (candidateRect.top < labelRect.top - 40) return false;
      if (Math.abs(candidateRect.top - labelRect.top) > 260) return false;

      return true;
    });

    $candidates.each((_index, candidate) => {
      scored.push({ element: candidate as HTMLElement, score: scoreCandidate(labelElement, candidate as HTMLElement, fieldKind) });
    });

    if (scored.length > 0) {
      break;
    }
  }

  if (!scored.length) {
    return Cypress.$();
  }

  scored.sort((a, b) => b.score - a.score);
  return Cypress.$(scored[0].element);
}

function findControlByVisibleText($root: JQuery<HTMLElement>, triggerText: RegExp): JQuery<HTMLElement> {
  return $root
    .find('button, [role="button"], [role="combobox"], [aria-haspopup="listbox"], [aria-expanded], div, span')
    .filter((_index, element) => {
      const text = normalizeText(element.textContent ?? '');

      return isVisibleElement(element as HTMLElement) && text.length > 0 && text.length <= 120 && triggerText.test(text);
    })
    .first();
}

function findBestVisibleOption($body: JQuery<HTMLElement>, optionText: RegExp): JQuery<HTMLElement> {
  const $strictOption = $body
    .find('[role="option"], [role="menuitem"], li, button, [role="button"], div, span')
    .filter((_index, element) => {
      const text = normalizeText(element.textContent ?? '');

      return isVisibleElement(element as HTMLElement) && text.length > 0 && text.length <= 160 && optionText.test(text);
    })
    .first();

  if ($strictOption.length) {
    return $strictOption;
  }

  return Cypress.$();
}

function wrapTextField($field: JQuery<HTMLElement>, value: string): void {
  const element = $field.get(0);

  cy.wrap($field).click({ force: true });

  if (element && (element.getAttribute('contenteditable') === 'true' || element.getAttribute('role') === 'textbox') && element.tagName.toLowerCase() !== 'input' && element.tagName.toLowerCase() !== 'textarea') {
    cy.wrap($field).type('{selectall}{backspace}', { force: true }).type(value, { force: true });
    return;
  }

  cy.wrap($field).clear({ force: true }).type(value, { force: true });
}

export function getFirstAvailable(selectors: string[], description: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('body', { log: false }).then(($body) => {
    const $root = getActiveFormRoot($body);
    const $rootCandidate = getVisibleBySelectors($root, selectors);
    const $candidate = $rootCandidate.length ? $rootCandidate : getVisibleBySelectors($body, selectors);

    if (!$candidate.length) {
      throw new Error(`Could not find ${description}. Tried selectors:\n${formatSelectors(selectors)}`);
    }

    return cy.wrap($candidate);
  });
}

export function getFirstAvailableOrByLabel(
  selectors: string[],
  labelText: RegExp,
  description: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('body', { log: false }).then(($body) => {
    const $root = getActiveFormRoot($body);
    const $candidate = getVisibleBySelectors($root, selectors);

    if ($candidate.length) {
      return cy.wrap($candidate);
    }

    const $field = findFieldNearLabel($root, labelText, 'any');

    if (!$field.length) {
      throw new Error(
        `Could not find ${description}. Tried selectors:\n${formatSelectors(selectors)}\nAnd label pattern: ${labelText}`
      );
    }

    return cy.wrap($field);
  });
}

export function getTextFieldBySelectorOrLabel(
  selectors: string[],
  labelText: RegExp,
  description: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('body', { log: false }).then(($body) => {
    const $root = getActiveFormRoot($body);
    const $candidate = getVisibleBySelectors($root, selectors);

    if ($candidate.length) {
      return cy.wrap($candidate);
    }

    let $field = findFieldNearLabel($root, labelText, 'text');

    if (!$field.length && /partner name|name input/i.test(description)) {
      $field = firstLikelyEditableTextField($root);
      if ($field.length) {
        Cypress.log({
          name: 'fallback-selector',
          message: `Using first editable text field inside the active modal for ${description}.`
        });
      }
    }

    if (!$field.length) {
      throw new Error(
        `Could not find ${description}. Tried selectors:\n${formatSelectors(selectors)}\nAnd label pattern: ${labelText}`
      );
    }

    return cy.wrap($field);
  });
}

export function fillIfAvailable(selectors: string[], value: string, description: string): void {
  cy.get('body', { log: false }).then(($body) => {
    const $candidate = getVisibleBySelectors($body, selectors);

    if (!$candidate.length) {
      Cypress.log({ name: 'optional-field-missing', message: `${description} was not found. Skipping optional field.` });
      return;
    }

    wrapTextField($candidate, value);
  });
}

export function fillIfAvailableOrByLabel(
  selectors: string[],
  labelText: RegExp,
  value: string,
  description: string
): void {
  cy.get('body', { log: false }).then(($body) => {
    const $root = getActiveFormRoot($body);
    const $candidate = getVisibleBySelectors($root, selectors);

    if ($candidate.length) {
      wrapTextField($candidate, value);
      return;
    }

    const $field = findFieldNearLabel($root, labelText, 'text');

    if (!$field.length) {
      Cypress.log({ name: 'optional-field-missing', message: `${description} was not found. Skipping optional field.` });
      return;
    }

    wrapTextField($field, value);
  });
}

export function selectDropdownOption(
  fieldSelectors: string[],
  labelText: RegExp,
  optionText: RegExp,
  description: string,
  triggerText?: RegExp
): void {
  cy.get('body', { log: false }).then(($body) => {
    const $root = getActiveFormRoot($body);
    let $field = getVisibleBySelectors($root, fieldSelectors);

    if (!$field.length && triggerText) {
      $field = findControlByVisibleText($root, triggerText);
    }

    if (!$field.length) {
      $field = findFieldNearLabel($root, labelText, 'dropdown');
    }

    if (!$field.length) {
      throw new Error(
        `Could not find ${description}. Tried selectors:\n${formatSelectors(fieldSelectors)}\nAnd label pattern: ${labelText}`
      );
    }

    const tagName = $field.prop('tagName').toLowerCase();

    if (tagName === 'select') {
      const matchingOption = $field
        .find('option')
        .filter((_index, option) => optionText.test(normalizeText(option.textContent ?? '')))
        .first();

      if (!matchingOption.length) {
        throw new Error(`Could not find option ${optionText} in ${description}.`);
      }

      cy.wrap($field).select(String(matchingOption.val() ?? matchingOption.text()), { force: true });
      return;
    }

    cy.wrap($field).click({ force: true });

    cy.get('body', { log: false }).then(($bodyAfterClick) => {
      const $option = findBestVisibleOption($bodyAfterClick, optionText);

      if ($option.length) {
        cy.wrap($option).click({ force: true });
        return;
      }

      // Fallback for custom selects that hide options from the DOM until keyboard navigation.
      cy.focused().type('{downarrow}{enter}', { force: true });
      Cypress.log({
        name: 'dropdown-fallback',
        message: `Could not find visible option ${optionText} for ${description}; used keyboard fallback.`
      });
    });
  });
}

export function getFirstTextInput(description: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy
    .get('input:visible')
    .not('[type="password"]')
    .first()
    .should('exist')
    .then(($field) => {
      Cypress.log({ name: 'fallback-selector', message: `Using first visible text input for ${description}.` });
      return $field;
    });
}

export function clickButtonByText(text: RegExp, description: string): void {
  cy.contains('button, a, [role="button"], [type="button"], [type="submit"]', text)
    .should('be.visible')
    .click({ force: true });

  Cypress.log({ name: 'click', message: description });
}
