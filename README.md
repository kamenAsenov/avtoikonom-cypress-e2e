# Avtoikonom Admin Cypress E2E Tests

Cypress + TypeScript end-to-end automation project for the Avtoikonom Admin application.

The project covers a full Partner lifecycle workflow:
- login to the Admin application
- navigation to the Partners page
- creation of a new unique Service Partner
- validation that the created Partner is visible in the Partners list
- update of the created Partner description
- validation that the updated description is persisted after saving

## Tech Stack

- Cypress
- TypeScript
- Node.js
- GitHub Actions

## Covered Test Scenario

The main test is located here:

```text
cypress/e2e/partners/partner-lifecycle.cy.ts
```

The test performs the following business flow:

1. Opens the login page.
2. Logs in with test credentials.
3. Navigates to the Partners page.
4. Opens the New Partner modal.
5. Creates a unique Partner with:
   - Type: `Service`
   - Service: `Смяна на гуми`
   - Subscription plan: `Automation Subscription Tier`
   - Address: `Sofia Bulgaria`
   - Phone number
   - Contact person
   - Description
   - Logo upload, if the file fixture is available
6. Saves the Partner.
7. Validates that the created Partner is visible in the Partners list.
8. Opens the created Partner for editing.
9. Updates the Partner description.
10. Saves the update.
11. Reopens the Partner edit form.
12. Validates that the updated description is persisted.

## Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── e2e.yml
├── cypress/
│   ├── e2e/
│   │   └── partners/
│   │       └── partner-lifecycle.cy.ts
│   ├── fixtures/
│   │   └── qa-logo.png
│   └── support/
├── cypress.config.ts
├── cypress.env.example.json
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

## Installation

Install project dependencies:

```bash
npm install
```

For CI environments, use:

```bash
npm ci
```

## Environment Setup

Create a local Cypress environment file:

```bash
cp cypress.env.example.json cypress.env.json
```

On Windows PowerShell:

```powershell
Copy-Item cypress.env.example.json cypress.env.json
```

Then update `cypress.env.json` with the provided test credentials:

```json
{
  "email": "test_qa_ex@example.com",
  "password": "test_qa_ex@example.com"
}
```

`cypress.env.json` is intentionally ignored by Git and should not be committed.

## Running Tests

Open Cypress UI:

```bash
npm run cy:open
```

Run tests headlessly:

```bash
npm run cy:run
```

Alternative direct Cypress command:

```bash
npx cypress run
```

## Expected Result

A successful headless run should finish with:

```text
1 passing
0 failing
All specs passed
```

## Test Data Strategy

The Partner name, contact person, phone number and descriptions are generated with a timestamp.

This makes the test independent from already existing records and avoids relying on static test data.

Example:

```text
QA Partner 1783032515276
Automation create description 1783032515276
Automation updated description 1783032515276
```

## Validation Strategy

The test validates the workflow at several points:

- confirms successful login by checking that the URL is no longer `/login`
- confirms that the Partners page is loaded
- validates that the newly created Partner appears in the Partners list
- updates the Partner description
- reopens the Partner edit modal
- checks that the updated description is still present in the form

## Notes and Assumptions

- The address field uses a suggestions dropdown, so the test types `Sofia Bulgaria` and selects the first available suggestion.
- The exact address is not validated because the assignment does not require address validation.
- The test uses stable visible UI behavior instead of relying on backend access.
- The test updates the Partner that it created during the same run. This keeps the test isolated and avoids modifying existing seeded records.
- The logo upload is handled only if the expected fixture file exists in the project.

## CI/CD

The repository includes a GitHub Actions workflow that installs dependencies and runs the Cypress E2E test suite.

Workflow file:

```text
.github/workflows/e2e.yml
```

The workflow expects these GitHub repository secrets:

```text
CYPRESS_EMAIL
CYPRESS_PASSWORD
```

## Future Improvements

Possible next improvements:

- add API cleanup for generated test Partners
- add more granular assertions for Partner details
- add separate tests for negative validation scenarios
- add test reports and artifacts
- add cross-browser execution
