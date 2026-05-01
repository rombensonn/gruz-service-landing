const test = require("node:test");
const assert = require("node:assert/strict");

const { buildLeadEmail, normalizeLead, validateLead } = require("../src/lead");

test("validateLead accepts a complete commercial vehicle repair request", () => {
  const lead = {
    name: "Андрей",
    phone: "+7 (914) 569-05-55",
    message: "Газель, люфтит задний мост, гул на скорости",
    personal_data_consent: "true"
  };

  const result = validateLead(lead);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test("validateLead rejects missing fields and short phone numbers", () => {
  const result = validateLead({
    name: "",
    phone: "123",
    message: "",
    personal_data_consent: ""
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.name, "Укажите имя");
  assert.equal(result.errors.phone, "Укажите телефон полностью");
  assert.equal(result.errors.message, "Опишите, что с машиной");
  assert.equal(result.errors.personal_data_consent, "Чтобы отправить заявку, необходимо дать согласие на обработку персональных данных");
});

test("normalizeLead trims text and keeps only meaningful phone characters", () => {
  const lead = normalizeLead({
    name: "  Ола  ",
    phone: " +7 (914) 569-05-55 доб. 123 ",
    message: "  Нужно посмотреть МКПП  ",
    personal_data_consent: "true",
    marketing_consent: "on",
    page_url: " https://example.ru/?utm_source=yandex ",
    form_id: " lead-form "
  });

  assert.equal(lead.name, "Ола");
  assert.equal(lead.phone, "+79145690555123");
  assert.equal(lead.message, "Нужно посмотреть МКПП");
  assert.equal(lead.personal_data_consent, true);
  assert.equal(lead.marketing_consent, true);
  assert.equal(lead.page_url, "https://example.ru/?utm_source=yandex");
  assert.equal(lead.form_id, "lead-form");
});

test("buildLeadEmail contains all submitted fields", () => {
  const email = buildLeadEmail({
    name: "Nik",
    phone: "+79145690555",
    message: "Hyundai HD, шумит редуктор",
    personal_data_consent: true,
    personal_data_consent_text_version: "pd-consent-v1-2026-05-01",
    privacy_policy_version: "privacy-v1-2026-05-01",
    marketing_consent: false
  });

  assert.equal(email.subject, "Новая заявка с сайта Груз-Сервис");
  assert.match(email.text, /Nik/);
  assert.match(email.text, /\+79145690555/);
  assert.match(email.text, /Hyundai HD, шумит редуктор/);
  assert.match(email.text, /pd-consent-v1-2026-05-01/);
  assert.match(email.text, /Рекламное согласие: нет/);
  assert.match(email.html, /Новая заявка с сайта/);
});

test("validateLead keeps marketing consent optional", () => {
  const result = validateLead({
    name: "Иван",
    phone: "+79145690555",
    message: "Нужно заменить сцепление",
    personal_data_consent: true,
    marketing_consent: false
  });

  assert.equal(result.valid, true);
  assert.equal(result.lead.marketing_consent, false);
  assert.equal(result.lead.marketing_consent_version, "");
});
