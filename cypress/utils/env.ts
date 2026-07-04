export function getRequiredEnv(name: 'email' | 'password'): string {
  const value = Cypress.env(name) as string | undefined;

  if (!value) {
    throw new Error(
      `Missing Cypress env value: ${name}. Create cypress.env.json from cypress.env.example.json or pass CYPRESS_${name.toUpperCase()} in CI.`
    );
  }

  return value;
}
