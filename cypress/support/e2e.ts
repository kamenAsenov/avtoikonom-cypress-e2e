import './commands';

Cypress.on('uncaught:exception', (error) => {
  // Keep this narrow. Do not hide real product defects by returning false for every exception.
  if (/ResizeObserver loop completed|ResizeObserver loop limit exceeded/i.test(error.message)) {
    return false;
  }

  return undefined;
});
