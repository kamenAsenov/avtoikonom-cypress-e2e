export const selectors = {
  login: {
    emailInput: [
      '[data-cy="email"]',
      '[data-testid="email"]',
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[autocomplete="username"]',
      '#email'
    ],
    passwordInput: [
      '[data-cy="password"]',
      '[data-testid="password"]',
      'input[type="password"]',
      'input[name="password"]',
      'input[autocomplete="current-password"]',
      '#password'
    ],
    submitButtonText: /sign in|log in|login|логин|вход|влез/i
  },
  routes: {
    dashboard: '/',
    requests: '/requests',
    users: '/users',
    vehicles: '/vehicles',
    partners: '/partners',
    drivers: '/drivers',
    services: '/services',
    reminders: '/reminders',
    promotions: '/promotions',
    trainings: '/trainings'
  },
  navigation: {
    partnersSectionText: /partners|партньори/i,
    partnersPageTitle: /partners|партньори/i
  },
  partners: {
    createButtonText: /new partner|create partner|add partner|нов партньор|създай партньор/i,
    editButtonText: /edit|update|редактирай|промени/i,
    deleteButtonText: /delete|remove|изтрий|изтриване/i,
    searchInput: [
      '[data-cy="partners-search"]',
      '[data-testid="partners-search"]',
      'input[type="search"]',
      'input[placeholder*="Търсене по партньори"]',
      'input[placeholder*="търсене по партньори"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="Търси"]',
      'input[name="search"]'
    ],
    rowActionButton: [
      '[data-cy="partner-row-actions"]',
      '[data-testid="partner-row-actions"]',
      '[data-testid="MoreHorizIcon"]',
      'svg[data-testid="MoreHorizIcon"]',
      'button:has(svg[data-testid="MoreHorizIcon"])'
    ]
  },
  partnerForm: {
    createModalTitleText: /new partner|нов партньор/i,
    editModalTitleText: /edit partner|update partner|промени партньор|редактирай партньор/i,
    modalTitleText: /new partner|нов партньор|edit partner|update partner|промени партньор|редактирай партньор/i,
    nameInput: [
      '[data-cy="partner-name"]',
      '[data-testid="partner-name"]',
      'input[name="name"]',
      'input[name="title"]',
      'input[name="companyName"]',
      'input[placeholder*="Write partner name"]',
      'input[placeholder*="Partner name"]',
      'input[placeholder*="partner name"]',
      'input[placeholder*="Напиши име на партньор"]',
      'input[placeholder*="име на партньор"]',
      'input[placeholder*="Name"]',
      'input[placeholder*="Име"]',
      'input[placeholder*="име"]',
      'input[placeholder*="Наименование"]'
    ],
    typeInput: [
      '[data-cy="partner-type"]',
      '[data-testid="partner-type"]',
      'select[name="type"]',
      '[name="type"]',
      'input[placeholder*="Select partner type"]',
      'input[placeholder*="partner type"]',
      'input[placeholder*="Избери тип на партньора"]',
      'input[placeholder*="тип на партньора"]',
      'input[placeholder*="Type"]',
      'input[placeholder*="Тип"]',
      'input[placeholder*="тип"]'
    ],
    servicesInput: [
      '[data-cy="partner-services"]',
      '[data-testid="partner-services"]',
      'select[name="services"]',
      '[name="services"]',
      'input[placeholder*="Select service types"]',
      'input[placeholder*="service types"]',
      'input[placeholder*="Select services"]',
      'input[placeholder*="Избери услуги"]',
      'input[placeholder*="услуги"]'
    ],
    subscriptionPlanInput: [
      '[data-cy="partner-subscription-plan"]',
      '[data-testid="partner-subscription-plan"]',
      'select[name="subscriptionPlan"]',
      '[name="subscriptionPlan"]',
      'input[placeholder*="Select subscription tier"]',
      'input[placeholder*="subscription tier"]',
      'input[placeholder*="Select subscription"]',
      'input[placeholder*="Избери абонаментен план"]',
      'input[placeholder*="абонаментен план"]'
    ],
    addressInput: [
      '[data-cy="partner-address"]',
      '[data-testid="partner-address"]',
      'input[name="address"]',
      'textarea[name="address"]',
      'input[placeholder*="Enter a location"]',
      'input[placeholder*="location"]',
      'input[placeholder*="Въведи локация"]',
      'input[placeholder*="локация"]',
      'input[placeholder*="Address"]',
      'textarea[placeholder*="Address"]',
      'input[placeholder*="Адрес"]',
      'input[placeholder*="адрес"]',
      'textarea[placeholder*="Адрес"]'
    ],
    emailInput: [
      '[data-cy="partner-email"]',
      '[data-testid="partner-email"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="Email"]',
      'input[placeholder*="Имейл"]'
    ],
    phoneInput: [
      '[data-cy="partner-phone"]',
      '[data-testid="partner-phone"]',
      'input[name="phone"]',
      'input[type="tel"]',
      'input[placeholder*="Phone"]',
      'input[placeholder*="Телефон"]',
      'input[placeholder*="телефон"]'
    ],
    contactPersonInput: [
      '[data-cy="partner-contact-person"]',
      '[data-testid="partner-contact-person"]',
      'input[name="contactPerson"]',
      'input[name="contactName"]',
      'input[placeholder*="Names of contact person"]',
      'input[placeholder*="contact person"]',
      'input[placeholder*="Имена на лицето за контакт"]',
      'input[placeholder*="лицето за контакт"]',
      'input[placeholder*="Contact"]',
      'input[placeholder*="Лице за контакт"]'
    ],
    notesInput: [
      '[data-cy="partner-notes"]',
      '[data-testid="partner-notes"]',
      'textarea[name="notes"]',
      'textarea[name="description"]',
      'textarea[placeholder*="Write description"]',
      'textarea[placeholder*="description"]',
      'textarea[placeholder*="Напиши описание"]',
      'textarea[placeholder*="описание"]',
      'textarea[placeholder*="Notes"]',
      'textarea[placeholder*="Бележки"]',
      'textarea[placeholder*="Описание"]'
    ],
    logoUploadInput: [
      '[data-cy="partner-logo"] input[type="file"]',
      '[data-testid="partner-logo"] input[type="file"]',
      'input[type="file"]'
    ],
    saveButtonText: /save|create|submit|запази|съхрани|създай/i,
    cancelButtonText: /cancel|отказ/i,
    serviceTypeOptionText: /^(service|сервиз)$/i,
    defaultServiceOptionText: /^шлайфане на глава$|шлайфане на глава|head grinding|grinding/i,
    subscriptionPlanOptionText: /automation subscription|subscription tier|automation subscription tier/i,
    triggerText: {
      type: /избери тип на партньора|сервиз|service/i,
      services: /избери услуги|шлайфане на глава/i,
      subscriptionPlan: /избери абонаментен план|automation subscription|subscription tier/i
    },
    labels: {
      name: /^име\s*\*?$|name/i,
      address: /^адрес\s*\*?$|address/i,
      type: /^тип\s*\*?$|type/i,
      services: /^услуги\s*\*?$|services/i,
      subscriptionPlan: /^абонаментен план\s*\*?$|subscription plan/i,
      email: /имейл|email|e-mail/i,
      phone: /^телефон\s*\*?$|phone/i,
      contactPerson: /лице за контакти|лице за контакт|contact person|contact name/i,
      notes: /описание|бележки|notes|description/i,
      logo: /^лого\s*\*?$|logo/i
    }
  }
};
