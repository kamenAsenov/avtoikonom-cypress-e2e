import type { PartnerData } from '../types/partner';

interface PartnerDefaults {
  address: string;
  type: string;
  service: string;
  subscriptionPlan: string;
  phonePrefix: string;
  emailDomain: string;
}

function uniqueRunId(): string {
  return `${Date.now()}-${Cypress._.random(1000, 9999)}`;
}

export function buildPartnerData(defaults: PartnerDefaults): PartnerData {
  const id = uniqueRunId();

  return {
    name: `QA Partner ${id}`,
    updatedName: `QA Partner Updated ${id}`,
    address: defaults.address,
    type: defaults.type,
    service: defaults.service,
    subscriptionPlan: defaults.subscriptionPlan,
    email: `qa.partner.${id}@${defaults.emailDomain}`,
    phone: `${defaults.phonePrefix}${Cypress._.random(100, 999)}`,
    contactPerson: `QA Contact ${id}`,
    notes: `Created by Cypress E2E automation run ${id}`
  };
}
